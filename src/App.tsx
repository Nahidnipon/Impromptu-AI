import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Timer as TimerIcon, 
  RefreshCw, 
  Globe, 
  ChevronRight, 
  Award,
  BookOpen,
  MessageSquare,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { generateTopics, getFeedback } from './lib/gemini';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { AppState, SUPPORTED_LANGUAGES, Language } from './types';

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [selectedLang, setSelectedLang] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [topic, setTopic] = useState('');
  const [topicPool, setTopicPool] = useState<string[]>([]);
  const [timer, setTimer] = useState(60);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);

  const { transcript, interimTranscript, setTranscript, setInterimTranscript, isListening, startListening, stopListening } = useSpeechRecognition(selectedLang.code);
  const [isSupported, setIsSupported] = useState(true);

  // Prefetch topics
  const refillTopicPool = useCallback(async (lang: string) => {
    if (isGeneratingTopic) return;
    setIsGeneratingTopic(true);
    try {
      const newTopics = await generateTopics(lang, 3);
      setTopicPool(prev => [...prev, ...newTopics]);
    } catch (error) {
      console.error('Failed to prefetch topics:', error);
    } finally {
      setIsGeneratingTopic(false);
    }
  }, [isGeneratingTopic]);

  useEffect(() => {
    if (topicPool.length === 0 && state === 'idle') {
      refillTopicPool(selectedLang.name);
    }
  }, [topicPool.length, selectedLang.name, refillTopicPool, state]);

  // Clear pool on language change
  useEffect(() => {
    setTopicPool([]);
  }, [selectedLang.code]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const handleStart = async () => {
    if (topicPool.length > 0) {
      const nextTopic = topicPool[0];
      setTopic(nextTopic);
      setTopicPool(prev => prev.slice(1));
      setState('preparing');
      setTimer(10);
    } else {
      setIsGeneratingTopic(true);
      try {
        const newTopics = await generateTopics(selectedLang.name, 1);
        setTopic(newTopics[0] || "A random topic");
        setState('preparing');
        setTimer(10);
      } catch (error) {
        console.error('Failed to generate topic:', error);
      } finally {
        setIsGeneratingTopic(false);
      }
    }
  };

  const startSpeaking = useCallback(() => {
    setState('speaking');
    setTimer(60);
    setTranscript('');
    setInterimTranscript('');
    startListening();
  }, [startListening, setTranscript, setInterimTranscript]);

  const finishSpeaking = useCallback(async () => {
    stopListening();
    setState('feedback');
    setIsLoading(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    try {
      const aiFeedback = await getFeedback(transcript, topic, selectedLang.name);
      setFeedback(aiFeedback);
    } catch (error) {
      console.error('Failed to get feedback:', error);
      setFeedback('Sorry, I could not generate feedback at this time.');
    } finally {
      setIsLoading(false);
    }
  }, [stopListening, transcript, topic, selectedLang.name]);

  useEffect(() => {
    let interval: any;
    if (state === 'preparing' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (state === 'preparing' && timer === 0) {
      startSpeaking();
    } else if (state === 'speaking' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (state === 'speaking' && timer === 0) {
      finishSpeaking();
    }
    return () => clearInterval(interval);
  }, [state, timer, startSpeaking, finishSpeaking]);

  const reset = () => {
    setState('idle');
    setTopic('');
    setTranscript('');
    setInterimTranscript('');
    setFeedback('');
    setTimer(60);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-blue-100">
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold text-lg tracking-tight">Impromptu Speaker Pro</h1>
        </div>
        
        {state === 'idle' && (
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-gray-400" />
            <select 
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer hover:text-blue-600 transition-colors"
              value={selectedLang.code}
              onChange={(e) => setSelectedLang(SUPPORTED_LANGUAGES.find(l => l.code === e.target.value)!)}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-5xl font-bold tracking-tight leading-tight">
                  Master the art of <br />
                  <span className="text-blue-600">thinking on your feet.</span>
                </h2>
                <p className="text-xl text-gray-500 max-w-lg mx-auto">
                  Practice impromptu speaking in {SUPPORTED_LANGUAGES.length} languages. 
                  Get a random topic, speak for 60 seconds, and receive AI-powered feedback.
                </p>
              </div>

              {!isSupported && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-800 text-sm font-medium max-w-md mx-auto">
                  ⚠️ Your browser doesn't support speech recognition. Please use Chrome or Edge for the best experience.
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={isGeneratingTopic || !isSupported}
                className="group relative inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {isGeneratingTopic ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Finding a topic...
                  </>
                ) : (
                  <>
                    Start Session
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {state === 'preparing' && (
            <motion.div 
              key="preparing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center space-y-12"
            >
              <div className="space-y-4">
                <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Your Topic</span>
                <h2 className="text-4xl font-bold leading-tight">{topic}</h2>
              </div>

              <div className="relative inline-flex items-center justify-center">
                <svg className="w-48 h-48 -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-100"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={553}
                    initial={{ strokeDashoffset: 553 }}
                    animate={{ strokeDashoffset: 553 - (timer / 10) * 553 }}
                    className="text-blue-600"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-mono font-bold">{timer}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Prepare</span>
                </div>
              </div>

              <p className="text-gray-500 italic">Get ready to speak...</p>
            </motion.div>
          )}

          {state === 'speaking' && (
            <motion.div 
              key="speaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-bold uppercase tracking-widest text-sm">Live Session</span>
                </div>
                <div className="flex items-center gap-2 font-mono font-bold text-xl">
                  <TimerIcon className="w-5 h-5 text-blue-600" />
                  {timer}s
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-2xl font-bold text-gray-400">Topic: <span className="text-black">{topic}</span></h3>
                
                <div className="min-h-[200px] relative">
                  <p className={cn(
                    "text-xl leading-relaxed transition-colors",
                    (transcript || interimTranscript) ? "text-gray-800" : "text-gray-300 italic"
                  )}>
                    {transcript}
                    <span className="text-gray-400">{interimTranscript}</span>
                    {(!transcript && !interimTranscript) && "Start speaking now..."}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={finishSpeaking}
                  className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-full font-semibold hover:bg-red-100 transition-colors"
                >
                  <MicOff className="w-5 h-5" />
                  Finish Early
                </button>
              </div>
            </motion.div>
          )}

          {state === 'feedback' && (
            <motion.div 
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Session Feedback</h2>
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-semibold"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-sm uppercase tracking-wider text-blue-600">Topic</span>
                  </div>
                  <p className="font-semibold text-blue-900">{topic}</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span className="font-bold text-sm uppercase tracking-wider text-purple-600">Language</span>
                  </div>
                  <p className="font-semibold text-purple-900">{selectedLang.flag} {selectedLang.name}</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                    <p className="text-gray-500 font-medium">AI is analyzing your speech...</p>
                  </div>
                ) : (
                  <div className="prose prose-blue max-w-none">
                    <Markdown>{feedback}</Markdown>
                  </div>
                )}
              </div>

              {!isLoading && (
                <div className="bg-gray-900 text-white p-8 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-xl font-bold">Your Transcript</h3>
                  </div>
                  <p className="text-gray-400 leading-relaxed italic">
                    "{transcript || "No speech detected."}"
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-16 border-t border-gray-100 bg-white/80 backdrop-blur-md flex items-center justify-center px-6 text-xs text-gray-400 font-medium">
        Built with Google Gemini • Supporting {SUPPORTED_LANGUAGES.length} Languages
      </footer>
    </div>
  );
}
