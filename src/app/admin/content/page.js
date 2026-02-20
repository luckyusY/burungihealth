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
    const [newTag, setNewTag] = useState({ name: '', slug: '', department_id: '', synonyms: '' });
    const [newLoc, setNewLoc] = useState({ name: '', slug: '' });
    const [newDept, setNewDept] = useState({ name: '', slug: '' });
    const [newProduct, setNewProduct] = useState({ name: '', slug: '', price: '', image_url: '', description: '', problems_solved: '', category_id: '', department_id: '' });
    const [genStatus, setGenStatus] = useState(null);
    // Per-product generation state: { [productId]: { selectedTagIds: string[], status: string|null } }
    const [productGenState, setProductGenState] = useState({});

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
    async function addProduct() {
        if (!newProduct.name) { alert('Enter a product name.'); return; }
        if (!newProduct.slug) { alert('Enter a product slug (used in URLs).'); return; }
        if (!newProduct.category_id) { alert('Select a category.'); return; }
        setSaving('add-product');
        const row = {
            name: newProduct.name,
            slug: newProduct.slug,
            price: newProduct.price ? Number(newProduct.price) : null,
            image_url: newProduct.image_url || null,
            description: newProduct.description || null,
            problems_solved: newProduct.problems_solved || null,
            category_id: newProduct.category_id,
            department_id: newProduct.department_id || null,
        };
        const { error } = await supabase.from('products').insert([row]);
        if (error) alert(error.message);
        else { fetchAllData(); setNewProduct({ name: '', slug: '', price: '', image_url: '', description: '', problems_solved: '', category_id: '', department_id: '' }); }
        setSaving(null);
    }

    async function saveProductEdit(id, field, value) {
        setSaving(id + '-' + field);
        const { error } = await supabase.from('products').update({ [field]: value }).eq('id', id);
        if (error) alert(error.message);
        else setSaving(id + '-' + field + '-done');
        setTimeout(() => setSaving(null), 1500);
    }

    async function autoFillSlugs() {
        const missing = products.filter(p => !p.slug);
        if (missing.length === 0) { alert('All products already have slugs.'); return; }
        if (!confirm(`Auto-generate slugs for ${missing.length} product(s) from their names?`)) return;
        setSaving('auto-slug');
        for (const p of missing) {
            const slug = p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            await supabase.from('products').update({ slug }).eq('id', p.id);
        }
        fetchAllData();
        setSaving(null);
    }

    // --- Generic add helpers ---
    async function addRow(table, row, stateKey, resetFn, label) {
        if (!row.name || !row.slug) { alert(`Enter a name and slug for the ${label}.`); return; }
        if (table === 'tags' && !row.department_id) { alert('Select a department for this keyword.'); return; }
        if (table === 'categories' && !row.department_id) { alert('Select a department for this category.'); return; }
        setSaving('add-' + table);
        const { error } = await supabase.from(table).insert([row]);
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

    // --- Per-product generation helpers ---
    function getProductDeptTags(product) {
        const cat = categories.find(c => c.id === product.category_id);
        const dept = departments.find(d => d.id === (product.department_id || cat?.department_id));
        if (!dept) return [];
        return tags.filter(t => t.department_id === dept.id);
    }

    function productArticleCount(product) {
        if (!product.slug) return 0;
        return articles.filter(a => a.slug.includes(`---${product.slug}---`)).length;
    }

    function getSelectedTagIds(productId, deptTags) {
        const state = productGenState[productId];
        if (!state || !state.selectedTagIds) return deptTags.map(t => String(t.id));
        return state.selectedTagIds;
    }

    function toggleProductTag(productId, tagId, deptTags) {
        const current = getSelectedTagIds(productId, deptTags);
        const id = String(tagId);
        const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
        setProductGenState(prev => ({ ...prev, [productId]: { ...(prev[productId] || {}), selectedTagIds: next } }));
    }

    function setProductStatus(productId, status) {
        setProductGenState(prev => ({ ...prev, [productId]: { ...(prev[productId] || {}), status } }));
    }

    async function triggerProductAI(product) {
        const deptTags = getProductDeptTags(product);
        const selectedTagIds = getSelectedTagIds(product.id, deptTags);
        if (selectedTagIds.length === 0) { alert('Select at least one keyword first.'); return; }
        if (!product.slug) { alert('This product needs a slug before generating articles.'); return; }

        let total = 0;
        let batch = 1;
        while (true) {
            setProductStatus(product.id, `Batch ${batch} — ${total} done...`);
            try {
                const res = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ secret: 'burungi-secure-gen', limit: 3, productId: product.id, tagIds: selectedTagIds })
                });
                if (!res.ok) {
                    const text = await res.text();
                    alert(`Server error (${res.status}): ${text}`);
                    setProductStatus(product.id, '✗ Error');
                    break;
                }
                const data = await res.json();
                if (!data.success) {
                    alert('Error: ' + (data.error || 'Unknown'));
                    setProductStatus(product.id, '✗ Error');
                    break;
                }
                total += data.count;
                if (data.count === 0 || !data.remaining) {
                    setProductStatus(product.id, `✓ Done — ${total} new articles`);
                    fetchAllData();
                    break;
                }
                batch++;
            } catch (e) {
                alert(`Request failed: ${e.message}\n\nCheck OPENAI_API_KEY is set in Vercel environment variables.`);
                setProductStatus(product.id, '✗ Error');
                break;
            }
        }
    }

    async function triggerAI() {
        if (!confirm("Start generating new AI articles for all missing combinations?\n\nArticles are generated in batches of 10. Keep clicking until done.")) return;
        let total = 0;
        let batch = 1;
        while (true) {
            setGenStatus(`Batch ${batch} — generated ${total} so far...`);
            try {
                const res = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ secret: 'burungi-secure-gen', limit: 3 })
                });
                if (!res.ok) {
                    const text = await res.text();
                    alert(`Server error (${res.status}): ${text}`);
                    break;
                }
                const data = await res.json();
                if (!data.success) {
                    alert("Error: " + (data.error || 'Unknown error'));
                    break;
                }
                total += data.count;
                if (data.count === 0 || data.remaining === 0) {
                    alert(`Done! Generated ${total} new articles total. ${data.message || ''}`);
                    fetchAllData();
                    break;
                }
                batch++;
            } catch (e) {
                alert(`Request failed: ${e.message}\n\nCheck that OPENAI_API_KEY is set in your Vercel environment variables.`);
                break;
            }
        }
        setGenStatus(null);
    }

    if (loading) return <div className={styles.loading}>Loading...</div>;

    const liveCount = articles.filter(a => a.is_approved).length;
    const pendingCount = articles.filter(a => !a.is_approved).length;

    // How many combinations will AI generate: products-with-slug × dept-scoped-tags × locations
    const productsWithSlug = products.filter(p => p.slug);
    const combinations = productsWithSlug.reduce((acc, product) => {
        const cat = categories.find(c => c.id === product.category_id);
        const dept = departments.find(d => d.id === (product.department_id || cat?.department_id));
        if (!dept) return acc;
        const deptTags = tags.filter(t => t.department_id === dept.id);
        return acc + deptTags.length * locations.length;
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

                    {/* Add Product Form */}
                    <section className={styles.toolSection}>
                        <h2>Add New Product</h2>
                        <div className={styles.prodRow}>
                            <div className={styles.fieldGroup}>
                                <label>Product Name *</label>
                                <input
                                    value={newProduct.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                        setNewProduct({ ...newProduct, name, slug });
                                    }}
                                    placeholder="e.g. Vigor Plus Capsules"
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Slug * <span style={{ color: '#888', fontWeight: 400 }}>(auto-filled — used in URLs)</span></label>
                                <input
                                    value={newProduct.slug}
                                    onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                    placeholder="e.g. vigor-plus-capsules"
                                />
                            </div>
                        </div>
                        <div className={styles.prodRow}>
                            <div className={styles.fieldGroup}>
                                <label>Price (RWF)</label>
                                <input
                                    type="number"
                                    value={newProduct.price}
                                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                    placeholder="e.g. 25000"
                                />
                            </div>
                        </div>
                        <div className={styles.prodRow}>
                            <div className={styles.fieldGroup}>
                                <label>Department *</label>
                                <select
                                    value={newProduct.department_id}
                                    onChange={(e) => setNewProduct({ ...newProduct, department_id: e.target.value, category_id: '' })}
                                >
                                    <option value="">Select Department...</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Category *</label>
                                <select
                                    value={newProduct.category_id}
                                    onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                                >
                                    <option value="">Select Category...</option>
                                    {categories
                                        .filter(c => !newProduct.department_id || c.department_id === newProduct.department_id)
                                        .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className={styles.prodRow}>
                            <div className={styles.fieldGroup}>
                                <label>Image URL</label>
                                <input
                                    value={newProduct.image_url}
                                    onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Description</label>
                                <input
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Short product description"
                                />
                            </div>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label>Problems This Product Solves <span style={{ color: '#888', fontWeight: 400 }}>(comma-separated — shown as chips on product card)</span></label>
                            <input
                                value={newProduct.problems_solved}
                                onChange={(e) => setNewProduct({ ...newProduct, problems_solved: e.target.value })}
                                placeholder="e.g. Low Libido, Hormonal Imbalance, Sexual Performance"
                            />
                        </div>
                        <button
                            className={styles.approveBtn}
                            onClick={addProduct}
                            disabled={saving === 'add-product'}
                            style={{ marginTop: '0.5rem' }}
                        >
                            {saving === 'add-product' ? 'Saving...' : '+ Add Product'}
                        </button>
                    </section>

                    {products.filter(p => !p.slug).length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'rgba(229,115,115,0.08)', border: '1px solid rgba(229,115,115,0.25)', borderRadius: '8px', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.82rem', color: '#e57373' }}>
                                ⚠ {products.filter(p => !p.slug).length} product(s) have no slug and won't generate articles.
                            </span>
                            <button
                                className={styles.approveBtn}
                                onClick={autoFillSlugs}
                                disabled={saving === 'auto-slug'}
                                style={{ padding: '0.3rem 0.85rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                            >
                                {saving === 'auto-slug' ? 'Saving...' : 'Auto-fill slugs from names'}
                            </button>
                        </div>
                    )}
                    <div className={styles.list}>
                        {products.length === 0 && (
                            <p style={{ color: '#666', padding: '1rem 0' }}>No products yet. Add your first product above.</p>
                        )}
                        {products.map((product) => {
                            const isSavingThis = saving && saving.startsWith(product.id);
                            const savedThis = saving && saving === product.id + '-' + saving.split('-').slice(1).join('-') + '-done';
                            const saveLabel = isSavingThis
                                ? (saving.endsWith('-done') ? '✓ Saved' : 'Saving...')
                                : null;
                            return (
                            <div key={product.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h3 className={styles.slug}>{product.name}</h3>
                                        {product.slug && (
                                            <span style={{ fontSize: '0.72rem', color: '#888' }}>
                                                slug: {product.slug} · {productArticleCount(product)} articles generated
                                            </span>
                                        )}
                                        {!product.slug && (
                                            <span style={{ fontSize: '0.72rem', color: '#e57373' }}>⚠ No slug — set a slug to enable AI generation</span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        {saveLabel && (
                                            <span style={{ fontSize: '0.8rem', color: saving.endsWith('-done') ? '#4caf50' : '#d4af37' }}>
                                                {saveLabel}
                                            </span>
                                        )}
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={async () => {
                                                if (!confirm(`Delete product: ${product.name}?`)) return;
                                                await supabase.from('products').delete().eq('id', product.id);
                                                fetchAllData();
                                            }}
                                        >Delete</button>
                                    </div>
                                </div>
                                <div className={styles.prodRow}>
                                    <div className={styles.fieldGroup}>
                                        <label>Product Name</label>
                                        <input
                                            defaultValue={product.name}
                                            onBlur={(e) => saveProductEdit(product.id, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label>Slug <span style={{ color: '#888', fontWeight: 400 }}>(URL identifier — must be unique)</span></label>
                                        <input
                                            defaultValue={product.slug || ''}
                                            onBlur={(e) => saveProductEdit(product.id, 'slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                                            placeholder="e.g. maxman-capsules"
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
                                    <label>Problems This Product Solves <span style={{ color: '#888', fontWeight: 400 }}>(comma-separated — shown as chips on card)</span></label>
                                    <input
                                        defaultValue={product.problems_solved}
                                        onBlur={(e) => saveProductEdit(product.id, 'problems_solved', e.target.value)}
                                        placeholder="e.g. Low Libido, Hormonal Imbalance, Sexual Performance"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label>AI Context <span style={{ color: '#888', fontWeight: 400 }}>(used when generating articles — describe the product benefits)</span></label>
                                    <textarea
                                        className={styles.miniEditor}
                                        defaultValue={product.ai_context}
                                        onBlur={(e) => saveProductEdit(product.id, 'ai_context', e.target.value)}
                                        placeholder="e.g. Natural ingredients, clinically tested, no side effects, results in 2 weeks..."
                                    />
                                </div>

                                <div className={styles.prodRow}>
                                    <div className={styles.fieldGroup}>
                                        <label>Department</label>
                                        <select
                                            defaultValue={product.department_id}
                                            onChange={(e) => saveProductEdit(product.id, 'department_id', e.target.value)}
                                        >
                                            <option value="">— None —</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label>Category</label>
                                        <select
                                            defaultValue={product.category_id}
                                            onChange={(e) => saveProductEdit(product.id, 'category_id', e.target.value)}
                                        >
                                            <option value="">— None —</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {/* Per-product AI Generation */}
                                {(() => {
                                    const deptTags = getProductDeptTags(product);
                                    const selectedTagIds = getSelectedTagIds(product.id, deptTags);
                                    const pState = productGenState[product.id];
                                    const isGenerating = pState?.status && !pState.status.startsWith('✓') && !pState.status.startsWith('✗');
                                    return (
                                        <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '8px' }}>
                                            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d4af37', marginBottom: '0.5rem' }}>
                                                ✦ Generate AI Articles for this product
                                            </p>
                                            {!product.slug ? (
                                                <p style={{ fontSize: '0.78rem', color: '#888' }}>Set a slug above first, then you can generate articles.</p>
                                            ) : deptTags.length === 0 ? (
                                                <p style={{ fontSize: '0.78rem', color: '#888' }}>No keywords found for this product's department. Assign the product to a category that has a department, and add keywords to that department in the SEO Data tab.</p>
                                            ) : (
                                                <>
                                                    <p style={{ fontSize: '0.74rem', color: '#888', marginBottom: '0.5rem' }}>
                                                        Select keywords to generate for × {locations.length} location{locations.length !== 1 ? 's' : ''}:
                                                    </p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                                        {deptTags.map(tag => {
                                                            const isSelected = selectedTagIds.includes(String(tag.id));
                                                            return (
                                                                <label key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '0.76rem', background: isSelected ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isSelected ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.1)'}`, padding: '0.22rem 0.55rem', borderRadius: '4px', userSelect: 'none' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleProductTag(product.id, tag.id, deptTags)}
                                                                        style={{ width: 'auto', margin: 0 }}
                                                                    />
                                                                    {tag.name}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                        <button
                                                            className={styles.approveBtn}
                                                            onClick={() => triggerProductAI(product)}
                                                            disabled={isGenerating}
                                                            style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}
                                                        >
                                                            {isGenerating ? '⏳ Generating...' : `✦ Generate (${selectedTagIds.length} keywords × ${locations.length} locations)`}
                                                        </button>
                                                        {pState?.status && (
                                                            <span style={{ fontSize: '0.78rem', color: pState.status.startsWith('✓') ? '#4caf50' : pState.status.startsWith('✗') ? '#e57373' : '#d4af37' }}>
                                                                {pState.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })()}

                                <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.75rem' }}>
                                    💡 Click any field and then click away to auto-save.
                                </p>
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── SEO DATA TAB ─── */}
            {activeTab === 'data' && (
                <div className={styles.view}>
                    <div className={styles.dataExplainer}>
                        <strong>How article generation works:</strong> AI writes one article for every combination of
                        <span className={styles.pill}>Product</span> +
                        <span className={styles.pill}>Keyword</span> +
                        <span className={styles.pill}>Location</span>.
                        Only products with a <strong>slug</strong> set generate articles ({productsWithSlug.length} of {products.length} products have slugs).
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
                                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
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
                            <div className={styles.fieldGroup}>
                                <label>Department</label>
                                <select value={newTag.department_id} onChange={(e) => setNewTag({ ...newTag, department_id: e.target.value })}>
                                    <option value="">Select Department...</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label>Kinyarwanda Synonyms <span style={{ color: '#888', fontWeight: 400 }}>(comma-separated — used in page metadata for local search)</span></label>
                            <input
                                value={newTag.synonyms}
                                onChange={(e) => setNewTag({ ...newTag, synonyms: e.target.value })}
                                placeholder="e.g. kubura ubushake, kongera igitsina"
                            />
                        </div>
                        <button
                            className={styles.approveBtn}
                            onClick={() => addRow('tags', newTag, 'tags', () => setNewTag({ name: '', slug: '', department_id: '', synonyms: '' }), 'keyword')}
                            disabled={saving === 'add-tags'}
                        >
                            {saving === 'add-tags' ? 'Saving...' : '+ Add Keyword'}
                        </button>
                        <div className={styles.catList} style={{ marginTop: '1.5rem' }}>
                            {departments.map(dept => {
                                const deptTags = tags.filter(t => t.department_id === dept.id);
                                if (deptTags.length === 0) return null;
                                return (
                                    <div key={dept.id} style={{ marginBottom: '1.25rem' }}>
                                        <p style={{ fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{dept.name}</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {deptTags.map(t => (
                                                <div key={t.id} className={styles.catChip}>
                                                    <span className={styles.catName}>{t.name}</span>
                                                    <span className={styles.catSlug}>{t.slug}</span>
                                                    <button className={styles.chipDelete} onClick={() => deleteRow('tags', t.id, setTags)}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
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
                            AI will write articles for every missing <strong>Product × Keyword × Location</strong> combination.
                            Currently <strong>{combinations} total combinations</strong> — articles already written are skipped.
                            Only products with a slug are included. New articles appear as Pending in the SEO Articles tab for review.
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
