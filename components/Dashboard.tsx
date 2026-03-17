
import React, { useState, useEffect, useMemo } from 'react';
import { FitAnalysis, GeneratedDocs, ResumeInput, AnalysisHistoryItem, InterviewQuestion, ContentMatrixDay, AuthorityPost, EngagementScript, AuthorityStrategy, ContentMatrixResult } from '../types';
import { RadialScore } from './RadialScore';
import { generateDocuments, generateInterviewStrategies, generateRejectionBridge, generateThankYouBridge, generateMasterProfile, generateContentMatrix, generateAuthorityPost, generateEngagementScripts } from '../services/geminiService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, LabelList } from 'recharts';
import { Logo } from '../App';

interface DashboardProps {
  data: FitAnalysis;
  resume: ResumeInput;
  jobDesc: string;
  onReset: () => void;
  isPremium: boolean;
  setIsPremium: (val: boolean) => void;
  onTriggerPaywall: () => void;
  isAuthorityPremium: boolean;
  onTriggerAuthorityPaywall: () => void;
  history: AnalysisHistoryItem[];
  onLoadHistory: (item: AnalysisHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  showSuccessOverlay: boolean;
  setShowSuccessOverlay: (val: boolean) => void;
  inputs: {
    hasJobDesc: boolean;
    hasResume: boolean;
    hasLinkedIn: boolean;
  };
  onUploadAsset: (step: number) => void;
  initialDocs?: GeneratedDocs | null;
  initialQuestions?: InterviewQuestion[];
  onSaveAssets?: (docs: GeneratedDocs | null, questions: InterviewQuestion[]) => void;
}

const DocumentPreview = ({ content, title }: { content: string, title: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Remove markdown bolding and italics for clipboard copy to maintain clean text
    const cleanContent = content.replace(/\*\*|\*/g, '');
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFormattedText = (text: string) => {
    // Handle Bold (**text**) and Italics (*text*)
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-black">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-black" style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const formattedContent = useMemo(() => {
    const lines = content.split('\n');
    let isHeaderArea = true;

    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      if (!trimmed) return <div key={idx} style={{ height: '11pt' }} />; 
      
      // Header Area (Name, Contact, LinkedIn)
      if (isHeaderArea && (idx < 10)) {
        // If we hit a section header or summary, stop header area logic
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.includes('|')) {
          isHeaderArea = false;
        } else {
          const isName = idx === 0;
          return (
            <p key={idx} 
               style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', textAlign: 'left', fontWeight: isName ? 'bold' : 'normal', color: 'black' }}
               className="leading-tight mb-0">
              {renderFormattedText(trimmed)}
            </p>
          );
        }
      }

      // Section Headers (Bold, All-Caps)
      const isSectionHeader = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.includes('|') && !trimmed.startsWith('**');
      if (isSectionHeader) {
        return (
          <div key={idx} className="mt-[22pt] mb-[11pt]">
            <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', textAlign: 'left', fontWeight: 'bold', color: 'black' }}
               className="uppercase tracking-normal">
              {renderFormattedText(trimmed)}
            </p>
          </div>
        );
      }

      // Professional Achievements (Bullets)
      if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        return (
          <div key={idx} className="flex gap-2 mb-1 pl-[0.25in] text-left" style={{ textAlign: 'left' }}>
            <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', color: 'black' }} className="font-normal">•</span>
            <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', textAlign: 'left', color: 'black' }} className="font-normal leading-tight">
              {renderFormattedText(trimmed.replace(/^[*•-]\s*/, ''))}
            </p>
          </div>
        );
      }

      // Standard Body Text (Summary, Job Titles, Company, Skills, Education)
      return (
        <p key={idx} 
           style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', textAlign: 'left', color: 'black' }} 
           className="font-normal leading-tight mb-[11pt]">
          {renderFormattedText(trimmed)}
        </p>
      );
    });
  }, [content]);

  return (
    <div className="flex flex-col items-center w-full animate-fadeInScale mb-24">
      <div className="w-full max-w-4xl bg-white shadow-2xl border border-slate-200 rounded-sm relative group">
        <div className="absolute top-6 right-6 z-20 print:hidden">
          <button 
            onClick={handleCopy}
            className={`px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 border ${copied ? 'bg-fit-green text-white border-fit-green' : 'bg-white text-slate-900 border-slate-300 hover:border-black'}`}
          >
            {copied ? '✓ COPIED' : 'COPY CLEAN TEXT'}
          </button>
        </div>

        <div style={{ padding: '1in', minHeight: '1056px', backgroundColor: 'white', color: 'black', textAlign: 'left' }}>
           {formattedContent}
        </div>
      </div>
    </div>
  );
};

