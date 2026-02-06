
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
    } catch (e) {
      console.warn("AudioEngine: Web Audio non supporté, passage en fallback natif.");
    }
  }

  async announce(text: string, voice: VoiceType = 'female', isUrgent = false) {
    this.queue.push({ text, voice, isUrgent });
    if (isUrgent && this.isSpeaking) {
      // Priorité aux dons
      const current = this.queue.pop()!;
      this.queue.unshift(current);
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

    // Following Google GenAI guidelines: Use process.env.API_KEY directly.
    // Assume this variable is pre-configured and accessible in the execution context.
    if (!process.env.API_KEY) {
      this.useNativeFallback(text);
      return;
    }

    try {
      // Create a new instance right before use to ensure it uses the latest env state.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    // On annule les voix en cours pour éviter les chevauchements sur les dons
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.1;
    utterance.onend = () => this.processQueue();
    window.speechSynthesis.speak(utterance);
  }

  // Manual base64 decoding as per guidelines to avoid external library dependencies.
  private decodeBase64(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  // Raw PCM decoding as per Gemini API documentation for TTS responses.
  private async decodePcm(data: Uint8Array): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = this.ctx!.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  }
}

export const audioEngine = new AudioEngine();
