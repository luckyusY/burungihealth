import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const maxDuration = 60;
const SAFE_RUNTIME_MS = Number(process.env.GENERATE_SAFE_RUNTIME_MS || 9000);
const MAX_ATTEMPTS_PER_STORY = 2;

const STORY_OPENINGS = [
    "Start with a real-life frustration moment before naming the problem.",
    "Open with a direct question someone in this location would ask a close friend.",
    "Begin with a brief myth-versus-reality line.",
    "Start with a small turning-point moment that feels personal.",
    "Open with a practical observation from repeat buyers.",
    "Start with one emotionally honest sentence about confidence.",
];

const STORY_NARRATORS = [
    "second-person supportive coach",
    "trusted local advisor",
    "first-person lived-experience voice",
    "friend-to-friend recommendation voice",
    "pharmacy-counter conversational voice",
];

const STORY_RHYTHMS = [
    "mix short punchy lines with a few long reflective lines",
    "mostly medium conversational lines with one short emphasis line per paragraph",
    "story-driven first half, practical second half",
    "explain first, reassure second, close with clear action",
];

const STORY_CTA_STYLES = [
    "gentle and reassuring",
    "clear and practical",
    "confident with social proof",
    "direct but respectful",
];

const STORY_SCENES = [
    "morning routine stress before work",
    "quiet evening conversation with a partner",
    "weekend plans affected by low confidence",
    "a busy day in town with constant self-doubt",
    "private concern discussed over a call with a friend",
];

const STORY_PROOF_STYLES = [
    "mention practical buying behavior and repeat orders",
    "mention what users notice after consistent use",
    "mention a realistic timeline and daily discipline",
    "mention why common quick fixes often fail",
    "mention the value of discreet delivery and support",
];

const STORY_CLOSINGS = [
    "close with calm confidence and next step",
    "close with practical ordering instructions",
    "close by reducing hesitation and offering support",
    "close with one line about privacy and speed",
];

const BANNED_FILLER_PHRASES = [
    "in today's fast paced world",
    "it is important to note that",
    "without further ado",
    "as we all know",
    "unlock your full potential",
    "game changer",
    "revolutionary solution",
];

const CONTEXT_KEYWORDS = {
    sexual: [
        "sexual",
        "sex",
        "bed",
        "libido",
        "erectile",
        "ejaculation",
        "performance",
        "stamina",
        "intimacy",
        "penis",
        "mens health",
        "male enhancement",
        "kurangiza",
        "ubushake",
        "igitsina",
        "imyororokere",
    ],
    sports: [
        "whey",
        "protein",
        "muscle",
        "gym",
        "workout",
        "strength",
        "endurance",
        "recovery",
        "fitness",
        "sports",
    ],
    skinBeauty: [
        "skin",
        "acne",
        "glow",
        "beauty",
        "cream",
        "lotion",
        "dark spots",
        "wrinkle",
        "hair",
        "scalp",
    ],
    womens: [
        "women",
        "female",
        "fertility",
        "menstrual",
        "ovulation",
        "hormonal",
        "vaginal",
        "pregnancy",
        "pms",
    ],
    weight: [
        "weight",
        "fat",
        "slim",
        "metabolism",
        "appetite",
        "obesity",
        "body mass",
    ],
    energy: [
        "energy",
        "immunity",
        "vitamin",
        "fatigue",
        "focus",
        "stress",
        "sleep",
        "wellness",
        "daily health",
    ],
};

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
    const wordCount = 185 + (seed % 71); // 185-255 words
    const temperature = Number((0.84 + ((seed % 19) / 100)).toFixed(2)); // 0.84-1.02

    return {
        signature: `story-${seed.toString(36).slice(-7)}`,
        wordCount,
        temperature,
        opening: pick(STORY_OPENINGS, seed, 1),
        narrator: pick(STORY_NARRATORS, seed, 2),
        rhythm: pick(STORY_RHYTHMS, seed, 3),
        ctaStyle: pick(STORY_CTA_STYLES, seed, 4),
        scene: pick(STORY_SCENES, seed, 5),
        proofStyle: pick(STORY_PROOF_STYLES, seed, 6),
        closing: pick(STORY_CLOSINGS, seed, 7),
    };
}

function normalizeText(text) {
    return (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenize(text) {
    return normalizeText(text).split(" ").filter(Boolean);
}

function toShingleSet(text, size = 3) {
    const words = tokenize(text);
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

function maxSimilarity(candidateSet, fingerprintBank) {
    let max = 0;
    for (const existingSet of fingerprintBank) {
        const score = jaccardSimilarity(candidateSet, existingSet);
        if (score > max) max = score;
    }
    return max;
}

function openingFingerprint(text) {
    const words = tokenize(text);
    return words.slice(0, 14).join(" ");
}

function endingFingerprint(text) {
    const words = tokenize(text);
    return words.slice(Math.max(0, words.length - 14)).join(" ");
}

function extractRepeatedPhrases(contents, phraseSize = 3, minCount = 2, limit = 8) {
    const counts = new Map();

    for (const content of contents || []) {
        const words = tokenize(content);
        if (words.length < phraseSize) continue;

        const seenInDoc = new Set();
        for (let i = 0; i <= words.length - phraseSize; i++) {
            const phrase = words.slice(i, i + phraseSize).join(" ");
            if (seenInDoc.has(phrase)) continue;
            seenInDoc.add(phrase);
            counts.set(phrase, (counts.get(phrase) || 0) + 1);
        }
    }

    return [...counts.entries()]
        .filter(([, count]) => count >= minCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([phrase]) => phrase);
}

function splitSentences(text) {
    return (text || "")
        .split(/(?<=[.!?])\s+/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function countMatches(text, regex) {
    return (text.match(regex) || []).length;
}

function containsPhrase(normalizedText, phrase) {
    const normalizedPhrase = normalizeText(phrase);
    if (!normalizedPhrase) return false;
    return normalizedText.includes(normalizedPhrase);
}

function evaluateHumanQuality({ text, tagName, locationName, productName }) {
    const normalized = normalizeText(text);
    const words = tokenize(text);
    const sentences = splitSentences(text);
    const sentenceLengths = sentences
        .map((sentence) => tokenize(sentence).length)
        .filter(Boolean);

    const uniqueRatio = words.length ? new Set(words).size / words.length : 0;

    const fillerFound = BANNED_FILLER_PHRASES.find((phrase) => normalized.includes(phrase));
    const whatsappCount = countMatches(text.toLowerCase(), /whatsapp/g);
    // Phone check: just look for the core digits loosely (AI formats vary)
    const phoneCount = countMatches(text.replace(/[\s\-()]/g, ""), /250798707702/g);

    // First significant word of each name for robust matching (handles plurals, paraphrasing)
    const productFirstWord = tokenize(productName)[0] || "";
    const tagFirstWord = tokenize(tagName)[0] || "";
    const locationFirstWord = tokenize(locationName)[0] || "";

    // Hard failures — only truly broken articles (almost never fires for a real GPT response)
    const hardReasons = [];
    if (words.length < 60) hardReasons.push("too_short");

    // Soft failures — trigger a retry on early attempts, accepted on final attempt
    const softReasons = [];
    if (words.length > 420) softReasons.push("too_long");
    if (sentenceLengths.length < 2) softReasons.push("too_few_sentences");
    if (uniqueRatio < 0.25) softReasons.push("low_lexical_diversity");
    if (fillerFound) softReasons.push(`filler_phrase:${fillerFound}`);
    if (productFirstWord && !normalized.includes(productFirstWord)) softReasons.push("missing_product");
    if (tagFirstWord && !normalized.includes(tagFirstWord)) softReasons.push("missing_tag");
    if (locationFirstWord && !normalized.includes(locationFirstWord)) softReasons.push("missing_location");
    if (whatsappCount < 1) softReasons.push("whatsapp_count");
    if (phoneCount < 1) softReasons.push("phone_count");

    return {
        hardOk: hardReasons.length === 0,
        ok: hardReasons.length === 0 && softReasons.length === 0,
        reasons: [...hardReasons, ...softReasons],
        metrics: {
            words: words.length,
            sentences: sentenceLengths.length,
            uniqueRatio,
        },
    };
}

function detectContextType({ product, category, department, tag }) {
    const source = [
        product?.name,
        product?.slug,
        product?.ai_context,
        product?.description,
        category?.name,
        category?.slug,
        department?.name,
        department?.slug,
        tag?.name,
        tag?.slug,
    ]
        .filter(Boolean)
        .join(" ");

    const haystack = normalizeText(source);
    const scores = Object.entries(CONTEXT_KEYWORDS).map(([type, keywords]) => {
        const score = keywords.reduce((sum, keyword) => {
            return sum + (haystack.includes(normalizeText(keyword)) ? 1 : 0);
        }, 0);
        return { type, score };
    });

    scores.sort((a, b) => b.score - a.score);
    if (scores[0]?.score > 0) {
        return scores[0].type;
    }

    return "general";
}

function extractProductDetailPoints(product) {
    const raw = [product?.ai_context, product?.description]
        .filter(Boolean)
        .join(". ");

    if (!raw) return [];

    const unique = [];
    const seen = new Set();

    for (const part of raw.split(/[\n.;]/)) {
        const clean = part.trim();
        const normalized = normalizeText(clean);
        if (clean.length < 14 || !normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        unique.push(clean);
        if (unique.length >= 4) break;
    }

    return unique;
}

function buildSpecificityInstructions({ product, category, department, tag, location }) {
    const contextType = detectContextType({ product, category, department, tag });
    const detailPoints = extractProductDetailPoints(product);
    const detailBlock = detailPoints.length
        ? detailPoints.map((point, idx) => `${idx + 1}. ${point}`).join("\n")
        : "No extra product details were provided. Use realistic assumptions and avoid generic filler.";

    const sharedBase = `Use these product-specific details as anchors and naturally include at least 2 of them:\n${detailBlock}\n`;

    if (contextType === "sexual") {
        return `${sharedBase}
This is a sexual-health context. Be explicit but tasteful:
- Frame outcomes around real bedroom performance: stamina, confidence in bed, erection quality/control, partner intimacy.
- Show one concrete before-vs-after scenario in a relationship context without graphic language.
- Tie the mechanism of improvement to the specific keyword "${tag.name}" and this exact product.
- Keep claims realistic and responsible: avoid guarantees or instant-cure promises.`;
    }

    if (contextType === "sports") {
        return `${sharedBase}
This is a sports/performance context:
- Focus on training quality, recovery, strength/endurance, and consistency.
- Include one realistic routine example (workout day, timing, hydration, recovery).
- Avoid steroid-like or instant transformation claims.`;
    }

    if (contextType === "skinBeauty") {
        return `${sharedBase}
This is a skin/beauty context:
- Focus on visible skin or appearance goals with realistic timelines.
- Include one routine detail (frequency, patch-test, consistency).
- Avoid miracle-cure language or guaranteed overnight results.`;
    }

    if (contextType === "womens") {
        return `${sharedBase}
This is a women's health context:
- Use respectful, supportive tone and practical daily-life relevance.
- Explain benefits around comfort, cycle/hormonal support, or wellbeing as relevant to the tag.
- Keep claims responsible and avoid medical guarantees.`;
    }

    if (contextType === "weight") {
        return `${sharedBase}
This is a weight/metabolism context:
- Emphasize appetite control, routine, activity, and consistency.
- Include one realistic lifestyle detail (food habits, movement, hydration, sleep).
- Avoid extreme or unrealistic weight-loss promises.`;
    }

    if (contextType === "energy") {
        return `${sharedBase}
This is an energy/wellness context:
- Focus on day-to-day function: fatigue, concentration, resilience, routine.
- Include one practical behavior detail that complements the product.
- Keep outcomes realistic, not dramatic.`;
    }

    return `${sharedBase}
Keep context specific to this product and condition:
- Explain a realistic day-to-day problem and how this product helps with "${tag.name}".
- Include one practical usage/compliance detail and one realistic expectation line.
- Keep the story grounded in ${location.name} rather than generic statements.`;
}

function createStoryBank(contents) {
    const fingerprints3 = [];
    const fingerprints4 = [];
    const openings = new Set();
    const endings = new Set();
    const openingHints = [];
    const endingHints = [];

    for (const content of contents || []) {
        if (!content) continue;

        fingerprints3.push(toShingleSet(content, 3));
        fingerprints4.push(toShingleSet(content, 4));

        const opening = openingFingerprint(content);
        const ending = endingFingerprint(content);

        if (opening) {
            openings.add(opening);
            if (openingHints.length < 5) openingHints.push(opening);
        }
        if (ending) {
            endings.add(ending);
            if (endingHints.length < 5) endingHints.push(ending);
        }
    }

    const repeatedPhrases = extractRepeatedPhrases(contents, 3, 2, 8);

    return {
        fingerprints3,
        fingerprints4,
        openings,
        endings,
        openingHints,
        endingHints,
        repeatedPhrases,
    };
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

        const BATCH_LIMIT = Math.max(1, Number(body.limit) || 1);
        const filterProductId = body.productId || null;
        const hasTagFilter = Array.isArray(body.tagIds);
        const hasLocationFilter = Array.isArray(body.locationIds);
        const filterTagIds = hasTagFilter ? new Set(body.tagIds.map(String).filter(Boolean)) : null;
        const filterLocationIds = hasLocationFilter ? new Set(body.locationIds.map(String).filter(Boolean)) : null;

        const [{ data: departments }, { data: categories }, { data: tags }, { data: locations }] = await Promise.all([
            supabase.from("departments").select("*"),
            supabase.from("categories").select("*"),
            supabase.from("tags").select("*"),
            supabase.from("locations").select("*"),
        ]);

        let productQuery = supabase
            .from("products")
            .select("id, name, slug, ai_context, category_id, department_id")
            .not("slug", "is", null);

        if (filterProductId) {
            productQuery = productQuery.eq("id", filterProductId);
        }

        const { data: products, error: productsError } = await productQuery;
        if (productsError) {
            return new Response(JSON.stringify({ error: productsError.message }), { status: 500 });
        }

        if (!products || products.length === 0) {
            return new Response(
                JSON.stringify({ success: true, count: 0, remaining: 0, message: "No products with slugs found. Set a slug on each product first." }),
                { status: 200 }
            );
        }

        const { data: existingSlugs } = await supabase.from("seo_articles").select("slug");
        const existingSet = new Set((existingSlugs || []).map((row) => row.slug));
        // Tracks slugs that failed quality/generation this session so we don't retry them endlessly
        const skippedSlugs = new Set();

        const startedAt = Date.now();
        let totalGenerated = 0;
        let remaining = 0;
        let stoppedForRuntime = false;

        while (totalGenerated < BATCH_LIMIT) {
            let target = null;
            let hasMoreAfterTarget = false;

            searchLoop:
            for (const product of products) {
                const cat = categories?.find((c) => c.id === product.category_id);
                const dept = departments?.find((d) => d.id === (product.department_id || cat?.department_id));
                if (!cat || !dept) continue;

                const deptTags = (tags || []).filter((tag) => {
                    if (String(tag.department_id) !== String(dept.id)) return false;
                    if (hasTagFilter && !filterTagIds.has(String(tag.id))) return false;
                    return true;
                });

                for (const tag of deptTags) {
                    for (const loc of locations || []) {
                        if (hasLocationFilter && !filterLocationIds.has(String(loc.id))) continue;
                        if (Date.now() - startedAt > SAFE_RUNTIME_MS) {
                            stoppedForRuntime = true;
                            remaining = 1;
                            break searchLoop;
                        }

                        const slug = `${dept.slug}---${cat.slug}---${product.slug}---${tag.slug}-in-${loc.slug}`;
                        if (existingSet.has(slug) || skippedSlugs.has(slug)) continue;

                        if (!target) {
                            target = { product, cat, dept, tag, loc, slug };
                        } else {
                            hasMoreAfterTarget = true;
                            break searchLoop;
                        }
                    }
                }
            }

            if (!target) {
                if (!stoppedForRuntime) remaining = 0;
                break;
            }

            const runtimeLeft = SAFE_RUNTIME_MS - (Date.now() - startedAt);
            if (runtimeLeft < 2800) {
                stoppedForRuntime = true;
                remaining = 1;
                break;
            }

            const { data: productArticles } = await supabase
                .from("seo_articles")
                .select("content")
                .ilike("slug", `%---${target.product.slug}---%`)
                .limit(50);

            const storyBank = createStoryBank((productArticles || []).map((row) => row.content).filter(Boolean));

            let generatedText = "";
            let generatedSet3 = null;
            let generatedSet4 = null;
            let generatedOpening = "";
            let generatedEnding = "";

            for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_STORY; attempt++) {
                const profile = buildStoryProfile(target.slug, attempt);
                const blockedOpenings = storyBank.openingHints.length
                    ? storyBank.openingHints.map((hint, idx) => `${idx + 1}. ${hint}`).join("\n")
                    : "None yet.";
                const blockedEndings = storyBank.endingHints.length
                    ? storyBank.endingHints.map((hint, idx) => `${idx + 1}. ${hint}`).join("\n")
                    : "None yet.";
                const avoidPhrases = storyBank.repeatedPhrases.length
                    ? storyBank.repeatedPhrases.join(", ")
                    : "None yet.";

                const productContext = target.product.ai_context
                    ? `Product: ${target.product.name}. ${target.product.ai_context}`
                    : `Product: ${target.product.name}.`;

                const specificityInstructions = buildSpecificityInstructions({
                    product: target.product,
                    category: target.cat,
                    department: target.dept,
                    tag: target.tag,
                    location: target.loc,
                });

                const prompt = `Write a ${profile.wordCount}-word SEO story for BurungiHealth in plain paragraphs only (no headings, no bullets, no markdown).\n\nProduct: ${target.product.name}\nKeyword/problem: "${target.tag.name}"\nLocation: ${target.loc.name}, Rwanda\nStory signature: ${profile.signature}\nOpening style: ${profile.opening}\nNarrator: ${profile.narrator}\nSentence rhythm: ${profile.rhythm}\nCTA style: ${profile.ctaStyle}\nScene anchor: ${profile.scene}\nProof style: ${profile.proofStyle}\nClosing style: ${profile.closing}\n\nHuman quality requirements:\n- Make it sound like a real person talking to one reader, not a generic ad template\n- Include one emotionally honest line and one practical line\n- Use concrete local context for ${target.loc.name}\n- Mention one realistic limitation or common mistake before recommending the product\n- Keep claims responsible and avoid miracle language\n\nContext specificity requirements:\n${specificityInstructions}\n\nAvoid these repeated opening fingerprints:\n${blockedOpenings}\n\nAvoid these repeated closing fingerprints:\n${blockedEndings}\n\nAvoid reusing these repeated phrases:\n${avoidPhrases}\n\nStrict rules:\n- Do not start with the product name\n- Mention WhatsApp at least once and include +250 798 707 702 at least once\n- Keep this story structurally and stylistically distinct from previous stories for this product\n- Avoid filler transitions like: ${BANNED_FILLER_PHRASES.join(", ")}\n\nProduct details:\n${productContext}`;

                let candidate = "";
                try {
                    const requestTimeout = Math.max(2200, Math.min(7500, runtimeLeft - 1000));
                    const response = await openai.chat.completions.create(
                        {
                            model: "gpt-4o-mini",
                            messages: [
                                {
                                    role: "system",
                                    content: "You write human-sounding local SEO stories with high variation and no templated AI phrasing.",
                                },
                                { role: "user", content: prompt },
                            ],
                            temperature: profile.temperature,
                            max_tokens: 520,
                        },
                        { timeout: requestTimeout }
                    );
                    candidate = response.choices[0]?.message?.content?.trim() || "";
                } catch {
                    continue;
                }

                if (!candidate) continue;

                const candidateSet3 = toShingleSet(candidate, 3);
                const candidateSet4 = toShingleSet(candidate, 4);
                const candidateOpening = openingFingerprint(candidate);
                const candidateEnding = endingFingerprint(candidate);

                const sim3 = maxSimilarity(candidateSet3, storyBank.fingerprints3);
                const sim4 = maxSimilarity(candidateSet4, storyBank.fingerprints4);
                const openingDuplicate = candidateOpening && storyBank.openings.has(candidateOpening);
                const endingDuplicate = candidateEnding && storyBank.endings.has(candidateEnding);
                const quality = evaluateHumanQuality({
                    text: candidate,
                    tagName: target.tag.name,
                    locationName: target.loc.name,
                    productName: target.product.name,
                });

                const isLastAttempt = attempt >= MAX_ATTEMPTS_PER_STORY - 1;
                // On the last attempt only hard quality failures block acceptance
                const qualityBlock = isLastAttempt ? !quality.hardOk : !quality.ok;
                // Duplicate openings/endings are soft-only — they cause a retry but never a hard block
                const softReject = sim3 >= 0.6 || sim4 >= 0.45 || openingDuplicate || endingDuplicate || qualityBlock;
                const hardReject = sim3 >= 0.65 || sim4 >= 0.5 || qualityBlock;

                if (softReject && !isLastAttempt) continue;
                if (hardReject) continue;

                generatedText = candidate;
                generatedSet3 = candidateSet3;
                generatedSet4 = candidateSet4;
                generatedOpening = candidateOpening;
                generatedEnding = candidateEnding;
                break;
            }

            if (!generatedText) {
                // Skip this slug for the rest of this session; try the next one
                skippedSlugs.add(target.slug);
                remaining = 1;
                continue;
            }

            const { error: insertError } = await supabase.from("seo_articles").insert({
                slug: target.slug,
                content: generatedText,
                language: "en",
                is_approved: false,
            });

            if (insertError) {
                remaining = 1;
                break;
            }

            existingSet.add(target.slug);
            totalGenerated++;

            if (generatedSet3) storyBank.fingerprints3.push(generatedSet3);
            if (generatedSet4) storyBank.fingerprints4.push(generatedSet4);
            if (generatedOpening) {
                storyBank.openings.add(generatedOpening);
                if (storyBank.openingHints.length < 5) storyBank.openingHints.push(generatedOpening);
            }
            if (generatedEnding) {
                storyBank.endings.add(generatedEnding);
                if (storyBank.endingHints.length < 5) storyBank.endingHints.push(generatedEnding);
            }

            // If skipped slugs exist they still need generating — don't signal "done" prematurely
            remaining = (hasMoreAfterTarget || skippedSlugs.size > 0) ? 1 : 0;
            if (!hasMoreAfterTarget && skippedSlugs.size === 0) break;
        }

        return new Response(
            JSON.stringify({ success: true, count: totalGenerated, remaining, stoppedForRuntime }),
            { status: 200 }
        );
    } catch (error) {
        const msg = error?.message || String(error) || "Unknown server error";
        return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }
}
