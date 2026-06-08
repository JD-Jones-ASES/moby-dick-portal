// Off-by-default synthesized ocean ambience (Phase 3). Pure Web Audio — zero audio files, nothing
// hosted or streamed. A gentle bed of filtered brown noise (waves) under a low sine (hull/wind),
// through a master gain that ramps in/out. Created only on a user gesture (browser autoplay policy),
// disabled entirely under prefers-reduced-motion, and degrades silently when Web Audio is absent.
//
// Persists mdp-sound ("on"/"off"). On a page where it was last "on", ambience resumes on the first
// user gesture in the new document (navigation can't carry an AudioContext across page loads).

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

const KEY = "mdp-sound";

export function initAmbient() {
  const btn = document.getElementById("ambient-toggle");
  if (!btn) return;

  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AC = window.AudioContext || window.webkitAudioContext;
  // Disabled entirely under reduced motion or without Web Audio: remove the control so it can't lie.
  if (reduce || !AC) { btn.remove(); return; }

  let ctx = null, master = null, on = false, suspendTimer = 0;

  function buildGraph() {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    // Waves: looping brown-noise buffer through a lowpass whose cutoff drifts on a slow LFO (swell).
    const noise = ctx.createBufferSource();
    noise.buffer = brownNoise(ctx, 3);
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 460;
    lp.Q.value = 0.6;
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.07;
    const swellGain = ctx.createGain();
    swellGain.gain.value = 200;
    swell.connect(swellGain).connect(lp.frequency);
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.55;
    noise.connect(lp).connect(noiseGain).connect(master);

    // Hull / wind: a quiet low sine for depth.
    const hum = ctx.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 57;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.05;
    hum.connect(humGain).connect(master);

    noise.start();
    swell.start();
    hum.start();
  }

  function setOn(want) {
    if (want && !ctx) buildGraph();
    clearTimeout(suspendTimer);
    if (want && ctx && ctx.state === "suspended") ctx.resume();
    on = want;
    const t = ctx ? ctx.currentTime : 0;
    if (master) {
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
      master.gain.linearRampToValueAtTime(want ? 0.16 : 0.0001, t + (want ? 1.4 : 0.6));
    }
    if (!want) {
      // Park the audio thread after the fade so OFF costs ~0 CPU (mobile battery); re-enabling
      // clears this timer and resumes above. Delay > the 0.6s fade so it never clips/pops.
      suspendTimer = setTimeout(() => { if (!on && ctx && ctx.state === "running") ctx.suspend(); }, 700);
    }
    // Only claim "on" once audio is actually (re)started — never before the first gesture.
    btn.setAttribute("aria-pressed", String(want));
    lsSet(KEY, want ? "on" : "off");
  }

  btn.addEventListener("click", () => setOn(!on));

  // Continuity: if it was on, resume on the FIRST gesture in this document (autoplay policy forbids
  // audio before a gesture). The button stays "off" until that happens, so its state never lies.
  if (lsGet(KEY) === "on") {
    const start = (e) => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      // If that first gesture is a click on the toggle itself, let the click handler be the sole
      // arbiter (avoids an on->off swell when the returning user clicks to turn it off).
      if (e && e.target && e.target.closest && e.target.closest("#ambient-toggle")) return;
      setOn(true);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
  }
}

// ~N seconds of looping brown noise, normalized to avoid clipping.
function brownNoise(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0, max = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last;
    const a = Math.abs(last);
    if (a > max) max = a;
  }
  const scale = max > 0 ? 0.9 / max : 1;
  for (let i = 0; i < len; i++) data[i] *= scale;
  return buf;
}
