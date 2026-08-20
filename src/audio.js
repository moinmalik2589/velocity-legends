export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.engineBus = null;
    this.engineLow = null;
    this.engineMid = null;
    this.engineHigh = null;
    this.engineGain = null;
    this.windGain = null;
    this.skidGain = null;
    this.musicGain = null;
    this.enabled = true;
    this.musicTimer = null;
    this.lastGear = 0;
  }

  init() {
    if (this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;

    this.ctx = new C();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.58;
    this.master.connect(this.ctx.destination);

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 12;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    compressor.connect(this.master);

    this.engineBus = this.ctx.createBiquadFilter();
    this.engineBus.type = 'lowpass';
    this.engineBus.frequency.value = 1700;
    this.engineBus.Q.value = 0.7;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineBus.connect(this.engineGain).connect(compressor);

    this.engineLow = this.makeOsc('sawtooth', 48, 0.46, this.engineBus);
    this.engineMid = this.makeOsc('triangle', 96, 0.28, this.engineBus);
    this.engineHigh = this.makeOsc('square', 144, 0.06, this.engineBus);

    const wind = this.noiseSource(3);
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 1450;
    windFilter.Q.value = 0.55;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;
    wind.connect(windFilter).connect(this.windGain).connect(compressor);
    wind.start();

    const skid = this.noiseSource(2);
    const skidFilter = this.ctx.createBiquadFilter();
    skidFilter.type = 'bandpass';
    skidFilter.frequency.value = 2350;
    skidFilter.Q.value = 1.7;
    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.value = 0;
    skid.connect(skidFilter).connect(this.skidGain).connect(compressor);
    skid.start();

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.045;
    this.musicGain.connect(compressor);
  }

  makeOsc(type, frequency, gain, destination) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    g.gain.value = gain;
    osc.connect(g).connect(destination);
    osc.start();
    return osc;
  }

  noiseSource(seconds = 1) {
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.72 + white * 0.28;
      data[i] = last;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  resume() {
    this.init();
    this.ctx?.resume();
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.enabled ? 0.58 : 0, this.ctx.currentTime, 0.04);
    }
    if (!this.enabled) this.stopMusic();
  }

  engineSpeed(speed, boost = false) {
    if (!this.ctx || !this.engineLow) return;

    const s = Math.abs(speed);
    const gear = Math.max(1, Math.min(6, 1 + Math.floor(s / 11)));
    const local = s % 11;
    const rpm = 52 + local * 13 + gear * 6 + (boost ? 34 : 0);

    this.engineLow.frequency.setTargetAtTime(rpm, this.ctx.currentTime, 0.025);
    this.engineMid.frequency.setTargetAtTime(rpm * 2.01, this.ctx.currentTime, 0.025);
    this.engineHigh.frequency.setTargetAtTime(rpm * 3.03, this.ctx.currentTime, 0.025);
    this.engineBus.frequency.setTargetAtTime(950 + Math.min(1500, s * 25) + (boost ? 550 : 0), this.ctx.currentTime, 0.05);

    const throttleGain = s > 1 ? 0.06 + Math.min(0.12, s / 470) + (boost ? 0.035 : 0) : 0;
    this.engineGain.gain.setTargetAtTime(this.enabled ? throttleGain : 0, this.ctx.currentTime, 0.025);
    this.windGain.gain.setTargetAtTime(this.enabled ? Math.min(0.11, s / 650) + (boost ? 0.025 : 0) : 0, this.ctx.currentTime, 0.08);

    if (s > 8 && gear !== this.lastGear) {
      if (this.lastGear) this.gearShift();
      this.lastGear = gear;
    }
  }

  skid(amount = 0) {
    if (!this.ctx || !this.skidGain) return;
    const level = this.enabled ? Math.max(0, Math.min(1, amount)) * 0.13 : 0;
    this.skidGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.035);
  }

  gearShift() {
    if (!this.enabled || !this.ctx) return;
    this.tone(120, 0.07, 'sawtooth', 0.035, -25);
  }

  tone(freq = 440, dur = 0.12, type = 'sine', gain = 0.12, slide = 0) {
    if (!this.enabled) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), this.ctx.currentTime + dur);
    }
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(g).connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  noise(dur = 0.16, gain = 0.12, cutoff = 900) {
    if (!this.enabled) return;
    this.resume();
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const env = 1 - i / n;
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    src.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(this.master);
    src.start();
  }

  impact(strength = 0.7) {
    const s = Math.max(0.2, Math.min(1, strength));
    this.noise(0.22, 0.12 + s * 0.12, 520 + s * 500);
    this.tone(62 + s * 20, 0.2, 'square', 0.055 + s * 0.045, -22);
    setTimeout(() => this.noise(0.08, 0.045 * s, 3200), 35);
  }

  landing() {
    this.noise(0.1, 0.055, 420);
    this.tone(82, 0.09, 'triangle', 0.035, -18);
  }

  countdown(n) {
    this.tone(n === 0 ? 760 : 420 + n * 55, n === 0 ? 0.32 : 0.12, 'square', n === 0 ? 0.16 : 0.09, n === 0 ? 450 : 0);
  }

  nitro() {
    this.tone(135, 0.42, 'sawtooth', 0.055, 1050);
    this.noise(0.34, 0.045, 3100);
  }

  pickup() {
    this.tone(620, 0.13, 'sine', 0.1, 520);
    setTimeout(() => this.tone(940, 0.1, 'triangle', 0.06, 180), 70);
  }

  crash() {
    this.impact(0.82);
  }

  stunt() {
    this.tone(390, 0.12, 'triangle', 0.08, 520);
    setTimeout(() => this.tone(720, 0.16, 'sine', 0.07, 260), 70);
  }

  knockdown() {
    this.noise(0.36, 0.24, 520);
    this.tone(54, 0.28, 'square', 0.11, -16);
    setTimeout(() => this.noise(0.15, 0.07, 2900), 65);
    setTimeout(() => this.tone(870, 0.11, 'sawtooth', 0.06, -390), 95);
  }

  reward() {
    [520, 660, 820].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, 'sine', 0.1, 100), i * 90));
  }

  startMusic() {
    if (!this.enabled || this.musicTimer) return;
    this.resume();
    let step = 0;
    const bass = [82.4, 82.4, 98, 110, 73.4, 82.4, 123.5, 110];
    this.musicTimer = setInterval(() => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = step % 4 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.value = bass[step++ % bass.length];
      gain.gain.value = 0.025;
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain).connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    }, 185);
  }

  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
