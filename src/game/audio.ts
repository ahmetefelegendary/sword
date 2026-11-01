/**
 * High-Performance Fantasy RPG Audio Engine
 *
 * 100% Royalty-Free (CC0 / Open Fantasy Assets):
 * - Dual Audio Architecture:
 *   1) Native HTML5 Audio for streaming looped background music (Battle & Boss themes)
 *   2) Web Audio API (AudioContext + AudioBufferSourceNode) for low-latency polyphonic SFX
 *   3) Instant Procedural Synthesizer fallback (Zero Silence guarantee on cold-start / slow fetch)
 * - Safari / iOS WKWebView compliant (AudioContext user-gesture unlock & legacy callback decode)
 * - Ultra-compact M4A (AAC) + WAV fallback for maximum iOS performance and minimal memory
 */

import { HeroClass } from './types';

// Helper to resolve asset URLs cleanly in Web & Capacitor iOS/Android environments
function getAssetUrl(relativePath: string): string {
  if (typeof window !== 'undefined') {
    try {
      const base = window.location.origin + window.location.pathname;
      const cleanBase = base.endsWith('/') ? base : base.substring(0, base.lastIndexOf('/') + 1);
      return new URL(relativePath, cleanBase).href;
    } catch {
      return '/' + relativePath.replace(/^\/+/, '');
    }
  }
  return '/' + relativePath.replace(/^\/+/, '');
}

