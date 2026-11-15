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

/* ---------- 简易音效 ---------- */
const SFX = (() => {
  let ac = null, muted = false;
  function ensure() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    return ac;
  }
  function beep(f, dur, type, vol) {
    const a = ensure(); if (!a || muted) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, a.currentTime);
    g.gain.setValueAtTime(0.0001, a.currentTime);
    g.gain.exponentialRampToValueAtTime(vol || 0.05, a.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start(); o.stop(a.currentTime + dur + 0.02);
  }
  return {
    coin() { beep(880, 0.07, 'square', 0.035); setTimeout(() => beep(1320, 0.09, 'square', 0.03), 55); },
    jump() { beep(300, 0.08, 'square', 0.03); },
    land() { beep(150, 0.05, 'triangle', 0.03); },
    task() { beep(660, 0.09, 'square', 0.04); setTimeout(() => beep(990, 0.12, 'square', 0.04), 90); setTimeout(() => beep(1320, 0.16, 'square', 0.035), 200); },
    door() { beep(440, 0.1, 'sine', 0.04); setTimeout(() => beep(220, 0.14, 'sine', 0.035), 90); },
    fall() { beep(220, 0.2, 'sawtooth', 0.03); setTimeout(() => beep(120, 0.25, 'sawtooth', 0.03), 150); },
    buy() { beep(760, 0.06, 'square', 0.035); setTimeout(() => beep(1140, 0.1, 'square', 0.03), 60); },
    mute(v) { muted = v; },
    isMuted() { return muted; },
    resume() { const a = ensure(); if (a && a.state === 'suspended') a.resume(); }
  };
})();
