'use strict';
/* =========================================================================
   16 inside — 店铺室内场景：可以走动、可以逛货架、柜台开面板买东西
   ========================================================================= */

const ROOM_FY = 300;

/* 颜色明暗 */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let R = (n >> 16) & 255, G = (n >> 8) & 255, B = n & 255;
  R = Math.round(clamp(R * k, 0, 255));
  G = Math.round(clamp(G * k, 0, 255));
  B = Math.round(clamp(B * k, 0, 255));
  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

/* ---------------- 场景数据 ---------------- */
function buildInside(shopId) {
  const list = (typeof SHOPS !== 'undefined') ? SHOPS : [];
  const shop = list.find(s => s.id === shopId) || list[0];
  const n = shop.items.length;
  const W = Math.max(860, 340 + n * 112 + 420);
  const FY = ROOM_FY;

  const plats = [
    { x: 0, y: FY, w: W, h: 60, floor: true },
    { x: -70, y: 0, w: 70, h: 380, wall: true },
    { x: W, y: 0, w: 70, h: 380, wall: true }
  ];

  const spots = [];
  const stands = [];
  for (let i = 0; i < n; i++) {
    const sx = 470 + i * 112;
    stands.push({ x: sx, y: FY, item: shop.items[i], i });
    spots.push({ kind: 'buyStand', x: sx, y: FY, r: 44, label: shop.items[i].name, price: shop.items[i].price, i });
  }

  const cx = W - 250;
  spots.push({ kind: 'buyDesk', x: cx - 28, y: FY, r: 50, label: '柜台 · 选购' });
  spots.push({ kind: 'leave', x: 88, y: FY, r: 48, label: '出门 · 回岛上' });

  return {
    id: 'inside', kind: 'inside', bg: 'inside', pal: PAL.spawn,
    title: shop.name + ' · 店内', shopId,
    shopName: shop.name, keeper: shop.keeper,
    platforms: plats, spots, buildings: [], decos: [], coins: [], beacons: [],
    stands, counter: { x: cx, y: FY, w: 150, h: 34 },
    door: { x: 88, y: FY },
    roomW: W, floors: [],
    b: { x0: 0, x1: W, y0: 0, y1: 0 },
    spawn: { x: 168, y: FY - 24 },
    killY: 999, weather: 'none', portalN: 0
  };
}

/* ---------------- 进出店 ---------------- */
function enterShop(id) {
  if (!SC || SC.kind === 'inside') return;
  G.insideBack = {
    scene: SC.kind, world: G.world, chal: G.chal,
    x: P.x, y: P.y
  };
  gotoScene('inside', id);
}

function exitShop() {
  const b = G.insideBack;
  G.insideBack = null;
  if (!b) { gotoScene('spawn'); return; }
  SFX.door();
  loadScene(b.scene, b.world, b.chal);
  P.x = b.x; P.y = b.y; P.vx = 0; P.vy = 0;
  CAM.x = clamp(P.x - VIEW.w * 0.35, SC.b.x0, SC.b.x1 - VIEW.w);
  CAM.y = clamp(P.y - VIEW.h * 0.55, SC.b.y0, SC.b.y1);
  G.fade = 1;
  scanInteract();
}

