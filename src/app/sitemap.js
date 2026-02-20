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

    const [
        categoriesRes,
        approvedArticlesRes,
        departmentsRes,
        categoriesForCombosRes,
        tagsRes,
        locationsRes,
        productsRes,
    ] = await Promise.all([
        supabase.from("categories").select("slug"),
        supabase.from("seo_articles").select("slug, created_at").eq("is_approved", true),
        supabase.from("departments").select("id, slug"),
        supabase.from("categories").select("id, slug, department_id"),
        supabase.from("tags").select("slug, department_id"),
        supabase.from("locations").select("slug"),
        supabase.from("products").select("slug, category_id, department_id").not("slug", "is", null),
    ]);

    if (categoriesRes.error) console.error("Sitemap categories error:", categoriesRes.error.message);
    if (approvedArticlesRes.error) console.error("Sitemap articles error:", approvedArticlesRes.error.message);
    if (departmentsRes.error) console.error("Sitemap departments error:", departmentsRes.error.message);
    if (categoriesForCombosRes.error) console.error("Sitemap category-combos error:", categoriesForCombosRes.error.message);
    if (tagsRes.error) console.error("Sitemap tags error:", tagsRes.error.message);
    if (locationsRes.error) console.error("Sitemap locations error:", locationsRes.error.message);
    if (productsRes.error) console.error("Sitemap products error:", productsRes.error.message);

    const categories = categoriesRes.data || [];
    const approvedArticles = approvedArticlesRes.data || [];
    const departments = departmentsRes.data || [];
    const comboCategories = categoriesForCombosRes.data || [];
    const tags = tagsRes.data || [];
    const locations = locationsRes.data || [];
    const products = productsRes.data || [];

    for (const category of categories) {
        if (!hasRoom(pages)) break;
        addPage(pages, {
            url: `${SITE_URL}/category/${category.slug}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.85,
        });
    }

    const articleLastModified = new Map();
    for (const article of approvedArticles) {
        if (!article?.slug || !hasRoom(pages)) break;
        const url = `${SITE_URL}/${article.slug}`;
        const modifiedAt = article.created_at ? new Date(article.created_at) : new Date();
        articleLastModified.set(article.slug, modifiedAt);

        addPage(pages, {
            url,
            lastModified: modifiedAt,
            changeFrequency: "weekly",
            priority: 0.8,
        });
    }

    const tagMapByDepartment = new Map();
    for (const tag of tags) {
        const deptId = String(tag.department_id || "");
        if (!tagMapByDepartment.has(deptId)) tagMapByDepartment.set(deptId, []);
        tagMapByDepartment.get(deptId).push(tag);
    }

    outer:
    for (const product of products) {
        if (!hasRoom(pages)) break;

        const category = comboCategories.find((c) => c.id === product.category_id);
        const department = departments.find((d) => d.id === (product.department_id || category?.department_id));

        if (!category || !department || !product.slug) continue;

        const deptTags = tagMapByDepartment.get(String(department.id)) || [];
        for (const tag of deptTags) {
            for (const location of locations) {
                if (!hasRoom(pages)) break outer;

                const comboSlug = `${department.slug}---${category.slug}---${product.slug}---${tag.slug}-in-${location.slug}`;
                const modifiedAt = articleLastModified.get(comboSlug) || new Date();

                addPage(pages, {
                    url: `${SITE_URL}/${comboSlug}`,
                    lastModified: modifiedAt,
                    changeFrequency: "weekly",
                    priority: 0.7,
                });
            }
        }
    }

    return [...pages.values()];
}
