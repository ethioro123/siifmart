/**
 * Simple audio utility for warehouse scanner feedback
 * Uses Web Audio API to generate beeps without external assets
 */

export type BeepType = 'success' | 'error' | 'warning' | 'neutral';

// Cache the audio context to prevent creating too many contexts
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioContext) {
        // Handle standard and webkit prefix
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioContext = new AudioContextClass();
        }
    }
    return audioContext;
};

export const playBeep = (type: BeepType = 'neutral') => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Resume context if suspended (browser policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        // Configuration based on type
        switch (type) {
            case 'success':
                // High-pitched double beep
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1000, now);
                oscillator.frequency.setValueAtTime(1500, now + 0.1);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;

            case 'error':
                // Low-pitched buzz
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.linearRampToValueAtTime(100, now + 0.3);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;

            case 'warning':
                // Simple sine beep
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(440, now);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;

            default: // neutral
                // Short bloop
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, now);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
        }
    } catch (e) {
        console.error('Audio playback failed', e);
    }
};
