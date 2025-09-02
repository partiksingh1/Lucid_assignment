import React from 'react';
import type { Email } from '../types/Email';
interface EmailListProps {
    emails: Email[];
    onEmailSelect: (email: Email) => void;
    selectedEmail: Email | null;
    loading: boolean;
}

const EmailList: React.FC<EmailListProps> = ({
    emails,
    onEmailSelect,
    selectedEmail,
    loading
}) => {
    if (loading && emails.length === 0) {
        return (
            <div className="w-1/2 border-r border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-1/2 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    Emails ({emails.length})
                </h3>
            </div>

            <div className="divide-y divide-gray-200">
                {emails.map((email) => (
                    <div
                        key={email._id}
                        onClick={() => onEmailSelect(email)}
                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${selectedEmail?._id === email._id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {email.sender}
                                </p>
                                <p className="text-sm text-gray-600 truncate mt-1">
                                    {email.subject}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {new Date(email.receivedAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {email.espType}
                                </span>
                                {email.processed && (
                                    <span className="text-xs text-green-600">✓ Processed</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmailList;