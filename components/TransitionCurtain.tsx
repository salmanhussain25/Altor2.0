
import React, { useState, useEffect } from 'react';

interface TransitionCurtainProps {
  isVisible: boolean;
  text: string;
}

export const TransitionCurtain: React.FC<TransitionCurtainProps> = ({ isVisible, text }) => {
    return (
        <div 
            className={`fixed inset-0 bg-gray-900 z-[100] flex items-center justify-center transition-transform duration-500 ease-in-out transform-gpu ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
            aria-hidden={!isVisible}
        >
            <div className="text-center text-white p-8 fade-in">
                <h2 className="text-4xl font-bold">{text}</h2>
            </div>
        </div>
    );
};
