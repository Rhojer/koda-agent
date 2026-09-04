import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Sparkles, 
  Square, 
  Radio, 
  Settings2, 
  ChevronDown, 
  Activity,
  Play
} from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
import { Badge } from "@nous-research/ui/ui/components/badge";
import { Card } from "@nous-research/ui/ui/components/card";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export interface KodaVoiceWidgetProps {
  onSendMessage?: (message: string) => void;
  lastAssistantMessage?: string;
  className?: string;
}

const KODA_VOICES = [
  { id: "es-ES-AlvaroNeural", name: "KODA (Español)", lang: "es-ES", flag: "🇪🇸" },
  { id: "en-GB-RyanNeural", name: "KODA (English)", lang: "en-GB", flag: "🇬🇧" },
  { id: "es-ES-AbrilNeural", name: "F.R.I.D.A.Y. (Español)", lang: "es-ES", flag: "🇪🇸" },
  { id: "en-GB-ThomasNeural", name: "KODA Deep (UK)", lang: "en-GB", flag: "🇬🇧" },
];

export function cleanMarkdownForSpeech(text: string): string {
  if (!text) return "";
  return text
    // Strip ANSI escape codes
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "")
    // Strip fenced code blocks
    .replace(/```[\s\S]*?```/g, " [Bloque de código omitido] ")
    // Strip inline code
    .replace(/`([^`]+)`/g, "$1")
    // Strip URLs
    .replace(/https?:\/\/\S+/g, "enlace web")
    // Strip markdown formatting like bold/italics/headers
    .replace(/[#*_~`>\[\]]/g, "")
    // Clean excessive whitespaces
    .replace(/\s+/g, " ")
    .trim();
}

