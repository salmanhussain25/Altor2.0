

import React from 'react';

export enum TutorState {
  IDLE, // Waiting to start (or for name input)
  SELECTING_SKILL, // On the skill selection screen (after name is entered)
  LOADING_LESSON, // AI is fetching lesson content
  EXPLAINING, // AI is explaining a concept (and speaking)
  AWAITING_TASK, // AI has given a task and is waiting for submission
  AWAITING_CHOICE, // AI has asked a multiple choice question
  AWAITING_CONTINUE, // Waiting for user to click "Continue" after an explanation or correct answer
  EVALUATING, // AI is evaluating the user's code
  CHATTING, // AI is processing a chat message
  CLARIFYING_DOUBT, // AI has answered a question and is waiting for the user to continue
  CORRECT, // User's solution was correct (used to show "Next Lesson")
  INCORRECT, // User's solution was incorrect
  COURSE_COMPLETED, // User has finished all topics in a skill
  ERROR, // An error occurred
}

export type AppMode = 'SELECTION' | 'TUTOR' | 'DOUBT_SOLVER' | 'INTERVIEW_PREP';

export interface SpeechSegment {
  text: string;
  lang: 'en' | 'hi';
}

// --- Gamification Types ---
export interface Badge {
  id: string; // e.g., 'badge-python-for-beginners'
  courseName: string;
  title: string; // e.g., "Python Novice", "JavaScript Adept"
  dateAwarded: string; // ISO String
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  points: number;
}

export interface Skill {
  id:string;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  topics: Topic[];
}

export interface ActivityLogEntry {
  date: string; // YYYY-MM-DD
  points: number;
}

export interface UserProfile {
    id: string;
    name: string;
    password: string; // For PIN verification
    points: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null; // YYYY-MM-DD
    activityLog: ActivityLogEntry[];
    badges: Badge[];
    skills: Skill[];
}
// --- End Gamification Types ---

export interface VisualAid {
  title: string;
  type: 'mermaid';
  content: string;
}

export interface Hint {
    conceptual: string;
    direct: string;
    solution: string;
}

// --- New Micro-Lesson Structure ---
export type StepType = 'EXPLANATION' | 'MULTIPLE_CHOICE' | 'CODE_TASK';

export interface StepExplanation {
    type: 'EXPLANATION';
    content: string;
    visualAid?: VisualAid;
}

export interface StepMultipleChoice {
    type: 'MULTIPLE_CHOICE';
    question: string;
    choices: string[];
    correctChoiceIndex: number;
    feedback: string; // Feedback to give when the correct answer is chosen
}

export interface StepCodeTask {
    type: 'CODE_TASK';
    mission: string;
    startingCode: string;
    visualAid?: VisualAid;
}

export type LessonStep = StepExplanation | StepMultipleChoice | StepCodeTask;

export interface Lesson {
  topicTitle: string;
  steps: LessonStep[];
}
// --- End of Micro-Lesson Structure ---

// --- Interview Prep Types ---
export type InterviewRoundType = 'INTRODUCTION' | 'BEHAVIOURAL' | 'CODING_CHALLENGE' | 'SYSTEM_DESIGN' | 'RESUME_DEEP_DIVE' | 'HR_WRAPUP';
export type ExperienceLevel = 'FRESHER' | 'EXPERIENCED';
export type InterviewerGender = 'male' | 'female';

export interface InterviewRound {
    type: InterviewRoundType;
    title: string;
    completed: boolean;
    estimatedMinutes: number;
    interviewerName: string;
    interviewerGender: InterviewerGender;
}

export interface InterviewSession {
    cvFile?: File;
    cvText?: string;
    company: string;
    role: string;
    experienceLevel: ExperienceLevel;
    rounds: InterviewRound[];
    currentRoundIndex: number;
}
// --- End Interview Prep Types ---

export interface ProblemSolution {
  problemExplanation: string;
  solutionExplanation: string;
  solutionCode: string;
  language: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  code?: string;
  visualAid?: VisualAid;
  choices?: string[]; // For displaying MCQ choices in the history
  correctChoiceIndex?: number;
  userChoiceIndex?: number;
  isSystem?: boolean; // To hide system-level messages from the UI
}

export interface CourseOutline {
    skillName: string;
    topics: {
        title: string;
        description: string;
        points: number;
    }[];
}