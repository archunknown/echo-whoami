import { useState, useEffect, useRef } from 'react';
import { getAllCertifications, createCertification, updateCertification, deleteCertification } from '../../services/api';

const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    outline: 'none',
    borderRadius: '2px',
} as const;

const labelStyle = {
    fontFamily: 'monospace',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '0.25rem',
} as const;

export default function CertificationManager() {
    const [certifications, setCertifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    // Drag state
    const draggingId = useRef<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLang, setEditLang] = useState<'en' | 'es'>('en');
    const [titleEn, setTitleEn] = useState('');
    const [titleEs, setTitleEs] = useState('');
    const [issuer, setIssuer] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [credentialUrl, setCredentialUrl] = useState('');
    const [isPublished, setIsPublished] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllCertifications();
            const sorted = (data || []).slice().sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));
            setCertifications(sorted);
        } catch {
            setError('Failed to load certifications.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setEditLang('en');
        setTitleEn(''); setTitleEs('');
        setIssuer('');
        setIssueDate('');
        setCredentialUrl('');
        setIsPublished(false);
    };

    const handleNew = () => { resetForm(); setIsFormOpen(true); };

    const handleEdit = (cert: any) => {
        setEditingId(cert.id);
        setEditLang('en');
        const titleObj = cert.title as { en?: string; es?: string } || {};
        setTitleEn(titleObj.en || ''); setTitleEs(titleObj.es || '');
        setIssuer(cert.issuer || '');
        setIssueDate(cert.issue_date ? cert.issue_date.split('T')[0] : '');
        setCredentialUrl(cert.credential_url || '');
        setIsPublished(cert.is_published || false);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await deleteCertification(id);
            await load();
        } catch {
            setError('Failed to delete certification.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titleEn.trim()) { setError('Title (EN) is required.'); return; }
        if (!issuer.trim()) { setError('Issuer is required.'); return; }

        setIsSaving(true);
        setError(null);
        try {
            const certData: any = {
                title: { en: titleEn, es: titleEs },
                issuer,
                credential_url: credentialUrl.trim() || null,
                is_published: isPublished,
                issue_date: issueDate || null,
                order_index: editingId
                    ? (certifications.find(c => c.id === editingId)?.order_index ?? certifications.length)
                    : certifications.length,
            };

            if (editingId) {
                await updateCertification(editingId, certData);
            } else {
                await createCertification(certData);
            }

            setIsFormOpen(false);
            await load();
        } catch (err: any) {
            setError(err.message || 'Failed to save certification.');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Drag and Drop ──────────────────────────────────────────────────────────
    const handleDragStart = (id: string) => { draggingId.current = id; };

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (draggingId.current !== id) setDragOverId(id);
    };

    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        setDragOverId(null);
        const fromId = draggingId.current;
        draggingId.current = null;
        if (!fromId || fromId === targetId) return;

        const fromIdx = certifications.findIndex(c => c.id === fromId);
        const toIdx = certifications.findIndex(c => c.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return;

        const reordered = [...certifications];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);

        const withNewIndex = reordered.map((cert, i) => ({ ...cert, order_index: i }));
        const oldIndexMap = Object.fromEntries(certifications.map(c => [c.id, c.order_index ?? 0]));
        const changed = withNewIndex.filter(c => c.order_index !== oldIndexMap[c.id]);

        setCertifications(withNewIndex);

        if (changed.length === 0) return;
        setIsSavingOrder(true);
        try {
            await Promise.all(changed.map(c => updateCertification(c.id, { order_index: c.order_index })));
        } catch {
            setError('Failed to save order. Refreshing...');
            await load();
        } finally {
            setIsSavingOrder(false);
        }
    };

    const handleDragEnd = () => {
        draggingId.current = null;
        setDragOverId(null);
    };

    if (isLoading && certifications.length === 0) {
        return <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    if (isFormOpen) {
        const isEs = editLang === 'es';
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderTop: 'none', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                        {editingId ? 'Edit Certification' : 'New Certification'}
                    </h3>
                    <button onClick={() => setIsFormOpen(false)} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        ✕ cancel
                    </button>
                </div>

                {/* Language switcher */}
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
                    {(['en', 'es'] as const).map(lang => (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => setEditLang(lang)}
                            style={{
                                fontFamily: 'monospace',
                                fontSize: '0.65rem',
                                letterSpacing: '0.12em',
                                padding: '0.3rem 0.75rem',
                                background: editLang === lang ? 'var(--color-accent)' : 'transparent',
                                color: editLang === lang ? '#fff' : 'var(--text-muted)',
                                border: `1px solid ${editLang === lang ? 'var(--color-accent)' : 'var(--border-default)'}`,
                                borderRadius: '2px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {lang.toUpperCase()}
                        </button>
                    ))}
                    {isEs && (
                        <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '0.5rem' }}>
                            EN values shown as placeholders
                        </span>
                    )}
                </div>

                {error && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1a0000', border: '1px solid #8b0000', color: '#c0392b', fontFamily: 'monospace', fontSize: '0.75rem', borderRadius: '2px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Title */}
                    <div>
                        <label style={labelStyle}>Title {isEs ? '(ES)' : '(EN) *'}</label>
                        <input
                            type="text"
                            value={isEs ? titleEs : titleEn}
                            onChange={e => isEs ? setTitleEs(e.target.value) : setTitleEn(e.target.value)}
                            placeholder={isEs ? titleEn || 'Translation of EN title...' : ''}
                            style={inputStyle}
                        />
                    </div>

                    {/* Issuer + Date (only on EN tab — language-neutral fields) */}
                    {!isEs && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label style={labelStyle}>Issuer *</label>
                                <input type="text" value={issuer} onChange={e => setIssuer(e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Issue Date</label>
                                <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={inputStyle} />
                            </div>
                        </div>
                    )}

                    {/* Credential URL (language-neutral) */}
                    {!isEs && (
                        <div>
                            <label style={labelStyle}>Credential URL</label>
                            <input type="url" value={credentialUrl} onChange={e => setCredentialUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
                        </div>
                    )}

                    {/* Published toggle */}
                    {!isEs && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <Toggle checked={isPublished} onChange={setIsPublished} />
                            <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>published</span>
                        </label>
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Certifications</h3>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {certifications.length} total · drag to reorder
                        {isSavingOrder && ' · saving order...'}
                    </p>
                </div>
                <button onClick={handleNew} style={{ padding: '0.5rem 1.25rem', background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', borderRadius: '2px' }}>
                    + new certification
                </button>
            </div>

            {error && (
                <div style={{ margin: '1rem', padding: '0.75rem', background: '#1a0000', border: '1px solid #8b0000', color: '#c0392b', fontFamily: 'monospace', fontSize: '0.75rem', borderRadius: '2px' }}>
                    {error}
                </div>
            )}

            {certifications.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No certifications yet.</div>
            ) : (
                <div>
                    {certifications.map(cert => {
                        const title = (cert.title as { en?: string })?.en || 'Untitled';
                        const isDragTarget = dragOverId === cert.id;
                        return (
                            <div
                                key={cert.id}
                                draggable
                                onDragStart={() => handleDragStart(cert.id)}
                                onDragOver={e => handleDragOver(e, cert.id)}
                                onDrop={e => handleDrop(e, cert.id)}
                                onDragEnd={handleDragEnd}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.875rem 1.5rem',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    gap: '0.75rem',
                                    borderTop: isDragTarget ? '2px solid var(--color-accent)' : '2px solid transparent',
                                    transition: 'border-top 0.1s',
                                    cursor: 'default',
                                }}
                            >
                                {/* Drag handle */}
                                <span
                                    style={{ fontSize: '1rem', color: 'var(--text-muted)', cursor: 'grab', userSelect: 'none', flexShrink: 0, lineHeight: 1 }}
                                    title="Drag to reorder"
                                >
                                    ⠿
                                </span>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
                                    <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                                        {cert.issuer}{cert.issue_date ? ` · ${new Date(cert.issue_date).getFullYear()}` : ''}
                                    </p>
                                </div>

                                {/* Status + Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: cert.is_published ? 'var(--color-accent)' : 'var(--text-muted)', border: `1px solid ${cert.is_published ? 'var(--color-accent)' : 'var(--border-subtle)'}`, padding: '0.1rem 0.4rem', borderRadius: '2px' }}>
                                        {cert.is_published ? 'published' : 'draft'}
                                    </span>
                                    <button onClick={() => handleEdit(cert)} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem 0.25rem' }}>edit</button>
                                    <button onClick={() => handleDelete(cert.id, title)} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem 0.25rem' }}>delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div
            onClick={() => onChange(!checked)}
            style={{ width: '2.2rem', height: '1.2rem', background: checked ? 'var(--color-accent)' : 'var(--border-default)', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0 }}
        >
            <div style={{ position: 'absolute', top: '0.15rem', width: '0.9rem', height: '0.9rem', background: '#fff', borderRadius: '50%', transition: 'transform 0.15s', transform: checked ? 'translateX(1.15rem)' : 'translateX(0.15rem)' }} />
        </div>
    );
}
