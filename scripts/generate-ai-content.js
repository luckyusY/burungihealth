import "dotenv/config";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

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
    "when it comes to",
    "at the end of the day",
    "without further ado",
    "as we all know",
    "whether you are",
    "unlock your full potential",
    "game changer",
    "revolutionary solution",
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
    const wordCount = 185 + (seed % 71);
    const temperature = Number((0.84 + ((seed % 19) / 100)).toFixed(2));

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
    const shortSentenceCount = sentenceLengths.filter((len) => len <= 9).length;
    const longSentenceCount = sentenceLengths.filter((len) => len >= 18).length;

    const fillerFound = BANNED_FILLER_PHRASES.find((phrase) => normalized.includes(phrase));
    const whatsappCount = countMatches(text.toLowerCase(), /whatsapp/g);
    const phoneCount = countMatches(text, /\+?\s*250[\s-]*798[\s-]*707[\s-]*702/g);

    const reasons = [];

    if (words.length < 170 || words.length > 290) reasons.push("word_count");
    if (sentenceLengths.length < 5) reasons.push("too_few_sentences");
    if (uniqueRatio < 0.45) reasons.push("low_lexical_diversity");
    if (shortSentenceCount < 1 || longSentenceCount < 1) reasons.push("flat_sentence_shape");
    if (fillerFound) reasons.push(`filler_phrase:${fillerFound}`);
    if (!containsPhrase(normalized, productName)) reasons.push("missing_product");
    if (!containsPhrase(normalized, tagName)) reasons.push("missing_tag");
    if (!containsPhrase(normalized, locationName)) reasons.push("missing_location");
    if (whatsappCount !== 1) reasons.push("whatsapp_count");
    if (phoneCount !== 1) reasons.push("phone_count");

    return {
        ok: reasons.length === 0,
        reasons,
        metrics: {
            words: words.length,
            sentences: sentenceLengths.length,
            uniqueRatio,
            shortSentenceCount,
            longSentenceCount,
        },
    };
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

async function generateStory(prompt, temperature) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You write human-sounding local SEO stories with high variation and no templated AI phrasing.",
            },
            { role: "user", content: prompt },
        ],
        temperature,
    });

    const text = response.choices[0]?.message?.content;
    return text ? text.trim() : "";
}

