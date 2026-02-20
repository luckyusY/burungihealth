export const CONTACT = {
    brand: "BurungiHealth",
    primaryPhoneDigits: "250798707702",
    primaryPhoneDisplay: "+250 798 707 702",
    phones: [
        { digits: "250798707702", display: "+250 798 707 702" },
        { digits: "250789448107", display: "+250 789 448 107" },
        { digits: "250780672644", display: "+250 780 672 644" },
    ],
    address: {
        title: "Kigali, Rwanda",
        line1: "Kigali, Rwanda",
        line2: "Fast, discreet delivery across all provinces",
        mapUrl: "https://maps.google.com/?q=Kigali%2C%20Rwanda",
    },
};

export function buildWhatsAppUrl(phoneDigits, message = "") {
    const suffix = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${phoneDigits}${suffix}`;
}

export function buildCallUrl(phoneDigits) {
    return `tel:+${phoneDigits}`;
}

export function getAddressText() {
    return `${CONTACT.address.line1}. ${CONTACT.address.line2}.`;
}
