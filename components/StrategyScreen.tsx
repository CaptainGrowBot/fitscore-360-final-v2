import React from 'react';

interface StrategyScreenProps {
  onContinue: () => void;
}

export const StrategyScreen: React.FC<StrategyScreenProps> = ({ onContinue }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 animate-fadeInScale">
      <div className="max-w-4xl w-full">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none mb-4">
            Forget Everything <br />
            <span className="text-fit-green">You’ve Been Told</span> <br />
            About Resumes.
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">
            The Rules of the Game Have Changed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* The Old Way */}
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col">
            <h3 className="text-rose-500 font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              The Old Way
            </h3>
            <ul className="space-y-6 flex-1">
              <li className="flex gap-4">
                <span className="text-slate-300 font-black">✕</span>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Fancy visual templates designed for human eyes, not machines.
                </p>
              </li>
              <li className="flex gap-4">
                <span className="text-slate-300 font-black">✕</span>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Generic keyword stuffing that triggers modern anti-spam filters.
                </p>
              </li>
              <li className="flex gap-4">
                <span className="text-slate-300 font-black">✕</span>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  'Spray and Pray' application volume as a metric of success.
                </p>
              </li>
            </ul>
          </div>

          {/* The FitScore Way */}
          <div className="bg-white p-8 rounded-[2rem] border-2 border-fit-green shadow-[0_20px_40px_rgba(134,188,37,0.1)] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
                <span className="bg-fit-green text-white text-[8px] font-black uppercase px-2 py-1 rounded">2026 Protocol</span>
            </div>
            <h3 className="text-fit-green font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fit-green animate-pulse"></span>
              The FitScore Way
            </h3>
            <ul className="space-y-6 flex-1">
              <li className="flex gap-4">
                <span className="text-fit-green font-black">✓</span>
                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  Pure Recruiter Logic: We analyze your data like a hiring algorithm.
                </p>
              </li>
              <li className="flex gap-4">
                <span className="text-fit-green font-black">✓</span>
                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  Technical Search Optimization: Dominating semantic discovery.
                </p>
              </li>
              <li className="flex gap-4">
                <span className="text-fit-green font-black">✓</span>
                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  Targeted Impact: Every bullet point is a calculated signal.
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 mb-12 group transition-all hover:border-fit-green">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="shrink-0">
               <div className="w-20 h-20 rounded-full border-4 border-fit-green flex items-center justify-center text-3xl font-black text-fit-green">
                  PSO
               </div>
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">
                The Power of <span className="text-fit-green">PSO</span> (Profile Search Optimization)
              </h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Recruiters don't find you through your resume; they find you through LinkedIn search filters. 
                Our proprietary <span className="text-fit-green font-black uppercase">PSO</span> score measures your "Searchability"—ensuring you appear in the top 1% of recruiter results.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={onContinue}
            className="w-full md:w-auto px-16 py-6 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
          >
            I’m Ready to Get Hired
          </button>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">
            Step 1: Diagnostic Assessment
          </p>
        </div>
      </div>
    </div>
  );
};
