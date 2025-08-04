
import React, { useState } from 'react';

interface AuthScreenProps {
  onLogin: (name: string, pin: string) => string | undefined;
  onSignUp: (name: string, pin:string) => string | undefined;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignUp }) => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !name.trim() || pin.length !== 4) return;

    setIsLoading(true);
    setError(null);

    // Simulate network delay for better UX
    setTimeout(() => {
        let authError: string | undefined;
        if (activeTab === 'LOGIN') {
            authError = onLogin(name.trim(), pin);
        } else {
            authError = onSignUp(name.trim(), pin);
        }

        if (authError) {
            setError(authError);
        }
        setIsLoading(false);
    }, 500);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Allow only numeric input
    if (val.length <= 4) {
      setPin(val);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          ALTOR
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mt-2">Your personal AI-powered learning companion.</p>
      </header>
      
      <div className="w-full max-w-md bg-gray-800/50 p-8 rounded-2xl border border-gray-700 shadow-xl fade-in">
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('LOGIN')}
            className={`flex-1 py-3 text-lg font-semibold transition-colors ${activeTab === 'LOGIN' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('SIGNUP')}
            className={`flex-1 py-3 text-lg font-semibold transition-colors ${activeTab === 'SIGNUP' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              required
            />
            <input
              type="password"
              value={pin}
              onChange={handlePinChange}
              placeholder="Enter your 4-digit PIN"
              maxLength={4}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all tracking-widest text-center"
              required
            />
          </div>
          {error && <p className="text-red-400 text-center mt-4">{error}</p>}
          <button
            type="submit"
            disabled={!name.trim() || pin.length !== 4 || isLoading}
            className="mt-8 w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100 flex items-center justify-center"
          >
            {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (activeTab === 'LOGIN' ? 'Login' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
};