
import React, { useState } from 'react';
import { BuilderData } from '../types';
import { generateResumeFromBuilder } from '../services/geminiService';
import { Logo } from '../App';

interface ResumeBuilderProps {
  onComplete: (resumeText: string) => void;
  onCancel: () => void;
  isPremium: boolean;
  onTriggerPaywall: () => void;
}

const emptyEducation = { university: '', degree: '', gradYear: '', gpa: '', coursework: '' };
const emptyExperience = { title: '', company: '', dates: '', description: '' };
const emptyProject = { name: '', description: '', techStack: '' };

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ onComplete, onCancel, isPremium, onTriggerPaywall }) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<BuilderData>({
    contact: { name: '', email: '', phone: '', linkedin: '' },
    education: [{ ...emptyEducation }],
    experience: [{ ...emptyExperience }],
    projects: [{ ...emptyProject }],
    skills: ''
  });

  const handleChange = (section: keyof BuilderData, index: number | null, field: string, value: string) => {
    if (section === 'contact') {
      setData(prev => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
    } else if (section === 'skills') {
      setData(prev => ({ ...prev, skills: value }));
    } else if (Array.isArray(data[section]) && index !== null) {
      const newArray = [...(data[section] as any[])];
      newArray[index] = { ...newArray[index], [field]: value };
      setData(prev => ({ ...prev, [section]: newArray }));
    }
  };

  const addItem = (section: 'education' | 'experience' | 'projects') => {
    const item = section === 'education' ? emptyEducation : section === 'experience' ? emptyExperience : emptyProject;
    setData(prev => ({ ...prev, [section]: [...prev[section], item] }));
  };

  const removeItem = (section: 'education' | 'experience' | 'projects', index: number) => {
    setData(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
  };

  const handleGenerate = async () => {
    if (!isPremium) {
      onTriggerPaywall();
      return;
    }
    
    setIsGenerating(true);
    try {
      const resumeText = await generateResumeFromBuilder(data);
      onComplete(resumeText);
    } catch (e) {
      alert("Failed to build resume. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 max-w-4xl mx-auto my-8 animate-fadeInScale">
      <div className="bg-slate-900 p-6 flex justify-between items-center text-white border-b-4 border-fit-green">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-lg">
             <Logo className="h-6" subtitle="Career Intelligence Engine" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Strategic Resume Builder</h2>
            <p className="text-slate-400 text-xs">Diagnostic construction for platinum matching.</p>
          </div>
        </div>
        <div className="text-[10px] bg-fit-green px-3 py-1 rounded-full font-bold uppercase tracking-wide">
          Pro Feature
        </div>
      </div>

      <div className="p-8">
        <div className="flex justify-between mb-8 border-b pb-4">
          {['Contact', 'Education', 'Experience', 'Projects/Skills'].map((label, i) => (
            <div key={i} className={`flex flex-col items-center w-1/4 ${step === i + 1 ? 'text-fit-green font-bold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step === i + 1 ? 'bg-fit-green text-white shadow-lg' : 'bg-gray-200'}`}>
                {i + 1}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">{label}</span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-fadeInScale">
            <h3 className="text-lg font-bold text-slate-800">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-fit-green focus:ring-fit-green p-3 border outline-none" placeholder="Full Name"
                value={data.contact.name} onChange={e => handleChange('contact', null, 'name', e.target.value)} />
              <input type="email" className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-fit-green focus:ring-fit-green p-3 border outline-none" placeholder="Email Address"
                 value={data.contact.email} onChange={e => handleChange('contact', null, 'email', e.target.value)} />
              <input type="text" className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-fit-green focus:ring-fit-green p-3 border outline-none" placeholder="Phone Number"
                 value={data.contact.phone} onChange={e => handleChange('contact', null, 'phone', e.target.value)} />
              <input type="text" className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-fit-green focus:ring-fit-green p-3 border outline-none" placeholder="LinkedIn URL"
                 value={data.contact.linkedin} onChange={e => handleChange('contact', null, 'linkedin', e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeInScale">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Education Diagnostics</h3>
              <button onClick={() => addItem('education')} className="text-sm text-fit-green font-bold">+ Add School</button>
            </div>
            {data.education.map((edu, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-gray-100 relative">
                {idx > 0 && <button onClick={() => removeItem('education', idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600">✕</button>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" className="w-full rounded-xl border-slate-200 p-3 text-sm outline-none border focus:ring-2 focus:ring-fit-green" placeholder="University"
                      value={edu.university} onChange={e => handleChange('education', idx, 'university', e.target.value)} />
                  <input type="text" className="w-full rounded-xl border-slate-200 p-3 text-sm outline-none border focus:ring-2 focus:ring-fit-green" placeholder="Degree / Major"
                      value={edu.degree} onChange={e => handleChange('education', idx, 'degree', e.target.value)} />
                  <div className="flex gap-4">
                    <input type="text" className="w-1/2 rounded-xl border-slate-200 p-3 text-sm outline-none border focus:ring-2 focus:ring-fit-green" placeholder="Grad Year"
                        value={edu.gradYear} onChange={e => handleChange('education', idx, 'gradYear', e.target.value)} />
                    <input type="text" className="w-1/2 rounded-xl border-slate-200 p-3 text-sm outline-none border focus:ring-2 focus:ring-fit-green" placeholder="GPA"
                        value={edu.gpa} onChange={e => handleChange('education', idx, 'gpa', e.target.value)} />
                  </div>
                  <input type="text" className="md:col-span-2 w-full rounded-xl border-slate-200 p-3 text-sm outline-none border focus:ring-2 focus:ring-fit-green" placeholder="Relevant Coursework (Separated by commas)"
                      value={edu.coursework} onChange={e => handleChange('education', idx, 'coursework', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeInScale">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Impact Experience</h3>
              <button onClick={() => addItem('experience')} className="text-sm text-fit-green font-bold">+ Add Experience</button>
            </div>
            {data.experience.map((exp, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-gray-100 relative">
                <button onClick={() => removeItem('experience', idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600">✕</button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" className="w-full rounded-xl border-slate-200 p-3 text-sm border outline-none focus:ring-2 focus:ring-fit-green" placeholder="Job Title"
                      value={exp.title} onChange={e => handleChange('experience', idx, 'title', e.target.value)} />
                  <input type="text" className="w-full rounded-xl border-slate-200 p-3 text-sm border outline-none focus:ring-2 focus:ring-fit-green" placeholder="Company"
                      value={exp.company} onChange={e => handleChange('experience', idx, 'company', e.target.value)} />
                  <input type="text" className="md:col-span-2 w-full rounded-xl border-slate-200 p-3 text-sm border outline-none focus:ring-2 focus:ring-fit-green" placeholder="Dates (e.g. June 2023 - Present)"
                      value={exp.dates} onChange={e => handleChange('experience', idx, 'dates', e.target.value)} />
                  <textarea className="md:col-span-2 w-full rounded-xl border-slate-200 p-3 text-sm border outline-none focus:ring-2 focus:ring-fit-green" rows={3} placeholder="Impact summary (What did you achieve? Use metrics if possible)"
                      value={exp.description} onChange={e => handleChange('experience', idx, 'description', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fadeInScale">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Skills Saturation</h3>
              <textarea 
                className="w-full rounded-2xl border-slate-200 p-4 text-sm focus:ring-2 focus:ring-fit-green outline-none border" 
                rows={3} 
                placeholder="List technical and core skills (e.g. Python, Agile, SQL, Public Speaking)..."
                value={data.skills}
                onChange={e => handleChange('skills', null, '', e.target.value)}
              />
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Diagnostic Projects</h3>
                <button onClick={() => addItem('projects')} className="text-sm text-fit-green font-bold">+ Add Project</button>
              </div>
              {data.projects.map((proj, idx) => (
                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-gray-100 relative">
                  <button onClick={() => removeItem('projects', idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600">✕</button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" className="w-full rounded-xl border-slate-200 p-3 text-sm border outline-none focus:ring-2 focus:ring-fit-green" placeholder="Project Name"
                        value={proj.name} onChange={e => handleChange('projects', idx, 'name', e.target.value)} />
                    <input type="text" className="w-full rounded-xl border-slate-200 p-3 text-sm border outline-none focus:ring-2 focus:ring-fit-green" placeholder="Tech Stack"
                        value={proj.techStack} onChange={e => handleChange('projects', idx, 'techStack', e.target.value)} />
                    <textarea className="md:col-span-2 w-full rounded-xl border-slate-200 p-3 text-sm border outline-none focus:ring-2 focus:ring-fit-green" rows={2} placeholder="Project Outcome"
                        value={proj.description} onChange={e => handleChange('projects', idx, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between border-t pt-6">
          <button onClick={step === 1 ? onCancel : () => setStep(step - 1)} className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">{step === 1 ? 'Cancel' : 'Back'}</button>
          <button onClick={step === 4 ? handleGenerate : () => setStep(step + 1)} className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${step === 4 ? 'bg-fit-green text-white hover:opacity-90' : 'bg-slate-900 text-white hover:bg-black'}`}>
             {isGenerating ? 'Building Diagnostic Asset...' : step === 4 ? 'Complete Strategic Build' : 'Next Step →'}
             {step === 4 && !isPremium && <span className="text-[10px] bg-white text-fit-green px-1.5 rounded uppercase font-black tracking-widest">Pro</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
