import React from 'react';
import type { Email } from '../types/Email';
interface RecentEmailsProps {
    emails: Email[];
}

const RecentEmails: React.FC<RecentEmailsProps> = ({ emails }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Emails</h3>

            {emails.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No emails found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {emails.map((email) => (
                        <div key={email._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {email.sender}
                                </p>
                                <p className="text-xs text-gray-600 truncate">
                                    {email.subject}
                                </p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                                <span className="text-xs text-gray-500">
                                    {new Date(email.receivedAt).toLocaleTimeString()}
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {email.espType}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentEmails;