import { useState, useEffect } from 'react';
import { getAllTechnologies, createTechnology, updateTechnology, deleteTechnology } from '../../services/api';

const DEVICONS_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons';
const buildDeviconsUrl = (slug: string) => `${DEVICONS_BASE}/${slug}/${slug}-original.svg`;
const isDeviconsUrl = (url: string) => url.includes('cdn.jsdelivr.net/gh/devicons/devicon');

const deriveSimpleSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

const deriveDeviconsSlug = (name: string) =>
    name.toLowerCase()
        .replace(/\+\+/g, 'plusplus')
        .replace(/\./g, '')
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');

type IconSource = 'simpleicons' | 'devicons' | 'custom';

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
    const [color, setColor] = useState('#888888');
    const [iconSource, setIconSource] = useState<IconSource>('simpleicons');
    const [simpleSlug, setSimpleSlug] = useState('');
    const [devSlug, setDevSlug] = useState('');
    const [customUrl, setCustomUrl] = useState('');

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

    const resetForm = () => {
        setEditingId(null);
        setName(''); setColor('#888888');
        setIconSource('simpleicons');
        setSimpleSlug(''); setDevSlug(''); setCustomUrl('');
    };

    const openNew = () => { resetForm(); setIsFormOpen(true); };

    const openEdit = (tech: any) => {
        setEditingId(tech.id);
        setName(tech.name);
        setColor(tech.color || '#888888');

        if (tech.logo_url) {
            if (isDeviconsUrl(tech.logo_url)) {
                const match = tech.logo_url.match(/icons\/([^/]+)\//);
                setDevSlug(match ? match[1] : deriveDeviconsSlug(tech.name));
                setSimpleSlug(tech.icon_slug || deriveSimpleSlug(tech.name));
                setCustomUrl('');
                setIconSource('devicons');
            } else {
                setCustomUrl(tech.logo_url);
                setSimpleSlug(tech.icon_slug || deriveSimpleSlug(tech.name));
                setDevSlug(deriveDeviconsSlug(tech.name));
                setIconSource('custom');
            }
        } else {
            setSimpleSlug(tech.icon_slug || '');
            setDevSlug(deriveDeviconsSlug(tech.name));
            setCustomUrl('');
            setIconSource('simpleicons');
        }

        setIsFormOpen(true);
    };

    const handleNameChange = (v: string) => {
        if (!simpleSlug || simpleSlug === deriveSimpleSlug(name)) setSimpleSlug(deriveSimpleSlug(v));
        if (!devSlug || devSlug === deriveDeviconsSlug(name)) setDevSlug(deriveDeviconsSlug(v));
        setName(v);
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
                category: 'Other',
                color: color || null,
                icon_slug: iconSource === 'simpleicons' ? (simpleSlug.trim() || null) : null,
                logo_url: iconSource === 'devicons'
                    ? (devSlug.trim() ? buildDeviconsUrl(devSlug.trim()) : null)
                    : iconSource === 'custom'
                    ? (customUrl.trim() || null)
                    : null,
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

    const previewSrc = (() => {
        if (iconSource === 'simpleicons') {
            const slug = simpleSlug || deriveSimpleSlug(name);
            return slug ? `https://cdn.simpleicons.org/${slug}/${color.replace('#', '')}` : null;
        }
        if (iconSource === 'devicons') {
            const slug = devSlug || deriveDeviconsSlug(name);
            return slug ? buildDeviconsUrl(slug) : null;
        }
        return customUrl || null;
    })();

    if (isLoading && technologies.length === 0) {
        return <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    const sourceTabStyle = (src: IconSource): React.CSSProperties => ({
        padding: '0.35rem 0.85rem',
        fontFamily: 'monospace',
        fontSize: '0.65rem',
        letterSpacing: '0.08em',
        cursor: 'pointer',
        border: '1px solid var(--border-default)',
        borderRadius: '2px',
        background: iconSource === src ? 'var(--text-primary)' : 'transparent',
        color: iconSource === src ? 'var(--bg-primary)' : 'var(--text-secondary)',
        transition: 'all 0.15s',
    });

    if (isFormOpen) {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderTop: 'none', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{editingId ? 'Edit Technology' : 'New Technology'}</h3>
                    <button onClick={() => setIsFormOpen(false)} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>✕ cancel</button>
                </div>

                {error && <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1a0000', border: '1px solid #8b0000', color: '#c0392b', fontFamily: 'monospace', fontSize: '0.75rem', borderRadius: '2px' }}>{error}</div>}

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Name */}
                    <div>
                        <label style={labelStyle}>Name *</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => handleNameChange(e.target.value)}
                            placeholder="e.g. React"
                            style={inputStyle}
                        />
                    </div>

                    {/* Icon source selector */}
                    <div>
                        <label style={{ ...labelStyle, marginBottom: '0.6rem' }}>Icon source</label>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button type="button" style={sourceTabStyle('simpleicons')} onClick={() => setIconSource('simpleicons')}>Simple Icons</button>
                            <button type="button" style={sourceTabStyle('devicons')} onClick={() => setIconSource('devicons')}>Devicons</button>
                            <button type="button" style={sourceTabStyle('custom')} onClick={() => setIconSource('custom')}>Custom URL</button>
                        </div>
                    </div>

                    {iconSource === 'simpleicons' && (
                        <div>
                            <label style={labelStyle}>Simple Icons slug</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="text" value={simpleSlug} onChange={e => setSimpleSlug(e.target.value)} placeholder="e.g. react, nodedotjs, cplusplus" style={{ ...inputStyle, flex: 1 }} />
                                <button type="button" onClick={() => setSimpleSlug(deriveSimpleSlug(name))} title="Re-derive from name" style={{ padding: '0.4rem 0.6rem', fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: '2px', cursor: 'pointer', flexShrink: 0 }}>↺</button>
                            </div>
                            <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                ~3,000 brand logos · special cases: <code>nodedotjs</code>, <code>cplusplus</code> · <a href="https://simpleicons.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>browse →</a>
                            </p>
                        </div>
                    )}

                    {iconSource === 'devicons' && (
                        <div>
                            <label style={labelStyle}>Devicons slug</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="text" value={devSlug} onChange={e => setDevSlug(e.target.value)} placeholder="e.g. react, nodejs, kubernetes" style={{ ...inputStyle, flex: 1 }} />
                                <button type="button" onClick={() => setDevSlug(deriveDeviconsSlug(name))} title="Re-derive from name" style={{ padding: '0.4rem 0.6rem', fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: '2px', cursor: 'pointer', flexShrink: 0 }}>↺</button>
                            </div>
                            <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                ~400+ dev tools, colored icons · <a href="https://devicon.dev" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>browse →</a>
                            </p>
                        </div>
                    )}

                    {iconSource === 'custom' && (
                        <div>
                            <label style={labelStyle}>Custom logo URL</label>
                            <input type="url" value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="https://example.com/logo.svg" style={inputStyle} />
                            <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Direct link to any image — SVG preferred</p>
                        </div>
                    )}

                    {/* Brand color */}
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.75rem', alignItems: 'end' }}>
                        <div>
                            <label style={labelStyle}>Brand color{iconSource !== 'simpleicons' && <span style={{ opacity: 0.5 }}> (badge only)</span>}</label>
                            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ ...inputStyle, padding: '0.2rem', height: '2.4rem', cursor: 'pointer' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Hex value</label>
                            <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="#888888" pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" style={{ ...inputStyle, fontFamily: 'monospace' }} />
                        </div>
                    </div>

                    {/* Preview */}
                    {(name || previewSrc) && (
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '2px' }}>
                            <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>preview</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {previewSrc && (
                                    <img
                                        src={previewSrc}
                                        alt={name}
                                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                )}
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{name || 'Technology name'}</span>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, border: '1px solid var(--border-default)', flexShrink: 0 }} />
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
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {technologies.map((tech: any) => {
                        const iconSrc = tech.logo_url
                            ? tech.logo_url
                            : tech.icon_slug
                            ? `https://cdn.simpleicons.org/${tech.icon_slug}/${(tech.color || '888888').replace('#', '')}`
                            : null;
                        const sourceLabel = tech.logo_url
                            ? (isDeviconsUrl(tech.logo_url) ? 'devicons' : 'custom')
                            : 'simpleicons';
                        return (
                            <div key={tech.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    {iconSrc ? (
                                        <img src={iconSrc} alt={tech.name} style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    ) : (
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tech.color || '#888', flexShrink: 0 }} />
                                    )}
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tech.name}</span>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: 'var(--text-muted)', opacity: 0.6 }}>{sourceLabel}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button onClick={() => openEdit(tech)} style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>edit</button>
                                    <button onClick={() => handleDelete(tech.id, tech.name)} style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>del</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
