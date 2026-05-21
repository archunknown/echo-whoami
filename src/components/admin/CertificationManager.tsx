import { useState, useEffect } from 'react';
import { getAllCertifications, createCertification, updateCertification, deleteCertification } from '../../services/api';
import type { EducationCategory } from '../../types/supabase';

const CATEGORIES: { value: EducationCategory; label: string }[] = [
    { value: 'university', label: 'University' },
    { value: 'technical', label: 'Technical Training' },
    { value: 'certification', label: 'Certifications & Courses' },
    { value: 'complementary', label: 'Complementary' },
];

export default function CertificationManager() {
    const [certifications, setCertifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [titleEn, setTitleEn] = useState('');
    const [titleEs, setTitleEs] = useState('');
    const [issuer, setIssuer] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [credentialUrl, setCredentialUrl] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [orderIndex, setOrderIndex] = useState(0);
    const [category, setCategory] = useState<EducationCategory>('certification');

    useEffect(() => {
        loadCertifications();
    }, []);

    const loadCertifications = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllCertifications();
            setCertifications(data || []);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load certifications.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenNew = () => {
        setEditingId(null);
        setTitleEn('');
        setTitleEs('');
        setIssuer('');
        setIssueDate('');
        setCredentialUrl('');
        setIsPublished(false);
        setOrderIndex(certifications.length);
        setCategory('certification');
        setIsFormOpen(true);
    };

    const handleEdit = (cert: any) => {
        setEditingId(cert.id);

        // Parse title JSONB
        const titleObj = cert.title as { en?: string; es?: string } || {};
        setTitleEn(titleObj.en || '');
        setTitleEs(titleObj.es || '');

        setIssuer(cert.issuer || '');
        setIssueDate(cert.issue_date ? cert.issue_date.split('T')[0] : '');
        setCredentialUrl(cert.credential_url || '');
        setIsPublished(cert.is_published || false);
        setOrderIndex(cert.order_index || 0);
        setCategory((cert.category as EducationCategory) || 'certification');

        setIsFormOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the certification "${name}"?`)) {
            try {
                await deleteCertification(id);
                await loadCertifications();
            } catch (err: any) {
                console.error(err);
                alert('Failed to delete certification.');
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const certData: any = {
                title: { en: titleEn, es: titleEs },
                issuer,
                credential_url: credentialUrl || null,
                is_published: isPublished,
                order_index: orderIndex,
                category,
                issue_date: issueDate || null,
            };

            if (editingId) {
                await updateCertification(editingId, certData);
            } else {
                await createCertification(certData);
            }

            setIsFormOpen(false);
            await loadCertifications();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save certification.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && !isFormOpen && certifications.length === 0) {
        return <div className="py-12 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>Loading certifications...</div>;
    }

    if (isFormOpen) {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderTop: 'none', padding: '2rem' }}>
                <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {editingId ? 'Edit Certification' : 'New Certification'}
                    </h3>
                    <button onClick={() => setIsFormOpen(false)} className="font-mono text-xs tracking-widest transition-colors" style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        ✕ cancel
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 text-sm font-mono" style={{ background: '#1a0000', border: '1px solid #ff4444', color: '#ff6666', borderRadius: '2px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CertField label="Title (EN) *" value={titleEn} onChange={setTitleEn} required />
                        <CertField label="Title (ES)" value={titleEs} onChange={setTitleEs} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CertField label="Issuer *" value={issuer} onChange={setIssuer} required />
                        <div>
                            <label className="block font-mono text-xs tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value as EducationCategory)} className="w-full px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', borderRadius: '2px' }}>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <CertField label="Issue Date" type="date" value={issueDate} onChange={setIssueDate} />
                        <CertField label="Credential URL" type="url" value={credentialUrl} onChange={setCredentialUrl} />
                        <CertField label="Order Index" type="number" value={String(orderIndex)} onChange={v => setOrderIndex(parseInt(v) || 0)} required />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div onClick={() => setIsPublished(!isPublished)} style={{ width: '2.2rem', height: '1.2rem', background: isPublished ? 'var(--color-accent)' : 'var(--border-default)', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.15s' }}>
                            <div style={{ position: 'absolute', top: '0.15rem', width: '0.9rem', height: '0.9rem', background: '#fff', borderRadius: '50%', transition: 'transform 0.15s', transform: isPublished ? 'translateX(1.15rem)' : 'translateX(0.15rem)' }} />
                        </div>
                        <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--text-secondary)' }}>published</span>
                    </label>
                    <div className="pt-4 flex justify-end gap-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <button type="button" onClick={() => setIsFormOpen(false)} className="font-mono text-xs px-6 py-2 transition-colors" style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>cancel</button>
                        <button type="submit" disabled={isSaving} className="font-mono text-xs font-bold px-6 py-2 disabled:opacity-50" style={{ background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)', borderRadius: '2px' }}>
                            {isSaving ? 'saving...' : editingId ? 'save' : 'create'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderTop: 'none', overflow: 'hidden' }}>
            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                    <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Certifications</h3>
                    <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{certifications.length} total</p>
                </div>
                <button onClick={handleOpenNew} className="font-mono text-xs tracking-widest px-6 py-2 font-bold" style={{ background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)', borderRadius: '2px' }}>
                    + new certification
                </button>
            </div>

            {error && (
                <div className="m-6 p-4 text-sm font-mono" style={{ background: '#1a0000', border: '1px solid #ff4444', color: '#ff6666', borderRadius: '2px' }}>
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="p-8 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : certifications.length === 0 ? (
                <div className="p-8 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>No certifications found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <tr>
                                {['Title (EN)', 'Issuer', 'Category', 'Date', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-6 py-3 font-mono text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {certifications.map((cert) => {
                                const title = (cert.title as { en?: string })?.en || 'Untitled';
                                return (
                                    <tr key={cert.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-primary)' }}>{title}</td>
                                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{cert.issuer}</td>
                                        <td className="px-6 py-4 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{cert.category || '—'}</td>
                                        <td className="px-6 py-4 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs px-2 py-0.5" style={{ border: `1px solid ${cert.is_published ? 'var(--color-accent)' : 'var(--border-subtle)'}`, color: cert.is_published ? 'var(--color-accent)' : 'var(--text-muted)', borderRadius: '2px' }}>
                                                {cert.is_published ? 'published' : 'draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEdit(cert)} className="font-mono text-xs mr-4 transition-colors" style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>edit</button>
                                            <button onClick={() => handleDelete(cert.id, title)} className="font-mono text-xs transition-colors" style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function CertField({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
    return (
        <div>
            <label className="block font-mono text-xs tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                required={required}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', borderRadius: '2px' }}
            />
        </div>
    );
}
