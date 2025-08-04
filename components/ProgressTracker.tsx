import React from 'react';
import { Skill, UserProfile } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { FireIcon } from './icons/FireIcon';
import { CoinIcon } from './icons/CoinIcon';

interface ProgressTrackerProps {
  currentSkill: Skill | undefined;
  onReset: () => void;
  onSelectTopic: (topicId: string) => void;
  currentTopicId: string | null;
  userProfile: UserProfile;
}

const StatCard: React.FC<{ icon: React.ReactNode; value: number | string; label: string; color: string }> = ({ icon, value, label, color }) => (
    <div className="bg-gray-700/50 p-3 rounded-lg flex items-center">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center mr-3 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
        </div>
    </div>
);

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ currentSkill, onReset, onSelectTopic, currentTopicId, userProfile }) => {
  const totalTopics = currentSkill?.topics.length || 0;
  const completedTopics = currentSkill?.topics.filter(t => t.isCompleted).length || 0;
  const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  return (
    <aside className="w-full md:w-80 lg:w-96 bg-gray-800/50 p-6 flex flex-col border-b md:border-b-0 md:border-r border-gray-700 md:h-full max-h-[50vh] md:max-h-full flex-shrink-0">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Your Progress
        </h2>
        <button onClick={onReset} className="text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md px-2 py-1 transition-colors">
          Change Skill
        </button>
      </div>

      {currentSkill ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="grid grid-cols-2 gap-4 mb-6 flex-shrink-0">
            <StatCard icon={<CoinIcon className="w-5 h-5 text-yellow-300"/>} value={userProfile.points.toLocaleString()} label="Points" color="bg-yellow-500/20" />
            <StatCard icon={<FireIcon className="w-5 h-5 text-orange-400"/>} value={userProfile.currentStreak} label="Day Streak" color="bg-orange-500/20" />
          </div>

          <div className="flex items-center mb-4 flex-shrink-0">
            {React.createElement(currentSkill.icon || BookOpenIcon, { className: "w-10 h-10 mr-4 flex-shrink-0" })}
            <div>
              <h3 className="text-lg font-semibold">{currentSkill.name}</h3>
              <p className="text-sm text-gray-400">
                {completedTopics} / {totalTopics} topics completed
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6 flex-shrink-0">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full"
              style={{ width: `${progressPercentage}%`, transition: 'width 0.5s ease-in-out' }}
            ></div>
          </div>

          <h4 className="font-semibold text-gray-300 mb-3 flex-shrink-0">Topics</h4>
          <ul className="space-y-2 overflow-y-auto flex-1 pr-2 mb-4">
            {currentSkill.topics.map((topic, index) => {
              const isCompleted = topic.isCompleted;
              const isCurrent = topic.id === currentTopicId;
              const isLocked = index > 0 && !currentSkill.topics[index - 1].isCompleted;
              const isSelectable = !isLocked;

              let icon;
              let textClass = "text-gray-200";
              let bgClass = "bg-gray-800/50 hover:bg-gray-700/80";

              if (isLocked) {
                icon = <LockClosedIcon className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0" />;
                textClass = "text-gray-500";
                bgClass = "bg-gray-800/30";
              } else if (isCurrent) {
                icon = <PencilIcon className="w-5 h-5 mr-3 text-purple-400 flex-shrink-0" />;
                textClass = "text-white font-semibold";
                bgClass = "bg-purple-900/50 border-purple-500";
              } else if (isCompleted) {
                icon = <CheckCircleIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />;
                textClass = "text-gray-400";
                bgClass = "bg-gray-800/50 hover:bg-gray-700/80";
              } else {
                icon = <BookOpenIcon className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />;
                textClass = "text-gray-300";
              }
              
              return (
                <li key={topic.id}>
                  <button
                    onClick={() => isSelectable && onSelectTopic(topic.id)}
                    disabled={!isSelectable}
                    className={`w-full flex items-center p-3 rounded-lg text-left transition-all duration-200 border border-transparent ${bgClass} ${isSelectable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    {icon}
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`${textClass} ${isCompleted ? 'line-through' : ''}`}>{topic.title}</span>
                      <span className="text-xs font-bold text-yellow-400/80 ml-2">+{topic.points} pts</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="text-center text-gray-400 flex-1 flex items-center justify-center">
            <p>Select a skill to begin.</p>
        </div>
      )}
    </aside>
  );
};