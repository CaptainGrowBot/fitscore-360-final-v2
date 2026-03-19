
import { GoogleGenAI, Type } from "@google/genai";
import { FitAnalysis, GeneratedDocs, ResumeInput, BuilderData, FullAnalysisInput, InterviewQuestion, AnalysisHistoryItem, ContentMatrixDay, AuthorityPost, EngagementScript, AuthorityStrategy, ContentMatrixResult } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    jobTitle: { type: Type.STRING },
    company: { type: Type.STRING },
    overallScore: { type: Type.NUMBER },
    technicalFitScore: { type: Type.NUMBER },
    culturalFitScore: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    nudge_text: { type: Type.STRING },
    linkedinPso: {
      type: Type.OBJECT,
      properties: {
        overall_score: { type: Type.NUMBER },
        rating: { type: Type.STRING },
        niche_alignment_score: { type: Type.NUMBER },
        critical_fixes: { type: Type.ARRAY, items: { type: Type.STRING } },
        semantic_gap_analysis: { type: Type.STRING },
        proof_signal_count: { type: Type.NUMBER },
        optimized_suggestions: {
          type: Type.OBJECT,
          properties: {
            headline_v2: { type: Type.STRING },
            headlines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["label", "text"]
              }
            },
            full_about: { type: Type.STRING },
            professional_narrative: { type: Type.STRING },
            missing_entities: { type: Type.ARRAY, items: { type: Type.STRING } },
            top_skills_to_highlight: { type: Type.ARRAY, items: { type: Type.STRING } },
            strongest_niche: { type: Type.STRING }
          },
          required: ["headline_v2", "headlines", "full_about", "professional_narrative", "missing_entities", "top_skills_to_highlight", "strongest_niche"]
        }
      },
      required: ["overall_score", "rating", "niche_alignment_score", "critical_fixes", "semantic_gap_analysis", "proof_signal_count", "optimized_suggestions"]
    },
    profile_architect: {
      type: Type.OBJECT,
      properties: {
        banner_strategy: { type: Type.STRING },
        experience_overhaul: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              impact_statements: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "company", "impact_statements"]
          }
        },
        skill_seed_list: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["banner_strategy", "experience_overhaul", "skill_seed_list"]
    },
    missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    actionPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING },
          estimatedTime: { type: Type.STRING }
        },
        required: ["title", "description", "type", "estimatedTime"]
      }
    },
    eventPrep: {
      type: Type.OBJECT,
      properties: {
        talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        questionsToAsk: { type: Type.ARRAY, items: { type: Type.STRING } },
        companyVibe: { type: Type.STRING }
      },
      required: ["talkingPoints", "questionsToAsk", "companyVibe"]
    },
    networking: {
      type: Type.OBJECT,
      properties: {
        mentorArchetype: { type: Type.STRING },
        outreachMessage: { type: Type.STRING }
      },
      required: ["mentorArchetype", "outreachMessage"]
    },
    suggestedJobs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          matchScore: { type: Type.NUMBER },
          reason: { type: Type.STRING },
          searchQuery: { type: Type.STRING }
        },
        required: ["title", "matchScore", "reason", "searchQuery"]
      }
    }
  },
  required: [
    "jobTitle", "company", "overallScore", "technicalFitScore", 
    "culturalFitScore", "summary", "nudge_text", "linkedinPso", 
    "profile_architect", "missingSkills", "strengths", "actionPlan", 
    "eventPrep", "networking", "suggestedJobs"
  ]
};

