import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import mainStyles from '../../page.module.css';
import { getCategoryData } from '../../../lib/data';
import { supabase } from '../../../lib/supabase';
import ContactTools from '@/components/ContactTools';
import { CONTACT, buildCallUrl, buildWhatsAppUrl } from '@/lib/contact';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://burungihealth.vercel.app';

export async function generateStaticParams() {
    const { data: categories } = await supabase.from('categories').select('slug');
    return categories ? categories.map((cat) => ({ slug: cat.slug })) : [];
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const data = await getCategoryData(slug);

    if (!data) return { title: 'Not Found' };

    const { category } = data;
    const title = `${category.name} | BurungiHealth Rwanda`;
    const description = `Shop ${category.name} from BurungiHealth. Trusted health products with fast delivery across Rwanda. Order via WhatsApp ${CONTACT.primaryPhoneDisplay}.`;

    return {
        title,
        description,
        alternates: { canonical: `${SITE_URL}/category/${slug}` },
        openGraph: { title, description, url: `${SITE_URL}/category/${slug}` },
    };
}

export default async function CategoryPage({ params }) {
    const { slug } = await params;
    const data = await getCategoryData(slug);

    if (!data) notFound();

    const { category, department, products, tags, locations } = data;
    const firstProductWithSlug = products.find((p) => p.slug);
    const deptSlug = department?.slug || category.department_id;

    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: category.name, item: `${SITE_URL}/category/${slug}` },
        ]
    };

    const categoryOrderUrl = buildWhatsAppUrl(
        CONTACT.primaryPhoneDigits,
        `Hello, I want to order from the ${category.name} category.`
    );

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <main className={mainStyles.main}>

                <nav style={{ padding: '0.75rem 0', background: '#141414', borderBottom: '1px solid #222', fontSize: '0.85rem', color: '#aaa' }}>
                    <div className="container">
                        <Link href="/" style={{ color: '#d4af37' }}>Home</Link>
                        <span style={{ margin: '0 0.5rem', opacity: 0.4 }}>{'>'}</span>
                        <span>{category.name}</span>
                    </div>
                </nav>

                <header className={mainStyles.hero} style={{ minHeight: '48vh' }}>
                    <div className={`container ${mainStyles.heroContainer}`}>
                        <div className={mainStyles.heroGrid}>
                            <div className={mainStyles.heroContent}>
                                <h1 className={mainStyles.title} style={{ fontSize: 'clamp(2rem, 6vw, 3.7rem)' }}>
                                    <span className={mainStyles.fadeUpDelay1}>{category.name}</span>
                                </h1>
                                <p className={`${mainStyles.subtitle} ${mainStyles.fadeUpDelay3}`}>
                                    {category.description || `Shop our ${category.name.toLowerCase()} range: trusted products and fast delivery across Rwanda.`}
                                </p>
                                <div className={mainStyles.actions}>
                                    <a
                                        href={categoryOrderUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={mainStyles.primaryBtn}
                                    >
                                        Order via WhatsApp
                                    </a>
                                    <a
                                        href={CONTACT.address.mapUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={mainStyles.secondaryBtn}
                                    >
                                        View Address
                                    </a>
                                </div>
                            </div>
                            <ContactTools compact className={mainStyles.heroContactCard} />
                        </div>
                    </div>
                </header>

                <section className="section" style={{ background: '#0a0a0a' }}>
                    <div className="container" style={{ padding: '0 1rem' }}>
                        <h2 style={{ marginBottom: '1.4rem', fontSize: '1.6rem' }}>
                            {products.length} Product{products.length !== 1 ? 's' : ''} in {category.name}
                        </h2>
                        <div className={mainStyles.productGrid}>
                            {products.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.7)' }}>No products in this category yet. Contact us via WhatsApp.</p>
                            ) : (
                                products.map((product) => (
                                    <article key={product.id} className={mainStyles.productCard}>
                                        <span className={mainStyles.productBadge}>Fast Delivery</span>
                                        <div className={mainStyles.productImgWrap}>
                                            <Image
                                                src={product.image_url || 'https://via.placeholder.com/400x400?text=BurungiHealth'}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className={mainStyles.img}
                                                style={{ objectFit: 'contain', padding: '1rem' }}
                                            />
                                        </div>
                                        <div className={mainStyles.productInfo}>
                                            <p className={mainStyles.productMeta}>Discreet packaging available</p>
                                            <h3 className={mainStyles.productName}>{product.name}</h3>
                                            {product.problems_solved && (
                                                <div className={mainStyles.problemChips}>
                                                    {product.problems_solved.split(',').map((p) => p.trim()).filter(Boolean).map((p) => (
                                                        <span key={p} className={mainStyles.problemChip}>+ {p}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <p className={mainStyles.productPrice}>
                                                {product.price != null ? Number(product.price).toLocaleString() : 'Ask for Price'} {product.price != null ? 'RWF' : ''}
                                            </p>
                                            <div className={mainStyles.productActions}>
                                                <a
                                                    href={buildWhatsAppUrl(CONTACT.primaryPhoneDigits, `Hello, I want to order: ${product.name}`)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={mainStyles.buyBtn}
                                                >
                                                    Buy on WhatsApp
                                                </a>
                                                <a href={buildCallUrl(CONTACT.primaryPhoneDigits)} className={mainStyles.callBtn}>
                                                    Call
                                                </a>
                                            </div>
                                            <p className={mainStyles.productAddress}>{CONTACT.address.title}</p>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {tags.length > 0 && locations.length > 0 && firstProductWithSlug && (
                    <section style={{ padding: '3rem 0', background: '#141414', borderTop: '1px solid #222' }}>
                        <div className="container" style={{ padding: '0 1rem' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                Related Health Guides
                            </h2>
                            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                Find condition-specific advice combining {category.name.toLowerCase()} with your location:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                {tags.slice(0, 4).flatMap((tag) =>
                                    locations.slice(0, 3).map((loc) => (
                                        <Link
                                            key={`${tag.slug}-${loc.slug}`}
                                            href={`/${deptSlug}---${slug}---${firstProductWithSlug.slug}---${tag.slug}-in-${loc.slug}`}
                                            style={{
                                                background: '#1a1a1a',
                                                border: '1px solid #333',
                                                borderRadius: '6px',
                                                padding: '0.45rem 0.85rem',
                                                fontSize: '0.82rem',
                                                color: '#aaa',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {tag.name} in {loc.name}
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>
                )}

                <div className="container" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                    <Link href="/" style={{ color: '#d4af37', fontWeight: 600 }}>{'<'} Back to Home</Link>
                </div>
            </main>
        </>
    );
}
