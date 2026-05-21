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

    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [githubUrl, setGithubUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');
    const [resumeUrlEn, setResumeUrlEn] = useState('');
    const [resumeUrlEs, setResumeUrlEs] = useState('');


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
            if (data?.display_name) setDisplayName(data.display_name);
            if (data?.avatar_url) setAvatarUrl(data.avatar_url);
            if (data?.github_url) setGithubUrl(data.github_url);
            if (data?.linkedin_url) setLinkedinUrl((data as any).linkedin_url || '');
            if (data?.twitter_url) setTwitterUrl((data as any).twitter_url || '');
            if (data?.resume_url) {
                const ru = data.resume_url as { en?: string; es?: string };
                setResumeUrlEn(ru.en || '');
                setResumeUrlEs(ru.es || '');
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
            let finalAvatarUrl = avatarUrl;
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `avatar-${Date.now()}.${fileExt}`;
                finalAvatarUrl = await uploadImage(avatarFile, 'portfolio-assets', fileName);
                setAvatarUrl(finalAvatarUrl);
                setAvatarFile(null);
            }

            const updates = {
                display_name: displayName || null,
                avatar_url: finalAvatarUrl || null,
                bio: { en: bioEn, es: bioEs },
                github_url: githubUrl.trim() || null,
                linkedin_url: linkedinUrl.trim() || null,
                twitter_url: twitterUrl.trim() || null,
                resume_url: resumeUrlEn || resumeUrlEs ? { en: resumeUrlEn, es: resumeUrlEs } : null,
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
        return <div className="py-12 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>Loading dashboard...</div>;
    }

    if (!profile) {
        return (
            <div className="p-4 font-mono text-sm" style={{ background: '#1a0000', border: '1px solid #ff4444', color: '#ff6666' }}>
                Profile data could not be found. Please check your database.
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }} className="p-6 md:p-8 mt-6 text-left">
            <div className="flex justify-between items-center mb-8 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Profile</h3>
            </div>

            {error && (
                <div className="mb-6 p-4 text-sm font-mono" style={{ background: '#1a0000', border: '1px solid #ff4444', color: '#ff6666', borderRadius: '2px' }}>
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="mb-6 p-4 text-sm font-mono" style={{ background: '#001a00', border: '1px solid #44ff44', color: '#88ff88', borderRadius: '2px' }}>
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
                <p className="font-mono text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>01 — bio</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DashTextarea label="Bio (EN)" value={bioEn} onChange={setBioEn} rows={4} placeholder="Write your bio in English..." />
                    <DashTextarea label="Bio (ES)" value={bioEs} onChange={setBioEs} rows={4} placeholder="Escribe tu biografía en español..." />
                </div>

                <div className="pt-6 border-t mt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>02 — identity</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashInput label="Display Name" value={displayName} onChange={setDisplayName} placeholder="John Doe" />
                        <div>
                            <label className="block font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Avatar Image</label>
                            {avatarUrl && (
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={avatarUrl} alt="Avatar" className="w-14 h-14 rounded-full object-cover" style={{ border: '1px solid var(--border-default)' }} />
                                    <button type="button" onClick={() => { setAvatarUrl(''); setAvatarFile(null); }} className="font-mono text-xs" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.5rem', borderRadius: '2px', background: 'none', cursor: 'pointer' }}>× remove</button>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) setAvatarFile(e.target.files[0]); }} className="text-sm" style={{ color: 'var(--text-secondary)' }} />
                            {avatarFile && <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-accent)' }}>New file: {avatarFile.name}</p>}
                        </div>
                        <DashInput label="GitHub URL" value={githubUrl} onChange={setGithubUrl} placeholder="https://github.com/username" />
                        <DashInput label="LinkedIn URL" value={linkedinUrl} onChange={setLinkedinUrl} placeholder="https://linkedin.com/in/username" />
                        <DashInput label="Twitter / X URL" value={twitterUrl} onChange={setTwitterUrl} placeholder="https://twitter.com/username" />
                    </div>
                </div>

                <div className="pt-6 border-t mt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>03 — resume / cv</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashInput label="CV URL (EN)" value={resumeUrlEn} onChange={setResumeUrlEn} placeholder="https://..." />
                        <DashInput label="CV URL (ES)" value={resumeUrlEs} onChange={setResumeUrlEs} placeholder="https://..." />
                    </div>
                </div>

                <div className="pt-6 border-t mt-2 flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="font-mono text-xs tracking-widest px-8 py-3 font-bold transition-all disabled:opacity-40"
                        style={{ background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)', borderRadius: '2px' }}
                    >
                        {isSaving ? 'saving...' : 'save profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function DashInput({ label, value, onChange, placeholder = '', type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="font-mono text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm outline-none transition-colors"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', borderRadius: '2px' }}
            />
        </div>
    );
}

function DashTextarea({ label, value, onChange, rows = 3, placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="font-mono text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</label>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                rows={rows}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm outline-none resize-y transition-colors"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', borderRadius: '2px' }}
            />
        </div>
    );
}
