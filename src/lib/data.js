import { supabase } from './supabase';

export async function generateCategoryCombos() {
    const paths = [];

    // Fetch the 4 independent dimension tables
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
    // Expected format: mens-health-amavuta-kurangiza-vuba-in-kigali
    const parts = comboSlug.split('-in-');
    if (parts.length !== 2) return null;

    const locationSlug = parts[1];

    // Split the first half: [dept]---[cat]---[tag]
    const mainParts = parts[0].split('---');
    if (mainParts.length < 3) return null;

    const deptSlug = mainParts[0];
    const categorySlug = mainParts[1];
    const tagSlug = mainParts[2];

    // Fetch the specific dimensions and the unique AI article from the DB
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
