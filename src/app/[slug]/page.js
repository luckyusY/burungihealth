import { generateCategoryCombos, getComboData, getRelatedArticles, formatSlugTitle } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://burungihealth.vercel.app';

export async function generateStaticParams() {
    const combos = await generateCategoryCombos();
    return combos.map((combo) => ({ slug: combo.slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const data = await getComboData(slug);

    if (!data) return { title: 'Not Found' };

    const { department, category, tag, location } = data;
    const title = `${tag.name} Solution in ${location.name} — ${category.name} | BurungiHealth`;
    const description = `Looking for the best ${tag.name.toLowerCase()} solution in ${location.name}? Discover trusted ${category.name.toLowerCase()} from BurungiHealth. Fast & discreet delivery across Rwanda.`;

    return {
        title,
        description,
        openGraph: { title, description, type: 'website', url: `${SITE_URL}/${slug}` },
        alternates: { canonical: `${SITE_URL}/${slug}` },
    };
}

export default async function ProgrammaticPage({ params }) {
    const { slug } = await params;
    const data = await getComboData(slug);

    if (!data) return <h1>404 - Page Not Found</h1>;

    const { department, category, tag, location, products, article } = data;
    const related = await getRelatedArticles(slug, tag.slug, category.slug, 5);

    // JSON-LD: BreadcrumbList + Product ItemList
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE_URL },
                    { '@type': 'ListItem', 'position': 2, 'name': category.name, 'item': `${SITE_URL}/category/${category.slug}` },
                    { '@type': 'ListItem', 'position': 3, 'name': `${tag.name} in ${location.name}` },
                ]
            },
            products.length > 0 && {
                '@type': 'ItemList',
                'itemListElement': products.map((product, i) => ({
                    '@type': 'ListItem',
                    'position': i + 1,
                    'item': {
                        '@type': 'Product',
                        'name': product.name,
                        'image': product.image_url || '',
                        'description': `Best ${tag.name.toLowerCase()} solution in ${location.name}.`,
                        'offers': {
                            '@type': 'Offer',
                            'price': product.price || 0,
                            'priceCurrency': 'RWF',
                            'availability': 'https://schema.org/InStock',
                            'seller': { '@type': 'Organization', 'name': 'BurungiHealth' }
                        }
                    }
                }))
            }
        ].filter(Boolean)
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <main className={styles.main}>

                {/* Breadcrumb */}
                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                    <div className="container">
                        <Link href="/">Home</Link>
                        <span className={styles.breadSep}>›</span>
                        <Link href={`/category/${category.slug}`}>{category.name}</Link>
                        <span className={styles.breadSep}>›</span>
                        <span>{tag.name} in {location.name}</span>
                    </div>
                </nav>

                {/* Header */}
                <header className={styles.header}>
                    <div className="container" style={{ padding: '0 1rem' }}>
                        <span className="badge">{department.name}</span>
                        <h1 className={styles.title}>
                            Best <span className={styles.highlight}>{tag.name}</span> Solution<br />
                            in <span className={styles.highlight}>{location.name}</span>
                        </h1>
                        <p className={styles.description}>
                            Looking for a trusted <strong>{tag.name.toLowerCase()}</strong> solution in <strong>{location.name}</strong>?
                            Explore our <strong>{category.name.toLowerCase()}</strong> range — fast delivery, 100% discreet.
                        </p>
                        <a href="https://wa.me/250798707702" target="_blank" rel="noreferrer" className={styles.headerCta}>
                            Order on WhatsApp — +250 798 707 702
                        </a>
                    </div>
                </header>

                {/* Products */}
                <section className={`section ${styles.productsSection}`}>
                    <div className="container" style={{ padding: '0 1rem' }}>
                        <h2 style={{ marginBottom: '2rem', fontSize: '1.75rem' }}>
                            {category.name} for {tag.name}
                        </h2>
                        <div className={styles.grid}>
                            {products.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>
                                    Contact us via WhatsApp for product recommendations for {tag.name} in {location.name}.
                                </p>
                            ) : (
                                products.map(product => (
                                    <article key={product.id} className={styles.productCard}>
                                        <div className={styles.imageWrap}>
                                            <Image
                                                src={product.image_url || 'https://via.placeholder.com/400x400?text=BurungiHealth'}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className={styles.productImg}
                                            />
                                        </div>
                                        <div className={styles.productInfo}>
                                            <h3 className={styles.productName}>{product.name}</h3>
                                            <div className={styles.metaRow}>
                                                <span className={styles.price}>
                                                    {product.price != null ? Number(product.price).toLocaleString() : 'Ask'} RWF
                                                </span>
                                                <a
                                                    href={`https://wa.me/250798707702?text=Hello, I want to order: ${encodeURIComponent(product.name)}`}
                                                    className={styles.buyBtn}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Buy Now
                                                </a>
                                            </div>
                                            <p className={styles.productPhone}>📞 +250 798 707 702</p>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* SEO Article */}
                {article && (
                    <section className={`section ${styles.seoContent}`}>
                        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem', lineHeight: '1.8' }}>
                            <h2>Why BurungiHealth for {tag.name} in {location.name}?</h2>
                            <p>{article}</p>
                        </div>
                    </section>
                )}

                {/* Internal Links — Related Pages */}
                {related.length > 0 && (
                    <section className={styles.relatedSection}>
                        <div className="container" style={{ padding: '0 1rem' }}>
                            <h2 className={styles.relatedTitle}>Related Guides</h2>
                            <div className={styles.relatedGrid}>
                                {related.map(r => (
                                    <Link key={r.slug} href={`/${r.slug}`} className={styles.relatedCard}>
                                        {formatSlugTitle(r.slug)}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Back to category */}
                <div className="container" style={{ padding: '0 1rem 3rem', textAlign: 'center' }}>
                    <Link href={`/category/${category.slug}`} className={styles.backLink}>
                        ← Browse all {category.name}
                    </Link>
                </div>

            </main>
        </>
    );
}
