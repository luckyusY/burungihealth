import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const maxDuration = 60;

export async function POST(request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not set in environment variables. Go to Vercel → Settings → Environment Variables and add it.' }), { status: 500 });
        }
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return new Response(JSON.stringify({ error: 'Supabase environment variables are not set.' }), { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const body = await request.json();
        if (body.secret !== 'burungi-secure-gen') {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const BATCH_LIMIT = body.limit || 10;
        const filterProductId = body.productId || null;
        const filterTagIds = body.tagIds ? new Set(body.tagIds.map(String)) : null;

        const { data: departments } = await supabase.from('departments').select('*');
        const { data: categories } = await supabase.from('categories').select('*');
        const { data: tags } = await supabase.from('tags').select('*');
        const { data: locations } = await supabase.from('locations').select('*');

        let productQuery = supabase
            .from('products')
            .select('id, name, slug, ai_context, category_id, department_id')
            .not('slug', 'is', null);
        if (filterProductId) {
            productQuery = productQuery.eq('id', filterProductId);
        }
        const { data: products } = await productQuery;

        if (!products || products.length === 0) {
            return new Response(JSON.stringify({ success: true, count: 0, remaining: 0, message: 'No products with slugs found. Set a slug on each product first.' }), { status: 200 });
        }

        // Fetch all existing slugs once
        const { data: existingSlugs } = await supabase.from('seo_articles').select('slug');
        const existingSet = new Set((existingSlugs || []).map(r => r.slug));

        let totalGenerated = 0;
        let remaining = 0;

        for (const product of products) {
            const cat = categories.find(c => c.id === product.category_id);
            const dept = departments.find(d => d.id === (product.department_id || cat?.department_id));
            if (!cat || !dept) continue;

            const deptTags = tags.filter(t => {
                if (t.department_id !== dept.id) return false;
                if (filterTagIds && !filterTagIds.has(String(t.id))) return false;
                return true;
            });

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

                    const prompt = `Write a unique 200-word SEO article in English for BurungiHealth, a Rwandan health product store.\n\nTopic: why "${product.name}" is the best solution for "${tag.name}" in ${loc.name}, Rwanda.\n\nRequirements:\n- Be specific about this product and its benefits for ${tag.name}\n- Use a fresh, unique angle different from generic articles\n- Vary your opening sentence — do not start with the product name\n- Mention fast, discreet WhatsApp delivery (+250 798 707 702)\n- Persuasive and trustworthy tone\n- Plain paragraphs only, no headings or bullet points\n\nProduct info:\n${productContext}`;

                    const res = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0.85,
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
        const msg = error?.message || String(error) || 'Unknown server error';
        return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }
}