/* ---------------- 绘制：房间外壳 ---------------- */
function drawRoomShell(sc, A, W, t) {
  const FY = ROOM_FY;

  // 后墙
  r(0, 0, W, FY, shade(A.body, 0.95));
  let g = ctx.createLinearGradient(0, 0, 0, FY);
  g.addColorStop(0, 'rgba(0,0,0,.42)');
  g.addColorStop(.42, 'rgba(0,0,0,.06)');
  g.addColorStop(1, 'rgba(0,0,0,.34)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, FY);
  // 墙板竖缝
  for (let x = 0; x < W; x += 72) rl(x, 0, 1, FY, '#000000', 0.12);

  // 天花板
  r(0, 0, W, 46, '#080e18');
  r(0, 44, W, 3, '#22304a');
  r(0, 20, W, 5, '#16223a');
  rl(0, 20, W, 1, '#33456a', 0.6);

  // 吊灯
  for (let x = 150; x < W - 60; x += 236) {
    r(x - 1, 46, 2, 22, '#2b3a56');
    r(x - 15, 68, 30, 4, '#3d5373');
    r(x - 14, 72, 28, 4, '#ffe6b8');
    rl(x - 20, 70, 40, 10, '#ffe6b8', 0.18);
    const cw = 168;
    const lg = ctx.createLinearGradient(0, 76, 0, ROOM_FY);
    lg.addColorStop(0, 'rgba(255,230,184,.13)');
    lg.addColorStop(0.5, 'rgba(255,230,184,.05)');
    lg.addColorStop(1, 'rgba(255,230,184,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(x - 12, 76);
    ctx.lineTo(x + 12, 76);
    ctx.lineTo(x + cw / 2, ROOM_FY);
    ctx.lineTo(x - cw / 2, ROOM_FY);
    ctx.closePath();
    ctx.fill();
  }

  // 护墙板
  r(0, FY - 74, W, 74, shade(A.body, 0.7));
  r(0, FY - 74, W, 2, shade(A.trim, 0.65));
  r(0, FY - 73, W, 1, '#000000');
  for (let x = 0; x < W; x += 36) rl(x, FY - 74, 1, 74, '#000000', 0.22);

  // 地板
  r(0, FY, W, 62, '#0d1420');
  r(0, FY, W, 3, shade(A.body, 1.5));
  r(0, FY + 3, W, 1, '#000000');
  for (let x = 0; x < W; x += 48) rl(x, FY + 3, 2, 58, '#000000', 0.32);
  for (let i = 0; i < 3; i++) rl(0, FY + 14 + i * 16, W, 1, '#000000', 0.2);
  rl(0, FY + 4, W, 12, A.trim, 0.045);

  // 霓虹招牌
  const sx = Math.round(W / 2);
  r(sx - 96, 54, 192, 30, '#060b14');
  r(sx - 96, 54, 192, 2, A.trim);
  r(sx - 96, 82, 192, 2, A.trim);
  rl(sx - 92, 56, 184, 26, A.trim, 0.08);
  signText(A.sign, sx, 69, A.trim, 13, true);

  // 橱窗（街道）
  const wx = 176, wy = 116, ww = 116, wh = 86;
  r(wx - 5, wy - 5, ww + 10, wh + 10, '#080e18');
  r(wx - 2, wy - 2, ww + 4, wh + 4, '#33456a');
  r(wx, wy, ww, wh, '#08182a');
  const wr = mulberry32(91);
  // 街上霓虹
  for (let i = 0; i < 9; i++) {
    const cols = ['#22e0ff', '#ff3ea5', '#ffcf4d', '#5dff9b', '#7a4bff'];
    const cc = cols[Math.floor(wr() * 5)];
    const bx = wx + 6 + wr() * (ww - 22);
    const by = wy + 10 + wr() * (wh - 30);
    rl(bx, by, 6 + wr() * 12, 3, cc, 0.55 + wr() * 0.35);
  }
  // 楼影
  for (let i = 0; i < 3; i++) {
    const bx = wx + 10 + i * 36;
    r(bx, wy + 40, 26, wh - 40, '#040c16');
    for (let k = 0; k < 4; k++) rl(bx + 4, wy + 48 + k * 14, 18, 2, '#ffcf4d', 0.18);
  }
  // 雨丝
  for (let i = 0; i < 18; i++) {
    const rx2 = wx + wr() * ww, ry2 = wy + wr() * wh;
    rl(rx2, ry2, 1, 6, '#9fd0ff', 0.2);
  }
  r(wx + ww / 2 - 1, wy, 2, wh, '#33456a');
  r(wx, wy + 52, ww, 2, '#33456a');
  rl(wx + 4, wy + 4, 14, wh - 8, '#ffffff', 0.05);

  // 门洞（外面是街道）
  const dx = sc.door.x;
  r(dx - 36, FY - 104, 72, 104, '#0a1220');
  r(dx - 34, FY - 102, 68, 2, '#33456a');
  r(dx - 30, FY - 96, 60, 96, '#0a1c2e');
  // 门外霓虹 + 雨
  const dr = mulberry32(37);
  for (let i = 0; i < 8; i++) {
    const cc = ['#22e0ff', '#ff3ea5', '#ffcf4d', '#5dff9b'][i % 4];
    rl(dx - 26 + dr() * 48, FY - 88 + dr() * 60, 5 + dr() * 8, 3, cc, 0.5);
    rl(dx - 24 + dr() * 50, FY - 90 + dr() * 80, 1, 7, '#9fd0ff', 0.16);
  }
  // 外面地光
  rl(dx - 30, FY - 17, 60, 17, '#22e0ff', 0.10);
  r(dx - 30, FY - 96, 2, 96, '#22304a');
  r(dx + 28, FY - 96, 2, 96, '#22304a');
  // 出口牌
  r(dx - 28, FY - 122, 56, 15, '#04160e');
  rl(dx - 28, FY - 122, 56, 1, '#5dff9b', 0.8);
  signText('出 口', dx, FY - 115, '#5dff9b', 8, false);
  // 地垫
  r(dx - 32, FY - 5, 64, 5, '#1b2740');

  // 每家店的专属陈设（300~440 那一段墙面/地面）
  drawAccent(sc, A, W, t);

  // 墙上的货架（展台正上方）
  const shx = 464, shy = 138, len = Math.max(120, W - 300 - shx);
  for (let row = 0; row < 2; row++) {
    const sy = shy + row * 62;
    rl(shx, sy + 4, len, 6, '#000000', 0.35);
    r(shx, sy, len, 4, '#33456a');
    r(shx, sy + 4, len, 2, '#0a0f19');
    const rng = mulberry32(1200 + row * 31 + (sc.shopId || '').length * 7);
    for (let x = shx + 8; x < shx + len - 14; x += 18) {
      const hh = 11 + rng() * 14;
      const cols = ['#ff3ea5', '#22e0ff', '#ffcf4d', '#5dff9b', '#7a4bff', '#ff8ad5'];
      const cc = cols[Math.floor(rng() * 6)];
      r(x, sy - hh, 12, hh, shade(cc, 0.55));
      rl(x, sy - hh, 12, 2, cc, 0.8);
      rl(x, sy - hh + 2, 3, hh - 4, '#ffffff', 0.07);
    }
  }
}

/* ---------------- 每家店的专属陈设（左起 300，宽约 140） ---------------- */
function drawAccent(sc, A, W, t) {
  const id = sc.shopId, FY = ROOM_FY, ax = 300;

  if (id === 'ramen') {
    for (let i = 0; i < 3; i++) {
      const lx = ax + 20 + i * 44;
      r(lx - 9, 98, 18, 26, '#c8392b');
      r(lx - 9, 98, 18, 3, '#ff8a5c');
      r(lx - 1, 124, 2, 4, '#c8392b');
      rl(lx - 4, 102, 6, 18, '#000000', 0.18);
    }
    r(ax + 2, FY - 46, 136, 10, '#8a5220');
    r(ax + 2, FY - 46, 136, 2, '#ffcf4d');
    r(ax + 2, FY - 38, 136, 2, '#5a3418');
    r(ax + 2, FY - 36, 136, 36, '#4a2a12');
    for (let x = ax + 8; x < ax + 134; x += 12) rl(x, FY - 36, 1, 36, '#2a1608', 0.85);
    rl(ax + 2, FY - 35, 136, 3, '#a86a2a', 0.5);
    r(ax + 2, FY - 3, 132, 3, '#1a0f06');
    r(ax + 136, FY - 46, 2, 46, '#0a0704');
    for (let x = ax + 10; x < ax + 130; x += 18) rl(x, FY - 36, 1, 36, '#000000', 0.3);
    for (let i = 0; i < 3; i++) {
      const px = ax + 22 + i * 44;
      rl(px, 128 + Math.sin(t * 1.3 + i) * 3, 3, 26, '#ffffff', 0.10);
    }
  } else if (id === 'music') {
    for (let i = 0; i < 2; i++) {
      const vx = ax + 34 + i * 62;
      oval(vx, 172, 26, 26, '#141024');
      oval(vx, 172, 23, 23, '#221a3e');
      oval(vx, 172, 8, 8, A.trim);
      oval(vx, 172, 2, 2, '#0a0812');
    }
    r(ax + 2, FY - 70, 136, 6, '#1b2740');
    for (let i = 0; i < 7; i++) {
      r(ax + 8 + i * 18, FY - 92, 13, 22, ['#7a4bff', '#22e0ff', '#ff3ea5', '#ffcf4d'][i % 4]);
    }
  } else if (id === 'cloth') {
    for (let i = 0; i < 2; i++) {
      const mx = ax + 34 + i * 66;
      r(mx - 8, FY - 66, 16, 12, '#d8a98a');
      r(mx - 11, FY - 54, 22, 30, i ? '#ff8ad5' : '#22e0ff');
      rl(mx - 11, FY - 54, 5, 30, '#ffffff', 0.07);
      r(mx - 9, FY - 24, 7, 24, '#2b3a56');
      r(mx + 2, FY - 24, 7, 24, '#2b3a56');
      r(mx - 18, FY - 57, 36, 3, '#4a6088');
      r(mx - 11, FY - 2, 22, 3, '#0a1220');
    }
  } else if (id === 'flower') {
    for (let i = 0; i < 2; i++) {
      const fx = ax + 36 + i * 62;
      r(fx - 14, FY - 26, 28, 26, '#1b3a2c');
      r(fx - 14, FY - 26, 28, 3, '#5dff9b');
      r(fx - 14, FY - 26, 3, 26, '#2b5a42');
      for (let k = 0; k < 5; k++) {
        const cxx = fx - 9 + k * 5;
        r(cxx, FY - 44 - (k % 2) * 8, 5, 5, k % 2 ? '#ff8ad5' : '#ffcf4d');
        rl(cxx + 2, FY - 41, 1, 16, '#5dff9b', 0.45);
      }
    }
    r(ax + 4, FY - 66, 132, 4, '#33456a');
    for (let i = 0; i < 6; i++) r(ax + 10 + i * 21, FY - 62, 12, 8, '#2f7a4f');
  } else if (id === 'arcade') {
    const axc = ax + 40;
    r(axc - 26, FY - 66, 52, 66, '#141a2c');
    r(axc - 26, FY - 66, 52, 4, A.trim);
    r(axc - 21, FY - 60, 42, 28, '#0a1020');
    rl(axc - 20, FY - 59, 40, 26, '#ff3ea5', 0.22 + 0.12 * Math.sin(t * 4));
    r(axc - 18, FY - 32, 36, 7, '#1c2438');
    r(axc - 15, FY - 30, 4, 4, '#ff3ea5');
    r(axc - 7, FY - 30, 4, 4, '#22e0ff');
    r(axc + 1, FY - 30, 4, 4, '#ffcf4d');
    r(axc - 22, FY - 20, 44, 20, '#0e1420');
    rl(axc - 22, FY - 20, 44, 2, A.trim, 0.5);
  } else if (id === 'bank') {
    const vx = ax + 70;
    oval(vx, FY - 96, 46, 46, '#0d1a16');
    oval(vx, FY - 96, 41, 41, '#16342a');
    oval(vx, FY - 96, 34, 34, '#0a1c18');
    r(vx - 5, FY - 101, 10, 10, A.trim);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      r(vx + Math.cos(a) * 31 - 1, FY - 96 + Math.sin(a) * 31 - 1, 3, 3, A.trim);
    }
    r(ax + 4, FY - 74, 44, 30, '#0b1a16');
    r(ax + 4, FY - 74, 44, 2, A.trim);
    rl(ax + 8, FY - 70, 36, 22, '#5dff9b', 0.12);
  } else if (id === 'cyber') {
    r(ax + 24, 128, 6, 64, A.trim);
    r(ax + 1, 152, 52, 6, A.trim);
    rl(ax - 8, 120, 70, 80, A.trim, 0.06);
    r(ax + 84, FY - 92, 46, 92, '#0c1420');
    r(ax + 84, FY - 92, 46, 2, A.trim);
    for (let i = 0; i < 2; i++) {
      r(ax + 92, FY - 82 + i * 34, 30, 22, '#101a2b');
      r(ax + 98, FY - 76 + i * 34, 18, 8, '#d8a98a');
      r(ax + 100, FY - 66 + i * 34, 14, 10, '#c0c8d8');
    }
    rl(ax + 86, FY - 90, 42, 88, A.trim, 0.05);
  } else if (id === 'cafe') {
    for (let i = 0; i < 2; i++) {
      const cx2 = ax + 34 + i * 70;
      r(cx2 - 22, FY - 60, 44, 60, '#2e1d0a');
      r(cx2 - 22, FY - 60, 44, 3, '#ffb347');
      r(cx2 - 14, FY - 50, 28, 14, '#3a2410');
      r(cx2 - 10, FY - 46, 20, 6, '#5a3a14');
      r(cx2 - 16, FY - 26, 32, 20, '#241708');
      rl(cx2 - 6, FY - 74, 4, 14, '#ffffff', 0.10);
    }
    r(ax + 4, FY - 78, 132, 4, '#33456a');
    for (let i = 0; i < 7; i++) {
      r(ax + 10 + i * 18, FY - 92, 12, 14, i % 2 ? '#ffb347' : '#5a3a14');
      rl(ax + 10 + i * 18, FY - 92, 12, 1, '#ffe6b8', 0.4);
    }
  } else if (id === 'tool') {
    r(ax + 2, 122, 136, 66, '#0c1420');
    r(ax + 2, 122, 136, 2, '#33456a');
    for (let i = 0; i < 8; i++) {
      const tx = ax + 14 + (i % 4) * 32;
      const ty = 132 + Math.floor(i / 4) * 30;
      r(tx, ty, 4, 22, '#8a94a8');
      r(tx - 4, ty, 12, 5, '#c0c8d8');
      r(tx - 1, ty + 20, 6, 6, A.trim);
    }
    r(ax + 2, FY - 54, 136, 54, '#141a2c');
    r(ax + 2, FY - 54, 136, 3, A.trim);
    for (let i = 0; i < 3; i++) {
      r(ax + 10 + i * 44, FY - 40, 36, 6, '#1c2438');
      r(ax + 14 + i * 44, FY - 52, 6, 12, '#c0c8d8');
      r(ax + 24 + i * 44, FY - 50, 12, 10, '#8a94a8');
    }
  } else {
    // 便利店：冷柜
    r(ax + 4, FY - 82, 132, 82, '#0b1a26');
    r(ax + 4, FY - 82, 132, 3, A.trim);
    r(ax + 4, FY - 82, 3, 82, '#22304a');
    r(ax + 133, FY - 82, 3, 82, '#22304a');
    r(ax + 4, FY - 3, 132, 3, '#16223a');
    rl(ax + 7, FY - 79, 126, 76, '#22e0ff', 0.07);
    for (let i = 0; i < 3; i++) rl(ax + 8, FY - 56 + i * 26, 124, 1, '#33456a', 0.9);
    for (let i = 0; i < 18; i++) {
      const bx = ax + 12 + (i % 9) * 14;
      const by = FY - 76 + Math.floor(i / 9) * 26;
      r(bx, by, 10, 14, i % 2 ? '#22e0ff' : '#ff3ea5');
      rl(bx, by, 10, 1, '#ffffff', 0.35);
      rl(bx, by + 2, 10, 12, '#000000', 0.12);
    }
    rl(ax + 8, FY - 78, 124, 74, '#22e0ff', 0.05);
  }
}

/* 室内专用：高分辨率角色（比街上的 12×18 精灵细节多，和店长同比例） */
function drawPlayerBig(p, t) {
  const [coat, trim] = COATS[G.up.coat % COATS.length];
  const cx = Math.round(p.x + p.w / 2);
  const fy = Math.round(p.y + p.h);
  const run = p.state === 'run';
  const air = !p.onGround;
  const f = p.face;
  const ph = p.anim || 0;
  const swing = run ? Math.sin(ph * 9) : 0;
  const bob = run ? Math.abs(Math.sin(ph * 9)) * 1.5 : 0;
  const y0 = fy - bob;

  // 影子
  oval(cx, fy + 1, 15, 4, '#00000066');

  // 腿 + 靴子
  const legY = y0 - 17;
  r(cx - 9 + Math.round(swing * 2), legY, 8, 17, '#1a2438');
  r(cx + 1 - Math.round(swing * 2), legY, 8, 17, '#16202f');
  const b1 = cx - 10 + Math.round(swing * 2), b2 = cx + 1 - Math.round(swing * 2);
  r(b1, y0 - 5, 10, 5, '#0c1420');
  r(b2, y0 - 5, 10, 5, '#0c1420');
  rl(b1, y0 - 5, 10, 1, trim, 0.45);
  rl(b2, y0 - 5, 10, 1, trim, 0.45);

  // 外套
  const bodyY = y0 - 40;
  r(cx - 13, bodyY, 26, 25, coat);
  r(cx - 13, bodyY, 26, 3, trim);
  rl(cx - 13, bodyY + 3, 26, 1, '#000000', 0.35);
  r(cx - 1, bodyY + 4, 2, 16, '#0d1420');
  rl(cx - 1, bodyY + 4, 2, 16, trim, 0.55);
  r(cx - 13, bodyY + 21, 26, 4, shade(coat, 0.68));
  rl(cx - 13, bodyY + 2, 26, 1, '#ffffff', 0.08);

  // 手臂
  r(cx - 17, bodyY + 6, 5, 15, shade(coat, 0.82));
  r(cx + 12, bodyY + 6, 5, 15, shade(coat, 0.82));
  r(cx - 17, bodyY + 20, 5, 4, '#d8a98a');
  r(cx + 12, bodyY + 20, 5, 4, '#d8a98a');

  // 头
  const hy = bodyY - 19;
  r(cx - 8, hy, 16, 17, '#d8a98a');
  r(cx - 9, hy - 4, 18, 7, '#151b2a');
  r(cx - 9, hy + 1, 3, 9, '#151b2a');
  r(cx + 6, hy + 1, 3, 9, '#151b2a');
  rl(cx - 8, hy + 1, 16, 1, '#000000', 0.15);
  // 眼睛（护目镜）
  const ex = cx + (f > 0 ? 0 : -6);
  r(ex, hy + 6, 7, 3, '#0c1420');
  r(ex + 1, hy + 6, 5, 2, trim);
  r(ex + 2, hy + 6, 2, 2, '#ffffff80');
  // 嘴
  r(cx - 2 + (f > 0 ? 2 : -4), hy + 12, 4, 1, '#8a5a4a');
  // 空中：披风飘起来
  if (air) {
    r(cx - f * 15, bodyY + 4, 6, 14, shade(coat, 0.6));
  }
}
function drawKeeper(x, fy, A) {
  // 总高约 58，柜台(26) 以上露出头+胸
  r(x - 12, fy - 44, 24, 38, shade(A.body, 1.45));
  r(x - 12, fy - 44, 24, 3, A.trim);
  r(x - 16, fy - 38, 4, 14, shade(A.body, 1.45));
  r(x + 12, fy - 38, 4, 14, shade(A.body, 1.45));
  r(x - 8, fy - 58, 16, 16, '#d8a98a');
  r(x - 9, fy - 61, 18, 7, '#151b2a');
  r(x - 9, fy - 56, 3, 11, '#151b2a');
  r(x + 6, fy - 56, 3, 11, '#151b2a');
  r(x - 5, fy - 51, 3, 3, '#0c1220');
  r(x + 2, fy - 51, 3, 3, '#0c1220');
  r(x - 4, fy - 45, 8, 2, '#8a5a4a');
}

function drawStand(s, A, t) {
  const x = s.x, y = s.y;
  const it = s.item;
  const own = (G.owned && G.owned[it.id]) || 0;
  const maxed = own >= it.max;
  const cols = ['#ffcf4d', '#22e0ff', '#ff3ea5'];
  const cc = cols[s.i % 3];

  // 光柱
  if (!maxed) {
    for (let i = 0; i < 6; i++) {
      const w2 = 22 - i * 3;
      rl(x - w2 / 2, y - 38 - i * 10, w2, 10, cc, 0.05 + 0.01 * Math.sin(t * 2 + s.i));
    }
  }
  // 底座
  rl(x - 15, y - 3, 30, 4, '#000000', 0.4);
  r(x - 13, y - 26, 26, 26, '#1b2740');
  r(x - 13, y - 26, 26, 3, shade(A.trim, 0.85));
  r(x - 10, y - 23, 20, 20, '#101a2b');
  r(x - 10, y - 23, 20, 1, '#0a1220');
  // 商品
  r(x - 8, y - 42, 16, 16, maxed ? '#3a4356' : cc);
  rl(x - 8, y - 42, 16, 3, '#ffffff', 0.35);
  r(x - 4, y - 37, 8, 7, '#0b111c');
  rl(x - 4, y - 37, 8, 1, cc, 0.6);

  // 标签（放高一点，免得被角色脑袋挡住）
  signText(it.name, x, y - 70, maxed ? '#6b7788' : '#e6f0ff', 8, true);
  signText(maxed ? '已拥有' : '◎ ' + it.price, x, y - 81, maxed ? '#5d6a7d' : '#ffcf4d', 7, true);
}

function drawRoomProps(sc, A, t) {
  const FY = ROOM_FY;

  // 地毯
  oval(sc.counter.x - 150, FY + 26, 120, 12, '#111c31');
  oval(sc.counter.x - 150, FY + 26, 108, 8, '#16274180');
  rl(sc.counter.x - 256, FY + 18, 212, 2, A.trim, 0.12);

  // 店长 + 柜台
  const c = sc.counter;
  drawKeeper(c.x + c.w - 44, FY - 4, A);
  r(c.x, FY - 26, c.w, 26, '#101a2b');
  r(c.x, FY - 26, c.w, 4, shade(A.trim, 1.0));
  r(c.x, FY - 22, c.w, 2, '#000000');
  r(c.x + 4, FY - 18, c.w - 8, 6, '#16223a');
  for (let x = c.x + 8; x < c.x + c.w - 8; x += 14) rl(x, FY - 18, 1, 18, '#000000', 0.3);
  r(c.x - 2, FY - 4, c.w + 4, 4, '#0a1220');
  rl(c.x - 2, FY - 4, c.w + 4, 1, A.trim, 0.4);
  // 收银机
  r(c.x + 8, FY - 40, 22, 14, '#1c2438');
  r(c.x + 11, FY - 37, 16, 8, '#2ad0ff');
  rl(c.x + 11, FY - 37, 16, 8, '#ffffff', 0.15);
  r(c.x + 8, FY - 26, 22, 2, '#0d1420');
  // 柜台上的小灯
  r(c.x + 56, FY - 32, 8, 6, '#2b3a56');
  r(c.x + 57, FY - 29, 6, 3, '#ffe6b8');
  rl(c.x + 52, FY - 36, 16, 14, '#ffe6b8', 0.12);

  for (const s of sc.stands) drawStand(s, A, t);

  // 门边绿植
  const px = sc.door.x + 60;
  r(px - 7, FY - 14, 14, 14, '#123026');
  r(px - 7, FY - 14, 14, 2, '#5dff9b');
  for (let i = 0; i < 6; i++) {
    r(px - 7 + (i % 3) * 5, FY - 28 - Math.floor(i / 3) * 8, 5, 9, '#2f7a4f');
  }
}

/* ---------------- 店内特殊陈设：货架 / 餐桌椅 / 机台 / 花桶 … ---------------- */
const FURN = {
  store:  [{ k: 'gondola', x: 238 }, { k: 'basket', x: 176 }],
  ramen:  [{ k: 'table', x: 236 }, { k: 'stool', x: 326 }, { k: 'stool', x: 370 }],
  cafe:   [{ k: 'rtable', x: 238 }, { k: 'rtable', x: 300 }],
  arcade: [{ k: 'cab', x: 152 }, { k: 'cab', x: 240 }],
  music:  [{ k: 'crate', x: 214 }, { k: 'crate', x: 292 }],
  cloth:  [{ k: 'rack', x: 226 }, { k: 'mirror', x: 300 }],
  flower: [{ k: 'bucket', x: 220 }, { k: 'bucket', x: 288 }],
  tool:   [{ k: 'bench', x: 246 }, { k: 'crate', x: 152 }],
  bank:   [{ k: 'atm', x: 238 }, { k: 'barrier', x: 150 }],
  cyber:  [{ k: 'gurney', x: 240 }, { k: 'crate', x: 152 }]
};

function drawFurn(sc, A, t) {
  const FY = ROOM_FY;
  const list = FURN[sc.shopId] || [];
  const cols = ['#ff3ea5', '#22e0ff', '#ffcf4d', '#5dff9b', '#7a4bff'];

  for (const f of list) {
    const x = f.x;

    if (f.k === 'gondola') {
      // 便利店岛型货架：三层格子 + 满架商品
      const w = 92, top = FY - 80;
      rl(x - w / 2 - 5, FY - 3, w + 10, 6, '#000000', 0.3);
      r(x - w / 2, top, w, 80, '#16233a');
      r(x - w / 2, top, w, 3, shade(A.trim, 0.85));
      r(x - w / 2, top, 3, 80, '#22304a');
      r(x + w / 2 - 3, top, 3, 80, '#22304a');
      const rg = mulberry32(77);
      for (let row = 0; row < 3; row++) {
        const sy = top + 8 + row * 24;
        r(x - w / 2 + 3, sy + 17, w - 6, 3, '#2b3a56');
        rl(x - w / 2 + 3, sy + 17, w - 6, 1, '#7f96bd', 0.5);
        for (let i = 0; i < 7; i++) {
          const bx = x - w / 2 + 6 + i * 12;
          const hh = 8 + Math.floor(rg() * 9);
          const cc = cols[Math.floor(rg() * 5)];
          r(bx, sy + 17 - hh, 9, hh, shade(cc, 0.62));
          rl(bx, sy + 17 - hh, 9, 2, cc, 0.9);
          rl(bx + 1, sy + 17 - hh + 2, 2, hh - 3, '#ffffff', 0.06);
        }
      }
      r(x - 23, top - 12, 46, 11, '#0b1220');
      r(x - 23, top - 12, 46, 1, A.trim);
      signText('特 价', x, top - 6, A.trim, 7, false);
      rl(x - w / 2, top, w, 80, A.trim, 0.04);

    } else if (f.k === 'basket') {
      // 购物篮（里面还露着东西）
      r(x - 12, FY - 15, 24, 15, '#1b3a5c');
      r(x - 12, FY - 15, 24, 2, '#3d6a9c');
      for (let i = 0; i < 3; i++) rl(x - 8 + i * 7, FY - 13, 1, 12, '#2b4a6c', 0.9);
      r(x - 6, FY - 21, 5, 7, '#2ad0ff');
      r(x + 2, FY - 20, 5, 6, '#ffcf4d');
      r(x - 2, FY - 19, 5, 5, '#ff3ea5');

    } else if (f.k === 'table') {
      // 拉面店餐桌 + 四把椅子
      const tw = 64;
      rl(x - tw / 2 - 12, FY - 3, tw + 24, 6, '#000000', 0.3);
      for (const cxx of [x - tw / 2 - 9, x + tw / 2 + 9]) {
        r(cxx - 6, FY - 42, 13, 3, '#8a3a28');
        rl(cxx - 6, FY - 42, 13, 1, '#c85a3e', 0.85);
        r(cxx - 6, FY - 39, 2, 21, '#5a2018');
        r(cxx + 5, FY - 39, 2, 21, '#5a2018');
      }
      r(x - tw / 2 + 7, FY - 36, 5, 36, '#5a2418');
      r(x + tw / 2 - 12, FY - 36, 5, 36, '#5a2418');
      rl(x - tw / 2 + 7, FY - 36, 2, 36, '#8a4a2a', 0.5);
      r(x - tw / 2, FY - 44, tw, 9, '#a85e34');
      r(x - tw / 2, FY - 44, tw, 3, '#ffd8a8');
      r(x - tw / 2, FY - 37, tw, 2, '#6b2a1e');
      for (let i = 0; i < 2; i++) {
        const bx = x - 25 + i * 30;
        r(bx, FY - 53, 17, 9, '#f4f4f4');
        r(bx, FY - 53, 17, 2, '#c8392b');
        rl(bx + 3, FY - 58, 2, 6, '#ffffff', 0.3);
        rl(bx + 8, FY - 57, 2, 5, '#ffffff', 0.22);
        rl(bx + 1, FY - 45, 15, 1, '#000000', 0.35);
      }
      r(x + 20, FY - 60, 7, 16, '#3a2410');
      for (let i = 0; i < 3; i++) rl(x + 21 + i * 2, FY - 65, 1, 13, '#ffe6b8', 0.75);
      r(x - 10, FY - 26, 20, 4, '#8a3a28');
      r(x - 10, FY - 26, 20, 1, '#c85a3e', 0.9);
      r(x - 10, FY - 22, 2, 22, '#5a2018');
      r(x + 8, FY - 22, 2, 22, '#5a2018');

    } else if (f.k === 'stool') {
      // 吧台圆凳
      r(x - 8, FY - 27, 16, 4, '#c8392b');
      r(x - 8, FY - 27, 16, 2, '#ff8a5c');
      r(x - 1, FY - 23, 3, 21, '#2b3a56');
      r(x - 8, FY - 3, 16, 3, '#2b3a56');

    } else if (f.k === 'rtable') {
      // 咖啡站小圆桌 + 两只木凳
      rl(x - 26, FY - 3, 52, 5, '#000000', 0.25);
      for (const sx of [x - 30, x + 22]) {
        r(sx, FY - 23, 12, 3, '#8a5a2a');
        r(sx + 5, FY - 20, 3, 20, '#5a3a14');
      }
      r(x - 2, FY - 33, 4, 33, '#2b3a56');
      r(x - 9, FY - 3, 18, 3, '#3d5373');
      oval(x, FY - 36, 22, 6, '#a8763c');
      oval(x, FY - 38, 22, 5, '#e8b070');
      oval(x, FY - 38, 19, 4, '#f2c68e');
      r(x - 4, FY - 47, 9, 8, '#f2f2f2');
      r(x - 3, FY - 46, 7, 3, '#5a3a14');
      rl(x + 5, FY - 45, 2, 4, '#ffffff', 0.4);
      for (let i = 0; i < 2; i++) rl(x - 2 + i * 4, FY - 58 + Math.sin(t * 2 + i) * 2, 1, 8, '#ffffff', 0.13);

    } else if (f.k === 'cab') {
      // 街机机台
      const cw2 = 50, ch2 = 74;
      rl(x - cw2 / 2 - 3, FY - 3, cw2 + 6, 6, '#000000', 0.3);
      r(x - cw2 / 2, FY - ch2, cw2, ch2, '#141a2c');
      r(x - cw2 / 2, FY - ch2, cw2, 4, A.trim);
      r(x - cw2 / 2 + 4, FY - ch2 + 8, cw2 - 8, 30, '#0a1020');
      rl(x - cw2 / 2 + 5, FY - ch2 + 9, cw2 - 10, 28, '#ff3ea5', 0.16 + 0.1 * Math.sin(t * 5 + x));
      for (let i = 0; i < 3; i++) rl(x - cw2 / 2 + 7 + i * 13, FY - ch2 + 15 + (i % 2) * 9, 9, 8, '#22e0ff', 0.5);
      r(x - cw2 / 2 + 2, FY - ch2 + 42, cw2 - 4, 8, '#1c2438');
      r(x - cw2 / 2 + 6, FY - ch2 + 44, 4, 4, '#ff3ea5');
      r(x - cw2 / 2 + 14, FY - ch2 + 44, 4, 4, '#22e0ff');
      r(x - cw2 / 2 + 22, FY - ch2 + 44, 4, 4, '#ffcf4d');
      r(x - cw2 / 2 + 2, FY - 18, cw2 - 4, 18, '#0e1420');
      rl(x - cw2 / 2 + 2, FY - 18, cw2 - 4, 2, A.trim, 0.6);

    } else if (f.k === 'crate') {
      // 木箱 / 纸箱堆
      for (let i = 0; i < 3; i++) {
        const cxx = x - 22 + (i === 1 ? 26 : 0) + (i === 2 ? 6 : 0);
        const cy2 = FY - 20 - (i === 2 ? 20 : 0);
        r(cxx, cy2, 26, 20, i % 2 ? '#3a2a18' : '#2b2233');
        r(cxx, cy2, 26, 2, i % 2 ? '#6b5236' : '#4a3d5c');
        rl(cxx + 3, cy2 + 7, 20, 1, '#000000', 0.35);
        rl(cxx + 3, cy2 + 13, 20, 1, '#000000', 0.35);
        rl(cxx + 5, cy2 + 4, 9, 3, '#ffe6b8', 0.16);
      }

    } else if (f.k === 'rack') {
      // 挂衣架
      rl(x - 27, FY - 3, 54, 4, '#000000', 0.25);
      r(x - 26, FY - 62, 3, 62, '#4a6088');
      r(x + 23, FY - 62, 3, 62, '#4a6088');
      r(x - 26, FY - 62, 52, 3, '#5a7099');
      for (let i = 0; i < 4; i++) {
        const hx = x - 21 + i * 13;
        rl(hx + 4, FY - 59, 1, 10, '#c0c8d8', 0.85);
        r(hx, FY - 49, 11, 30, cols[i % 4]);
        rl(hx, FY - 49, 11, 3, '#ffffff', 0.18);
        rl(hx + 2, FY - 45, 2, 24, '#000000', 0.12);
      }

    } else if (f.k === 'mirror') {
      // 试衣镜
      r(x - 17, FY - 86, 34, 86, '#2b3a56');
      r(x - 14, FY - 83, 28, 79, '#0d2030');
      const mg = ctx.createLinearGradient(x - 14, FY - 83, x + 14, FY - 4);
      mg.addColorStop(0, 'rgba(180,240,255,.30)');
      mg.addColorStop(.5, 'rgba(110,170,210,.12)');
      mg.addColorStop(1, 'rgba(180,240,255,.22)');
      ctx.fillStyle = mg;
      ctx.fillRect(x - 14, FY - 83, 28, 79);
      rl(x - 11, FY - 78, 4, 32, '#ffffff', 0.16);
      r(x - 17, FY - 3, 34, 3, '#3d5373');

    } else if (f.k === 'bucket') {
      // 花桶
      for (let i = 0; i < 2; i++) {
        const bx = x + i * 22 - 11;
        r(bx - 11, FY - 30, 22, 30, i ? '#1b3a2c' : '#243a1b');
        r(bx - 11, FY - 30, 22, 3, '#5dff9b');
        r(bx - 11, FY - 30, 3, 30, '#2b5a42');
        for (let k = 0; k < 4; k++) {
          const fx2 = bx - 8 + k * 5;
          r(fx2, FY - 46 - (k % 2) * 7, 5, 5, k % 2 ? '#ff8ad5' : '#ffcf4d');
          rl(fx2 + 2, FY - 42, 1, 13, '#5dff9b', 0.4);
        }
      }

    } else if (f.k === 'bench') {
      // 五金铺工作台
      rl(x - 42, FY - 3, 84, 5, '#000000', 0.3);
      r(x - 42, FY - 34, 84, 5, '#6b5236');
      r(x - 42, FY - 34, 84, 2, '#8f7346');
      r(x - 38, FY - 29, 4, 29, '#4a3a22');
      r(x + 34, FY - 29, 4, 29, '#4a3a22');
      r(x - 32, FY - 44, 15, 10, '#5a6a80');
      r(x - 30, FY - 47, 11, 3, '#8a94a8');
      r(x - 8, FY - 40, 22, 4, '#c0c8d8');
      r(x + 16, FY - 44, 9, 10, '#8a94a8');
      r(x - 40, FY - 22, 80, 2, '#3a2a18');

    } else if (f.k === 'atm') {
      // 芯片兑换自助机
      r(x - 22, FY - 92, 44, 92, '#101a2b');
      r(x - 22, FY - 92, 44, 3, A.trim);
      r(x - 17, FY - 84, 34, 22, '#0a2030');
      rl(x - 16, FY - 83, 32, 20, '#5dff9b', 0.16 + 0.06 * Math.sin(t * 3));
      r(x - 12, FY - 80, 24, 4, '#5dff9b');
      r(x - 12, FY - 72, 16, 3, '#2f7a4f');
      r(x - 14, FY - 54, 28, 6, '#1c2438');
      r(x - 14, FY - 46, 28, 4, '#16223a');
      for (let i = 0; i < 4; i++) r(x - 12 + i * 7, FY - 38, 5, 5, '#ffcf4d');
      r(x - 20, FY - 4, 40, 4, '#0a1220');

    } else if (f.k === 'barrier') {
      // 排队栏杆
      for (let i = 0; i < 3; i++) {
        const px2 = x + i * 26;
        r(px2 - 2, FY - 34, 4, 34, '#8a94a8');
        r(px2 - 5, FY - 34, 10, 3, '#c0c8d8');
        r(px2 - 6, FY - 3, 12, 3, '#5a6a80');
      }
      for (let i = 0; i < 2; i++) {
        const px2 = x + i * 26;
        rl(px2 + 5, FY - 24, 18, 2, '#ff3ea5', 0.55);
        rl(px2 + 5, FY - 21, 18, 1, '#000000', 0.4);
      }

    } else if (f.k === 'gurney') {
      // 义体诊所手术床
      r(x - 34, FY - 26, 68, 5, '#3d5373');
      r(x - 34, FY - 21, 68, 3, '#16223a');
      for (const lx of [x - 30, x + 26]) {
        r(lx, FY - 18, 3, 18, '#5a7099');
        r(lx - 4, FY - 2, 10, 2, '#0a1220');
      }
      r(x - 36, FY - 34, 72, 8, '#c8d4e8');
      r(x - 36, FY - 34, 72, 2, '#eef4ff');
      r(x - 30, FY - 42, 20, 8, '#e8eef8');
      r(x + 16, FY - 58, 3, 18, '#4a6088');
      oval(x + 18, FY - 62, 9, 5, '#33456a');
      rl(x + 12, FY - 64, 12, 4, '#5dff9b', 0.3 + 0.1 * Math.sin(t * 2.5));
      r(x + 34, FY - 44, 16, 24, '#0c1420');
      r(x + 36, FY - 40, 12, 10, '#0a2030');
      rl(x + 37, FY - 36, 10, 1, '#5dff9b', 0.9);
    }
  }
}

/* ---------------- 整体绘制 ---------------- */
function renderInside(sc, t) {
  const A = SHOP_ART[sc.shopId] || SHOP_ART.store;
  const W = sc.roomW;
  ctx.save();
  ctx.translate(-Math.round(CAM.x), 0);
  drawRoomShell(sc, A, W, t);
  drawFurn(sc, A, t);
  drawRoomProps(sc, A, t);

  // 灯下的柔光，让角色从暗背景里跳出来
  const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2;
  const g2 = ctx.createRadialGradient(pcx, pcy, 8, pcx, pcy, 130);
  g2.addColorStop(0, 'rgba(190,225,255,.10)');
  g2.addColorStop(1, 'rgba(190,225,255,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(pcx - 130, pcy - 130, 260, 260);

  // 玩家：店内专用大号角色
  drawPlayerBig(P, t);
  if (P.dust) for (const d of P.dust) rl(d.x, d.y, 2, 2, '#ffffff', clamp(d.l * 2, 0, 0.6));
  ctx.restore();

  drawBuffs();

  // 暗角
  const vg = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.4, VIEW.w / 2, VIEW.h / 2, VIEW.h * 1.0);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  // 转场
  if (G.fade > 0) {
    ctx.globalAlpha = G.fade;
    ctx.fillStyle = '#04060c';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.globalAlpha = 1;
  }
}
