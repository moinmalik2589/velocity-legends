export class AudioSystem{
  constructor(){this.ctx=null;this.master=null;this.engine=null;this.engine2=null;this.engineGain=null;this.windGain=null;this.wind=null;this.musicGain=null;this.enabled=true;this.musicTimer=null;}
  init(){
    if(this.ctx)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();
    this.master=this.ctx.createGain();this.master.gain.value=.56;this.master.connect(this.ctx.destination);
    const comp=this.ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=16;comp.ratio.value=5;comp.attack.value=.005;comp.release.value=.18;comp.connect(this.master);
    this.engineGain=this.ctx.createGain();this.engineGain.gain.value=0;this.engineGain.connect(comp);
    const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;filter.Q.value=1.2;filter.connect(this.engineGain);
    this.engine=this.ctx.createOscillator();this.engine.type='sawtooth';this.engine2=this.ctx.createOscillator();this.engine2.type='triangle';
    const g1=this.ctx.createGain(),g2=this.ctx.createGain();g1.gain.value=.62;g2.gain.value=.38;this.engine.connect(g1).connect(filter);this.engine2.connect(g2).connect(filter);this.engine.start();this.engine2.start();
    const len=this.ctx.sampleRate*2,b=this.ctx.createBuffer(1,len,this.ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*.6;this.wind=this.ctx.createBufferSource();this.wind.buffer=b;this.wind.loop=true;const windFilter=this.ctx.createBiquadFilter();windFilter.type='bandpass';windFilter.frequency.value=1200;windFilter.Q.value=.5;this.windGain=this.ctx.createGain();this.windGain.gain.value=0;this.wind.connect(windFilter).connect(this.windGain).connect(comp);this.wind.start();
    this.musicGain=this.ctx.createGain();this.musicGain.gain.value=.055;this.musicGain.connect(comp);
  }
  resume(){this.init();this.ctx?.resume();}
  setEnabled(v){this.enabled=v;if(this.master)this.master.gain.setTargetAtTime(v?.56:0,this.ctx.currentTime,.05);if(!v)this.stopMusic();}
  engineSpeed(speed,boost=false){if(!this.ctx||!this.engine)return;const s=Math.abs(speed),rpm=54+s*5.25+(boost?72:0);this.engine.frequency.setTargetAtTime(rpm,this.ctx.currentTime,.025);this.engine2.frequency.setTargetAtTime(rpm*2.02,this.ctx.currentTime,.03);this.engineGain.gain.setTargetAtTime(this.enabled?(s>1?.05+.07*Math.min(1,s/55):0):0,this.ctx.currentTime,.035);this.windGain.gain.setTargetAtTime(this.enabled?Math.min(.09,s/800)+(boost?.035:0):0,this.ctx.currentTime,.08);}
  tone(freq=440,dur=.12,type='sine',gain=.12,slide=0){if(!this.enabled)return;this.resume();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,this.ctx.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),this.ctx.currentTime+dur);g.gain.setValueAtTime(gain,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+dur);o.connect(g).connect(this.master);o.start();o.stop(this.ctx.currentTime+dur);}
  noise(dur=.16,gain=.12,cutoff=900){if(!this.enabled)return;this.resume();const n=Math.floor(this.ctx.sampleRate*dur),b=this.ctx.createBuffer(1,n,this.ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const src=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=b;f.type='lowpass';f.frequency.value=cutoff;g.gain.value=gain;src.connect(f).connect(g).connect(this.master);src.start();}
  countdown(n){this.tone(n===0?760:420+n*55,n===0?.32:.12,'square',n===0?.16:.09,n===0?450:0)}
  nitro(){this.tone(150,.35,'sawtooth',.07,900);this.noise(.28,.035,2400)}
  pickup(){this.tone(640,.18,'sine',.12,500)}
  crash(){this.noise(.22,.18,650);this.tone(72,.18,'square',.07,-35)}
  stunt(){this.tone(390,.12,'triangle',.08,520);setTimeout(()=>this.tone(720,.16,'sine',.07,260),70)}
  knockdown(){this.noise(.34,.24,520);this.tone(58,.25,'square',.1,-18);setTimeout(()=>this.tone(880,.11,'sawtooth',.06,-400),90)}
  reward(){[520,660,820].forEach((f,i)=>setTimeout(()=>this.tone(f,.16,'sine',.1,100),i*90))}
  startMusic(){if(!this.enabled||this.musicTimer)return;this.resume();let step=0;const notes=[110,138.6,164.8,138.6,123.5,164.8,185,164.8];this.musicTimer=setInterval(()=>{if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.value=notes[step++%notes.length];g.gain.value=.034;g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+.2);o.connect(g).connect(this.musicGain);o.start();o.stop(this.ctx.currentTime+.22)},220)}
  stopMusic(){clearInterval(this.musicTimer);this.musicTimer=null;}
}
