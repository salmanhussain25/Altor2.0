

import { GoogleGenAI, Type } from "@google/genai";
import { Lesson, ChatMessage, ProblemSolution, CourseOutline, VisualAid, AppMode, LessonStep, Hint, StepMultipleChoice, Topic, InterviewSession, InterviewRound, InterviewRoundType, ExperienceLevel } from '../types';
import { debug } from "../utils/debug";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const handleApiError = (error: unknown, context: string, defaultMessage: string): Error => {
    debug("ERROR", `Gemini API Error in ${context}:`, { error });
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
        return new Error("You've reached the daily API quota for this model. Please try again tomorrow.");
    }
    return new Error(defaultMessage);
};

// Helper function to convert a File object to a Gemini-compatible Part.
async function fileToGenerativePart(file: File) {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type
    }
  };
}


const MERMAID_GUIDE = `---
**CRITICAL MERMAID.JS DIAGRAM GUIDE: FOLLOW THESE RULES EXACTLY. FAILURE TO ADHERE WILL RESULT IN AN ERROR.**

1.  **SYNTAX FIRST:** Your primary goal is to generate **100% syntactically correct** Mermaid.js code.
2.  **NO TITLES IN CODE:** The Mermaid code itself **MUST NOT** contain a title directive (e.g., \`title: My Diagram\`). The diagram's title is handled by the JSON \`title\` property, not the code.
3.  **LABEL ALL NODES (NO EMPTY SHAPES):** Every node **MUST** have a descriptive text label. This prevents rendering blank boxes.
    - **Correct:** \`A["Node A Text"] --> B["Node B Text"]\`
    - **Incorrect (Causes blank shapes):** \`A --> B\`
4.  **ALWAYS USE QUOTES FOR LABELS:** Node labels **MUST** be enclosed in double quotes (e.g., \`A["My Text"]\`). This is the safest way to handle all text, including spaces and special characters.
5.  **SIMPLE ALPHANUMERIC NODE IDs:** The identifier for a node must be a simple alphanumeric string (e.g., \`node1\`, \`A\`, \`rootNode\`).
    - **Correct:** \`node1["Root"]\`
    - **Incorrect:** \`"node 1"["Root"]\` or \`[node 1]["Root"]\`
6.  **USE <br/> FOR NEWLINES:** To add a line break inside a label, use the HTML tag \`<br/>\`.
7.  **NO MARKDOWN FENCES:** The \`content\` string **MUST** be pure Mermaid syntax. It must not include markdown fences like \`\`\`mermaid or \`\`\`.
8.  **STICK TO BASICS:** Prefer simple \`graph TD;\` or \`flowchart TD;\`. Do not use experimental or complex syntax unless absolutely necessary.

**GOLDEN EXAMPLE (Segment Tree):**
\`graph TD;
    n0["Range [0-7]<br/>Sum: 42"] --> n1["Range [0-3]<br/>Sum: 10"];
    n0 --> n2["Range [4-7]<br/>Sum: 32"];
    n1 --> n3["Range [0-1]<br/>Sum: 3"];
    n1 --> n4["Range [2-3]<br/>Sum: 7"];
    n3 --> n5["Idx [0]<br/>Val: 1"];
    n3 --> n6["Idx [1]<br/>Val: 2"];
\`
---
`;


const visualAidSchema = {
    type: Type.OBJECT,
    description: "A visual aid to explain a concept. Required for any visualizable topic.",
    properties: {
        title: { type: Type.STRING, description: 'A clear, descriptive title for the diagram.' },
        type: { type: Type.STRING, enum: ['mermaid'] },
        content: { type: Type.STRING, description: 'The 100% syntactically correct Mermaid.js code for the diagram, following all rules.' }
    },
    required: ['title', 'type', 'content']
};


const explanationStepSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['EXPLANATION'] },
        content: { type: Type.STRING, description: "A concise, beginner-friendly explanation in Hinglish. Keep it under 50 words." },
        visualAid: { ...visualAidSchema, description: "Optional. A Mermaid diagram, if helpful for this explanation." }
    },
    required: ['type', 'content']
};

const multipleChoiceStepSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['MULTIPLE_CHOICE'] },
        question: { type: Type.STRING, description: "A clear, multiple-choice question in Hinglish to check understanding." },
        choices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 3-4 potential answers in English." },
        correctChoiceIndex: { type: Type.INTEGER, description: "The 0-based index of the correct answer in the 'choices' array." },
        feedback: { type: Type.STRING, description: "Positive reinforcement in Hinglish to show after they choose correctly. E.g., 'Bilkul Sahi!' or 'Great job!'."}
    },
    required: ['type', 'question', 'choices', 'correctChoiceIndex', 'feedback']
};

const codeTaskStepSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['CODE_TASK'] },
        mission: { type: Type.STRING, description: "A practical, problem-based task for the user in English." },
        startingCode: { type: Type.STRING, description: "Simple starting code. The user MUST modify or build upon this. Include Hinglish comments." },
        visualAid: { ...visualAidSchema, description: "Optional. A Mermaid diagram, if helpful for this task." }
    },
    required: ['type', 'mission', 'startingCode']
};

const lessonSchema = {
    type: Type.OBJECT,
    properties: {
        topicTitle: { type: Type.STRING, description: "The title of the topic this lesson is for." },
        steps: {
            type: Type.ARRAY,
            description: "An array of 3-5 sequential, varied lesson steps.",
            items: {
                oneOf: [explanationStepSchema, multipleChoiceStepSchema, codeTaskStepSchema]
            }
        }
    },
    required: ["topicTitle", "steps"],
};


const hintSchema = {
    type: Type.OBJECT,
    description: "A set of tiered hints to help the user if their code is incorrect.",
    properties: {
        conceptual: { type: Type.STRING, description: "A high-level conceptual hint in Hinglish (e.g., 'Yaad hai loops kaise kaam karte hain?')." },
        direct: { type: Type.STRING, description: "A more direct, code-focused hint in Hinglish (e.g., 'Line 5 pe variable ka naam check karo.')." },
        solution: { type: Type.STRING, description: "The complete, correct code solution." }
    },
    required: ['conceptual', 'direct', 'solution']
};

const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
        isCorrect: {
            type: Type.BOOLEAN,
            description: "Whether the user's code correctly solves the task."
        },
        feedback: {
            type: Type.STRING,
            description: "Brief, encouraging feedback in Hindi (Latin script). If correct, be enthusiastic. If incorrect, be gentle and acknowledge their attempt. Keep it under 30 words."
        },
        hint: {
            ...hintSchema,
            description: "MUST be provided if isCorrect is false. Omit if isCorrect is true."
        }
    },
    required: ["isCorrect", "feedback"],
};

const courseOutlineSchema = {
    type: Type.OBJECT,
    properties: {
        skillName: {
            type: Type.STRING,
            description: "A formal name for the skill or course, based on the user's request. E.g., 'Python for Beginners'."
        },
        topics: {
            type: Type.ARRAY,
            description: "A logically ordered array of topic objects for a beginner-to-intermediate course.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the topic." },
                    description: { type: Type.STRING, description: "A concise, one-sentence description of what this topic covers." },
                    points: { type: Type.INTEGER, description: "Points awarded for completing this topic. Standard value is 100."}
                },
                required: ["title", "description", "points"]
            }
        }
    },
    required: ["skillName", "topics"],
};


const chatResponseSchema = {
    type: Type.OBJECT,
    properties: {
        responseText: {
            type: Type.STRING,
            description: "A helpful response to the user's question in a friendly, conversational tone in Hindi (Latin script). Keep it concise."
        },
        updatedCode: {
            type: Type.STRING,
            description: "Optional: If helpful, provide a new or modified code snippet to display on the whiteboard. Must be a complete, executable snippet with Hindi comments."
        },
        visualAid: {
            ...visualAidSchema,
            description: "Optional: If a diagram would help clarify the user's question, provide one here, following the guide strictly. This is critical for visual concepts."
        }
    },
    required: ["responseText"]
};

