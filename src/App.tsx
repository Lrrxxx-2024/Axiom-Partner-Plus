import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Info, Sparkles, Brain, Palette, CheckCircle2, AlertCircle, Loader2, Video, Key, Image as ImageIcon, X, Play } from 'lucide-react';
import { cn } from './lib/utils';
import { Message, AgentState, AgentMode, createMessage } from './types';
import { chatWithAgent, generateImage, generateVideo } from './services/geminiService';
import Markdown from 'react-markdown';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const MODES: { id: AgentMode; label: string; icon: any }[] = [
  { id: 'UNDERSTAND', label: 'Understand', icon: Brain },
  { id: 'PROPOSE', label: 'Propose', icon: Palette },
  { id: 'DEBATE', label: 'Debate', icon: AlertCircle },
  { id: 'EXECUTE', label: 'Execute', icon: Sparkles },
  { id: 'CRITIQUE', label: 'Critique', icon: CheckCircle2 },
];

const DEFAULT_STATE: AgentState = {
  mode: 'UNDERSTAND',
  monologue: 'Awaiting user input to begin the creative journey.',
  brief: 'Not defined',
  aesthetic: 'Not defined',
  confidence: 0,
  hasDisagreement: false,
};

// ─── Error → user-friendly message ───────────────────────────────────────
function friendlyError(err: any): string {
  const msg = err?.message || String(err);
  if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED'))
    return '⚠ API quota exhausted. Please try again later.';
  if (msg.includes('not found') || msg.includes('NOT_FOUND'))
    return '⚠ Please configure your API Key first.';
  if (msg.includes('permission') || msg.includes('PERMISSION_DENIED'))
    return '⚠ API Key has insufficient permissions. Check your billing.';
  if (msg.includes('timeout') || msg.includes('超时'))
    return `⚠ ${msg}`;
  return `⚠ Error: ${msg}`;
}

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<AgentState>(DEFAULT_STATE);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── API key check ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (window.aistudio) {
        setHasKey(await window.aistudio.hasSelectedApiKey());
      } else {
        setHasKey(true);
      }
    })();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingHint]);

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  // ─── File upload ───────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnimateImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setInput('Animate this image and generate a cinematic video.');
  };

  // ─── Core send logic ───────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const currentImage = selectedImage;
    const userMsg = createMessage('user', input, { image: currentImage || undefined });
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setSelectedImage(null); // Clear after sending
    setIsLoading(true);
    setLoadingHint('');

    let agentMsg = createMessage('agent', '', { state: currentState });
    setMessages([...nextMessages, agentMsg]);

    try {
      // ── 1. Stream agent reply ──────────────────────────────────────
      const stream = chatWithAgent(nextMessages);
      let lastState = currentState;

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          agentMsg = { ...agentMsg, content: chunk.content };
          setMessages([...nextMessages, agentMsg]);
        } else if (chunk.type === 'state') {
          const state = chunk.content as AgentState;
          lastState = state;
          setCurrentState(state);
          agentMsg = { ...agentMsg, state: state };
          setMessages([...nextMessages, agentMsg]);
        }
      }

      // ── 2. Execute content production (driven by agent state) ──────
      if (lastState.mode === 'EXECUTE') {
        const execType = lastState.executeType || 'text';

        if (execType === 'video') {
          setLoadingHint('视频生成中...');
          try {
            const videoUrl = await generateVideo(
              agentMsg.content,
              currentImage || undefined,
              (hint) => setLoadingHint(hint),
            );
            if (videoUrl) {
              agentMsg = { ...agentMsg, video: videoUrl };
              setMessages([...nextMessages, agentMsg]);
            }
            setSelectedImage(null);
          } catch (videoErr: any) {
            // Video failed → fallback to image + explain
            console.error('Video generation failed, falling back to image:', videoErr);
            setLoadingHint('视频生成失败，正在尝试生成图片...');
            const imageUrl = await generateImage(agentMsg.content);
            if (imageUrl) {
              agentMsg = {
                ...agentMsg,
                image: imageUrl,
                content: agentMsg.content + '\n\n> ⚠ 视频生成失败，已自动回退为图片。原因：' + (videoErr.message || '未知错误'),
              };
              setMessages([...nextMessages, agentMsg]);
            }
          }
        } else if (execType === 'image') {
          setLoadingHint('图片生成中...');
          const imageUrl = await generateImage(agentMsg.content);
          if (imageUrl) {
            agentMsg = { ...agentMsg, image: imageUrl };
            setMessages([...nextMessages, agentMsg]);
          }
        }
        // execType === 'text' → nothing extra to do
      }
    } catch (error: any) {
      console.error(error);
      const errText = friendlyError(error);
      agentMsg = { ...agentMsg, content: (agentMsg.content || '') + '\n\n' + errText };
      setMessages([...nextMessages, agentMsg]);

      if (error.message?.includes('not found') || error.message?.includes('permission')) {
        setHasKey(false);
      }
    } finally {
      setIsLoading(false);
      setLoadingHint('');
    }
  }, [input, isLoading, messages, currentState, selectedImage]);

  // ─── Landing page ──────────────────────────────────────────────────────
  if (!isStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#050505]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-7xl font-bold tracking-tighter text-white">
              Axiom-Partner-Plus
            </h1>
            <p className="text-xl text-gray-400 font-light max-w-lg mx-auto leading-relaxed">
              True Personification: Behavior driven by internal states, 
              not just linguistic mimicry.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            {!hasKey && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-sm max-w-md mb-4">
                <p className="mb-2">Video generation requires a configured API Key.</p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline block mb-4">View Billing Docs</a>
                <button
                  onClick={handleConnectKey}
                  className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-full hover:bg-yellow-400 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Key className="w-4 h-4" /> Select API Key
                </button>
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsStarted(true)}
              className="px-10 py-5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2 text-lg"
            >
              Start Session <Sparkles className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main chat interface ───────────────────────────────────────────────
  return (
    <div className="h-screen flex overflow-hidden bg-[#0A0A0A]">
      {/* Left: Chat (55%) */}
      <div className="w-[55%] flex flex-col border-r border-white/10 relative">
        <header className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium">Axiom Partner Plus</span>
          </div>
          <div className="flex items-center gap-4">
            {!hasKey && (
              <button onClick={handleConnectKey} className="text-[10px] text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded hover:bg-yellow-500/10 transition-colors">
                Connect Key
              </button>
            )}
            <div className="text-xs text-gray-500 uppercase tracking-widest">Live Session</div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === 'user' ? "bg-white/10" : "bg-white text-black"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className="space-y-2">
                  <div className={cn(
                    "p-4 rounded-2xl relative group",
                    msg.role === 'user'
                      ? "bg-white/5 text-white rounded-tr-none"
                      : "bg-white/10 text-gray-200 rounded-tl-none"
                  )}>
                    <div className="markdown-body">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                    {msg.image && (
                      <div className="relative mt-4">
                        <motion.img
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          src={msg.image}
                          alt="Generated content"
                          className="rounded-lg w-full aspect-square object-cover border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={() => handleAnimateImage(msg.image!)}
                          className="absolute bottom-4 right-4 p-3 bg-white/90 text-black rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 flex items-center gap-2 text-xs font-bold"
                        >
                          <Play className="w-4 h-4 fill-current" /> Animate this
                        </button>
                      </div>
                    )}
                    {msg.video && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 rounded-lg overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center"
                      >
                        <video src={msg.video} controls autoPlay loop className="w-full h-full" />
                      </motion.div>
                    )}
                  </div>
                  {msg.state && msg.role === 'agent' && (
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-tighter">
                      {(() => {
                        const modeInfo = MODES.find(m => m.id === msg.state?.mode);
                        const Icon = modeInfo?.icon || Bot;
                        return <Icon className="w-3 h-3" />;
                      })()}
                      {msg.state.mode} Mode
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator with progress hint */}
          {isLoading && (
            <div className="flex gap-4 items-center">
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              {loadingHint ? (
                <div className="text-xs text-gray-500 animate-pulse">{loadingHint}</div>
              ) : (
                !messages[messages.length - 1]?.content && (
                  <div className="bg-white/5 p-4 rounded-2xl animate-pulse w-24" />
                )
              )}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="p-6 border-t border-white/10 bg-[#0A0A0A] space-y-4">
          <AnimatePresence>
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10 w-fit"
              >
                <img src={selectedImage} className="w-12 h-12 rounded object-cover" />
                <div className="text-[10px] text-gray-500 uppercase">Reference Image</div>
                <button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-white/10 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors text-gray-400"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="relative flex-1 flex items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={selectedImage ? "Describe the animation effect..." : "Type your creative ideas..."}
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-white/30 transition-colors text-sm"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 p-3 bg-white text-black rounded-full hover:bg-gray-200 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Agent Internal State (45%) */}
      <div className="w-[45%] bg-[#0F0F0F] flex flex-col p-8 space-y-8 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-2">
            <Info className="w-4 h-4" /> Agent Internal State
          </h2>
          <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20">
            Hidden from User
          </span>
        </div>

        {/* Behavior Modes */}
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Behavior Modes</h3>
          <div className="grid grid-cols-1 gap-2">
            {MODES.map((mode) => {
              const isActive = currentState.mode === mode.id;
              return (
                <div
                  key={mode.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-500",
                    isActive
                      ? "bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                      : "bg-white/5 border-transparent text-gray-600 grayscale"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <mode.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-600")} />
                    <span className="font-medium">{mode.label}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="w-2 h-2 rounded-full bg-white animate-pulse"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inner Monologue */}
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4" /> Inner Monologue
          </h3>
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10 font-mono text-sm text-gray-300 leading-relaxed italic">
            "{currentState.monologue}"
          </div>
        </div>

        {/* State Variables */}
        <div className="space-y-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">State Variables</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
              <div className="text-[10px] text-gray-500 uppercase">Creative Brief</div>
              <div className="text-sm font-medium truncate">{currentState.brief}</div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
              <div className="text-[10px] text-gray-500 uppercase">Aesthetic Direction</div>
              <div className="text-sm font-medium truncate">{currentState.aesthetic}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-gray-500 uppercase">
              <span>Execution Confidence</span>
              <span>{currentState.confidence}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${currentState.confidence}%` }}
                className="h-full bg-white"
              />
            </div>
          </div>

          {/* Execute type indicator (only in EXECUTE mode) */}
          {currentState.mode === 'EXECUTE' && currentState.executeType && (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-[10px] text-gray-500 uppercase">Execution Type</div>
              <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {currentState.executeType === 'image' ? '🎨 Image' : currentState.executeType === 'video' ? '🎬 Video' : '📝 Text'}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-[10px] text-gray-500 uppercase">Has Disagreement</div>
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
              currentState.hasDisagreement
                ? "bg-red-500/20 text-red-500 border border-red-500/30"
                : "bg-green-500/20 text-green-500 border border-green-500/30"
            )}>
              {currentState.hasDisagreement ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
