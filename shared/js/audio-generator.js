/**
 * SleepWell Studio — Advanced Audio Generator v2
 * Web Audio API synthesis engine. Zero external files. Works offline.
 *
 * Sound Types (24):
 *   Noise: white, pink, brown, violet, grey
 *   Nature: rain, ocean, wind, thunderstorm, campfire, stream, forest
 *   Brainwaves: delta(2Hz), theta(6Hz), alpha(10Hz), schumann(7.83Hz), gamma(40Hz)
 *   Healing: 432Hz, 528Hz, singing bowl
 *   Guided: breath4-7-8, bodyscan, pmr
 *
 * Features: Mixer (multi-track), Sleep Timer (fade-out), Volume control
 */
(function() {
  'use strict';

  var audioCtx = null;
  var tracks = {};        // { trackId: { nodes[], gainNode, type } }
  var timerId = null;

  function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // ─── Track Management ────────────────────────────────────────
  function addTrack(id, type, nodes, gainNode) {
    stopTrack(id);
    tracks[id] = { nodes: nodes, gain: gainNode, type: type };
  }

  function stopTrack(id) {
    if (!tracks[id]) return;
    tracks[id].nodes.forEach(function(n) {
      try { n.stop(); } catch(e) {}
      try { n.disconnect(); } catch(e) {}
    });
    delete tracks[id];
  }

  function stopAll() {
    Object.keys(tracks).forEach(function(id) { stopTrack(id); });
    tracks = {};
    clearTimer();
  }

  function getTrackGain(id) {
    return tracks[id] ? tracks[id].gain : null;
  }

  // ─── Helpers ─────────────────────────────────────────────────
  function masterGain(destGain) { return destGain; } // alias for clarity

  function whiteBuf(ctx, duration) {
    var len = ctx.sampleRate * (duration || 2);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function loopSource(ctx, buf) {
    var s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    return s;
  }

  function outputChain(ctx, source, gainValue) {
    var g = ctx.createGain();
    g.gain.value = gainValue || 0.3;
    source.connect(g);
    g.connect(ctx.destination);
    source.start();
    return { gain: g, source: source };
  }

  // ─── NOISE SPECTRUM ──────────────────────────────────────────

  /** White Noise — flat spectrum, all frequencies equal */
  function createWhiteNoise(vol, id) {
    id = id || 'white';
    var ctx = getCtx();
    var src = loopSource(ctx, whiteBuf(ctx, 2));
    var chain = outputChain(ctx, src, vol || 0.25);
    addTrack(id, 'white', [src, chain.gain], chain.gain);
  }

  /** Pink Noise — 1/f, -3dB/octave, sounds like rainfall */
  function createPinkNoise(vol, id) {
    id = id || 'pink';
    var ctx = getCtx();
    var buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var b = [0,0,0,0,0,0,0];
    for (var i = 0; i < d.length; i++) {
      var w = Math.random() * 2 - 1;
      b[0] = 0.99886 * b[0] + w * 0.0555179;
      b[1] = 0.99332 * b[1] + w * 0.0750759;
      b[2] = 0.96900 * b[2] + w * 0.1538520;
      b[3] = 0.86650 * b[3] + w * 0.3104856;
      b[4] = 0.55000 * b[4] + w * 0.5329522;
      b[5] = -0.7616 * b[5] - w * 0.0168980;
      d[i] = (b[0]+b[1]+b[2]+b[3]+b[4]+b[5]+b[6]+w*0.5362) * 0.11;
      b[6] = w * 0.115926;
    }
    var src = loopSource(ctx, buf);
    var chain = outputChain(ctx, src, vol || 0.25);
    addTrack(id, 'pink', [src, chain.gain], chain.gain);
  }

  /** Brown Noise — -6dB/octave, deep rumble like waterfall */
  function createBrownNoise(vol, id) {
    id = id || 'brown';
    var ctx = getCtx();
    var buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    var src = loopSource(ctx, buf);
    var chain = outputChain(ctx, src, vol || 0.35);
    addTrack(id, 'brown', [src, chain.gain], chain.gain);
  }

  /** Violet Noise — +6dB/octave, high-frequency emphasis (like hissing steam) */
  function createVioletNoise(vol, id) {
    id = id || 'violet';
    var ctx = getCtx();
    var buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var prev = 0;
    for (var i = 0; i < d.length; i++) {
      var w = Math.random() * 2 - 1;
      d[i] = (w - prev) * 0.5; // differentiation → +6dB/oct
      prev = w;
    }
    var src = loopSource(ctx, buf);
    // Low shelf cut to tame harshness
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 2000;
    var chain = outputChain(ctx, src, vol || 0.08);
    src.disconnect(); src.connect(hp); hp.connect(chain.gain);
    addTrack(id, 'violet', [src, hp, chain.gain], chain.gain);
  }

  /** Grey Noise — psychoacoustically flat (A-weighted equal loudness) */
  function createGreyNoise(vol, id) {
    id = id || 'grey';
    var ctx = getCtx();
    var buf = whiteBuf(ctx, 2);
    var src = loopSource(ctx, buf);
    // Approximate A-weighting: cut lows, slight boost around 2-4kHz
    var bs = ctx.createBiquadFilter();
    bs.type = 'highshelf'; bs.frequency.value = 1000; bs.gain.value = -3;
    var bp = ctx.createBiquadFilter();
    bp.type = 'peaking'; bp.frequency.value = 2500; bp.Q.value = 1; bp.gain.value = 1.5;
    var gain = ctx.createGain();
    gain.gain.value = vol || 0.2;
    src.connect(bs); bs.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
    src.start();
    addTrack(id, 'grey', [src, bs, bp, gain], gain);
  }

  // ─── NATURE SOUNDSCAPES ──────────────────────────────────────

  /** Rain — layered drops (low heavy + high pitter-patter) */
  function createRain(vol, id) {
    id = id || 'rain';
    var ctx = getCtx();
    var dropSrc = loopSource(ctx, whiteBuf(ctx, 2));
    var dropFilter = ctx.createBiquadFilter();
    dropFilter.type = 'lowpass'; dropFilter.frequency.value = 400;
    var dropGain = ctx.createGain(); dropGain.gain.value = (vol||0.2) * 0.6;
    dropSrc.connect(dropFilter); dropFilter.connect(dropGain); dropGain.connect(ctx.destination);
    dropSrc.start();

    var lightBuf = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate);
    var ld = lightBuf.getChannelData(0);
    for (var i=0;i<ld.length;i++) ld[i] = (Math.random()>0.7) ? (Math.random()*2-1)*0.5 : 0;
    var lightSrc = loopSource(ctx, lightBuf);
    var lightFilter = ctx.createBiquadFilter();
    lightFilter.type = 'bandpass'; lightFilter.frequency.value = 2000; lightFilter.Q.value = 0.5;
    var lightGain = ctx.createGain(); lightGain.gain.value = (vol||0.2) * 0.3;
    lightSrc.connect(lightFilter); lightFilter.connect(lightGain); lightGain.connect(ctx.destination);
    lightSrc.start();

    var masterG = ctx.createGain(); masterG.gain.value = 1;
    dropGain.disconnect(); dropGain.connect(masterG);
    lightGain.disconnect(); lightGain.connect(masterG);
    masterG.connect(ctx.destination);
    addTrack(id, 'rain', [dropSrc,dropFilter,dropGain,lightSrc,lightFilter,lightGain,masterG], masterG);
  }

  /** Ocean Waves — modulated noise with ~12s wave cycle */
  function createOcean(vol, id) {
    id = id || 'ocean';
    var ctx = getCtx();
    var buf = ctx.createBuffer(1, ctx.sampleRate*4, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i=0;i<buf.length;i++) {
      var t=i/ctx.sampleRate;
      var env = Math.pow(Math.sin(t*Math.PI*2/12)*0.5+0.5, 2);
      d[i] = (Math.random()*2-1) * env * 0.6;
    }
    var src = loopSource(ctx, buf);
    var filter = ctx.createBiquadFilter();
    filter.type='lowpass'; filter.frequency.value=800;
    var chain = outputChain(ctx, src, vol||0.3);
    src.disconnect(); src.connect(filter); filter.connect(chain.gain);
    addTrack(id, 'ocean', [src, filter, chain.gain], chain.gain);
  }

  /** Wind — filtered noise with slow amplitude modulation */
  function createWind(vol, id) {
    id = id || 'wind';
    var ctx = getCtx();
    var buf = ctx.createBuffer(1, ctx.sampleRate*3, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i=0;i<buf.length;i++) {
      var t=i/ctx.sampleRate;
      d[i] = (Math.random()*2-1) * (Math.sin(t*0.3)*0.3 + Math.sin(t*0.7)*0.2 + 0.5);
    }
    var src = loopSource(ctx, buf);
    var filter = ctx.createBiquadFilter();
    filter.type='lowpass'; filter.frequency.value=600; filter.Q.value=0.7;
    var chain = outputChain(ctx, src, vol||0.2);
    src.disconnect(); src.connect(filter); filter.connect(chain.gain);
    addTrack(id, 'wind', [src, filter, chain.gain], chain.gain);
  }

  /** Thunderstorm — rain + occasional low-frequency thunder bursts */
  function createThunderstorm(vol, id) {
    id = id || 'thunder';
    var ctx = getCtx();
    // Rain layer (same as rain)
    var dropSrc = loopSource(ctx, whiteBuf(ctx, 2));
    var df = ctx.createBiquadFilter(); df.type='lowpass'; df.frequency.value=400;
    var dg = ctx.createGain(); dg.gain.value = (vol||0.18)*0.6;
    dropSrc.connect(df); df.connect(dg);
    var lightSrc = loopSource(ctx, (function(){
      var b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
      var dd=b.getChannelData(0);
      for(var i=0;i<dd.length;i++) dd[i]=(Math.random()>0.7)?(Math.random()*2-1)*0.5:0;
      return b;
    })());
    var lf=ctx.createBiquadFilter(); lf.type='bandpass'; lf.frequency.value=2000; lf.Q.value=0.5;
    var lg=ctx.createGain(); lg.gain.value=(vol||0.18)*0.3;
    lightSrc.connect(lf); lf.connect(lg);

    // Thunder generator: schedule random bursts
    var thunderGain = ctx.createGain(); thunderGain.gain.value = 0;
    var thunderOsc = ctx.createOscillator();
    thunderOsc.type = 'sawtooth'; thunderOsc.frequency.value = 60;
    var thunderGain2 = ctx.createGain(); thunderGain2.gain.value = 0.15;
    thunderOsc.connect(thunderGain2); thunderGain2.connect(thunderGain);
    thunderOsc.start();

    function scheduleThunder() {
      var delay = 5 + Math.random() * 25;
      var now = ctx.currentTime;
      thunderGain.gain.cancelScheduledValues(now);
      thunderGain.gain.setValueAtTime(0, now);
      // Thunder envelope: sharp attack → slow decay
      thunderGain.gain.linearRampToValueAtTime(0.8, now + 0.1);
      thunderGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      thunderGain.gain.setValueAtTime(0, now + 2.5);
      // Schedule next
      setTimeout(scheduleThunder, delay * 1000);
    }
    scheduleThunder();

    var masterG = ctx.createGain(); masterG.gain.value = 1;
    dg.connect(masterG); lg.connect(masterG); thunderGain.connect(masterG);
    masterG.connect(ctx.destination);
    dropSrc.start(); lightSrc.start();

    addTrack(id, 'thunderstorm', [dropSrc,df,dg,lightSrc,lf,lg,thunderOsc,thunderGain2,thunderGain,masterG], masterG);
  }

  /** Campfire — random crackle impulses with low rumble */
  function createCampfire(vol, id) {
    id = id || 'campfire';
    var ctx = getCtx();
    // Base low rumble (brown noise, quiet)
    var bbuf = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate);
    var bd = bbuf.getChannelData(0);
    var last=0;
    for(var i=0;i<bd.length;i++){ last=(last+0.02*(Math.random()*2-1))/1.02; bd[i]=last*2; }
    var bsrc = loopSource(ctx, bbuf);
    var bg = ctx.createGain(); bg.gain.value = (vol||0.15)*0.3;
    bsrc.connect(bg); bg.connect(ctx.destination); bsrc.start();

    // High crackle (short noise bursts with decay)
    function scheduleCrackle() {
      var delay = 0.05 + Math.random() * 0.5;
      var now = ctx.currentTime;
      var src = ctx.createBufferSource();
      var bufLen = ctx.sampleRate * (0.02 + Math.random()*0.08);
      var cbuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var cd = cbuf.getChannelData(0);
      for(var i=0;i<cd.length;i++) cd[i] = (Math.random()*2-1) * Math.max(0, 1 - i/bufLen);
      src.buffer = cbuf;
      var hp = ctx.createBiquadFilter();
      hp.type='highpass'; hp.frequency.value=3000 + Math.random()*4000;
      var cg = ctx.createGain();
      cg.gain.value = (vol||0.15) * (0.3 + Math.random()*0.5);
      src.connect(hp); hp.connect(cg); cg.connect(ctx.destination);
      src.start(now); src.stop(now + bufLen/ctx.sampleRate + 0.1);
      setTimeout(scheduleCrackle, delay * 1000);
    }
    scheduleCrackle();

    addTrack(id, 'campfire', [bsrc,bg], bg);
  }

  /** Babbling Brook — high-frequency filtered noise with bubble pops */
  function createStream(vol, id) {
    id = id || 'stream';
    var ctx = getCtx();
    // Base flow (bandpass noise)
    var fbuf = ctx.createBuffer(1, ctx.sampleRate*3, ctx.sampleRate);
    var fd = fbuf.getChannelData(0);
    for(var i=0;i<fd.length;i++){
      var t=i/ctx.sampleRate;
      fd[i]=(Math.random()*2-1)*(0.7+Math.sin(t*1.3)*0.3);
    }
    var fsrc = loopSource(ctx, fbuf);
    var ff = ctx.createBiquadFilter();
    ff.type='bandpass'; ff.frequency.value=1200; ff.Q.value=1.5;
    var fg = ctx.createGain(); fg.gain.value = (vol||0.18)*0.7;
    fsrc.connect(ff); ff.connect(fg); fg.connect(ctx.destination); fsrc.start();

    // Bubble pops (periodic short high-freq bursts)
    function scheduleBubble() {
      var del = 0.3 + Math.random() * 1.5;
      var n = ctx.currentTime;
      var osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = 800 + Math.random()*2000;
      var eg = ctx.createGain();
      eg.gain.setValueAtTime(0, n);
      eg.gain.linearRampToValueAtTime((vol||0.18)*0.15, n+0.02);
      eg.gain.exponentialRampToValueAtTime(0.001, n+0.15);
      osc.connect(eg); eg.connect(ctx.destination);
      osc.start(n); osc.stop(n+0.2);
      setTimeout(scheduleBubble, del*1000);
    }
    scheduleBubble();

    addTrack(id, 'stream', [fsrc,ff,fg], fg);
  }

  /** Forest Ambience — wind + occasional bird chirps */
  function createForest(vol, id) {
    id = id || 'forest';
    var ctx = getCtx();
    // Ambient wind (lowpass)
    var wbuf = ctx.createBuffer(1, ctx.sampleRate*3, ctx.sampleRate);
    var wd = wbuf.getChannelData(0);
    for(var i=0;i<wd.length;i++){
      var t=i/ctx.sampleRate;
      wd[i]=(Math.random()*2-1)*(Math.sin(t*0.2)*0.2+Math.sin(t*0.5)*0.2+0.6);
    }
    var wsrc = loopSource(ctx, wbuf);
    var wf = ctx.createBiquadFilter();
    wf.type='lowpass'; wf.frequency.value=500; wf.Q.value=0.8;
    var wg = ctx.createGain(); wg.gain.value=(vol||0.18)*0.7;
    wsrc.connect(wf); wf.connect(wg); wg.connect(ctx.destination); wsrc.start();

    // Bird chirps (FM synthesis)
    function scheduleBird() {
      var del = 2 + Math.random() * 10;
      var n = ctx.currentTime;
      var car = ctx.createOscillator();
      var mod = ctx.createOscillator();
      car.type = 'sine';
      mod.type = 'sine';
      var bf = 2000 + Math.random()*3000;
      car.frequency.value = bf;
      mod.frequency.value = bf * (3 + Math.random()*4);
      var modG = ctx.createGain(); modG.gain.value = bf * 2;
      mod.connect(modG); modG.connect(car.frequency);
      var eg = ctx.createGain();
      eg.gain.setValueAtTime(0, n);
      eg.gain.linearRampToValueAtTime((vol||0.18)*0.12, n+0.03);
      eg.gain.exponentialRampToValueAtTime(0.001, n+0.2+Math.random()*0.3);
      car.connect(eg); eg.connect(ctx.destination);
      car.start(n); mod.start(n);
      car.stop(n+0.3); mod.stop(n+0.3);
      setTimeout(scheduleBird, del*1000);
    }
    scheduleBird();

    addTrack(id, 'forest', [wsrc,wf,wg], wg);
  }

  // ─── BRAINWAVE FREQUENCIES ───────────────────────────────────

  function binauralCore(base, beat, vol, id) {
    id = id || ('bbeat_'+beat);
    var ctx = getCtx();
    var l = ctx.createOscillator(); l.type='sine'; l.frequency.value=base;
    var r = ctx.createOscillator(); r.type='sine'; r.frequency.value=base+beat;
    var lg = ctx.createGain(); lg.gain.value = (vol||0.15);
    var rg = ctx.createGain(); rg.gain.value = (vol||0.15);
    var merger = ctx.createChannelMerger(2);
    l.connect(lg); lg.connect(merger,0,0);
    r.connect(rg); rg.connect(merger,0,1);
    var masterG = ctx.createGain(); masterG.gain.value=1;
    merger.connect(masterG); masterG.connect(ctx.destination);
    l.start(); r.start();
    addTrack(id, 'binaural', [l,lg,r,rg,merger,masterG], masterG);
    // Add subtle pink noise bed
    createPinkNoise((vol||0.15)*0.15, id+'_pink');
  }

  function createDeltaWaves(vol, id) { binauralCore(200, 2, vol, id||'delta'); }
  function createThetaWaves(vol, id) { binauralCore(200, 6, vol, id||'theta'); }
  function createAlphaWaves(vol, id) { binauralCore(240, 10, vol, id||'alpha'); }
  function createSchumann(vol, id) { binauralCore(150, 7.83, vol, id||'schumann'); }
  function createGammaWaves(vol, id) {
    // Gamma 40Hz — use lower volume, slightly higher carrier
    binauralCore(320, 40, (vol||0.08), id||'gamma');
  }

  // ─── HEALING FREQUENCIES ─────────────────────────────────────

  /** 432Hz Healing Tone — pure sine with gentle upper harmonics */
  function create432Hz(vol, id) {
    id = id || 'hz432';
    var ctx = getCtx();
    var masterG = ctx.createGain(); masterG.gain.value = 1;
    var freqs = [432, 864, 1296]; // fundamental + 2 harmonics
    var amps  = [0.6, 0.25, 0.15];
    var nodes = [];
    freqs.forEach(function(f, idx) {
      var osc = ctx.createOscillator(); osc.type='sine'; osc.frequency.value=f;
      var g = ctx.createGain();
      g.gain.value = (vol||0.1) * amps[idx];
      osc.connect(g); g.connect(masterG);
      osc.start();
      nodes.push(osc, g);
    });
    masterG.connect(ctx.destination);
    addTrack(id, 'healing', nodes.concat([masterG]), masterG);
    createPinkNoise((vol||0.1)*0.12, id+'_bed');
  }

  /** 528Hz Miracle Frequency — "love frequency" with warm harmonics */
  function create528Hz(vol, id) {
    id = id || 'hz528';
    var ctx = getCtx();
    var masterG = ctx.createGain(); masterG.gain.value = 1;
    var notes = [
      {f:264, a:0.1},  // sub-octave for warmth
      {f:396, a:0.15}, // perfect 5th below
      {f:528, a:0.5},  // fundamental
      {f:660, a:0.2},  // major 3rd
      {f:792, a:0.15}, // perfect 5th
      {f:1056,a:0.1}   // octave
    ];
    var nodes = [];
    notes.forEach(function(n) {
      var osc = ctx.createOscillator(); osc.type='sine'; osc.frequency.value=n.f;
      var g = ctx.createGain(); g.gain.value = (vol||0.1)*n.a;
      osc.connect(g); g.connect(masterG);
      osc.start();
      nodes.push(osc, g);
    });
    masterG.connect(ctx.destination);
    addTrack(id, 'healing', nodes.concat([masterG]), masterG);
    createPinkNoise((vol||0.1)*0.1, id+'_bed');
  }

  /** Singing Bowl — pentatonic layered sine with LFO modulation */
  function createSingingBowl(vol, id) {
    id = id || 'bowl';
    var ctx = getCtx();
    var notes = [130.81, 196.0, 261.63, 329.63, 392.0];
    var masterG = ctx.createGain(); masterG.gain.value=1;
    var nodes=[masterG];
    notes.forEach(function(freq, idx) {
      var osc = ctx.createOscillator(); osc.type='sine';
      osc.frequency.value = freq + idx*0.3;
      var g = ctx.createGain(); g.gain.value = (vol||0.12)/notes.length;
      var lfo = ctx.createOscillator(); lfo.frequency.value=0.5+idx*0.3;
      var lfoG = ctx.createGain(); lfoG.gain.value=(vol||0.12)*0.3;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      lfo.start();
      osc.connect(g); g.connect(masterG);
      osc.start();
      nodes.push(osc,g,lfo,lfoG);
    });
    masterG.connect(ctx.destination);
    addTrack(id, 'bowl', nodes, masterG);
  }

  // ─── GUIDED PROTOCOLS ────────────────────────────────────────

  /** 4-7-8 Breathing Pacer — inhale 4s / hold 7s / exhale 8s */
  function createBreath478(vol, id) {
    id = id || 'breath478';
    var ctx = getCtx();
    // Base quiet pad
    var padOsc = ctx.createOscillator(); padOsc.type='sine'; padOsc.frequency.value=220;
    var padG = ctx.createGain(); padG.gain.value=(vol||0.1)*0.25;
    padOsc.connect(padG); padG.connect(ctx.destination); padOsc.start();

    var cycleTime = 19; // 4+7+8
    function scheduleCycle() {
      var now = ctx.currentTime;
      // Inhale phase (4s): rising tone 220→330 Hz
      var iOsc = ctx.createOscillator(); iOsc.type='sine'; iOsc.frequency.setValueAtTime(220, now);
      iOsc.frequency.linearRampToValueAtTime(330, now+4);
      var iG = ctx.createGain();
      iG.gain.setValueAtTime(0, now);
      iG.gain.linearRampToValueAtTime((vol||0.1)*0.5, now+0.3);
      iG.gain.linearRampToValueAtTime((vol||0.1)*0.5, now+3.7);
      iG.gain.linearRampToValueAtTime(0, now+4);
      iOsc.connect(iG); iG.connect(ctx.destination);
      iOsc.start(now); iOsc.stop(now+4);

      // Hold phase (7s): silence + subtle sub-bass hold tone
      var hOsc = ctx.createOscillator(); hOsc.type='sine'; hOsc.frequency.value=110;
      var hG = ctx.createGain();
      hG.gain.setValueAtTime(0, now+4);
      hG.gain.linearRampToValueAtTime((vol||0.1)*0.15, now+4.1);
      hG.gain.linearRampToValueAtTime((vol||0.1)*0.15, now+10.5);
      hG.gain.linearRampToValueAtTime(0, now+11);
      hOsc.connect(hG); hG.connect(ctx.destination);
      hOsc.start(now+4); hOsc.stop(now+11);

      // Exhale phase (8s): falling tone 330→165 Hz
      var eOsc = ctx.createOscillator(); eOsc.type='sine'; eOsc.frequency.setValueAtTime(330, now+11);
      eOsc.frequency.linearRampToValueAtTime(165, now+19);
      var eG = ctx.createGain();
      eG.gain.setValueAtTime(0, now+11);
      eG.gain.linearRampToValueAtTime((vol||0.1)*0.5, now+11.3);
      eG.gain.linearRampToValueAtTime((vol||0.1)*0.5, now+18.5);
      eG.gain.linearRampToValueAtTime(0, now+19);
      eOsc.connect(eG); eG.connect(ctx.destination);
      eOsc.start(now+11); eOsc.stop(now+19);

      setTimeout(scheduleCycle, cycleTime*1000);
    }
    scheduleCycle();
    addTrack(id, 'guided', [padOsc,padG], padG);
  }

  /** Body Scan — periodic soft chime every ~45s */
  function createBodyScan(vol, id) {
    id = id || 'bodyscan';
    var ctx = getCtx();
    // Ambient pad
    var padO = ctx.createOscillator(); padO.type='sine'; padO.frequency.value=196;
    var padG = ctx.createGain(); padG.gain.value=(vol||0.08)*0.3;
    padO.connect(padG); padG.connect(ctx.destination); padO.start();

    function chimeBell(freq, time) {
      var osc = ctx.createOscillator(); osc.type='sine'; osc.frequency.value=freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime((vol||0.08)*0.6, time+0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time+1.5);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(time); osc.stop(time+1.8);
    }

    // Schedule chimes at ~45s intervals with a small bell cluster
    var scanZones = [
      {delay:5,  name:'feet'},
      {delay:50, name:'legs'},
      {delay:95, name:'hips'},
      {delay:140,name:'belly'},
      {delay:185,name:'chest'},
      {delay:230,name:'hands'},
      {delay:275,name:'arms'},
      {delay:320,name:'shoulders'},
      {delay:365,name:'neck'},
      {delay:410,name:'face'},
      {delay:455,name:'head'},
      {delay:500,name:'whole body'}
    ];

    scanZones.forEach(function(zone) {
      var baseTime = ctx.currentTime + zone.delay;
      // 3-note chime cluster
      chimeBell(523, baseTime);       // C5
      chimeBell(659, baseTime+0.08);  // E5
      chimeBell(784, baseTime+0.16);  // G5
      // Gentle chime fade ring
      chimeBell(1047, baseTime+0.5);  // C6
    });

    addTrack(id, 'guided', [padO, padG], padG);
  }

  /** Progressive Muscle Relaxation — tense/release cycles with tone cues */
  function createPMR(vol, id) {
    id = id || 'pmr';
    var ctx = getCtx();
    // Ambient pad
    var padO = ctx.createOscillator(); padO.type='sine'; padO.frequency.value=180;
    var padG = ctx.createGain(); padG.gain.value=(vol||0.08)*0.2;
    padO.connect(padG); padG.connect(ctx.destination); padO.start();

    function toneCue(freq, start, dur, type) {
      var osc = ctx.createOscillator(); osc.type='sine'; osc.frequency.value=freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime((vol||0.08)*0.4, start+0.05);
      g.gain.setValueAtTime((vol||0.08)*0.4, start+dur-0.1);
      g.gain.linearRampToValueAtTime(0, start+dur);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(start); osc.stop(start+dur);
    }

    // 10 cycles: 5s tense (higher tone) + 10s release (lower tone) + 5s rest
    // Starting after 10s intro, each cycle 20s, total ~3:30
    var groups = ['feet','calves','thighs','glutes','abs','chest','back','arms','shoulders','face'];
    groups.forEach(function(_, idx) {
      var t = ctx.currentTime + 10 + idx*20;
      toneCue(440, t, 5);       // tense cue (A4)
      toneCue(220, t+5, 10);    // release cue (A3)
      // Subtle transition chime
      var osc = ctx.createOscillator(); osc.type='sine'; osc.frequency.value=660;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t+15);
      g.gain.linearRampToValueAtTime((vol||0.08)*0.2, t+15.02);
      g.gain.exponentialRampToValueAtTime(0.001, t+15.5);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t+15); osc.stop(t+16);
    });

    addTrack(id, 'guided', [padO,padG], padG);
  }

  // ─── MIXER / TIMER / VOLUME ──────────────────────────────────

  /** Set volume of a specific track by id */
  function setVolume(id, vol) {
    var g = getTrackGain(id);
    if (g) {
      g.gain.cancelScheduledValues(audioCtx ? audioCtx.currentTime : 0);
      g.gain.setValueAtTime(vol, (audioCtx||getCtx()).currentTime);
    }
  }

  /** Fade out all active tracks over `seconds` */
  function fadeOut(seconds) {
    if (!audioCtx) return;
    var now = audioCtx.currentTime;
    Object.keys(tracks).forEach(function(id) {
      var g = getTrackGain(id);
      if (g) {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + seconds);
      }
    });
    setTimeout(function() { stopAll(); }, seconds * 1000 + 500);
  }

  /** Set sleep timer: auto fade out after `seconds` */
  function setTimer(seconds) {
    clearTimer();
    if (seconds <= 0) return;
    var fadeDuration = Math.min(10, seconds * 0.1);
    var playTime = seconds - fadeDuration;
    timerId = setTimeout(function() {
      fadeOut(fadeDuration);
      timerId = null;
    }, playTime * 1000);
  }

  function clearTimer() {
    if (timerId) { clearTimeout(timerId); timerId = null; }
  }

  function getTimerRemaining() { return timerId ? 'active' : 'none'; }

  // ─── PUBLIC API ──────────────────────────────────────────────

  window.SleepSounds = {
    // Noise spectrum
    whiteNoise: function(v,id) { stopAll(); createWhiteNoise(v,id||'white'); },
    pinkNoise: function(v,id) { stopAll(); createPinkNoise(v,id||'pink'); },
    brownNoise: function(v,id) { stopAll(); createBrownNoise(v,id||'brown'); },
    violetNoise: function(v,id) { stopAll(); createVioletNoise(v,id||'violet'); },
    greyNoise: function(v,id) { stopAll(); createGreyNoise(v,id||'grey'); },

    // Nature
    rain: function(v,id) { stopAll(); createRain(v,id||'rain'); },
    ocean: function(v,id) { stopAll(); createOcean(v,id||'ocean'); },
    wind: function(v,id) { stopAll(); createWind(v,id||'wind'); },
    thunderstorm: function(v,id) { stopAll(); createThunderstorm(v,id||'thunder'); },
    campfire: function(v,id) { stopAll(); createCampfire(v,id||'campfire'); },
    stream: function(v,id) { stopAll(); createStream(v,id||'stream'); },
    forest: function(v,id) { stopAll(); createForest(v,id||'forest'); },

    // Brainwaves (convenience wrappers)
    deltaWaves: function(v,id) { stopAll(); createDeltaWaves(v,id||'delta'); },
    thetaWaves: function(v,id) { stopAll(); createThetaWaves(v,id||'theta'); },
    alphaWaves: function(v,id) { stopAll(); createAlphaWaves(v,id||'alpha'); },
    schumann: function(v,id) { stopAll(); createSchumann(v,id||'schumann'); },
    gammaWaves: function(v,id) { stopAll(); createGammaWaves(v,id||'gamma'); },
    binauralBeat: function(base,beat,vol,id) { stopAll(); binauralCore(base,beat,vol,id||'binaural'); },

    // Healing
    hz432: function(v,id) { stopAll(); create432Hz(v,id||'hz432'); },
    hz528: function(v,id) { stopAll(); create528Hz(v,id||'hz528'); },
    singingBowl: function(v,id) { stopAll(); createSingingBowl(v,id||'bowl'); },

    // Guided
    breath478: function(v,id) { stopAll(); createBreath478(v,id||'breath478'); },
    bodyScan: function(v,id) { stopAll(); createBodyScan(v,id||'bodyscan'); },
    pmr: function(v,id) { stopAll(); createPMR(v,id||'pmr'); },

    // Mixer (play without stopping existing)
    mix: function(type, vol) {
      var id = type + '_' + Date.now();
      switch(type) {
        case 'white': createWhiteNoise(vol, id); break;
        case 'pink': createPinkNoise(vol, id); break;
        case 'brown': createBrownNoise(vol, id); break;
        case 'violet': createVioletNoise(vol, id); break;
        case 'grey': createGreyNoise(vol, id); break;
        case 'rain': createRain(vol, id); break;
        case 'ocean': createOcean(vol, id); break;
        case 'wind': createWind(vol, id); break;
        case 'thunder': createThunderstorm(vol, id); break;
        case 'campfire': createCampfire(vol, id); break;
        case 'stream': createStream(vol, id); break;
        case 'forest': createForest(vol, id); break;
        case 'delta': createDeltaWaves(vol, id); break;
        case 'theta': createThetaWaves(vol, id); break;
        case 'alpha': createAlphaWaves(vol, id); break;
        case 'schumann': createSchumann(vol, id); break;
        case 'gamma': createGammaWaves(vol, id); break;
        case 'hz432': create432Hz(vol, id); break;
        case 'hz528': create528Hz(vol, id); break;
        case 'bowl': createSingingBowl(vol, id); break;
      }
      return id;
    },

    // Control
    setVolume: setVolume,
    fadeOut: fadeOut,
    setTimer: setTimer,
    clearTimer: clearTimer,
    getTimerRemaining: getTimerRemaining,
    stop: stopAll,
    stopAll: stopAll,
    isPlaying: function() { return Object.keys(tracks).length > 0; },
    activeTracks: function() { return Object.keys(tracks); }
  };
})();
