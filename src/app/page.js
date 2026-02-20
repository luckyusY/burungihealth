import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export const metadata = {
  title: 'BurungiHealth | Umuti w\'ukuri ku buzima bw\'imyororokere',
  description: 'Gira ubuzima bwiza buzira umuze. Shakisha imiti igezweho yo kongera igitsina, kuvura kurangiza vuba no gushimisha umukunzi wawe.',
}

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={`container ${styles.heroContainer}`}>
          <div className={styles.heroContent}>
            <span className={`badge ${styles.fadeUp}`}>BurungiHealth</span>
            <h1 className={styles.title}>
              <span className={styles.fadeUpDelay1}>Ubuzima bwiza,</span>
              <br />
              <span className={styles.fadeUpDelay2}>Ikizere cyuzuye.</span>
            </h1>
            <p className={`${styles.subtitle} ${styles.fadeUpDelay3}`}>
              Shaka ibisubizo nyabyo ku bibazo by'imyororokere. Gukira kurangiza vuba, kubura ubushake, cyangwa kongera igitsina byose birashoboka ukoresheje inyongeramusaruro zizewe nka Maxman.
            </p>
            <div className={`${styles.actions} ${styles.fadeUpDelay4}`}>
              <Link href="/mens-health---ibinini---kurangiza-vuba-in-kigali" className={styles.primaryBtn}>
                Reba Urugero Rw'Umuti (Demo)
              </Link>
            </div>
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
                <p>Inyongeramusaruro zizewe cyane vuba</p>
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
                <p>Amavuta akoreshwa inyuma</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
