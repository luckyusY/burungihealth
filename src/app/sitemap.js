import { createClient } from '@supabase/supabase-js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://burungihealth.vercel.app';

export default async function sitemap() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Static pages
    const staticPages = [
        { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    ];

    // Category pages
    const { data: categories } = await supabase.from('categories').select('slug');
    const categoryPages = (categories || []).map(cat => ({
        url: `${SITE_URL}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
    }));

    // Programmatic SEO pages (approved articles only — these are the ones Google can find content on)
    const { data: articles } = await supabase
        .from('seo_articles')
        .select('slug, created_at')
        .eq('is_approved', true);

    const articlePages = (articles || []).map(article => ({
        url: `${SITE_URL}/${article.slug}`,
        lastModified: new Date(article.created_at),
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    return [...staticPages, ...categoryPages, ...articlePages];
}
