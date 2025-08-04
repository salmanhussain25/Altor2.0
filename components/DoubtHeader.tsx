import React from 'react';
import { LightBulbIcon } from './icons/LightBulbIcon';

interface DoubtHeaderProps {
  onReset: () => void;
}

export const DoubtHeader: React.FC<DoubtHeaderProps> = ({ onReset }) => {
  return (
    <aside className="w-full md:w-80 lg:w-96 bg-gray-800/50 p-6 flex flex-col border-b md:border-b-0 md:border-r border-gray-700 md:h-full max-h-[30vh] md:max-h-full flex-shrink-0">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
          Doubt Solver
        </h2>
        <button onClick={onReset} className="text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-md px-2 py-1 transition-colors">
          Start Over
        </button>
      </div>

       <div className="text-center text-gray-400 flex-1 flex flex-col items-center justify-center">
            <LightBulbIcon className="w-16 h-16 text-teal-500/50 mb-4" />
            <p>Paste a problem to get started. I'll explain the solution and answer your questions.</p>
        </div>
    </aside>
  );
};
