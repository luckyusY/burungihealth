import 'dotenv/config';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseAnonKey || !openaiApiKey) {
    console.error('Missing environment variables. Please check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

const STORY_OPENINGS = [
    'Start with a daily frustration scene before naming the product.',
    'Open with a direct question someone might ask a trusted friend.',
    'Begin with one myth-versus-reality sentence.',
    'Start with a short confidence-restoration story moment.',
];

const STORY_TONES = [
    'warm and reassuring',
    'conversational and practical',
    'confident and direct',
    'empathetic and supportive',
];

function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function normalizeText(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function toShingleSet(text, size = 3) {
    const words = normalizeText(text).split(' ').filter(Boolean);
    const set = new Set();

    if (words.length <= size) {
        if (words.length) set.add(words.join(' '));
        return set;
    }

    for (let i = 0; i <= words.length - size; i++) {
        set.add(words.slice(i, i + size).join(' '));
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

function maxSimilarity(candidateSet, existingSets) {
    let max = 0;
    for (const existing of existingSets) {
        const score = jaccardSimilarity(candidateSet, existing);
        if (score > max) max = score;
    }
    return max;
}

function pick(list, seed, offset = 0) {
    const mixed = (seed + Math.imul(offset + 1, 2654435761)) >>> 0;
    return list[mixed % list.length];
}

async function generateStory(prompt, temperature) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: 'You are an SEO copywriter who makes each story meaningfully distinct.' },
            { role: 'user', content: prompt },
        ],
        temperature,
    });

    const text = response.choices[0]?.message?.content;
    return text ? text.trim() : '';
}

async function main() {
    console.log('Starting BurungiHealth story generator...');

    const { data: departments } = await supabase.from('departments').select('*');
    const { data: categories } = await supabase.from('categories').select('*');
    const { data: tags } = await supabase.from('tags').select('*');
    const { data: locations } = await supabase.from('locations').select('*');
    const { data: products } = await supabase
        .from('products')
        .select('id, name, slug, ai_context, category_id, department_id')
        .not('slug', 'is', null);

    if (!departments || !categories || !tags || !locations || !products) {
        console.error('Failed to fetch dimensions from Supabase.');
        return;
    }

    const { data: existingRows } = await supabase.from('seo_articles').select('slug');
    const existingSlugs = new Set((existingRows || []).map((row) => row.slug));

    let totalGenerated = 0;

    for (const product of products) {
        const cat = categories.find((c) => c.id === product.category_id);
        const dept = departments.find((d) => d.id === (product.department_id || cat?.department_id));
        if (!cat || !dept) continue;

        const { data: previousStories } = await supabase
            .from('seo_articles')
            .select('content')
            .ilike('slug', `%---${product.slug}---%`)
            .limit(40);

        const fingerprintBank = (previousStories || []).map((row) => toShingleSet(row.content, 3));

        const deptTags = tags.filter((tag) => String(tag.department_id) === String(dept.id));

        for (const tag of deptTags) {
            for (const loc of locations) {
                const slug = `${dept.slug}---${cat.slug}---${product.slug}---${tag.slug}-in-${loc.slug}`;
                if (existingSlugs.has(slug)) continue;

                let finalText = '';
                let finalFingerprint = null;

                for (let attempt = 0; attempt < 3; attempt++) {
                    const seed = hashString(`${slug}:${attempt}`);
                    const opening = pick(STORY_OPENINGS, seed, 1);
                    const tone = pick(STORY_TONES, seed, 2);
                    const wordCount = 185 + (seed % 61);
                    const temperature = Number((0.82 + ((seed % 18) / 100)).toFixed(2));

                    const productContext = product.ai_context
                        ? `Product: ${product.name}. ${product.ai_context}`
                        : `Product: ${product.name}.`;

                    const prompt = `Write a ${wordCount}-word SEO story for BurungiHealth in plain paragraphs only (no headings, no lists, no markdown).\n\nProduct: ${product.name}\nKeyword: ${tag.name}\nLocation: ${loc.name}, Rwanda\nOpening style: ${opening}\nTone: ${tone}\n\nRules:\n- Do not start with the product name\n- Mention fast, discreet WhatsApp delivery (+250 798 707 702) once\n- Make this story clearly distinct from previous stories for this product\n- Avoid generic filler lines\n\nProduct details:\n${productContext}`;

                    const candidate = await generateStory(prompt, temperature);
                    if (!candidate) continue;

                    const candidateFingerprint = toShingleSet(candidate, 3);
                    const similarity = maxSimilarity(candidateFingerprint, fingerprintBank);

                    if (similarity >= 0.6 && attempt < 2) {
                        continue;
                    }
                    if (similarity >= 0.64) {
                        break;
                    }

                    finalText = candidate;
                    finalFingerprint = candidateFingerprint;
                    break;
                }

                if (!finalText) {
                    console.log(`[SKIP] Could not create a sufficiently unique story for: ${slug}`);
                    continue;
                }

                const { error } = await supabase.from('seo_articles').insert({
                    slug,
                    content: finalText,
                    is_approved: false,
                    language: 'en',
                });

                if (error) {
                    console.error(`[ERROR] Failed to save ${slug}:`, error.message);
                    continue;
                }

                existingSlugs.add(slug);
                if (finalFingerprint) fingerprintBank.push(finalFingerprint);
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
