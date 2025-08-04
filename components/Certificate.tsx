import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { SealIcon } from './icons/SealIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface CertificateProps {
  studentName: string;
  courseName: string;
  dateAwarded: string;
  onClose: () => void;
}

export const Certificate: React.FC<CertificateProps> = ({ studentName, courseName, dateAwarded, onClose }) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (certificateRef.current === null) {
      return;
    }
    try {
      const dataUrl = await toPng(certificateRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Certificate_${courseName.replace(/\s/g, '_')}_${studentName.replace(/\s/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download certificate', err);
    }
  };

  const completionDate = new Date(dateAwarded).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-800 p-4 font-sans">
      <div 
        ref={certificateRef} 
        className="bg-white w-full max-w-4xl aspect-[1.414] p-6 sm:p-8 md:p-12 shadow-2xl relative flex flex-col items-center justify-center border-8 border-gray-700"
        style={{ fontFamily: "'Merriweather', serif" }}
      >
        <div className="absolute inset-0 border-2 border-gray-500 m-2"></div>
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-700 mb-2">Certificate of Completion</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8">This certificate is proudly presented to</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 pb-2 mb-8">
            {studentName}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-4">for successfully completing the course</p>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-12">{courseName}</h3>
        </div>

        <div className="flex justify-between items-end w-full mt-auto">
          <div className="text-left">
            <p className="text-xs sm:text-sm text-gray-600 border-b-2 border-gray-400 pb-1">Date</p>
            <p className="font-bold mt-1 text-sm sm:text-base">{completionDate}</p>
          </div>
          <SealIcon className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-gray-700" />
          <div className="text-left">
            <p className="text-xs sm:text-sm text-gray-600 border-b-2 border-gray-400 pb-1">Issued By</p>
            <p className="font-bold mt-1 text-sm sm:text-base">ALTOR</p>
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={handleDownload}
          className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center justify-center"
        >
          <DownloadIcon className="w-5 h-5 mr-2" />
          Download Certificate
        </button>
        <button
          onClick={onClose}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};