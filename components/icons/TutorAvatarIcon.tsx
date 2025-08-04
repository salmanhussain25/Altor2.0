
import React from 'react';

interface TutorAvatarIconProps extends React.SVGProps<SVGSVGElement> {
  mouthShape: string; // e.g., 'A', 'B', 'C', 'X'
}

export const TutorAvatarIcon: React.FC<TutorAvatarIconProps> = ({ mouthShape, className, ...props }) => (
  <svg {...props} className={className} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <style>
      {`
        .mouth { display: none; }
        .mouth.shape-${mouthShape} { display: block; }
      `}
    </style>
    <g>
      {/* Neck */}
      <rect x="52" y="75" width="16" height="15" fill="#c7a78b" />
      {/* Shirt */}
      <path d="M25,90 h70 v20 H25 z" fill="#4a5568" />
      <path d="M50,90 a10,10 0 0,1 20,0" fill="#c7a78b" />
      <path d="M50,90 a10,10 0 0,0 20,0" fill="#3b4453" />
      {/* Head */}
      <circle cx="60" cy="50" r="35" fill="#e7bc91" />
      {/* Hair */}
      <path d="M35,50 a25,25 0 0,1 50,0 v-20 a1,1 0 0,0 -50,0z" fill="#3a3a3a" />
      <path d="M35,30 a30,30 0 0,1 50,-5 q5,25 -25,25 q-30,0 -25,-25" fill="#3a3a3a" />
      {/* Eyes */}
      <circle cx="48" cy="50" r="4" fill="white" />
      <circle cx="72" cy="50" r="4" fill="white" />
      <circle cx="49" cy="51" r="2" fill="#3a3a3a" />
      <circle cx="73" cy="51" r="2" fill="#3a3a3a" />
      
      {/* Mouth shapes (visemes). One will be displayed based on the 'mouthShape' prop. */}
      <g fill="#3a3a3a">
          {/* X (neutral/closed) */}
          <path className="mouth shape-X" d="M55,68 Q60,71 65,68" stroke="#3a3a3a" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* A (e.g., "ah", "pop") */}
          <ellipse className="mouth shape-A" cx="60" cy="70" rx="8" ry="5" />
          {/* B (e.g., "ee", "see") */}
          <path className="mouth shape-B" d="M52,69 H68" stroke="#3a3a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* C (e.g., "oh", "show") */}
          <ellipse className="mouth shape-C" cx="60" cy="70" rx="4" ry="4.5" />
          {/* D (e.g., "d", "t") */}
          <path className="mouth shape-D" d="M54,68 a6,3 0 0,1 12,0" stroke="#3a3a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* E (e.g., "eh", "bed") */}
          <ellipse className="mouth shape-E" cx="60" cy="70" rx="9" ry="3" />
          {/* F (e.g., "f", "v") */}
          <path className="mouth shape-F" d="M54,68 a6,2 0 0,1 12,0 Z" stroke="#3a3a3a" strokeWidth="2" fill="#e7bc91" />
          {/* G (e.g., "w", "oo") */}
          <ellipse className="mouth shape-G" cx="60" cy="70" rx="2.5" ry="3" />
           {/* H (e.g., "r", "or") */}
          <path className="mouth shape-H" d="M56,71 a4,2 0 0,0 8,0" stroke="#3a3a3a" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);