const BridgeSection = ({ title, content, onGenerate, loading, icon }: { title: string, content: string, onGenerate: () => void, loading: boolean, icon: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl mt-12 overflow-hidden relative">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{title}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bridging the Gap Post-Interaction</p>
          </div>
        </div>
        {!content ? (
          <button onClick={onGenerate} disabled={loading} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
            {loading ? 'Synthesizing...' : 'Generate Script'}
          </button>
        ) : (
          <button onClick={handleCopy} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-fit-green text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
            {copied ? 'Copied' : 'Copy Text'}
          </button>
        )}
      </div>

      {content && (
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 animate-fadeInScale">
          <p className="text-sm font-medium text-slate-600 leading-relaxed italic whitespace-pre-wrap">{content}</p>
        </div>
      )}
    </section>
  );
};

const PremiumOverlay = ({ title, feature, onTriggerPaywall, variant = 'gold' }: { title: string, feature: string, onTriggerPaywall: () => void, variant?: 'gold' | 'diamond' }) => {
  const isDiamond = variant === 'diamond';
  return (
    <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-md rounded-[3rem] p-12 text-center animate-fadeInScale ${isDiamond ? 'bg-purple-900/10' : 'bg-white/60'}`}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border shadow-sm ${isDiamond ? 'bg-purple-100 border-purple-200' : 'bg-amber-100 border-amber-200'}`}>
        {isDiamond ? (
          <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 01.894.553L12.382 5H15a1 1 0 110 2h-2.118l-1.508 3.016 2.308 3.847a1 1 0 11-1.716 1.028L10 11.586l-1.966 3.299a1 1 0 11-1.716-1.028l2.308-3.847L7.118 7H5a1 1 0 110-2h2.618l1.488-2.447A1 1 0 0110 2z" clipRule="evenodd" /></svg>
        ) : (
          <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
        )}
      </div>
      <h3 className={`text-xl font-black uppercase tracking-tighter mb-2 ${isDiamond ? 'text-purple-900' : 'text-[#212529]'}`}>{title} {isDiamond ? 'Plus' : ''} Locked</h3>
      <p className="text-slate-600 text-sm font-medium mb-8 max-w-xs leading-relaxed text-[#212529]">
        {isDiamond ? 'Unlock the full power of industry authority. Requires the Diamond add-on.' : `Unlock ${feature} with a Platinum upgrade to gain strategic recruiter leverage.`}
      </p>
      <button 
        onClick={onTriggerPaywall} 
        className={`px-8 py-3.5 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95 ${isDiamond ? 'bg-gradient-to-r from-purple-700 to-indigo-700' : 'bg-slate-900'}`}
      >
        {isDiamond ? 'Upgrade to Premium Plus' : 'Upgrade to Platinum'}
      </button>
    </div>
  );
};

