/**
 * Sleep Sound Generator — Web Audio API
 * Generates white noise, pink noise, brown noise, rain, ocean waves, and binaural beats
 * No external files needed. Lightweight and always works offline.
 */
(function() {
  'use strict';

  let audioCtx = null;
  let activeNodes = [];
  let isPlaying = false;

  function getContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function stopAll() {
    activeNodes.forEach(function(n) {
      try { n.stop(); } catch(e) {}
      try { n.disconnect(); } catch(e) {}
    });
    activeNodes = [];
    isPlaying = false;
  }

  /**
   * White Noise Generator
   * Flat frequency spectrum — all frequencies at equal energy
   */
  function createWhiteNoise(volume) {
    volume = volume || 0.3;
    var ctx = getContext();
    var bufferSize = ctx.sampleRate * 2;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    var gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    activeNodes.push(source, gain);
    isPlaying = true;
    return { stop: stopAll };
  }

  /**
   * Pink Noise Generator
   * 1/f spectrum — decreases 3dB per octave, sounds like rainfall
   */
  function createPinkNoise(volume) {
    volume = volume || 0.25;
    var ctx = getContext();
    var bufferSize = ctx.sampleRate * 2;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < bufferSize; i++) {
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    var gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    activeNodes.push(source, gain);
    isPlaying = true;
    return { stop: stopAll };
  }

  /**
   * Brown Noise (Brownian/Red Noise) Generator
   * -6dB per octave — deep, rumbling like a waterfall or distant thunder
   */
  function createBrownNoise(volume) {
    volume = volume || 0.35;
    var ctx = getContext();
    var bufferSize = ctx.sampleRate * 2;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    var lastOut = 0;
    for (var i = 0; i < bufferSize; i++) {
      var white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    var gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    activeNodes.push(source, gain);
    isPlaying = true;
    return { stop: stopAll };
  }

  /**
   * Rain Sound Generator
   * Layered filtered noise simulating gentle rain on leaves
   */
  function createRainSound(volume) {
    volume = volume || 0.2;
    var ctx = getContext();
    // Layer 1: Heavy drops (lower frequency filtered noise)
    var dropBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var dropData = dropBuffer.getChannelData(0);
    for (var i = 0; i < dropData.length; i++) {
      dropData[i] = Math.random() * 2 - 1;
    }
    var dropSource = ctx.createBufferSource();
    dropSource.buffer = dropBuffer;
    dropSource.loop = true;
    var dropFilter = ctx.createBiquadFilter();
    dropFilter.type = 'lowpass';
    dropFilter.frequency.value = 400;
    var dropGain = ctx.createGain();
    dropGain.gain.value = volume * 0.6;
    dropSource.connect(dropFilter);
    dropFilter.connect(dropGain);
    dropGain.connect(ctx.destination);
    dropSource.start();

    // Layer 2: Light pitter-patter (higher frequency)
    var lightBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    var lightData = lightBuffer.getChannelData(0);
    for (var j = 0; j < lightData.length; j++) {
      lightData[j] = (Math.random() > 0.7) ? (Math.random() * 2 - 1) * 0.5 : 0;
    }
    var lightSource = ctx.createBufferSource();
    lightSource.buffer = lightBuffer;
    lightSource.loop = true;
    var lightFilter = ctx.createBiquadFilter();
    lightFilter.type = 'bandpass';
    lightFilter.frequency.value = 2000;
    lightFilter.Q.value = 0.5;
    var lightGain = ctx.createGain();
    lightGain.gain.value = volume * 0.3;
    lightSource.connect(lightFilter);
    lightFilter.connect(lightGain);
    lightGain.connect(ctx.destination);
    lightSource.start();

    activeNodes.push(dropSource, dropFilter, dropGain, lightSource, lightFilter, lightGain);
    isPlaying = true;
    return { stop: stopAll };
  }

  /**
   * Ocean Waves Generator
   * Modulated noise simulating rhythmic ocean surf
   */
  function createOceanWaves(volume) {
    volume = volume || 0.3;
    var ctx = getContext();
    var bufferSize = ctx.sampleRate * 4;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var t = i / ctx.sampleRate;
      // Slow amplitude modulation (~12 second wave cycle)
      var waveEnv = Math.sin(t * Math.PI * 2 / 12) * 0.5 + 0.5;
      waveEnv = Math.pow(waveEnv, 2); // Sharper peaks for crash
      var noise = Math.random() * 2 - 1;
      data[i] = noise * waveEnv * 0.6;
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    var gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    activeNodes.push(source, filter, gain);
    isPlaying = true;
    return { stop: stopAll };
  }

  /**
   * Binaural Beat Generator
   * Creates frequency differential between left and right ears
   * @param {number} baseFreq - Base carrier frequency (Hz)
   * @param {number} beatFreq - Beat/differential frequency (Hz)
   * @param {string} type - 'delta'(0.5-4Hz), 'theta'(4-8Hz), 'alpha'(8-13Hz)
   */
  function createBinauralBeat(baseFreq, beatFreq, volume) {
    baseFreq = baseFreq || 200;
    beatFreq = beatFreq || 4;
    volume = volume || 0.15;
    var ctx = getContext();

    // Left channel: base frequency
    var leftOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.value = baseFreq;
    var leftGain = ctx.createGain();
    leftGain.gain.value = volume;

    // Right channel: base + beat frequency
    var rightOsc = ctx.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.value = baseFreq + beatFreq;
    var rightGain = ctx.createGain();
    rightGain.gain.value = volume;

    var merger = ctx.createChannelMerger(2);
    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0);
    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1);
    merger.connect(ctx.destination);

    leftOsc.start();
    rightOsc.start();
    activeNodes.push(leftOsc, leftGain, rightOsc, rightGain, merger);
    isPlaying = true;

    // Add a subtle background pink noise for comfort
    var pinkNode = createPinkNoise(volume * 0.3);
    activeNodes.push(pinkNode);

    return {
      stop: stopAll,
      setBeatFrequency: function(freq) {
        rightOsc.frequency.value = baseFreq + freq;
      }
    };
  }

  /**
   * Tibetan Singing Bowl Simulation
   * Layered sine waves with gentle beating
   */
  function createSingingBowl(volume) {
    volume = volume || 0.12;
    var ctx = getContext();
    var notes = [130.81, 196.0, 261.63, 329.63, 392.0]; // Pentatonic: C3, G3, C4, E4, G4

    notes.forEach(function(freq, idx) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq + (idx * 0.3); // Slight detune
      var gain = ctx.createGain();
      gain.gain.value = volume / notes.length;

      // Amplitude modulation for "singing" effect
      var lfo = ctx.createOscillator();
      lfo.frequency.value = 0.5 + idx * 0.3;
      var lfoGain = ctx.createGain();
      lfoGain.gain.value = volume * 0.3;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      activeNodes.push(osc, gain, lfo, lfoGain);
    });

    isPlaying = true;
    return { stop: stopAll };
  }

  /**
   * Wind Through Trees
   * Filtered noise with slow modulation
   */
  function createWindSound(volume) {
    volume = volume || 0.2;
    var ctx = getContext();
    var bufferSize = ctx.sampleRate * 3;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var t = i / ctx.sampleRate;
      var mod = Math.sin(t * 0.3) * 0.3 + Math.sin(t * 0.7) * 0.2 + 0.5;
      data[i] = (Math.random() * 2 - 1) * mod;
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.7;
    var gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    activeNodes.push(source, filter, gain);
    isPlaying = true;
    return { stop: stopAll };
  }

  // Public API
  window.SleepSounds = {
    whiteNoise: function(vol) { stopAll(); return createWhiteNoise(vol); },
    pinkNoise: function(vol) { stopAll(); return createPinkNoise(vol); },
    brownNoise: function(vol) { stopAll(); return createBrownNoise(vol); },
    rain: function(vol) { stopAll(); return createRainSound(vol); },
    ocean: function(vol) { stopAll(); return createOceanWaves(vol); },
    wind: function(vol) { stopAll(); return createWindSound(vol); },
    binauralBeat: function(base, beat, vol) { stopAll(); return createBinauralBeat(base, beat, vol); },
    singingBowl: function(vol) { stopAll(); return createSingingBowl(vol); },
    deltaWaves: function(vol) { return createBinauralBeat(200, 2, vol || 0.15); },
    thetaWaves: function(vol) { return createBinauralBeat(200, 6, vol || 0.15); },
    stop: stopAll,
    isPlaying: function() { return isPlaying; }
  };
})();