const problemSolutionSchema = {
    type: Type.OBJECT,
    properties: {
        problemExplanation: {
            type: Type.STRING,
            description: "First, briefly explain the user's problem statement in simple, easy-to-understand Hindi (using Latin script). Keep this explanation under 40 words. Start with 'Chaliye, is problem ko samajhte hain.'."
        },
        solutionExplanation: {
            type: Type.STRING,
            description: "Next, provide a step-by-step explanation of the logic for the solution, also in conversational Hindi (Latin script). Structure the explanation. Keep it under 80 words."
        },
        solutionCode: {
            type: Type.STRING,
            description: "Provide the complete, correct solution code in the detected programming language. Add comments in Hindi (Latin script)."
        },
        language: {
            type: Type.STRING,
            description: "The name of the programming language used in the solution code (e.g., 'Python')."
        }
    },
    required: ["problemExplanation", "solutionExplanation", "solutionCode", "language"],
};

const badgeTitleSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A short, catchy, skill-level-appropriate title for the badge (e.g., 'Python Pro')." }
    },
    required: ["title"]
};

// --- Interview Schemas ---

const interviewPlanSchema = {
    type: Type.OBJECT,
    properties: {
        rounds: {
            type: Type.ARRAY,
            description: "A logically ordered array of 4-5 interview rounds. Each round MUST have a unique interviewer.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['INTRODUCTION', 'BEHAVIOURAL', 'CODING_CHALLENGE', 'SYSTEM_DESIGN', 'RESUME_DEEP_DIVE', 'HR_WRAPUP'] },
                    title: { type: Type.STRING, description: "A clear title for the round. E.g., 'Behavioral Questions', 'Coding: Algorithms'." },
                    completed: { type: Type.BOOLEAN, description: "Set to false initially." },
                    estimatedMinutes: { type: Type.INTEGER, description: "Estimated time in minutes for this round." },
                    interviewerName: { type: Type.STRING, description: "The full name of the interviewer for this round. You MUST pick a unique name from the provided lists for each round." },
                    interviewerGender: { type: Type.STRING, enum: ['male', 'female'], description: "The gender associated with the chosen name." }
                },
                required: ["type", "title", "completed", "estimatedMinutes", "interviewerName", "interviewerGender"]
            }
        },
        openingStatement: {
            type: Type.STRING,
            description: "A friendly, professional opening statement to start the interview. This is spoken by the first interviewer. Greet the candidate, state your name, and briefly state the interview's purpose and first round."
        }
    },
    required: ["rounds", "openingStatement"]
};


const interviewFollowUpSchema = {
    type: Type.OBJECT,
    properties: {
        responseText: {
            type: Type.STRING,
            description: "Your response as an interviewer. Ask a follow-up question, provide a new coding challenge, give feedback, or transition to the next topic. Must be in professional English."
        },
        updatedCode: {
            type: Type.STRING,
            description: "Optional: If the round is CODING_CHALLENGE or SYSTEM_DESIGN, provide starting code or update the candidate's code with corrections/suggestions."
        },
        visualAid: {
            ...visualAidSchema,
            description: "Optional: Provide a Mermaid.js diagram for SYSTEM_DESIGN rounds."
        },
        isRoundFinished: {
            type: Type.BOOLEAN,
            description: "Set to true if you have concluded the current round and are ready to move on. Otherwise, set to false."
        }
    },
    required: ["responseText", "isRoundFinished"]
};

// --- End Interview Schemas ---


