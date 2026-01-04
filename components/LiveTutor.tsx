
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, MessageSquare, Sparkles, Loader2, Play, Info, Settings2, Languages, Repeat } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import { UserProfile } from '../types';

interface LiveTutorProps {
  onClose: () => void;
  userProfile: UserProfile;
  checkLimit: () => boolean;
  incrementUsage: () => void;
}

interface TranscriptionItem {
  role: 'user' | 'model';
  text: string;
}

const LiveTutor: React.FC<LiveTutorProps> = ({ onClose, userProfile, checkLimit, incrementUsage }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [learningMode, setLearningMode] = useState<'conversation' | 'pronunciation'>('conversation');

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const transcriptionEndRef = useRef<HTMLDivElement>(null);

  // Animation states for waves
  const [waveHeights, setWaveHeights] = useState(Array(15).fill(4));

  useEffect(() => {
    if (status === 'speaking' || status === 'listening') {
      const interval = setInterval(() => {
        setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 32) + 4));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setWaveHeights(Array(15).fill(4));
    }
  }, [status]);

  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription]);

  const startSession = async () => {
    if (!checkLimit()) {
      setError("Hết lượt sử dụng VIP hôm nay. Nâng cấp ngay!");
      return;
    }

    setIsConnecting(true);
    setError(null);
    setStatus('thinking');

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key configuration missing");
      
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const systemInstruction = learningMode === 'pronunciation' 
        ? `You are an expert English phonetics coach. Listen to the student's pronunciation, correct it precisely, and explain how to position the mouth/tongue. Be very detailed about sounds like 'th', 'r', and 'l'. Target: ${userProfile.target}.`
        : `You are a friendly and professional English Tutor. Engage in natural conversation. If the student makes a mistake, correct it naturally in the flow of talk. Target: ${userProfile.target}.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setStatus('listening');
            incrementUsage();

            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text || '';
              setTranscription(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'model') return [...prev.slice(0, -1), { role: 'model', text: last.text + text }];
                return [...prev, { role: 'model', text }];
              });
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text || '';
              setTranscription(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'user') return [...prev.slice(0, -1), { role: 'user', text: last.text + text }];
                return [...prev, { role: 'user', text }];
              });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;

            if (base64Audio) {
              setStatus('speaking');
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onerror: (e) => {
            setError("Mất kết nối âm thanh. Vui lòng thử lại.");
            stopSession();
          },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: systemInstruction
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      setError("Không thể khởi động micro. Vui lòng kiểm tra quyền truy cập.");
      setIsConnecting(false);
      setStatus('idle');
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    setStatus('idle');
    
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (outputAudioContextRef.current) outputAudioContextRef.current.close().catch(() => {});

    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const decode = (b64: string) => {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let bin = '';
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, rate: number, channels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const count = dataInt16.length / channels;
    const buffer = ctx.createBuffer(channels, count, rate);
    for (let c = 0; c < channels; c++) {
      const cData = buffer.getChannelData(c);
      for (let i = 0; i < count; i++) cData[i] = dataInt16[i * channels + c] / 32768.0;
    }
    return buffer;
  };

  useEffect(() => { return () => stopSession(); }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between text-white overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] transition-all duration-1000 ${status === 'speaking' ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] transition-all duration-1000 ${status === 'listening' ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`}></div>
      </div>

      {/* Header */}
      <div className="w-full flex items-center justify-between px-6 pt-8 z-10 shrink-0">
        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl backdrop-blur-md transition-all active:scale-95">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Live Session Active</span>
          </div>
          <h2 className="text-lg font-bold">Gia sư Giọng nói</h2>
        </div>
        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl backdrop-blur-md transition-all active:scale-95">
          <Settings2 className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {/* Central Visualizer Section */}
      <div className="flex-1 w-full flex flex-col items-center justify-center p-6 gap-10 relative z-10">
        
        {/* Visual Feedback Circle */}
        <div className="relative group">
           <div className={`absolute inset-0 bg-indigo-500/20 rounded-full blur-[40px] transition-all duration-500 ${status !== 'idle' ? 'scale-150' : 'scale-0'}`}></div>
           
           <div className={`w-48 h-48 md:w-56 md:h-56 rounded-full bg-slate-900 border-4 border-white/5 shadow-2xl flex flex-col items-center justify-center relative z-10 transition-all duration-500 ${status === 'speaking' ? 'ring-[12px] ring-indigo-500/20 scale-105' : status === 'listening' ? 'ring-[12px] ring-purple-500/20 scale-105' : ''}`}>
              
              {status === 'thinking' ? (
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
              ) : (
                <div className="flex items-center gap-1.5 h-16">
                  {waveHeights.map((h, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 rounded-full transition-all duration-150 ${status === 'speaking' ? 'bg-indigo-400' : status === 'listening' ? 'bg-purple-400' : 'bg-slate-700'}`}
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              )}
              
              <div className="mt-4 text-center">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                   {status === 'listening' ? 'Listening...' : status === 'speaking' ? 'AI Speaking' : status === 'thinking' ? 'Processing' : 'Ready'}
                 </p>
                 <span className="text-xs font-medium text-slate-300">{learningMode === 'conversation' ? 'Conversation Mode' : 'Phonetics Mode'}</span>
              </div>
           </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-white/5 p-1 rounded-2xl backdrop-blur-xl border border-white/5 shadow-inner">
           <button 
             onClick={() => setLearningMode('conversation')}
             className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${learningMode === 'conversation' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
           >
             <Languages className="w-4 h-4" /> Hội thoại
           </button>
           <button 
             onClick={() => setLearningMode('pronunciation')}
             className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${learningMode === 'pronunciation' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
           >
             <Repeat className="w-4 h-4" /> Phát âm
           </button>
        </div>

        {/* Transcription Preview (Mini) */}
        <div className="w-full max-w-lg bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-4 h-40 overflow-y-auto no-scrollbar shadow-inner text-center">
           {transcription.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                <MessageSquare className="w-8 h-8 mb-2" />
                <p className="text-xs italic">Nội dung hội thoại sẽ hiển thị tại đây...</p>
             </div>
           ) : (
             <div className="space-y-3">
                {transcription.map((t, i) => (
                  <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                     <span className={`px-4 py-2 rounded-2xl text-sm ${t.role === 'user' ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/20' : 'bg-slate-800 text-slate-200'}`}>
                        {t.text}
                     </span>
                  </div>
                ))}
                <div ref={transcriptionEndRef} />
             </div>
           )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="w-full bg-slate-950/80 backdrop-blur-2xl px-6 pb-12 pt-6 flex items-center justify-center gap-8 border-t border-white/5 z-20 shrink-0">
        <button 
          onClick={() => { stopSession(); onClose(); }}
          className="w-14 h-14 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-all group active:scale-90"
          title="Kết thúc"
        >
          <PhoneOff className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
        </button>

        {!isActive ? (
          <button 
            onClick={startSession}
            disabled={isConnecting}
            className="h-20 px-12 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black text-lg shadow-[0_10px_40px_rgb(99,102,241,0.4)] hover:shadow-[0_15px_50px_rgb(99,102,241,0.5)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-4"
          >
            {isConnecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
            {isConnecting ? 'ĐANG KẾT NỐI' : 'BẮT ĐẦU HỌC'}
          </button>
        ) : (
          <button 
            onClick={stopSession}
            className="h-20 px-12 rounded-full bg-white text-slate-900 font-black text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4 animate-pulse"
          >
            <div className="w-3 h-3 rounded-full bg-indigo-600 animate-ping"></div>
            ĐANG LẮNG NGHE
          </button>
        )}

        <button 
          className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90"
          title="Ghi chú"
        >
          <Languages className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-pop-in z-50">
           <Info className="w-5 h-5" />
           <span className="text-sm font-bold">{error}</span>
        </div>
      )}
    </div>
  );
};

// Internal utility component
const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);

export default LiveTutor;
