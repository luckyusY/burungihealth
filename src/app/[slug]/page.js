import { generateCategoryCombos, getComboData, getRelatedArticles, formatSlugTitle } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import ContactTools from '@/components/ContactTools';
import { CONTACT, buildCallUrl, buildWhatsAppUrl } from '@/lib/contact';

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

    const { category, tag, location, product } = data;
    const title = `${product.name} for ${tag.name} in ${location.name} | BurungiHealth`;
    const synonymPart = tag.synonyms ? ` Also known as: ${tag.synonyms}.` : '';
    const description = `Looking for ${tag.name.toLowerCase()} help in ${location.name}? ${product.name} from BurungiHealth: trusted, fast, discreet delivery across Rwanda.${synonymPart}`;

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

    if (!data) notFound();

    const { department, category, tag, location, product, products, article } = data;
    const related = await getRelatedArticles(slug, tag.slug, product.slug, 5);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                    { '@type': 'ListItem', position: 2, name: category.name, item: `${SITE_URL}/category/${category.slug}` },
                    { '@type': 'ListItem', position: 3, name: `${tag.name} in ${location.name}` },
                ]
            },
            products.length > 0 && {
                '@type': 'ItemList',
                itemListElement: products.map((productItem, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    item: {
                        '@type': 'Product',
                        name: productItem.name,
                        image: productItem.image_url || '',
                        description: `Best ${tag.name.toLowerCase()} solution in ${location.name}.`,
                        offers: {
                            '@type': 'Offer',
                            price: productItem.price || 0,
                            priceCurrency: 'RWF',
                            availability: 'https://schema.org/InStock',
                            seller: { '@type': 'Organization', name: 'BurungiHealth' }
                        }
                    }
                }))
            }
        ].filter(Boolean)
    };

    const headerOrderUrl = buildWhatsAppUrl(
        CONTACT.primaryPhoneDigits,
        `Hello, I want ${product.name} for ${tag.name} in ${location.name}.`
    );

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <main className={styles.main}>

                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                    <div className="container">
                        <Link href="/">Home</Link>
                        <span className={styles.breadSep}>{'>'}</span>
                        <Link href={`/category/${category.slug}`}>{category.name}</Link>
                        <span className={styles.breadSep}>{'>'}</span>
                        <span>{tag.name} in {location.name}</span>
                    </div>
                </nav>

                <header className={styles.header}>
                    <div className={`container ${styles.headerInner}`}>
                        <div>
                            <span className="badge">{department.name}</span>
                            <h1 className={styles.title}>
                                <span className={styles.highlight}>{product.name}</span><br />
                                for {tag.name} in <span className={styles.highlight}>{location.name}</span>
                            </h1>
                            <p className={styles.description}>
                                Looking for a trusted <strong>{tag.name.toLowerCase()}</strong> solution in <strong>{location.name}</strong>?
                                <strong> {product.name}</strong> from BurungiHealth offers discreet delivery and quick support.
                            </p>
                            {tag.synonyms && (
                                <p className={styles.synonyms}>
                                    Also searched as: {tag.synonyms}
                                </p>
                            )}
                            <div className={styles.headerActions}>
                                <a href={headerOrderUrl} target="_blank" rel="noreferrer" className={styles.headerCta}>
                                    Order on WhatsApp - {CONTACT.primaryPhoneDisplay}
                                </a>
                                <a href={CONTACT.address.mapUrl} target="_blank" rel="noreferrer" className={styles.headerGhost}>
                                    View Address
                                </a>
                            </div>
                        </div>
                        <ContactTools compact className={styles.headerContact} productName={product.name} />
                    </div>
                </header>

                <section className={`section ${styles.productsSection}`}>
                    <div className="container">
                        <h2 className={styles.sectionTitle}>
                            {category.name} for {tag.name}
                        </h2>
                        <div className={styles.grid}>
                            {products.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>
                                    Contact us via WhatsApp for recommendations for {tag.name} in {location.name}.
                                </p>
                            ) : (
                                products.map((item) => (
                                    <article key={item.id} className={styles.productCard}>
                                        <div className={styles.imageWrap}>
                                            <Image
                                                src={item.image_url || 'https://via.placeholder.com/400x400?text=BurungiHealth'}
                                                alt={item.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className={styles.productImg}
                                            />
                                        </div>
                                        <div className={styles.productInfo}>
                                            <h3 className={styles.productName}>{item.name}</h3>
                                            {item.problems_solved && (
                                                <div className={styles.problemChips}>
                                                    {item.problems_solved.split(',').map((p) => p.trim()).filter(Boolean).map((p) => (
                                                        <span key={p} className={styles.problemChip}>+ {p}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className={styles.metaRow}>
                                                <span className={styles.price}>
                                                    {item.price != null ? Number(item.price).toLocaleString() : 'Ask'} {item.price != null ? 'RWF' : ''}
                                                </span>
                                            </div>
                                            <div className={styles.productActions}>
                                                <a
                                                    href={buildWhatsAppUrl(CONTACT.primaryPhoneDigits, `Hello, I want to order: ${item.name}`)}
                                                    className={styles.buyBtn}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Buy on WhatsApp
                                                </a>
                                                <a href={buildCallUrl(CONTACT.primaryPhoneDigits)} className={styles.callBtn}>
                                                    Call
                                                </a>
                                            </div>
                                            <p className={styles.productPhone}>{CONTACT.primaryPhoneDisplay}</p>
                                            <p className={styles.productAddress}>{CONTACT.address.title}</p>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {article && (
                    <section className={`section ${styles.seoContent}`}>
                        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
                            <h2>Why BurungiHealth for {tag.name} in {location.name}?</h2>
                            <p>{article}</p>
                        </div>
                    </section>
                )}

                {related.length > 0 && (
                    <section className={styles.relatedSection}>
                        <div className="container">
                            <h2 className={styles.relatedTitle}>Related Guides</h2>
                            <div className={styles.relatedGrid}>
                                {related.map((r) => (
                                    <Link key={r.slug} href={`/${r.slug}`} className={styles.relatedCard}>
                                        {formatSlugTitle(r.slug)}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <div className="container" style={{ padding: '0 1rem 3rem', textAlign: 'center' }}>
                    <Link href={`/category/${category.slug}`} className={styles.backLink}>
                        {'<'} Browse all {category.name}
                    </Link>
                </div>

            </main>
        </>
    );
}
