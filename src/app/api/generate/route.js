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
                        const baseSlug = `${dept.slug}---${cat.slug}---${tag.slug}-in-${loc.slug}`;
                        const enSlug = `en---${baseSlug}`;

                        // Fetch products for context once per combination
                        const { data: catProducts } = await supabase
                            .from('products')
                            .select('name, ai_context')
                            .eq('category_id', cat.id);

                        const productContext = catProducts && catProducts.length > 0
                            ? catProducts.map(p => `- ${p.name}: ${p.ai_context || ''}`).join('\n')
                            : 'General healthcare context.';

                        // ── Kinyarwanda Article ──────────────────────────────
                        const { data: existingRw } = await supabase
                            .from('seo_articles')
                            .select('slug')
                            .eq('slug', baseSlug)
                            .single();

                        if (!existingRw) {
                            const rwPrompt = `Write a 150-word SEO optimized paragraph in native Kinyarwanda about why a ${cat.name} from the ${dept.name} department is the absolute best and safest solution for someone experiencing "${tag.name}" in ${loc.name}. Product Context:\n${productContext}\nJust raw text, no headings.`;

                            const rwRes = await openai.chat.completions.create({
                                model: "gpt-4o-mini",
                                messages: [{ role: "user", content: rwPrompt }],
                                temperature: 0.7,
                            });

                            const rwText = rwRes.choices[0]?.message?.content;
                            if (rwText) {
                                await supabase.from('seo_articles').insert({
                                    slug: baseSlug,
                                    content: rwText,
                                    is_approved: false
                                });
                                totalGenerated++;
                            }
                        }

                        // ── English Article ──────────────────────────────────
                        const { data: existingEn } = await supabase
                            .from('seo_articles')
                            .select('slug')
                            .eq('slug', enSlug)
                            .single();

                        if (!existingEn) {
                            const enPrompt = `Write a 150-word SEO optimized paragraph in English about why a ${cat.name} from the ${dept.name} health category is the best and safest solution for someone experiencing "${tag.name}" in ${loc.name}, Rwanda. Be specific and persuasive. Product Context:\n${productContext}\nJust raw text, no headings.`;

                            const enRes = await openai.chat.completions.create({
                                model: "gpt-4o-mini",
                                messages: [{ role: "user", content: enPrompt }],
                                temperature: 0.7,
                            });

                            const enText = enRes.choices[0]?.message?.content;
                            if (enText) {
                                await supabase.from('seo_articles').insert({
                                    slug: enSlug,
                                    content: enText,
                                    is_approved: false
                                });
                                totalGenerated++;
                            }
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
