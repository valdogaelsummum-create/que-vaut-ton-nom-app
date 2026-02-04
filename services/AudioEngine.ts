
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
  private statusCallback: (status: AudioStatus) => void = () => {};

  onStatusChange(callback: (status: AudioStatus) => void) {
    this.statusCallback = callback;
  }

  async init() {
    if (this.isInitialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.isInitialized = true;
      this.statusCallback('premium');
      this.playAnnounceSFX();
    } catch (e) {
      this.statusCallback('error');
    }
  }

  private playAnnounceSFX() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const playNote = (freq: number, start: number, duration: number, type: OscillatorType = 'square') => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    playNote(440.00, now, 0.1);
    playNote(554.37, now + 0.1, 0.1);
    playNote(659.25, now + 0.2, 0.3);
  }

  private playSuccessSFX() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const playBrass = (freq: number, start: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.4, start + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    };
    playBrass(523.25, now);
    playBrass(783.99, now + 0.15);
  }

  async announce(text: string, voice: VoiceType = 'female', isUrgent = false) {
    if (isUrgent) {
      this.queue.unshift({ text, voice, isUrgent });
      if (this.isInitialized) this.playSuccessSFX();
    } else {
      this.queue.push({ text, voice, isUrgent });
      if (this.isInitialized && !this.isSpeaking) this.playAnnounceSFX();
    }
    if (!this.isSpeaking) this.processQueue();
  }

  private async processQueue() {
    if (this.queue.length === 0 || !this.ctx) {
      this.isSpeaking = false;
      return;
    }

    this.isSpeaking = true;
    const announcement = this.queue.shift()!;
    const { text, voice } = announcement;

    if (!process.env.API_KEY) {
      this.useNativeFallback(text, voice);
      return;
    }

    try {
      await this.ctx.resume();
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const selectedVoice = voice === 'female' ? 'Kore' : 'Fenrir';
      
      const baseInstruction = `
        Tu es la présentatrice star du show TikTok "QUE VAUT TON NOM ?".
        Ton rôle est d'estimer la valeur financière et le prestige des noms des donateurs.
        Chaque euro envoyé (cadeau) est une unité de valeur pour leur nom.
        Utilise des termes comme : "Cote boursière", "Prestige", "Nom de luxe", "Estimation en hausse", "Valeur nette".
        Sois extrêmement dynamique, excitée, et enthousiaste.
        Fais sentir aux spectateurs que leur nom est une marque qui doit valoir cher !
        Ne sois jamais agressive, sois glamour et prestigieuse.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          systemInstruction: baseInstruction,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }, 
          },
        },
      });

      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        const audioData = this.decodeBase64(base64);
        const buffer = await this.decodePcm(audioData);
        const source = this.ctx.createBufferSource();
        const gainNode = this.ctx.createGain();
        gainNode.gain.value = 4.0; 
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        source.onended = () => {
          this.processQueue();
        };
        source.start(0);
      } else {
        throw new Error("No audio");
      }
    } catch (e) {
      this.useNativeFallback(text, voice);
    }
  }

  private useNativeFallback(text: string, voice: VoiceType) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.volume = 1.0; 
    utterance.rate = 1.1;
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
