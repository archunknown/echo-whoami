import { useState, useEffect } from 'react';
import { getAllEducation, createEducation, updateEducation, deleteEducation } from '../../services/api';
import type { EducationCategory } from '../../types/supabase';

const CATEGORIES: { value: EducationCategory; label: string }[] = [
    { value: 'university', label: 'University' },
    { value: 'technical', label: 'Technical Training' },
    { value: 'certification', label: 'Certifications & Courses' },
    { value: 'complementary', label: 'Complementary' },
];

const CATEGORY_LABELS: Record<EducationCategory, string> = {
    university: 'University',
    technical: 'Technical',
    certification: 'Certification',
    complementary: 'Complementary',
};

export default function EducationManager() {
    const [entries, setEntries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [titleEn, setTitleEn] = useState('');
    const [titleEs, setTitleEs] = useState('');
    const [institutionEn, setInstitutionEn] = useState('');
    const [institutionEs, setInstitutionEs] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [descriptionEs, setDescriptionEs] = useState('');
    const [category, setCategory] = useState<EducationCategory>('university');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isCurrent, setIsCurrent] = useState(false);
    const [credentialUrl, setCredentialUrl] = useState('');
    const [isPublished, setIsPublished] = useState(true);
    const [orderIndex, setOrderIndex] = useState(0);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllEducation();
            setEntries(data || []);
        } catch {
            setError('Failed to load education entries.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setTitleEn(''); setTitleEs('');
        setInstitutionEn(''); setInstitutionEs('');
        setDescriptionEn(''); setDescriptionEs('');
        setCategory('university');
        setStartDate(''); setEndDate('');
        setIsCurrent(false);
        setCredentialUrl('');
        setIsPublished(true);
        setOrderIndex(entries.length);
    };

    const handleNew = () => { resetForm(); setIsFormOpen(true); };

    const handleEdit = (entry: any) => {
        setEditingId(entry.id);
        const t = entry.title as { en?: string; es?: string } || {};
        setTitleEn(t.en || ''); setTitleEs(t.es || '');
        const i = entry.institution as { en?: string; es?: string } || {};
        setInstitutionEn(i.en || ''); setInstitutionEs(i.es || '');
        const d = entry.description as { en?: string; es?: string } || {};
        setDescriptionEn(d.en || ''); setDescriptionEs(d.es || '');
        setCategory(entry.category || 'university');
        setStartDate(entry.start_date ? entry.start_date.split('T')[0] : '');
        setEndDate(entry.end_date ? entry.end_date.split('T')[0] : '');
        setIsCurrent(entry.is_current || false);
        setCredentialUrl(entry.credential_url || '');
        setIsPublished(entry.is_published ?? true);
        setOrderIndex(entry.order_index ?? 0);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await deleteEducation(id);
            await load();
        } catch {
            setError('Failed to delete entry.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titleEn.trim()) { setError('Title (EN) is required.'); return; }
        if (!institutionEn.trim()) { setError('Institution (EN) is required.'); return; }

        setIsSaving(true);
        setError(null);
        try {
            const data: any = {
                title: { en: titleEn, es: titleEs },
                institution: { en: institutionEn, es: institutionEs },
                description: descriptionEn || descriptionEs ? { en: descriptionEn, es: descriptionEs } : null,
                category,
                start_date: startDate || null,
                end_date: isCurrent ? null : (endDate || null),
                is_current: isCurrent,
                credential_url: credentialUrl.trim() || null,
                is_published: isPublished,
                order_index: orderIndex,
            };

            if (editingId) {
                await updateEducation(editingId, data);
            } else {
                await createEducation(data);
            }
            setIsFormOpen(false);
            await load();
        } catch (err: any) {
            setError(err.message || 'Failed to save entry.');
        } finally {
            setIsSaving(false);
        }
    };

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

    const labelStyle = {
        fontFamily: 'monospace',
        fontSize: '0.65rem',
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
        display: 'block',
        marginBottom: '0.25rem',
    };

    if (isLoading && entries.length === 0) {
        return <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    if (isFormOpen) {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderTop: 'none', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                        {editingId ? 'Edit Entry' : 'New Education Entry'}
                    </h3>
                    <button onClick={() => setIsFormOpen(false)} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        ✕ cancel
                    </button>
                </div>

                {error && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1a0000', border: '1px solid #8b0000', color: '#c0392b', fontFamily: 'monospace', fontSize: '0.75rem', borderRadius: '2px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Category + Order + Published */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Category *</label>
                            <select value={category} onChange={e => setCategory(e.target.value as EducationCategory)} style={{ ...inputStyle }}>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Order Index</label>
                            <input type="number" value={orderIndex} onChange={e => setOrderIndex(parseInt(e.target.value) || 0)} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <Toggle checked={isPublished} onChange={setIsPublished} />
                                <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>published</span>
                            </label>
                        </div>
                    </div>

                    {/* Titles */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div><label style={labelStyle}>Title (EN) *</label><input type="text" required value={titleEn} onChange={e => setTitleEn(e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Title (ES)</label><input type="text" value={titleEs} onChange={e => setTitleEs(e.target.value)} style={inputStyle} /></div>
                    </div>

                    {/* Institutions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div><label style={labelStyle}>Institution (EN) *</label><input type="text" required value={institutionEn} onChange={e => setInstitutionEn(e.target.value)} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Institution (ES)</label><input type="text" value={institutionEs} onChange={e => setInstitutionEs(e.target.value)} style={inputStyle} /></div>
                    </div>

                    {/* Description */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Description (EN)</label>
                            <textarea value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Description (ES)</label>
                            <textarea value={descriptionEs} onChange={e => setDescriptionEs(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                    </div>

                    {/* Dates */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                        <div><label style={labelStyle}>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} /></div>
                        <div>
                            <label style={labelStyle}>End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={isCurrent} style={{ ...inputStyle, opacity: isCurrent ? 0.4 : 1 }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.1rem' }}>
                            <Toggle checked={isCurrent} onChange={setIsCurrent} />
                            <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>present</span>
                        </div>
                    </div>

                    {/* Credential URL */}
                    <div>
                        <label style={labelStyle}>Credential URL</label>
                        <input type="url" value={credentialUrl} onChange={e => setCredentialUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <button type="button" onClick={() => setIsFormOpen(false)} style={{ padding: '0.6rem 1.5rem', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer', borderRadius: '2px' }}>cancel</button>
                        <button type="submit" disabled={isSaving} style={{ padding: '0.6rem 2rem', background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1, borderRadius: '2px' }}>
                            {isSaving ? 'saving...' : editingId ? 'save changes' : 'create entry'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    const grouped = CATEGORIES.reduce((acc, cat) => {
        acc[cat.value] = entries.filter(e => e.category === cat.value);
        return acc;
    }, {} as Record<EducationCategory, any[]>);

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderTop: 'none', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Education</h3>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{entries.length} entries across {Object.values(grouped).filter(g => g.length > 0).length} categories</p>
                </div>
                <button onClick={handleNew} style={{ padding: '0.5rem 1.25rem', background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', borderRadius: '2px' }}>
                    + new entry
                </button>
            </div>

            {error && (
                <div style={{ margin: '1rem', padding: '0.75rem', background: '#1a0000', border: '1px solid #8b0000', color: '#c0392b', fontFamily: 'monospace', fontSize: '0.75rem', borderRadius: '2px' }}>
                    {error}
                </div>
            )}

            {entries.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No entries yet.</div>
            ) : (
                CATEGORIES.map(cat => {
                    const group = grouped[cat.value];
                    if (group.length === 0) return null;
                    return (
                        <div key={cat.value} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)' }}>
                                <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>{cat.label}</p>
                            </div>
                            {group.map(entry => {
                                const title = (entry.title as { en?: string })?.en || 'Untitled';
                                const institution = (entry.institution as { en?: string })?.en || '';
                                return (
                                    <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <div>
                                            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</p>
                                            <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>{institution} · {entry.start_date ? entry.start_date.slice(0, 4) : '—'} – {entry.is_current ? 'present' : entry.end_date ? entry.end_date.slice(0, 4) : '—'}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: entry.is_published ? 'var(--color-accent)' : 'var(--text-muted)', border: `1px solid ${entry.is_published ? 'var(--color-accent)' : 'var(--border-subtle)'}`, padding: '0.1rem 0.4rem', borderRadius: '2px' }}>
                                                {entry.is_published ? 'published' : 'draft'}
                                            </span>
                                            <button onClick={() => handleEdit(entry)} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>edit</button>
                                            <button onClick={() => handleDelete(entry.id, title)} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>delete</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })
            )}
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div
            onClick={() => onChange(!checked)}
            style={{
                width: '2.2rem',
                height: '1.2rem',
                background: checked ? 'var(--color-accent)' : 'var(--border-default)',
                borderRadius: '10px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.15s',
                flexShrink: 0,
            }}
        >
            <div style={{
                position: 'absolute',
                top: '0.15rem',
                width: '0.9rem',
                height: '0.9rem',
                background: '#fff',
                borderRadius: '50%',
                transition: 'transform 0.15s',
                transform: checked ? 'translateX(1.15rem)' : 'translateX(0.15rem)',
            }} />
        </div>
    );
}