export const analyzeFit = async (input: FullAnalysisInput): Promise<FitAnalysis> => {
  const ai = getAi();
  const model = "gemini-1.5-flash";
  const parts: any[] = [];
  
  const systemInstruction = `
    ## ROLE
    You are an Expert PM Career Strategist. Every analysis, resume optimization, and LinkedIn post must be grounded in Project Management methodologies (Agile, Waterfall, Scrum, Lean, etc.).

    ## DATA MODULARITY & PROFILE ARCHITECT
    One or more inputs (Resume, Job Description, LinkedIn Profile) may be MISSING. 
    - You MUST generate a "profile_architect" object regardless of which inputs are provided. 
    - If Job Description is provided: Calibrate ALL scores against this specific PM role.
    
    ## LINKEDIN PSO (360Brew Algorithm) LOGIC
    - Calculate Visibility Score (0-100) based on PM Keyword Density.
    - Rating Tiers: "Brew Master", "High Signal", "Mixed Signal", "Ghost Mode".

    ## THE 50-SKILL SEARCH MAGNET
    - Inside profile_architect, you MUST generate exactly 50 keywords in the "skill_seed_list".
    - Priority: Hard PM Skills (Risk Management, Budgeting, Agile Ceremonies), Technical Tools (Jira, Asana, MS Project), and Industry-Specific Keywords.

    ## HEADLINE & NARRATIVE EXPANSION
    - headlines: Generate EXACTLY 3 headline options.
      1. label: "Standard" (Option 1: The PM Professional).
      2. label: "Value-Based" (Option 2: The Outcome Performer).
      3. label: "Keyword-Heavy" (Option 3: The Agile/Waterfall Specialist).
    - professional_narrative: A summary of the user's career written in the FIRST PERSON ("I", "me", "my").
      Tone: Authoritative, result-driven, and methodology-aware.
      Structure:
        - Opening Hook: Unique value proposition as a PM.
        - Body: 2-3 bulleted "Boring Wins" focusing on ROI, project lifecycle, and efficiency.
        - Conclusion: Call-to-action for PM networking.

    ## JOB RECOMMENDATIONS
    - Exactly 8 PM-related job titles.
    - matchScore: Integer 0-100.
    - reason: A 2-sentence explanation grounded in project management needs.

    ## OUTPUT LOGIC
    Return JSON. No placeholders. Scores MUST be integers 0-100.
  `;

  if (input.jobDesc.file) parts.push({ inlineData: input.jobDesc.file });
  else if (input.jobDesc.text) parts.push({ text: `Job Description: ${input.jobDesc.text}` });

  if (input.resume.file) parts.push({ inlineData: input.resume.file });
  else if (input.resume.text) parts.push({ text: `Resume: ${input.resume.text}` });

  if (input.linkedin.file) parts.push({ inlineData: input.linkedin.file });
  else if (input.linkedin.text) parts.push({ text: `LinkedIn Profile: ${input.linkedin.text}` });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0,
      },
    });

    if (!response.text) throw new Error("Empty response");
    const parsed = JSON.parse(response.text);
    return parsed as FitAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateContentMatrix = async (strategy: AuthorityStrategy, summary: string, gaps: string[], jobDesc?: string, previousTopics: string[] = []): Promise<ContentMatrixResult> => {
  const ai = getAi();
  const model = "gemini-3-flash-preview";
  
  const previousContext = previousTopics.length > 0 ? `Avoid these previously generated topics: ${previousTopics.join(', ')}.` : '';

  const prompt = `## MISSION
  You are a Senior PM Brand Strategist. Your goal is to make the user look like the most prepared and insightful Project Manager in their niche: "${strategy.specialization}".
  
  ## REMOVAL OF SPECIFIC TARGETS
  STRICTLY AVOID mentioning the name of any specific company or target hiring entity found in the Job Description. The content must sound like the user is speaking to the entire industry, not just one specific manager.
  
  ## BROADEN CONTEXT
  Instead of targeting a specific role, generate insights like 'The current shift in ${strategy.specialization} requires a focus on...'. Use the Job Description data to identify Industry Trends and Macro Challenges.
  
  ## MANDATORY FOCUS
  Every topic must address a 'Market Truth' or a 'Common Industry Friction Point' relevant to Senior Project Managers in ${strategy.specialization}. Showcase mastery of methodologies (Agile, Waterfall, Lean) and Industry Foresight.
  
  ## PILLAR CONSTRAINTS
  Divide the 30 days into these 4 pillars:
  1. The Strategic 'Why': Why traditional frameworks (e.g. Agile/Waterfall) fail in specific industry contexts like ${strategy.specialization} and how the user's approach solves it.
  2. The Risk Foresight: insights into industry-wide challenges (e.g., 'The Hidden Cost of Resource Fragmentation in Logistics').
  3. The Leadership Delta: Strategies for managing complex stakeholders or cross-functional friction in ${strategy.specialization}.
  4. The Future of the Niche: Authoritative opinions on how technology or regulation will redefine the industry by 2026.
  
  ## CONTEXT
  User Summary (Boring Wins): "${summary}"
  Current Session: ${strategy.topicSession}
  ${previousContext}
  
  Return 30 unique topics in JSON format.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      matrix: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.NUMBER },
            topic: { type: Type.STRING },
            hook_idea: { type: Type.STRING }
          },
          required: ["day", "topic", "hook_idea"]
        }
      },
      prioritizedRequirement: { type: Type.STRING }
    },
    required: ["matrix", "prioritizedRequirement"]
  };

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  return JSON.parse(response.text || "{\"matrix\":[], \"prioritizedRequirement\":\"\"}") as ContentMatrixResult;
};

export const generateAuthorityPost = async (topic: string, strategy: AuthorityStrategy, summary: string, resumeText: string, gaps: string[], jobDesc?: string): Promise<Partial<AuthorityPost>> => {
  const ai = getAi();
  const model = "gemini-3-flash-preview";
  
  const prompt = `## ROLE
  You are a Senior PM Brand Strategist. Write a high-credibility, "Global Industry Authority" LinkedIn post for a PM professional.
  
  ## STERN PROHIBITION
  DO NOT mention the name of the company the user is applying to. The user is speaking to the entire niche: "${strategy.specialization}".
  
  ## TOPIC
  "${topic}"
  
  ## STRUCTURE (STRICT)
  1. COUNTER-INTUITIVE HOOK: Lead with a single punchy sentence that addresses a 'Market Truth' or 'Common Industry Friction Point' (e.g., "Most PMs focus on the timeline. I focus on the stakeholder friction that creates the timeline.").
  2. FRAMEWORK/LESSON: Provide a specific framework, methodology step, or industry foresight that proves the user is a subject matter expert. Ground it in real wins like: "${summary}".
  3. STRATEGIC QUESTION: End with a single high-level question to invite directors or peers to share their perspective on the landscape.
  
  ## TONALITY
  'Straight Talk', authoritative, visionary, and decisive. Avoid all AI clichés.
  
  Return JSON with "title", "content", and "tags".`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      content: { type: Type.STRING },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["title", "content", "tags"]
  };

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  return JSON.parse(response.text || "{}");
};

export const generateEngagementScripts = async (niche: string): Promise<EngagementScript[]> => {
  const ai = getAi();
  const model = "gemini-3-flash-preview";
  const prompt = `Generate 5 high-authority PM-focused networking engagement scripts for LinkedIn in the "${niche}" space.
  Ground everything in PM outcomes (Stakeholder buy-in, project velocity, resource optimization).
  
  Return JSON array of objects with "label" and "script".`;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING },
        script: { type: Type.STRING }
      },
      required: ["label", "script"]
    }
  };

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  return JSON.parse(response.text || "[]");
};

export const generateMasterProfile = async (currentJob: string, history: AnalysisHistoryItem[], resume: ResumeInput): Promise<{ headline: string, about: string, banner: string }> => {
  const ai = getAi();
  const model = "gemini-3-flash-preview";
  
  const historyContext = history.map(h => `- ${h.analysis.jobTitle} at ${h.analysis.company}`).join('\n');
  const resumeText = resume.text || "No resume text provided.";

  const prompt = `
    ## MISSION
    You are an Expert PM Career Strategist. Generate a high-authority "Industry PM Master" LinkedIn profile strategy. 

    ## CONTEXT
    Target: ${currentJob}
    Session History: ${historyContext}
    Resume Data: ${resumeText}

    ## REQUIREMENTS
    1. headline: Hybrid PM headline (Max 220 chars). Use Agile/Waterfall keywords.
    2. about: powerful First-Person PM Summary. Focus on high-signal leadership and project lifecycle impact.
    3. banner: LinkedIn background image recommendation for a PM professional.

    Return JSON.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      headline: { type: Type.STRING },
      about: { type: Type.STRING },
      banner: { type: Type.STRING }
    },
    required: ["headline", "about", "banner"]
  };

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", responseSchema: schema }
  });

  return JSON.parse(response.text || "{}");
};

