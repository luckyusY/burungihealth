'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import styles from './admin.module.css';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('seo'); // 'seo', 'products', or 'tools'
    const [articles, setArticles] = useState([]);
    const [products, setProducts] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);

    // New category state
    const [newCat, setNewCat] = useState({ name: '', slug: '', department_id: '' });
    const [genStatus, setGenStatus] = useState(null);

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

    async function deleteArticle(slug) {
        if (!confirm(`Delete this article?\n\n${slug}`)) return;
        setSaving(slug + '-del');
        const { error } = await supabase.from('seo_articles').delete().eq('slug', slug);
        if (error) alert(error.message);
        else setArticles(prev => prev.filter(a => a.slug !== slug));
        setSaving(null);
    }

    // --- Product Functions ---
    async function saveProductEdit(id, field, value) {
        setSaving(id);
        const { error } = await supabase.from('products').update({ [field]: value }).eq('id', id);
        if (error) alert(error.message);
        setSaving(null);
    }

    // --- Tool Functions ---
    async function addCategory() {
        if (!newCat.name || !newCat.slug || !newCat.department_id) {
            alert("Uzuza neza imyirondoro ya kategory!");
            return;
        }
        setSaving('new-cat');
        const { error } = await supabase.from('categories').insert([
            { id: newCat.slug, ...newCat }
        ]);
        if (error) alert(error.message);
        else {
            alert("Category yakuweho neza!");
            fetchAllData();
            setNewCat({ name: '', slug: '', department_id: '' });
        }
        setSaving(null);
    }

    async function triggerAI() {
        if (!confirm("Ushaka gutangira kwandika inkuru nshya ukoresheje AI?")) return;
        setGenStatus("Muri gutegura... (Bishobora gufata umunota)");
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                body: JSON.stringify({ secret: 'burungi-secure-gen' })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Twanditse inkuru ${data.count} nshya!`);
                fetchAllData();
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            alert("Request failed.");
        }
        setGenStatus(null);
    }

    if (loading) return <div className={styles.loading}>Muri gutegerezwa...</div>;

    const liveCount = articles.filter(a => a.is_approved).length;
    const pendingCount = articles.filter(a => !a.is_approved).length;

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <h1>BurungiHealth Admin</h1>
                    <button
                        className={styles.generateBtn}
                        onClick={triggerAI}
                        disabled={genStatus !== null}
                    >
                        {genStatus ? '⏳ ' + genStatus : '✦ Generate New Articles'}
                    </button>
                </div>

                {/* Prominent Stats Row */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard} onClick={() => setActiveTab('seo')}>
                        <span className={styles.statNum}>{articles.length}</span>
                        <span className={styles.statLabel}>Total Articles</span>
                    </div>
                    <div className={`${styles.statCard} ${styles.statLive}`} onClick={() => setActiveTab('seo')}>
                        <span className={styles.statNum}>{liveCount}</span>
                        <span className={styles.statLabel}>Live</span>
                    </div>
                    <div className={`${styles.statCard} ${styles.statPending}`} onClick={() => setActiveTab('seo')}>
                        <span className={styles.statNum}>{pendingCount}</span>
                        <span className={styles.statLabel}>Pending Review</span>
                    </div>
                    <div className={styles.statCard} onClick={() => setActiveTab('products')}>
                        <span className={styles.statNum}>{products.length}</span>
                        <span className={styles.statLabel}>Products</span>
                    </div>
                    <div className={styles.statCard} onClick={() => setActiveTab('tools')}>
                        <span className={styles.statNum}>{categories.length}</span>
                        <span className={styles.statLabel}>Categories</span>
                    </div>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={activeTab === 'seo' ? styles.activeTab : styles.tab}
                        onClick={() => setActiveTab('seo')}
                    >
                        SEO Articles
                    </button>
                    <button
                        className={activeTab === 'products' ? styles.activeTab : styles.tab}
                        onClick={() => setActiveTab('products')}
                    >
                        Products
                    </button>
                    <button
                        className={activeTab === 'tools' ? styles.activeTab : styles.tab}
                        onClick={() => setActiveTab('tools')}
                    >
                        + Add Category
                    </button>
                </div>
            </header>

            {error && <div className={styles.error}>{error}</div>}

            {activeTab === 'seo' && (
                <div className={styles.view}>
                    <div className={styles.seoMeta}>
                        <span className={styles.metaBadgeLive}>{liveCount} Live</span>
                        <span className={styles.metaBadgePending}>{pendingCount} Pending</span>
                        <span className={styles.metaNote}>Click an article's content to edit it, then click away to auto-save.</span>
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
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => deleteArticle(article.slug)}
                                        disabled={saving === article.slug + '-del'}
                                    >
                                        {saving === article.slug + '-del' ? 'Deleting...' : 'Delete'}
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

            {activeTab === 'tools' && (
                <div className={styles.view}>
                    <section className={styles.toolSection}>
                        <h2>Add New Category</h2>
                        <p>Create a new category. After adding it, run article generation so AI writes articles for this category.</p>
                        <div className={styles.prodRow}>
                            <div className={styles.fieldGroup}>
                                <label>Category Name</label>
                                <input
                                    value={newCat.name}
                                    onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                                    placeholder="e.g. Ifu ya Siporo"
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Slug (URL ID — no spaces)</label>
                                <input
                                    value={newCat.slug}
                                    onChange={(e) => setNewCat({ ...newCat, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                    placeholder="e.g. ifu-siporo"
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Department</label>
                                <select
                                    value={newCat.department_id}
                                    onChange={(e) => setNewCat({ ...newCat, department_id: e.target.value })}
                                >
                                    <option value="">Select Department...</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <button className={styles.approveBtn} onClick={addCategory} disabled={saving === 'new-cat'}>
                            {saving === 'new-cat' ? 'Saving...' : '+ Add Category'}
                        </button>
                    </section>

                    <section className={styles.toolSection}>
                        <h2>Existing Categories ({categories.length})</h2>
                        <div className={styles.catList}>
                            {categories.map(c => (
                                <div key={c.id} className={styles.catChip}>
                                    <span className={styles.catName}>{c.name}</span>
                                    <span className={styles.catSlug}>{c.id}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={styles.toolSection}>
                        <h2>Generate Articles (AI)</h2>
                        <p>AI will write new articles for all category/tag/location combinations that don't have content yet. New articles start as Pending — review them in the SEO Articles tab.</p>
                        <button
                            className={styles.generateBtn}
                            onClick={triggerAI}
                            disabled={genStatus !== null}
                        >
                            {genStatus || '✦ Generate New Articles'}
                        </button>
                    </section>
                </div>
            )}
        </main>
    );
}