export function KodaVoiceWidget({
  onSendMessage,
  lastAssistantMessage,
  className,
}: KodaVoiceWidgetProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("hermes.jarvis.audio_mode") !== "false";
    } catch {
      return true;
    }
  });

  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    try {
      return localStorage.getItem("hermes.jarvis.voice_id") || "es-ES-AlvaroNeural";
    } catch {
      return "es-ES-AlvaroNeural";
    }
  });

  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "listening" | "transcribing" | "synthesizing" | "speaking" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string>("Sistemas listos, Señor.");
  const [showVoicePicker, setShowVoicePicker] = useState<boolean>(false);
  const [transcriptPreview, setTranscriptPreview] = useState<string>("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const lastSpokenMsgRef = useRef<string>("");

  useEffect(() => {
    try {
      localStorage.setItem("hermes.jarvis.audio_mode", String(isEnabled));
    } catch {}
  }, [isEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem("hermes.jarvis.voice_id", selectedVoice);
    } catch {}
  }, [selectedVoice]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setVoiceStatus("idle");
    setStatusMessage("Listo, Señor.");
  }, []);

  const speakText = useCallback(
    async (rawText: string) => {
      if (!rawText || !rawText.trim()) return;
      const clean = cleanMarkdownForSpeech(rawText);
      if (!clean) return;

      stopAudio();
      setVoiceStatus("synthesizing");
      setStatusMessage("KODA sintetizando voz...");

      try {
        const response = await api.speak(clean);
        if (!response?.data_url) {
          throw new Error("No se recibió flujo de audio.");
        }

        const audio = new Audio(response.data_url);
        audioRef.current = audio;

        audio.onplay = () => {
          setVoiceStatus("speaking");
          setStatusMessage("KODA respondiendo en audio...");
        };

        audio.onended = () => {
          setVoiceStatus("idle");
          setStatusMessage("A la espera de instrucciones, Señor.");
          audioRef.current = null;
        };

        audio.onerror = () => {
          setVoiceStatus("error");
          setStatusMessage("Error al reproducir voz.");
          audioRef.current = null;
          setTimeout(() => {
            setVoiceStatus("idle");
            setStatusMessage("Listo, Señor.");
          }, 3000);
        };

        await audio.play();
      } catch (err) {
        console.warn("[KodaVoice] Síntesis en backend falló:", err);
        // Fallback to browser Web Speech API
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(clean);
            const voiceObj = KODA_VOICES.find((v) => v.id === selectedVoice);
            if (voiceObj) utterance.lang = voiceObj.lang;

            utterance.onstart = () => {
              setVoiceStatus("speaking");
              setStatusMessage("KODA hablando...");
            };
            utterance.onend = () => {
              setVoiceStatus("idle");
              setStatusMessage("Listo, Señor.");
            };
            utterance.onerror = () => {
              setVoiceStatus("idle");
              setStatusMessage("Listo, Señor.");
            };

            window.speechSynthesis.speak(utterance);
          } catch {
            setVoiceStatus("error");
            setStatusMessage("Audio no disponible.");
            setTimeout(() => setVoiceStatus("idle"), 2500);
          }
        } else {
          setVoiceStatus("error");
          setStatusMessage("Error en síntesis.");
          setTimeout(() => setVoiceStatus("idle"), 2500);
        }
      }
    },
    [selectedVoice, stopAudio]
  );

  // Auto-speak incoming assistant responses if enabled
  useEffect(() => {
    if (!isEnabled || !lastAssistantMessage) return;
    if (lastAssistantMessage === lastSpokenMsgRef.current) return;

    lastSpokenMsgRef.current = lastAssistantMessage;
    void speakText(lastAssistantMessage);
  }, [isEnabled, lastAssistantMessage, speakText]);

  // Voice recording / Speech-to-Text
  const startRecording = async () => {
    stopAudio();
    setTranscriptPreview("");

    // Try Web Speech API for real-time recognition if available
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        speechRecognitionRef.current = recognition;
        const voiceObj = KODA_VOICES.find((v) => v.id === selectedVoice);
        recognition.lang = voiceObj?.lang || "es-ES";
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setVoiceStatus("listening");
          setStatusMessage("Escuchando su voz, Señor...");
        };

        recognition.onresult = (event: any) => {
          let text = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
          setTranscriptPreview(text);
          if (event.results[0].isFinal && text.trim()) {
            setStatusMessage(`Comando recibido: "${text}"`);
            onSendMessage?.(text.trim());
            setVoiceStatus("idle");
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("[KodaVoice] Speech recognition error:", event.error);
          setVoiceStatus("idle");
          setStatusMessage("No pude escuchar con claridad, Señor.");
        };

        recognition.onend = () => {
          if (voiceStatus === "listening") {
            setVoiceStatus("idle");
            setStatusMessage("Listo, Señor.");
          }
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn("[KodaVoice] Web Speech API init failed, trying MediaRecorder:", e);
      }
    }

    // MediaRecorder fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setVoiceStatus("transcribing");
        setStatusMessage("Procesando comando de voz...");

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = (reader.result as string).split(",")[1];
            const res = await api.transcribe(base64Audio, "audio/webm");
            if (res?.text && res.text.trim()) {
              setStatusMessage(`Comando: "${res.text.trim()}"`);
              onSendMessage?.(res.text.trim());
            } else {
              setStatusMessage("No se detectó voz clara, Señor.");
            }
          } catch (err) {
            console.error("[KodaVoice] Error en transcripción:", err);
            setStatusMessage("Error al transcribir voz.");
          } finally {
            setVoiceStatus("idle");
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setVoiceStatus("listening");
      setStatusMessage("Escuchando su voz, Señor...");
    } catch (err) {
      console.error("[KodaVoice] Mic access error:", err);
      setVoiceStatus("error");
      setStatusMessage("Permiso de micrófono denegado.");
      setTimeout(() => setVoiceStatus("idle"), 3000);
    }
  };

  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const activeVoiceObj = KODA_VOICES.find((v) => v.id === selectedVoice) || KODA_VOICES[0];

  return (
    <Card className={cn("overflow-hidden border border-cyan-500/30 bg-black/40 backdrop-blur-md p-3 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]", className)}>
      {/* Header with Koda Arc Reactor */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          {/* Arc Reactor Glowing Orb */}
          <div className="relative flex items-center justify-center size-8">
            <div
              className={cn(
                "absolute inset-0 rounded-full border border-cyan-400/40 transition-all duration-700",
                voiceStatus === "speaking" ? "animate-spin scale-110 border-cyan-300 shadow-[0_0_12px_#06b6d4]" :
                voiceStatus === "listening" ? "animate-ping border-amber-400" :
                voiceStatus === "synthesizing" ? "animate-pulse border-blue-400" : "opacity-60"
              )}
            />
            <div
              className={cn(
                "size-5 rounded-full transition-all duration-300 flex items-center justify-center",
                voiceStatus === "speaking" ? "bg-cyan-400 shadow-[0_0_10px_#22d3ee]" :
                voiceStatus === "listening" ? "bg-amber-400 shadow-[0_0_10px_#fbbf24]" :
                voiceStatus === "synthesizing" ? "bg-blue-500 shadow-[0_0_10px_#3b82f6]" :
                isEnabled ? "bg-cyan-600/60 shadow-[0_0_6px_#0891b2]" : "bg-zinc-700 opacity-40"
              )}
            >
              <Sparkles className="size-2.5 text-black" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-wider text-cyan-300 font-mono">KODA AUDIO</span>
              <Badge
                tone={isEnabled ? "success" : "neutral"}
                className="text-[9px] px-1.5 py-0 uppercase font-mono tracking-tighter"
              >
                {isEnabled ? "ONLINE" : "MUTED"}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[150px] sm:max-w-[180px]">
              {statusMessage}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {voiceStatus === "speaking" && (
            <Button
              size="icon"
              ghost
              onClick={stopAudio}
              title="Detener audio"
              className="size-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Square className="size-3.5 fill-current" />
            </Button>
          )}

          <Button
            size="icon"
            ghost
            onClick={() => setIsEnabled(!isEnabled)}
            title={isEnabled ? "Desactivar audio automático de Koda" : "Activar audio automático de Koda"}
            className={cn(
              "size-7 transition-colors",
              isEnabled ? "text-cyan-400 hover:bg-cyan-500/10" : "text-zinc-500 hover:bg-zinc-800"
            )}
          >
            {isEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </Button>

          <Button
            size="icon"
            ghost
            onClick={() => (voiceStatus === "listening" ? stopRecording() : startRecording())}
            title={voiceStatus === "listening" ? "Detener grabación" : "Hablar con Koda (Micrófono)"}
            className={cn(
              "size-7 transition-colors",
              voiceStatus === "listening"
                ? "text-amber-400 bg-amber-500/20 animate-pulse"
                : "text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            )}
          >
            {voiceStatus === "listening" ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </Button>

          <Button
            size="icon"
            ghost
            onClick={() => setShowVoicePicker(!showVoicePicker)}
            title="Seleccionar voz de Koda"
            className="size-7 text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10"
          >
            <Settings2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Voice picker panel */}
      {showVoicePicker && (
        <div className="mt-2.5 pt-2 border-t border-cyan-500/20 grid grid-cols-2 gap-1.5">
          {KODA_VOICES.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setSelectedVoice(v.id);
                setShowVoicePicker(false);
                void speakText(`Voz de ${v.name} activada. A sus órdenes, Señor.`);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] font-mono transition-all text-left",
                selectedVoice === v.id
                  ? "bg-cyan-500/20 border border-cyan-400/50 text-cyan-200"
                  : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-cyan-500/30 hover:text-zinc-200"
              )}
            >
              <span>{v.flag}</span>
              <span className="truncate">{v.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Transcript live preview if speaking or listening */}
      {transcriptPreview && (
        <div className="mt-2 p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 font-mono flex items-center gap-1.5">
          <Activity className="size-3.5 animate-pulse text-amber-400 shrink-0" />
          <span className="truncate">{transcriptPreview}</span>
        </div>
      )}

      {/* Quick Play Last Assistant Response Button */}
      {lastAssistantMessage && voiceStatus !== "speaking" && (
        <div className="mt-2 pt-2 border-t border-cyan-500/15 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[140px]">
            Última respuesta disponible
          </span>
          <Button
            size="sm"
            ghost
            onClick={() => speakText(lastAssistantMessage)}
            className="h-6 px-2 text-[10px] text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/15 gap-1 font-mono"
          >
            <Play className="size-2.5 fill-current" />
            <span>Escuchar respuesta</span>
          </Button>
        </div>
      )}
    </Card>
  );
}