const HistoryDrawer = ({ 
  isOpen, 
  onClose, 
  history, 
  onLoadHistory, 
  isPremium 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  history: AnalysisHistoryItem[]; 
  onLoadHistory: (item: AnalysisHistoryItem) => void; 
  isPremium: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl animate-fadeInScale">
        <div className="h-full flex flex-col p-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl font-black text-[#212529] uppercase tracking-tighter">Diagnostic History</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {isPremium ? 'Unlimited History Active' : 'Last 5 Sessions Tracked'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Sessions Recorded</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="group p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-fit-blue transition-all relative">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-[#212529] shadow-sm">
                      {item.analysis.overallScore}%
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#212529] uppercase tracking-tight truncate w-40">
                        {item.analysis.jobTitle || 'General Audit'}
                      </h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { onLoadHistory(item); onClose(); }} 
                    className="text-[9px] font-black text-fit-blue uppercase tracking-widest hover:underline"
                  >
                    Recall Data
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  data, resume, jobDesc, onReset, isPremium, onTriggerPaywall, isAuthorityPremium, onTriggerAuthorityPaywall, history, onLoadHistory, inputs, onSaveAssets, initialDocs, initialQuestions
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'linkedin' | 'docs' | 'interview' | 'jobs' | 'authority'>('overview');
  const [docs, setDocs] = useState<GeneratedDocs | null>(initialDocs || null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>(initialQuestions || []);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [thankYouBridge, setThankYouBridge] = useState('');
  const [loadingThankYou, setLoadingThankYou] = useState(false);
  const [rejectionBridge, setRejectionBridge] = useState('');
  const [loadingRejection, setLoadingRejection] = useState(false);

  const [authView, setAuthView] = useState<'setup' | 'calendar' | 'library' | 'history'>('setup');
  
  const [authorityStrategy, setAuthorityStrategy] = useState<AuthorityStrategy>(() => {
    const saved = localStorage.getItem('authority_strategy');
    return saved ? JSON.parse(saved) : {
      specialization: 'IT/Software',
      certification: 'None',
      experience: '0-2',
      goal: 'Get Recruited',
      topicSession: 'Session 1'
    };
  });
  
  const [contentMatrix, setContentMatrix] = useState<ContentMatrixDay[]>(() => {
    const saved = localStorage.getItem('content_matrix');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [authorityPosts, setAuthorityPosts] = useState<AuthorityPost[]>(() => {
    const saved = localStorage.getItem('authority_posts');
    return saved ? JSON.parse(saved) : [];
  });

  const [utilizedSkills, setUtilizedSkills] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('utilized_skills');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [prioritizedRequirement, setPrioritizedRequirement] = useState('');
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [generatingPostId, setGeneratingPostId] = useState<number | null>(null);
  const [authLog, setAuthLog] = useState<{timestamp: number, topic: string, action: string}[]>([]);

  useEffect(() => { localStorage.setItem('authority_strategy', JSON.stringify(authorityStrategy)); }, [authorityStrategy]);
  useEffect(() => { localStorage.setItem('content_matrix', JSON.stringify(contentMatrix)); }, [contentMatrix]);
  useEffect(() => { localStorage.setItem('authority_posts', JSON.stringify(authorityPosts)); }, [authorityPosts]);
  useEffect(() => { localStorage.setItem('utilized_skills', JSON.stringify(Array.from(utilizedSkills))); }, [utilizedSkills]);

  useEffect(() => {
    if (data.jobTitle && !localStorage.getItem('authority_strategy')) {
      const spec = ['Software', 'IT', 'Tech'].some(k => data.jobTitle.toLowerCase().includes(k.toLowerCase())) ? 'IT/Software' : 
                   ['Health', 'Medical'].some(k => data.jobTitle.toLowerCase().includes(k.toLowerCase())) ? 'Healthcare' : 
                   ['Fin', 'Bank'].some(k => data.jobTitle.toLowerCase().includes(k.toLowerCase())) ? 'FinTech' : 'IT/Software';
      
      const cert = data.profile_architect?.skill_seed_list.find(s => ['PMP', 'CAPM', 'CSM', 'Prince2'].includes(s)) || 'None';
      
      setAuthorityStrategy(prev => ({ ...prev, specialization: spec, certification: cert }));
    }
  }, [data]);

  const handleGenMatrix = async () => {
    if (!isAuthorityPremium) { onTriggerAuthorityPaywall(); return; }
    setLoadingMatrix(true);
    try {
      const previousTopics = contentMatrix.map(m => m.topic);
      const res = await generateContentMatrix(authorityStrategy, data.summary, data.missingSkills, jobDesc, previousTopics);
      const newMatrix = res.matrix.map(m => ({ ...m, session: authorityStrategy.topicSession }));
      setContentMatrix(newMatrix);
      setPrioritizedRequirement(res.prioritizedRequirement);
      setAuthView('calendar');
      setAuthLog(prev => [{timestamp: Date.now(), topic: `${authorityStrategy.topicSession} Blueprint`, action: 'Matrix Generated'}, ...prev]);
    } catch (e) { console.error(e); }
    finally { setLoadingMatrix(false); }
  };

  const handleGenPost = async (day: ContentMatrixDay) => {
    if (!isAuthorityPremium) { onTriggerAuthorityPaywall(); return; }
    setGeneratingPostId(day.day);
    try {
      const res = await generateAuthorityPost(day.topic, authorityStrategy, data.summary, resume.text || '', data.missingSkills, jobDesc);
      const newPost: AuthorityPost = {
        id: Math.random().toString(36).substr(2, 9),
        title: res.title || 'Untitled Authority Post',
        content: res.content || '',
        topic: day.topic,
        timestamp: Date.now(),
        tags: res.tags || [],
        utilized: false
      };
      setAuthorityPosts(prev => [newPost, ...prev]);
      setContentMatrix(prev => prev.map(m => m.day === day.day ? { ...m, selected: true } : m));
      setAuthLog(prev => [{timestamp: Date.now(), topic: day.topic, action: 'Authority Post Drafted'}, ...prev]);
      setAuthView('library');
    } catch (e) { console.error(e); }
    finally { setGeneratingPostId(null); }
  };

  const handleGenDocs = async () => {
    if (!isPremium) { onTriggerPaywall(); return; }
    setLoadingDocs(true);
    try {
      const result = await generateDocuments(resume, jobDesc);
      setDocs(result);
      if (onSaveAssets) onSaveAssets(result, questions);
    } catch (e) { console.error(e); } 
    finally { setLoadingDocs(false); }
  };

  const handleGenQuestions = async () => {
    if (!isPremium) { onTriggerPaywall(); return; }
    setLoadingQuestions(true);
    try {
      const result = await generateInterviewStrategies(resume, jobDesc);
      setQuestions(result);
      if (onSaveAssets) onSaveAssets(docs, result);
    } catch (e) { console.error(e); } 
    finally { setLoadingQuestions(false); }
  };

  const handleGenThankYou = async () => {
    if (!isPremium) { onTriggerPaywall(); return; }
    setLoadingThankYou(true);
    try {
      const res = await generateThankYouBridge(resume, data.jobTitle, data.company);
      setThankYouBridge(res);
    } catch (e) { console.error(e); }
    finally { setLoadingThankYou(false); }
  };

  const handleGenRejection = async () => {
    if (!isPremium) { onTriggerPaywall(); return; }
    setLoadingRejection(true);
    try {
      const res = await generateRejectionBridge(resume, data.jobTitle, data.company);
      setRejectionBridge(res);
    } catch (e) { console.error(e); }
    finally { setLoadingRejection(false); }
  };

  const markAsUtilized = (postId: string) => {
    setAuthorityPosts(prev => prev.map(p => p.id === postId ? { ...p, utilized: true } : p));
  };

  const toggleSkillUtilized = (skill: string) => {
    setUtilizedSkills(prev => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string, postId?: string) => {
    navigator.clipboard.writeText(text);
    if (postId) markAsUtilized(postId);
    alert(`${label} copied to clipboard.`);
  };

  const copySkillsList = () => {
    const list = data.profile_architect?.skill_seed_list.join('\n') || '';
    navigator.clipboard.writeText(list);
    alert('Skills list copied as reference checklist.');
  };

  const skillData = [
    { name: 'Technical', value: data.technicalFitScore },
    { name: 'Cultural', value: data.culturalFitScore },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-[#212529] font-sans pb-32">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo className="h-8" subtitle="Career Intelligence Engine" />
          <div className="flex items-center gap-6">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${isAuthorityPremium ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-800 shadow-sm' : isPremium ? 'platinum-glow' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
              {isAuthorityPremium ? 'Diamond Plus' : isPremium ? 'Platinum Status' : 'Standard'}
            </div>
            <button onClick={() => setShowHistory(true)} className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Sessions
            </button>
            <button onClick={onReset} className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">New Diagnostic</button>
          </div>
        </div>
        
        <nav className="max-w-7xl mx-auto px-6 overflow-x-auto no-scrollbar border-t border-slate-50">
          <div className="flex gap-10 whitespace-nowrap">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'linkedin', label: 'LinkedIn Profile', icon: '🔍' },
              { id: 'docs', label: 'Documents', icon: '📄' },
              { id: 'interview', label: 'Interview Strategy', icon: '🎯' },
              { id: 'jobs', label: 'Market Pulse', icon: '📈' },
              { id: 'authority', label: 'Authority Engine', icon: '⚡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group py-5 px-2 border-b-4 font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center gap-3 relative ${activeTab === tab.id ? 'border-fit-green text-[#212529]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <span className={`text-base transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'grayscale-0' : 'grayscale opacity-60'}`}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <HistoryDrawer isOpen={showHistory} onClose={() => setShowHistory(false)} history={history} onLoadHistory={onLoadHistory} isPremium={isPremium} />

      <main className="max-w-7xl mx-auto px-6 pt-12">
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fadeInScale">
            <div className="lg:col-span-8 space-y-10">
              <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-12">
                <div className="flex gap-10 shrink-0">
                  <RadialScore score={data.overallScore} label="FitScore" color="text-fit-blue" />
                  {inputs.hasLinkedIn && <RadialScore score={data.linkedinPso.overall_score} label="PSO Visibility" color="text-cyan-600" />}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-[#212529] uppercase tracking-tighter mb-4 leading-none">{data.jobTitle}</h2>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-2 border-fit-blue pl-6 py-2">"{data.summary}"</p>
                  </div>
                </div>
              </section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">FitScore Gaps</h3>
                   <div className="space-y-3">
                     {data.missingSkills.map((skill, i) => (
                       <div key={i} className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                         <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                         <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">{skill}</span>
                       </div>
                     ))}
                   </div>
                 </div>
                 <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Role Saturation</h3>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={skillData}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: '#94a3b8'}} />
                          <YAxis hide domain={[0, 100]} />
                          <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={40}>
                             {skillData.map((e, i) => (
                               <Cell key={i} fill={i === 0 ? '#004c97' : '#86bc25'} />
                             ))}
                             <LabelList dataKey="value" position="top" style={{fontSize: 11, fontWeight: '900', fill: '#475569'}} formatter={(v: any) => `${v}%`} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
              </div>
            </div>
            <aside className="lg:col-span-4 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Adjacent Roles</h3>
                <div className="space-y-4">
                    {data.suggestedJobs.slice(0, 5).map((job, i) => (
                      <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-black text-[#212529] uppercase">{job.title}</p>
                            <span className="text-[9px] font-black text-fit-blue">{job.matchScore}%</span>
                         </div>
                         <p className="text-[10px] text-slate-500 font-medium leading-tight">{job.reason}</p>
                      </div>
                    ))}
                 </div>
            </aside>
          </div>
        )}

        {/* TAB: LINKEDIN PROFILE (Relocated Lock & Optimized Spacing) */}
        {activeTab === 'linkedin' && (
          <div className="relative animate-fadeInScale space-y-4 min-h-[600px]">
             
             {/* 1. Header & Score - ALWAYS VISIBLE */}
             <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row items-center gap-10">
                   <RadialScore score={data.linkedinPso.overall_score} label="PSO Visibility" color="text-cyan-600" />
                   <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Authority Ranking Skills</h2>
                        {isPremium && (
                          <button onClick={copySkillsList} className="px-4 py-2 bg-slate-900 text-white rounded-full text-[9px] font-black border border-slate-900 uppercase tracking-widest hover:bg-black transition-all">Copy Skills List</button>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">
                        Searchability is derived from methodology density. {isPremium ? 'Track your profile entry below.' : 'Your current profile has gaps. Unlock the full audit to see the 50 Magnet Keywords required to rank for this role.'}
                      </p>
                   </div>
                </div>
             </section>

             {/* 2. THE LOCK GATE - ONLY IF NOT PREMIUM */}
             {!isPremium && (
               <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-xl flex flex-col items-center text-center animate-fadeInScale">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Straight Talk: Your current profile has gaps.</p>
                  <button 
                    onClick={onTriggerPaywall}
                    className="px-12 py-5 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95"
                  >
                    Unlock Full LinkedIn Audit & 50 Keywords
                  </button>
               </div>
             )}

             {/* 3. OPTIMIZED CONTENT - BLURRED IF NOT PREMIUM */}
             <div className={!isPremium ? "blur-md pointer-events-none select-none opacity-40 space-y-4 pb-10" : "space-y-4 pb-10"}>
                
                {/* Headline Section */}
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="mb-2">
                       <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-0.5">Optimized LinkedIn Headline</h3>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Designed for maximum recruiter keyword indexing.</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group relative">
                        <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }} className="text-slate-900 font-bold leading-relaxed mb-4">
                            {data.linkedinPso.optimized_suggestions.headline_v2}
                        </p>
                        <button onClick={() => copyToClipboard(data.linkedinPso.optimized_suggestions.headline_v2, 'Headline')} className="text-[8px] font-black text-cyan-600 uppercase border border-cyan-100 px-3 py-1.5 rounded-full bg-white hover:bg-cyan-50 transition-all absolute top-4 right-4">Copy</button>
                    </div>
                </section>

                {/* About Section */}
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="mb-2">
                       <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-0.5">Professional LinkedIn About</h3>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">A first-person strategic narrative focused on PM lifecycle impact.</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group relative">
                        <div className="overflow-auto max-h-[250px]">
                            <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }} className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                {data.linkedinPso.optimized_suggestions.professional_narrative}
                            </p>
                        </div>
                        <button onClick={() => copyToClipboard(data.linkedinPso.optimized_suggestions.professional_narrative, 'About')} className="text-[8px] font-black text-cyan-600 uppercase border border-cyan-100 px-3 py-1.5 rounded-full bg-white hover:bg-cyan-50 transition-all absolute top-4 right-4">Copy</button>
                    </div>
                </section>

                {/* Niche Authority Mapping */}
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="mb-2">
                       <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-0.5">Niche Authority Mapping</h3>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">The semantic gap analysis identifying your competitive signal.</p>
                    </div>
                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 italic">
                        <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }} className="text-indigo-900 font-medium leading-relaxed text-sm">
                            "{data.linkedinPso.semantic_gap_analysis}"
                        </p>
                    </div>
                </section>

                {/* Authority Ranking Skills Grid */}
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">50 Recruiter-Magnet Skill Keywords</h4>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-left">
                      {data.profile_architect?.skill_seed_list.map((skill, i) => {
                        const isUtilized = utilizedSkills.has(skill);
                        return (
                          <button 
                            key={i} 
                            onClick={() => toggleSkillUtilized(skill)}
                            style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}
                            className={`px-3 py-1.5 border rounded-lg text-left font-bold transition-all duration-200 uppercase tracking-tight text-xs ${isUtilized ? 'bg-fit-green border-fit-green text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-cyan-200 hover:text-cyan-700'}`}
                          >
                             {isUtilized && <span className="mr-1">✓</span>}
                             {skill}
                          </button>
                        );
                      })}
                   </div>
                </section>
             </div>
          </div>
        )}

        {/* TAB: DOCUMENTS */}
        {activeTab === 'docs' && (
          <div className="relative animate-fadeInScale space-y-12 min-h-[600px]">
            <div className={!isPremium ? "blur-md pointer-events-none select-none opacity-50" : "flex flex-col items-center"}>
                {!docs ? (
                  <div className="py-32 flex flex-col items-center text-center">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">No Document Suite Generated</h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-10 max-w-sm">Synthesize your data into high-fidelity recruiter assets.</p>
                    <button onClick={handleGenDocs} disabled={loadingDocs} className="px-12 py-6 bg-slate-900 text-white font-black rounded-[2rem] text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl active:scale-95">
                      {loadingDocs ? 'Building Executive Assets...' : 'Generate Document Suite'}
                    </button>
                  </div>
                ) : (
                  <div className="w-full space-y-24 pb-32">
                    <DocumentPreview title="Machine-Optimized Resume" content={docs.fullOptimizedResume || docs.optimizedResumeSnippet} />
                    <DocumentPreview title="Professional Cover Letter" content={docs.coverLetter} />
                  </div>
                )}
            </div>
            {!isPremium && <PremiumOverlay title="Document Suite" feature="ATS-Engineered Submissions" onTriggerPaywall={onTriggerPaywall} />}
          </div>
        )}

        {/* TAB: INTERVIEW STRATEGY */}
        {activeTab === 'interview' && (
          <div className="relative animate-fadeInScale space-y-12 max-w-5xl mx-auto min-h-[600px]">
            <div className={!isPremium ? "blur-md pointer-events-none select-none opacity-50" : "space-y-12 pb-32"}>
                <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl">
                   <div className="flex justify-between items-center mb-12">
                      <h3 className="text-2xl font-black text-[#212529] uppercase tracking-tighter">STAR-Method Scenarios</h3>
                      {!questions.length && (
                        <button onClick={handleGenQuestions} disabled={loadingQuestions} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                          {loadingQuestions ? 'Analyzing Surface...' : 'Generate Scenarios'}
                        </button>
                      )}
                   </div>
                   <div className="space-y-6">
                    {questions.map((q, i) => (
                      <div key={i} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                         <div className="flex gap-6 items-start mb-8">
                            <span className="text-slate-300 font-black text-2xl group-hover:text-fit-blue transition-colors">{(i+1).toString().padStart(2, '0')}</span>
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{q.question}</h4>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Context (STAR)</p><p className="text-xs text-slate-500 font-medium italic leading-relaxed text-[#212529]">"{q.starAnswer.situation} {q.starAnswer.task}"</p></div>
                            <div><p className="text-[10px] font-black text-fit-blue uppercase tracking-widest mb-3">Resolution</p><p className="text-xs text-[#212529] font-bold leading-relaxed">{q.starAnswer.action} — {q.starAnswer.result}</p></div>
                         </div>
                      </div>
                    ))}
                  </div>
                </section>

                <BridgeSection 
                  title="The Thank You Bridge" 
                  content={thankYouBridge} 
                  onGenerate={handleGenThankYou} 
                  loading={loadingThankYou} 
                  icon="✉️" 
                />
                
                <BridgeSection 
                  title="The Rejection Bridge" 
                  content={rejectionBridge} 
                  onGenerate={handleGenRejection} 
                  loading={loadingRejection} 
                  icon="🛡️" 
                />
            </div>
            {!isPremium && <PremiumOverlay title="Interview Suite" feature="Scenario Simulation & Bridge Generators" onTriggerPaywall={onTriggerPaywall} />}
          </div>
        )}

        {/* TAB: MARKET PULSE */}
        {activeTab === 'jobs' && (
          <div className="relative animate-fadeInScale space-y-12 min-h-[600px]">
            <div className={!isPremium ? "blur-md pointer-events-none select-none opacity-50" : "bg-white p-16 rounded-[4rem] border border-slate-100 shadow-xl"}>
                <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
                     <span className="w-4 h-4 rounded-full bg-fit-blue"></span>
                     Strategic Alignment Pulse
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {data.suggestedJobs.map((job, i) => (
                    <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:scale-[1.03] hover:border-fit-blue transition-all flex flex-col group shadow-sm hover:shadow-lg">
                       <div className="flex justify-between items-start mb-6">
                          <h4 className="text-base font-black text-slate-900 group-hover:text-fit-blue transition-colors uppercase leading-tight max-w-[120px]">{job.title}</h4>
                          <span className="px-3 py-1 bg-blue-50 text-fit-blue rounded-full text-[9px] font-black uppercase border border-blue-100">{job.matchScore}%</span>
                       </div>
                       <p className="text-[11px] text-slate-500 font-medium leading-relaxed flex-1 italic mb-8">"{job.reason}"</p>
                       <div className="mb-6">
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(job.title + " " + (data.company || "") + " jobs")}`} target="_blank" rel="noopener noreferrer" className="py-4 w-full bg-white border border-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">Research Role</a>
                       </div>
                    </div>
                  ))}
                </div>
            </div>
            {!isPremium && <PremiumOverlay title="Market Pulse" feature="Adjacent Role Detection & Discovery Guides" onTriggerPaywall={onTriggerPaywall} />}
          </div>
        )}

        {/* TAB: AUTHORITY ENGINE */}
        {activeTab === 'authority' && (
          <div className="relative animate-fadeInScale space-y-12 min-h-[600px]">
             <div className={!isAuthorityPremium ? "blur-md pointer-events-none select-none opacity-50" : "space-y-12 pb-20"}>
                
                <div className="flex justify-center mb-10">
                   <div className="bg-white p-1.5 rounded-[1.25rem] flex items-center shadow-xl border border-slate-100 gap-1">
                      <button 
                        onClick={() => setAuthView('setup')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${authView === 'setup' ? 'bg-purple-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Setup
                      </button>
                      <button 
                        onClick={() => setAuthView('calendar')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${authView === 'calendar' ? 'bg-purple-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                        Calendar
                      </button>
                      <button 
                        onClick={() => setAuthView('library')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${authView === 'library' ? 'bg-purple-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        Library
                      </button>
                      <button 
                        onClick={() => setAuthView('history')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${authView === 'history' ? 'bg-purple-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        History
                      </button>
                   </div>
                </div>

                {authView === 'setup' && (
                  <section className="max-w-3xl mx-auto bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl">
                    <div className="mb-10 text-center">
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Authority Control Center</h3>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Calibrate your industry voice for maximum recruiter signal.</p>
                    </div>
                    <div className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Topic Session</label>
                             <select value={authorityStrategy.topicSession} onChange={e => setAuthorityStrategy({...authorityStrategy, topicSession: e.target.value})} className="w-full p-4 bg-purple-50 border border-purple-100 rounded-2xl text-xs font-black text-purple-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
                               {['Session 1', 'Session 2', 'Session 3', 'Session 4'].map(o => <option key={o} value={o}>{o}</option>)}
                             </select>
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">PM Specialization</label>
                             <select value={authorityStrategy.specialization} onChange={e => setAuthorityStrategy({...authorityStrategy, specialization: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none">
                               {['IT/Software', 'Construction', 'Healthcare', 'FinTech', 'Manufacturing', 'Creative/Marketing'].map(o => <option key={o} value={o}>{o}</option>)}
                             </select>
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Certification</label>
                             <select value={authorityStrategy.certification} onChange={e => setAuthorityStrategy({...authorityStrategy, certification: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none">
                               {['None', 'PMP', 'CAPM', 'CSM', 'Prince2', 'Six Sigma'].map(o => <option key={o} value={o}>{o}</option>)}
                             </select>
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Years of Experience</label>
                             <select value={authorityStrategy.experience} onChange={e => setAuthorityStrategy({...authorityStrategy, experience: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none">
                               {['0-2', '3-5', '6-10', '10+'].map(o => <option key={o} value={o}>{o}</option>)}
                             </select>
                          </div>
                          <div className="md:col-span-2">
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Primary Career Goal</label>
                             <select value={authorityStrategy.goal} onChange={e => setAuthorityStrategy({...authorityStrategy, goal: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none">
                               {['Get Recruited', 'Become a Thought Leader', 'Network with Peers'].map(o => <option key={o} value={o}>{o}</option>)}
                             </select>
                          </div>
                       </div>
                       <div className="pt-10 border-t border-slate-50 text-center">
                          <button onClick={() => { if (contentMatrix.length > 0 && !window.confirm(`Switching to ${authorityStrategy.topicSession} will generate 30 new unique topics. Do you wish to proceed?`)) return; handleGenMatrix(); }} disabled={loadingMatrix} className="px-16 py-6 bg-purple-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-950 transition-all shadow-xl disabled:opacity-50">
                            {loadingMatrix ? 'Plotting Unique Industry Logic...' : `Activate ${authorityStrategy.topicSession}`}
                          </button>
                       </div>
                    </div>
                  </section>
                )}

                {authView === 'calendar' && (
                  <section className="space-y-8 animate-fadeInScale">
                    <div className="max-w-4xl mx-auto bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex items-center gap-6 shadow-sm">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 shrink-0">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-indigo-800 uppercase tracking-[0.1em] mb-1">Session Protocol: {authorityStrategy.topicSession}</p>
                        <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                          {jobDesc ? (
                            <>Currently prioritizing <span className="font-black text-indigo-600 uppercase">[{prioritizedRequirement || 'Core JD Requirements'}]</span> for this session.</>
                          ) : (
                            <>Content matrix is unique to <span className="font-black text-indigo-600 uppercase">[{authorityStrategy.topicSession}]</span> with zero overlap with previous history.</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl max-w-7xl mx-auto">
                       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {contentMatrix.map((day) => {
                            const isGenerating = generatingPostId === day.day;
                            const isGapTopic = data.missingSkills.some(gap => day.topic.toLowerCase().includes(gap.toLowerCase()));
                            const isSelected = day.selected;
                            
                            return (
                              <button 
                                key={day.day} 
                                onClick={() => handleGenPost(day)} 
                                disabled={isGenerating} 
                                className={`p-5 rounded-2xl border transition-all text-left flex flex-col h-full group ${isSelected ? 'bg-slate-100 border-slate-200' : isGapTopic ? 'bg-amber-50 border-amber-200 hover:border-amber-400' : 'bg-slate-50 border-slate-100 hover:border-purple-400'}`}
                              >
                                 <div className="flex justify-between items-center mb-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">Day {day.day}</span>
                                    {isSelected ? (
                                      <svg className="w-3 h-3 text-fit-green" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    ) : isGapTopic && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Gap Bridge"></div>
                                    )}
                                 </div>
                                 <p className={`text-[10px] font-black uppercase leading-tight mb-3 flex-1 line-clamp-3 ${isSelected ? 'text-slate-400' : 'text-slate-900'}`}>
                                   {day.topic}
                                 </p>
                                 <div className={`text-[7px] font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-fit-green' : 'text-slate-400 group-hover:text-purple-600'}`}>
                                   {isSelected ? 'Post Generated' : isGenerating ? 'Synthesizing...' : 'Draft Post →'}
                                 </div>
                              </button>
                            );
                          })}
                       </div>
                    </div>
                  </section>
                )}

                {authView === 'library' && (
                  <section className="space-y-10 max-w-5xl mx-auto animate-fadeInScale">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {authorityPosts.map(post => (
                          <div key={post.id} className={`bg-white p-10 rounded-[3rem] border shadow-lg hover:shadow-xl transition-all group relative ${post.utilized ? 'border-fit-green/50' : 'border-slate-100'}`}>
                             {post.utilized && (
                               <div className="absolute top-8 right-32 z-10 flex items-center gap-1.5 px-3 py-1 bg-fit-green text-white rounded-full border border-fit-green shadow-sm scale-90">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                  <span className="text-[8px] font-black uppercase tracking-widest">Utilized on LinkedIn</span>
                               </div>
                             )}
                             <div className="flex justify-between items-start mb-6">
                                <div className="flex flex-wrap gap-2">
                                   {post.tags.map(tag => (
                                     <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase rounded-full border border-slate-100">{tag}</span>
                                   ))}
                                </div>
                                <button onClick={() => copyToClipboard(post.content, 'Post', post.id)} className={`text-[9px] font-black uppercase border px-4 py-1.5 rounded-full transition-all ${post.utilized ? 'bg-fit-green text-white border-fit-green' : 'bg-white text-purple-600 border-purple-100 hover:bg-purple-50'}`}>
                                  {post.utilized ? 'Copy Again' : 'Copy Text'}
                                </button>
                             </div>
                             <h4 className={`text-xl font-black uppercase tracking-tighter mb-4 leading-tight ${post.utilized ? 'text-slate-400' : 'text-slate-900'}`}>{post.title}</h4>
                             <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }} className="text-slate-600 font-medium leading-relaxed italic mb-8 border-l-2 border-purple-100 pl-4 whitespace-pre-wrap">{post.content}</p>
                             <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <span className="text-[8px] font-black text-slate-300 uppercase">{new Date(post.timestamp).toLocaleDateString()}</span>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${post.utilized ? 'text-fit-green' : 'text-purple-200'}`}>
                                  {post.utilized ? 'Ready for Engagement' : 'Saved Authority Post'}
                                </span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </section>
                )}

                {authView === 'history' && (
                  <section className="max-w-3xl mx-auto animate-fadeInScale">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                       <div className="p-8 border-b border-slate-50 bg-slate-50/30 text-center">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest inline-flex items-center gap-2">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             Chronological Activity Log
                          </h3>
                       </div>
                       <div className="divide-y divide-slate-50">
                          {authLog.length === 0 ? (
                            <div className="p-12 text-center">
                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No activity recorded for this session.</p>
                            </div>
                          ) : (
                            authLog.map((log, i) => (
                              <div key={i} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors">
                                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <span className="text-[9px] font-black uppercase">{new Date(log.timestamp).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-0.5">{log.action}</p>
                                    <h4 className="text-sm font-bold text-[#212529] truncate max-w-md">{log.topic}</h4>
                                 </div>
                                 <div className="text-right shrink-0">
                                    <p className="text-[9px] font-bold text-slate-300 uppercase">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                 </div>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  </section>
                )}
             </div>
             {!isAuthorityPremium && <PremiumOverlay title="Authority Engine" feature="30-Day Content Matrices & Authority Posts" onTriggerPaywall={onTriggerAuthorityPaywall} variant="diamond" />}
          </div>
        )}
      </main>
    </div>
  );
};
