'use strict';
/* =========================================================================
   92 telemetry — 给 GameForge 试玩机器人读的状态（window.__gameforge）
   不影响正常游玩；没有这台机器人时只是每帧同步几个数字。
   ========================================================================= */
(function () {
  const GF = (window.__gameforge = {
    version: 2,
    genre: 'parkour',
    controls: {
      move: ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'],
      action: ['Space', 'KeyE'],
      start: ['Enter', 'Space', 'KeyE']
    },
    state: { scene: 'title', coins: 0, chips: 0, x: 0, y: 0, falls: 0, area: '', started: 0 },
    events: [],
    fps: 0
  });

  window.gfEvent = function (type, data) {
    const ev = { t: +(performance.now() / 1000).toFixed(2), type };
    if (data) for (const k in data) ev[k] = data[k];
    GF.events.push(ev);
    if (GF.events.length > 80) GF.events.splice(0, GF.events.length - 80);
  };

  /* ---- 状态同步（每帧轻量，直接读已有变量） ---- */
  function sync() {
    const s = GF.state;
    try {
      s.scene = G.scene === 'inside' ? 'inside' : (G.scene || 'title');
      s.coins = G.coins | 0;
      s.chips = G.chips | 0;
      s.falls = G.falls | 0;
      s.x = Math.round(P.x);
      s.y = Math.round(P.y);
      s.started = G.started ? 1 : 0;
      const el = document.getElementById('area');
      if (el) s.area = el.textContent;
    } catch (e) { /* 早期还没初始化，下一帧再来 */ }
    requestAnimationFrame(sync);
  }

  /* ---- fps（0.5 秒窗口） ---- */
  (function tick() {
    let fr = 0, t0 = performance.now();
    (function f() {
      fr++;
      const t = performance.now();
      if (t - t0 >= 500) { GF.fps = Math.round(fr * 1000 / (t - t0)); fr = 0; t0 = t; }
      requestAnimationFrame(f);
    })();
  })();

  requestAnimationFrame(sync);
})();
