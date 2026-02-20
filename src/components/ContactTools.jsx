"use client";

import { useMemo, useState } from "react";
import styles from "./contact-tools.module.css";
import { CONTACT, buildCallUrl, buildWhatsAppUrl, getAddressText } from "@/lib/contact";

const DEFAULT_MESSAGE = "Hello, I want to order from BurungiHealth.";

export default function ContactTools({ productName = "", compact = false, className = "" }) {
    const [copyState, setCopyState] = useState("idle");
    const whatsappUrl = useMemo(() => {
        const message = productName ? `Hello, I want to order: ${productName}` : DEFAULT_MESSAGE;
        return buildWhatsAppUrl(CONTACT.primaryPhoneDigits, message);
    }, [productName]);

    async function copyAddress() {
        try {
            await navigator.clipboard.writeText(getAddressText());
            setCopyState("copied");
            window.setTimeout(() => setCopyState("idle"), 1800);
        } catch {
            setCopyState("error");
            window.setTimeout(() => setCopyState("idle"), 1800);
        }
    }

    return (
        <aside className={`${styles.panel} ${compact ? styles.compact : ""} ${className}`.trim()} aria-label="Contact details">
            <p className={styles.eyebrow}>Contact</p>
            <h3 className={styles.title}>{CONTACT.address.title}</h3>
            <p className={styles.addressLine}>{CONTACT.address.line1}</p>
            <p className={styles.addressSubline}>{CONTACT.address.line2}</p>
            <a className={styles.phone} href={buildCallUrl(CONTACT.primaryPhoneDigits)}>
                {CONTACT.primaryPhoneDisplay}
            </a>
            <div className={styles.actions}>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.primaryAction}>
                    WhatsApp
                </a>
                <a href={CONTACT.address.mapUrl} target="_blank" rel="noreferrer" className={styles.secondaryAction}>
                    Open Maps
                </a>
                <button type="button" onClick={copyAddress} className={styles.secondaryAction}>
                    {copyState === "copied" ? "Copied" : copyState === "error" ? "Retry" : "Copy Address"}
                </button>
            </div>
        </aside>
    );
}
