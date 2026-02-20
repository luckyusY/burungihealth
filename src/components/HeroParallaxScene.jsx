"use client";

import { useEffect, useRef } from "react";
import styles from "./hero-parallax-scene.module.css";

export default function HeroParallaxScene() {
    const sceneRef = useRef(null);

    useEffect(() => {
        const node = sceneRef.current;
        if (!node) return;

        let rafId = 0;
        const paint = () => {
            rafId = 0;
            node.style.setProperty("--scroll", `${window.scrollY || 0}`);
        };

        const onScroll = () => {
            if (rafId) return;
            rafId = window.requestAnimationFrame(paint);
        };

        paint();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (rafId) window.cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <div ref={sceneRef} className={styles.scene} aria-hidden="true">
            <div className={`${styles.layer} ${styles.layerBack}`} />
            <div className={`${styles.layer} ${styles.layerMid}`} />
            <div className={`${styles.layer} ${styles.layerFront}`} />
            <div className={styles.gridVeil} />
            <div className={styles.vignette} />
        </div>
    );
}
