import { useState, useEffect } from 'react';
import { getAllTechnologies, createTechnology, updateTechnology, deleteTechnology } from '../../services/api';

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'DevOps/Tools', 'OS', 'Other'];

const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    outline: 'none',
    borderRadius: '2px',
};

const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '0.3rem',
};

export default function TechnologyManager() {
    const [technologies, setTechnologies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [iconSlug, setIconSlug] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [color, setColor] = useState('#888888');

    useEffect(() => { load(); }, []);

    const load = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllTechnologies();
            setTechnologies(data || []);
        } catch {
            setError('Failed to load technologies.');
        } finally {
            setIsLoading(false);
        }
    };

    const openNew = () => {
        setEditingId(null);
        setName(''); setCategory(CATEGORIES[0]);
        setIconSlug(''); setLogoUrl(''); setColor('#888888');
        setIsFormOpen(true);
    };

    const openEdit = (tech: any) => {
        setEditingId(tech.id);
        setName(tech.name);
        setCategory(tech.category || CATEGORIES[0]);
        setIconSlug(tech.icon_slug || '');
        setLogoUrl(tech.logo_url || '');
        setColor(tech.color || '#888888');
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string, techName: string) => {
        if (!window.confirm(`Delete "${techName}"? Remove from all projects first.`)) return;
        try {
            await deleteTechnology(id);
            await load();
        } catch {
            setError('Failed to delete. Ensure it is not linked to any projects.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError('Name is required.'); return; }
        setIsSaving(true);
        setError(null);
        try {
            const techData: any = {
                name: name.trim(),
                category,
                icon_slug: iconSlug.trim() || null,
                logo_url: logoUrl.trim() || null,
                color: color || null,
            };
            if (editingId) {
                await updateTechnology(editingId, techData);
            } else {
                await createTechnology(techData);
            }
            setIsFormOpen(false);
            await load();
        } catch (err: any) {
            setError(err.message || 'Failed to save.');
        } finally {
            setIsSaving(false);
        }
    };

    const techByCategory = technologies.reduce((acc: Record<string, any[]>, tech) => {
        const cat = tech.category || 'Other';
        acc[cat] = acc[cat] || [];
        acc[cat].push(tech);
        return acc;
    }, {});

    if (isLoading && technologies.length === 0) {
        return <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    if (isFormOpen) {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderTop: 'none', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{editingId ? 'Edit Technology' : 'New Technology'}</h3>
                    <button onClick={() => setIsFormOpen(false)} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>✕ cancel</button>
                </div>

                {error && <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1a0000', border: '1px solid #8b0000', color: '#c0392b', fontFamily: 'monospace', fontSize: '0.75rem', borderRadius: '2px' }}>{error}</div>}

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Name *</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. React" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>SimpleIcons slug (optional)</label>
                            <input type="text" value={iconSlug} onChange={e => setIconSlug(e.target.value)} placeholder="e.g. react, nodedotjs" style={inputStyle} />
                            <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Used for automatic icon rendering via simpleicons.org</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Logo URL (optional — overrides icon slug)</label>
                            <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://cdn.../logo.svg" style={inputStyle} />
                            <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Direct URL to official logo image (SVG preferred)</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.75rem', alignItems: 'end' }}>
                        <div>
                            <label style={labelStyle}>Brand color</label>
                            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ ...inputStyle, padding: '0.2rem', height: '2.4rem', cursor: 'pointer' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Hex value</label>
                            <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="#888888" pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" style={{ ...inputStyle, fontFamily: 'monospace' }} />
                        </div>
                    </div>

                    {/* Preview */}
                    {(iconSlug || logoUrl) && (
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '2px' }}>
                            <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>preview</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {logoUrl ? (
                                    <img src={logoUrl} alt={name} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                ) : iconSlug ? (
                                    <img src={`https://cdn.simpleicons.org/${iconSlug}/${color.replace('#', '')}`} alt={name} style={{ width: '24px', height: '24px', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : null}
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{name || 'Technology name'}</span>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, border: '1px solid var(--border-default)' }} />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <button type="button" onClick={() => setIsFormOpen(false)} style={{ padding: '0.6rem 1.5rem', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer', borderRadius: '2px' }}>cancel</button>
                        <button type="submit" disabled={isSaving} style={{ padding: '0.6rem 2rem', background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1, borderRadius: '2px' }}>
                            {isSaving ? 'saving...' : editingId ? 'save changes' : 'create'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderTop: 'none', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Stack Technologies</h3>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{technologies.length} technologies</p>
                </div>
                <button onClick={openNew} style={{ padding: '0.5rem 1.25rem', background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', borderRadius: '2px' }}>
                    + new technology
                </button>
            </div>

            {error && <div style={{ margin: '1rem', padding: '0.75rem', background: '#1a0000', border: '1px solid #8b0000', color: '#c0392b', fontFamily: 'monospace', fontSize: '0.75rem', borderRadius: '2px' }}>{error}</div>}

            {technologies.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No technologies yet.</div>
            ) : (
                <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {CATEGORIES.map(cat => {
                        const group = techByCategory[cat];
                        if (!group || group.length === 0) return null;
                        return (
                            <div key={cat}>
                                <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>{cat}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {group.map((tech: any) => (
                                        <div key={tech.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '2px' }} className="group">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                {tech.logo_url ? (
                                                    <img src={tech.logo_url} alt={tech.name} style={{ width: '18px', height: '18px', objectFit: 'contain', filter: 'brightness(0.9)' }} />
                                                ) : tech.icon_slug ? (
                                                    <img src={`https://cdn.simpleicons.org/${tech.icon_slug}/${(tech.color || '888888').replace('#', '')}`} alt={tech.name} style={{ width: '18px', height: '18px', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                ) : (
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tech.color || '#888', flexShrink: 0 }} />
                                                )}
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tech.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button onClick={() => openEdit(tech)} style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>edit</button>
                                                <button onClick={() => handleDelete(tech.id, tech.name)} style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>del</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
