import React from 'react';
import { Badge } from '../types';
import { SealIcon } from './icons/SealIcon';

interface CertificatePreviewProps {
  badge: Badge;
  studentName: string;
  onClick: () => void;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({ badge, studentName, onClick }) => {
  const date = new Date(badge.dateAwarded).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <button
      onClick={onClick}
      className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6 w-full text-left group hover:border-yellow-500 hover:-translate-y-1 transition-all duration-300 ease-in-out shadow-lg hover:shadow-yellow-500/10 flex items-center space-x-6"
      style={{ fontFamily: "'Merriweather', serif" }}
    >
      <div className="flex-shrink-0">
        <SealIcon className="w-20 h-20 text-yellow-600 group-hover:text-yellow-500 transition-colors" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-yellow-400 font-bold mb-1 uppercase tracking-wider">{badge.title}</p>
        <h3 className="text-lg font-bold text-gray-100 group-hover:text-white transition-colors">{badge.courseName}</h3>
        <p className="text-sm text-gray-300 mt-2">Awarded to <span className="font-semibold text-white">{studentName}</span></p>
        <p className="text-xs text-gray-400 mt-1">on {date}</p>
      </div>
    </button>
  );
};