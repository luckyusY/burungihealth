import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const maxDuration = 60;

const STORY_OPENINGS = [
    "Start with a moment of frustration from daily life before naming the problem.",
    "Open with a direct question someone in this location might ask a friend.",
    "Begin with a short myth-versus-reality line about the condition.",
    "Start with a mini scene of relief after finding the right solution.",
    "Open with a practical observation from pharmacists and repeat buyers.",
    "Start with one bold sentence about confidence and relationships.",
];

const STORY_NARRATORS = [
    "second person guidance",
    "trusted advisor voice",
    "first person testimonial voice",
    "community recommendation tone",
];

const STORY_RHYTHMS = [
    "short punchy sentences, then one reflective long sentence",
    "balanced medium-length conversational sentences",
    "storytelling first half, practical actionable second half",
    "educational first, emotionally reassuring finish",
];

const STORY_CTA_STYLES = [
    "confident and urgent",
    "warm and reassuring",
    "clear and practical",
    "social-proof driven",
];

function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function pick(list, seed, offset = 0) {
    const mixed = (seed + Math.imul(offset + 1, 2654435761)) >>> 0;
    return list[mixed % list.length];
}

function buildStoryProfile(slug, attempt) {
    const seed = hashString(`${slug}:${attempt}`);
    const wordCount = 190 + (seed % 61); // 190-250 words
    const temperature = Number((0.82 + ((seed % 21) / 100)).toFixed(2)); // 0.82-1.02

    return {
        signature: `story-${seed.toString(36).slice(-7)}`,
        wordCount,
        temperature,
        opening: pick(STORY_OPENINGS, seed, 1),
        narrator: pick(STORY_NARRATORS, seed, 2),
        rhythm: pick(STORY_RHYTHMS, seed, 3),
        ctaStyle: pick(STORY_CTA_STYLES, seed, 4),
    };
}

