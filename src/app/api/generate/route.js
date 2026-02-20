import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Increase max duration for Vercel Pro; on Hobby this is capped at 10s but the batch limit below keeps us safe
export const maxDuration = 60;

export async function POST(request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    try {
        const body = await request.json();
        if (body.secret !== 'burungi-secure-gen') {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // How many articles to generate per call (keeps Vercel under timeout)
        const BATCH_LIMIT = body.limit || 10;

        const { data: departments } = await supabase.from('departments').select('*');
        const { data: categories } = await supabase.from('categories').select('*');
        const { data: tags } = await supabase.from('tags').select('*');
        const { data: locations } = await supabase.from('locations').select('*');
        const { data: products } = await supabase
            .from('products')
            .select('id, name, slug, ai_context, category_id, department_id')
            .not('slug', 'is', null);

        if (!products || products.length === 0) {
            return new Response(JSON.stringify({ success: true, count: 0, message: 'No products with slugs found. Set a slug on each product first.' }), { status: 200 });
        }

        // Fetch all existing article slugs once (avoids per-combo DB query)
        const { data: existingSlugs } = await supabase
            .from('seo_articles')
            .select('slug');
        const existingSet = new Set((existingSlugs || []).map(r => r.slug));

        let totalGenerated = 0;
        let remaining = 0;

        outer: for (const product of products) {
            const cat = categories.find(c => c.id === product.category_id);
            const dept = departments.find(d => d.id === (product.department_id || cat?.department_id));
            if (!cat || !dept) continue;

            const deptTags = tags.filter(t => t.department_id === dept.id);

            for (const tag of deptTags) {
                for (const loc of locations) {
                    const slug = `${dept.slug}---${cat.slug}---${product.slug}---${tag.slug}-in-${loc.slug}`;

                    if (existingSet.has(slug)) continue;

                    if (totalGenerated >= BATCH_LIMIT) {
                        remaining++;
                        continue;
                    }

                    const productContext = product.ai_context
                        ? `Product: ${product.name}. ${product.ai_context}`
                        : `Product: ${product.name}.`;

                    const prompt = `Write a 200-word SEO article in English for BurungiHealth, a Rwandan health product store. Topic: why "${product.name}" is the best solution for "${tag.name}" in ${loc.name}, Rwanda. Be specific about this product, persuasive, and mention fast WhatsApp delivery (+250 798 707 702). Product info:\n${productContext}\nJust plain paragraphs, no headings or bullet points.`;

                    const res = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0.7,
                    });

                    const text = res.choices[0]?.message?.content;
                    if (text) {
                        await supabase.from('seo_articles').insert({
                            slug,
                            content: text,
                            language: 'en',
                            is_approved: false
                        });
                        existingSet.add(slug);
                        totalGenerated++;
                    }
                }
            }
        }

        return new Response(JSON.stringify({ success: true, count: totalGenerated, remaining }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
