

import React from 'react';
import { InterviewSession, InterviewRoundType } from '../types';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { CodeIcon } from './icons/CodeIcon';
import { DiagramIcon } from './icons/DiagramIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';

interface InterviewRoundsTrackerProps {
  session: InterviewSession;
  onReset: () => void;
}

const getIconForRound = (type: InterviewRoundType, isCurrent: boolean): React.ReactNode => {
    const className = `w-5 h-5 mr-3 flex-shrink-0 ${isCurrent ? 'text-blue-400' : 'text-gray-400'}`;

    switch (type) {
        case 'INTRODUCTION':
            return <ChatBubbleIcon className={className} />;
        case 'RESUME_DEEP_DIVE':
            return <UserCircleIcon className={className} />;
        case 'BEHAVIOURAL':
            return <ChatBubbleIcon className={className} />;
        case 'CODING_CHALLENGE':
            return <CodeIcon className={className} />;
        case 'SYSTEM_DESIGN':
            return <DiagramIcon className={className} />;
        case 'HR_WRAPUP':
            return <BriefcaseIcon className={className} />;
        default:
            return <BriefcaseIcon className={className} />;
    }
};


export const InterviewRoundsTracker: React.FC<InterviewRoundsTrackerProps> = ({ session, onReset }) => {
  const { rounds, currentRoundIndex, company, role } = session;
  const currentInterviewerName = rounds[currentRoundIndex]?.interviewerName || 'Interviewer';

  return (
    <aside className="w-full md:w-80 lg:w-96 bg-gray-800/50 p-6 flex flex-col border-b md:border-b-0 md:border-r border-gray-700 md:h-full max-h-[50vh] md:max-h-full flex-shrink-0">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
          Interview Plan
        </h2>
        <button onClick={onReset} className="text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md px-2 py-1 transition-colors">
          End Interview
        </button>
      </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="mb-6 flex-shrink-0 bg-gray-900/50 p-4 rounded-lg space-y-3">
            <div className="flex items-start">
                <BriefcaseIcon className="w-8 h-8 mr-3 flex-shrink-0 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold">{role}</h3>
                  <p className="text-sm text-gray-400">at {company}</p>
                </div>
            </div>
             <div className="text-sm text-gray-300 bg-gray-700/50 rounded-lg px-3 py-2">
                Current Interviewer: <span className="font-semibold text-white">{currentInterviewerName}</span>
              </div>
          </div>

          <h4 className="font-semibold text-gray-300 mb-3 flex-shrink-0">Rounds</h4>
          <ul className="space-y-2 overflow-y-auto flex-1 pr-2 mb-4">
            {rounds.map((round, index) => {
              const isCompleted = round.completed;
              const isCurrent = index === currentRoundIndex;

              let icon;
              let textClass = "text-gray-200";
              let bgClass = "bg-gray-800/50";

              if (isCurrent) {
                icon = <PencilIcon className="w-5 h-5 mr-3 text-blue-400 flex-shrink-0" />;
                textClass = "text-white font-semibold";
                bgClass = "bg-blue-900/50 border-blue-500";
              } else if (isCompleted) {
                icon = <CheckCircleIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />;
                textClass = "text-gray-400";
              } else {
                icon = getIconForRound(round.type, false);
                textClass = "text-gray-300";
              }
              
              return (
                <li key={index}>
                  <div
                    className={`w-full flex items-center p-3 rounded-lg text-left transition-all duration-200 border border-transparent ${bgClass}`}
                  >
                    {icon}
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`${textClass} ${isCompleted ? 'line-through' : ''}`}>{round.title}</span>
                      <span className="text-xs font-bold text-gray-500 ml-2">{round.estimatedMinutes} min</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
    </aside>
  );
};