import Image from 'next/image';
import Link from 'next/link';
import mainStyles from '../../page.module.css'; // pointing to the home page styles for consistency
import { getCategoryData } from '../../../lib/data';

export const revalidate = 60; // Regenerate page in background every 60s

// Generate static params for all categories
import { supabase } from '../../../lib/supabase';
export async function generateStaticParams() {
    const { data: categories } = await supabase.from('categories').select('slug');
    return categories ? categories.map(cat => ({ slug: cat.slug })) : [];
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const data = await getCategoryData(slug);

    if (!data) return { title: 'Not Found' };

    return {
        title: `${data.category.name} | BurungiHealth`,
        description: `Gura ${data.category.name} nziza kandi zizewe. ${data.category.description}`,
    };
}

export default async function CategoryPage({ params }) {
    const { slug } = await params;
    const data = await getCategoryData(slug);

    if (!data) {
        return <h1>Category Not Found</h1>;
    }

    const { category, products } = data;

    return (
        <main className={mainStyles.main}>
            {/* Header */}
            <header className={mainStyles.hero} style={{ minHeight: '40vh' }}>
                <div className={`container ${mainStyles.heroContainer}`}>
                    <div className={mainStyles.heroContent}>
                        <h1 className={mainStyles.title} style={{ fontSize: '3.5rem' }}>
                            <span className={mainStyles.fadeUpDelay1}>{category.name}</span>
                        </h1>
                        <p className={`${mainStyles.subtitle} ${mainStyles.fadeUpDelay3}`}>
                            {category.description || `Reba urutonde rwacu rwiza rwa ${category.name.toLowerCase()}.`}
                        </p>
                    </div>
                </div>
            </header>

            {/* Product Grid */}
            <section className="section" style={{ background: '#0a0a0a' }}>
                <div className="container" style={{ padding: '0 1rem' }}>
                    <div className={mainStyles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {products.length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Nta bicuruzwa bihari muri iyi category ubu.</p>
                        ) : (
                            products.map(product => (
                                <article key={product.id} className={mainStyles.card} style={{ cursor: 'default' }}>
                                    <div className={mainStyles.imgWrap} style={{ height: '300px' }}>
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className={mainStyles.img}
                                            style={{ objectFit: 'contain', padding: '1rem' }}
                                        />
                                    </div>
                                    <div className={mainStyles.cardContent}>
                                        <span style={{ color: '#d4af37', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{product.brand}</span>
                                        <h3 style={{ margin: '0.5rem 0' }}>{product.name}</h3>
                                        <div style={{ color: '#d4af37', marginBottom: '1rem' }}>
                                            ★★★★★ <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>({product.reviews})</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{product.price.toLocaleString()} {product.currency}</span>
                                            <a
                                                href={`https://wa.me/250788888888?text=Muraho! Nshaka kugura ${product.name}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ background: '#d4af37', color: '#000', padding: '0.5rem 1rem', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}
                                            >Gura Ubu</a>
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