export async function generateInterviewPlan(
    cvFile: File | undefined, 
    cvText: string | undefined, 
    company: string | undefined, 
    role: string | undefined,
    experienceLevel: ExperienceLevel,
    maleNames: string[],
    femaleNames: string[]
): Promise<{ rounds: InterviewRound[], openingStatement: string }> {
    const systemInstruction = `You are a world-class hiring manager. You are preparing to interview a candidate.
- **Goal**: Create a realistic, structured interview plan with a diverse panel of interviewers.
- **CV Analysis**: Analyze the provided CV content (from text or file) to understand the candidate's skills and experience.
- **Role/Company Context**: Tailor the interview rounds and their titles for the role of "${role || 'a software engineer'}" at "${company || 'a leading tech company'}".
- **Experience Level**: The candidate is a/an "${experienceLevel}" candidate. Tailor the questions accordingly. For FRESHERs, focus on fundamentals, projects, and potential. For EXPERIENCED candidates, ask about past projects, impact, leadership, and advanced technical/design challenges.
- **Interview Panel**: You MUST assign a different interviewer to each round. Pick names from the provided lists. Ensure a mix of genders.
- **Structure**: Design a 4-5 round interview flow. A typical flow is: Introduction, Resume Deep-Dive, Behavioral, Coding Challenge, and HR Wrap-up. If the role is senior or the candidate is experienced, include a System Design round.
- **Opening Statement**: The first interviewer MUST introduce themselves by name in the \`openingStatement\`.
- **Output**: Your response MUST be a single JSON object matching the required schema.`;

    const parts = [];
    let prompt = `Please generate an interview plan for the role of "${role}" at "${company}" for a ${experienceLevel} candidate.
Available male interviewer names: ${maleNames.join(', ')}.
Available female interviewer names: ${femaleNames.join(', ')}.
Assign a unique interviewer to each round.`;
    
    if (cvFile) {
        prompt += " The candidate's CV is attached.";
        parts.push({ text: prompt });
        parts.push(await fileToGenerativePart(cvFile));
    } else if (cvText) {
        prompt += ` Here is the candidate's CV text: \n\n${cvText}`;
        parts.push({ text: prompt });
    } else {
        parts.push({ text: prompt });
    }

    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: interviewPlanSchema,
        }
    };

    debug('API_REQUEST', 'generateInterviewPlan', { payload: requestPayload });

    try {
        const response = await ai.models.generateContent(requestPayload);
        const jsonText = response.text.trim();
        debug('API_RESPONSE', 'generateInterviewPlan raw response', { jsonText });
        const plan = JSON.parse(jsonText);
        if (!plan.rounds || !plan.openingStatement) {
            throw new Error("Invalid interview plan format from AI.");
        }
        debug('API_RESPONSE', 'generateInterviewPlan parsed response', { plan });
        return plan;
    } catch (error) {
        throw handleApiError(error, "generateInterviewPlan", "I had trouble preparing the interview plan. Please check the inputs and try again.");
    }
}


export async function generateInterviewFollowUp(
    session: InterviewSession,
    history: ChatMessage[],
    userCode: string,
    userResponse: string
): Promise<{ responseText: string; updatedCode?: string; visualAid?: VisualAid, isRoundFinished: boolean }> {
    const currentRound = session.rounds[session.currentRoundIndex];
    const systemInstruction = `${MERMAID_GUIDE}
You are ${currentRound.interviewerName}, a professional interviewer for "${session.company}" conducting an interview for the "${session.role}" position. You must stay in character as ${currentRound.interviewerName}.

**CONTEXT:**
- **Candidate CV**: ${session.cvText || '(Not provided)'}
- **Candidate Level**: ${session.experienceLevel}
- **Current Round**: ${currentRound.title} (${currentRound.type})
- **Conversation History**:
${history.map(m => `${m.sender}: ${m.text}`).join('\n')}
- **Candidate's Whiteboard Code**:
\`\`\`
${userCode}
\`\`\`

**YOUR TASK:**
Based on the candidate's latest response ("${userResponse}"), continue the interview.
1.  **Introduction**: If the user's last message was a system message like "Okay, I'm ready for the next round", it means this is YOUR first time speaking. You MUST introduce yourself (e.g., "Hello, my name is ${currentRound.interviewerName}...") before asking your first question for this round.
2.  **Stay on Topic**: Your questions and feedback must be relevant to the current round (\`${currentRound.type}\`) and the candidate's experience level.
3.  **Ask Follow-ups**: Dig deeper. If the candidate gives a high-level answer, ask for specifics. If they solve a problem, ask about time/space complexity or alternative approaches.
4.  **Give Coding/Design Tasks**: For 'CODING_CHALLENGE' or 'SYSTEM_DESIGN' rounds, provide a clear problem statement. The candidate will write code on the whiteboard.
5.  **Evaluate**: Provide constructive feedback. Be professional, not overly friendly or harsh.
6.  **Control the Flow**: Decide if the current line of questioning is complete. If so, set \`isRoundFinished: true\` to signal moving to the next round. Otherwise, set it to \`false\`.
7.  **Use Tools**: Use \`updatedCode\` to provide starter code or corrections. Use \`visualAid\` for system design diagrams.
8.  **JSON Output**: Your entire response MUST be a single JSON object matching the schema.`;

    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: `The candidate responded: "${userResponse}". Continue the interview.`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: interviewFollowUpSchema,
        }
    };
    
    debug('API_REQUEST', 'generateInterviewFollowUp', { payload: requestPayload });

    try {
        const response = await ai.models.generateContent(requestPayload);
        const jsonText = response.text.trim();
        debug('API_RESPONSE', 'generateInterviewFollowUp raw response', { jsonText });
        const followUp = JSON.parse(jsonText);
        
        if (!followUp.responseText || typeof followUp.isRoundFinished !== 'boolean') {
            throw new Error("Invalid interview follow-up format from AI.");
        }
        debug('API_RESPONSE', 'generateInterviewFollowUp parsed response', { followUp });
        return followUp;
    } catch (error) {
        throw handleApiError(error, "generateInterviewFollowUp", "Sorry, I'm having a moment of network latency. Could you please repeat that?");
    }
}


