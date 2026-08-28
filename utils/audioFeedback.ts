// --- Synthesized Web Audio API Engine for POS & Warehouse Operations ---

class AudioFeedbackEngine {
    private ctx: AudioContext | null = null;
    private enabled: boolean = true;
    private volume: number = 0.6;

    constructor() {
        if (typeof window !== 'undefined') {
            const savedEnabled = localStorage.getItem('siifmart_audio_enabled');
            this.enabled = savedEnabled !== null ? savedEnabled === 'true' : true;
            const savedVol = localStorage.getItem('siifmart_audio_volume');
            this.volume = savedVol ? parseFloat(savedVol) : 0.6;
        }
    }

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (typeof window !== 'undefined') {
            localStorage.setItem('siifmart_audio_enabled', String(enabled));
        }
    }

    public setVolume(vol: number): void {
        this.volume = Math.max(0, Math.min(1, vol));
        if (typeof window !== 'undefined') {
            localStorage.setItem('siifmart_audio_volume', String(this.volume));
        }
    }

    // 1. Crisp high double-tone chime on barcode scan verification
    public playScanSuccess(): void {
        if (!this.enabled) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(this.volume * 0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        gainNode.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1760, now + 0.05); // A6
        osc.connect(gainNode);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // 2. Low warning buzz for mismatched barcode or invalid SKU
    public playScanError(): void {
        if (!this.enabled) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(this.volume * 0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        gainNode.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.setValueAtTime(130, now + 0.15);
        osc.connect(gainNode);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    // 3. Cheerful C-Major arpeggio on checkout / sale completion
    public playSaleComplete(): void {
        if (!this.enabled) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const noteDuration = 0.08;

        notes.forEach((freq, idx) => {
            const noteStart = now + (idx * noteDuration);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(this.volume * 0.35, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);
            gain.connect(ctx.destination);

            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteStart);
            osc.connect(gain);

            osc.start(noteStart);
            osc.stop(noteStart + 0.25);
        });
    }

    // 4. Attention chime for offline switch or low stock warning
    public playWarning(): void {
        if (!this.enabled) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        gain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(440.00, now + 0.1); // A4
        osc.connect(gain);

        osc.start(now);
        osc.stop(now + 0.25);
    }
}

export const audioFeedback = new AudioFeedbackEngine();
