import * as Tone from 'tone';

export type MusicTrack = 'menu' | 'playing' | 'boss' | 'stopped';

class MusicEngine {
  private initialized = false;
  private muted = false;
  private currentTrack: MusicTrack = 'stopped';

  private menuPart: Tone.Part | null = null;
  private lofiChords: Tone.Part | null = null;
  private lofiMelody: Tone.Part | null = null;
  private lofiBass: Tone.Part | null = null;
  private bossPart: Tone.Part | null = null;

  private menuSynth: Tone.PolySynth | null = null;
  private lofiPad: Tone.PolySynth | null = null;
  private lofiLead: Tone.Synth | null = null;
  private bassSynth: Tone.MonoSynth | null = null;
  private bossSynth: Tone.PolySynth | null = null;

  public async ensureReady(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (Tone.getContext().state !== 'running') {
      await Tone.start().catch(() => {});
    }
    if (this.initialized) return;
    this.initialized = true;

    Tone.getDestination().mute = this.muted;

    // Warm Lo-fi filter & reverb
    const lofiFilter = new Tone.Filter(1350, 'lowpass').toDestination();
    const warmReverb = new Tone.Reverb({ decay: 2.4, wet: 0.28 }).connect(lofiFilter);

    this.menuSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.015, decay: 0.22, sustain: 0.15, release: 0.45 },
      volume: -14,
    }).connect(warmReverb);

    this.lofiPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.18, decay: 0.5, sustain: 0.55, release: 1.2 },
      volume: -18,
    }).connect(warmReverb);

    this.lofiLead = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.04, decay: 0.3, sustain: 0.2, release: 0.6 },
      volume: -17,
    }).connect(warmReverb);

    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.03, decay: 0.25, sustain: 0.5, release: 0.4 },
      volume: -16,
    }).toDestination();

    this.bossSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.16, sustain: 0.2, release: 0.25 },
      volume: -19,
    }).connect(lofiFilter);

    // 1. Cheerful Menu Track (upbeat marimba/kalimba feel)
    const menuEvents: { time: string; note: string | string[]; dur: string }[] = [
      { time: '0:0:0', note: ['C4', 'E4', 'G4'], dur: '4n' },
      { time: '0:0:2', note: 'E5', dur: '8n' },
      { time: '0:1:0', note: 'G5', dur: '8n' },
      { time: '0:1:2', note: 'A5', dur: '8n' },
      { time: '0:2:0', note: ['F4', 'A4', 'C5'], dur: '4n' },
      { time: '0:2:2', note: 'G5', dur: '8n' },
      { time: '0:3:0', note: 'E5', dur: '8n' },
      { time: '0:3:2', note: 'D5', dur: '8n' },
      { time: '1:0:0', note: ['G4', 'B4', 'D5'], dur: '4n' },
      { time: '1:0:2', note: 'C5', dur: '8n' },
      { time: '1:1:0', note: 'D5', dur: '8n' },
      { time: '1:1:2', note: 'E5', dur: '8n' },
      { time: '1:2:0', note: ['C4', 'G4', 'C5'], dur: '4n' },
      { time: '1:3:0', note: 'G4', dur: '8n' },
      { time: '1:3:2', note: 'C5', dur: '8n' },
    ];
    this.menuPart = new Tone.Part((time, val) => {
      this.menuSynth?.triggerAttackRelease(val.note, val.dur, time);
    }, menuEvents);
    this.menuPart.loop = true;
    this.menuPart.loopEnd = '2m';

    // 2. Relaxing Lo-Fi Ambient Playing Track (Fmaj7 -> Em7 -> Dm7 -> Cmaj7)
    const chordEvents = [
      { time: '0:0:0', note: ['F3', 'A3', 'C4', 'E4'], dur: '2n.' },
      { time: '1:0:0', note: ['E3', 'G3', 'B3', 'D4'], dur: '2n.' },
      { time: '2:0:0', note: ['D3', 'F3', 'A3', 'C4'], dur: '2n.' },
      { time: '3:0:0', note: ['C3', 'E3', 'G3', 'B3'], dur: '2n.' },
    ];
    this.lofiChords = new Tone.Part((time, val) => {
      this.lofiPad?.triggerAttackRelease(val.note, val.dur, time);
    }, chordEvents);
    this.lofiChords.loop = true;
    this.lofiChords.loopEnd = '4m';

    const lofiLeadEvents = [
      { time: '0:1:0', note: 'A4', dur: '4n' },
      { time: '0:2:2', note: 'G4', dur: '8n' },
      { time: '0:3:0', note: 'E4', dur: '4n' },
      { time: '1:1:2', note: 'B4', dur: '4n' },
      { time: '1:3:0', note: 'G4', dur: '4n' },
      { time: '2:1:0', note: 'F4', dur: '4n' },
      { time: '2:2:2', note: 'E4', dur: '8n' },
      { time: '2:3:0', note: 'D4', dur: '4n' },
      { time: '3:1:0', note: 'E4', dur: '4n' },
      { time: '3:2:2', note: 'G4', dur: '4n' },
    ];
    this.lofiMelody = new Tone.Part((time, val) => {
      this.lofiLead?.triggerAttackRelease(val.note, val.dur, time);
    }, lofiLeadEvents);
    this.lofiMelody.loop = true;
    this.lofiMelody.loopEnd = '4m';

    const lofiBassEvents = [
      { time: '0:0:0', note: 'F2', dur: '2n' },
      { time: '0:3:0', note: 'C2', dur: '4n' },
      { time: '1:0:0', note: 'E2', dur: '2n' },
      { time: '1:3:0', note: 'B1', dur: '4n' },
      { time: '2:0:0', note: 'D2', dur: '2n' },
      { time: '2:3:0', note: 'A1', dur: '4n' },
      { time: '3:0:0', note: 'C2', dur: '2n' },
      { time: '3:3:0', note: 'G1', dur: '4n' },
    ];
    this.lofiBass = new Tone.Part((time, val) => {
      this.bassSynth?.triggerAttackRelease(val.note, val.dur, time);
    }, lofiBassEvents);
    this.lofiBass.loop = true;
    this.lofiBass.loopEnd = '4m';

    // 3. Boss Battle Track
    const bossEvents = [
      { time: '0:0:0', note: 'E3', dur: '8n' },
      { time: '0:0:2', note: 'G3', dur: '8n' },
      { time: '0:1:0', note: 'B3', dur: '8n' },
      { time: '0:1:2', note: 'E4', dur: '8n' },
      { time: '0:2:0', note: 'D4', dur: '8n' },
      { time: '0:2:2', note: 'B3', dur: '8n' },
      { time: '0:3:0', note: 'G3', dur: '8n' },
      { time: '0:3:2', note: 'A3', dur: '8n' },
      { time: '1:0:0', note: 'C3', dur: '8n' },
      { time: '1:0:2', note: 'E3', dur: '8n' },
      { time: '1:1:0', note: 'G3', dur: '8n' },
      { time: '1:1:2', note: 'C4', dur: '8n' },
      { time: '1:2:0', note: 'B3', dur: '8n' },
      { time: '1:2:2', note: 'G3', dur: '8n' },
      { time: '1:3:0', note: 'F#3', dur: '4n' },
    ];
    this.bossPart = new Tone.Part((time, val) => {
      this.bossSynth?.triggerAttackRelease(val.note, val.dur, time);
      if (val.time.endsWith(':0:0')) {
        this.bassSynth?.triggerAttackRelease('E2', '4n', time);
      }
    }, bossEvents);
    this.bossPart.loop = true;
    this.bossPart.loopEnd = '2m';
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      Tone.getDestination().mute = muted;
    }
  }

  public async setTrack(track: MusicTrack): Promise<void> {
    if (this.currentTrack === track && this.initialized) return;
    this.currentTrack = track;

    if (track === 'stopped') {
      this.stopAllParts();
      Tone.getTransport().pause();
      return;
    }

    await this.ensureReady();
    if (this.currentTrack !== track) return;

    this.stopAllParts();
    const transport = Tone.getTransport();
    transport.position = 0;

    if (track === 'menu') {
      transport.bpm.value = 114;
      this.menuPart?.start(0);
    } else if (track === 'playing') {
      transport.bpm.value = 78;
      this.lofiChords?.start(0);
      this.lofiMelody?.start(0);
      this.lofiBass?.start(0);
    } else if (track === 'boss') {
      transport.bpm.value = 128;
      this.bossPart?.start(0);
    }

    if (transport.state !== 'started') {
      transport.start();
    }
  }

  private stopAllParts(): void {
    this.menuPart?.stop(0);
    this.lofiChords?.stop(0);
    this.lofiMelody?.stop(0);
    this.lofiBass?.stop(0);
    this.bossPart?.stop(0);
  }
}

export const musicEngine = new MusicEngine();
