import { generateCategoryCombos, getComboData } from '@/lib/data';
import Image from 'next/image';
import styles from './page.module.css';

export const revalidate = 60; // Regenerate page in background every 60s

// 1. THIS IS THE MAGIC: It tells Next.js to pre-build all these URL combinations at build time
export async function generateStaticParams() {
    const combos = await generateCategoryCombos();
    return combos.map((combo) => ({
        slug: combo.slug,
    }));
}

// 2. THIS IS THE SEO MAGIC: Generate dynamic meta tags for each absolute page combo
// Optimized for Kinyarwanda search traffic
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const data = await getComboData(slug);

    if (!data) {
        return {
            title: 'Not Found',
        }
    }

    const { department, category, tag, location } = data;
    const title = `Umuti mwiza wo ${tag.name} - Ku kibazo cyo ${tag.name} muri ${location.name} | BurungiHealth`;
    const description = `Ese ufite ikibazo cyangwa ushaka ${tag.name.toLowerCase()}? Shakisha umuti wizewe ukorwa nka ${category.name.toLowerCase()} uza kugufasha byihuse muri ${location.name}.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
        },
        alternates: {
            canonical: `https://imbare-seo.demo.com/${slug}`,
        }
    };
}

// 3. THE PAGE COMPONENT
export default async function ProgrammaticPage({ params }) {
    const { slug } = await params;
    const data = await getComboData(slug);

    if (!data) {
        return <h1>404 - Page Not Found</h1>;
    }

    const { department, category, tag, location, products, article } = data;

    // 4. JSON-LD SCHEMA FOR GOOGLE RICH SNIPPETS
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'itemListElement': products.map((product, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'item': {
                '@type': 'Product',
                'name': product.name,
                'brand': {
                    '@type': 'Brand',
                    'name': product.brand
                },
                'image': product.image,
                'description': `Umuti mwiza wo ${tag.name.toLowerCase()} muri ${location.name}.`,
                'offers': {
                    '@type': 'Offer',
                    'price': product.price,
                    'priceCurrency': product.currency
                },
                'aggregateRating': {
                    '@type': 'AggregateRating',
                    'ratingValue': product.rating,
                    'reviewCount': product.reviews
                }
            }
        }))
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <main className={styles.main}>
                {/* Dynamic Header */}
                <header className={styles.header}>
                    <div className="container" style={{ padding: '0 1rem' }}>
                        <span className="badge">BurungiHealth</span>
                        <h1 className={styles.title}>
                            Umuti wo <span className={styles.highlight}>{tag.name}</span> <br />
                            <span className={styles.highlight}>{location.name}</span>
                        </h1>
                        <p className={styles.description}>
                            Ese ushaka igisubizo cyizewe cyangwa umuti wa <strong>{tag.name.toLowerCase()}</strong> muri <strong>{location.name}</strong>? Twabakusanyirije ibisubizo byizewe
                            biboneka nk' <strong>{category.name.toLowerCase()}</strong> mu gice cya {department.name}. Menya byinshi uyu munsi!
                        </p>
                    </div>
                </header>

                {/* Dynamic Product Roster */}
                <section className={`section ${styles.productsSection}`}>
                    <div className="container" style={{ padding: '0 1rem' }}>
                        <div className={styles.grid}>
                            {products.length === 0 ? (
                                <p>Nta bicuruzwa bihari kuri aya mabwiriza ubu. Garuka vuba!</p>
                            ) : (
                                products.map(product => (
                                    <article key={product.id} className={styles.productCard}>
                                        <div className={styles.imageWrap}>
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className={styles.productImg}
                                            />
                                        </div>
                                        <div className={styles.productInfo}>
                                            <span className={styles.brand}>{product.brand}</span>
                                            <h3 className={styles.productName}>{product.name}</h3>
                                            <div className="star-rating">
                                                ★★★★★ <span>({product.reviews.toLocaleString()})</span>
                                            </div>
                                            <div className={styles.metaRow}>
                                                <span className={styles.price}>{product.price.toLocaleString()} {product.currency}</span>
                                                <button className={styles.buyBtn}>Gura Ubu</button>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Programmatic SEO Content block */}
                {article && (
                    <section className={`section ${styles.seoContent}`}>
                        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem', lineHeight: '1.8' }}>
                            <h2>Impamvu imiti yo {tag.name} ari nziza</h2>
                            <p>{article}</p>
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
