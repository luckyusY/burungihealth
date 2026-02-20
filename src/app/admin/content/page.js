'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import styles from './admin.module.css';

export default function AdminContentPage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchArticles();
    }, []);

    async function fetchArticles() {
        setLoading(true);
        const { data, error } = await supabase
            .from('seo_articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            setError(error.message);
        } else {
            setArticles(data || []);
        }
        setLoading(false);
    }

    async function toggleApproval(slug, currentState) {
        setSaving(slug);
        const { error } = await supabase
            .from('seo_articles')
            .update({ is_approved: !currentState })
            .eq('slug', slug);

        if (error) {
            alert("Error: " + error.message);
        } else {
            setArticles(prev => prev.map(a =>
                a.slug === slug ? { ...a, is_approved: !currentState } : a
            ));
        }
        setSaving(null);
    }

    async function saveEdit(slug, newContent) {
        setSaving(slug);
        const { error } = await supabase
            .from('seo_articles')
            .update({ content: newContent })
            .eq('slug', slug);

        if (error) {
            alert("Error saving: " + error.message);
        } else {
            alert("Saved successfully!");
        }
        setSaving(null);
    }

    if (loading) return <div className={styles.loading}>Muri gutegerezwa...</div>;

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1>Admin: Kinyarwanda Content Review</h1>
                <p>Edit and Approve AI-generated stories before they go live.</p>
            </header>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.stats}>
                Found {articles.length} total articles. ({articles.filter(a => a.is_approved).length} Live / {articles.filter(a => !a.is_approved).length} Pending)
            </div>

            <div className={styles.list}>
                {articles.map((article) => (
                    <div key={article.slug} className={`${styles.card} ${article.is_approved ? styles.approved : styles.pending}`}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.slug}>{article.slug}</h3>
                            <div className={styles.badges}>
                                {article.is_approved ?
                                    <span className={styles.badgeLive}>LIVE</span> :
                                    <span className={styles.badgePending}>PENDING</span>
                                }
                            </div>
                        </div>

                        <textarea
                            className={styles.editor}
                            defaultValue={article.content}
                            onBlur={(e) => {
                                if (e.target.value !== article.content) {
                                    saveEdit(article.slug, e.target.value);
                                }
                            }}
                        />

                        <div className={styles.controls}>
                            <button
                                className={styles.approveBtn}
                                onClick={() => toggleApproval(article.slug, article.is_approved)}
                                disabled={saving === article.slug}
                            >
                                {saving === article.slug ? 'Saving...' : (article.is_approved ? 'Unapprove' : 'Approve & Go Live')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
