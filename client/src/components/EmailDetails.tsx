import React from 'react';
import type { Email } from '../types/Email';
interface EmailDetailsProps {
    email: Email;
    onClose: () => void;
}

const EmailDetails: React.FC<EmailDetailsProps> = ({ email, onClose }) => {
    return (
        <div className="w-1/2 bg-white flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Email Details</h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <span className="text-xl">&times;</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Sender:</span>
                            <span className="text-sm font-medium text-gray-900">{email.sender}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Subject:</span>
                            <span className="text-sm font-medium text-gray-900 text-right">{email.subject}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Received:</span>
                            <span className="text-sm font-medium text-gray-900">
                                {new Date(email.receivedAt).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Message ID:</span>
                            <span className="text-sm font-mono text-gray-900 truncate max-w-full" title={email.messageId}>
                                {email.messageId}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ESP Analysis */}
                <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">ESP Analysis</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">ESP Type:</span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {email.espType}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Details:</span>
                            <span className="text-sm font-medium text-gray-900">{email.espDetails}</span>
                        </div>
                    </div>
                </div>

                {/* Receiving Chain */}
                <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Receiving Chain</h4>
                    {email.receivingChain.length > 0 ? (
                        <div className="space-y-2">
                            {email.receivingChain.map((server, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm font-mono text-gray-900">{server}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">No receiving chain data available</p>
                    )}
                </div>

                {/* Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Processing Status</h4>
                    <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${email.processed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {email.processed ? '✓ Processed' : '⏳ Pending'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailDetails;