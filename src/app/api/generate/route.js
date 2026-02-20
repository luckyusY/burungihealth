import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export async function POST(request) {
    // Instantiate clients inside the handler so env vars are read at runtime, not build time
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    try {
        const { secret } = await request.json();
        if (secret !== 'burungi-secure-gen') {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { data: departments } = await supabase.from('departments').select('*');
        const { data: categories } = await supabase.from('categories').select('*');
        const { data: tags } = await supabase.from('tags').select('*');
        const { data: locations } = await supabase.from('locations').select('*');

        let totalGenerated = 0;

        for (const dept of departments) {
            const deptTags = tags.filter(t => t.department_id === dept.id);
            for (const cat of categories) {
                if (cat.department_id !== dept.id) continue;
                for (const tag of deptTags) {
                    for (const loc of locations) {
                        const slug = `${dept.slug}---${cat.slug}---${tag.slug}-in-${loc.slug}`;

                        // Skip if already exists
                        const { data: existing } = await supabase
                            .from('seo_articles')
                            .select('slug')
                            .eq('slug', slug)
                            .single();

                        if (existing) continue;

                        // Fetch products for context
                        const { data: catProducts } = await supabase
                            .from('products')
                            .select('name, ai_context')
                            .eq('category_id', cat.id);

                        const productContext = catProducts && catProducts.length > 0
                            ? catProducts.map(p => `- ${p.name}: ${p.ai_context || ''}`).join('\n')
                            : 'General healthcare context.';

                        const prompt = `Write a 200-word SEO article in English for BurungiHealth, a Rwandan health product store. Topic: the best ${cat.name} solution for "${tag.name}" in ${loc.name}, Rwanda. Be specific, persuasive, and mention fast WhatsApp delivery. Product context:\n${productContext}\nJust plain paragraphs, no headings or bullet points.`;

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
                            totalGenerated++;
                        }
                    }
                }
            }
        }

        return new Response(JSON.stringify({ success: true, count: totalGenerated }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
