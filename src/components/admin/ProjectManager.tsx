import { useState, useEffect } from 'react';
import {
    getAllProjects,
    createProject,
    updateProject,
    deleteProject,
    uploadImage,
    getAllTechnologies,
    addTechnologyToProject,
    removeTechnologyFromProject,
} from '../../services/api';

export default function ProjectManager() {
    const [projects, setProjects] = useState<any[]>([]);
    const [allTechs, setAllTechs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [slug, setSlug] = useState('');
    const [titleEn, setTitleEn] = useState('');
    const [titleEs, setTitleEs] = useState('');
    const [summaryEn, setSummaryEn] = useState('');
    const [summaryEs, setSummaryEs] = useState('');
    const [problemEn, setProblemEn] = useState('');
    const [problemEs, setProblemEs] = useState('');
    const [architectureEn, setArchitectureEn] = useState('');
    const [architectureEs, setArchitectureEs] = useState('');
    const [outcomeEn, setOutcomeEn] = useState('');
    const [outcomeEs, setOutcomeEs] = useState('');
    const [demoUrl, setDemoUrl] = useState('');
    const [prodUrl, setProdUrl] = useState('');
    const [repoUrl, setRepoUrl] = useState('');
    const [customLink, setCustomLink] = useState('');
    const [customLinkLabel, setCustomLinkLabel] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [orderIndex, setOrderIndex] = useState(0);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
    const [metricsRaw, setMetricsRaw] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [projectsData, techsData] = await Promise.all([
                getAllProjects(),
                getAllTechnologies(),
            ]);
            setProjects(projectsData || []);
            setAllTechs(techsData || []);
        } catch (err: any) {
            setError('Failed to load data.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setSlug('');
        setTitleEn(''); setTitleEs('');
        setSummaryEn(''); setSummaryEs('');
        setProblemEn(''); setProblemEs('');
        setArchitectureEn(''); setArchitectureEs('');
        setOutcomeEn(''); setOutcomeEs('');
        setDemoUrl(''); setProdUrl(''); setRepoUrl('');
        setCustomLink(''); setCustomLinkLabel('');
        setIsFeatured(false);
        setIsPrivate(false);
        setIsPublished(false);
        setOrderIndex(projects.length);
        setCoverImageFile(null);
        setCoverImageUrl('');
        setSelectedTechIds([]);
        setMetricsRaw('');
    };

    const handleOpenNew = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const handleEdit = (project: any) => {
        setEditingId(project.id);
        setSlug(project.slug || '');

        const title = project.title as { en?: string; es?: string } || {};
        setTitleEn(title.en || ''); setTitleEs(title.es || '');

        const summary = project.summary as { en?: string; es?: string } || {};
        setSummaryEn(summary.en || ''); setSummaryEs(summary.es || '');

        const problem = project.problem as { en?: string; es?: string } || {};
        setProblemEn(problem.en || ''); setProblemEs(problem.es || '');

        const arch = project.architecture as { en?: string; es?: string } || {};
        setArchitectureEn(arch.en || ''); setArchitectureEs(arch.es || '');

        const outcome = project.outcome as { en?: string; es?: string } || {};
        setOutcomeEn(outcome.en || ''); setOutcomeEs(outcome.es || '');

        setDemoUrl(project.demo_url || '');
        setProdUrl(project.prod_url || '');
        setRepoUrl(project.repo_url || '');
        setCustomLink(project.custom_link || '');
        setCustomLinkLabel(project.custom_link_label || '');
        setIsFeatured(project.is_featured || false);
        setIsPrivate(project.is_private || false);
        setIsPublished(project.is_published || false);
        setOrderIndex(project.order_index ?? 0);
        setCoverImageUrl(project.cover_image_url || '');
        setCoverImageFile(null);

        const techIds = (project.project_technologies || []).map((pt: any) => pt.technology_id || pt.technologies?.id).filter(Boolean);
        setSelectedTechIds(techIds);

        setMetricsRaw(project.metrics ? JSON.stringify(project.metrics, null, 2) : '');
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete project "${name}"? This cannot be undone.`)) return;
        try {
            await deleteProject(id);
            await loadData();
        } catch {
            setError('Failed to delete project.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titleEn.trim()) { setError('Title (EN) is required.'); return; }
        if (!slug.trim()) { setError('Slug is required.'); return; }

        setIsSaving(true);
        setError(null);

        try {
            let finalImageUrl = coverImageUrl;
            if (coverImageFile) {
                const path = `projects/${Date.now()}_${coverImageFile.name}`;
                finalImageUrl = await uploadImage(coverImageFile, 'portfolio-assets', path);
            }

            let parsedMetrics: any = null;
            if (metricsRaw.trim()) {
                try {
                    parsedMetrics = JSON.parse(metricsRaw);
                } catch {
                    setError('Metrics JSON is invalid. Fix the format or leave it empty.');
                    setIsSaving(false);
                    return;
                }
            }

            const projectData: any = {
                slug: slug.trim(),
                title: { en: titleEn, es: titleEs },
                summary: { en: summaryEn, es: summaryEs },
                problem: { en: problemEn, es: problemEs },
                architecture: { en: architectureEn, es: architectureEs },
                outcome: { en: outcomeEn, es: outcomeEs },
                demo_url: demoUrl.trim() || null,
                prod_url: prodUrl.trim() || null,
                repo_url: repoUrl.trim() || null,
                custom_link: customLink.trim() || null,
                custom_link_label: customLinkLabel.trim() || null,
                is_featured: isFeatured,
                is_private: isPrivate,
                is_published: isPublished,
                order_index: orderIndex,
                metrics: parsedMetrics,
            };

            if (finalImageUrl) projectData.cover_image_url = finalImageUrl;

            let savedId = editingId;
            if (editingId) {
                await updateProject(editingId, projectData);
            } else {
                const created = await createProject(projectData);
                savedId = created.id;
            }

            // Sync technologies
            if (savedId) {
                const existing = projects.find(p => p.id === savedId);
                const existingTechIds: string[] = existing
                    ? (existing.project_technologies || []).map((pt: any) => pt.technology_id || pt.technologies?.id).filter(Boolean)
                    : [];

                const toAdd = selectedTechIds.filter(id => !existingTechIds.includes(id));
                const toRemove = existingTechIds.filter(id => !selectedTechIds.includes(id));

                await Promise.all([
                    ...toAdd.map(tid => addTechnologyToProject(savedId!, tid)),
                    ...toRemove.map(tid => removeTechnologyFromProject(savedId!, tid)),
                ]);
            }

            setIsFormOpen(false);
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to save project.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTech = (id: string) => {
        setSelectedTechIds(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const techsByCategory = allTechs.reduce((acc: Record<string, any[]>, t) => {
        acc[t.category] = acc[t.category] || [];
        acc[t.category].push(t);
        return acc;
    }, {});

    if (isLoading && projects.length === 0) {
        return <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading projects...</div>;
    }

    if (isFormOpen) {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }} className="mt-6 p-6 md:p-8">
                <div className="flex justify-between items-center mb-8 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {editingId ? 'Edit Project' : 'New Project'}
                    </h3>
                    <button onClick={() => setIsFormOpen(false)} className="font-mono text-xs tracking-widest transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        ✕ cancel
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 text-sm font-mono" style={{ background: '#1a0000', border: '1px solid #ff4444', color: '#ff6666', borderRadius: '2px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} className="flex flex-col gap-8">

                    {/* Identity */}
                    <fieldset>
                        <legend className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>01 — identity</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <AdminInput label="Slug *" value={slug} onChange={setSlug} placeholder="my-project" />
                            <AdminInput label="Order Index" type="number" value={String(orderIndex)} onChange={v => setOrderIndex(parseInt(v) || 0)} />
                            <div className="flex flex-col gap-3 pt-6">
                                <AdminToggle label="Published" checked={isPublished} onChange={setIsPublished} />
                                <AdminToggle label="Featured" checked={isFeatured} onChange={setIsFeatured} />
                                <AdminToggle label="Private repo" checked={isPrivate} onChange={setIsPrivate} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <AdminInput label="Title (EN) *" value={titleEn} onChange={setTitleEn} />
                            <AdminInput label="Title (ES)" value={titleEs} onChange={setTitleEs} />
                        </div>
                    </fieldset>

                    {/* Summary */}
                    <fieldset style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                        <legend className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>02 — summary</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AdminTextarea label="Summary (EN)" value={summaryEn} onChange={setSummaryEn} rows={3} />
                            <AdminTextarea label="Summary (ES)" value={summaryEs} onChange={setSummaryEs} rows={3} />
                        </div>
                    </fieldset>

                    {/* Problem */}
                    <fieldset style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                        <legend className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>03 — problem</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AdminTextarea label="Problem (EN)" value={problemEn} onChange={setProblemEn} rows={3} />
                            <AdminTextarea label="Problem (ES)" value={problemEs} onChange={setProblemEs} rows={3} />
                        </div>
                    </fieldset>

                    {/* Architecture */}
                    <fieldset style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                        <legend className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>04 — architecture (markdown)</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AdminTextarea label="Architecture (EN)" value={architectureEn} onChange={setArchitectureEn} rows={4} />
                            <AdminTextarea label="Architecture (ES)" value={architectureEs} onChange={setArchitectureEs} rows={4} />
                        </div>
                    </fieldset>

                    {/* Outcome */}
                    <fieldset style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                        <legend className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>05 — outcome</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AdminTextarea label="Outcome (EN)" value={outcomeEn} onChange={setOutcomeEn} rows={3} />
                            <AdminTextarea label="Outcome (ES)" value={outcomeEs} onChange={setOutcomeEs} rows={3} />
                        </div>
                    </fieldset>

                    {/* Links */}
                    <fieldset style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                        <legend className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>06 — links</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AdminInput label="Demo URL" value={demoUrl} onChange={setDemoUrl} placeholder="https://..." />
                            <AdminInput label="Production URL" value={prodUrl} onChange={setProdUrl} placeholder="https://..." />
                            <AdminInput label="Repository URL" value={repoUrl} onChange={setRepoUrl} placeholder="https://github.com/..." />
                            <div className="grid grid-cols-2 gap-2">
                                <AdminInput label="Custom Link URL" value={customLink} onChange={setCustomLink} placeholder="https://..." />
                                <AdminInput label="Custom Link Label" value={customLinkLabel} onChange={setCustomLinkLabel} placeholder="live site" />
                            </div>
                        </div>
                    </fieldset>

                    {/* Cover image */}
                    <fieldset style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                        <legend className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>07 — cover image</legend>
                        {coverImageUrl && !coverImageFile && (
                            <img src={coverImageUrl} alt="Current cover" className="h-24 object-cover mb-3" style={{ border: '1px solid var(--border-subtle)' }} />
                        )}
                        <input
                            type="file"
                            accept="image/*,image/gif"
                            onChange={e => setCoverImageFile(e.target.files?.[0] || null)}
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        />
                        <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Accepts images and GIFs. No videos.</p>
                    </fieldset>

                    {/* Technologies */}
                    <fieldset style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                        <legend className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>08 — technologies</legend>
                        {Object.entries(techsByCategory).map(([cat, techs]) => (
                            <div key={cat} className="mb-4">
                                <p className="text-xs font-mono mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{cat}</p>
                                <div className="flex flex-wrap gap-2">
                                    {techs.map((tech: any) => {
                                        const selected = selectedTechIds.includes(tech.id);
                                        return (
                                            <button
                                                key={tech.id}
                                                type="button"
                                                onClick={() => toggleTech(tech.id)}
                                                className="font-mono text-xs px-3 py-1 transition-all"
                                                style={{
                                                    border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--border-default)'}`,
                                                    color: selected ? 'var(--color-accent)' : 'var(--text-secondary)',
                                                    background: selected ? 'rgba(139,0,0,0.1)' : 'transparent',
                                                    borderRadius: '2px',
                                                }}
                                            >
                                                {tech.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </fieldset>

                    {/* Metrics */}
                    <fieldset style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                        <legend className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>09 — metrics (JSON)</legend>
                        <AdminTextarea
                            label='e.g. {"users": "1200+", "uptime": "99.9%"}'
                            value={metricsRaw}
                            onChange={setMetricsRaw}
                            rows={3}
                            mono
                        />
                    </fieldset>

                    <div className="flex justify-end gap-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="font-mono text-xs tracking-widest px-6 py-3 transition-colors"
                            style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                        >
                            cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="font-mono text-xs tracking-widest px-8 py-3 font-bold transition-all disabled:opacity-40"
                            style={{ background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)' }}
                        >
                            {isSaving ? 'saving...' : editingId ? 'save changes' : 'create project'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }} className="mt-6 overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                    <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Projects</h3>
                    <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{projects.length} total</p>
                </div>
                <button
                    onClick={handleOpenNew}
                    className="font-mono text-xs tracking-widest px-6 py-2 font-bold transition-all hover:opacity-80"
                    style={{ background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)', borderRadius: '2px' }}
                >
                    + new project
                </button>
            </div>

            {error && (
                <div className="m-6 p-4 text-sm font-mono" style={{ background: '#1a0000', border: '1px solid #ff4444', color: '#ff6666', borderRadius: '2px' }}>
                    {error}
                </div>
            )}

            {projects.length === 0 ? (
                <div className="p-8 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>No projects found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <tr>
                                {['Title (EN)', 'Slug', 'Order', 'Status', 'Flags', 'Actions'].map(h => (
                                    <th key={h} className="px-6 py-3 font-mono text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(project => {
                                const title = (project.title as { en?: string })?.en || 'Untitled';
                                return (
                                    <tr key={project.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-primary)' }}>{title}</td>
                                        <td className="px-6 py-4 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{project.slug}</td>
                                        <td className="px-6 py-4 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{project.order_index}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge active={project.is_published} label={project.is_published ? 'published' : 'draft'} />
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {project.is_featured ? '⭐ featured · ' : ''}
                                            {project.is_private ? '🔒 private' : ''}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEdit(project)} className="font-mono text-xs tracking-widest mr-4 transition-colors hover:opacity-80" style={{ color: 'var(--color-accent)' }}>
                                                edit
                                            </button>
                                            <button onClick={() => handleDelete(project.id, title)} className="font-mono text-xs tracking-widest transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                                delete
                                            </button>
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

function AdminInput({ label, value, onChange, placeholder = '', type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="font-mono text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm transition-colors outline-none"
                style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    borderRadius: '2px',
                }}
            />
        </div>
    );
}

function AdminTextarea({ label, value, onChange, rows = 3, mono = false }: { label: string; value: string; onChange: (v: string) => void; rows?: number; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="font-mono text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</label>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                rows={rows}
                className="w-full px-3 py-2 text-sm transition-colors outline-none resize-y"
                style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    borderRadius: '2px',
                    fontFamily: mono ? 'monospace' : 'inherit',
                }}
            />
        </div>
    );
}

function AdminToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer">
            <div
                onClick={() => onChange(!checked)}
                className="w-10 h-5 relative transition-colors"
                style={{
                    background: checked ? 'var(--color-accent)' : 'var(--border-default)',
                    borderRadius: '10px',
                }}
            >
                <div
                    className="absolute top-0.5 w-4 h-4 transition-transform"
                    style={{
                        background: '#fff',
                        borderRadius: '50%',
                        transform: checked ? 'translateX(1.25rem)' : 'translateX(0.125rem)',
                    }}
                />
            </div>
            <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        </label>
    );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
    return (
        <span
            className="inline-block font-mono text-xs px-2 py-0.5"
            style={{
                border: `1px solid ${active ? 'var(--color-accent)' : 'var(--border-default)'}`,
                color: active ? 'var(--color-accent)' : 'var(--text-muted)',
                borderRadius: '2px',
            }}
        >
            {label}
        </span>
    );
}
