class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.14,
    delay: number = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playJump(isDouble: boolean) {
    if (isDouble) {
      this.playTone(390, 620, 0.14, 'triangle', 0.13);
    } else {
      this.playTone(280, 460, 0.12, 'sine', 0.14);
    }
  }

  public playDuck() {
    this.playTone(240, 140, 0.09, 'sine', 0.08);
  }

  public playYuzu(combo: number) {
    const semitoneBoost = Math.min(combo, 12);
    const baseFreq = 523.25 * Math.pow(2, semitoneBoost / 12);
    this.playTone(baseFreq, baseFreq * 1.12, 0.11, 'triangle', 0.12);
  }

  public playGoldenYuzu() {
    this.playTone(659.25, 659.25, 0.1, 'triangle', 0.13, 0);
    this.playTone(880, 880, 0.14, 'triangle', 0.13, 0.06);
    this.playTone(1046.5, 1046.5, 0.2, 'sine', 0.14, 0.12);
  }

  public playPowerUp() {
    this.playTone(440, 554.37, 0.12, 'sine', 0.12, 0);
    this.playTone(554.37, 659.25, 0.12, 'sine', 0.12, 0.07);
    this.playTone(659.25, 880, 0.22, 'triangle', 0.14, 0.14);
  }

  public playFeverStart() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, n * 1.03, 0.18, 'triangle', 0.13, idx * 0.06);
    });
  }

  public playShieldBreak() {
    this.playTone(420, 180, 0.18, 'sawtooth', 0.09);
  }

  public playHit() {
    this.playTone(190, 75, 0.22, 'sawtooth', 0.12);
  }

  public playGameOver() {
    this.playTone(392, 349.23, 0.18, 'triangle', 0.12, 0);
    this.playTone(329.63, 293.66, 0.2, 'triangle', 0.12, 0.16);
    this.playTone(261.63, 196, 0.35, 'sine', 0.13, 0.34);
  }

  public playUnlock() {
    this.playTone(587.33, 587.33, 0.1, 'triangle', 0.12, 0);
    this.playTone(880, 880, 0.2, 'triangle', 0.13, 0.08);
  }

  public playSplash() {
    this.playTone(320, 150, 0.16, 'sine', 0.1, 0);
    this.playTone(460, 260, 0.14, 'triangle', 0.08, 0.05);
  }

  public playCameraShutter() {
    this.playTone(1150, 740, 0.045, 'square', 0.07, 0);
    this.playTone(860, 1280, 0.06, 'triangle', 0.08, 0.05);
  }

  public playTrainWhistle() {
    this.playTone(493.88, 523.25, 0.22, 'triangle', 0.07, 0);
    this.playTone(587.33, 587.33, 0.28, 'triangle', 0.06, 0.12);
  }

  public playSnore() {
    this.playTone(145, 110, 0.26, 'sine', 0.07, 0);
    this.playTone(130, 160, 0.22, 'sine', 0.05, 0.3);
  }

  public playChew() {
    this.playTone(310, 210, 0.07, 'triangle', 0.09, 0);
    this.playTone(340, 230, 0.07, 'triangle', 0.08, 0.14);
  }

  public playArcadeBeep() {
    this.playTone(523.25, 659.25, 0.07, 'square', 0.05, 0);
    this.playTone(783.99, 1046.5, 0.09, 'square', 0.05, 0.08);
  }

  public playCraft() {
    this.playTone(440, 587.33, 0.1, 'triangle', 0.12, 0);
    this.playTone(587.33, 880, 0.14, 'sine', 0.13, 0.09);
    this.playTone(880, 1174.66, 0.18, 'triangle', 0.12, 0.18);
  }

  public playPortalWarp() {
    this.playTone(260, 920, 0.28, 'sine', 0.13, 0);
    this.playTone(520, 1180, 0.24, 'triangle', 0.09, 0.08);
  }

  public playFestival() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((n, idx) => {
      this.playTone(n, n * 1.04, 0.16, 'triangle', 0.12, idx * 0.07);
    });
  }

  public playSpaceCollect() {
    this.playTone(620, 980, 0.11, 'sine', 0.1, 0);
    this.playTone(980, 1320, 0.1, 'triangle', 0.09, 0.07);
  }

  public playChestOpen() {
    this.playTone(587.33, 659.25, 0.11, 'triangle', 0.12, 0);
    this.playTone(783.99, 1046.5, 0.22, 'sine', 0.14, 0.1);
  }
}

export const soundEngine = new SoundEngine();