export const generateInterviewStrategies = async (resume: ResumeInput, jobDesc: string): Promise<InterviewQuestion[]> => {
  const ai = getAi();
  const model = "gemini-3-pro-preview";
  const resumeParts = [];
  if (resume.file) resumeParts.push({ inlineData: resume.file });
  else if (resume.text) resumeParts.push({ text: `Resume: ${resume.text}` });

  const interviewSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        starAnswer: {
          type: Type.OBJECT,
          properties: {
            situation: { type: Type.STRING },
            task: { type: Type.STRING },
            action: { type: Type.STRING },
            result: { type: Type.STRING }
          },
          required: ["situation", "task", "action", "result"]
        }
      },
      required: ["question", "starAnswer"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: `You are an Expert PM Interviewer. Generate 10 PM interview questions (Behavioral and Case-based) ground in methodologies for this context: ${jobDesc || "General PM roles"}` }, ...resumeParts] }],
      config: { responseMimeType: "application/json", responseSchema: interviewSchema }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const generateRejectionBridge = async (resume: ResumeInput, jobTitle: string, companyName: string): Promise<string> => {
  const ai = getAi();
  const resumeParts = [];
  if (resume.file) resumeParts.push({ inlineData: resume.file });
  else if (resume.text) resumeParts.push({ text: `Resume Content: ${resume.text}` });

  const prompt = `As an Expert PM Career Strategist, draft a gracious PM-focused response to a rejection notice for ${jobTitle} at ${companyName}. Mention ongoing growth in project leadership. Signature from resume.`;

  const response = await ai.models.generateContent({ 
    model: "gemini-3-flash-preview", 
    contents: [{ parts: [{ text: prompt }, ...resumeParts] }] 
  });
  return response.text || "";
};

