import { useState, useEffect } from 'react';
import { getContactMessages, deleteContactMessage } from '../../services/api';

export default function ContactManager() {
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getContactMessages();
            setMessages(data || []);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load contact messages.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the message from "${name}"? This cannot be undone.`)) {
            try {
                await deleteContactMessage(id);
                await loadMessages();
            } catch (err: any) {
                console.error(err);
                alert('Failed to delete message.');
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl mt-6 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Contact Messages</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {messages.length} message{messages.length !== 1 ? 's' : ''} received.
                    </p>
                </div>
                <button
                    onClick={loadMessages}
                    className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="p-12 text-center text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p>Inbox is empty.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {messages.map((msg) => (
                        <div key={msg.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{msg.name}</h4>
                                    <a href={`mailto:${msg.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                        {msg.email}
                                    </a>
                                </div>
                                <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {new Date(msg.created_at).toLocaleString()}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(msg.id, msg.name)}
                                        className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                                    >
                                        Delete Message
                                    </button>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed text-sm">
                                    {msg.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
