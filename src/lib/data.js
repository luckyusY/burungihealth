import { supabase } from './supabase';

// Generate all product-level slugs for static params
export async function generateCategoryCombos() {
    const { data: departments } = await supabase.from('departments').select('id, slug');
    const { data: categories } = await supabase.from('categories').select('id, slug, department_id');
    const { data: tags } = await supabase.from('tags').select('slug, department_id');
    const { data: locations } = await supabase.from('locations').select('slug');
    const { data: products } = await supabase
        .from('products')
        .select('id, slug, category_id, department_id')
        .not('slug', 'is', null);

    if (!departments || !categories || !tags || !locations || !products) return [];

    const combos = [];
    for (const product of products) {
        const cat = categories.find(c => c.id === product.category_id);
        const dept = departments.find(d => d.id === (product.department_id || cat?.department_id));
        if (!cat || !dept || !product.slug) continue;

        const deptTags = tags.filter(t => t.department_id === dept.id);
        for (const tag of deptTags) {
            for (const loc of locations) {
                combos.push({
                    slug: `${dept.slug}---${cat.slug}---${product.slug}---${tag.slug}-in-${loc.slug}`,
                });
            }
        }
    }

    return combos;
}

export async function getComboData(comboSlug) {
    // Slug format: dept---cat---product---tag-in-location
    const parts = comboSlug.split('-in-');
    if (parts.length !== 2) return null;

    const locationSlug = parts[1];
    const mainParts = parts[0].split('---');
    if (mainParts.length < 4) return null;

    const deptSlug = mainParts[0];
    const categorySlug = mainParts[1];
    const productSlug = mainParts[2];
    const tagSlug = mainParts[3];

    const [deptReq, catReq, tagReq, locReq, productReq, articleReq] = await Promise.all([
        supabase.from('departments').select('*').eq('slug', deptSlug).single(),
        supabase.from('categories').select('*').eq('slug', categorySlug).single(),
        supabase.from('tags').select('id, name, slug, synonyms').eq('slug', tagSlug).single(),
        supabase.from('locations').select('*').eq('slug', locationSlug).single(),
        supabase.from('products').select('*').eq('slug', productSlug).single(),
        supabase.from('seo_articles').select('content').eq('slug', comboSlug).eq('is_approved', true).single()
    ]);

    const department = deptReq.data;
    const category = catReq.data;
    const tag = tagReq.data;
    const location = locReq.data;
    const product = productReq.data;
    const article = articleReq.data?.content || null;

    if (!department || !category || !tag || !location || !product) return null;

    // Show the specific product + others in same category
    const { data: relatedProducts } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', category.id);

    // Put the featured product first
    const products = [
        product,
        ...(relatedProducts || []).filter(p => p.id !== product.id)
    ];

    return {
        department,
        category,
        tag,
        location,
        product,   // the specific product this page is about
        products,
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

    // Fetch tags scoped to this category's department for internal linking
    const { data: tags } = await supabase
        .from('tags')
        .select('name, slug')
        .eq('department_id', category.department_id)
        .limit(6);
    const { data: locations } = await supabase.from('locations').select('name, slug').limit(4);

    return {
        category,
        products: products || [],
        tags: tags || [],
        locations: locations || [],
    };
}

// For internal linking: get approved articles related to this page
export async function getRelatedArticles(currentSlug, tagSlug, productSlug, limit = 5) {
    // Same tag, different product or location
    const { data: sameTag } = await supabase
        .from('seo_articles')
        .select('slug')
        .ilike('slug', `%---${tagSlug}-in-%`)
        .eq('is_approved', true)
        .neq('slug', currentSlug)
        .limit(limit);

    // Same product, different tag
    const { data: sameProd } = await supabase
        .from('seo_articles')
        .select('slug')
        .ilike('slug', `%---${productSlug}---%`)
        .eq('is_approved', true)
        .neq('slug', currentSlug)
        .limit(limit);

    const all = [...(sameTag || []), ...(sameProd || [])];
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
        const tag = (mainParts[3] || mainParts[2] || '').replace(/-/g, ' ');
        const product = (mainParts[2] || '').replace(/-/g, ' ');
        return `${tag} — ${product} in ${location}`;
    } catch {
        return slug;
    }
}
