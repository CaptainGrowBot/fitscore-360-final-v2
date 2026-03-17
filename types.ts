
export interface FitAnalysis {
  overallScore: number;
  technicalFitScore: number;
  culturalFitScore: number;
  summary: string;
  nudge_text: string;
  missingSkills: string[];
  strengths: string[];
  actionPlan: ActionItem[];
  eventPrep: EventPrepStrategy;
  networking: NetworkingStrategy;
  suggestedJobs: JobRecommendation[];
  linkedinPso: {
    overall_score: number;
    rating: "Brew Master" | "High Signal" | "Mixed Signal" | "Ghost Mode";
    niche_alignment_score: number;
    critical_fixes: string[];
    semantic_gap_analysis: string;
    proof_signal_count: number;
    optimized_suggestions: {
      headline_v2: string;
      headlines: {
        label: "Standard" | "Value-Based" | "Keyword-Heavy";
        text: string;
      }[];
      full_about: string;
      professional_narrative: string;
      missing_entities: string[];
      top_skills_to_highlight: string[];
      strongest_niche: string;
    };
  };
  profile_architect?: {
    banner_strategy: string;
    experience_overhaul: {
      title: string;
      company: string;
      impact_statements: string[];
    }[];
    skill_seed_list: string[];
  };
  jobTitle: string;
  company: string;
}

export interface InterviewQuestion {
  question: string;
  starAnswer: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

export interface FileData {
  name: string;
  data: string;
  mimeType: string;
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: number;
  analysis: FitAnalysis;
  resumeText: string;
  linkedinText: string;
  jobDescText: string;
  resumeFile: FileData | null;
  linkedinFile: FileData | null;
  jobDescFile: FileData | null;
  generatedDocs?: GeneratedDocs | null;
  interviewQuestions?: InterviewQuestion[];
}

export interface JobRecommendation {
  title: string;
  matchScore: number;
  reason: string;
  searchQuery: string;
}

export interface ActionItem {
  title: string;
  description: string;
  type: 'course' | 'project' | 'certification' | 'reading';
  estimatedTime: string;
}

export interface EventPrepStrategy {
  talkingPoints: string[];
  questionsToAsk: string[];
  companyVibe: string;
}

export interface NetworkingStrategy {
  mentorArchetype: string;
  outreachMessage: string;
}

export interface GeneratedDocs {
  coverLetter: string;
  optimizedResumeSnippet: string;
  starBullets: string[];
  followUpEmail?: string;
  linkedinProfile?: {
    headline: string;
    about: string;
  };
  fullOptimizedResume?: string;
}

export interface ContentMatrixDay {
  day: number;
  topic: string;
  hook_idea: string;
  selected?: boolean;
  session?: string;
}

export interface ContentMatrixResult {
  matrix: ContentMatrixDay[];
  prioritizedRequirement: string;
}

export interface AuthorityPost {
  id: string;
  title: string;
  content: string;
  topic: string;
  timestamp: number;
  tags: string[];
  utilized?: boolean;
}

export interface AuthorityStrategy {
  specialization: string;
  certification: string;
  experience: string;
  goal: string;
  topicSession: string;
}

export interface EngagementScript {
  label: string;
  script: string;
}

export interface InputPart {
  text?: string;
  file?: {
    data: string;
    mimeType: string;
  };
}

export interface FullAnalysisInput {
  resume: InputPart;
  jobDesc: InputPart;
  linkedin: InputPart;
}

export interface ResumeInput {
  text?: string;
  linkedinText?: string;
  file?: {
    data: string;
    mimeType: string;
  };
}

export enum AppStep {
  STRATEGY = 'STRATEGY',
  INPUT = 'INPUT',
  BUILDER = 'BUILDER',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
}

export interface BuilderData {
  contact: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
  };
  education: {
    university: string;
    degree: string;
    gradYear: string;
    gpa: string;
    coursework: string;
  }[];
  experience: {
    title: string;
    company: string;
    dates: string;
    description: string;
  }[];
  projects: {
    name: string;
    description: string;
    techStack: string;
  }[];
  skills: string;
}
