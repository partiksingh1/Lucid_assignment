import React from 'react';
import type { Email } from '../types/Email';

interface AnalyticsProps {
    emails: Email[];
}

const Analytics: React.FC<AnalyticsProps> = ({ emails }) => {
    // Calculate hourly distribution
    const hourlyDistribution = emails.reduce((acc, email) => {
        const hour = new Date(email.receivedAt).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    // Calculate daily distribution for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toDateString();
    }).reverse();

    const dailyDistribution = last7Days.map(dateString => {
        const count = emails.filter(email =>
            new Date(email.receivedAt).toDateString() === dateString
        ).length;
        return { date: dateString, count };
    });

    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full">
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Distribution */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Distribution</h3>
                    <div className="space-y-2">
                        {Array.from({ length: 24 }, (_, hour) => {
                            const count = hourlyDistribution[hour] || 0;
                            const maxCount = Math.max(...Object.values(hourlyDistribution), 1);
                            const width = (count / maxCount) * 100;

                            return (
                                <div key={hour} className="flex items-center space-x-3">
                                    <span className="text-xs text-gray-600 w-8">
                                        {hour.toString().padStart(2, '0')}:00
                                    </span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                                        <div
                                            className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                                            style={{ width: `${width}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-600 w-8">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Daily Distribution */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Last 7 Days</h3>
                    <div className="space-y-3">
                        {dailyDistribution.map(({ date, count }) => {
                            const maxCount = Math.max(...dailyDistribution.map(d => d.count), 1);
                            const width = (count / maxCount) * 100;

                            return (
                                <div key={date} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-700">
                                            {new Date(date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                        <span className="text-sm text-gray-600">{count}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${width}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;