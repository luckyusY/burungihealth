import { supabase } from './supabase';

export async function generateCategoryCombos() {
    const paths = [];

    // Fetch the 4 independent dimension tables
    const { data: departments } = await supabase.from('departments').select('slug');
    const { data: categories } = await supabase.from('categories').select('slug');
    const { data: tags } = await supabase.from('tags').select('slug');
    const { data: locations } = await supabase.from('locations').select('slug');

    if (!departments || !categories || !tags || !locations) return paths;

    // Generate permutations: /rw/[department]/[category]/[tag]-in-[location]
    // Example: /rw/mens-health/amavuta/kurangiza-vuba-in-kigali
    for (const dept of departments) {
        for (const cat of categories) {
            for (const tag of tags) {
                for (const loc of locations) {
                    paths.push({
                        // Currently generating URLs directly.
                        slug: `${dept.slug}-${cat.slug}-${tag.slug}-in-${loc.slug}`
                    });
                }
            }
        }
    }
    return paths;
}

export async function getComboData(comboSlug) {
    // Expected format: mens-health-amavuta-kurangiza-vuba-in-kigali
    const parts = comboSlug.split('-in-');
    if (parts.length !== 2) return null;

    const locationSlug = parts[1];

    // Split the first half: [dept]-[cat]-[tag]
    const rootParts = parts[0].split('-');
    if (rootParts.length < 3) return null;

    // This simple split assumes slugs don't easily conflict with dashes, 
    // but a more robust router would use actual path segments e.g. /dept/cat/tag 
    // For this prototype we will approximate extraction:
    const tagSlug = rootParts.pop();
    const categorySlug = rootParts.pop();
    const deptSlug = rootParts.join('-');

    // Fetch the specific dimensions and the unique AI article from the DB
    const [deptReq, catReq, tagReq, locReq, articleReq] = await Promise.all([
        supabase.from('departments').select('*').eq('slug', deptSlug).single(),
        supabase.from('categories').select('*').eq('slug', categorySlug).single(),
        supabase.from('tags').select('*').eq('slug', tagSlug).single(),
        supabase.from('locations').select('*').eq('slug', locationSlug).single(),
        supabase.from('seo_articles').select('content').eq('slug', comboSlug).single()
    ]);

    const department = deptReq.data;
    const category = catReq.data;
    const tag = tagReq.data;
    const location = locReq.data;
    const article = articleReq.data?.content || null;

    // If the database doesn't have these exact dimensions, return 404
    if (!department || !category || !tag || !location) return null;

    // Fetch products that match the Department OR Category
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('department_id', department.id);

    if (error) {
        console.error("Error fetching products:", error);
        return null;
    }

    // Filter products: Only return them if they possess the required Tag.
    const relatedProducts = products ? products.filter(p =>
        p.tags && p.tags.includes(tag.slug)
    ) : [];

    return {
        department,
        category,
        tag,
        location,
        products: relatedProducts,
        article
    };
}

export async function getCategoryData(slug) {
    // 1. Fetch category
    const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!category) return null;

    // 2. Fetch products for this category
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', category.id);

    return {
        category,
        products: products || []
    };
}
