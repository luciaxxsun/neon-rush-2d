'use strict';
/* =========================================================================
   32 fx — 像素粒子（拾取/跳跃/落地/购买/传送的即时反馈）
   数据驱动、无外部依赖；上限 260 个，超了丢最老的。
   ========================================================================= */
const FX = (() => {
  const ps = [];
  const GOLD = ['#ffd166', '#fff3b0', '#ffb703'];
  const DUST = ['#9fb4cc', '#dbe6f2', '#7f93aa'];
  const CYAN = ['#7ee7ff', '#bde9ff', '#4dc9e8'];
  const PURP = ['#c77dff', '#e0aaff', '#9d4edd'];
  const MINT = ['#7ef5c8', '#b8ffe4', '#3ee6a5'];

  function burst(x, y, n, o) {
    o = o || {};
    const pal = o.colors || GOLD;
    for (let i = 0; i < n; i++) {
      const a = (o.dir === undefined)
        ? Math.random() * Math.PI * 2
        : o.dir + (Math.random() - 0.5) * (o.spread === undefined ? 1.8 : o.spread);
      const sp = (o.speed || 70) * (0.45 + Math.random());
      ps.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (o.up || 0),
        t: 0,
        life: (o.life || 0.5) * (0.7 + Math.random() * 0.7),
        c: pal[(Math.random() * pal.length) | 0],
        s: o.size || (1 + ((Math.random() * 2) | 0)),
        g: o.grav === undefined ? 220 : o.grav
      });
    }
    if (ps.length > 260) ps.splice(0, ps.length - 260);
  }

  function update(dt) {
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.t += dt;
      if (p.t >= p.life) { ps.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.98;
    }
  }

  function draw(g) {
    for (const p of ps) {
      const k = 1 - p.t / p.life;
      g.globalAlpha = k < 0.4 ? k / 0.4 : 1;
      g.fillStyle = p.c;
      g.fillRect(p.x | 0, p.y | 0, p.s, p.s);
    }
    g.globalAlpha = 1;
  }

  return {
    burst, update, draw,
    clear() { ps.length = 0; },
    count() { return ps.length; },
    pal: { gold: GOLD, dust: DUST, cyan: CYAN, purple: PURP, mint: MINT }
  };
})();

/* 常用别名，写起来短一点 */
function fxCoin(x, y) { FX.burst(x, y, 7, { colors: FX.pal.gold, speed: 80, life: 0.5, grav: 300, up: 30 }); }
function fxJump(x, y) { FX.burst(x, y, 5, { colors: FX.pal.dust, speed: 34, life: 0.34, grav: 150, dir: -Math.PI / 2, spread: 1.1 }); }
function fxLand(x, y) { FX.burst(x, y, 8, { colors: FX.pal.dust, speed: 74, life: 0.4, grav: 320, dir: -Math.PI / 2, spread: 2.4 }); }
function fxBuy(x, y) { FX.burst(x, y, 12, { colors: FX.pal.gold, speed: 95, life: 0.65, grav: 260, up: 40 }); }
function fxWin(x, y) { FX.burst(x, y, 16, { colors: FX.pal.cyan, speed: 110, life: 0.8, grav: 200, up: 40 }); }
function fxPortal(x, y) { FX.burst(x, y, 20, { colors: FX.pal.purple, speed: 92, life: 0.85, grav: -30 }); }
