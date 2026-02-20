import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Ensure secrets are loaded from local environment
import { config } from "dotenv";
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseAnonKey || !openaiApiKey) {
    console.error("Missing environment variables. Please check .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

async function generateWithOpenAI(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a professional medical copywriter for BurungiHealth in Rwanda." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        const text = response.choices[0]?.message?.content;
        return text ? text.trim() : null;
    } catch (error) {
        console.error("OpenAI API Error:", error.message);
        return null;
    }
}

async function main() {
    console.log("Starting BurungiHealth AI Content Generator (OPENAI EDITION)...");

    // 1. Fetch dimension tables
    const { data: departments } = await supabase.from('departments').select('*');
    const { data: categories } = await supabase.from('categories').select('*');
    const { data: tags } = await supabase.from('tags').select('*');
    const { data: locations } = await supabase.from('locations').select('*');

    if (!departments || !categories || !tags || !locations) {
        console.error("Failed to fetch dimensions from Supabase.");
        return;
    }

    console.log(`Found ${departments.length} departments, ${categories.length} categories, ${tags.length} tags, and ${locations.length} locations.`);

    let totalGenerated = 0;

    // 2. Loop through every permutation
    for (const dept of departments) {
        for (const cat of categories) {
            if (cat.department_id !== dept.id) continue;

            for (const tag of tags) {
                for (const loc of locations) {
                    const slug = `${dept.slug}---${cat.slug}---${tag.slug}-in-${loc.slug}`;

                    // Check if already exists
                    const { data: existing } = await supabase
                        .from('seo_articles')
                        .select('slug')
                        .eq('slug', slug)
                        .single();

                    if (existing) {
                        console.log(`[SKIPPING] Article already exists for: ${slug}`);
                        continue;
                    }

                    console.log(`[GENERATING] Writing Kinyarwanda SEO article with OpenAI for: ${slug}...`);

                    const prompt = `Write a 150-word SEO optimized paragraph in native Kinyarwanda about why a ${cat.name} from the ${dept.name} department is the absolute best and safest solution for someone experiencing "${tag.name}" in ${loc.name}. 
Make it sound persuasive, trustworthy, and medically reassuring. 
Ensure excellent Kinyarwanda grammar.
Do not use markdown formatting. Do not include a title. Just return the raw text paragraph.`;

                    const aiText = await generateWithOpenAI(prompt);

                    if (aiText) {
                        const { error } = await supabase
                            .from('seo_articles')
                            .insert({
                                slug: slug,
                                content: aiText
                            });

                        if (error) {
                            console.error(`Failed to save to database for ${slug}:`, error.message);
                        } else {
                            console.log(`[SUCCESS] Saved article for: ${slug}`);
                            totalGenerated++;
                        }
                    } else {
                        console.error(`OpenAI failed to generate text for ${slug}.`);
                    }

                    // Throttle slightly (though OpenAI limits are much higher than Gemini free)
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
    }

    console.log(`\n🎉 Content Generation Complete! Successfully wrote ${totalGenerated} completely unique articles.`);
}

main().catch(console.error);
