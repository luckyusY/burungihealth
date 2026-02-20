'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import styles from './admin.module.css';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('seo'); // 'seo' or 'products'
    const [articles, setArticles] = useState([]);
    const [products, setProducts] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    async function fetchAllData() {
        setLoading(true);
        const [artRes, prodRes, deptRes, catRes] = await Promise.all([
            supabase.from('seo_articles').select('*').order('created_at', { ascending: false }),
            supabase.from('products').select('*').order('name', { ascending: true }),
            supabase.from('departments').select('*'),
            supabase.from('categories').select('*')
        ]);

        if (artRes.error) setError(artRes.error.message);
        setArticles(artRes.data || []);
        setProducts(prodRes.data || []);
        setDepartments(deptRes.data || []);
        setCategories(catRes.data || []);
        setLoading(false);
    }

    // --- SEO Article Functions ---
    async function toggleApproval(slug, currentState) {
        setSaving(slug);
        const { error } = await supabase.from('seo_articles').update({ is_approved: !currentState }).eq('slug', slug);
        if (error) alert(error.message);
        else setArticles(prev => prev.map(a => a.slug === slug ? { ...a, is_approved: !currentState } : a));
        setSaving(null);
    }

    async function saveArticleEdit(slug, newContent) {
        setSaving(slug);
        const { error } = await supabase.from('seo_articles').update({ content: newContent }).eq('slug', slug);
        if (error) alert(error.message);
        setSaving(null);
    }

    // --- Product Functions ---
    async function saveProductEdit(id, field, value) {
        setSaving(id);
        const { error } = await supabase.from('products').update({ [field]: value }).eq('id', id);
        if (error) alert(error.message);
        setSaving(null);
    }

    if (loading) return <div className={styles.loading}>Muri gutegerezwa...</div>;

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1>BurungiHealth Admin Control</h1>
                <div className={styles.tabs}>
                    <button
                        className={activeTab === 'seo' ? styles.activeTab : styles.tab}
                        onClick={() => setActiveTab('seo')}
                    >
                        SEO Articles ({articles.length})
                    </button>
                    <button
                        className={activeTab === 'products' ? styles.activeTab : styles.tab}
                        onClick={() => setActiveTab('products')}
                    >
                        Product Management ({products.length})
                    </button>
                </div>
            </header>

            {error && <div className={styles.error}>{error}</div>}

            {activeTab === 'seo' && (
                <div className={styles.view}>
                    <div className={styles.stats}>
                        {articles.filter(a => a.is_approved).length} Live / {articles.filter(a => !a.is_approved).length} Pending
                    </div>
                    <div className={styles.list}>
                        {articles.map((article) => (
                            <div key={article.slug} className={`${styles.card} ${article.is_approved ? styles.approved : styles.pending}`}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.slug}>{article.slug}</h3>
                                    <div className={styles.badges}>
                                        {article.is_approved ? <span className={styles.badgeLive}>LIVE</span> : <span className={styles.badgePending}>PENDING</span>}
                                    </div>
                                </div>
                                <textarea
                                    className={styles.editor}
                                    defaultValue={article.content}
                                    onBlur={(e) => saveArticleEdit(article.slug, e.target.value)}
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
                </div>
            )}

            {activeTab === 'products' && (
                <div className={styles.view}>
                    <div className={styles.list}>
                        {products.map((product) => (
                            <div key={product.id} className={styles.card}>
                                <div className={styles.prodRow}>
                                    <div className={styles.fieldGroup}>
                                        <label>Product Name</label>
                                        <input
                                            defaultValue={product.name}
                                            onBlur={(e) => saveProductEdit(product.id, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label>Slug (Unique ID)</label>
                                        <input
                                            defaultValue={product.id}
                                            onBlur={(e) => saveProductEdit(product.id, 'id', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label>Price (RWF)</label>
                                        <input
                                            type="number"
                                            defaultValue={product.price}
                                            onBlur={(e) => saveProductEdit(product.id, 'price', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label>AI Context (What should the story mention about this product?)</label>
                                    <textarea
                                        className={styles.miniEditor}
                                        defaultValue={product.ai_context}
                                        onBlur={(e) => saveProductEdit(product.id, 'ai_context', e.target.value)}
                                        placeholder="e.g. Focus on natural ingredients and zero side effects..."
                                    />
                                </div>

                                <div className={styles.prodRow}>
                                    <div className={styles.fieldGroup}>
                                        <label>Department</label>
                                        <select
                                            defaultValue={product.department_id}
                                            onChange={(e) => saveProductEdit(product.id, 'department_id', e.target.value)}
                                        >
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label>Category</label>
                                        <select
                                            defaultValue={product.category_id}
                                            onChange={(e) => saveProductEdit(product.id, 'category_id', e.target.value)}
                                        >
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}
