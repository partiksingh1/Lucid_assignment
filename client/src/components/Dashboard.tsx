import React from 'react';
import type { Email } from '../types/Email';
import StatsCard from './StatsCard';
import ESPChart from './ESPChart';
import RecentEmails from './RecentEmail';

interface DashboardProps {
    emails: Email[];
    loading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ emails, loading }) => {
    const today = new Date().toDateString();
    const todayEmails = emails.filter(email =>
        new Date(email.receivedAt).toDateString() === today
    );

    const espCounts = emails.reduce((acc, email) => {
        acc[email.espType] = (acc[email.espType] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const recentEmails = emails.slice(0, 5);

    if (loading && emails.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading emails...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    {loading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    <span className="text-sm text-gray-500">
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Emails"
                    value={emails.length}
                    icon="📧"
                    color="blue"
                />
                <StatsCard
                    title="Today's Emails"
                    value={todayEmails.length}
                    icon="📅"
                    color="green"
                />
                <StatsCard
                    title="ESP Types"
                    value={Object.keys(espCounts).length}
                    icon="🌐"
                    color="purple"
                />
                <StatsCard
                    title="Processed"
                    value={emails.filter(e => e.processed).length}
                    icon="✅"
                    color="orange"
                />
            </div>

            {/* Charts and Recent Emails */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ESPChart espCounts={espCounts} />
                <RecentEmails emails={recentEmails} />
            </div>
        </div>
    );
};

export default Dashboard;