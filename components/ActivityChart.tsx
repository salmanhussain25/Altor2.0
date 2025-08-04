
import React, { useMemo } from 'react';
import { ActivityLogEntry } from '../types';

interface ActivityChartProps {
    activityLog: ActivityLogEntry[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ActivityChart: React.FC<ActivityChartProps> = ({ activityLog }) => {

    const chartData = useMemo(() => {
        const data: { day: string; date: string; points: number }[] = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const dayName = DAY_NAMES[date.getDay()];

            const logEntry = activityLog.find(log => log.date === dateString);
            data.push({
                day: dayName,
                date: dateString,
                points: logEntry ? logEntry.points : 0
            });
        }
        return data;
    }, [activityLog]);

    const maxPoints = useMemo(() => {
        const points = chartData.map(d => d.points);
        const max = Math.max(...points);
        return max > 0 ? max : 100; // Use a default max if all points are 0
    }, [chartData]);

    if (!activityLog || activityLog.length === 0) {
        return <div className="text-center text-gray-400 p-8">No activity recorded yet. Complete a lesson to see your progress!</div>
    }

    return (
        <div className="w-full h-64 flex justify-around items-end gap-2 sm:gap-4">
            {chartData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center h-full">
                    <div className="relative w-full h-full flex items-end justify-center group">
                        <div
                            className="w-8 sm:w-10 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg transition-all duration-500 ease-out"
                            style={{ height: `${(data.points / maxPoints) * 100}%` }}
                        >
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none">
                                {data.points} pts
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
                            </div>
                        </div>
                    </div>
                    <span className="text-gray-400 text-xs sm:text-sm mt-2">{data.day}</span>
                </div>
            ))}
        </div>
    );
};
