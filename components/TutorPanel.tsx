

import React, { useState, useEffect, useRef } from 'react';
import { TutorState, ChatMessage, LessonStep, AppMode } from '../types';
import { RobotIcon } from './icons/RobotIcon';
import { SpeakerOnIcon } from './icons/SpeakerOnIcon';
import { SpeakerOffIcon } from './icons/SpeakerOffIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { AnimatedTutor } from './AnimatedTutor';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';

interface TutorPanelProps {
  appMode: AppMode;
  tutorState: TutorState;
  isLoading: boolean;
  conversationHistory: ChatMessage[];
  error: string | null;
  chatError: string | null;
  onRetryChat: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartLearning: () => void;
  onSendMessage: (message: string, attachment?: File | null, isSystemMessage?: boolean) => void;
  onNextLesson: () => void;
  onNextStep: () => void;
  onAnswerMcq: (choiceIndex: number) => void;
  onTryAgain: () => void;
  onContinueLesson: () => void;
  onRequestHint: () => void;
  onShowSolution: () => void;
  incorrectAttempts: number;
  currentTopicTitle?: string;
  currentStep: LessonStep | null | undefined;
  isListening: boolean;
  interimTranscript: string;
  isSpeechSupported: boolean;
  isSpeaking: boolean;
  spokenText: string;
  mouthShape: string;
  showStartLearningButton: boolean;
}

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    // This component is now only used for user messages.
    return (
        <div className={`p-3 max-w-md md:max-w-lg shadow-md bg-purple-600 text-white self-end rounded-lg rounded-br-none`}>
            <p>{message.text}</p>
        </div>
    );
};

const isDebugMode = () => typeof window !== 'undefined' && window.localStorage.getItem('debugMode') === 'true';

