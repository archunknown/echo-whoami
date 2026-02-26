import { useState, useEffect } from 'react';
import { getAllTechnologies, createTechnology, updateTechnology, deleteTechnology } from '../../services/api';

const CATEGORIES = [
    'Frontend',
    'Backend',
    'Database',
    'DevOps/Tools',
    'OS'
];

export default function TechnologyManager() {
    const [technologies, setTechnologies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [iconSlug, setIconSlug] = useState('');
    const [color, setColor] = useState('#000000');

    useEffect(() => {
        loadTechnologies();
    }, []);

    const loadTechnologies = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllTechnologies();
            setTechnologies(data || []);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load technologies.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenNew = () => {
        setEditingId(null);
        setName('');
        setCategory(CATEGORIES[0]);
        setIconSlug('');
        setColor('#000000');
        setIsFormOpen(true);
    };

    const handleEdit = (tech: any) => {
        setEditingId(tech.id);
        setName(tech.name);
        setCategory(tech.category || CATEGORIES[0]);
        setIconSlug(tech.icon_slug || '');
        setColor(tech.color || '#000000');
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string, techName: string) => {
        if (window.confirm(`Are you sure you want to delete "${techName}"?`)) {
            try {
                await deleteTechnology(id);
                await loadTechnologies();
            } catch (err: any) {
                console.error(err);
                alert('Failed to delete technology. Make sure it is not linked to any projects before deleting.');
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const techData = {
                name,
                category,
                icon_slug: iconSlug || null,
                color: color || null
            };

            if (editingId) {
                await updateTechnology(editingId, techData);
            } else {
                await createTechnology(techData);
            }

            setIsFormOpen(false);
            await loadTechnologies();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save technology.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && !isFormOpen && technologies.length === 0) {
        return <div className="py-12 text-center text-gray-500">Loading technologies...</div>;
    }

    if (isFormOpen) {
        return (
            <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-8 mt-6">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {editingId ? 'Edit Technology' : 'New Technology'}
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
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="e.g. React, Node.js, PostgreSQL"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                            <select
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Icon Slug (Optional)</label>
                            <input
                                type="text"
                                value={iconSlug}
                                onChange={(e) => setIconSlug(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="e.g. react, nodedotjs"
                            />
                            <p className="text-xs text-gray-500 mt-1">SimpleIcons slug used for rendering.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Brand Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="h-10 w-14 p-1 border border-gray-300 dark:border-gray-700 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="#000000"
                                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                />
                            </div>
                        </div>
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
                            {isSaving ? 'Saving...' : 'Save Technology'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // Group technologies for display
    const techByCategory = technologies.reduce((acc, tech) => {
        const cat = tech.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(tech);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl mt-6 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Stack Technologies</h3>
                <button
                    onClick={handleOpenNew}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                    New Technology
                </button>
            </div>

            {error && (
                <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : technologies.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No technologies found. Create one.</div>
            ) : (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {CATEGORIES.map(category => (
                        techByCategory[category] && techByCategory[category].length > 0 && (
                            <div key={category} className="flex flex-col gap-3">
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 pb-2">
                                    {category}
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {techByCategory[category].map((tech: any) => (
                                        <div
                                            key={tech.id}
                                            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group bg-gray-50 dark:bg-gray-800/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-700 shrink-0"
                                                    style={{ backgroundColor: tech.color || 'transparent' }}
                                                />
                                                <span className="font-bold text-gray-900 dark:text-white">{tech.name}</span>
                                                {tech.icon_slug && (
                                                    <span className="text-xs text-gray-400 font-mono hidden sm:inline">[{tech.icon_slug}]</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(tech)}
                                                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tech.id, tech.name)}
                                                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded"
                                                >
                                                    Del
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}
