
import { GoogleGenAI, Modality } from "@google/genai";

export type AudioStatus = 'premium' | 'fallback' | 'loading' | 'error';
export type VoiceType = 'female' | 'male';

interface Announcement {
  text: string;
  voice: VoiceType;
  isUrgent: boolean;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private queue: Announcement[] = [];
  private isSpeaking = false;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.isInitialized = true;
      console.log("AudioEngine: Initialisé");
    } catch (e) {
      console.warn("AudioEngine: Web Audio non supporté.");
    }
  }

  async announce(text: string, voice: VoiceType = 'female', isUrgent = false) {
    if (isUrgent) {
      this.queue.unshift({ text, voice, isUrgent });
    } else {
      this.queue.push({ text, voice, isUrgent });
    }
    if (!this.isSpeaking) this.processQueue();
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isSpeaking = false;
      return;
    }

    this.isSpeaking = true;
    const announcement = this.queue.shift()!;
    const { text, voice } = announcement;

    // Récupération sécurisée de la clé
    let apiKey = '';
    try {
      // @ts-ignore
      apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || '';
    } catch (e) {
      apiKey = '';
    }

    if (!apiKey) {
      this.useNativeFallback(text);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const selectedVoice = voice === 'female' ? 'Kore' : 'Fenrir';
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }, 
          },
        },
      });

      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64 && this.ctx) {
        const audioData = this.decodeBase64(base64);
        const buffer = await this.decodePcm(audioData);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.onended = () => this.processQueue();
        source.start(0);
      } else {
        this.useNativeFallback(text);
      }
    } catch (e) {
      console.error("AudioEngine Premium Error:", e);
      this.useNativeFallback(text);
    }
  }

  private useNativeFallback(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        this.isSpeaking = false;
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.onend = () => this.processQueue();
    window.speechSynthesis.speak(utterance);
  }

  private decodeBase64(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  private async decodePcm(data: Uint8Array): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = this.ctx!.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  }
}

export const audioEngine = new AudioEngine();