export const generateThankYouBridge = async (resume: ResumeInput, jobTitle: string, companyName: string): Promise<string> => {
  const ai = getAi();
  const resumeParts = [];
  if (resume.file) resumeParts.push({ inlineData: resume.file });
  else if (resume.text) resumeParts.push({ text: `Resume Content: ${resume.text}` });

  const prompt = `As an Expert PM Career Strategist, draft a post-interview thank you email for ${jobTitle} at ${companyName}. Reiterate value in project lifecycle management. Signature from resume.`;

  const response = await ai.models.generateContent({ 
    model: "gemini-3-flash-preview", 
    contents: [{ parts: [{ text: prompt }, ...resumeParts] }] 
  });
  return response.text || "";
};

export const generateDocuments = async (resume: ResumeInput, jobDesc: string): Promise<GeneratedDocs> => {
  const ai = getAi();
  const model = "gemini-3-flash-preview";
  const resumeParts: any[] = [];
  if (resume.file) resumeParts.push({ inlineData: resume.file });
  else if (resume.text) resumeParts.push({ text: `Source Resume Content: ${resume.text}` });
  const prompt = `## MISSION
  You are an Expert PM Career Strategist specializing in High-Signal Resume Architecture.
  Restructure the user's resume and cover letter using the **RESTRUCTURE RESUME HIERARCHY** protocol.
  
  ## 1. RESTRUCTURE RESUME HIERARCHY (STRICT)
  
  ### THE 'NO-BULLET' ZONES (PLAIN TEXT ONLY):
  - **Header**: Name, Contact Info, and LinkedIn URL must be plain text, centered or left-aligned. No bullets.
  - **Professional Summary**: A single paragraph of 3-4 sentences. No bullets.
  - **Section Headers**: (e.g., EXPERIENCE, EDUCATION) must be Bold, All-Caps, and plain text.
  - **Job Titles & Company Names**: Must be plain text. Use Bold for Job Title (**Job Title**) and Italics for Company/Dates (*Company Name | Dates*).
  - **Skills & Education**: List these as comma-separated strings or simple line-breaks. Remove all bullet icons.
  
  ### THE 'BULLET-ONLY' ZONE:
  - **Professional Achievements**: Use standard round bullets (•) ONLY for the specific achievement lines under each Job Title.
  - **Constraint**: Max 5 bullets per role. Every bullet must start with a Result-Oriented Action Verb.
  
  ### GLOBAL STYLE RULES:
  - **Alignment**: Strict Left-Justification for all body text.
  - **Spacing**: Double-space between Section Headers; single-space within sections.
  - **Output Mode**: Pure text/markdown. Remove any conversational AI filler (e.g., 'Here is your resume'). Start immediately with the Name.
  
  ## 2. THE BUSINESS-STANDARD COVER LETTER (STRICT)
  - **Format**: Standard Block Business Style (all text left-justified, single-spaced, double-spaced between paragraphs).
  - **Header**: Include the Date, Sender's Address, and Recipient's Address (if available).
  - **Structure**:
    * **The Hook**: 3 sentences connecting the PM's specific niche to the company's "Pain Point."
    * **The Proof**: 1 paragraph highlighting the "Top Match" skill from the FitScore analysis.
    * **The Close**: A direct call to action for an interview.
  
  ## 3. TECHNICAL GUARDRAIL
  - Output the result in Clean Markdown or Plain Text. 
  - Do NOT use HTML tags or "Creative" AI formatting that breaks the 8.5" x 11" print margin.
  - Use standard markdown bolding (\*\*text\*\*) and italics (\*text\*) for emphasis.

  Return JSON.`;


  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }, ...resumeParts] }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: generatedDocsSchema
      }
    });

    return JSON.parse(response.text || "{}") as GeneratedDocs;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const generatedDocsSchema = {
  type: Type.OBJECT,
  properties: {
    coverLetter: { type: Type.STRING },
    starBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
    fullOptimizedResume: { type: Type.STRING }
  },
  required: ["coverLetter", "starBullets", "fullOptimizedResume"]
};

