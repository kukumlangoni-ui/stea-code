/**
 * Global autoplay safety net.
 *
 * Browsers block audible autoplay without a user gesture, but some preview
 * components (e.g. Web Audio synth engines) try to start sound on load. This
 * guard blocks media playback and Web Audio resume until the user has
 * interacted with the page at least once (`userActivation.hasBeenActive`).
 *
 * Scope note: this patches the CURRENT window's prototypes. Product previews
 * run inside their own sandboxed iframes, which have separate globals; those
 * are protected by the iframe sandbox (no `allow-autoplay` token) instead.
 *
 * Import this as a side effect in main.jsx so it installs before any
 * component mounts.
 */

const hasUserActivated = () => {
  if (typeof navigator === "undefined") return true; // SSR / non-browser: never block
  const activation = navigator.userActivation;
  // If the activation API is unavailable, don't break playback entirely.
  if (!activation) return true;
  return Boolean(activation.hasBeenActive);
};

let installed = false;

// Minimal Web Audio look-alike used when the browser refuses to construct an
// AudioContext (autoplay policy, missing device, insecure context). Preview
// components can keep calling the API; every node is a no-op, so nothing
// throws and nothing is heard.
const makeSilentNode = () => {
  const param = {
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    setTargetAtTime() {},
    cancelScheduledValues() {},
  };
  return {
    connect() { return this; },
    disconnect() {},
    start() {},
    stop() {},
    gain: param,
    frequency: param,
    detune: param,
    Q: param,
    pan: param,
    type: "sine",
    buffer: null,
    onended: null,
  };
};

const SILENT_AUDIO_CONTEXT = {
  state: "suspended",
  sampleRate: 44100,
  currentTime: 0,
  destination: makeSilentNode(),
  createOscillator: makeSilentNode,
  createGain: makeSilentNode,
  createBufferSource: makeSilentNode,
  createAnalyser: makeSilentNode,
  createBiquadFilter: makeSilentNode,
  createDynamicsCompressor: makeSilentNode,
  createStereoPanner: makeSilentNode,
  createWaveShaper: makeSilentNode,
  createDelay: makeSilentNode,
  createConvolver: makeSilentNode,
  createChannelMerger: makeSilentNode,
  createChannelSplitter: makeSilentNode,
  createBuffer: () => ({ getChannelData: () => new Float32Array(0) }),
  suspend: () => Promise.resolve(),
  resume: () => Promise.resolve(),
  close: () => Promise.resolve(),
};

export function installAudioGuard() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // 1. <audio> / <video> elements.
  try {
    if (typeof HTMLMediaElement !== "undefined" && HTMLMediaElement.prototype.play) {
      const originalPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function patchedMediaPlay(...args) {
        try {
          // Muted, visual-only previews are allowed to autoplay (browser policy
          // permits muted autoplay); block only audible media before activation.
          if (!hasUserActivated() && !this.muted) {
            console.warn("[audio-guard] Blocked audible media autoplay before user interaction");
            return Promise.resolve();
          }
          const result = originalPlay.apply(this, args);
          // Chrome rejects with NotAllowedError instead of throwing — swallow
          // it so an unhandled rejection can never surface as a page crash.
          return result && typeof result.catch === "function"
            ? result.catch(() => {})
            : result;
        } catch {
          return Promise.resolve();
        }
      };
    }
  } catch (error) {
    console.warn("[audio-guard] Could not patch media playback:", error);
  }

  // 2. Web Audio API — block resume() before activation; keep a pre-activated
  //    context suspended so nothing can emit sound without a gesture.
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const OriginalResume = AudioCtx.prototype.resume;
      if (typeof OriginalResume === "function") {
        AudioCtx.prototype.resume = function patchedResume(...args) {
          if (!hasUserActivated()) {
            console.warn("[audio-guard] Blocked AudioContext.resume() before user interaction");
            return Promise.resolve();
          }
          try {
            return OriginalResume.apply(this, args)?.catch?.(() => {}) ?? Promise.resolve();
          } catch {
            return Promise.resolve();
          }
        };
      }
    } catch (error) {
      console.warn("[audio-guard] Could not patch AudioContext.resume:", error);
    }

    const OriginalCtor = AudioCtx;
    const PatchedAudioContext = function patchedAudioContext(...args) {
      let ctx;
      try {
        ctx = new OriginalCtor(...args);
      } catch (error) {
        // Some browsers/WebViews throw synchronously when audio is blocked.
        // Fall back to silent mode instead of crashing the React tree.
        console.warn("[audio-guard] AudioContext unavailable — silent mode:", error?.message || error);
        return SILENT_AUDIO_CONTEXT;
      }
      try {
        if (!hasUserActivated() && ctx.state === "running") {
          ctx.suspend?.().catch?.(() => {});
        }
      } catch { /* state probe failed — context still usable */ }
      return ctx;
    };
    PatchedAudioContext.prototype = OriginalCtor.prototype;

    window.AudioContext = PatchedAudioContext;
    if (window.webkitAudioContext) window.webkitAudioContext = PatchedAudioContext;
  } catch (error) {
    // Assignment can fail in locked-down WebViews. Never let the guard break
    // the bundle — audio just runs unguarded.
    console.warn("[audio-guard] Could not install Web Audio guard:", error);
  }
}

// Install immediately on import (side effect), but never let it throw: a
// module-evaluation error here would blank the entire app before React mounts.
try {
  installAudioGuard();
} catch (error) {
  console.warn("[audio-guard] Installation skipped:", error);
}
