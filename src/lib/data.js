import { supabase } from './supabase';

export async function generateCategoryCombos() {
    const { data: departments } = await supabase.from('departments').select('id, slug');
    const { data: categories } = await supabase.from('categories').select('id, slug, department_id');
    const { data: tags } = await supabase.from('tags').select('slug');
    const { data: locations } = await supabase.from('locations').select('slug');

    if (!departments || !categories || !tags || !locations) return [];

    const combos = [];
    departments.forEach(dept => {
        const deptCats = categories.filter(c => c.department_id === dept.id);
        deptCats.forEach(cat => {
            tags.forEach(tag => {
                locations.forEach(loc => {
                    combos.push({
                        slug: `${dept.slug}---${cat.slug}---${tag.slug}-in-${loc.slug}`,
                        dept: dept.slug,
                        cat: cat.slug,
                        tag: tag.slug,
                        loc: loc.slug
                    });
                });
            });
        });
    });

    return combos;
}

export async function getComboData(comboSlug) {
    const parts = comboSlug.split('-in-');
    if (parts.length !== 2) return null;

    const locationSlug = parts[1];
    const mainParts = parts[0].split('---');
    if (mainParts.length < 3) return null;

    const deptSlug = mainParts[0];
    const categorySlug = mainParts[1];
    const tagSlug = mainParts[2];

    const [deptReq, catReq, tagReq, locReq, articleReq] = await Promise.all([
        supabase.from('departments').select('*').eq('slug', deptSlug).single(),
        supabase.from('categories').select('*').eq('slug', categorySlug).single(),
        supabase.from('tags').select('*').eq('slug', tagSlug).single(),
        supabase.from('locations').select('*').eq('slug', locationSlug).single(),
        supabase.from('seo_articles').select('content').eq('slug', comboSlug).eq('is_approved', true).single()
    ]);

    const department = deptReq.data;
    const category = catReq.data;
    const tag = tagReq.data;
    const location = locReq.data;
    const article = articleReq.data?.content || null;

    if (!department || !category || !tag || !location) return null;

    // FIX: Fetch products by category first, fall back to department
    // (removed broken tag-array filter that was returning 0 products)
    let { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', category.id);

    if (!products || products.length === 0) {
        const { data: deptProducts } = await supabase
            .from('products')
            .select('*')
            .eq('department_id', department.id);
        products = deptProducts || [];
    }

    return {
        department,
        category,
        tag,
        location,
        products: products || [],
        article
    };
}

export async function getCategoryData(slug) {
    const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!category) return null;

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', category.id);

    // Also fetch tags for internal linking
    const { data: tags } = await supabase.from('tags').select('name, slug').limit(6);
    const { data: locations } = await supabase.from('locations').select('name, slug').limit(4);

    return {
        category,
        products: products || [],
        tags: tags || [],
        locations: locations || [],
    };
}

// For internal linking: get approved articles related to this page
export async function getRelatedArticles(currentSlug, tagSlug, categorySlug, limit = 5) {
    // Same tag slug in different locations/categories
    const { data: sameTag } = await supabase
        .from('seo_articles')
        .select('slug')
        .ilike('slug', `%---${tagSlug}-in-%`)
        .eq('is_approved', true)
        .neq('slug', currentSlug)
        .limit(limit);

    // Same category with different tags
    const { data: sameCat } = await supabase
        .from('seo_articles')
        .select('slug')
        .ilike('slug', `%---${categorySlug}---%`)
        .eq('is_approved', true)
        .neq('slug', currentSlug)
        .limit(limit);

    const all = [...(sameTag || []), ...(sameCat || [])];
    const seen = new Set([currentSlug]);
    return all.filter(a => {
        if (seen.has(a.slug)) return false;
        seen.add(a.slug);
        return true;
    }).slice(0, limit);
}

// Format a slug into readable link text
export function formatSlugTitle(slug) {
    try {
        const parts = slug.split('-in-');
        if (parts.length !== 2) return slug;
        const location = parts[1].replace(/-/g, ' ');
        const mainParts = parts[0].split('---');
        const tag = (mainParts[2] || '').replace(/-/g, ' ');
        const cat = (mainParts[1] || '').replace(/-/g, ' ');
        return `${tag} (${cat}) in ${location}`;
    } catch {
        return slug;
    }
}
