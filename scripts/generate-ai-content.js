import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Ensure secrets are loaded from local environment
import { config } from "dotenv";
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
    console.error("Missing environment variables. Please check .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generateWithGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
}

async function main() {
    console.log("Starting BurungiHealth AI Content Generator...");

    // 1. Fetch all possible combinations directly from Supabase
    const { data: departments } = await supabase.from('departments').select('*');
    const { data: categories } = await supabase.from('categories').select('*');
    const { data: tags } = await supabase.from('tags').select('*');
    const { data: locations } = await supabase.from('locations').select('*');

    console.log(`Found ${departments.length} departments, ${categories.length} categories, ${tags.length} tags, and ${locations.length} locations.`);

    let totalGenerated = 0;

    // 2. Loop through every single permutation to build our SEO pages
    for (const dept of departments) {
        for (const cat of categories) {
            // Only match categories that belong to this department
            if (cat.department_id !== dept.id) continue;

            for (const tag of tags) {
                for (const loc of locations) {

                    const slug = `${dept.slug}-${cat.slug}-${tag.slug}-in-${loc.slug}`;

                    // Check if we already generated an article for this slug
                    const { data: existing } = await supabase
                        .from('seo_articles')
                        .select('slug')
                        .eq('slug', slug)
                        .single();

                    if (existing) {
                        console.log(`[SKIPPING] Article already exists for: ${slug}`);
                        continue;
                    }

                    console.log(`[GENERATING] Writing Kinyarwanda SEO article for: ${slug}...`);

                    const prompt = `You are a professional medical copywriter for BurungiHealth in Rwanda. 
Write a 150-word SEO optimized paragraph in native Kinyarwanda about why a ${cat.name} from the ${dept.name} department is the absolute best and safest solution for someone experiencing "${tag.name}" in ${loc.name}. 
Make it sound persuasive, trustworthy, and medically reassuring. 
Ensure excellent Kinyarwanda grammar.
Do not use markdown formatting. Do not include a title. Just return the raw text paragraph.`;

                    const aiText = await generateWithGemini(prompt);

                    if (aiText) {
                        // Save exactly into the database
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
                        console.error(`Gemini failed to generate text for ${slug}.`);
                    }

                    // Throttle to respect API limits (15 RPM -> 4 seconds)
                    await new Promise(r => setTimeout(r, 4000));
                }
            }
        }
    }

    console.log(`\n🎉 Content Generation Complete! Successfully wrote ${totalGenerated} completely unique articles.`);
}

main().catch(console.error);
