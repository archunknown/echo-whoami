import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import Dashboard from './Dashboard';
import ProjectManager from './ProjectManager';
import CertificationManager from './CertificationManager';
import EducationManager from './EducationManager';
import TechnologyManager from './TechnologyManager';
import ContactManager from './ContactManager';

type Tab = 'profile' | 'projects' | 'certifications' | 'education' | 'stack' | 'messages';

export default function AdminApp() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        }

        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const tabStyle = (tab: Tab) => ({
        background: 'transparent',
        border: 'none',
        borderBottom: activeTab === tab ? '1px solid var(--color-accent)' : '1px solid transparent',
        color: activeTab === tab ? 'var(--color-accent)' : 'var(--text-secondary)',
        padding: '0.5rem 1rem',
        fontFamily: 'monospace',
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap' as const,
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                authenticating...
            </div>
        );
    }

    if (!session) {
        return (
            <div style={{ maxWidth: '400px', margin: '5rem auto', padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>echo-whoami — admin</p>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>Sign In</h2>
                </div>

                {error && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1a0000', border: '1px solid #8b0000', color: '#c0392b', fontFamily: 'monospace', fontSize: '0.75rem', borderRadius: '2px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <LoginField label="email" id="email" type="email" value={email} onChange={setEmail} />
                    <LoginField label="password" id="password" type="password" value={password} onChange={setPassword} />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            background: 'var(--color-accent)',
                            color: '#fff',
                            border: '1px solid var(--color-accent)',
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            letterSpacing: '0.15em',
                            fontWeight: 700,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.5 : 1,
                            borderRadius: '2px',
                            transition: 'opacity 0.15s',
                        }}
                    >
                        {loading ? 'signing in...' : 'sign in →'}
                    </button>
                </form>
            </div>
        );
    }

    const TABS: { id: Tab; label: string }[] = [
        { id: 'profile', label: 'profile' },
        { id: 'projects', label: 'projects' },
        { id: 'certifications', label: 'certifications' },
        { id: 'education', label: 'education' },
        { id: 'stack', label: 'stack' },
        { id: 'messages', label: 'messages' },
    ];

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            {/* Top bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                marginBottom: '0',
                gap: '1rem',
                flexWrap: 'wrap',
            }}>
                <div>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>echo-whoami — admin</p>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{session.user.email}</p>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                        padding: '0.4rem 1rem',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        transition: 'all 0.15s',
                    }}
                >
                    sign out
                </button>
            </div>

            {/* Tab nav */}
            <div style={{
                display: 'flex',
                gap: 0,
                background: 'var(--bg-secondary)',
                borderLeft: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                overflowX: 'auto',
            }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabStyle(tab)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'profile' && <Dashboard />}
            {activeTab === 'projects' && <ProjectManager />}
            {activeTab === 'certifications' && <CertificationManager />}
            {activeTab === 'education' && <EducationManager />}
            {activeTab === 'stack' && <TechnologyManager />}
            {activeTab === 'messages' && <ContactManager />}
        </div>
    );
}

function LoginField({ label, id, type, value, onChange }: { label: string; id: string; type: string; value: string; onChange: (v: string) => void }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label htmlFor={id} style={{ fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>{label}</label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                required
                style={{
                    padding: '0.6rem 0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    outline: 'none',
                    borderRadius: '2px',
                }}
            />
        </div>
    );
}
