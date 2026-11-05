/* ============================================================
   models.js : optional rigged GLB runner (e.g. a Mixamo character)
   Put a file at models/runner.glb and it replaces the procedural
   Nawab body. Animation clips are matched by name:
     run   -> /run|jog|sprint/   (fallback: first clip)
     jump  -> /jump|leap/
     slide -> /slide|roll|crouch|duck/
     death -> /death|die|stumble|fall|hit/
   The photo head stays: it follows the model's "head" bone.
   ============================================================ */
ND.models = (function () {
  const LOADER_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('script failed: ' + src));
      document.head.appendChild(s);
    });
  }
  async function exists(url) {
    try { const r = await fetch(url, { method: 'HEAD' }); return r.ok; } catch (e) { return false; }
  }
  async function loadRunner(url) {
    url = url || 'models/runner.glb';
    if (!(await exists(url))) return null;
    if (!THREE.GLTFLoader) await loadScript(LOADER_URL);
    return new Promise((res, rej) => new THREE.GLTFLoader().load(url, res, undefined, rej));
  }
  return { loadRunner, exists };
})();
