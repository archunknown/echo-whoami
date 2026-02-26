import { useState, useEffect } from 'react';
import { getAllProjects, createProject, updateProject, deleteProject, uploadImage } from '../../services/api';

export default function ProjectManager() {
    const [projects, setProjects] = useState<any[]>([]);
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
    const [isPublished, setIsPublished] = useState(false);
    const [orderIndex, setOrderIndex] = useState(0);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState('');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllProjects();
            setProjects(data || []);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load projects.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenNew = () => {
        setEditingId(null);
        setSlug('');
        setTitleEn('');
        setTitleEs('');
        setSummaryEn('');
        setSummaryEs('');
        setIsPublished(false);
        setOrderIndex(projects.length);
        setCoverImageFile(null);
        setCoverImageUrl('');
        setIsFormOpen(true);
    };

    const handleEdit = (project: any) => {
        setEditingId(project.id);
        setSlug(project.slug || '');

        // Parse title JSONB
        const titleObj = project.title as { en?: string; es?: string } || {};
        setTitleEn(titleObj.en || '');
        setTitleEs(titleObj.es || '');

        // Parse summary JSONB
        const summaryObj = project.summary as { en?: string; es?: string } || {};
        setSummaryEn(summaryObj.en || '');
        setSummaryEs(summaryObj.es || '');

        setIsPublished(project.is_published || false);
        setOrderIndex(project.order_index || 0);
        setCoverImageUrl(project.cover_image_url || '');
        setCoverImageFile(null);

        setIsFormOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the project "${name}"?`)) {
            try {
                await deleteProject(id);
                await loadProjects();
            } catch (err: any) {
                console.error(err);
                alert('Failed to delete project.');
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            let finalImageUrl = coverImageUrl;

            if (coverImageFile) {
                const path = `projects/${Date.now()}_${coverImageFile.name}`;
                finalImageUrl = await uploadImage(coverImageFile, 'portfolio-assets', path);
            }

            const projectData = {
                slug,
                title: { en: titleEn, es: titleEs },
                summary: { en: summaryEn, es: summaryEs },
                is_published: isPublished,
                order_index: orderIndex,
                cover_image_url: finalImageUrl,
                // Since we are strictly replacing data and keeping it simple, default these for now if not existing.
                architecture: { en: 'TBD', es: 'TBD' },
                problem: { en: 'TBD', es: 'TBD' },
                outcome: { en: 'TBD', es: 'TBD' }
            };

            if (editingId) {
                await updateProject(editingId, projectData);
            } else {
                await createProject(projectData);
            }

            setIsFormOpen(false);
            await loadProjects();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save project.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && !isFormOpen && projects.length === 0) {
        return <div className="py-12 text-center text-gray-500">Loading projects...</div>;
    }

    if (isFormOpen) {
        return (
            <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-8 mt-6">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {editingId ? 'Edit Project' : 'New Project'}
                    </h3>
                    <button
                        onClick={() => setIsFormOpen(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Cancel
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Slug</label>
                            <input
                                type="text"
                                required
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Order Index</label>
                            <input
                                type="number"
                                required
                                value={orderIndex}
                                onChange={(e) => setOrderIndex(parseInt(e.target.value, 10))}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Title (EN)</label>
                            <input
                                type="text"
                                required
                                value={titleEn}
                                onChange={(e) => setTitleEn(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Title (ES)</label>
                            <input
                                type="text"
                                required
                                value={titleEs}
                                onChange={(e) => setTitleEs(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Summary (EN)</label>
                            <textarea
                                required
                                rows={3}
                                value={summaryEn}
                                onChange={(e) => setSummaryEn(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Summary (ES)</label>
                            <textarea
                                required
                                rows={3}
                                value={summaryEs}
                                onChange={(e) => setSummaryEs(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cover Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        {coverImageUrl && !coverImageFile && (
                            <p className="mt-2 text-sm text-gray-500 truncate">Current: {coverImageUrl}</p>
                        )}
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isPublished"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isPublished" className="ml-2 block text-sm font-bold text-gray-900 dark:text-white">
                            Published
                        </label>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Project'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl mt-6 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Projects</h3>
                <button
                    onClick={handleOpenNew}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                    New Project
                </button>
            </div>

            {error && (
                <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : projects.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No projects found. Create one above.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Title (EN)</th>
                                <th className="px-6 py-4">Slug</th>
                                <th className="px-6 py-4">Order</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {projects.map((project) => {
                                const title = (project.title as { en?: string })?.en || 'Untitled';
                                return (
                                    <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {title}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{project.slug}</td>
                                        <td className="px-6 py-4">{project.order_index}</td>
                                        <td className="px-6 py-4">
                                            {project.is_published ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                                                    Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(project)}
                                                className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-4 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(project.id, title)}
                                                className="font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                                            >
                                                Delete
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