async function main() {
    console.log("Starting BurungiHealth story generator...");

    const { data: departments } = await supabase.from("departments").select("*");
    const { data: categories } = await supabase.from("categories").select("*");
    const { data: tags } = await supabase.from("tags").select("*");
    const { data: locations } = await supabase.from("locations").select("*");
    const { data: products } = await supabase
        .from("products")
        .select("id, name, slug, ai_context, category_id, department_id")
        .not("slug", "is", null);

    if (!departments || !categories || !tags || !locations || !products) {
        console.error("Failed to fetch dimensions from Supabase.");
        return;
    }

    const { data: existingRows } = await supabase.from("seo_articles").select("slug");
    const existingSlugs = new Set((existingRows || []).map((row) => row.slug));

    let totalGenerated = 0;

    for (const product of products) {
        const cat = categories.find((c) => c.id === product.category_id);
        const dept = departments.find((d) => d.id === (product.department_id || cat?.department_id));
        if (!cat || !dept) continue;

        const { data: previousStories } = await supabase
            .from("seo_articles")
            .select("content")
            .ilike("slug", `%---${product.slug}---%`)
            .limit(60);

        const productContents = (previousStories || []).map((row) => row.content).filter(Boolean);
        const storyBank = createStoryBank(productContents);

        const deptTags = tags.filter((tag) => String(tag.department_id) === String(dept.id));

        for (const tag of deptTags) {
            for (const loc of locations) {
                const slug = `${dept.slug}---${cat.slug}---${product.slug}---${tag.slug}-in-${loc.slug}`;
                if (existingSlugs.has(slug)) continue;

                let finalText = "";
                let finalSet3 = null;
                let finalSet4 = null;
                let finalOpening = "";
                let finalEnding = "";

                for (let attempt = 0; attempt < 5; attempt++) {
                    const profile = buildStoryProfile(slug, attempt);
                    const blockedOpenings = storyBank.openingHints.length
                        ? storyBank.openingHints.map((hint, idx) => `${idx + 1}. ${hint}`).join("\n")
                        : "None yet.";

                    const blockedEndings = storyBank.endingHints.length
                        ? storyBank.endingHints.map((hint, idx) => `${idx + 1}. ${hint}`).join("\n")
                        : "None yet.";

                    const avoidPhrases = storyBank.repeatedPhrases.length
                        ? storyBank.repeatedPhrases.join(", ")
                        : "None yet.";

                    const productContext = product.ai_context
                        ? `Product: ${product.name}. ${product.ai_context}`
                        : `Product: ${product.name}.`;

                    const prompt = `Write a ${profile.wordCount}-word SEO story for BurungiHealth in plain paragraphs only (no headings, no bullets, no markdown).\n\nProduct: ${product.name}\nKeyword/problem: \"${tag.name}\"\nLocation: ${loc.name}, Rwanda\nStory signature: ${profile.signature}\nOpening style: ${profile.opening}\nNarrator: ${profile.narrator}\nSentence rhythm: ${profile.rhythm}\nCTA style: ${profile.ctaStyle}\nScene anchor: ${profile.scene}\nProof style: ${profile.proofStyle}\nClosing style: ${profile.closing}\n\nHuman quality requirements:\n- Make it sound like a real person talking to one reader, not a generic ad template\n- Include one emotionally honest line and one practical line\n- Use concrete local context for ${loc.name}\n- Mention one realistic limitation or common mistake before recommending the product\n- Keep claims responsible and avoid miracle language\n\nAvoid these repeated opening fingerprints:\n${blockedOpenings}\n\nAvoid these repeated closing fingerprints:\n${blockedEndings}\n\nAvoid reusing these repeated phrases:\n${avoidPhrases}\n\nStrict rules:\n- Do not start with the product name\n- Mention WhatsApp exactly once and include +250 798 707 702 exactly once\n- Keep this story structurally and stylistically distinct from previous stories for this product\n- Avoid filler transitions like: ${BANNED_FILLER_PHRASES.join(", ")}\n\nProduct details:\n${productContext}`;

                    const candidate = await generateStory(prompt, profile.temperature);
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
                        tagName: tag.name,
                        locationName: loc.name,
                        productName: product.name,
                    });

                    const softReject = sim3 >= 0.53 || sim4 >= 0.37 || openingDuplicate || endingDuplicate || !quality.ok;
                    const hardReject = sim3 >= 0.57 || sim4 >= 0.41 || openingDuplicate || endingDuplicate || !quality.ok;

                    if (softReject && attempt < 4) {
                        continue;
                    }

                    if (hardReject) {
                        finalText = "";
                        break;
                    }

                    finalText = candidate;
                    finalSet3 = candidateSet3;
                    finalSet4 = candidateSet4;
                    finalOpening = candidateOpening;
                    finalEnding = candidateEnding;
                    break;
                }

                if (!finalText) {
                    console.log(`[SKIP] Could not create a sufficiently unique human-quality story for: ${slug}`);
                    continue;
                }

                const { error } = await supabase.from("seo_articles").insert({
                    slug,
                    content: finalText,
                    is_approved: false,
                    language: "en",
                });

                if (error) {
                    console.error(`[ERROR] Failed to save ${slug}:`, error.message);
                    continue;
                }

                existingSlugs.add(slug);
                if (finalSet3) storyBank.fingerprints3.push(finalSet3);
                if (finalSet4) storyBank.fingerprints4.push(finalSet4);

                if (finalOpening) {
                    storyBank.openings.add(finalOpening);
                    if (storyBank.openingHints.length < 5) storyBank.openingHints.push(finalOpening);
                }

                if (finalEnding) {
                    storyBank.endings.add(finalEnding);
                    if (storyBank.endingHints.length < 5) storyBank.endingHints.push(finalEnding);
                }

                totalGenerated++;
                console.log(`[OK] Saved unique story: ${slug}`);

                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }
    }

    console.log(`Done. Generated ${totalGenerated} unique stories.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
