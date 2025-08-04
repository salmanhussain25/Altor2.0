

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TutorState, Skill, Lesson, Topic, ChatMessage, AppMode, ProblemSolution, CourseOutline, VisualAid, LessonStep, Hint, UserProfile, Badge, SpeechSegment, InterviewSession, InterviewRound, StepCodeTask, ExperienceLevel, InterviewerGender } from './types';
import { generateLessonContent, evaluateCode, generateCourseOutline, generateChatResponse, generateProblemSolution, generateBadgeTitle, generateInterviewPlan, generateInterviewFollowUp } from '@/services/geminiServices';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useLocalStorage } from './hooks/useLocalStorage';

import { TutorPanel } from './components/TutorPanel';
import { Whiteboard } from './components/Whiteboard';
import { SkillSelectionScreen } from './components/SkillSelectionScreen';
import { ProgressTracker } from './components/ProgressTracker';
import { Certificate } from './components/Certificate';
import { CourseCompletionScreen } from './components/CourseCompletionScreen';
import { TaskPanel } from './components/TaskPanel';
import { DoubtInputPanel } from './components/DoubtInputPanel';
import { DoubtHeader } from './components/DoubtHeader';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { AuthScreen } from './components/AuthScreen';
import { InterviewSetupScreen } from './components/InterviewSetupScreen';
import { InterviewRoundsTracker } from './components/InterviewRoundsTracker';
import { TransitionCurtain } from './components/TransitionCurtain';
import { debug } from './utils/debug';

const INDIAN_MALE_NAMES = ['Aarav', 'Vihaan', 'Aditya', 'Vivaan', 'Arjun', 'Reyansh', 'Shaurya', 'Rohan', 'Advik', 'Kabir', 'Ishaan', 'Sai', 'Dhruv', 'Aryan', 'Krish'];
const INDIAN_FEMALE_NAMES = ['Aanya', 'Diya', 'Saanvi', 'Myra', 'Anika', 'Aarohi', 'Isha', 'Pari', 'Riya', 'Kiara', 'Ananya', 'Tara', 'Navya', 'Zara', 'Siya'];


