'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import styles from './admin.module.css';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('seo');
    const [articles, setArticles] = useState([]);
    const [products, setProducts] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [locations, setLocations] = useState([]);

    const [newCat, setNewCat] = useState({ name: '', slug: '', department_id: '' });
    const [newTag, setNewTag] = useState({ name: '', slug: '' });
    const [newLoc, setNewLoc] = useState({ name: '', slug: '' });
    const [newDept, setNewDept] = useState({ name: '', slug: '' });
    const [genStatus, setGenStatus] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => { fetchAllData(); }, []);

    async function fetchAllData() {
        setLoading(true);
        const [artRes, prodRes, deptRes, catRes, tagRes, locRes] = await Promise.all([
            supabase.from('seo_articles').select('*').order('created_at', { ascending: false }),
            supabase.from('products').select('*').order('name', { ascending: true }),
            supabase.from('departments').select('*').order('name'),
            supabase.from('categories').select('*').order('name'),
            supabase.from('tags').select('*').order('name'),
            supabase.from('locations').select('*').order('name'),
        ]);

        if (artRes.error) setError(artRes.error.message);
        setArticles(artRes.data || []);
        setProducts(prodRes.data || []);
        setDepartments(deptRes.data || []);
        setCategories(catRes.data || []);
        setTags(tagRes.data || []);
        setLocations(locRes.data || []);
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

    // --- Generic add helpers ---
    async function addRow(table, row, stateKey, resetFn, label) {
        if (!row.name || !row.slug) { alert(`Enter a name and slug for the ${label}.`); return; }
        setSaving('add-' + table);
        const { error } = await supabase.from(table).insert([{ id: row.slug, ...row }]);
        if (error) alert(error.message);
        else { fetchAllData(); resetFn(); }
        setSaving(null);
    }

    async function deleteRow(table, id, setState) {
        if (!confirm(`Delete this entry: ${id}?`)) return;
        setSaving('del-' + id);
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) alert(error.message);
        else setState(prev => prev.filter(r => r.id !== id));
        setSaving(null);
    }

    async function triggerAI() {
        if (!confirm("Start generating new AI articles for all missing combinations?")) return;
        setGenStatus("Working... (may take a minute)");
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                body: JSON.stringify({ secret: 'burungi-secure-gen' })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Generated ${data.count} new articles!`);
                fetchAllData();
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            alert("Request failed.");
        }
        setGenStatus(null);
    }

    if (loading) return <div className={styles.loading}>Loading...</div>;

    const liveCount = articles.filter(a => a.is_approved).length;
    const pendingCount = articles.filter(a => !a.is_approved).length;

    // How many combinations will AI generate: dept×cat×tag×loc
    const combinations = departments.reduce((acc, dept) => {
        const deptCats = categories.filter(c => c.department_id === dept.id);
        return acc + deptCats.length * tags.length * locations.length;
    }, 0);

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
                        <span className={styles.statLabel}>Pending</span>
                    </div>
                    <div className={styles.statCard} onClick={() => setActiveTab('products')}>
                        <span className={styles.statNum}>{products.length}</span>
                        <span className={styles.statLabel}>Products</span>
                    </div>
                    <div className={styles.statCard} onClick={() => setActiveTab('data')}>
                        <span className={styles.statNum}>{tags.length}</span>
                        <span className={styles.statLabel}>Keywords</span>
                    </div>
                    <div className={styles.statCard} onClick={() => setActiveTab('data')}>
                        <span className={styles.statNum}>{locations.length}</span>
                        <span className={styles.statLabel}>Locations</span>
                    </div>
                    <div className={`${styles.statCard} ${styles.statGold}`} onClick={() => setActiveTab('data')}>
                        <span className={styles.statNum}>{combinations}</span>
                        <span className={styles.statLabel}>Possible Articles</span>
                    </div>
                </div>

                <div className={styles.tabs}>
                    <button className={activeTab === 'seo' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('seo')}>
                        SEO Articles
                    </button>
                    <button className={activeTab === 'products' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('products')}>
                        Products
                    </button>
                    <button className={activeTab === 'data' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('data')}>
                        SEO Data (Keywords, Locations, Categories)
                    </button>
                </div>
            </header>

            {error && <div className={styles.error}>{error}</div>}

            {/* ─── SEO ARTICLES TAB ─── */}
            {activeTab === 'seo' && (
                <div className={styles.view}>
                    <div className={styles.seoMeta}>
                        <span className={styles.metaBadgeLive}>{liveCount} Live</span>
                        <span className={styles.metaBadgePending}>{pendingCount} Pending</span>
                        <span className={styles.metaNote}>Click content to edit, click away to auto-save.</span>
                    </div>
                    <div className={styles.list}>
                        {articles.map((article) => (
                            <div key={article.slug} className={`${styles.card} ${article.is_approved ? styles.approved : styles.pending}`}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.slug}>{article.slug}</h3>
                                    <div className={styles.badges}>
                                        {article.is_approved
                                            ? <span className={styles.badgeLive}>LIVE</span>
                                            : <span className={styles.badgePending}>PENDING</span>}
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

            {/* ─── PRODUCTS TAB ─── */}
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
                                            disabled
                                            style={{ opacity: 0.5 }}
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
                                    <div className={styles.fieldGroup}>
                                        <label>Image URL</label>
                                        <input
                                            defaultValue={product.image_url}
                                            onBlur={(e) => saveProductEdit(product.id, 'image_url', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label>AI Context (what should articles say about this product?)</label>
                                    <textarea
                                        className={styles.miniEditor}
                                        defaultValue={product.ai_context}
                                        onBlur={(e) => saveProductEdit(product.id, 'ai_context', e.target.value)}
                                        placeholder="e.g. Natural ingredients, clinically tested, no side effects, fast results..."
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

            {/* ─── SEO DATA TAB ─── */}
            {activeTab === 'data' && (
                <div className={styles.view}>
                    <div className={styles.dataExplainer}>
                        <strong>How article generation works:</strong> AI writes one article for every combination of
                        <span className={styles.pill}>Department</span> +
                        <span className={styles.pill}>Category</span> +
                        <span className={styles.pill}>Keyword</span> +
                        <span className={styles.pill}>Location</span>.
                        Currently that is <strong>{combinations} possible articles</strong>. Add more keywords or locations to scale up.
                    </div>

                    {/* KEYWORDS / TAGS */}
                    <section className={styles.toolSection}>
                        <h2>Keywords / Tags <span className={styles.sectionCount}>({tags.length})</span></h2>
                        <p>These are the search intent words. Each keyword creates a whole new set of articles across all categories and locations. Examples: "erectile dysfunction", "low libido", "premature ejaculation", "low energy".</p>
                        <div className={styles.prodRow}>
                            <div className={styles.fieldGroup}>
                                <label>Keyword / Tag Name</label>
                                <input
                                    value={newTag.name}
                                    onChange={(e) => setNewTag({ name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="e.g. low libido"
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Slug (auto-filled)</label>
                                <input
                                    value={newTag.slug}
                                    onChange={(e) => setNewTag({ ...newTag, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="e.g. low-libido"
                                />
                            </div>
                        </div>
                        <button
                            className={styles.approveBtn}
                            onClick={() => addRow('tags', newTag, 'tags', () => setNewTag({ name: '', slug: '' }), 'keyword')}
                            disabled={saving === 'add-tags'}
                        >
                            {saving === 'add-tags' ? 'Saving...' : '+ Add Keyword'}
                        </button>
                        <div className={styles.catList} style={{ marginTop: '1.5rem' }}>
                            {tags.map(t => (
                                <div key={t.id} className={styles.catChip}>
                                    <span className={styles.catName}>{t.name}</span>
                                    <span className={styles.catSlug}>{t.slug}</span>
                                    <button className={styles.chipDelete} onClick={() => deleteRow('tags', t.id, setTags)}>×</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* LOCATIONS */}
                    <section className={styles.toolSection}>
                        <h2>Locations <span className={styles.sectionCount}>({locations.length})</span></h2>
                        <p>Cities or areas to target. Each location creates articles for every keyword+category. Examples: "Kigali", "Huye", "Musanze", "Rubavu".</p>
                        <div className={styles.prodRow}>
                            <div className={styles.fieldGroup}>
                                <label>Location Name</label>
                                <input
                                    value={newLoc.name}
                                    onChange={(e) => setNewLoc({ name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="e.g. Musanze"
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Slug (auto-filled)</label>
                                <input
                                    value={newLoc.slug}
                                    onChange={(e) => setNewLoc({ ...newLoc, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="e.g. musanze"
                                />
                            </div>
                        </div>
                        <button
                            className={styles.approveBtn}
                            onClick={() => addRow('locations', newLoc, 'locations', () => setNewLoc({ name: '', slug: '' }), 'location')}
                            disabled={saving === 'add-locations'}
                        >
                            {saving === 'add-locations' ? 'Saving...' : '+ Add Location'}
                        </button>
                        <div className={styles.catList} style={{ marginTop: '1.5rem' }}>
                            {locations.map(l => (
                                <div key={l.id} className={styles.catChip}>
                                    <span className={styles.catName}>{l.name}</span>
                                    <span className={styles.catSlug}>{l.slug}</span>
                                    <button className={styles.chipDelete} onClick={() => deleteRow('locations', l.id, setLocations)}>×</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CATEGORIES */}
                    <section className={styles.toolSection}>
                        <h2>Categories <span className={styles.sectionCount}>({categories.length})</span></h2>
                        <p>Product types within a department. Examples: "Capsules" (ibinini), "Creams" (amavuta). Each category maps to a department.</p>
                        <div className={styles.prodRow}>
                            <div className={styles.fieldGroup}>
                                <label>Category Name</label>
                                <input
                                    value={newCat.name}
                                    onChange={(e) => setNewCat({ ...newCat, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="e.g. Ibinini (Capsules)"
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Slug (auto-filled)</label>
                                <input
                                    value={newCat.slug}
                                    onChange={(e) => setNewCat({ ...newCat, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="e.g. ibinini"
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Department</label>
                                <select value={newCat.department_id} onChange={(e) => setNewCat({ ...newCat, department_id: e.target.value })}>
                                    <option value="">Select Department...</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <button
                            className={styles.approveBtn}
                            onClick={() => addRow('categories', newCat, 'categories', () => setNewCat({ name: '', slug: '', department_id: '' }), 'category')}
                            disabled={saving === 'add-categories'}
                        >
                            {saving === 'add-categories' ? 'Saving...' : '+ Add Category'}
                        </button>
                        <div className={styles.catList} style={{ marginTop: '1.5rem' }}>
                            {categories.map(c => (
                                <div key={c.id} className={styles.catChip}>
                                    <span className={styles.catName}>{c.name}</span>
                                    <span className={styles.catSlug}>{c.id} · {departments.find(d => d.id === c.department_id)?.name}</span>
                                    <button className={styles.chipDelete} onClick={() => deleteRow('categories', c.id, setCategories)}>×</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* DEPARTMENTS */}
                    <section className={styles.toolSection}>
                        <h2>Departments <span className={styles.sectionCount}>({departments.length})</span></h2>
                        <p>Top-level groupings. Examples: "Men's Health", "Women's Health". Categories are assigned to a department.</p>
                        <div className={styles.prodRow}>
                            <div className={styles.fieldGroup}>
                                <label>Department Name</label>
                                <input
                                    value={newDept.name}
                                    onChange={(e) => setNewDept({ name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="e.g. Men's Health"
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Slug (auto-filled)</label>
                                <input
                                    value={newDept.slug}
                                    onChange={(e) => setNewDept({ ...newDept, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="e.g. mens-health"
                                />
                            </div>
                        </div>
                        <button
                            className={styles.approveBtn}
                            onClick={() => addRow('departments', newDept, 'departments', () => setNewDept({ name: '', slug: '' }), 'department')}
                            disabled={saving === 'add-departments'}
                        >
                            {saving === 'add-departments' ? 'Saving...' : '+ Add Department'}
                        </button>
                        <div className={styles.catList} style={{ marginTop: '1.5rem' }}>
                            {departments.map(d => (
                                <div key={d.id} className={styles.catChip}>
                                    <span className={styles.catName}>{d.name}</span>
                                    <span className={styles.catSlug}>{d.slug}</span>
                                    <button className={styles.chipDelete} onClick={() => deleteRow('departments', d.id, setDepartments)}>×</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* GENERATE */}
                    <section className={styles.toolSection}>
                        <h2>Generate AI Articles</h2>
                        <p>
                            AI will write articles for every missing <strong>Keyword × Category × Location</strong> combination.
                            Currently <strong>{combinations} total combinations</strong> — articles already written are skipped.
                            New articles appear as Pending in the SEO Articles tab for review.
                        </p>
                        <button className={styles.generateBtn} onClick={triggerAI} disabled={genStatus !== null}>
                            {genStatus || '✦ Generate New Articles'}
                        </button>
                    </section>
                </div>
            )}
        </main>
    );
}
