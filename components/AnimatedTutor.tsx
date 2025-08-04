
import React from 'react';
import { TutorAvatarIcon } from './icons/TutorAvatarIcon';

interface AnimatedTutorProps {
  isSpeaking: boolean;
  isThinking: boolean;
  spokenText: string;
  mouthShape: string;
  fallbackMessage: string | undefined;
}

export const AnimatedTutor: React.FC<AnimatedTutorProps> = ({ isSpeaking, isThinking, spokenText, mouthShape, fallbackMessage }) => {
  
  const displayMessage = isThinking 
    ? '' // Don't show text when thinking, the indicator is enough
    : isSpeaking && spokenText 
    ? spokenText // Show live text as it's spoken
    : fallbackMessage; // Show the full message when not speaking

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <div className="relative w-32 h-32 md:w-36 md:h-36 mb-4">
        <TutorAvatarIcon mouthShape={isThinking ? 'X' : mouthShape} className="w-full h-full" />
      </div>
      <div className="h-16 flex items-center justify-center w-full px-4">
        {isThinking ? (
          <div className="flex items-center space-x-2 bg-gray-700/50 px-4 py-3 rounded-lg">
            <span className="text-gray-300 mr-2">Thinking...</span>
            <div className="w-2 h-2 rounded-full bg-purple-300 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-purple-300 animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 rounded-full bg-purple-300 animate-pulse [animation-delay:0.4s]"></div>
          </div>
        ) : displayMessage ? (
          <p className="text-gray-200 text-base md:text-lg p-2 bg-black bg-opacity-20 rounded-md">
            {displayMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
};