function normalizeText(text) {
    return (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function toShingleSet(text, size = 3) {
    const words = normalizeText(text).split(" ").filter(Boolean);
    const set = new Set();

    if (words.length <= size) {
        if (words.length) set.add(words.join(" "));
        return set;
    }

    for (let i = 0; i <= words.length - size; i++) {
        set.add(words.slice(i, i + size).join(" "));
    }

    return set;
}

function jaccardSimilarity(a, b) {
    if (!a.size || !b.size) return 0;

    let intersection = 0;
    for (const value of a) {
        if (b.has(value)) intersection++;
    }

    const union = a.size + b.size - intersection;
    return union > 0 ? intersection / union : 0;
}

function openingFingerprint(text) {
    const clean = normalizeText(text);
    if (!clean) return "";
    return clean.split(" ").slice(0, 14).join(" ");
}

function createStoryBank(contents) {
    const fingerprints = [];
    const openings = new Set();
    const openingHints = [];

    for (const content of contents || []) {
        if (!content) continue;
        fingerprints.push(toShingleSet(content, 3));

        const opening = openingFingerprint(content);
        if (opening) {
            openings.add(opening);
            if (openingHints.length < 5) {
                openingHints.push(opening);
            }
        }
    }

    return { fingerprints, openings, openingHints };
}

function maxSimilarity(candidateSet, fingerprintBank) {
    let max = 0;
    for (const existingSet of fingerprintBank) {
        const score = jaccardSimilarity(candidateSet, existingSet);
        if (score > max) max = score;
    }
    return max;
}

export async function POST(request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not set in environment variables." }), { status: 500 });
        }
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return new Response(JSON.stringify({ error: "Supabase environment variables are not set." }), { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const body = await request.json();
        if (body.secret !== "burungi-secure-gen") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const BATCH_LIMIT = body.limit || 3;
        const filterProductId = body.productId || null;
        const filterTagIds = body.tagIds ? new Set(body.tagIds.map(String)) : null;
        const filterLocationIds = body.locationIds ? new Set(body.locationIds.map(String)) : null;

        const { data: departments } = await supabase.from("departments").select("*");
        const { data: categories } = await supabase.from("categories").select("*");
        const { data: tags } = await supabase.from("tags").select("*");
        const { data: locations } = await supabase.from("locations").select("*");

        let productQuery = supabase
            .from("products")
            .select("id, name, slug, ai_context, category_id, department_id")
            .not("slug", "is", null);

        if (filterProductId) {
            productQuery = productQuery.eq("id", filterProductId);
        }

        const { data: products } = await productQuery;

        if (!products || products.length === 0) {
            return new Response(
                JSON.stringify({ success: true, count: 0, remaining: 0, message: "No products with slugs found. Set a slug on each product first." }),
                { status: 200 }
            );
        }

        const { data: existingSlugs } = await supabase.from("seo_articles").select("slug");
        const existingSet = new Set((existingSlugs || []).map((row) => row.slug));

        let totalGenerated = 0;
        let remaining = 0;

        for (const product of products) {
            const cat = categories.find((c) => c.id === product.category_id);
            const dept = departments.find((d) => d.id === (product.department_id || cat?.department_id));
            if (!cat || !dept) continue;

            const { data: productArticles } = await supabase
                .from("seo_articles")
                .select("content")
                .ilike("slug", `%---${product.slug}---%`)
                .limit(40);

            const storyBank = createStoryBank((productArticles || []).map((row) => row.content));

            const deptTags = tags.filter((tag) => {
                if (String(tag.department_id) !== String(dept.id)) return false;
                if (filterTagIds && !filterTagIds.has(String(tag.id))) return false;
                return true;
            });

            for (const tag of deptTags) {
                for (const loc of locations) {
                    if (filterLocationIds && !filterLocationIds.has(String(loc.id))) continue;

                    const slug = `${dept.slug}---${cat.slug}---${product.slug}---${tag.slug}-in-${loc.slug}`;
                    if (existingSet.has(slug)) continue;

                    if (totalGenerated >= BATCH_LIMIT) {
                        remaining++;
                        continue;
                    }

                    let generatedText = "";
                    let generatedFingerprint = null;
                    let generatedOpening = "";

                    for (let attempt = 0; attempt < 3; attempt++) {
                        const profile = buildStoryProfile(slug, attempt);
                        const blockedOpenings = storyBank.openingHints.length
                            ? storyBank.openingHints.map((hint, idx) => `${idx + 1}. ${hint}`).join("\n")
                            : "None yet.";

                        const productContext = product.ai_context
                            ? `Product: ${product.name}. ${product.ai_context}`
                            : `Product: ${product.name}.`;

                        const prompt = `Write a ${profile.wordCount}-word SEO article for BurungiHealth, a Rwandan health product store. Plain paragraphs only: no headings, no bullet points, no markdown.\n\nProduct: ${product.name}\nKeyword/problem: \"${tag.name}\"\nLocation: ${loc.name}, Rwanda\nStory signature: ${profile.signature}\nOpening style: ${profile.opening}\nNarrator: ${profile.narrator}\nSentence rhythm: ${profile.rhythm}\nCTA style: ${profile.ctaStyle}\n\nAvoid reusing these opening fingerprints from previous stories:\n${blockedOpenings}\n\nStrict rules:\n- Do not start the article with the product name\n- Mention fast, discreet WhatsApp delivery (+250 798 707 702) once\n- Keep this story structurally and stylistically distinct from previous stories for this product\n- Include concrete local context for ${loc.name}, not generic filler\n- Keep claims responsible and avoid exaggerated medical promises\n\nProduct details:\n${productContext}`;

                        const response = await openai.chat.completions.create({
                            model: "gpt-4o-mini",
                            messages: [
                                { role: "system", content: "You write high-converting SEO stories that are clearly distinct from each other." },
                                { role: "user", content: prompt },
                            ],
                            temperature: profile.temperature,
                        });

                        const candidate = response.choices[0]?.message?.content?.trim();
                        if (!candidate) continue;

                        const candidateFingerprint = toShingleSet(candidate, 3);
                        const candidateOpening = openingFingerprint(candidate);

                        const similarity = maxSimilarity(candidateFingerprint, storyBank.fingerprints);
                        const openingDuplicate = candidateOpening && storyBank.openings.has(candidateOpening);

                        if ((similarity >= 0.58 || openingDuplicate) && attempt < 2) {
                            continue;
                        }

                        if (similarity >= 0.62 || openingDuplicate) {
                            generatedText = "";
                            break;
                        }

                        generatedText = candidate;
                        generatedFingerprint = candidateFingerprint;
                        generatedOpening = candidateOpening;
                        break;
                    }

                    if (!generatedText) {
                        remaining++;
                        continue;
                    }

                    const { error: insertError } = await supabase.from("seo_articles").insert({
                        slug,
                        content: generatedText,
                        language: "en",
                        is_approved: false,
                    });

                    if (insertError) {
                        remaining++;
                        continue;
                    }

                    existingSet.add(slug);
                    totalGenerated++;
                    if (generatedFingerprint) {
                        storyBank.fingerprints.push(generatedFingerprint);
                    }
                    if (generatedOpening) {
                        storyBank.openings.add(generatedOpening);
                        if (storyBank.openingHints.length < 5) {
                            storyBank.openingHints.push(generatedOpening);
                        }
                    }
                }
            }
        }

        return new Response(JSON.stringify({ success: true, count: totalGenerated, remaining }), { status: 200 });
    } catch (error) {
        const msg = error?.message || String(error) || "Unknown server error";
        return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }
}
