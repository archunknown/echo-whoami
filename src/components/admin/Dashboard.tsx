import { useState, useEffect } from 'react';
import { getProfile, updateProfile, uploadImage } from '../../services/api';

export default function Dashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // States for the bilingual bio
    const [bioEn, setBioEn] = useState('');
    const [bioEs, setBioEs] = useState('');

    // Architecture & Data Analytics Fields
    const [architectureTextEn, setArchitectureTextEn] = useState('');
    const [architectureTextEs, setArchitectureTextEs] = useState('');
    const [architectureImageUrl, setArchitectureImageUrl] = useState('');
    const [architectureImageFile, setArchitectureImageFile] = useState<File | null>(null);

    const [dataAnalyticsTextEn, setDataAnalyticsTextEn] = useState('');
    const [dataAnalyticsTextEs, setDataAnalyticsTextEs] = useState('');
    const [dataAnalyticsImageUrl, setDataAnalyticsImageUrl] = useState('');
    const [dataAnalyticsImageFile, setDataAnalyticsImageFile] = useState<File | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getProfile();
            setProfile(data);

            if (data && data.bio) {
                const bio = data.bio as { en?: string; es?: string };
                setBioEn(bio.en || '');
                setBioEs(bio.es || '');
            }

            if (data && data.architecture_text) {
                const arch = data.architecture_text as { en?: string; es?: string };
                setArchitectureTextEn(arch.en || '');
                setArchitectureTextEs(arch.es || '');
            }
            if (data && data.architecture_image_url) {
                setArchitectureImageUrl(data.architecture_image_url);
            }

            if (data && data.data_analytics_text) {
                const dataText = data.data_analytics_text as { en?: string; es?: string };
                setDataAnalyticsTextEn(dataText.en || '');
                setDataAnalyticsTextEs(dataText.es || '');
            }
            if (data && data.data_analytics_image_url) {
                setDataAnalyticsImageUrl(data.data_analytics_image_url);
            }
        } catch (err: any) {
            console.error(err);
            setError('Failed to load profile data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile || !profile.id) return;

        setIsSaving(true);
        setError(null);
        setSuccessMsg(null);

        try {
            let finalArchitectureImageUrl = architectureImageUrl;
            let finalDataAnalyticsImageUrl = dataAnalyticsImageUrl;

            if (architectureImageFile) {
                const fileExt = architectureImageFile.name.split('.').pop();
                const fileName = `architecture-${Date.now()}.${fileExt}`;
                finalArchitectureImageUrl = await uploadImage(architectureImageFile, 'portfolio-assets', fileName);
                setArchitectureImageUrl(finalArchitectureImageUrl);
                setArchitectureImageFile(null);
            }

            if (dataAnalyticsImageFile) {
                const fileExt = dataAnalyticsImageFile.name.split('.').pop();
                const fileName = `data-analytics-${Date.now()}.${fileExt}`;
                finalDataAnalyticsImageUrl = await uploadImage(dataAnalyticsImageFile, 'portfolio-assets', fileName);
                setDataAnalyticsImageUrl(finalDataAnalyticsImageUrl);
                setDataAnalyticsImageFile(null);
            }

            const updates = {
                bio: {
                    en: bioEn,
                    es: bioEs
                },
                architecture_text: architectureTextEn || architectureTextEs ? { en: architectureTextEn, es: architectureTextEs } : null,
                architecture_image_url: finalArchitectureImageUrl || null,
                data_analytics_text: dataAnalyticsTextEn || dataAnalyticsTextEs ? { en: dataAnalyticsTextEn, es: dataAnalyticsTextEs } : null,
                data_analytics_image_url: finalDataAnalyticsImageUrl || null,
            };

            await updateProfile(profile.id, updates);
            setSuccessMsg('Profile updated successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            console.error(err);
            setError('Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="py-12 text-center text-gray-500">Loading dashboard...</div>;
    }

    if (!profile) {
        return (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded">
                Profile data could not be found. Please check your database.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-8 mt-6 text-left">
            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4">
                Edit Profile (Bio)
            </h3>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2" htmlFor="bioEn">
                        Bio (English)
                    </label>
                    <textarea
                        id="bioEn"
                        value={bioEn}
                        onChange={(e) => setBioEn(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Write your bio in English..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2" htmlFor="bioEs">
                        Bio (Español)
                    </label>
                    <textarea
                        id="bioEs"
                        value={bioEs}
                        onChange={(e) => setBioEs(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Escribe tu biografía en español..."
                    />
                </div>

                {/* Architecture Section */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Architecture</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description (EN)</label>
                            <textarea
                                value={architectureTextEn}
                                onChange={(e) => setArchitectureTextEn(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description (ES)</label>
                            <textarea
                                value={architectureTextEs}
                                onChange={(e) => setArchitectureTextEs(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Architecture Image</label>
                            {architectureImageUrl && (
                                <div className="mb-4">
                                    <img src={architectureImageUrl} alt="Architecture Preview" className="h-32 rounded border border-gray-200 dark:border-gray-700 object-cover" />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setArchitectureImageFile(e.target.files[0]);
                                    }
                                }}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Data Analytics Section */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Data Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description (EN)</label>
                            <textarea
                                value={dataAnalyticsTextEn}
                                onChange={(e) => setDataAnalyticsTextEn(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description (ES)</label>
                            <textarea
                                value={dataAnalyticsTextEs}
                                onChange={(e) => setDataAnalyticsTextEs(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Metrics Image Preview</label>
                            {dataAnalyticsImageUrl && (
                                <div className="mb-4">
                                    <img src={dataAnalyticsImageUrl} alt="Analytics Preview" className="h-32 rounded border border-gray-200 dark:border-gray-700 object-cover" />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setDataAnalyticsImageFile(e.target.files[0]);
                                    }
                                }}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
