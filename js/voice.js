/* ============================================================
   voice.js : the Lucknowi announcer — browser speech synthesis
   Prefers a Hindi (India) voice speaking the Devanagari line,
   then an Indian English voice reading the Hinglish, then any voice.
   No audio files. Silent if the browser has no speech support.
   ============================================================ */
ND.voice = (function () {
  const synth = window.speechSynthesis;
  const Utter = window.SpeechSynthesisUtterance;
  let voices = [], enabled = ND.store.get('nd_voice', true) !== false, speakingCount = 0;

  function load() { if (!synth) return; try { voices = synth.getVoices() || []; } catch (e) { voices = []; } }
  if (synth) { load(); try { synth.onvoiceschanged = load; } catch (e) { /* ignore */ } }

  function pick() {
    const find = (pred) => voices.find(pred);
    const hi = find((v) => /^hi([-_]IN)?$/i.test(v.lang)) || find((v) => /hindi|हिन्दी|हिंदी/i.test(v.name));
    const enIN = find((v) => /^en[-_]IN$/i.test(v.lang)) || find((v) => /india/i.test(v.name));
    const any = find((v) => v.default) || find((v) => /^en/i.test(v.lang)) || voices[0];
    return { hi, enIN, any };
  }
  function clean(text) {
    return String(text).replace(/[↑↓←→]/g, '').replace(/[—–]/g, ',').replace(/\s*,\s*,/g, ',').replace(/\s+/g, ' ').trim();
  }

  const V = {
    available: () => !!(synth && Utter),
    isEnabled: () => enabled,
    setEnabled(on) { enabled = !!on; ND.store.set('nd_voice', enabled); if (!enabled) V.cancel(); },
    toggle() { V.setEnabled(!enabled); return enabled; },
    cancel() { if (synth) { try { synth.cancel(); } catch (e) { /* ignore */ } } speakingCount = 0; if (ND.audio && ND.audio.music) ND.audio.music.duck(false); },
    busy: () => !!(synth && (synth.speaking || synth.pending)),
    // opts: force (cut the current line), queue (speak after the current line), rate, pitch
    say(text, opts) {
      opts = opts || {};
      if (!V.available() || !enabled || !text) return false;
      if (ND.audio && ND.audio.isMuted()) return false;
      if (!voices.length) load();
      if (V.busy()) { if (opts.force) V.cancel(); else if (!opts.queue) return false; }
      const v = pick(), hiText = ND.TEXT.hi[text];
      const u = new Utter();
      if (v.hi && hiText) { u.text = hiText; u.voice = v.hi; u.lang = v.hi.lang || 'hi-IN'; }
      else if (v.enIN) { u.text = clean(text); u.voice = v.enIN; u.lang = v.enIN.lang || 'en-IN'; }
      else { u.text = clean(text); if (v.any) { u.voice = v.any; u.lang = v.any.lang; } else u.lang = 'en-IN'; }
      u.rate = opts.rate || 1.0; u.pitch = opts.pitch || 1.0; u.volume = 1;
      u.onstart = () => { speakingCount++; if (ND.audio && ND.audio.music) ND.audio.music.duck(true); };
      const done = () => { speakingCount = Math.max(0, speakingCount - 1); if (speakingCount === 0 && ND.audio && ND.audio.music && ND.game && ND.game.state === 'playing') ND.audio.music.duck(false); };
      u.onend = done; u.onerror = done;
      try { synth.speak(u); } catch (e) { return false; }
      return true;
    }
  };
  return V;
})();
