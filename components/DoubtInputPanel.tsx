
import React, { useState, useCallback } from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { PencilIcon } from './icons/PencilIcon';
import { UploadIcon } from './icons/UploadIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface DoubtInputPanelProps {
  onSolve: (problem: string, file?: File) => void;
  isLoading: boolean;
}

export const DoubtInputPanel: React.FC<DoubtInputPanelProps> = ({ onSolve, isLoading }) => {
  const [problem, setProblem] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'upload'>('text');
  const [isDragging, setIsDragging] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      if (activeTab === 'text' && problem.trim()) {
        onSolve(problem.trim());
      } else if (activeTab === 'upload' && file) {
        onSolve('', file);
      }
    }
  };
  
  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
        // Basic file type validation
        if (selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
        } else {
            alert('Please upload a valid image file (e.g., PNG, JPG, WEBP).');
        }
    }
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const canSubmit = !isLoading && ((activeTab === 'text' && problem.trim()) || (activeTab === 'upload' && file));

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 border-2 border-purple-500/50 rounded-2xl p-4 sm:p-6 shadow-lg text-white transition-all duration-500 ease-in-out h-full flex flex-col"
    >
      <div className="flex-shrink-0">
        <h3 className="text-lg sm:text-xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Ask a Doubt
        </h3>
        <p className="text-gray-400 mb-4 text-sm">
          Paste your programming problem below or upload an image of it.
        </p>
         <div className="flex bg-gray-900/50 rounded-lg p-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`w-1/2 flex items-center justify-center gap-2 p-2 rounded-md transition-colors text-sm font-medium ${activeTab === 'text' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
          >
            <PencilIcon className="w-5 h-5"/> Type or Paste
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`w-1/2 flex items-center justify-center gap-2 p-2 rounded-md transition-colors text-sm font-medium ${activeTab === 'upload' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
          >
            <UploadIcon className="w-5 h-5"/> Upload File
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        {activeTab === 'text' ? (
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="e.g., Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target..."
            className="w-full h-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
            disabled={isLoading}
          />
        ) : (
          <div 
             className={`w-full h-full rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center transition-colors ${isDragging ? 'bg-purple-500/10 border-purple-500' : 'bg-gray-900/50'}`}
             onDrop={handleDrop}
             onDragOver={handleDragOver}
             onDragEnter={handleDragEnter}
             onDragLeave={handleDragLeave}
          >
            {file ? (
                <div className="text-center p-4">
                    <p className="font-semibold text-white break-all">{file.name}</p>
                    <p className="text-sm text-gray-400">({(file.size / 1024).toFixed(2)} KB)</p>
                     <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="mt-2 text-red-400 hover:text-red-300 inline-flex items-center gap-1 text-sm"
                    >
                        <XCircleIcon className="w-4 h-4" /> Remove
                    </button>
                </div>
            ) : (
                <div className="text-center text-gray-400 p-4">
                    <UploadIcon className="w-10 h-10 mx-auto mb-2"/>
                    <p className="font-semibold text-gray-300">Drag & drop an image here</p>
                    <p className="text-sm">or</p>
                    <label htmlFor="file-upload" className="font-medium text-purple-400 hover:text-purple-300 cursor-pointer">
                        browse to upload
                    </label>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
                </div>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-4 w-full flex items-center justify-center bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <PaperAirplaneIcon className="w-5 h-5 mr-2" />
            Solve It
          </>
        )}
      </button>
    </form>
  );
};