export async function generateProblemSolution(problem: string, file?: File): Promise<ProblemSolution> {
    const systemInstruction = `You are an expert AI programming doubt-solving tutor. The user has provided a programming problem via text or an image. Your task is to analyze it and provide a comprehensive solution in Hindi (Latin script) and code.
- **Analyze**: Read the problem carefully from the provided text or image.
- **Explain**: First, explain the problem itself. Then, explain the logic of your solution step-by-step. Make your explanations conversational.
- **Code**: Provide the full, correct solution code. Comment the code in Hindi (Latin script).
- **Format**: Your response MUST be in the specified JSON format.`;
    
    const parts = [];
    if (file) {
        parts.push({ text: "Please analyze the programming problem in the attached file and provide a comprehensive solution." });
        const filePart = await fileToGenerativePart(file);
        parts.push(filePart);
    } else {
        parts.push({ text: `Here is the programming problem: ${problem}` });
    }
    
    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: problemSolutionSchema,
        }
    };

    debug('API_REQUEST', 'generateProblemSolution', { payload: requestPayload });

    try {
        const response = await ai.models.generateContent(requestPayload);
        const jsonText = response.text.trim();
        debug('API_RESPONSE', 'generateProblemSolution raw response', { jsonText });
        const solution = JSON.parse(jsonText);
        if (!solution.problemExplanation || !solution.solutionExplanation || !solution.solutionCode || !solution.language) {
            throw new Error("Invalid solution format from AI.");
        }
        debug('API_RESPONSE', 'generateProblemSolution parsed response', { solution });
        return solution;
    } catch (error) {
        throw handleApiError(error, "generateProblemSolution", "I had trouble solving that problem. Please try rephrasing it or checking the uploaded file.");
    }
}


export async function generateCourseOutline(prompt: string, numTopics: number): Promise<CourseOutline> {
    const systemInstruction = `You are an expert curriculum designer. A user wants to learn a new skill. Based on their request, generate a concise, beginner-friendly curriculum outline. 
Create a list of about ${numTopics} essential topic objects. Each object should have a 'title', 'description', and 'points'.
Your response MUST be in the specified JSON format and adhere to the schema.`;
    
    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: `Generate a curriculum for: ${prompt}`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: courseOutlineSchema,
        }
    };
    
    debug('API_REQUEST', 'generateCourseOutline', { payload: requestPayload });
    
    try {
        const response = await ai.models.generateContent(requestPayload);
        const jsonText = response.text.trim();
        debug('API_RESPONSE', 'generateCourseOutline raw response', { jsonText });
        const curriculum = JSON.parse(jsonText);
        if (!curriculum.skillName || !Array.isArray(curriculum.topics)) {
            throw new Error("Invalid curriculum format from AI.");
        }
        debug('API_RESPONSE', 'generateCourseOutline parsed response', { curriculum });
        return curriculum;
    } catch (error) {
        throw handleApiError(error, "generateCourseOutline", "I had trouble designing that course. Please try a different topic.");
    }
}


