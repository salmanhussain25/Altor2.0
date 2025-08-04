

import React, { useState, useCallback } from 'react';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { PencilIcon } from './icons/PencilIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ExperienceLevel } from '@/types';

interface InterviewSetupScreenProps {
  onStartInterview: (setup: { cvFile?: File, cvText?: string, company: string, role: string, experienceLevel: ExperienceLevel }) => void;
  isLoading: boolean;
}

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

export const InterviewSetupScreen: React.FC<InterviewSetupScreenProps> = ({ onStartInterview, isLoading }) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('FRESHER');
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'upload'>('text');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isLoading) return;
    
    if (!role.trim()) {
        setError('Please specify the role you are applying for.');
        return;
    }
    if (activeTab === 'text' && !cvText.trim()) {
        setError('Please paste the text from your CV.');
        return;
    }
    if (activeTab === 'upload' && !cvFile) {
        setError('Please upload your CV file.');
        return;
    }

    let textContent: string | undefined = cvText;
    if (activeTab === 'upload' && cvFile) {
        // For non-text files like PDF, we'll let Gemini handle it directly.
        // For text files, we can read the content.
        if (cvFile.type === 'text/plain') {
            try {
                textContent = await readFileAsText(cvFile);
            } catch (err) {
                setError('Could not read the uploaded text file.');
                return;
            }
        }
    }

    onStartInterview({
        cvFile: activeTab === 'upload' ? cvFile! : undefined,
        cvText: activeTab === 'text' ? textContent : undefined,
        company: company.trim() || 'a leading tech company',
        role: role.trim(),
        experienceLevel: experienceLevel,
    });
  };
  
  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (allowedTypes.includes(selectedFile.type)) {
            setCvFile(selectedFile);
            setError(null);
        } else {
            setError('Please upload a valid file type (PDF, DOCX, TXT).');
        }
    }
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);

  const canSubmit = !isLoading && role.trim() && ((activeTab === 'text' && cvText.trim()) || (activeTab === 'upload' && cvFile));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
          Interview Preparation
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mt-2">Let's get you ready for your next big opportunity.</p>
      </header>
      
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-gray-800/50 p-8 rounded-2xl border border-gray-700 shadow-xl fade-in space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="role" className="block text-lg font-semibold text-gray-200 mb-2">Role / Job Title *</label>
                <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Senior Frontend Engineer"
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
                />
            </div>
            <div>
                <label htmlFor="company" className="block text-lg font-semibold text-gray-200 mb-2">Company (Optional)</label>
                <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Google, Microsoft"
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
            </div>
        </div>
        
        <div>
            <label className="block text-lg font-semibold text-gray-200 mb-2">Experience Level *</label>
            <div className="flex bg-gray-900/50 rounded-lg p-1">
                <button
                    type="button"
                    onClick={() => setExperienceLevel('FRESHER')}
                    className={`w-1/2 p-2 rounded-md transition-colors text-sm font-medium ${experienceLevel === 'FRESHER' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    Fresher
                </button>
                <button
                    type="button"
                    onClick={() => setExperienceLevel('EXPERIENCED')}
                    className={`w-1/2 p-2 rounded-md transition-colors text-sm font-medium ${experienceLevel === 'EXPERIENCED' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    Experienced
                </button>
            </div>
        </div>
        
        <div>
            <label className="block text-lg font-semibold text-gray-200 mb-2">Your CV *</label>
            <div className="flex bg-gray-900/50 rounded-lg p-1 mb-4">
                <button type="button" onClick={() => setActiveTab('text')} className={`w-1/2 flex items-center justify-center gap-2 p-2 rounded-md transition-colors text-sm font-medium ${activeTab === 'text' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                    <PencilIcon className="w-5 h-5"/> Paste Text
                </button>
                <button type="button" onClick={() => setActiveTab('upload')} className={`w-1/2 flex items-center justify-center gap-2 p-2 rounded-md transition-colors text-sm font-medium ${activeTab === 'upload' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                    <UploadIcon className="w-5 h-5"/> Upload File
                </button>
            </div>
            <div className="h-48">
                {activeTab === 'text' ? (
                <textarea
                    value={cvText}
                    onChange={(e) => setCvText(e.target.value)}
                    placeholder="Paste your CV content here..."
                    className="w-full h-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    disabled={isLoading}
                />
                ) : (
                <div 
                    className={`w-full h-full rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center transition-colors ${isDragging ? 'bg-blue-500/10 border-blue-500' : 'bg-gray-900/50'}`}
                    onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                >
                    {cvFile ? (
                        <div className="text-center p-4">
                            <p className="font-semibold text-white break-all">{cvFile.name}</p>
                            <p className="text-sm text-gray-400">({(cvFile.size / 1024).toFixed(2)} KB)</p>
                            <button type="button" onClick={() => setCvFile(null)} className="mt-2 text-red-400 hover:text-red-300 inline-flex items-center gap-1 text-sm">
                                <XCircleIcon className="w-4 h-4" /> Remove
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 p-4">
                            <UploadIcon className="w-10 h-10 mx-auto mb-2"/>
                            <p className="font-semibold text-gray-300">Drag & drop your CV here</p>
                            <p className="text-sm">or</p>
                            <label htmlFor="file-upload" className="font-medium text-blue-400 hover:text-blue-300 cursor-pointer">
                                browse to upload
                            </label>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
                        </div>
                    )}
                </div>
                )}
            </div>
        </div>

        {error && <p className="text-red-400 text-center">{error}</p>}

        <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
        >
            {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <>
                <BriefcaseIcon className="w-6 h-6 mr-2" />
                Start Interview
                </>
            )}
        </button>
      </form>
    </div>
  );
};