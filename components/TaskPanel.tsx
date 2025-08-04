import React from 'react';
import { LessonStep } from '../types';

interface TaskPanelProps {
  mission: string | undefined;
  currentStep: LessonStep | null | undefined;
  title: string | undefined;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ mission, currentStep, title }) => {
  const shouldDisplay = (mission && mission.trim() !== '') || (currentStep && currentStep.type === 'CODE_TASK');
  
  if (!shouldDisplay) {
    return null;
  }

  return (
    <div className="bg-gray-800 border-2 border-purple-500/50 rounded-2xl shadow-lg text-white transition-all duration-500 ease-in-out flex flex-col max-h-[35vh]">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6 flex-shrink-0">
        <h3 className="text-lg sm:text-xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          {title || 'Your Mission'}
        </h3>
      </div>
      <div className="overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 flex-1 min-h-0">
        <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-sans whitespace-pre-wrap">
          {mission}
        </p>
      </div>
    </div>
  );
};