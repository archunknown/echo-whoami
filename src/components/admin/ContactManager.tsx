import { useState, useEffect } from 'react';
import { getContactMessages, deleteContactMessage } from '../../services/api';

export default function ContactManager() {
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getContactMessages();
            setMessages(data || []);
        } catch {
            setError('Failed to load messages.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete message from "${name}"?`)) return;
        try {
            await deleteContactMessage(id);
            await load();
        } catch {
            setError('Failed to delete message.');
        }
    };

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderTop: 'none', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Messages</h3>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{messages.length} received</p>
                </div>
                <button onClick={load} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border-default)', padding: '0.4rem 1rem', cursor: 'pointer', borderRadius: '2px' }}>
                    refresh
                </button>
            </div>

            {error && <div style={{ margin: '1rem', padding: '0.75rem', background: '#1a0000', border: '1px solid #8b0000', color: '#c0392b', fontFamily: 'monospace', fontSize: '0.75rem', borderRadius: '2px' }}>{error}</div>}

            {isLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading messages...</div>
            ) : messages.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>_</p>
                    <p>Inbox is empty.</p>
                </div>
            ) : (
                <div>
                    {messages.map(msg => (
                        <div key={msg.id} style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{msg.name}</p>
                                    <a href={`mailto:${msg.email}`} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-accent)', textDecoration: 'none' }}>{msg.email}</a>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '2px' }}>
                                        {new Date(msg.created_at).toLocaleString()}
                                    </span>
                                    <button onClick={() => handleDelete(msg.id, msg.name)} style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        delete
                                    </button>
                                </div>
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '2px' }}>
                                <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>{msg.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