// Date helpers for streak calculation
const isYesterday = (dateString: string): boolean => {
    const date = new Date(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
};

const isToday = (dateString: string): boolean => {
    return new Date(dateString).toDateString() === new Date().toDateString();
}

export default function App(): React.ReactNode {
  const [users, setUsers] = useLocalStorage<UserProfile[]>('tutor-users', []);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>('tutor-currentUserId', null);
  
  const [appMode, setAppMode] = useState<AppMode>('SELECTION');
  const [tutorState, setTutorState] = useState<TutorState>(TutorState.IDLE);
  
  // Tutor Mode State
  const [currentSkillId, setCurrentSkillId] = useState<string | null>(null);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState<number>(0);
  const [currentHint, setCurrentHint] = useState<Hint | null>(null);
  
  // Doubt Solver Mode State
  const [problem, setProblem] = useState<string>('');
  const [solution, setSolution] = useState<ProblemSolution | null>(null);

  // Interview Prep Mode State
  const [interviewSession, setInterviewSession] = useState<InterviewSession | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState('');

  // Shared State
  const [userCode, setUserCode] = useState<string>('');
  const [whiteboardDisplayCode, setWhiteboardDisplayCode] = useState<string>('// Select a mode to get started!');
  const [diagram, setDiagram] = useState<VisualAid | null>(null);
  const [clarificationCode, setClarificationCode] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<{ message: string; attachment?: File | null } | null>(null);
  const [stateBeforeDoubt, setStateBeforeDoubt] = useState<TutorState>(TutorState.AWAITING_TASK);
  const [viewingCertificate, setViewingCertificate] = useState<Badge | null>(null);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, skillId: null as string | null, error: '', isLoading: false });

  const { speak, cancel, isMuted, toggleMute, isSpeaking, spokenText, mouthShape } = useSpeechSynthesis();

  const currentUser = useMemo(() => users.find(u => u.id === currentUserId), [users, currentUserId]);

  const currentSkill = useMemo(() => currentUser?.skills.find(s => s.id === currentSkillId), [currentUser, currentSkillId]);
  const currentTopic = useMemo(() => currentSkill?.topics.find(t => t.id === currentTopicId), [currentSkill, currentTopicId]);
  const currentStep = useMemo(() => lesson?.steps[currentStepIndex], [lesson, currentStepIndex]);
  const currentInterviewRound = useMemo(() => interviewSession?.rounds[interviewSession.currentRoundIndex], [interviewSession]);

  const codeLanguage = useMemo(() => {
    if (appMode === 'DOUBT_SOLVER' && solution?.language) {
      return solution.language.toLowerCase();
    }
    if (appMode === 'INTERVIEW_PREP') {
      return 'javascript'; // Default for interviews, could be adapted
    }
    if (appMode === 'TUTOR' && currentSkill?.name) {
      const name = currentSkill.name.toLowerCase();
      if (name.includes('python')) return 'python';
      if (name.includes('javascript') || name.includes('js')) return 'javascript';
      if (name.includes('html')) return 'html';
      if (name.includes('css')) return 'css';
      return 'javascript';
    }
    return 'javascript';
  }, [appMode, solution, currentSkill]);

  const triggerTransition = (text: string, duration = 2000) => {
    setTransitionText(text);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), duration);
  };
  
  const handleNextInterviewRound = useCallback(() => {
    if (!interviewSession) return;
    const nextRoundIndex = interviewSession.currentRoundIndex + 1;
    if (nextRoundIndex < interviewSession.rounds.length) {
      triggerTransition(`Next Round: ${interviewSession.rounds[nextRoundIndex].title}`);
      
      // Artificial delay to allow curtain to drop before new content appears
      setTimeout(() => {
        setInterviewSession(prev => prev ? ({
          ...prev,
          rounds: prev.rounds.map((r, i) => i === prev.currentRoundIndex ? {...r, completed: true} : r),
          currentRoundIndex: nextRoundIndex
        }) : null);
        
        // This system message will trigger the AI to introduce themselves for the new round.
        handleSendChatMessage(`Okay, I'm ready for the next round.`, undefined, true);
      }, 1000);
    } else {
      // Interview finished
      triggerTransition("Interview Complete!", 3000);
      const endMessage = `Great job, ${currentUser?.name}! That concludes our interview. You did very well. I'll reset the session now. Feel free to start another one whenever you're ready.`;
      const lastInterviewerGender = interviewSession.rounds[interviewSession.rounds.length - 1].interviewerGender;
      speak(endMessage, handleReset, lastInterviewerGender);
      setConversationHistory(prev => [...prev, { sender: 'ai', text: endMessage }]);
      setTutorState(TutorState.COURSE_COMPLETED); // Reuse this state for the end screen
    }
  }, [interviewSession, currentUser]);

  const processStep = useCallback((step: LessonStep) => {
    if (!step) return;
    debug('STATE', `Processing step ${currentStepIndex + 1}/${lesson?.steps.length}: ${step.type}`, { step });

    let textToSpeak: string | null = null;
    let segmentsToSpeak: SpeechSegment[] | null = null;
    let visualAid: VisualAid | undefined = undefined;
    let nextState: TutorState | null = null;
    let postSpeechState: TutorState | null = null;
    let aiMessage: ChatMessage | null = null;

    switch(step.type) {
      case 'EXPLANATION':
        textToSpeak = step.content;
        visualAid = step.visualAid;
        nextState = TutorState.EXPLAINING;
        postSpeechState = TutorState.AWAITING_CONTINUE;
        aiMessage = { sender: 'ai', text: textToSpeak, visualAid };
        break;
      case 'MULTIPLE_CHOICE':
        textToSpeak = step.question;
        nextState = TutorState.AWAITING_CHOICE;
        aiMessage = { sender: 'ai', text: textToSpeak, choices: step.choices, correctChoiceIndex: step.correctChoiceIndex };
        break;
      case 'CODE_TASK':
        segmentsToSpeak = [
            { text: 'Ab, aapki baari. ', lang: 'hi' },
            { text: step.mission, lang: 'en' },
        ];
        visualAid = step.visualAid;
        nextState = TutorState.AWAITING_TASK;
        aiMessage = { sender: 'ai', text: `Ab, aapki baari. ${step.mission}`, visualAid };
        break;
    }
    
    if (nextState) setTutorState(nextState);
    if (aiMessage) setConversationHistory(prev => [...prev, aiMessage]);
    if (visualAid) setDiagram(visualAid); else setDiagram(null);

    const onEnd = () => {
        if (postSpeechState) {
            setTutorState(postSpeechState);
        }
    };
    
    if (segmentsToSpeak) {
        speak(segmentsToSpeak, onEnd);
    } else if (textToSpeak) {
        speak(textToSpeak, onEnd, 'hi-IN');
    }
  }, [speak, setConversationHistory, setDiagram, setTutorState, currentStepIndex, lesson]);
  
  const fetchLesson = useCallback(async () => {
    if (!currentTopic || !currentSkill) {
      if (currentSkill && currentSkill.topics.every(t => t.isCompleted)) {
        debug('STATE', 'All topics for the skill are completed.', { skillId: currentSkill.id });
        setTutorState(TutorState.COURSE_COMPLETED);
      }
      return;
    }
    
    debug('API', 'Fetching lesson content', { skill: currentSkill.name, topic: currentTopic.title });
    setIsLoading(true);
    setError(null);
    setTutorState(TutorState.LOADING_LESSON);
    try {
      const lessonContent = await generateLessonContent(currentSkill.name, currentTopic.title);
      debug('API', 'Lesson content fetched successfully', { lessonContent });
      setLesson(lessonContent);
      setCurrentStepIndex(0);
      setIncorrectAttempts(0);
      setCurrentHint(null);

      const codeTask = lessonContent.steps.find(s => s.type === 'CODE_TASK');
      const initialCode = codeTask?.type === 'CODE_TASK' ? (codeTask as StepCodeTask).startingCode : '// Your code will appear here';
      setUserCode(initialCode);
      setWhiteboardDisplayCode(initialCode);

      setClarificationCode(null);
      setConversationHistory([]);
      setDiagram(null);
      
      if (lessonContent.steps && lessonContent.steps.length > 0) {
        processStep(lessonContent.steps[0]);
      } else {
        console.warn("Lesson has no valid steps. Proceeding to next lesson.");
        debug('WARN', 'Lesson has no valid steps. Auto-completing.', { topicId: currentTopic.id });
        setTutorState(TutorState.CORRECT);
      }
      
    } catch (err) {
      debug('ERROR', 'Failed to fetch lesson', { error: err });
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setTutorState(TutorState.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [currentTopic, currentSkill, setLesson, setUserCode, setConversationHistory, setDiagram, setCurrentStepIndex, processStep, setIncorrectAttempts, setCurrentHint]);

  useEffect(() => {
    if (currentTopicId && tutorState === TutorState.LOADING_LESSON) {
        debug('EFFECT', 'Triggering fetchLesson due to state change', { currentTopicId, tutorState: TutorState[tutorState] });
        fetchLesson();
    }
  }, [currentTopicId, tutorState, fetchLesson]);

  const handleNextStep = useCallback(async () => {
    cancel();
    debug('EVENT', 'handleNextStep triggered', { currentStepIndex, totalSteps: lesson?.steps.length });

    if (!lesson || !currentUser || !currentSkill) return;

    const nextStepIndex = currentStepIndex + 1;

    if (nextStepIndex < lesson.steps.length) {
      debug('STATE', 'Moving to next step', { nextStepIndex });
      setCurrentStepIndex(nextStepIndex);
      processStep(lesson.steps[nextStepIndex]);
    } else {
      debug('STATE', 'Lesson completed. Updating progress.');
      const pointsEarned = currentTopic?.points || 100;
      const today = new Date().toISOString().split('T')[0];
      
      let newStreak = currentUser.currentStreak;
      if (!currentUser.lastActivityDate || !isToday(currentUser.lastActivityDate)) {
        if (currentUser.lastActivityDate && isYesterday(currentUser.lastActivityDate)) {
          newStreak++;
        } else {
          newStreak = 1;
        }
      }

      const newLongestStreak = Math.max(currentUser.longestStreak || 0, newStreak);
      
      const activityLog = currentUser.activityLog || [];
      const todayLogIndex = activityLog.findIndex(log => log.date === today);
      let newActivityLog;

      if (todayLogIndex > -1) {
          newActivityLog = activityLog.map((log, index) => 
              index === todayLogIndex ? { ...log, points: log.points + pointsEarned } : log
          );
      } else {
          newActivityLog = [...activityLog, { date: today, points: pointsEarned }];
      }
      
      const updatedSkills = currentUser.skills.map(skill => 
        skill.id === currentSkillId ? {
          ...skill,
          topics: skill.topics.map(topic => 
            topic.id === currentTopic?.id ? { ...topic, isCompleted: true } : topic
          )
        } : skill
      );
      
      let updatedUser = {
        ...currentUser,
        skills: updatedSkills,
        points: currentUser.points + pointsEarned,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        activityLog: newActivityLog,
        lastActivityDate: today,
      };

      const completedSkill = updatedSkills.find(s => s.id === currentSkillId);
      const allTopicsCompleted = completedSkill?.topics.every(t => t.isCompleted);
      
      if (allTopicsCompleted && completedSkill) {
          debug('STATE', 'Course completed', { skillName: completedSkill.name });
          const hasBadge = updatedUser.badges.some(b => b.courseName === completedSkill.name);
          if (!hasBadge) {
              const badgeTitle = await generateBadgeTitle(completedSkill.name, completedSkill.topics);
              const newBadge: Badge = {
                id: `badge-${completedSkill.id}-${Date.now()}`,
                courseName: completedSkill.name,
                title: badgeTitle,
                dateAwarded: new Date().toISOString(),
              };
              updatedUser = { ...updatedUser, badges: [...updatedUser.badges, newBadge] };
              debug('GAMIFICATION', 'New badge awarded', { newBadge });
          }
          
          const congratsSegments: SpeechSegment[] = [
              { text: `Bahut badhiya, ${currentUser.name}! `, lang: 'hi' },
              { text: `You've completed the ${completedSkill.name} course! You can view your certificate on the dashboard.`, lang: 'en' },
          ];

          setTutorState(TutorState.COURSE_COMPLETED);
          speak(congratsSegments);
      } else {
        setTutorState(TutorState.CORRECT);
      }

      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      debug('DATA', 'User profile updated', { updatedUser });
      setUsers(updatedUsers);
    }
  }, [lesson, currentStepIndex, currentSkillId, currentTopic, cancel, processStep, speak, currentUser, users, setUsers, currentSkill]);

    const handleAnswerMcq = useCallback((choiceIndex: number) => {
        if (currentStep?.type !== 'MULTIPLE_CHOICE') return;

        debug('EVENT', 'MCQ answer submitted', { choiceIndex, correctAnswer: currentStep.correctChoiceIndex });
        setConversationHistory(prev => [...prev, { sender: 'user', text: `Selected: "${currentStep.choices[choiceIndex]}"` }]);
        
        // eslint-disable-next-line eqeqeq
        if (choiceIndex == currentStep.correctChoiceIndex) {
            debug('STATE', 'MCQ answer correct');
            const feedback = currentStep.feedback || "Bilkul sahi!";
            speak(feedback, () => setTutorState(TutorState.AWAITING_CONTINUE), 'hi-IN');
        } else {
            debug('STATE', 'MCQ answer incorrect');
            const feedback = "Yeh sahi nahi hai. Ek baar phir sochiye.";
            speak(feedback, undefined, 'hi-IN');
            setTutorState(TutorState.INCORRECT);
        }
    }, [currentStep, speak, setConversationHistory, setTutorState]);


  const handleSendChatMessage = useCallback(async (message: string, attachment?: File | null, isSystemMessage: boolean = false) => {
    if (!message.trim() && !attachment) return;

    debug('CHAT', 'handleSendChatMessage triggered', { message, hasAttachment: !!attachment, isSystemMessage, currentState: TutorState[tutorState], appMode });

    if (appMode === 'TUTOR' && tutorState === TutorState.AWAITING_CHOICE && currentStep?.type === 'MULTIPLE_CHOICE' && !isSystemMessage) {
        const choices = currentStep.choices.map(c => c.toLowerCase());
        const cleanedUserChoice = message.toLowerCase().replace(/[.,?]/g, '').trim();
        const matchedIndex = choices.findIndex(c => c.includes(cleanedUserChoice));

        if (matchedIndex > -1) {
            debug('CHAT', 'MCQ answer detected via speech/text, handling as answer.', { choice: choices[matchedIndex], spoken: cleanedUserChoice });
            handleAnswerMcq(matchedIndex);
            return;
        }
        debug('CHAT', 'Speech received during MCQ, but did not match choices. Treating as a doubt.');
    }
    
    const userMessage: ChatMessage = { sender: 'user', text: message, isSystem: isSystemMessage };
    const newHistory: ChatMessage[] = [...conversationHistory, userMessage];
    setConversationHistory(newHistory);
    
    debug('STATE', `Saving state before entering doubt clarification: ${TutorState[tutorState]}`);
    setStateBeforeDoubt(tutorState);
    setTutorState(TutorState.CHATTING);
    setChatError(null);
    setLastFailedMessage(null);

    try {
      let aiResponse;
      let responseSpeechGender: InterviewerGender | 'hi' = 'hi';
      
      if (appMode === 'INTERVIEW_PREP') {
        if (!interviewSession || !currentInterviewRound) throw new Error("Interview session not initialized.");
        debug('API', 'Generating interview follow-up');
        responseSpeechGender = currentInterviewRound.interviewerGender;
        aiResponse = await generateInterviewFollowUp(interviewSession, newHistory, userCode, message);
        
        if (aiResponse.isRoundFinished) {
          // The AI's response will be spoken, and then the round will transition.
          const aiMessage: ChatMessage = { sender: 'ai', text: aiResponse.responseText, code: aiResponse.updatedCode, visualAid: aiResponse.visualAid };
          debug('CHAT', 'AI response received (round finished)', { aiResponse });
          setConversationHistory(prev => [...prev, aiMessage]);
          speak(aiResponse.responseText, handleNextInterviewRound, responseSpeechGender);
          return; // Prevent state from being set below, as handleNext... will take over
        }
      } else {
        const contextLesson = appMode === 'TUTOR' 
            ? lesson 
            : solution 
            ? { task: problem, code: solution.solutionCode } 
            : null;
        
        const contextSkillName = appMode === 'TUTOR' 
            ? currentSkill?.name 
            : solution?.language;

        if (!contextLesson || !contextSkillName) throw new Error("Chat context not available.");

        debug('API', 'Generating standard chat response');
        aiResponse = await generateChatResponse(contextSkillName, contextLesson, newHistory, message, userCode, appMode, attachment ?? undefined);
      }
      
      const aiMessage: ChatMessage = { sender: 'ai', text: aiResponse.responseText, code: aiResponse.updatedCode, visualAid: aiResponse.visualAid };
      
      debug('CHAT', 'AI response received', { aiResponse });
      setConversationHistory(prev => [...prev, aiMessage]);
      speak(aiResponse.responseText, undefined, responseSpeechGender === 'hi' ? 'hi-IN' : responseSpeechGender);
      
      if (aiResponse.updatedCode) {
        setUserCode(aiResponse.updatedCode);
        if (appMode === 'TUTOR') {
          setClarificationCode(aiResponse.updatedCode);
        } else {
          setWhiteboardDisplayCode(aiResponse.updatedCode);
        }
      }

      if (aiResponse.visualAid) {
        setDiagram(aiResponse.visualAid);
      }
      
      const nextState = appMode === 'TUTOR' ? TutorState.CLARIFYING_DOUBT : TutorState.AWAITING_TASK;
      debug('STATE', `Transitioning to ${TutorState[nextState]} to await user continuation.`);
      setTutorState(nextState);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      debug('ERROR', 'Chat failed, restoring state', { error: err, stateToRestore: TutorState[stateBeforeDoubt] });
      setChatError(errorMsg);
      setLastFailedMessage({ message, attachment });
      setTutorState(stateBeforeDoubt); // Restore state on error
    }
  }, [conversationHistory, lesson, speak, stateBeforeDoubt, tutorState, userCode, currentSkill, appMode, solution, problem, setConversationHistory, setDiagram, setUserCode, currentStep, handleAnswerMcq, interviewSession, handleNextInterviewRound, currentInterviewRound]);

  const handleRetryChat = () => {
    if (lastFailedMessage) {
        debug('CHAT', 'Retrying last failed chat message', { lastFailedMessage });
        let userMessageIndex = -1;
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
            if (conversationHistory[i].sender === 'user') {
                userMessageIndex = i;
                break;
            }
        }
        
        if (userMessageIndex !== -1) {
            setConversationHistory(prev => prev.slice(0, userMessageIndex));
        }
        const { message, attachment } = lastFailedMessage;
        setLastFailedMessage(null);
        setChatError(null);
        handleSendChatMessage(message, attachment);
    }
  }


  const handleSubmitCode = useCallback(async () => {
    if ((appMode !== 'TUTOR' && appMode !== 'INTERVIEW_PREP') || (appMode === 'TUTOR' && (!currentSkill || currentStep?.type !== 'CODE_TASK'))) return;

    debug('EVENT', 'Code submission triggered', { code: userCode, appMode });
    setIsLoading(true);
    setError(null);
    setTutorState(TutorState.EVALUATING);
    try {
       // In interview mode, code submission is just another form of chat message
       if (appMode === 'INTERVIEW_PREP') {
          await handleSendChatMessage(`(I've written my code solution on the whiteboard. Here it is:\n\n${userCode}\n\nPlease evaluate it and provide feedback on time/space complexity, and suggest optimizations.)`);
          setIsLoading(false);
          // handleSendChatMessage sets the tutorState
          return;
       }

      // Existing tutor mode logic
      if (currentStep && currentStep.type === 'CODE_TASK' && currentSkill) {
        const { isCorrect, feedback, hint } = await evaluateCode(currentSkill.name, currentStep.mission, userCode, incorrectAttempts);
        debug('API', 'Code evaluation received', { isCorrect, feedback, hint });
        setConversationHistory(prev => [...prev, { sender: 'user', text: '(Submitting code for evaluation)'}, { sender: 'ai', text: feedback }]);
        
        if (isCorrect) {
          setIncorrectAttempts(0);
          setCurrentHint(null);
          setTutorState(TutorState.AWAITING_CONTINUE);
          speak(feedback, () => {
            setTutorState(TutorState.AWAITING_CONTINUE)
          }, 'hi-IN');
        } else {
          setIncorrectAttempts(prev => prev + 1);
          setCurrentHint(hint || null);
          speak(feedback, undefined, 'hi-IN');
          setTutorState(TutorState.INCORRECT);
        }
      }
    } catch (err) {
      debug('ERROR', 'Code evaluation failed', { error: err });
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setTutorState(TutorState.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [appMode, currentStep, userCode, currentSkill, speak, setConversationHistory, incorrectAttempts, setIncorrectAttempts, setCurrentHint, handleSendChatMessage]);

  const handleRequestHint = () => {
    if (!currentHint) return;
    debug('EVENT', 'Hint requested', { attemptNumber: incorrectAttempts, hint: currentHint });
    
    let hintText = '';
    if (incorrectAttempts === 1) {
        hintText = `Hint: ${currentHint.conceptual}`;
    } else if (incorrectAttempts >= 2) {
        hintText = `Okay, here's a more direct hint: ${currentHint.direct}`;
    }

    if (hintText) {
        speak(hintText, undefined, 'hi-IN');
        setConversationHistory(prev => [...prev, { sender: 'ai', text: hintText }]);
    }
  };

  const handleShowSolution = () => {
      if (!currentHint?.solution) return;
      debug('EVENT', 'Solution requested');
      setUserCode(currentHint.solution);
      setWhiteboardDisplayCode(currentHint.solution);
      const text = "Koi baat nahi, sometimes the best way to learn is to see the answer. Maine solution whiteboard par likh diya hai. Ek baar dekh lijiye, phir hum aage badhenge.";
      speak(text, () => {
          setTutorState(TutorState.AWAITING_CONTINUE);
      }, 'hi-IN');
      setConversationHistory(prev => [...prev, { sender: 'ai', text }]);
  };

  const {
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    isSupported: isSpeechSupported,
    error: speechError,
  } = useSpeechRecognition({ 
      onTranscriptEnd: (msg) => handleSendChatMessage(msg),
      onSubmissionIntent: handleSubmitCode 
  });

  useEffect(() => {
    const isAwaitingUserInput = (tutorState === TutorState.AWAITING_TASK || tutorState === TutorState.INCORRECT || tutorState === TutorState.AWAITING_CHOICE);
    const canListen = isAwaitingUserInput && !isLoading && !isSpeaking && isSpeechSupported;

    if (canListen && !isListening) {
      debug('SPEECH', 'Conditions met, starting listening...');
      startListening();
    } else if (!canListen && isListening) {
      debug('SPEECH', 'Conditions no longer met, stopping listening...', { tutorState: TutorState[tutorState], isLoading, isSpeaking });
      stopListening();
    }
    return () => {
        if (isListening) stopListening();
    };
  }, [tutorState, isLoading, isSpeechSupported, startListening, stopListening, isSpeaking, isListening]);

  const handleSolveDoubt = useCallback(async (problemStatement: string, file?: File) => {
    const problemText = problemStatement || `Problem from uploaded file: ${file?.name}`;
    debug('EVENT', 'Solving doubt', { problem: problemText });
    setProblem(problemText);
    setIsLoading(true);
    setError(null);
    setTutorState(TutorState.LOADING_LESSON);
    setConversationHistory([]);
    setSolution(null);
    setDiagram(null);
    try {
      const solutionContent = await generateProblemSolution(problemStatement, file);
      debug('API', 'Doubt solution received', { solutionContent });
      setSolution(solutionContent);
      setWhiteboardDisplayCode(solutionContent.solutionCode);
      setUserCode(solutionContent.solutionCode);
      setClarificationCode(null);
      
      const initialMessages: ChatMessage[] = [
        { sender: 'ai', text: solutionContent.problemExplanation },
        { sender: 'ai', text: solutionContent.solutionExplanation },
      ];
      setConversationHistory(initialMessages);

      speak(solutionContent.problemExplanation, () => {
        speak(solutionContent.solutionExplanation, () => {
             speak("Aap is solution ko dekh sakte hain, aur agar koi sawaal ho to pooch sakte hain.", undefined, 'hi-IN');
        }, 'hi-IN');
      }, 'hi-IN');
      
      setTutorState(TutorState.AWAITING_TASK);
    } catch (err) {
      debug('ERROR', 'Doubt solving failed', { error: err });
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setConversationHistory([{ sender: 'ai', text: err instanceof Error ? err.message : 'An unknown error occurred'}]);
      setTutorState(TutorState.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [speak, setProblem, setConversationHistory, setSolution, setDiagram, setUserCode]);

  const handleStartInterview = useCallback(async (setup: { cvFile?: File, cvText?: string, company: string, role: string, experienceLevel: ExperienceLevel }) => {
    debug('INTERVIEW', 'Starting interview', { setup });
    setIsLoading(true);
    setError(null);
    setTutorState(TutorState.LOADING_LESSON);
    setConversationHistory([]);
    setInterviewSession(null);
    setDiagram(null);
    setWhiteboardDisplayCode(`// Welcome to your interview for the ${setup.role} role at ${setup.company}.`);
    setUserCode('');

    try {
        const { rounds, openingStatement } = await generateInterviewPlan(
            setup.cvFile, 
            setup.cvText, 
            setup.company, 
            setup.role, 
            setup.experienceLevel,
            INDIAN_MALE_NAMES,
            INDIAN_FEMALE_NAMES
        );
        
        const newSession: InterviewSession = {
            ...setup,
            rounds,
            currentRoundIndex: 0,
        };
        debug('INTERVIEW', 'Interview plan received', { newSession, openingStatement });
        setInterviewSession(newSession);
        
        const initialMessage: ChatMessage = { sender: 'ai', text: openingStatement };
        setConversationHistory([initialMessage]);
        
        triggerTransition("Interview Starting", 2000);

        setTimeout(() => {
            const firstInterviewerGender = newSession.rounds[0]?.interviewerGender || 'male';
            speak(openingStatement, () => {
                setTutorState(TutorState.AWAITING_TASK); // Ready for user's first response
            }, firstInterviewerGender);
        }, 1000);

    } catch (err) {
        debug('ERROR', 'Failed to start interview', { error: err });
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setTutorState(TutorState.ERROR);
    } finally {
        setIsLoading(false);
    }
}, [speak]);

  const handleSelectSkill = (skillId: string) => {
    debug('EVENT', 'Skill selected', { skillId });
    const skill = currentUser?.skills.find(s => s.id === skillId);
    if (!skill) return;

    setError(null);
    setLesson(null);
    setCurrentSkillId(skillId);
    setCurrentTopicId(skill.topics[0]?.id || null);
    setConversationHistory([]);
    setWhiteboardDisplayCode('// Click "Start Learning" or select a topic to begin.');
    setTutorState(TutorState.SELECTING_SKILL);
    setDiagram(null);
  };

  const handleCreateSkill = async (outline: CourseOutline) => {
    if (!currentUser) return;
    debug('EVENT', 'Creating new skill', { outline });
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: outline.skillName,
      icon: BookOpenIcon,
      topics: outline.topics.map((topic, index) => ({
        id: `topic-${Date.now()}-${index}`,
        title: topic.title,
        description: topic.description,
        isCompleted: false,
        points: topic.points || 100,
      })),
    };
    
    const updatedUser = { ...currentUser, skills: [...currentUser.skills, newSkill] };
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
    debug('DATA', 'User profile updated with new skill', { userId: currentUser.id, newSkillId: newSkill.id });
    
    setError(null);
    setLesson(null);
    setCurrentSkillId(newSkill.id);
    setCurrentTopicId(newSkill.topics[0]?.id || null);
    setConversationHistory([]);
    setWhiteboardDisplayCode('// Click "Start Learning" or select a topic to begin.');
    setTutorState(TutorState.SELECTING_SKILL);
    setDiagram(null);
    setAppMode('TUTOR');
  };

  const handleSelectTopic = useCallback((topicId: string) => {
      debug('EVENT', 'Topic selected', { topicId });
      if (topicId === currentTopicId && lesson) {
          debug('INFO', 'Topic already loaded, ignoring selection.');
          return;
      }
      
      const skill = currentUser?.skills.find(s => s.id === currentSkillId);
      const topicIndex = skill?.topics.findIndex(t => t.id === topicId);
      
      if (skill && topicIndex !== undefined && topicIndex > 0 && !skill.topics[topicIndex - 1].isCompleted) {
          debug('WARN', 'Attempted to select a locked topic.', { topicId });
          return; 
      }
      
      cancel();
      setCurrentTopicId(topicId);
      setLesson(null); 
      setTutorState(TutorState.LOADING_LESSON); 
  }, [currentTopicId, lesson, currentUser, currentSkillId, cancel]);

  const handleStartLearning = () => {
    if (currentTopicId) {
        debug('EVENT', 'Start learning button clicked');
        setTutorState(TutorState.LOADING_LESSON);
    }
  };

  const handleNextLesson = () => {
    debug('EVENT', 'Next lesson button clicked');
    const currentIdx = currentSkill?.topics.findIndex(t => t.id === currentTopicId);
    if (currentSkill && currentIdx !== undefined && currentIdx < currentSkill.topics.length - 1) {
        const nextTopic = currentSkill.topics[currentIdx + 1];
        if (nextTopic) {
            handleSelectTopic(nextTopic.id);
        }
    }
  };

  const handleTryAgain = () => {
    debug('EVENT', 'Try again button clicked');
    if(currentStep?.type === 'MULTIPLE_CHOICE') {
      setTutorState(TutorState.AWAITING_CHOICE);
      speak("Koi baat nahi, phir se koshish karein.", undefined, 'hi-IN');
    } else {
      setTutorState(TutorState.AWAITING_TASK);
      speak("No problem, take another look at the task and try again.", undefined, 'hi-IN');
    }
  };

  const handleContinueLesson = useCallback(() => {
    debug('EVENT', 'Continue lesson button clicked', { stateToRestore: TutorState[stateBeforeDoubt] });
    setClarificationCode(null);
    setTutorState(stateBeforeDoubt);

    const text = "Great! Let's get back to it.";
    speak(text, undefined, 'en');
    setConversationHistory(prev => [...prev, { sender: 'ai', text }]);
  }, [speak, stateBeforeDoubt, setConversationHistory, setClarificationCode, setTutorState]);

  const handleReset = () => {
    debug('EVENT', 'Resetting app to selection screen');
    cancel();
    setAppMode('SELECTION');
    setCurrentSkillId(null);
    setCurrentTopicId(null);
    setLesson(null);
    setUserCode('');
    setConversationHistory([]);
    setProblem('');
    setSolution(null);
    setDiagram(null);
    setCurrentStepIndex(0);
    setIncorrectAttempts(0);
    setCurrentHint(null);
    setInterviewSession(null);
    setTutorState(TutorState.IDLE);
    setError(null);
    setChatError(null);
    setWhiteboardDisplayCode('// Select a mode to get started!')
  };

  const handleLogout = () => {
    debug('AUTH', 'User logging out');
    handleReset();
    setCurrentUserId(null);
  };

  const handleSignUp = (name: string, pin: string): string | undefined => {
    debug('AUTH', 'Attempting sign up', { name });
    if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
        debug('AUTH', 'Sign up failed: username taken');
        return "Username already taken. Please choose another.";
    }
    const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        name,
        password: pin,
        points: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        activityLog: [],
        badges: [],
        skills: [],
    };
    setUsers([...users, newUser]);
    setCurrentUserId(newUser.id);
    debug('AUTH', 'Sign up successful', { userId: newUser.id });
    return undefined;
  };
  
  const handleLogin = (name: string, pin: string): string | undefined => {
    debug('AUTH', 'Attempting login', { name });
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (!user) {
        debug('AUTH', 'Login failed: user not found');
        return "User not found. Please check the name or sign up.";
    }
    if (user.password !== pin) {
        debug('AUTH', 'Login failed: incorrect PIN');
        return "Incorrect PIN. Please try again.";
    }
    setCurrentUserId(user.id);
    debug('AUTH', 'Login successful', { userId: user.id });
    return undefined;
  };

  const handlePromptDeleteSkill = (skillId: string) => {
    debug('EVENT', 'Prompting for skill deletion', { skillId });
    setDeleteModal({ isOpen: true, skillId, error: '', isLoading: false });
  };

  const handleConfirmDeleteSkill = (pin: string) => {
    if (!deleteModal.skillId || !currentUser || deleteModal.isLoading) return;

    if (pin !== currentUser.password) {
        setDeleteModal(prev => ({ ...prev, error: "Incorrect PIN. Please try again." }));
        debug('EVENT', 'Skill deletion failed: incorrect PIN');
        return;
    }
    
    debug('EVENT', 'Confirmed skill deletion', { skillId: deleteModal.skillId });
    setDeleteModal(prev => ({ ...prev, isLoading: true, error: '' }));

    // Simulate async operation for visual feedback
    setTimeout(() => {
        const updatedSkills = currentUser.skills.filter(s => s.id !== deleteModal.skillId);
        const updatedUser = { ...currentUser, skills: updatedSkills };
        setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));

        if (currentSkillId === deleteModal.skillId) {
            handleReset();
        }
        setDeleteModal({ isOpen: false, skillId: null, error: '', isLoading: false });
        debug('EVENT', 'Skill deleted successfully');
    }, 500);
  };
  
  useEffect(() => {
    debug('LIFECYCLE', 'App mounted', { currentUserId, users });
    const user = users.find(u => u.id === currentUserId);
    if (user) {
        debug('AUTH', 'User session validated', { userId: user.id, name: user.name });
    } else if (currentUserId) {
        debug('AUTH', 'Stale user session found, logging out.');
        setCurrentUserId(null);
    }
  }, []); // Run only on mount

  useEffect(() => {
    debug('STATE_CHANGE', `Tutor state changed to ${TutorState[tutorState]}`, {
        isLoading,
        appMode,
        currentStep: currentStep?.type,
        currentStepIndex,
        conversationLength: conversationHistory.length,
    });
  }, [tutorState, isLoading, appMode, currentStep, currentStepIndex, conversationHistory.length]);
  
  if (!currentUser) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onSignUp={handleSignUp}
      />
    );
  }

  if (viewingCertificate) {
    return (
      <Certificate 
        studentName={currentUser.name}
        courseName={viewingCertificate.courseName}
        dateAwarded={viewingCertificate.dateAwarded}
        onClose={() => setViewingCertificate(null)}
      />
    );
  }
  
  if (tutorState === TutorState.COURSE_COMPLETED && appMode !== 'INTERVIEW_PREP') {
    return (
      <CourseCompletionScreen 
        courseName={currentSkill?.name || 'Selected Skill'}
        onBackToDashboard={handleReset}
      />
    );
  }
  
  if (appMode === 'SELECTION') {
    return (
      <SkillSelectionScreen
        userProfile={currentUser}
        onSelectSkill={(id) => {
            handleSelectSkill(id);
            setAppMode('TUTOR');
        }}
        onDeleteSkill={handlePromptDeleteSkill}
        onCreateSkill={handleCreateSkill}
        onSetMode={setAppMode}
        onViewCertificate={(badge) => setViewingCertificate(badge)}
        onLogout={handleLogout}
      />
    );
  }
  
  if (appMode === 'INTERVIEW_PREP' && !interviewSession) {
    return <InterviewSetupScreen onStartInterview={handleStartInterview} isLoading={isLoading} />;
  }

  const codeForWhiteboard = tutorState === TutorState.CLARIFYING_DOUBT && appMode === 'TUTOR'
      ? (clarificationCode ?? '') 
      : whiteboardDisplayCode;
  
  const currentError = error || speechError;
  
  const tutorPanelTitle = appMode === 'TUTOR' 
      ? lesson?.topicTitle || currentTopic?.title
      : appMode === 'DOUBT_SOLVER'
      ? solution?.language ? `${solution.language} Solver` : 'Doubt Solver'
      : currentInterviewRound?.title || 'Interview';
  
  const isCodeTask = (appMode === 'TUTOR' && currentStep?.type === 'CODE_TASK') ||
                     (appMode === 'INTERVIEW_PREP' && currentInterviewRound?.type === 'CODING_CHALLENGE') ||
                     (appMode === 'INTERVIEW_PREP' && currentInterviewRound?.type === 'SYSTEM_DESIGN');

  const whiteboardEditable = (appMode === 'DOUBT_SOLVER' && !!solution) || 
                             (appMode === 'TUTOR' && tutorState === TutorState.AWAITING_TASK) ||
                             (isCodeTask && tutorState === TutorState.AWAITING_TASK);
  
  const missionText = appMode === 'TUTOR'
    ? (currentStep && currentStep.type === 'CODE_TASK' ? currentStep.mission : undefined)
    : appMode === 'INTERVIEW_PREP' && isCodeTask
    ? (conversationHistory.filter(m => m.sender === 'ai' && !m.isSystem).pop()?.text)
    : undefined;

  const skillToDelete = currentUser.skills.find(s => s.id === deleteModal.skillId);

  return (
    <>
      <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, skillId: null, error: '', isLoading: false })}
          onConfirm={handleConfirmDeleteSkill}
          courseName={skillToDelete?.name || ''}
          error={deleteModal.error}
          isLoading={deleteModal.isLoading}
      />
      <TransitionCurtain isVisible={isTransitioning} text={transitionText} />
      <div className="flex flex-col md:flex-row h-screen bg-gray-900 font-sans overflow-hidden">
          {appMode === 'TUTOR' ? (
              <ProgressTracker 
                  currentSkill={currentSkill} 
                  onReset={handleReset}
                  currentTopicId={currentTopicId}
                  onSelectTopic={handleSelectTopic}
                  userProfile={currentUser}
              />
          ) : appMode === 'DOUBT_SOLVER' ? (
              <DoubtHeader onReset={handleReset} />
          ) : appMode === 'INTERVIEW_PREP' && interviewSession ? (
              <InterviewRoundsTracker session={interviewSession} onReset={handleReset} />
          ) : null}
      
        <main className="flex-1 grid grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-4 p-4">
          <TutorPanel
            appMode={appMode}
            tutorState={tutorState}
            isLoading={isLoading || tutorState === TutorState.LOADING_LESSON || tutorState === TutorState.EVALUATING || tutorState === TutorState.CHATTING}
            conversationHistory={conversationHistory}
            error={currentError}
            chatError={chatError}
            onRetryChat={handleRetryChat}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onStartLearning={handleStartLearning}
            onSendMessage={handleSendChatMessage}
            onNextLesson={handleNextLesson}
            onNextStep={handleNextStep}
            onAnswerMcq={handleAnswerMcq}
            onTryAgain={handleTryAgain}
            onContinueLesson={handleContinueLesson}
            onRequestHint={handleRequestHint}
            onShowSolution={handleShowSolution}
            incorrectAttempts={incorrectAttempts}
            currentTopicTitle={tutorPanelTitle}
            currentStep={currentStep}
            isListening={isListening}
            isSpeaking={isSpeaking}
            spokenText={spokenText}
            mouthShape={mouthShape}
            interimTranscript={interimTranscript}
            isSpeechSupported={isSpeechSupported}
            showStartLearningButton={appMode === 'TUTOR' && tutorState === TutorState.SELECTING_SKILL}
          />
          <div className="flex flex-col gap-4 h-full min-h-0">
            {appMode === 'TUTOR' ? (
              <TaskPanel mission={missionText} currentStep={currentStep} title="Your Mission" />
            ) : appMode === 'DOUBT_SOLVER' ? (
              solution ? 
                <TaskPanel mission={problem} currentStep={null} title="Problem Statement" /> : 
                <DoubtInputPanel onSolve={handleSolveDoubt} isLoading={isLoading} />
            ) : appMode === 'INTERVIEW_PREP' ? (
              <TaskPanel mission={missionText} currentStep={null} title={currentInterviewRound?.title}/>
            ) : null}

            <Whiteboard
              isEditable={whiteboardEditable}
              displayCode={codeForWhiteboard}
              userCode={userCode}
              onCodeChange={setUserCode}
              onSubmitCode={handleSubmitCode}
              isLoading={tutorState === TutorState.EVALUATING}
              showSubmitButton={isCodeTask}
              diagram={diagram}
              language={codeLanguage}
            />
          </div>
        </main>
      </div>
    </>
  );
}