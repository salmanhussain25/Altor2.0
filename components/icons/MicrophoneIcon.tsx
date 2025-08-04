import React from 'react';

export const MicrophoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    {...props}
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5a6 6 0 0 0-12 0v1.5a6 6 0 0 0 6 6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a7.5 7.5 0 1 1-15 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75v6.75m0-6.75a3.75 3.75 0 0 1-3.75-3.75V3.75a3.75 3.75 0 0 1 7.5 0v5.25A3.75 3.75 0 0 1 12 12.75Z" />
  </svg>
);