// Safely decode audio buffer across both modern and legacy Safari/iOS WebKit
async function decodeAudioDataSafe(ctx: AudioContext, buffer: ArrayBuffer): Promise<AudioBuffer> {
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {}
  }
  return new Promise((resolve, reject) => {
    // Copy buffer because WebKit detaches ArrayBuffers during decodeAudioData
    const copy = buffer.slice(0);
    try {
      const promise = ctx.decodeAudioData(
        copy,
        (decoded) => resolve(decoded),
        (err) => reject(err)
      );
      if (promise && typeof (promise as unknown as Promise<AudioBuffer>).then === 'function') {
        (promise as unknown as Promise<AudioBuffer>).then(resolve).catch(reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

class RealAudioEngine {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public musicEnabled: boolean = true;

  private sfxGain: GainNode | null = null;
  private sfxBuffers: Map<string, AudioBuffer> = new Map();
  private loadingBuffers: Set<string> = new Set();

  // Background Music
  private currentBgm: HTMLAudioElement | null = null;
  public isBossMode: boolean = false;
  private isUnlocked: boolean = false;

  private readonly SFX_NAMES = [
    'sword_knight',
    'dagger_rogue',
    'spell_mage',
    'dash_knight',
    'dash_rogue',
    'dash_mage',
    'special_knight',
    'special_rogue',
    'special_mage',
    'hit_metal',
    'hit_heavy',
    'player_hurt',
    'coin',
    'levelup',
    'boss_roar',
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      // Setup global touch/click listeners to immediately unlock audio on first interaction
      const unlockHandler = () => {
        this.unlockAudio();
      };
      const events = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown', 'click'];
      events.forEach((evt) => {
        window.addEventListener(evt, unlockHandler, { once: false, passive: true, capture: true });
      });

      // Start pre-buffering sounds as early as possible
      this.initCtx();
    }
  }

  private initCtx() {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.9;
        this.sfxGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.preloadAllSfx();
  }

  public unlockAudio() {
    this.isUnlocked = true;
    this.initCtx();

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.musicEnabled) {
      this.startBgm();
    }
  }

  private async preloadAllSfx() {
    if (!this.ctx) return;

    for (const name of this.SFX_NAMES) {
      if (this.sfxBuffers.has(name) || this.loadingBuffers.has(name)) continue;
      this.loadSound(name);
    }
  }

  private async loadSound(name: string) {
    if (!this.ctx || this.sfxBuffers.has(name) || this.loadingBuffers.has(name)) return;
    this.loadingBuffers.add(name);

    // Try .m4a first (10x smaller, native on iOS), fallback to .wav
    const urls = [
      getAssetUrl(`audio/sfx/${name}.m4a`),
      getAssetUrl(`audio/sfx/${name}.wav`),
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const arrayBuf = await res.arrayBuffer();
        if (arrayBuf.byteLength === 0) continue;

        if (this.ctx) {
          const audioBuf = await decodeAudioDataSafe(this.ctx, arrayBuf);
          if (audioBuf) {
            this.sfxBuffers.set(name, audioBuf);
            this.loadingBuffers.delete(name);
            return;
          }
        }
      } catch {
        // Fallback to next format or procedural synthesis
      }
    }

    this.loadingBuffers.delete(name);
  }

  private playBuffer(name: string, volume: number = 1.0, pitch: number = 1.0): boolean {
    if (!this.soundEnabled || !this.ctx || !this.sfxGain) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const buffer = this.sfxBuffers.get(name);
    if (!buffer) {
      // Trigger lazy load if not already started
      this.loadSound(name);
      return false;
    }

    try {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = pitch;

      const gain = this.ctx.createGain();
      gain.gain.value = Math.max(0, Math.min(1.2, volume));

      src.connect(gain);
      gain.connect(this.sfxGain);

      src.start(0);
      return true;
    } catch {
      return false;
    }
  }

  // --- PROCEDURAL SYNTHESIS (Zero-Silence Instant Fallback) ---
  private synthSlash(pitchMod: number = 1.0) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450 * pitchMod, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  private synthDash() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  private synthHit(heavy: boolean = false) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = heavy ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(heavy ? 120 : 260, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + (heavy ? 0.22 : 0.1));

      gain.gain.setValueAtTime(heavy ? 0.7 : 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (heavy ? 0.22 : 0.1));

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + (heavy ? 0.22 : 0.1));
    } catch {}
  }

  private synthCoin() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  private synthLevelUp() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.35, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.2);
      });
    } catch {}
  }

  // --- BACKGROUND MUSIC ---
  public toggleSound(val?: boolean): boolean {
    this.soundEnabled = val !== undefined ? val : !this.soundEnabled;
    return this.soundEnabled;
  }

  public toggleMusic(val?: boolean): boolean {
    this.musicEnabled = val !== undefined ? val : !this.musicEnabled;
    if (this.musicEnabled) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
    return this.musicEnabled;
  }

  public setBossMode(isBoss: boolean) {
    if (this.isBossMode === isBoss) return;
    this.isBossMode = isBoss;

    if (this.musicEnabled) {
      this.startBgm();
    }
  }

  private startBgm() {
    if (typeof window === 'undefined') return;

    const targetFile = this.isBossMode ? 'boss_theme.m4a' : 'battle_theme.m4a';
    const targetUrl = getAssetUrl(`audio/music/${targetFile}`);

    if (!this.currentBgm || this.currentBgm.src.indexOf(targetFile) === -1) {
      if (this.currentBgm) {
        this.currentBgm.pause();
        this.currentBgm = null;
      }
      this.currentBgm = new Audio(targetUrl);
      this.currentBgm.loop = true;
      this.currentBgm.volume = this.isBossMode ? 0.42 : 0.35;
    }

    if (this.musicEnabled && this.currentBgm.paused) {
      this.currentBgm.play().catch(() => {});
    }
  }

  private stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.pause();
    }
  }

  // --- PUBLIC SFX TRIGGERS (Recorded Assets + Instant Fallback) ---
  public playSlash(heroClass: HeroClass = 'knight') {
    if (!this.soundEnabled) return;
    this.initCtx();

    const pitch = 0.96 + Math.random() * 0.08;
    let played = false;

    if (heroClass === 'knight') {
      played = this.playBuffer('sword_knight', 1.0, pitch);
    } else if (heroClass === 'rogue') {
      played = this.playBuffer('dagger_rogue', 0.95, pitch * 1.1);
    } else if (heroClass === 'mage') {
      played = this.playBuffer('spell_mage', 0.9, pitch);
    }

    if (!played) {
      this.synthSlash(heroClass === 'rogue' ? 1.3 : heroClass === 'mage' ? 0.8 : 1.0);
    }
  }

  public playDash(heroClass: HeroClass = 'knight') {
    if (!this.soundEnabled) return;
    this.initCtx();

    let played = false;
    if (heroClass === 'knight') {
      played = this.playBuffer('dash_knight', 0.85, 1.0);
    } else if (heroClass === 'rogue') {
      played = this.playBuffer('dash_rogue', 0.85, 1.1);
    } else if (heroClass === 'mage') {
      played = this.playBuffer('dash_mage', 0.9, 1.05);
    }

    if (!played) {
      this.synthDash();
    }
  }

  public playSpecial(heroClass: HeroClass = 'knight') {
    if (!this.soundEnabled) return;
    this.initCtx();

    let played = false;
    if (heroClass === 'knight') {
      played = this.playBuffer('special_knight', 1.0, 1.0);
    } else if (heroClass === 'rogue') {
      played = this.playBuffer('special_rogue', 1.0, 1.15);
    } else if (heroClass === 'mage') {
      played = this.playBuffer('special_mage', 1.0, 0.95);
    }

    if (!played) {
      this.synthSlash(0.7);
    }
  }

  public playHit(heavy: boolean = false) {
    if (!this.soundEnabled) return;
    this.initCtx();

    const pitch = 0.96 + Math.random() * 0.1;
    let played = false;

    if (heavy) {
      played = this.playBuffer('hit_heavy', 1.0, pitch * 0.9);
      this.playBuffer('hit_metal', 0.7, pitch);
    } else {
      played = this.playBuffer('hit_metal', 0.85, pitch * 1.05);
    }

    if (!played) {
      this.synthHit(heavy);
    }
  }

  public playHurt() {
    if (!this.soundEnabled) return;
    this.initCtx();

    const played = this.playBuffer('player_hurt', 0.9, 0.96 + Math.random() * 0.08);
    if (!played) {
      this.synthHit(true);
    }
  }

  public playCoin() {
    if (!this.soundEnabled) return;
    this.initCtx();

    const played = this.playBuffer('coin', 0.8, 1.0);
    if (!played) {
      this.synthCoin();
    }
  }

  public playLevelUp() {
    if (!this.soundEnabled) return;
    this.initCtx();

    const played = this.playBuffer('levelup', 1.0, 1.0);
    if (!played) {
      this.synthLevelUp();
    }
  }

  public playBossRoar() {
    if (!this.soundEnabled) return;
    this.initCtx();

    const played = this.playBuffer('boss_roar', 1.0, 0.9);
    if (!played) {
      this.synthHit(true);
    }
  }

  public playTelegraph() {
    if (!this.soundEnabled) return;
    this.initCtx();

    const played = this.playBuffer('hit_metal', 0.45, 1.4);
    if (!played) {
      this.synthSlash(1.5);
    }
  }

  public destroy() {
    this.stopBgm();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audio = new RealAudioEngine();
