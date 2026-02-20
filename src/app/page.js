import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { supabase } from '../lib/supabase';
import ContactTools from '@/components/ContactTools';
import HeroParallaxScene from '@/components/HeroParallaxScene';
import { CONTACT, buildCallUrl, buildWhatsAppUrl } from '@/lib/contact';

export const revalidate = 60;

export const metadata = {
  title: 'BurungiHealth | Umuti w\'ukuri ku buzima bw\'imyororokere',
  description: 'Gira ubuzima bwiza buzira umuze. Shakisha imiti igezweho yo kongera igitsina, kuvura kurangiza vuba no gushimisha umukunzi wawe.',
}

export default async function Home() {
  let products = [];

  const orderedRes = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  if (orderedRes.error) {
    const fallbackRes = await supabase
      .from('products')
      .select('*')
      .limit(6);

    if (fallbackRes.error) {
      console.error('Homepage products query failed:', fallbackRes.error.message);
    } else {
      products = fallbackRes.data || [];
    }
  } else {
    products = orderedRes.data || [];
  }

  const heroWhatsAppUrl = buildWhatsAppUrl(
    CONTACT.primaryPhoneDigits,
    'Hello, I want help choosing the right product.'
  );

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <HeroParallaxScene />
        <div className={`container ${styles.heroContainer}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={`badge ${styles.fadeUp}`}>BurungiHealth</span>
              <h1 className={styles.title}>
                <span className={styles.fadeUpDelay1}>Ubuzima bwiza,</span>
                <br />
                <span className={styles.fadeUpDelay2}>Ikizere cyuzuye.</span>
              </h1>
              <p className={`${styles.subtitle} ${styles.fadeUpDelay3}`}>
                Shaka ibisubizo nyabyo ku bibazo by&apos;imyororokere. Gukira kurangiza vuba, kubura ubushake, cyangwa kongera igitsina byose birashoboka ukoresheje inyongeramusaruro zizewe nka Maxman.
              </p>
              <div className={`${styles.actions} ${styles.fadeUpDelay4}`}>
                <a href={heroWhatsAppUrl} className={styles.primaryBtn} target="_blank" rel="noreferrer">
                  Tuvugishe Kuri WhatsApp
                </a>
                <a href={CONTACT.address.mapUrl} className={styles.secondaryBtn} target="_blank" rel="noreferrer">
                  Reba Address
                </a>
              </div>
            </div>
            <ContactTools className={`${styles.heroContactCard} ${styles.fadeUpDelay4}`} />
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <h2 className={styles.sectionTitle}>Gura Ibyo Ukeneye</h2>
          <div className={styles.grid}>
            <Link href="/category/ibinini" className={styles.card}>
              <div className={styles.imgWrap}>
                <Image
                  src="https://www.arogga.com/_next/image?url=https%3A%2F%2Fcdn2.arogga.com%2FeyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtZWRpY2luZVwvNDRcLzQ0MjMxLU1heG1hbi1jOXhqLnBuZyIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6MTAwMCwiaGVpZ2h0IjoxMDAwLCJmaXQiOiJvdXRzaWRlIn0sIm92ZXJsYXlXaXRoIjp7ImJ1Y2tldCI6ImFyb2dnYSIsImtleSI6Im1pc2NcL3dtLnBuZyIsImFscGhhIjo5MH19fQ%3D%3D&w=1280&q=75"
                  alt="Ibinini"
                  fill
                  className={styles.img}
                />
              </div>
              <div className={styles.cardContent}>
                <h3>Ibinini (Capsules)</h3>
                <p>Ibinini byizewe mu kugarura imbaraga</p>
              </div>
            </Link>
            <Link href="/category/amavuta" className={styles.card}>
              <div className={styles.imgWrap}>
                <Image
                  src="https://m.media-amazon.com/images/I/71fl3xZuzwL._AC_SL1500_.jpg"
                  alt="Amavuta"
                  fill
                  className={styles.img}
                />
              </div>
              <div className={styles.cardContent}>
                <h3>Amavuta (Creams)</h3>
                <p>Amavuta yo kongera ingufu no gukomera</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {products && products.length > 0 && (
        <section className={styles.featuredSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Ibicuruzwa Byatoranyijwe</h2>
            <div className={styles.productGrid}>
              {products.map((product) => (
                <article key={product.id} className={styles.productCard}>
                  <span className={styles.productBadge}>Fast Delivery</span>
                  <div className={styles.productImgWrap}>
                    <Image
                      src={product.image_url || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      fill
                      className={styles.img}
                    />
                  </div>
                  <div className={styles.productInfo}>
                    <p className={styles.productMeta}>Discreet packaging available</p>
                    <h3 className={styles.productName}>{product.name}</h3>
                    {product.problems_solved && (
                      <div className={styles.problemChips}>
                        {product.problems_solved.split(',').map((p) => p.trim()).filter(Boolean).map((p) => (
                          <span key={p} className={styles.problemChip}>+ {p}</span>
                        ))}
                      </div>
                    )}
                    <p className={styles.productPrice}>
                      {product.price != null ? Number(product.price).toLocaleString() : 'Ask for Price'} {product.price != null ? 'RWF' : ''}
                    </p>
                    <div className={styles.productActions}>
                      <a
                        href={buildWhatsAppUrl(CONTACT.primaryPhoneDigits, `Hello, I want to order: ${product.name}`)}
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
                    <p className={styles.productAddress}>{CONTACT.address.title}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
