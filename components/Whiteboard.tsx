


import React, { useState, useEffect, useMemo } from 'react';
import mermaid from 'mermaid';
import { SendIcon } from './icons/SendIcon';
import { CodeIcon } from './icons/CodeIcon';
import { DiagramIcon } from './icons/DiagramIcon';
import { VisualAid } from '../types';
import { CodeEditor } from './CodeEditor';
import { XCircleIcon } from './icons/XCircleIcon';


interface WhiteboardProps {
  isEditable: boolean;
  showSubmitButton: boolean;
  displayCode: string;
  userCode: string;
  onCodeChange: (value: string) => void;
  onSubmitCode: () => void;
  isLoading: boolean;
  diagram: VisualAid | null;
  language: string;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  isEditable,
  showSubmitButton,
  displayCode,
  userCode,
  onCodeChange,
  onSubmitCode,
  isLoading,
  diagram,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'CODE' | 'DIAGRAM'>('CODE');
  const [diagramError, setDiagramError] = useState<string | null>(null);

  const sanitizedContent = useMemo(() => {
    if (!diagram?.content) return '';
    
    let processedContent = diagram.content.trim();

    if (processedContent.startsWith('```mermaid')) {
        processedContent = processedContent.substring('```mermaid'.length);
    }
    if (processedContent.endsWith('```')) {
        processedContent = processedContent.substring(0, processedContent.length - '```'.length);
    }
    processedContent = processedContent.trim();
    
    const lines = processedContent.split('\n');
    const filteredLines = lines.filter(line => !line.trim().toLowerCase().startsWith('title:'));
    
    return filteredLines.join('\n');
  }, [diagram?.content]);


  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      darkMode: true,
      fontFamily: 'sans-serif',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
      themeVariables: {
        background: '#1f2937', // gray-800
        primaryColor: '#374151', // gray-700
        primaryTextColor: '#d1d5db', // gray-300
        lineColor: '#6b7280', // gray-500
        secondaryColor: '#a855f7', // purple-500
        tertiaryColor: '#ec4899', // pink-500
      }
    });
  }, []);

  useEffect(() => {
    if (diagram && activeTab === 'DIAGRAM' && sanitizedContent) {
      setDiagramError(null); // Reset error on new render attempt
      const diagramElement = document.getElementById('mermaid-diagram-container');
      if (diagramElement) {
        try {
            diagramElement.removeAttribute('data-processed');
            diagramElement.innerHTML = sanitizedContent;
            mermaid.run({ nodes: [diagramElement] });
        } catch (e) {
            console.error("Mermaid rendering error:", e);
            setDiagramError("Oops! I had trouble rendering this diagram. It might be too complex or contain a syntax error.");
        }
      }
    }
  }, [diagram, activeTab, sanitizedContent]);
  
  // When a diagram becomes available, switch to its tab automatically
  useEffect(() => {
    if (diagram) {
      setActiveTab('DIAGRAM');
    }
  }, [diagram]);
  
  // When there's no diagram (e.g., new lesson), switch back to code
  useEffect(() => {
      if(!diagram) {
          setActiveTab('CODE');
      }
  }, [diagram]);

  const isSubmittable = isEditable && userCode.trim() !== '' && !isLoading;

  return (
    <div className="bg-gray-800 rounded-2xl flex flex-col flex-1 min-h-0 shadow-2xl border border-gray-700 overflow-hidden">
      <div className="flex-shrink-0 bg-gray-900/80 p-2 pr-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center">
            <button 
                onClick={() => setActiveTab('CODE')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${activeTab === 'CODE' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
            >
                <CodeIcon className="w-5 h-5" />
                <span>Code</span>
            </button>
            {diagram && (
                 <button 
                    onClick={() => setActiveTab('DIAGRAM')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${activeTab === 'DIAGRAM' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    <DiagramIcon className="w-5 h-5" />
                    <span>Diagram</span>
                </button>
            )}
        </div>
        <span className="text-gray-400 text-sm font-medium">Whiteboard</span>
      </div>
      <div className="relative flex-1 bg-[#1e1e1e]">
        {activeTab === 'CODE' ? (
          <>
            <CodeEditor
                value={isEditable ? userCode : displayCode}
                onChange={onCodeChange}
                readOnly={!isEditable}
                language={language}
            />
            {showSubmitButton && (
              <button
                onClick={onSubmitCode}
                disabled={!isSubmittable}
                title={isSubmittable ? "Submit Code" : "Enter your code to submit"}
                className={`absolute bottom-4 right-4 flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 transform 
                  ${isSubmittable 
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg scale-100 hover:scale-105' 
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <SendIcon className="w-7 h-7" />
                )}
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full p-4 bg-gray-800 flex flex-col items-center justify-start overflow-auto">
            {diagram?.title && !diagramError && (
              <h4 className="text-xl font-bold text-gray-100 mb-4 flex-shrink-0 p-2 rounded-md bg-gray-900/50">
                {diagram.title}
              </h4>
            )}
            {diagramError ? (
                <div className="m-auto flex flex-col items-center text-center text-yellow-400 bg-yellow-900/50 p-6 rounded-lg">
                    <XCircleIcon className="w-12 h-12 mb-4" />
                    <h4 className="font-bold text-lg mb-2">Diagram Error</h4>
                    <p className="text-yellow-300">{diagramError}</p>
                </div>
            ) : (
                <div id="mermaid-diagram-container" key={sanitizedContent} className="mermaid w-full h-full flex-1 flex items-center justify-center">
                    {/* Mermaid will render here */}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};