import React from 'react';

export const SealIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <path
        id="circlePath"
        d="
          M 10, 50
          a 40,40 0 1,1 80,0
          a 40,40 0 1,1 -80,0
        "
      />
    </defs>
    <g fill="currentColor" stroke="none">
      <circle cx="50" cy="50" r="50" fillOpacity="0.8" />
      <circle cx="50" cy="50" r="45" fill="#fff" />
      <circle cx="50" cy="50" r="42" fillOpacity="0.8" />
      <g fill="#fff">
        <text style={{ fontSize: '10px', letterSpacing: '0.1em' }}>
          <textPath href="#circlePath" startOffset="50%" textAnchor="middle">
            AI TUTOR CERTIFIED LEARNER
          </textPath>
        </text>
        <path d="M50 30 L55 45 L70 45 L60 55 L65 70 L50 60 L35 70 L40 55 L30 45 L45 45 Z" />
      </g>
    </g>
  </svg>
);