export async function generateLessonContent(skillName: string, topicTitle: string): Promise<Lesson> {
    const systemInstruction = `${MERMAID_GUIDE}
You are an expert AI programming tutor for ${skillName}. Your goal is to teach the topic "${topicTitle}" to an absolute beginner by creating a short, interactive micro-lesson.

**INSTRUCTIONS:**
1.  **Create 3-5 Steps:** Generate a JSON object with a \`steps\` array containing 3 to 5 lesson steps.
2.  **Vary Step Types:** The steps **must** be a mix of \`EXPLANATION\`, \`MULTIPLE_CHOICE\`, and \`CODE_TASK\`. A good lesson starts with an explanation, checks understanding with a multiple-choice question, and then gives a practical code task.
3.  **Hinglish & English:** All text for the user (\`content\`, \`question\`, \`feedback\`) must be in conversational Hindi (written in Latin script). Code-related text (\`mission\`, \`choices\`, \`startingCode\`) must be in English.
4.  **Visual Aids (CRITICAL):** You MUST create a \`visualAid\` for any concept that can be visualized (e.g., data structures, loops, algorithms). Follow the Mermaid guide strictly.
5.  **Final Code Task:** The lesson should usually end with a \`CODE_TASK\`.
6.  **Format**: Your entire response MUST be a single, valid JSON object that adheres to the provided schema.`;
    
    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: `Generate a micro-lesson for the topic: ${topicTitle}`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: lessonSchema,
        }
    };

    debug('API_REQUEST', 'generateLessonContent', { payload: requestPayload });

    try {
        const response = await ai.models.generateContent(requestPayload);

        const jsonText = response.text.trim();
        debug('API_RESPONSE', 'generateLessonContent raw response', { jsonText });
        const lesson: Lesson = JSON.parse(jsonText);
        
        if (!lesson.topicTitle || !Array.isArray(lesson.steps) || lesson.steps.length === 0) {
            throw new Error("Invalid lesson format from AI.");
        }

        // Validate and filter steps to ensure data integrity before sending to the app.
        const originalStepCount = lesson.steps.length;
        const validatedSteps = lesson.steps.filter(step => {
            if (step.type === 'MULTIPLE_CHOICE') {
                const mcqStep = step as StepMultipleChoice;
                const isIndexValid = mcqStep.correctChoiceIndex !== null && 
                                     mcqStep.correctChoiceIndex !== undefined &&
                                     typeof mcqStep.correctChoiceIndex === 'number' &&
                                     mcqStep.choices &&
                                     mcqStep.correctChoiceIndex < mcqStep.choices.length;

                if (!isIndexValid) {
                    debug('WARN', 'Filtering out malformed MCQ step:', { step });
                    return false;
                }
            }
            return true;
        });

        if (validatedSteps.length === 0 && originalStepCount > 0) {
            throw new Error("The AI returned a lesson where all steps were invalid. Please try generating it again.");
        }
        
        lesson.steps = validatedSteps;
        debug('API_RESPONSE', 'generateLessonContent parsed and validated response', { lesson });
        return lesson;

    } catch (error) {
        throw handleApiError(error, "generateLessonContent", "I had trouble preparing the next lesson. Please try again.");
    }
}


