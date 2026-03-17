
import React, { useState, useRef } from 'react';
import { analyzeFit } from './services/geminiService';
import { FitAnalysis, AppStep, FullAnalysisInput, AnalysisHistoryItem, FileData, GeneratedDocs, InterviewQuestion } from './types';
import { Dashboard } from './components/Dashboard';
import { ResumeBuilder } from './components/ResumeBuilder';
import { LandingPage } from './components/LandingPage';
import { StrategyScreen } from './components/StrategyScreen';

export const Logo = ({ className = "h-12", subtitle }: { className?: string, subtitle?: string }) => (
  <div className={`flex items-center gap-4 ${className}`}>
    <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#051121] flex items-center justify-center">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
        {/* Stylized FS - Ultra High Fidelity */}
        <path 
          d="M12 88L32 36C33 32 37 30 41 30H92C95 30 96 32 94 35L88 45C87 47 85 48 83 48H48C46 48 45 49 44 51L40 62H72C82 62 88 68 88 78V80C88 85 84 89 78 89H12V88ZM75 75C75 73 73 71 71 71H42L36 89H75V75Z" 
          fill="white" 
        />
        {/* Leaf - Ultra High Fidelity */}
        <path 
          d="M8 28C8 12 26 8 36 28C26 42 13 42 8 28Z" 
          fill="#86bc25" 
        />
        <path 
          d="M8 28C16 20 28 20 36 28" 
          stroke="#4d7c0f" 
          strokeWidth="1.5" 
          fill="none" 
        />
        <path 
          d="M22 18L26 32" 
          stroke="#4d7c0f" 
          strokeWidth="1" 
          strokeLinecap="round" 
          fill="none" 
        />
      </svg>
    </div>
    <div className="flex flex-col justify-center">
      <div className="flex items-baseline">
        <span className="text-4xl font-black tracking-tighter text-[#86bc25]">FitScore</span>
        <span className="text-4xl font-bold tracking-tighter text-slate-700">360PM</span>
      </div>
      {subtitle && (
        <span className="text-xl font-extrabold text-slate-900 tracking-tight -mt-1">
          {subtitle}
        </span>
      )}
    </div>
  </div>
);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [step, setStep] = useState<AppStep>(AppStep.STRATEGY);
  const [wizardStep, setWizardStep] = useState(1);
  
  const [resumeText, setResumeText] = useState('');
  const [linkedinText, setLinkedinText] = useState('');
  const [jobDescText, setJobDescText] = useState('');
  
  const [resumeFile, setResumeFile] = useState<FileData | null>(null);
  const [linkedinFile, setLinkedinFile] = useState<FileData | null>(null);
  const [jobDescFile, setJobDescFile] = useState<FileData | null>(null);

  const [analysisData, setAnalysisData] = useState<FitAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  
  const [recalledDocs, setRecalledDocs] = useState<GeneratedDocs | null>(null);
  const [recalledQuestions, setRecalledQuestions] = useState<InterviewQuestion[]>([]);

  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const linkedinFileInputRef = useRef<HTMLInputElement>(null);
  const jobDescFileInputRef = useRef<HTMLInputElement>(null);

  const [isPremium, setIsPremium] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [isAuthorityPremium, setIsAuthorityPremium] = useState(false);
  const [showAuthorityPaywallModal, setShowAuthorityPaywallModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const handleUpgrade = () => {
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setIsPremium(true);
      setShowPaywallModal(false);
      setShowSuccessOverlay(true);
    }, 2000);
  };

  const handleAuthorityUpgrade = () => {
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setIsAuthorityPremium(true);
      setShowAuthorityPaywallModal(false);
      setShowSuccessOverlay(true);
    }, 2000);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'linkedin' | 'jobDesc') => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      const fileObj: FileData = { name: file.name, mimeType: file.type, data: base64Data };
      if (type === 'resume') setResumeFile(fileObj);
      else if (type === 'linkedin') setLinkedinFile(fileObj);
      else if (type === 'jobDesc') setJobDescFile(fileObj);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = (type: 'resume' | 'linkedin' | 'jobDesc') => {
    if (type === 'resume') { setResumeFile(null); setResumeText(''); if (resumeFileInputRef.current) resumeFileInputRef.current.value = ''; }
    else if (type === 'linkedin') { setLinkedinFile(null); setLinkedinText(''); if (linkedinFileInputRef.current) linkedinFileInputRef.current.value = ''; }
    else if (type === 'jobDesc') { setJobDescFile(null); setJobDescText(''); if (jobDescFileInputRef.current) jobDescFileInputRef.current.value = ''; }
  };

  const handleAnalysis = async () => {
    const hasJobDesc = !!(jobDescText.trim() || jobDescFile);
    const hasResume = !!(resumeText.trim() || resumeFile);
    const hasLinkedIn = !!(linkedinText.trim() || linkedinFile);

    if (!hasResume && !hasLinkedIn) {
      setError("Please provide at least a Resume or a LinkedIn profile to begin analysis.");
      setWizardStep(hasJobDesc ? 2 : 1);
      return;
    }

    setError(null);
    setStep(AppStep.ANALYZING);
    try {
      const input: FullAnalysisInput = {
        resume: { text: resumeText || undefined, file: resumeFile ? { data: resumeFile.data, mimeType: resumeFile.mimeType } : undefined },
        jobDesc: { text: jobDescText || undefined, file: jobDescFile ? { data: jobDescFile.data, mimeType: jobDescFile.mimeType } : undefined },
        linkedin: { text: linkedinText || undefined, file: linkedinFile ? { data: linkedinFile.data, mimeType: linkedinFile.mimeType } : undefined }
      };
      const result = await analyzeFit(input);
      
      const newHistoryItem: AnalysisHistoryItem = { 
        id: Date.now().toString(), 
        timestamp: Date.now(), 
        analysis: result, 
        resumeText, 
        linkedinText, 
        jobDescText, 
        resumeFile, 
        linkedinFile, 
        jobDescFile,
        generatedDocs: null,
        interviewQuestions: []
      };

      setHistory(prev => {
        const updated = [newHistoryItem, ...prev];
        if (!isPremium) {
          return updated.slice(0, 5);
        }
        return updated;
      });

      setAnalysisData(result);
      setRecalledDocs(null);
      setRecalledQuestions([]);
      setTimeout(() => setStep(AppStep.RESULTS), 2000);
    } catch (e) { 
      console.error(e);
      setError("Analysis failed. Please try again."); 
      setStep(AppStep.INPUT); 
      setWizardStep(1); 
    }
  };

  const handleUpdateHistoryWithAssets = (id: string, docs: GeneratedDocs | null, questions: InterviewQuestion[]) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, generatedDocs: docs, interviewQuestions: questions } : item));
  };

  const handleLoadHistory = (item: AnalysisHistoryItem) => {
    setAnalysisData(item.analysis); 
    setResumeText(item.resumeText); 
    setLinkedinText(item.linkedinText); 
    setJobDescText(item.jobDescText);
    setResumeFile(item.resumeFile); 
    setLinkedinFile(item.linkedinFile); 
    setJobDescFile(item.jobDescFile);
    setRecalledDocs(item.generatedDocs || null);
    setRecalledQuestions(item.interviewQuestions || []);
    setStep(AppStep.RESULTS);
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleNewScan = () => {
    setJobDescText('');
    setJobDescFile(null);
    setAnalysisData(null);
    setRecalledDocs(null);
    setRecalledQuestions([]);
    setStep(AppStep.INPUT);
    setWizardStep(1);
  };

  const jumpToWizardStep = (stepIdx: number) => {
    setStep(AppStep.INPUT);
    setWizardStep(stepIdx);
  };

  if (!isLoggedIn) return <LandingPage onLogin={() => setIsLoggedIn(true)} />;

  if (step === AppStep.STRATEGY) {
    return <StrategyScreen onContinue={() => setStep(AppStep.INPUT)} />;
  }

  if (step === AppStep.BUILDER) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <ResumeBuilder 
          onComplete={(txt) => { setResumeText(txt); setStep(AppStep.INPUT); }} 
          onCancel={() => setStep(AppStep.INPUT)} 
          isPremium={isPremium} 
          onTriggerPaywall={() => setShowPaywallModal(true)} 
        />
        {showPaywallModal && <PaywallModal onClose={() => setShowPaywallModal(false)} onUpgrade={handleUpgrade} processing={paymentProcessing} />}
        <footer className="max-w-4xl mx-auto py-8 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            FitScore360PM is a specialized diagnostic tool engineered specifically for Project Management career tracks. Results for other industries may vary.
          </p>
        </footer>
      </div>
    );
  }

  if (step === AppStep.RESULTS && analysisData) {
    const hasJobDesc = !!(jobDescText.trim() || jobDescFile);
    const hasResume = !!(resumeText.trim() || resumeFile);
    const hasLinkedIn = !!(linkedinText.trim() || linkedinFile);

    return (
      <div className="flex flex-col min-h-screen">
        <Dashboard 
          data={analysisData} 
          resume={{ text: resumeText, linkedinText, file: resumeFile ? { data: resumeFile.data, mimeType: resumeFile.mimeType } : undefined }} 
          jobDesc={jobDescText} 
          onReset={handleNewScan} 
          isPremium={isPremium} 
          setIsPremium={setIsPremium} 
          onTriggerPaywall={() => setShowPaywallModal(true)} 
          isAuthorityPremium={isAuthorityPremium}
          onTriggerAuthorityPaywall={() => setShowAuthorityPaywallModal(true)}
          history={history} 
          onLoadHistory={handleLoadHistory}
          onDeleteHistory={handleDeleteHistory}
          showSuccessOverlay={showSuccessOverlay}
          setShowSuccessOverlay={setShowSuccessOverlay}
          inputs={{ hasJobDesc, hasResume, hasLinkedIn }}
          onUploadAsset={jumpToWizardStep}
          initialDocs={recalledDocs}
          initialQuestions={recalledQuestions}
          onSaveAssets={(docs, questions) => {
            const currentHistoryItem = history.find(h => h.analysis === analysisData);
            if (currentHistoryItem) {
              handleUpdateHistoryWithAssets(currentHistoryItem.id, docs, questions);
            }
          }}
        />
        {showPaywallModal && <PaywallModal onClose={() => setShowPaywallModal(false)} onUpgrade={handleUpgrade} processing={paymentProcessing} />}
        {showAuthorityPaywallModal && <AuthorityPaywallModal onClose={() => setShowAuthorityPaywallModal(false)} onUpgrade={handleAuthorityUpgrade} processing={paymentProcessing} />}
        <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100 text-center w-full">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            FitScore360PM is a specialized diagnostic tool engineered specifically for Project Management career tracks. Results for other industries may vary.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo className="h-10" />
          <button onClick={() => setIsLoggedIn(false)} className="text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-slate-900 transition-colors">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12 flex-1">
        {step === AppStep.ANALYZING ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fadeInScale">
             <div className="relative w-32 h-32 mb-12">
                <div className="absolute inset-0 rounded-full border-t-4 border-fit-green animate-spin"></div>
                <div className="absolute inset-4 rounded-full border-b-4 border-fit-blue animate-[spin_1.5s_linear_infinite_reverse]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-fit-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
             </div>
             <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tighter">Simulating PM Recruiter Search Logic</h2>
             <div className="flex gap-2">
                <div className="h-1.5 w-12 bg-fit-green rounded-full animate-pulse"></div>
                <div className="h-1.5 w-12 bg-slate-200 rounded-full animate-pulse [animation-delay:200ms]"></div>
                <div className="h-1.5 w-12 bg-slate-200 rounded-full animate-pulse [animation-delay:400ms]"></div>
             </div>
             <p className="mt-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Analyzing Project Methodology Weight & Strategic Signal</p>
          </div>
        ) : (
          <div className="space-y-12 animate-fadeInScale">
            <div className="relative pt-1">
              <div className="flex mb-4 items-center justify-between">
                <div>
                  <span className="text-[10px] font-black py-1 px-3 uppercase rounded-full text-fit-green bg-green-50 border border-green-100">
                    Step {wizardStep} of 3
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {wizardStep === 1 ? 'Job Context' : wizardStep === 2 ? 'Candidate Data' : 'LinkedIn Profile'}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-1.5 mb-4 text-xs flex rounded-full bg-slate-200">
                <div style={{ width: `${(wizardStep / 3) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-fit-green transition-all duration-500 ease-out"></div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
              <div className="p-10">
                {error && <div className="mb-8 bg-rose-50 text-rose-600 p-4 rounded-2xl text-[10px] font-black uppercase border border-rose-100">{error}</div>}
                
                {wizardStep === 1 && (
                  <div className="space-y-8 animate-fadeInScale">
                    <div>
                        <div className="flex items-center">
                          <h2 className="text-xl font-black text-slate-900 mb-2">Target PM Job Description (Optional)</h2>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contextualize your analysis for a specific PM role.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Text or Document</label>
                            <input type="file" ref={jobDescFileInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'jobDesc')} />
                            <button onClick={() => jobDescFileInputRef.current?.click()} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-fit-green flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Upload PDF/Doc
                            </button>
                        </div>
                        {jobDescFile ? (
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-fit-green" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                                    {jobDescFile.name}
                                </span>
                                <button onClick={() => clearFile('jobDesc')} className="text-rose-500 hover:text-rose-700 font-bold p-2">✕</button>
                            </div>
                        ) : (
                            <textarea rows={6} className="block w-full rounded-2xl border-slate-100 bg-slate-50 p-6 text-sm font-medium focus:ring-2 focus:ring-fit-green outline-none border transition-all" placeholder="Paste the PM job description here..." value={jobDescText} onChange={(e) => setJobDescText(e.target.value)} />
                        )}
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-8 animate-fadeInScale">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center">
                              <h2 className="text-xl font-black text-slate-900 mb-2">PM Resume (Recommended)</h2>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ground your experience in project management methodologies.</p>
                        </div>
                        <button onClick={() => setStep(AppStep.BUILDER)} className="text-[10px] font-black text-fit-green uppercase tracking-widest border border-green-100 px-4 py-2 rounded-full bg-green-50 hover:bg-green-100 transition-colors">Build with PM AI</button>
                    </div>

                    {(resumeFile || resumeText.trim()) ? (
                      <div className="p-6 bg-green-50/50 border border-green-200 rounded-3xl flex items-center justify-between shadow-sm">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-fit-green/10 text-fit-green rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                           </div>
                           <div>
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight">PM Ledger Memory Active</p>
                             <p className="text-[10px] text-slate-500 font-medium">{resumeFile ? resumeFile.name : 'Pasted Experience Active'}</p>
                           </div>
                         </div>
                         <button onClick={() => clearFile('resume')} className="text-[9px] font-black text-rose-500 uppercase tracking-widest border border-rose-100 px-3 py-1.5 rounded-full bg-white hover:bg-rose-50 transition-colors">Replace File</button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Text or Document</label>
                            <input type="file" ref={resumeFileInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'resume')} />
                            <button onClick={() => resumeFileInputRef.current?.click()} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-fit-green flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Upload PM PDF
                            </button>
                        </div>
                        <textarea rows={6} className="block w-full rounded-2xl border-slate-100 bg-slate-50 p-6 text-sm font-medium focus:ring-2 focus:ring-fit-green outline-none border transition-all" placeholder="Paste your professional experience here..." value={resumeText} onChange={(e) => setResumeText(e.target.value)} />
                      </div>
                    )}
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-8 animate-fadeInScale">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center">
                              <h2 className="text-xl font-black text-slate-900 mb-2">LinkedIn Profile Sync (Optional)</h2>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analyze your presence in PM Recruiter search filters.</p>
                        </div>
                    </div>

                    {(linkedinFile || linkedinText.trim()) ? (
                      <div className="p-6 bg-blue-50/50 border border-blue-200 rounded-3xl flex items-center justify-between shadow-sm">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-blue-600/10 text-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                           </div>
                           <div>
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight">LinkedIn Profile Synced</p>
                             <p className="text-[10px] text-slate-500 font-medium">{linkedinFile ? linkedinFile.name : 'Profile Text Active'}</p>
                           </div>
                         </div>
                         <button onClick={() => clearFile('linkedin')} className="text-[9px] font-black text-rose-500 uppercase tracking-widest border border-rose-100 px-3 py-1.5 rounded-full bg-white hover:bg-rose-50 transition-colors">Replace File</button>
                      </div>
                    ) : (
                      <>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">LinkedIn Export or Text</label>
                              <input type="file" ref={linkedinFileInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'linkedin')} />
                              <button onClick={() => linkedinFileInputRef.current?.click()} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-fit-green flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                  Upload LinkedIn PDF
                              </button>
                          </div>
                          <textarea rows={6} className="block w-full rounded-2xl border-slate-100 bg-slate-50 p-6 text-sm font-medium focus:ring-2 focus:ring-fit-green outline-none border transition-all" placeholder="Paste LinkedIn profile text here if not using PDF export..." value={linkedinText} onChange={(e) => setLinkedinText(e.target.value)} />
                      </div>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-12 flex justify-between gap-4 border-t border-slate-50 pt-10">
                  {wizardStep > 1 && (
                    <button onClick={() => setWizardStep(wizardStep - 1)} className="px-10 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-400 hover:text-slate-600 transition-all">Back</button>
                  )}
                  <button 
                    onClick={wizardStep < 3 ? () => setWizardStep(wizardStep + 1) : handleAnalysis} 
                    className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-2xl hover:bg-black transition-all transform active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    {wizardStep < 3 ? (
                        <>Continue to {wizardStep === 1 ? 'Resume' : 'LinkedIn Profile'} &rarr;</>
                    ) : (history.length > 0 ? 'Analyze New PM Role' : 'Initialize Final PM Audit')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="max-w-5xl mx-auto px-4 py-8 text-center w-full">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          FitScore360PM is a specialized diagnostic tool engineered specifically for Project Management career tracks. Results for other industries may vary.
        </p>
      </footer>
    </div>
  );
}

const PaywallModal = ({ onClose, onUpgrade, processing }: {onClose: () => void, onUpgrade: () => void, processing: boolean}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-fadeInScale">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Upgrade to Platinum PM</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 p-1">✕</button>
        </div>
        
        <div className="mb-8">
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">PM Intelligence Pro</span>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">$19<span className="text-[10px] font-bold text-slate-400">/mo</span></span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full PM Recruiter Audit Access</p>
        </div>

        <div className="bg-slate-50 p-6 rounded-[1.5rem] mb-8 border border-slate-100 space-y-4">
          <div className="space-y-3">
             <div className="relative">
                <input type="text" placeholder="Card Number" className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none" defaultValue="4242 4242 4242 4242" />
                <div className="absolute right-3 top-3"><svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg></div>
             </div>
             <div className="flex gap-3">
                <input type="text" placeholder="MM / YY" className="w-1/2 p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-center" defaultValue="12 / 26" />
                <input type="text" placeholder="CVC" className="w-1/2 p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none text-center" defaultValue="999" />
             </div>
          </div>
        </div>

        <button onClick={onUpgrade} disabled={processing} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest">
          {processing ? (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : 'Complete PM Upgrade'}
        </button>
        <p className="text-center mt-4 text-[9px] font-black text-slate-300 uppercase tracking-tight">Secured by Intelligence-Stripe</p>
      </div>
    </div>
  </div>
);

const AuthorityPaywallModal = ({ onClose, onUpgrade, processing }: {onClose: () => void, onUpgrade: () => void, processing: boolean}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-md">
    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden border border-purple-100 animate-fadeInScale">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
              <h3 className="text-xs font-black text-purple-900 uppercase tracking-widest">Premium PM Plus Upgrade</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 p-1">✕</button>
        </div>
        
        <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-200">
               <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 01.894.553L12.382 5H15a1 1 0 110 2h-2.118l-1.508 3.016 2.308 3.847a1 1 0 11-1.716 1.028L10 11.586l-1.966 3.299a1 1 0 11-1.716-1.028l2.308-3.847L7.118 7H5a1 1 0 110-2h2.618l1.488-2.447A1 1 0 0110 2z" clipRule="evenodd" /></svg>
            </div>
            <h2 className="text-xl font-black text-purple-900 uppercase tracking-tighter mb-1">PM Authority Engine</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">The Diamond PM Add-on</p>
        </div>

        <div className="mb-8">
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Premium PM Plus Add-on</span>
                <span className="text-2xl font-black text-purple-900 tracking-tighter">$15<span className="text-[10px] font-bold text-slate-400">/one-time</span></span>
            </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-[1.5rem] mb-8 border border-purple-100 space-y-4">
          <div className="space-y-2">
             <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <p className="text-[9px] font-bold text-purple-900 uppercase">30-Day PM Content Matrix</p>
             </div>
             <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <p className="text-[9px] font-bold text-purple-900 uppercase">PM Authority Posts</p>
             </div>
             <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <p className="text-[9px] font-bold text-purple-900 uppercase">Stakeholder Engagement Library</p>
             </div>
          </div>
        </div>

        <button onClick={onUpgrade} disabled={processing} className="w-full py-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-2xl font-black shadow-xl hover:shadow-purple-200/50 transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest">
          {processing ? (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : 'Activate Diamond PM Plus'}
        </button>
        <p className="text-center mt-4 text-[9px] font-black text-slate-300 uppercase tracking-tight">Unlocks the PM Authority Engine Permanently</p>
      </div>
    </div>
  </div>
);
