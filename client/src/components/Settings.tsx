import React, { useState, useEffect } from 'react';

export const Settings: React.FC = () => {
    const [emailConfig, setEmailConfig] = useState({
        emailAddress: 'partiksingh28@gmail.com',
        subject: 'LUCID IMAP TEST'
    });
    const [loading, setLoading] = useState(false);

    const fetchEmailConfig = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/emails/config/email-address`);
            const data = await response.json();
            setEmailConfig(data);
        } catch (error) {
            console.error('Error fetching email config:', error);
        }
    };

    useEffect(() => {
        fetchEmailConfig();
    }, []);

    const handleRefresh = async () => {
        setLoading(true);
        await fetchEmailConfig();
        setLoading(false);
    };

    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                    {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                    <span>Refresh</span>
                </button>
            </div>

            <div className="max-w-2xl space-y-6">
                {/* Email Configuration */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={emailConfig.emailAddress}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This is the email address being monitored for incoming emails.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subject Filter
                            </label>
                            <input
                                type="text"
                                value={emailConfig.subject}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Only emails with this subject line will be processed.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <span className="text-green-600">✓</span>
                            <span className="text-sm font-medium text-gray-900">IMAP Connection</span>
                        </div>
                        <span className="text-sm text-green-600">Connected</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <span className="text-green-600">✓</span>
                            <span className="text-sm font-medium text-gray-900">Database</span>
                        </div>
                        <span className="text-sm text-green-600">Connected</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <span className="text-blue-600">🔄</span>
                            <span className="text-sm font-medium text-gray-900">Email Sync</span>
                        </div>
                        <span className="text-sm text-blue-600">Every 2 Minutes</span>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>

                <div className="space-y-2 text-sm text-gray-600">
                    <p>
                        <strong className="text-gray-900">Version:</strong> 1.0.0
                    </p>
                    <p>
                        <strong className="text-gray-900">Project:</strong> Lucid Assignment
                    </p>
                    <p>
                        <strong className="text-gray-900">Description:</strong> Email analytics dashboard for monitoring and analyzing incoming emails through IMAP.
                    </p>
                </div>
            </div>
        </div>
    );
};