export async function evaluateCode(
    skillName: string, 
    task: string, 
    userCode: string,
    attemptNumber: number
): Promise<{ isCorrect: boolean; feedback: string; hint?: Hint }> {
    const systemInstruction = `You are an expert and friendly code evaluation assistant for ${skillName}. Your only job is to determine if the user's code works correctly.

**CRITICAL EVALUATION RULES:**
1.  **TEXT-MATCHING PRIORITY:** First, analyze the task. If it is a simple typing exercise or asks the user to type a specific phrase (like "Type the following phrase..."), your ONLY job is to check if the user's submission is an exact match to the required phrase. Ignore case and leading/trailing whitespace for this comparison. Do not evaluate it as code.
2.  **FUNCTION OVER FORM (FOR CODE):** If the task is a coding problem, the **only** thing that matters is if the code produces the correct output.
3.  **IGNORE STYLISTIC DIFFERENCES:** The user's solution is valid even if it uses different variable names, different loop types (e.g., \`for\` vs. \`while\`), or different logic than a "perfect" or "textbook" solution. There are many ways to solve a problem. Do NOT be strict.
4.  **REAL-TIME EVALUATION:** You must evaluate the code based on the task requirements in real-time. Do NOT compare it to a pre-defined or imagined "solution code".
5.  **BE ENCOURAGING:** Your feedback should be positive and build confidence. If the code is correct, celebrate it. If it's incorrect, be gentle.

**TASK DETAILS:**
- **Task**: "${task}".
- **User's Code**: \`\`\`${skillName.toLowerCase()}\n${userCode}\n\`\`\`
- **Attempt Number**: ${attemptNumber + 1}

**JSON OUTPUT RULES:**
- Provide feedback in Hindi (Latin script).
- If \`isCorrect\` is \`true\`, provide enthusiastic feedback. DO NOT include the \`hint\` object.
- If \`isCorrect\` is \`false\`, you MUST provide a full \`hint\` object with three tiers of help ('conceptual', 'direct', 'solution').
- Your entire response MUST be in the specified JSON format.`;
    
    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: `Evaluate the user's code for the task.`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: evaluationSchema,
        }
    };

    debug('API_REQUEST', 'evaluateCode', { payload: requestPayload });

    try {
        const response = await ai.models.generateContent(requestPayload);
        const jsonText = response.text.trim();
        debug('API_RESPONSE', 'evaluateCode raw response', { jsonText });
        const evaluation = JSON.parse(jsonText);

        if (typeof evaluation.isCorrect !== 'boolean' || typeof evaluation.feedback !== 'string') {
            throw new Error("Invalid evaluation format from AI.");
        }
        if (!evaluation.isCorrect && !evaluation.hint) {
             throw new Error("AI failed to provide a hint for the incorrect answer.");
        }
        debug('API_RESPONSE', 'evaluateCode parsed response', { evaluation });
        return evaluation;

    } catch (error) {
        throw handleApiError(error, "evaluateCode", "I had trouble evaluating your code. Please try again.");
    }
}

