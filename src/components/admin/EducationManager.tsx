import { useState, useEffect, useRef } from 'react';
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

export default function EducationManager() {
    const [entries, setEntries] = useState<any[]>([]);
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
    const [issueYear, setIssueYear] = useState('');

    useEffect(() => { load(); }, []);

    const load = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllEducation();
            const sorted = (data || []).slice().sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));
            setEntries(sorted);
        } catch {
            setError('Failed to load education entries.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setEditLang('en');
        setTitleEn(''); setTitleEs('');
        setInstitutionEn(''); setInstitutionEs('');
        setDescriptionEn(''); setDescriptionEs('');
        setCategory('university');
        setStartDate(''); setEndDate('');
        setIsCurrent(false);
        setCredentialUrl('');
        setIsPublished(true);
        setIssueYear('');
    };

    const handleNew = () => { resetForm(); setIsFormOpen(true); };

    const handleEdit = (entry: any) => {
        setEditingId(entry.id);
        setEditLang('en');
        const t = entry.title as { en?: string; es?: string } || {};
        setTitleEn(t.en || ''); setTitleEs(t.es || '');
        const inst = entry.institution as { en?: string; es?: string } || {};
        setInstitutionEn(inst.en || ''); setInstitutionEs(inst.es || '');
        const d = entry.description as { en?: string; es?: string } || {};
        setDescriptionEn(d.en || ''); setDescriptionEs(d.es || '');
        setCategory(entry.category || 'university');
        setStartDate(entry.start_date ? entry.start_date.split('T')[0] : '');
        setEndDate(entry.end_date ? entry.end_date.split('T')[0] : '');
        setIsCurrent(entry.is_current || false);
        setCredentialUrl(entry.credential_url || '');
        setIsPublished(entry.is_published ?? true);
        setIssueYear(entry.issue_year ? String(entry.issue_year) : '');
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
        if (!institutionEn.trim()) { setError('Issuer / Institution (EN) is required.'); return; }

        const isCertification = category === 'certification';

        setIsSaving(true);
        setError(null);
        try {
            const parsedYear = issueYear ? parseInt(issueYear, 10) : null;
            const data: any = {
                title: { en: titleEn, es: titleEs },
                institution: { en: institutionEn, es: isCertification ? institutionEn : institutionEs },
                description: isCertification ? null : (descriptionEn || descriptionEs ? { en: descriptionEn, es: descriptionEs } : null),
                category,
                start_date: isCertification ? null : (startDate || null),
                end_date: isCertification ? null : (isCurrent ? null : (endDate || null)),
                is_current: isCertification ? false : isCurrent,
                credential_url: isCertification ? null : (credentialUrl.trim() || null),
                issue_year: isCertification ? parsedYear : null,
                is_published: isPublished,
                order_index: editingId
                    ? (entries.find(e => e.id === editingId)?.order_index ?? entries.length)
                    : entries.length,
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

    // ── Drag and Drop ──────────────────────────────────────────────────────────
    const handleDragStart = (id: string) => {
        draggingId.current = id;
    };

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

        const fromIdx = entries.findIndex(e => e.id === fromId);
        const toIdx = entries.findIndex(e => e.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return;

        const reordered = [...entries];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);

        const withNewIndex = reordered.map((entry, i) => ({ ...entry, order_index: i }));

        const oldIndexMap = Object.fromEntries(entries.map(e => [e.id, e.order_index ?? 0]));
        const changed = withNewIndex.filter(e => e.order_index !== oldIndexMap[e.id]);

        setEntries(withNewIndex);

        if (changed.length === 0) return;
        setIsSavingOrder(true);
        try {
            await Promise.all(changed.map(e => updateEducation(e.id, { order_index: e.order_index })));
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

    if (isLoading && entries.length === 0) {
        return <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    if (isFormOpen) {
        const isEs = editLang === 'es';
        const isCertification = category === 'certification';
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderTop: 'none', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                        {editingId ? 'Edit Entry' : 'New Education Entry'}
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
                    {/* Category + Published */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label style={labelStyle}>Category *</label>
                            <select value={category} onChange={e => setCategory(e.target.value as EducationCategory)} style={{ ...inputStyle }}>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <Toggle checked={isPublished} onChange={setIsPublished} />
                                <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>published</span>
                            </label>
                        </div>
                    </div>

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

                    {/* Institution / Issuer */}
                    <div>
                        <label style={labelStyle}>
                            {isCertification ? 'Issuer *' : `Institution ${isEs ? '(ES)' : '(EN) *'}`}
                        </label>
                        <input
                            type="text"
                            value={isCertification ? institutionEn : (isEs ? institutionEs : institutionEn)}
                            onChange={e => isCertification ? setInstitutionEn(e.target.value) : (isEs ? setInstitutionEs(e.target.value) : setInstitutionEn(e.target.value))}
                            placeholder={(!isCertification && isEs) ? institutionEn || 'Translation of EN institution...' : ''}
                            style={inputStyle}
                        />
                        {isCertification && (
                            <p style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Language-neutral — same value used for EN and ES.
                            </p>
                        )}
                    </div>

                    {/* Issue Year — only for certifications */}
                    {isCertification && (
                        <div>
                            <label style={labelStyle}>Issue Year</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={issueYear}
                                onChange={e => {
                                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    setIssueYear(v);
                                }}
                                placeholder="e.g. 2024"
                                maxLength={4}
                                style={inputStyle}
                            />
                        </div>
                    )}

                    {/* Description — hidden for certifications */}
                    {!isCertification && (
                        <div>
                            <label style={labelStyle}>Description {isEs ? '(ES)' : '(EN)'}</label>
                            <textarea
                                value={isEs ? descriptionEs : descriptionEn}
                                onChange={e => isEs ? setDescriptionEs(e.target.value) : setDescriptionEn(e.target.value)}
                                placeholder={isEs ? descriptionEn || 'Translation of EN description...' : ''}
                                rows={2}
                                style={{ ...inputStyle, resize: 'vertical' }}
                            />
                        </div>
                    )}

                    {/* Dates — hidden for certifications */}
                    {!isCertification && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                            <div>
                                <label style={labelStyle}>Start Date</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>End Date</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={isCurrent} style={{ ...inputStyle, opacity: isCurrent ? 0.4 : 1 }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.1rem' }}>
                                <Toggle checked={isCurrent} onChange={setIsCurrent} />
                                <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>present</span>
                            </div>
                        </div>
                    )}

                    {/* Credential URL — hidden for certifications */}
                    {!isCertification && (
                        <div>
                            <label style={labelStyle}>Credential URL</label>
                            <input type="url" value={credentialUrl} onChange={e => setCredentialUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
                        </div>
                    )}

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

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderTop: 'none', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Education</h3>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {entries.length} entries · drag to reorder
                        {isSavingOrder && ' · saving order...'}
                    </p>
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
                <div>
                    {entries.map(entry => {
                        const title = (entry.title as { en?: string })?.en || 'Untitled';
                        const institution = (entry.institution as { en?: string })?.en || '';
                        const isDragTarget = dragOverId === entry.id;
                        return (
                            <div
                                key={entry.id}
                                draggable
                                onDragStart={() => handleDragStart(entry.id)}
                                onDragOver={e => handleDragOver(e, entry.id)}
                                onDrop={e => handleDrop(e, entry.id)}
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
                                    style={{
                                        fontSize: '1rem',
                                        color: 'var(--text-muted)',
                                        cursor: 'grab',
                                        userSelect: 'none',
                                        flexShrink: 0,
                                        lineHeight: 1,
                                    }}
                                    title="Drag to reorder"
                                >
                                    ⠿
                                </span>

                                {/* Entry info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
                                    <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {institution}{institution ? ' · ' : ''}{entry.start_date ? entry.start_date.slice(0, 4) : '—'} – {entry.is_current ? 'present' : entry.end_date ? entry.end_date.slice(0, 4) : '—'}
                                    </p>
                                </div>

                                {/* Badges + Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '0.1rem 0.4rem', borderRadius: '2px' }}>
                                        {CATEGORY_LABELS[entry.category as EducationCategory] || entry.category}
                                    </span>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: entry.is_published ? 'var(--color-accent)' : 'var(--text-muted)', border: `1px solid ${entry.is_published ? 'var(--color-accent)' : 'var(--border-subtle)'}`, padding: '0.1rem 0.4rem', borderRadius: '2px' }}>
                                        {entry.is_published ? 'published' : 'draft'}
                                    </span>
                                    <button onClick={() => handleEdit(entry)} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem 0.25rem' }}>edit</button>
                                    <button onClick={() => handleDelete(entry.id, title)} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem 0.25rem' }}>delete</button>
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
