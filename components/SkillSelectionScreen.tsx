
import React, { useState } from 'react';
import { Skill, CourseOutline, UserProfile, Badge } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { generateCourseOutline } from '@/services/geminiServices';
import { TrashIcon } from './icons/TrashIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { ProgressDashboard } from './ProgressDashboard.tsx';
import { ChartBarIcon } from './icons/ChartBarIcon.tsx';
import { BriefcaseIcon } from './icons/BriefcaseIcon.tsx';

interface SkillSelectionScreenProps {
  userProfile: UserProfile;
  onSelectSkill: (skillId: string) => void;
  onDeleteSkill: (skillId: string) => void;
  onCreateSkill: (outline: CourseOutline) => void;
  onSetMode: (mode: 'TUTOR' | 'DOUBT_SOLVER' | 'INTERVIEW_PREP') => void;
  onViewCertificate: (badge: Badge) => void;
  onLogout: () => void;
}

type MainView = 'COURSES' | 'PROGRESS';

const SkillCard: React.FC<{
  skill: Skill;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ skill, onSelect, onDelete }) => {
    const Icon = skill.icon || BookOpenIcon;

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    return (
        <div
            onClick={onSelect}
            className="bg-gray-800 border-2 border-gray-700 rounded-2xl group hover:border-purple-500 hover:-translate-y-2 transition-all duration-300 ease-in-out shadow-lg hover:shadow-purple-500/20 w-full flex flex-col cursor-pointer relative"
            aria-label={`Select course ${skill.name}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
        >
            <div className="p-6 text-center flex-grow flex flex-col justify-center items-center">
                <div className="flex justify-center items-center mb-4 h-24">
                    <Icon className="w-20 h-20 transition-transform duration-300 group-hover:scale-110 text-purple-400" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-100">{skill.name}</h2>
            </div>
          
            <div className="absolute top-2 right-2 z-10">
                <button
                    onClick={handleDeleteClick}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    title={`Delete ${skill.name}`}
                    aria-label={`Delete course ${skill.name}`}
                >
                    <TrashIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
};


const ModeButton: React.FC<{ title: string; description: string; icon: React.FC<any>; onClick: () => void; colorClass: string; }> = ({ title, description, icon: Icon, onClick, colorClass}) => (
  <button 
    onClick={onClick}
    className={`bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 text-center group hover:-translate-y-2 transition-all duration-300 ease-in-out shadow-lg w-full max-w-sm ${colorClass}`}
  >
    <div className="flex justify-center items-center mb-4">
      <Icon className="w-16 h-16 transition-transform duration-300 group-hover:scale-110" />
    </div>
    <h2 className="text-2xl font-bold text-gray-100 mb-2">{title}</h2>
    <p className="text-gray-400">{description}</p>
  </button>
);


const TabButton: React.FC<{icon: React.FC<any>, active: boolean, onClick: () => void, children: React.ReactNode}> = ({ icon: Icon, active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-3 text-lg font-semibold transition-colors ${active ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
  >
    <Icon className="w-6 h-6" />
    {children}
  </button>
);

const CoursesView: React.FC<Omit<SkillSelectionScreenProps, 'onLogout'>> = ({ userProfile, onSelectSkill, onDeleteSkill, onCreateSkill, onSetMode, onViewCertificate }) => {
  const [prompt, setPrompt] = useState('');
  const [numTopics, setNumTopics] = useState(10);
  const [view, setView] = useState<'CHOOSING' | 'TUTOR_SETUP' | 'OUTLINE_REVIEW'>('CHOOSING');
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
        setIsLoading(true);
        setError(null);
        try {
            const generatedOutline = await generateCourseOutline(prompt.trim(), numTopics);
            setOutline(generatedOutline);
            setView('OUTLINE_REVIEW');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate course outline.");
        } finally {
            setIsLoading(false);
        }
    }
  };
  
  const handleConfirmCreation = () => {
      if (outline) {
          onCreateSkill(outline);
      }
  };

  if (view === 'CHOOSING') {
      return (
        <div className="w-full max-w-7xl fade-in flex flex-col md:flex-row items-stretch justify-center gap-8">
            <ModeButton 
              title="Learn a New Skill"
              description="Start a guided course with lessons and tasks."
              icon={BookOpenIcon}
              onClick={() => setView('TUTOR_SETUP')}
              colorClass="hover:border-purple-500 hover:shadow-purple-500/20 [&>div>svg]:text-purple-400"
            />
            <ModeButton 
              title="Interview Prep"
              description="Practice for your next job interview."
              icon={BriefcaseIcon}
              onClick={() => onSetMode('INTERVIEW_PREP')}
              colorClass="hover:border-blue-500 hover:shadow-blue-500/20 [&>div>svg]:text-blue-400"
            />
            <ModeButton 
              title="Solve a Doubt"
              description="Get instant explanations for any programming problem."
              icon={LightBulbIcon}
              onClick={() => onSetMode('DOUBT_SOLVER')}
              colorClass="hover:border-teal-500 hover:shadow-teal-500/20 [&>div>svg]:text-teal-400"
            />
        </div>
      );
    }
    
    if (view === 'OUTLINE_REVIEW' && outline) {
        return (
            <div className="w-full max-w-2xl fade-in bg-gray-800/50 p-8 rounded-2xl border border-gray-700">
                <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">{outline.skillName}</h2>
                <p className="text-center text-gray-400 mb-6">Here's the course outline I've prepared. Does this look good?</p>
                <ul className="space-y-3 max-h-80 overflow-y-auto pr-4 mb-8">
                    {outline.topics.map((topic, index) => (
                        <li key={index} className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="font-semibold text-white">{index + 1}. {topic.title}</h3>
                            <p className="text-gray-400 text-sm mt-1">{topic.description}</p>
                        </li>
                    ))}
                </ul>
                <div className="flex justify-center gap-4">
                    <button onClick={() => setView('TUTOR_SETUP')} className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors">
                        Back to Edit
                    </button>
                    <button onClick={handleConfirmCreation} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors">
                        Create Course & Start
                    </button>
                </div>
            </div>
        )
    }

    if (view === 'TUTOR_SETUP') {
       return (
        <div className="w-full max-w-5xl fade-in">
           <button onClick={() => setView('CHOOSING')} className="text-purple-400 hover:text-purple-300 mb-8">&larr; Back to mode selection</button>
          <div className="w-full max-w-lg mx-auto mb-12">
            <form onSubmit={handleGenerateOutline}>
              <div className="relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'A beginner's guide to Python'"
                  className="w-full pl-5 pr-28 sm:pr-36 py-3 sm:py-4 bg-gray-800 border-2 border-gray-700 rounded-full text-base sm:text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 text-white font-bold py-2 px-4 sm:px-6 rounded-full text-base sm:text-lg hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100 flex items-center justify-center"
                  style={{height: 'calc(100% - 1rem)'}}
                >
                  {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : "Generate Outline"}
                </button>
              </div>
              <div className="mt-4 w-full max-w-sm mx-auto">
                <label htmlFor="num-topics" className="block text-center text-gray-400 font-medium mb-2">
                  Course Length: <span className="font-bold text-white">{numTopics}</span> Topics
                </label>
                <input
                  id="num-topics"
                  type="range"
                  min="3"
                  max="200"
                  value={numTopics}
                  onChange={(e) => setNumTopics(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  disabled={isLoading}
                />
              </div>
            </form>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
          </div>

          {userProfile.skills.length > 0 && (
              <>
                <h2 className="text-2xl font-bold text-center mb-8 border-b border-gray-700 pb-4">Or Continue a Course</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                    {userProfile.skills.map((skill) => (
                        <SkillCard
                            key={skill.id}
                            skill={skill}
                            onSelect={() => onSelectSkill(skill.id)}
                            onDelete={() => onDeleteSkill(skill.id)}
                        />
                    ))}
                </div>
              </>
          )}
        </div>
      );
    }
    return null; // Should not happen
};


export const SkillSelectionScreen: React.FC<SkillSelectionScreenProps> = (props) => {
  const { userProfile, onLogout, onViewCertificate } = props;
  const [activeTab, setActiveTab] = useState<MainView>('COURSES');

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 text-white p-4 sm:p-8 overflow-y-auto">
      <header className="w-full max-w-7xl flex justify-between items-center mb-10">
        <div className="text-left">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            ALTOR
          </h1>
           <p className="text-lg sm:text-xl text-gray-300">
            {userProfile.name ? `Welcome back, ${userProfile.name}!` : 'Your personal AI-powered learning companion.'}
           </p>
        </div>
        {userProfile.name && (
          <button onClick={onLogout} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            <LogoutIcon className="w-5 h-5" />
            Logout
          </button>
        )}
      </header>

      <div className="flex justify-center border-b border-gray-700 mb-8 w-full max-w-7xl">
        <TabButton icon={BookOpenIcon} active={activeTab === 'COURSES'} onClick={() => setActiveTab('COURSES')}>
          My Courses
        </TabButton>
        <TabButton icon={ChartBarIcon} active={activeTab === 'PROGRESS'} onClick={() => setActiveTab('PROGRESS')}>
          My Progress
        </TabButton>
      </div>

      <main className="w-full max-w-7xl">
          {activeTab === 'COURSES' ? (
              <CoursesView {...props} />
          ) : (
              <ProgressDashboard userProfile={userProfile} onViewCertificate={onViewCertificate} />
          )}
      </main>
    </div>
  );
};