export async function generateChatResponse(
    skillName: string,
    lesson: Lesson | { task: string; code: string; },
    history: ChatMessage[],
    userQuery: string,
    userCode: string,
    appMode: AppMode,
    attachment?: File
): Promise<{ responseText: string; updatedCode?: string; visualAid?: VisualAid }> {
    
    const baseInstruction = `${MERMAID_GUIDE}
You are an expert AI programming tutor for ${skillName}. Your task is to provide a helpful, concise response to the user's query, following the rules for the current mode. Your entire response MUST be a single, valid JSON object.
`;
    let task, code;
    if ('steps' in lesson) {
        const codeTaskStep = lesson.steps.find(step => step.type === 'CODE_TASK');
        task = codeTaskStep?.type === 'CODE_TASK' ? codeTaskStep.mission : 'Discuss the current topic.';
        code = codeTaskStep?.type === 'CODE_TASK' ? codeTaskStep.startingCode : '';
    } else {
        task = lesson.task;
        code = lesson.code;
    }

    const tutorModeInstruction = `**MODE: TUTOR**
The user is working on the task: "${task}".
The original code example was: \`\`\`${code}\`\`\`
The user's current code is: \`\`\`${userCode}\`\`\`
The conversation history is: ${history.map(m => `${m.sender}: ${m.text}`).join('\n')}
The user just asked: "${userQuery}". ${attachment ? '(They have also provided an image for context.)' : ''}

**YOUR TASK:**
1.  **Answer:** Answer their question in conversational Hindi (Latin script).
2.  **Use Tools:** If helpful, provide corrected code in \`updatedCode\` or a diagram in \`visualAid\`.
3.  **Diagrams are MANDATORY for visual concepts.** Follow the Mermaid guide strictly.
`;

    const doubtSolverModeInstruction = `**MODE: DOUBT SOLVER**
The user's original problem was: "${task}"
You provided this initial solution code: \`\`\`${code}\`\`\`
The user's current code is: \`\`\`${userCode}\`\`\`
The user just asked: "${userQuery}". ${attachment ? '(They have also provided an image for context.)' : ''}

**YOUR TASK:**
1.  **Analyze Request:** Does the user want code, or an explanation?
2.  **If Code is Requested:**
    - Your JSON response **MUST** contain the full, runnable code in the \`updatedCode\` field.
    - Your \`responseText\` **MUST** be a short confirmation, e.g., "Zaroor, maine code whiteboard par update kar diya hai."
    - **DO NOT** explain the code in the \`responseText\`.
3.  **If Explanation is Requested:**
    - Provide a clear explanation in \`responseText\` (Hindi, Latin script).
    - **DO NOT** include the \`updatedCode\` field.
4.  **Diagrams are MANDATORY for visual concepts.** Follow the Mermaid guide strictly.
`;

    const systemInstruction = baseInstruction + (appMode === 'TUTOR' ? tutorModeInstruction : doubtSolverModeInstruction);
    
    const userQueryParts = [];
    if(userQuery) {
        userQueryParts.push({ text: userQuery });
    }
    if (attachment) {
        if (!userQuery) {
            userQueryParts.push({ text: "Please analyze this image." });
        }
        userQueryParts.push(await fileToGenerativePart(attachment));
    }

    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: { parts: userQueryParts },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: chatResponseSchema,
        }
    };
    
    debug('API_REQUEST', 'generateChatResponse', { payload: requestPayload });

    try {
        const response = await ai.models.generateContent(requestPayload);
        const jsonText = response.text.trim();
        debug('API_RESPONSE', 'generateChatResponse raw response', { jsonText });
        const chatResponse = JSON.parse(jsonText);
        
        if (!chatResponse.responseText) {
            throw new Error("Invalid chat response format from AI.");
        }
        debug('API_RESPONSE', 'generateChatResponse parsed response', { chatResponse });
        return chatResponse;
    } catch (error) {
        throw handleApiError(error, "generateChatResponse", "Sorry, I'm having trouble responding right now. Please try again.");
    }
}


export async function generateBadgeTitle(skillName: string, topics: Topic[]): Promise<string> {
    const systemInstruction = `You are a gamification expert designing catchy badge titles for an online learning platform.
- **Analyze**: Based on the skill name and the list of completed topics, determine the user's mastery level (e.g., Novice, Adept, Pro, Master, Legend).
- **Generate Title**: Create a single, short, and inspiring title for the badge.
- **Rules**:
  - The title should be 2-3 words max.
  - For basic topics, use titles like "Python Novice," "HTML Scripter," "CSS Stylist."
  - For intermediate topics, use titles like "JavaScript Adept," "React Developer," "Algorithm Analyst."
  - For advanced topics, use prestigious titles like "Python Pro," "TypeScript Architect," "JavaScript Legend," "Data King."
- **Format**: Your response MUST be in the specified JSON format, containing only the title.`;
    
    const topicList = topics.map(t => `- ${t.title}: ${t.description}`).join('\n');
    const prompt = `Generate a badge title for a user who completed the "${skillName}" course with the following topics:\n${topicList}`;
    
    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: badgeTitleSchema,
        }
    };

    debug('API_REQUEST', 'generateBadgeTitle', { payload: requestPayload });
    
    try {
        const response = await ai.models.generateContent(requestPayload);
        const jsonText = response.text.trim();
        debug('API_RESPONSE', 'generateBadgeTitle raw response', { jsonText });
        const result = JSON.parse(jsonText);
        if (result.title && typeof result.title === 'string') {
            debug('API_RESPONSE', 'generateBadgeTitle parsed response', { result });
            return result.title;
        }
        throw new Error("Invalid title format from AI.");
    } catch (error) {
        debug('ERROR', 'generateBadgeTitle failed, falling back to default', { error });
        return `${skillName.split(' ')[0]} Master`; 
    }
}