export const generateResumeFromBuilder = async (data: BuilderData): Promise<string> => {
  const ai = getAi();
  const prompt = `## MISSION
  You are an Expert PM Career Strategist. Generate a high-fidelity, ATS-optimized resume based on the provided structured data using the **RESTRUCTURE RESUME HIERARCHY** protocol.

  ## 1. RESTRUCTURE RESUME HIERARCHY (STRICT)
  
  ### THE 'NO-BULLET' ZONES (PLAIN TEXT ONLY):
  - **Header**: Name, Contact Info, and LinkedIn URL must be plain text, centered or left-aligned. No bullets.
  - **Professional Summary**: A single paragraph of 3-4 sentences. No bullets.
  - **Section Headers**: (e.g., EXPERIENCE, EDUCATION) must be Bold, All-Caps, and plain text.
  - **Job Titles & Company Names**: Must be plain text. Use Bold for Job Title (**Job Title**) and Italics for Company/Dates (*Company Name | Dates*).
  - **Skills & Education**: List these as comma-separated strings or simple line-breaks. Remove all bullet icons.
  
  ### THE 'BULLET-ONLY' ZONE:
  - **Professional Achievements**: Use standard round bullets (•) ONLY for the specific achievement lines under each Job Title.
  - **Constraint**: Max 5 bullets per role. Every bullet must start with a Result-Oriented Action Verb.
  
  ### GLOBAL STYLE RULES:
  - **Alignment**: Strict Left-Justification for all body text.
  - **Spacing**: Double-space between Section Headers; single-space within sections.
  - **Output Mode**: Pure text/markdown. Remove any conversational AI filler (e.g., 'Here is your resume'). Start immediately with the Name.

  ## 2. TECHNICAL GUARDRAIL
  - Output the result in Clean Markdown or Plain Text.
  - Do NOT use HTML tags or "Creative" AI formatting that breaks the 8.5" x 11" print margin.
  - Use standard markdown bolding (\*\*text\*\*) and italics (\*text\*) for emphasis.

  ## DATA
  ${JSON.stringify(data, null, 2)}`;

  const response = await ai.models.generateContent({ 
    model: "gemini-3-flash-preview", 
    contents: [{ parts: [{ text: prompt }] }] 
  });
  return response.text || "";
};
