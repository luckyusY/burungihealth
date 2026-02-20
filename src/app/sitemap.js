import { createClient } from "@supabase/supabase-js";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.burungihealth.com").replace(/\/+$/, "");
const MAX_SITEMAP_URLS = 45000;

function createSitemapClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;

    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

function addPage(pages, page) {
    if (!page?.url) return;

    const normalized = {
        url: page.url,
        lastModified: page.lastModified ? new Date(page.lastModified) : new Date(),
        changeFrequency: page.changeFrequency || "weekly",
        priority: page.priority ?? 0.7,
    };

    const existing = pages.get(normalized.url);
    if (!existing) {
        pages.set(normalized.url, normalized);
        return;
    }

    if (new Date(existing.lastModified) < normalized.lastModified) {
        pages.set(normalized.url, normalized);
    }
}

function hasRoom(pages) {
    return pages.size < MAX_SITEMAP_URLS;
}

export default async function sitemap() {
    const pages = new Map();
    addPage(pages, {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
    });

    const supabase = createSitemapClient();
    if (!supabase) {
        console.error("Sitemap: Supabase env vars are missing.");
        return [...pages.values()];
    }

    const [categoriesRes, approvedArticlesRes] = await Promise.all([
        supabase.from("categories").select("slug"),
        supabase.from("seo_articles").select("slug, created_at").eq("is_approved", true),
    ]);

    if (categoriesRes.error) console.error("Sitemap categories error:", categoriesRes.error.message);
    if (approvedArticlesRes.error) console.error("Sitemap articles error:", approvedArticlesRes.error.message);

    const categories = categoriesRes.data || [];
    const approvedArticles = approvedArticlesRes.data || [];

    for (const category of categories) {
        if (!hasRoom(pages)) break;
        if (!category?.slug) continue;

        addPage(pages, {
            url: `${SITE_URL}/category/${category.slug}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.85,
        });
    }

    for (const article of approvedArticles) {
        if (!article?.slug || !hasRoom(pages)) break;
        const url = `${SITE_URL}/${article.slug}`;
        const modifiedAt = article.created_at || new Date();

        addPage(pages, {
            url,
            lastModified: modifiedAt,
            changeFrequency: "weekly",
            priority: 0.8,
        });
    }

    return [...pages.values()];
}
