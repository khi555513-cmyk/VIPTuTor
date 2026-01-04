
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, MessageSquare, Sparkles, Loader2, Play } from 'lucide-react';
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const startSession = async () => {
    if (!checkLimit()) {
      setError("Bạn đã hết lượt sử dụng trong ngày. Vui lòng nâng cấp gói VIP.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
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
            const serverContent = message.serverContent;
            if (!serverContent) return;

            // Xử lý Transcription an toàn
            if (serverContent.outputTranscription) {
              const text = serverContent.outputTranscription.text || '';
              setTranscription((prev): TranscriptionItem[] => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'model') {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...last, text: last.text + text };
                  return updated;
                }
                return [...prev, { role: 'model', text }];
              });
            } else if (serverContent.inputTranscription) {
              const text = serverContent.inputTranscription.text || '';
              setTranscription((prev): TranscriptionItem[] => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'user') {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...last, text: last.text + text };
                  return updated;
                }
                return [...prev, { role: 'user', text }];
              });
            }

            // Xử lý Audio an toàn
            const parts = serverContent.modelTurn?.parts;
            const base64Audio = (parts && parts.length > 0) ? parts[0].inlineData?.data : undefined;

            if (base64Audio) {
              setIsSpeaking(true);
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (serverContent.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e) => {
            console.error('Live error:', e);
            setError("Lỗi kết nối micro.");
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are a VIP English Tutor. You help students practice English through voice. Current student target: ${userProfile.target || 'General Fluency'}.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      setError("Không thể khởi động micro.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close().catch(() => {});
      outputAudioContextRef.current = null;
    }

    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-white p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center gap-8 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-4 py-1.5 rounded-full border border-indigo-500/30 mb-4 animate-pop-in">
             <Sparkles className="w-4 h-4 text-indigo-400" />
             <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">VIP Voice Room</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Gia sư AI Trực tuyến</h2>
        </div>

        <div className="relative flex items-center justify-center py-12">
           <div className={`absolute w-40 h-40 bg-indigo-500/20 rounded-full transition-transform duration-500 ${isSpeaking ? 'scale-[2.5] opacity-0' : 'scale-100 opacity-100'} animate-pulse`}></div>
           <div className={`relative w-40 h-40 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/20 border-4 border-white/10 ${isSpeaking ? 'animate-float' : ''}`}>
             <Volume2 className={`w-16 h-16 text-white transition-all ${isSpeaking ? 'scale-110' : 'scale-100'}`} />
           </div>
        </div>

        <div className="w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/5 h-64 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar shadow-inner">
           {transcription.length === 0 && !isActive && !isConnecting && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-8">
                 <Mic className="w-10 h-10 mb-4 opacity-20" />
                 <p className="text-sm">Bấm "Bắt đầu" để trò chuyện cùng Gia sư AI.</p>
              </div>
           )}
           {isConnecting && (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                 <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                 <p className="text-indigo-400 font-medium text-sm">Đang kết nối...</p>
              </div>
           )}
           {transcription.map((t, idx) => (
             <div key={idx} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium ${t.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                   {t.text}
                </div>
             </div>
           ))}
        </div>

        <div className="flex items-center gap-6 pb-8">
           <button onClick={onClose} className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all group border border-white/5">
              <PhoneOff className="w-6 h-6 text-red-500" />
           </button>

           {!isActive ? (
             <button 
               onClick={startSession}
               disabled={isConnecting}
               className={`h-16 px-10 rounded-full bg-white text-slate-950 font-bold flex items-center gap-3 shadow-xl transition-all ${isConnecting ? 'opacity-70 cursor-not-allowed' : ''}`}
             >
                {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {isConnecting ? 'Đang chuẩn bị...' : 'Bắt đầu Hội thoại'}
             </button>
           ) : (
             <button onClick={stopSession} className="h-16 px-10 rounded-full bg-indigo-600 text-white font-bold flex items-center gap-3 shadow-xl border border-white/10">
                <Mic className="w-5 h-5 animate-pulse" />
                Đang lắng nghe...
             </button>
           )}

           <button onClick={() => setTranscription([])} className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center border border-white/5">
              <MessageSquare className="w-6 h-6 text-slate-400" />
           </button>
        </div>

        {error && (
           <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl text-red-400 text-xs font-medium flex items-center gap-2 animate-pop-in">
              <MicOff className="w-4 h-4" />
              {error}
           </div>
        )}
      </div>
    </div>
  );
};

export default LiveTutor;
