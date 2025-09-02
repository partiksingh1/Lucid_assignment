import React from 'react';

interface ESPChartProps {
    espCounts: Record<string, number>;
}

const ESPChart: React.FC<ESPChartProps> = ({ espCounts }) => {
    const total = Object.values(espCounts).reduce((sum, count) => sum + count, 0);
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ESP Distribution</h3>

            {total === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No data available</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(espCounts).map(([esp, count], index) => {
                        const percentage = Math.round((count / total) * 100);
                        return (
                            <div key={esp} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">{esp}</span>
                                    <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${colors[index % colors.length]}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ESPChart;