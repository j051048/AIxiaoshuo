export enum CreatorStep {
  Configuration = 1,
  CoreSetting = 2,
  ArchitectureAnalysis = 3,
  OutlinePerfection = 4,
  CharacterDesign = 5,
  DetailedOutline = 6,
  VolumePlanning = 7,
  ChapterWriting = 8,
  ReviewAndPolish = 9
}

export type Language = 'en' | 'zh';

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  step?: CreatorStep;
}

export interface NovelSettings {
  targetAudience: string;
  totalWordCount: string;
  chapterWordCount: string;
}

export const STEP_DESCRIPTIONS: Record<CreatorStep, string> = {
  [CreatorStep.Configuration]: "Configuration & Mode",
  [CreatorStep.CoreSetting]: "Core Settings",
  [CreatorStep.ArchitectureAnalysis]: "Architecture Analysis",
  [CreatorStep.OutlinePerfection]: "Outline Perfection",
  [CreatorStep.CharacterDesign]: "Character Design",
  [CreatorStep.DetailedOutline]: "Detailed Expansion",
  [CreatorStep.VolumePlanning]: "Volume Planning",
  [CreatorStep.ChapterWriting]: "Chapter Writing",
  [CreatorStep.ReviewAndPolish]: "Review & Polish",
};

export const STEP_DETAILS: Record<CreatorStep, string> = {
  [CreatorStep.Configuration]: "Verify AI Config & DeepThinking Mode",
  [CreatorStep.CoreSetting]: "Genre, Target Audience, Core Conflict",
  [CreatorStep.ArchitectureAnalysis]: "Selling Points, Logic, Protagonist Goals",
  [CreatorStep.OutlinePerfection]: "Logic Check, Consistency, Plot Holes",
  [CreatorStep.CharacterDesign]: "6-8 Characters (Bio, Motivation, Flaws)",
  [CreatorStep.DetailedOutline]: "500k Word Structure, Pacing",
  [CreatorStep.VolumePlanning]: "Vol 1 Goals, Titles, Plot Drivers",
  [CreatorStep.ChapterWriting]: "Drafting (approx. 2300 words/chapter)",
  [CreatorStep.ReviewAndPolish]: "Quality Assurance & Editing",
};