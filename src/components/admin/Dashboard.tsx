import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../../services/api';

export default function Dashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // States for the bilingual bio
    const [bioEn, setBioEn] = useState('');
    const [bioEs, setBioEs] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getProfile();
            setProfile(data);

            // Parse the JSONB bio field explicitly defining the shape
            if (data && data.bio) {
                const bio = data.bio as { en?: string; es?: string };
                setBioEn(bio.en || '');
                setBioEs(bio.es || '');
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
            const updates = {
                bio: {
                    en: bioEn,
                    es: bioEs
                }
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

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-2">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}