export const TutorPanel: React.FC<TutorPanelProps> = (props) => {
  const { appMode, tutorState, isLoading, conversationHistory, error, chatError, onRetryChat, isMuted, onToggleMute, onStartLearning, onSendMessage, onNextLesson, onNextStep, onAnswerMcq, onTryAgain, onContinueLesson, onRequestHint, onShowSolution, incorrectAttempts, currentTopicTitle, currentStep, isListening, interimTranscript, isSpeechSupported, isSpeaking, spokenText, mouthShape, showStartLearningButton } = props;
  
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDebug] = useState(isDebugMode());

  const chatEndRef = useRef<HTMLDivElement>(null);

  const visibleHistory = conversationHistory.filter(msg => !msg.isSystem);
  const userMessages = visibleHistory.filter(m => m.sender === 'user');
  const lastAiMessage = [...visibleHistory].reverse().find(m => m.sender === 'ai');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userMessages, chatError, lastAiMessage]);

  useEffect(() => {
    if (attachment) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(attachment);
    } else {
      setAttachmentPreview(null);
    }
  }, [attachment]);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  const handleClearAttachment = () => {
    setAttachment(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if ((input.trim() || attachment) && !isChatDisabled) {
          onSendMessage(input.trim(), attachment);
          setInput('');
          setAttachment(null);
      }
  };

  const renderActionButtons = () => {
    if (appMode === 'INTERVIEW_PREP' && tutorState === TutorState.AWAITING_TASK) {
       // No specific action buttons during interview flow, it's all conversational
       return null;
    }

    switch(tutorState) {
        case TutorState.CORRECT:
            return <button onClick={onNextLesson} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">Next Lesson</button>;
        case TutorState.INCORRECT:
            if (currentStep?.type === 'MULTIPLE_CHOICE') {
                return (
                    <button onClick={onTryAgain} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        Try Again
                    </button>
                )
            }
            
            const hintButtonText = incorrectAttempts === 1 ? 'Get a Hint' : 'Get Another, More Specific Hint';
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white font-bold transition-colors">
                    {incorrectAttempts < 3 ? (
                        <button onClick={onRequestHint} className="w-full bg-blue-600 hover:bg-blue-500 py-3 px-4 rounded-lg">
                           {hintButtonText}
                        </button>
                    ) : (
                         <button onClick={onShowSolution} className="w-full bg-green-600 hover:bg-green-500 py-3 px-4 rounded-lg">
                           Show Me The Solution
                        </button>
                    )}
                    <button onClick={onTryAgain} className="w-full bg-yellow-600 hover:bg-yellow-500 py-3 px-4 rounded-lg">
                        Try Again
                    </button>
                </div>
            );
        case TutorState.CLARIFYING_DOUBT:
            return <button onClick={onContinueLesson} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">Continue</button>;
        case TutorState.AWAITING_CONTINUE:
             return <button onClick={onNextStep} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">Continue</button>;
        case TutorState.AWAITING_CHOICE:
            if (currentStep?.type === 'MULTIPLE_CHOICE' && currentStep.choices) {
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {currentStep.choices.map((choice, index) => (
                            <button key={index} onClick={() => onAnswerMcq(index)} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-2 rounded-lg transition-colors text-sm">
                                {choice}
                            </button>
                        ))}
                    </div>
                )
            }
            return null;
        default:
            return null;
    }
  }

  const isChatDisabled = isLoading || 
                         tutorState === TutorState.SELECTING_SKILL || 
                         tutorState === TutorState.AWAITING_CONTINUE ||
                         tutorState === TutorState.CORRECT;
  
  const isTutorThinking = isLoading && (tutorState === TutorState.LOADING_LESSON || tutorState === TutorState.CHATTING || tutorState === TutorState.EVALUATING);
  
  const placeholderText = isListening 
      ? "Listening..."
      : isChatDisabled && tutorState !== TutorState.AWAITING_CHOICE
      ? "Processing..." 
      : isSpeechSupported 
      ? "Ask a question (or just start talking)..."
      : "Ask a question...";

  const PanelIcon = appMode === 'INTERVIEW_PREP' ? BriefcaseIcon : RobotIcon;
  const panelIconColor = appMode === 'INTERVIEW_PREP' ? 'text-blue-400' : 'text-purple-400';
  const panelBorderColor = appMode === 'INTERVIEW_PREP' ? 'border-blue-500' : 'border-purple-500';

  return (
    <div className="bg-gray-800 rounded-2xl p-4 flex flex-col h-full min-h-0 shadow-2xl border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center border-2 ${panelBorderColor}`}>
            <PanelIcon className={`w-7 h-7 ${panelIconColor}`} />
          </div>
          <h2 className="text-lg font-bold text-gray-100">{currentTopicTitle || 'AI Assistant'}</h2>
        </div>
        <div className="flex items-center gap-4">
            {isDebug && (
                <div className="bg-purple-900/80 text-white text-xs font-mono py-1 px-2 rounded-lg shadow-lg" title={TutorState[tutorState]}>
                    State: <span className='font-bold'>{TutorState[tutorState]}</span>
                </div>
            )}
            <button onClick={onToggleMute} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors">
            {isMuted ? <SpeakerOffIcon className="w-6 h-6" /> : <SpeakerOnIcon className="w-6 h-6" />}
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {showStartLearningButton ? (
            <div className="flex flex-col items-center justify-center text-center flex-1">
                <AnimatedTutor 
                  isSpeaking={false} 
                  isThinking={false} 
                  spokenText=""
                  mouthShape="X"
                  fallbackMessage={`Ready to learn about ${currentTopicTitle || 'a new topic'}?`} 
                />
                 <div className="mt-4">
                  <p className="text-gray-300 mb-4">Click the button below to start the first lesson.</p>
                  <button onClick={onStartLearning} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center justify-center">
                      <PlayIcon className="w-5 h-5 mr-2" />
                      Start Learning
                  </button>
                </div>
            </div>
        ) : (
          <>
            <div className="flex-shrink-0">
              <AnimatedTutor
                isSpeaking={isSpeaking}
                isThinking={isTutorThinking}
                spokenText={spokenText}
                mouthShape={mouthShape}
                fallbackMessage={lastAiMessage?.text}
              />
            </div>
            <div className="flex-1 flex flex-col space-y-4 p-2 overflow-y-auto min-h-0">
              {userMessages.map((msg, index) => <MessageBubble key={index} message={msg} />)}
              {chatError && (
                 <div className="p-3 max-w-md md:max-w-lg shadow-md bg-red-900/50 text-white self-start rounded-lg flex flex-col items-start gap-2">
                    <p>{chatError}</p>
                    <button onClick={onRetryChat} className="bg-red-500 hover:bg-red-400 text-white font-semibold py-1 px-3 rounded-md text-sm">
                        Retry
                    </button>
                </div>
              )}
              {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg self-start">{error}</p>}
              <div ref={chatEndRef} />
            </div>
          </>
        )}
      </div>

      <div className="flex-shrink-0 mt-2">
        <div className="p-2 min-h-[52px]">
            {renderActionButtons()}
        </div>
        <div className="p-2 border-t border-gray-700">
            {attachmentPreview && (
                <div className="relative inline-block mb-2">
                    <img src={attachmentPreview} alt="Attachment preview" className="h-20 w-auto rounded-lg object-cover" />
                    <button onClick={handleClearAttachment} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full">
                        <XCircleIcon className="w-6 h-6"/>
                    </button>
                </div>
            )}
             <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isChatDisabled}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                    title="Attach image"
                >
                    <PaperclipIcon className="w-6 h-6" />
                </button>
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={isListening ? interimTranscript : input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholderText}
                        disabled={isChatDisabled || isListening}
                        className="flex-1 w-full bg-gray-700 border-2 border-gray-600 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                     {isSpeechSupported && <MicrophoneIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isListening ? 'text-purple-400 animate-pulse' : 'text-gray-400'}`} />}
                </div>
                <button
                    type="submit"
                    disabled={isChatDisabled || (!input.trim() && !attachment) || isListening}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                >
                    <PaperAirplaneIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};