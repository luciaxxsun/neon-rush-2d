'use strict';
/* =========================================================================
   00 core — 画布、像素尺度、输入、全局状态
   ========================================================================= */

const VIEW = { w: 640, h: 360 };
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = VIEW.w;
canvas.height = VIEW.h;
ctx.imageSmoothingEnabled = false;

const G = {
  scene: 'spawn',
  world: 0,
  coins: 0,
  chips: 0,
  time: 0,
  started: false,
  paused: false,
  won: false,
  falls: 0,
  lastWorld: -1,
  shopOpen: null,
  fade: 1,           // 过渡遮罩 0..1
  fades: 0,          // 目标
  tasksDone: {},     // 'w0c0t1': true
  chal: 0,
  up: { spd: 0, jmp: 0, dj: false, dash: false, detect: false, coat: 0, coinBonus: 0, chipBonus: 0, grip: false, boots: false },
  buffs: [],
  log: []
};

const input = { l: 0, r: 0, jh: 0, jp: 0, e: 0, dash: 0 };
const CAM = { x: 0, y: 0 };

/* 玩家 */
const P = {
  x: 0, y: 0, w: 12, h: 18, vx: 0, vy: 0,
  onGround: false, face: 1, anim: 0, state: 'idle',
  coyote: 0, buffer: 0, jumps: 0, dashT: 0, dashCd: 0,
  spawnX: 0, respawnT: 0
};

const keys = Object.create(null);

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function chance(p) { return Math.random() < p; }
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* 整数倍放大，像素不变形 */
function fit() {
  const st = document.getElementById('stage');
  let s = Math.min(innerWidth / VIEW.w, innerHeight / VIEW.h);
  const near = Math.round(s);
  if (Math.abs(s - near) < 0.02) s = near;
  const w = Math.round(VIEW.w * s), h = Math.round(VIEW.h * s);
  st.style.width = w + 'px';
  st.style.height = h + 'px';
  st.style.setProperty('--s', (w / VIEW.w).toFixed(4));
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
addEventListener('resize', fit);

/* ---------- 全屏 ---------- */
function toggleFS() {
  const d = document, el = d.documentElement;
  if (d.fullscreenElement || d.webkitFullscreenElement) {
    const f = d.exitFullscreen || d.webkitExitFullscreen;
    if (f) f.call(d);
  } else {
    const f = el.requestFullscreen || el.webkitRequestFullscreen;
    if (f) { const p = f.call(el); if (p && p.catch) p.catch(() => {}); }
  }
}
addEventListener('fullscreenchange', () => setTimeout(fit, 80));
addEventListener('webkitfullscreenchange', () => setTimeout(fit, 80));
{ const b = document.getElementById('fsBtn'); if (b) b.onclick = toggleFS; }

/* ---------- 键盘 ---------- */
const JUMPK = { Space: 1, KeyW: 1, ArrowUp: 1 };
addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (e.repeat) return;
  if (!G.started) { if (typeof startGame === 'function') { startGame(); return; } }
  if (e.code === 'KeyF') { toggleFS(); return; }
  keys[e.code] = 1;
  if (JUMPK[e.code]) { input.jp = 1; input.jh = 1; }
  if (e.code === 'KeyE' || e.code === 'Enter') {
    if (G.shopOpen) { closeShop(); return; }
    if (G.liftOpen) { closeLift(); return; }
    input.e = 1;
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.dash = 1;
  if (e.code === 'Escape') window.dispatchEvent(new Event('nr-esc'));
  sync();
});
addEventListener('keyup', e => {
  keys[e.code] = 0;
  if (JUMPK[e.code]) input.jh = 0;
  sync();
});
function sync() {
  input.l = (keys.KeyA || keys.ArrowLeft) ? 1 : 0;
  input.r = (keys.KeyD || keys.ArrowRight) ? 1 : 0;
}

/* ---------- 音效 / 背景音乐：forge_sfx + forge_music 生成，base64 内嵌 ---------- */
const SFX = (() => {
  let ac = null, muted = false, bgmOn = true, loading = false, bgmNode = null, bgmBuf = null;
  const buf = {};
  const last = {};          // 每种音效最近一次触发的时刻
  const MIN_GAP = 0.09;     // 同一种音效 90ms 内不重复，防止连点叠成一串电流声

  function ensure() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    return ac;
  }

  function b64arr(s) {
    const bin = atob(s), n = bin.length, u8 = new Uint8Array(n);
    for (let i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    return u8.buffer;
  }

  function load() {
    if (loading) return;
    loading = true;
    const D = (typeof SFX_DATA !== 'undefined') ? SFX_DATA : null;
    const a = ensure();
    if (!D || !a) { loading = false; return; }
    for (const k in D) {
      buf[k] = [];
      D[k].forEach((s, i) => {
        try {
          const p = a.decodeAudioData(b64arr(s));
          if (p && p.then) p.then(d => { buf[k][i] = d; }).catch(() => {});
        } catch (e) { /* 老浏览器：留空，这个音效就不响 */ }
      });
    }
    if (typeof BGM_DATA !== 'undefined' && BGM_DATA) {
      try {
        const p = a.decodeAudioData(b64arr(BGM_DATA));
        if (p && p.then) p.then(d => { bgmBuf = d; bgmStart(); }).catch(() => {});
      } catch (e) { /* 没有背景音乐也能玩 */ }
    }
  }

  // 只播已经解码好的真音效；没解码好就静音等待，不再用振荡器兜底
  function hit(k, vol) {
    const a = ensure();
    if (!a || muted) return;
    const now = a.currentTime;
    if (last[k] !== undefined && now - last[k] < MIN_GAP) return;
    if (!buf[k] && typeof SFX_DATA !== 'undefined') load();
    const arr = buf[k];
    if (!arr) return;
    const ok = arr.filter(Boolean);
    if (!ok.length) return;
    last[k] = now;
    const src = a.createBufferSource();
    src.buffer = ok[(Math.random() * ok.length) | 0];
    const g = a.createGain();
    g.gain.value = vol === undefined ? 0.5 : vol;
    src.connect(g).connect(a.destination);
    src.start();
  }

  function bgmStart() {
    const a = ensure();
    if (!a || !bgmBuf || bgmNode || !bgmOn) return;
    const src = a.createBufferSource();
    src.buffer = bgmBuf;
    src.loop = true;
    const g = a.createGain();
    g.gain.value = 0.15;
    src.connect(g).connect(a.destination);
    src.start();
    bgmNode = { src, g };
  }

  function bgmStop() {
    if (!bgmNode) return;
    try { bgmNode.src.stop(); } catch (e) { /* 已经停了 */ }
    bgmNode = null;
  }

  return {
    load,
    coin() { hit('coin', 0.40); },
    jump() { hit('jump', 0.30); },
    land() { hit('land', 0.42); },
    task() { hit('task', 0.52); },
    door() { hit('door', 0.34); },
    fall() { hit('fall', 0.40); },
    buy() { hit('buy', 0.38); },
    portal() { hit('portal', 0.38); },
    chip() { hit('chip', 0.28); },
    select() { hit('select', 0.24); },
    mute(v) { muted = v; },
    isMuted() { return muted; },
    bgmToggle() {
      bgmOn = !bgmOn;
      if (bgmOn) { const a = ensure(); if (a && a.state === 'suspended') a.resume(); bgmStart(); }
      else bgmStop();
      return bgmOn;
    },
    isBgmOn() { return bgmOn; },
    bgmStart,
    resume() {
      const a = ensure();
      if (a && a.state === 'suspended') a.resume();
      load();
      bgmStart();
    }
  };
})();
