
import React, { useState } from 'react';
import { Logo } from '../App';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        onLogin();
    }, 800);
  };

  const handleGoogleLogin = () => {
      setLoading(true);
      setTimeout(() => {
          setLoading(false);
          onLogin();
      }, 800);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-8 scale-150 transform">
            <Logo subtitle="Career Intelligence Engine" />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <div>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-slate-300 rounded-xl shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
               {loading ? (
                   <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
               ) : "Continue with Google"}
            </button>
          </div>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500 font-medium">Or diagnostic access</span>
            </div>
          </div>

          <form className="space-y-6 mt-6" onSubmit={handleSubmit}>
            <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fit-green focus:border-transparent sm:text-sm transition-all"
                placeholder="Institutional Email"
            />
            <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fit-green focus:border-transparent sm:text-sm transition-all"
                placeholder="Password"
            />
            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-slate-900 hover:bg-black transition-all transform hover:-translate-y-0.5"
            >
                {loading ? 'Diagnostic Access...' : 'Diagnostic Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
