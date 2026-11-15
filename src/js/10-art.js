'use strict';
/* =========================================================================
   10 art — 像素绘制：背景、岛屿、传送门、小店、玩家、金币
   一切都是 640x360 画布上的整数方块，不依赖任何图片
   ========================================================================= */

const PAL = {
  spawn: {
    sky: ['#070b1e', '#101a42', '#28194a', '#3a1c4a'],
    far: '#0e1738', mid: '#182a56', isl: '#26324f', top: '#4a6491',
    edge: '#22e0ff', accent: '#22e0ff', cloud: '#1a2650'
  },
  hub5: {
    sky: ['#150a2a', '#2a0f4a', '#42124a', '#5a1650'],
    far: '#20133e', mid: '#33165a', isl: '#2f1e4e', top: '#5e3c86',
    edge: '#ff3ea5', accent: '#ff3ea5', cloud: '#2a1448'
  },
  worlds: [
    { name: '霓虹街区', sky: ['#060a1a', '#101a3c', '#241040'], far: '#0b1230', mid: '#14203e', isl: '#1e2942', top: '#3d5480', edge: '#22e0ff', accent: '#22e0ff' },
    { name: '雨夜码头', sky: ['#040c14', '#08202e', '#0d3040'], far: '#07161e', mid: '#0e2a36', isl: '#193949', top: '#2e6a80', edge: '#5dff9b', accent: '#5dff9b' },
    { name: '高层天台', sky: ['#0a0620', '#1e1040', '#3a1420'], far: '#120a26', mid: '#1e1236', isl: '#261a40', top: '#4d2f6b', edge: '#ffcf4d', accent: '#ffcf4d' },
    { name: '熔炉工厂', sky: ['#170608', '#38100c', '#54200a'], far: '#1a0808', mid: '#2a0e0c', isl: '#361616', top: '#6b2e1e', edge: '#ff8a3d', accent: '#ff8a3d' },
    { name: '数据深渊', sky: ['#02060a', '#04141a', '#07281f'], far: '#03100e', mid: '#06201a', isl: '#0d2b25', top: '#185646', edge: '#5dff9b', accent: '#5dff9b' }
  ]
};

/* --- 基础方块 --- */
function r(x, y, w, h, c) {
  if (typeof c !== 'string' || c.length < 4) return;
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function rl(x, y, w, h, c, a) {
  ctx.globalAlpha = a;
  r(x, y, w, h, c);
  ctx.globalAlpha = 1;
}
function oval(cx, cy, rx, ry, c) {
  ctx.fillStyle = c;
  for (let y = -ry; y < ry; y += 2) {
    const k = 1 - (y / ry) * (y / ry);
    if (k <= 0) continue;
    const hw = rx * Math.sqrt(k);
    ctx.fillRect(Math.round(cx - hw), Math.round(cy + y), Math.max(1, Math.round(hw * 2)), 2);
  }
}
function signText(txt, cx, y, color, size, outline) {
  ctx.font = 'bold ' + (size || 10) + 'px "Microsoft YaHei",monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (outline !== false) {
    ctx.fillStyle = '#03060e';
    ctx.fillText(txt, cx + 1, y + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(txt, cx, y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/* =========================================================================
   背景
   ========================================================================= */
function gradientSky(cols) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  for (let i = 0; i < cols.length; i++) g.addColorStop(i / (cols.length - 1), cols[i]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

function stars(camx, seed, t) {
  const rng = mulberry32(seed);
  for (let i = 0; i < 90; i++) {
    const sx = (rng() * 1800 - camx * 0.08) % 1800;
    const sy = rng() * 180;
    const tw = 0.55 + 0.45 * Math.sin(t * 2 + i);
    rl(sx < 0 ? sx + 1800 : sx, sy, 1, 1, rng() > 0.75 ? '#9fe8ff' : '#ffffff', 0.25 + tw * 0.45);
  }
}

/* 远景楼群 */
function farCity(camx, col, baseY, seed, density, hMax) {
  const rng = mulberry32(seed);
  const off = (camx * 0.22) % 400;
  for (let i = -2; i < 22; i++) {
    const bw = 14 + rng() * 26;
    const bh = 30 + rng() * (hMax || 120);
    const x = i * 34 - off;
    r(x, baseY - bh, bw, bh, col);
    if (rng() > 0.55 && density !== 0) {
      for (let wy = baseY - bh + 6; wy < baseY - 6; wy += 7) {
        for (let wx = x + 3; wx < x + bw - 3; wx += 5) {
          if (rng() > 0.55) rl(wx, wy, 2, 2, '#8fd8ff', 0.16 + rng() * 0.3);
        }
      }
    }
  }
}

/* 中景楼群（带霓虹边） */
function midCity(camx, col, baseY, seed, accent) {
  const rng = mulberry32(seed);
  const off = (camx * 0.45) % 300;
  for (let i = -2; i < 18; i++) {
    const bw = 24 + rng() * 34;
    const bh = 50 + rng() * 110;
    const x = i * 46 - off;
    const y = baseY - bh;
    r(x, y, bw, bh, col);
    r(x, y, bw, 2, accent);
    for (let wy = y + 8; wy < baseY - 8; wy += 9) {
      for (let wx = x + 4; wx < x + bw - 4; wx += 6) {
        if (rng() > 0.42) rl(wx, wy, 3, 3, rng() > 0.7 ? accent : '#a9d8ff', 0.18 + rng() * 0.35);
      }
    }
    if (rng() > 0.7) r(x + bw * 0.4, y - 10, 2, 10, accent);
  }
}

/* 漂浮岛（背景装饰） */
function floatIsland(x, y, w, col, top) {
  oval(x + w / 2, y, w / 2, 5, top);
  for (let i = 0; i < 5; i++) {
    const t = i / 5;
    r(x + w * 0.12 * t, y + 3 + i * 4, w * (1 - 0.24 * t), 4, col);
  }
  r(x + w * 0.3, y + w * 0.22, 2, 4, col);
}

/* =========================================================================
   岛屿平台
   ========================================================================= */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let rr = (n >> 16) & 255, gg = (n >> 8) & 255, bb = n & 255;
  rr = Math.min(255, Math.round(rr * k));
  gg = Math.min(255, Math.round(gg * k));
  bb = Math.min(255, Math.round(bb * k));
  return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + bb).toString(16).slice(1);
}

function drawIsland(p, pal, t) {
  const x = p.x, y = p.y, w = p.w;
  const H = p.h || 54;
  const isl2 = shade(pal.isl, 0.7);

  // 岩体（宽岛不做收分，改成直筒 + 锯齿底，才像浮岛）
  r(x, y + 9, w, H - 9, pal.isl);
  for (let yy = y + 18; yy < y + H - 2; yy += 7) rl(x, yy, w, 1, '#000000', 0.16);
  for (let i = 0; i < 4; i++) rl(x, y + 12 + i * 11, w, 1, '#ffffff', 0.03);

  // 岛下霓虹雾光（先铺在下面，免得盖住锯齿剪影）
  const ug = ctx.createLinearGradient(0, y + H, 0, y + H + 46);
  ug.addColorStop(0, pal.edge + '1c');
  ug.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ug;
  ctx.fillRect(x, y + H, w, 46);

  // 底部锯齿剪影（路径一次填充，不用逐块）
  ctx.fillStyle = shade(pal.isl, 0.42);
  ctx.beginPath();
  ctx.moveTo(x, y + H - 3);
  let sx = x + w;
  while (sx > x) {
    const step = 13 + ((sx * 13) % 21);
    const dep = 4 + ((sx * 7) % 16);
    ctx.lineTo(sx, y + H + dep);
    ctx.lineTo(sx - step * 0.45, y + H - 3);
    sx -= step;
  }
  ctx.lineTo(x, y + H - 3);
  ctx.closePath();
  ctx.fill();
  // 岛底霓虹边缘光
  rl(x, y + H - 3, w, 1, pal.edge, 0.22);
  rl(x, y + H + 1, w, 1, pal.edge, 0.10);

  // 顶部地表
  r(x, y, w, 9, pal.top);
  r(x, y, w, 2, pal.edge);
  r(x, y + 9, w, 2, shade(pal.top, 0.72));
  // 颗粒 + 边缘灯点
  const rng = mulberry32(Math.floor(x) * 7 + 3);
  for (let i = 0; i < w / 4; i++) {
    const px2 = x + rng() * w;
    rl(px2, y + 3, 2, 1, '#ffffff', 0.13);
    if (rng() > 0.72) rl(px2, y + 10, 1, 2, pal.edge, 0.22);
  }
  // 悬挂小岩块
  for (let i = 0; i < 9; i++) {
    const bx = x + rng() * w;
    r(bx, y + 14 + H + rng() * 16, 3 + rng() * 4, 3, shade(pal.isl, 0.6));
  }
  // 岩体霓虹矿脉
  const rng2 = mulberry32(Math.floor(x / 7) + 91);
  for (let i = 0; i < Math.max(2, w / 90); i++) {
    const vx = x + rng2() * w;
    const vy = y + 14 + rng2() * 26;
    for (let k = 0; k < 5; k++) rl(vx + k * 2, vy + k * 3, 2, 3, pal.edge, 0.09);
  }
  // 只压最后 12px，保住底部剪影
  const bg = ctx.createLinearGradient(0, y + H - 14, 0, y + H + 2);
  bg.addColorStop(0, 'rgba(0,0,0,0)');
  bg.addColorStop(1, 'rgba(0,0,0,.35)');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y + H - 14, w, 16);
}

/* 街边小物件 */
function drawDeco(kind, x, gy, t) {
  if (kind === 'lamp') {
    r(x - 1, gy - 42, 3, 42, '#243044');
    r(x - 7, gy - 44, 15, 3, '#2e3c56');
    r(x - 6, gy - 41, 12, 3, '#22e0ff');
    rl(x - 16, gy - 38, 32, 38, '#22e0ff', 0.055);
    rl(x - 11, gy - 2, 22, 2, '#22e0ff', 0.28);
  } else if (kind === 'vend') {
    r(x - 8, gy - 27, 16, 27, '#1c2438');
    r(x - 8, gy - 27, 16, 1, '#3a4a66');
    r(x - 6, gy - 24, 12, 15, '#1a7f9c');
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        r(x - 5 + j * 4, gy - 23 + i * 5, 3, 3, ['#ff5ad9', '#ffcf4d', '#5dff9b'][(i + j) % 3]);
      }
    }
    r(x - 6, gy - 7, 12, 4, '#0b101c');
    rl(x - 11, gy - 30, 22, 30, '#2ad0ff', 0.05);
  } else if (kind === 'crate') {
    r(x - 7, gy - 12, 14, 12, '#33220f');
    r(x - 7, gy - 12, 14, 1, '#6a4420');
    r(x - 7, gy - 7, 14, 1, '#6a4420');
    r(x - 1, gy - 12, 2, 12, '#1c1208');
  } else if (kind === 'plant') {
    r(x - 5, gy - 7, 10, 7, '#2f1c36');
    rl(x - 5, gy - 7, 10, 1, '#6a4676', 0.9);
    oval(x, gy - 12, 6, 5, '#1e5a3a');
    oval(x - 3, gy - 15, 4, 4, '#2c7a4a');
    oval(x + 3, gy - 14, 3, 3, '#2c7a4a');
  }
}

/* =========================================================================
   传送门
   ========================================================================= */
function drawPortal(x, gy, color, t, num) {
  const w = 46, h = 60;
  const x0 = Math.round(x - w / 2), y0 = Math.round(gy - h);
  // 基座
  r(x0 - 4, gy - 6, w + 8, 6, '#1a2238');
  r(x0 - 4, gy - 6, w + 8, 2, '#3a4a66');
  // 门框
  r(x0, y0 + 6, 6, h - 6, '#2b3a56');
  r(x0 + w - 6, y0 + 6, 6, h - 6, '#2b3a56');
  r(x0, y0 + 2, w, 6, '#334662');
  r(x0 + 2, y0, w - 4, 4, '#3d5373');
  // 内部漩涡
  const cx = x0 + w / 2, cy = y0 + h / 2 + 4;
  oval(cx, cy, 16, 20, '#04060e');
  const ph = t * 1.7;
  for (let i = 5; i >= 1; i--) {
    const rx = 3 + i * 2.4;
    const ry = 4 + i * 3.0;
    const yy = cy + Math.sin(ph + i * 0.8) * 3;
    oval(cx + Math.cos(ph + i) * 1.5, yy, rx, ry, i % 2 ? color : '#ffffff');
    ctx.globalAlpha = 0.18 + i * 0.09;
    ctx.globalAlpha = 1;
  }
  // 亮点
  for (let i = 0; i < 7; i++) {
    const a = ph + i * 0.9;
    const px2 = cx + Math.cos(a) * (7 + i);
    const py2 = cy + Math.sin(a * 1.3) * (9 + i);
    r(px2, py2, 1, 1, '#ffffff');
  }
  // 顶部台标
  r(x0 + 6, y0 - 12, w - 12, 12, '#0c1220');
  r(x0 + 6, y0 - 12, w - 12, 2, color);
  signText(num || 'PORTAL', cx, y0 - 5, color, 8, false);
  // 地面光
  rl(x0, gy - 8, w, 8, color, 0.10);
}

/* =========================================================================
   小店（六种，各自一套贴图）
   ========================================================================= */
const SHOP_W = 96, SHOP_H = 76;

function drawShop(kind, x, gy, t) {
  const W = SHOP_W, H = SHOP_H;
  const x0 = Math.round(x - W / 2), y0 = Math.round(gy - H);
  const cx = x0 + W / 2;
  // 地面阴影
  rl(x0 + 6, gy - 4, W - 12, 5, '#000000', 0.35);

  const K = {
    store: { body: '#1c2a48', trim: '#22e0ff', sign: '24H 便利店', signFg: '#04121a', signBg: '#22e0ff' },
    cyber: { body: '#251a33', trim: '#ff3ea5', sign: '义体诊所', signFg: '#ffffff', signBg: '#a0165e' },
    ramen: { body: '#2f1d0c', trim: '#ffcf4d', sign: '樱 拉 面', signFg: '#2a1503', signBg: '#ffcf4d' },
    music: { body: '#1a1e38', trim: '#7a4bff', sign: '唱 片 行', signFg: '#e9e2ff', signBg: '#4a22a8' },
    cloth: { body: '#2b1a38', trim: '#ff8ad5', sign: '霓 裳', signFg: '#2a0618', signBg: '#ff8ad5' },
    bank: { body: '#152828', trim: '#5dff9b', sign: '芯 片 兑 换', signFg: '#02110c', signBg: '#5dff9b' }
  }[kind] || { body: '#16203a', trim: '#22e0ff', sign: 'SHOP', signFg: '#000', signBg: '#22e0ff' };

  /* --- 主体墙 --- */
  r(x0, y0 + 18, W, H - 18, K.body);
  // 墙砖
  for (let yy = y0 + 20; yy < gy - 4; yy += 6) {
    rl(x0 + 1, yy, W - 2, 1, '#000000', 0.28);
  }
  // 左右立柱
  r(x0, y0 + 18, 4, H - 18, '#0b1020');
  r(x0 + W - 4, y0 + 18, 4, H - 18, '#0b1020');

  /* --- 招牌 --- */
  const sy = y0 + 2;
  r(x0 + 4, sy, W - 8, 16, '#080c16');
  r(x0 + 4, sy, W - 8, 2, K.trim);
  rl(x0 + 4, sy + 14, W - 8, 2, K.trim, 0.4);
  r(x0 + 8, sy + 4, W - 16, 9, K.signBg);
  signText(K.sign, cx, sy + 8.5, K.signFg, 8, false);

  /* --- 雨棚 --- */
  if (kind !== 'bank') {
    const aw = W - 10;
    for (let i = 0; i < aw / 8; i++) {
      r(x0 + 5 + i * 8, sy + 16, 8, 5, i % 2 ? K.trim : '#f2f7ff');
    }
    r(x0 + 5, sy + 21, aw, 1, '#00000055');
  }

  /* --- 橱窗 / 门 --- */
  const wy = y0 + 30, wh = 30;
  if (kind === 'store') {
    // 玻璃窗 + 货架
    r(x0 + 8, wy, 44, wh, '#0a2230');
    r(x0 + 8, wy, 44, 2, '#2ad0ff');
    for (let i = 0; i < 3; i++) {
      r(x0 + 11, wy + 7 + i * 8, 38, 3, '#123448');
      const cols = ['#ff5ad9', '#5dff9b', '#ffcf4d', '#22e0ff'];
      for (let j = 0; j < 7; j++) {
        r(x0 + 12 + j * 5, wy + 4 + i * 8, 3, 3, cols[(i + j) % 4]);
      }
    }
    rl(x0 + 8, wy, 44, wh, '#9fe8ff', 0.10);
    // 玻璃反光
    r(x0 + 12, wy + 2, 2, 24, '#ffffff22');
    // 自动门
    r(x0 + 58, wy, 30, wh, '#08161f');
    r(x0 + 58, wy, 30, 2, K.trim);
    r(x0 + 60, wy + 4, 12, wh - 6, '#12384a');
    r(x0 + 74, wy + 4, 12, wh - 6, '#12384a');
    r(x0 + 72, wy + 4, 2, wh - 6, '#04121a');
    rl(x0 + 58, wy + wh - 3, 30, 3, K.trim, 0.5);
    r(x0 + 62, wy + 14, 3, 10, K.trim);
    // 门口灯
    rl(x0 + 56, gy - 6, 34, 6, K.trim, 0.22);
  } else if (kind === 'cyber') {
    // 金属门面 + 红灯
    r(x0 + 8, wy, 50, wh, '#0d0a16');
    for (let i = 0; i < 4; i++) r(x0 + 10, wy + 4 + i * 7, 46, 1, '#2a1a3a');
    // 挂着的义体手臂
    for (let i = 0; i < 3; i++) {
      const ax = x0 + 14 + i * 15;
      r(ax, wy + 6, 5, 14, '#5a4a6a');
      r(ax, wy + 6, 5, 2, '#8a7aa0');
      r(ax + 1, wy + 19, 3, 5, '#3a2f4a');
    }
    rl(x0 + 8, wy, 50, wh, '#ff3ea5', 0.08);
    // 红十字
    r(x0 + 30, wy - 2, 12, 4, '#ff2b4d');
    r(x0 + 34, wy - 6, 4, 12, '#ff2b4d');
    // 门
    r(x0 + 64, wy, 24, wh, '#120c1c');
    r(x0 + 66, wy + 3, 20, wh - 6, '#241634');
    r(x0 + 74, wy + 3, 1, wh - 6, '#0a0610');
    rl(x0 + 64, gy - 6, 24, 6, K.trim, 0.2);
  } else if (kind === 'ramen') {
    // 木格门 + 暖帘
    r(x0 + 8, wy, 80, wh, '#2a1a0c');
    for (let i = 0; i < 8; i++) r(x0 + 8 + i * 10, wy, 1, wh, '#1a0f06');
    // 暖帘 noren
    for (let i = 0; i < 4; i++) {
      r(x0 + 10 + i * 19, wy, 17, 12, '#c8341f');
      rl(x0 + 10 + i * 19, wy + 11, 17, 1, '#7a1a0c', 0.9);
    }
    signText('拉', x0 + 18, wy + 6, '#ffe6c9', 8, false);
    signText('麺', x0 + 56, wy + 6, '#ffe6c9', 8, false);
    // 灯笼
    oval(x0 + 6, wy - 4, 4, 5, '#ff5a3d');
    rl(x0 + 6, wy - 10, 1, 3, '#ffcf4d', 0.8);
    oval(x0 + W - 8, wy - 4, 4, 5, '#ff5a3d');
    // 蒸汽
    for (let i = 0; i < 4; i++) {
      const yy = wy + 16 - ((t * 14 + i * 9) % 30);
      rl(x0 + 20 + i * 16 + Math.sin(t + i) * 3, yy, 6, 3, '#ffd9b0', 0.10 + 0.06 * Math.sin(t * 3 + i));
    }
    // 门口灯笼光
    rl(x0 + 4, gy - 8, W - 8, 8, '#ff8a3d', 0.18);
  } else if (kind === 'music') {
    // 黑胶橱窗
    r(x0 + 8, wy, 52, wh, '#07060f');
    for (let i = 0; i < 3; i++) {
      const dx = x0 + 20 + i * 14, dy = wy + 12 + (i % 2) * 8;
      oval(dx, dy, 6, 6, '#12101f');
      oval(dx, dy, 2, 2, K.trim);
    }
    rl(x0 + 8, wy, 52, wh, '#7a4bff', 0.1);
    // 音箱
    r(x0 + 62, wy, 12, 26, '#0c0a16');
    oval(x0 + 68, wy + 8, 4, 4, '#241a3a');
    oval(x0 + 68, wy + 19, 4, 4, '#241a3a');
    // 门
    r(x0 + 78, wy, 10, wh, '#120f22');
    rl(x0 + 78, gy - 6, 10, 6, K.trim, 0.2);
    // 音符
    for (let i = 0; i < 3; i++) {
      const yy = wy - 4 - ((t * 10 + i * 8) % 16);
      rl(x0 + 14 + i * 18, yy, 2, 4, K.trim, 0.5 + 0.3 * Math.sin(t * 2 + i));
    }
  } else if (kind === 'cloth') {
    // 橱窗 + 人台
    r(x0 + 8, wy, 46, wh, '#1a0f1e');
    rl(x0 + 8, wy, 46, wh, '#ff8ad5', 0.1);
    // 人台
    oval(x0 + 26, wy + 10, 4, 4, '#d8cfe0');
    r(x0 + 21, wy + 14, 10, 10, '#ff8ad5');
    r(x0 + 23, wy + 24, 3, 6, '#c96aa0');
    r(x0 + 27, wy + 24, 3, 6, '#c96aa0');
    // 衣架
    r(x0 + 38, wy + 4, 14, 2, '#8a7a94');
    for (let i = 0; i < 3; i++) r(x0 + 40 + i * 4, wy + 6, 3, 12, ['#ffcf4d', '#22e0ff', '#ff3ea5'][i]);
    // 门
    r(x0 + 58, wy, 30, wh, '#180e20');
    r(x0 + 60, wy + 3, 26, wh - 6, '#2a1830');
    rl(x0 + 58, gy - 6, 30, 6, K.trim, 0.2);
  } else if (kind === 'bank') {
    // 保险库门
    r(x0 + 8, wy, W - 16, wh + 6, '#0a1414');
    oval(x0 + cx - x0, wy + 16, 20, 18, '#1a2a26');
    oval(x0 + cx - x0, wy + 16, 15, 14, '#0e1a16');
    // 转柄
    for (let a = 0; a < 4; a++) {
      const ang = a * Math.PI / 2 + Math.PI / 4;
      r(cx + Math.cos(ang) * 9 - 1, wy + 16 + Math.sin(ang) * 8 - 1, 3, 3, K.trim);
    }
    r(cx - 2, wy + 14, 4, 4, K.trim);
    // 金条
    for (let i = 0; i < 3; i++) r(x0 + 14 + i * 9, gy - 12, 8, 4, '#ffcf4d');
    // 终端机
    r(x0 + 12, wy - 6, 16, 12, '#0c1a16');
    r(x0 + 14, wy - 4, 12, 7, K.trim);
    // 绿光
    rl(x0 + 8, gy - 10, W - 16, 10, K.trim, 0.14);
  }

  /* --- 门侧小物 --- */
  if (kind === 'store') {
    r(x0 + W - 10, gy - 14, 8, 14, '#0d2a1a');       // 垃圾桶
    r(x0 + W - 10, gy - 15, 8, 2, '#3d8a5a');
  }
  if (kind === 'ramen') {
    r(x0 - 6, gy - 8, 8, 8, '#2a1a0c');              // 凳子
    r(x0 - 6, gy - 9, 8, 2, '#c8341f');
    r(x0 + W - 4, gy - 8, 8, 8, '#2a1a0c');
    r(x0 + W - 4, gy - 9, 8, 2, '#c8341f');
  }
  if (kind === 'cloth') {
    r(x0 + 4, gy - 10, 5, 10, '#2a1830');            // 假人
    oval(x0 + 6, gy - 13, 2, 2, '#c9bfd6');
  }
  if (kind === 'music') {
    r(x0 - 5, gy - 6, 6, 6, '#0c0a16'); r(x0 - 5, gy - 7, 6, 1, K.trim);
  }
  // 门口光晕
  rl(x0 + 6, gy - 8, W - 12, 8, K.trim, 0.10);
  rl(cx - 20, gy - 3, 40, 3, K.trim, 0.32);
}

/* =========================================================================
   金币 / 任务终点 / 小物件
   ========================================================================= */
function drawCoin(x, y, t, seed) {
  const ph = Math.sin(t * 4 + (seed || 0));
  const w = Math.abs(ph) * 5 + 1.5;
  const cx = Math.round(x), cy = Math.round(y + Math.sin(t * 2 + (seed || 0)) * 1.2);
  oval(cx, cy, w, 5, '#ffb02e');
  oval(cx, cy, Math.max(1, w - 1.5), 3.5, '#ffe38a');
  r(cx - 0.5, cy - 3, 1, 6, '#fff6c9');
}

function drawBeacon(x, gy, done, t, idx) {
  // 任务旗杆
  r(x - 1, gy - 34, 3, 34, '#2b3a56');
  r(x - 1, gy - 34, 3, 2, '#5a7299');
  const flap = Math.sin(t * 3 + idx) * 2;
  if (done) {
    r(x + 2, gy - 33, 16, 9, '#2a3a2a');
    r(x + 2, gy - 33, 16, 1, '#5dff9b');
    signText('✓', x + 10, gy - 28, '#5dff9b', 8, false);
  } else {
    r(x + 2, gy - 33 + flap, 18, 10, '#ff3ea5');
    r(x + 2, gy - 33 + flap, 18, 1, '#ffb0d8');
    signText(String(idx + 1), x + 11, gy - 28 + flap, '#2a0418', 8, false);
  }
  rl(x - 8, gy - 2, 16, 2, done ? '#5dff9b' : '#ff3ea5', 0.4);
  // 未完成的光柱
  if (!done) {
    rl(x - 6, gy - 40, 12, 40, '#ff3ea5', 0.06 + 0.04 * Math.sin(t * 2));
  }
}

/* =========================================================================
   玩家（12x18 像素小人）
   ========================================================================= */
const COATS = [['#31497a', '#5ef0ff'], ['#5a1a44', '#ff7ad0'], ['#1a5a3c', '#7dffb0'], ['#5a4218', '#ffdd7a']];

function drawPlayer(p, t) {
  const x = Math.round(p.x), y = Math.round(p.y);
  const f = p.face;
  const [coat, trim] = COATS[G.up.coat % COATS.length];
  const running = p.state === 'run';
  const air = !p.onGround;
  const ph = p.anim;

  // 影子
  rl(x - 2, y + p.h - 1, p.w + 4, 2, '#000000', 0.35);
  // 微光（让人物在暗背景里跳出来）
  ctx.globalAlpha = 0.08;
  oval(x + 6, y + 9, 15, 15, '#7fe8ff');
  ctx.globalAlpha = 1;

  // 腿
  const legA = running ? Math.sin(ph) * 3 : 0;
  const legB = running ? -Math.sin(ph) * 3 : 0;
  if (air) {
    r(x + 2, y + 12, 3, 5, '#0d1526');
    r(x + 7, y + 13, 3, 4, '#0d1526');
  } else if (running) {
    r(x + 2 + legA, y + 12, 3, 6, '#0d1526');
    r(x + 7 + legB, y + 12, 3, 6, '#0d1526');
    r(x + 1 + legA, y + 17, 5, 2, trim);
    r(x + 6 + legB, y + 17, 5, 2, trim);
  } else {
    r(x + 2, y + 12, 3, 6, '#0d1526');
    r(x + 7, y + 12, 3, 6, '#0d1526');
    r(x + 1, y + 17, 5, 2, trim);
    r(x + 6, y + 17, 5, 2, trim);
  }

  // 身体
  r(x + 2, y + 5, 8, 8, coat);
  r(x + 2, y + 5, 8, 1, trim);
  r(x + 2, y + 5, 1, 8, shade(coat, 1.35));
  r(x + 5, y + 6, 1, 7, '#0a1020');
  // 手臂
  if (air) {
    r(x + 0, y + 5, 2, 5, coat);
    r(x + 10, y + 5, 2, 5, coat);
  } else {
    const arm = running ? Math.sin(ph + Math.PI) * 2 : 0;
    r(x + 0, y + 6 + arm, 2, 5, coat);
    r(x + 10, y + 6 - arm, 2, 5, coat);
  }
  // 头
  r(x + 2, y, 8, 7, '#d8a98a');
  r(x + 1, y - 1, 9, 4, '#141826');
  r(x + 1, y - 1, 9, 1, trim);
  // 头发后侧
  r(x + (f > 0 ? 1 : 8), y, 3, 4, '#141826');
  // 眼睛 / 面罩
  r(x + (f > 0 ? 7 : 4), y + 3, 2, 2, '#0c1220');
  r(x + (f > 0 ? 9 : 3), y + 3, 1, 2, trim);
  // 背包
  r(x + (f > 0 ? 0 : 10), y + 6, 2, 5, '#2a1a10');
}

/* =========================================================================
   上层步道 / 楼梯
   ========================================================================= */
function drawTerracePillars(p, pal) {
  const base = 250;
  for (let px = p.x + 22; px < p.x + p.w - 14; px += 92) {
    const h = base - (p.y + 12);
    if (h <= 6) continue;
    r(px, p.y + 12, 6, h, '#1a2438');
    r(px, p.y + 12, 1, h, '#2e3f5e');
    r(px, p.y + 12, 6, 2, '#33456a');
    rl(px + 6, p.y + 16, 1, 12, '#26354f', 1);
  }
}

function drawTerrace(p, pal, t) {
  const x = p.x, y = p.y, w = p.w;
  r(x, y + 4, w, 12, pal.isl);
  r(x, y + 4, w, 1, shade(pal.isl, 0.75));
  r(x, y, w, 4, pal.top);
  r(x, y, w, 1, pal.edge);
  rl(x, y - 1, w, 1, pal.edge, 0.3);
  rl(x, y + 5, w, 1, pal.edge, 0.16);
  // 栏杆
  for (let px = x + 5; px + 1 < x + w - 4; px += 13) r(px, y - 9, 1, 9, '#3d5170');
  r(x + 3, y - 10, w - 6, 1, '#5878a8');
  rl(x + 3, y - 9, w - 6, 1, '#000000', 0.35);
}

function drawStep(p, pal) {
  const x = p.x, y = p.y, w = p.w;
  const bottom = 250;
  r(x, y + 3, w, bottom - y - 3, pal.isl);
  rl(x + 1, y + 4, w - 2, bottom - y - 5, '#000000', 0.12);
  rl(x, y + 3, 1, bottom - y - 3, '#ffffff', 0.05);
  r(x, y, w, 3, pal.top);
  r(x, y, w, 1, shade(pal.top, 1.2));
  r(x, y + 3, w, 1, shade(pal.isl, 0.78));
}

const weather = { drops: [], snow: [], sparks: [] };

function initWeather(kind, n) {
  weather.drops.length = 0;
  weather.snow.length = 0;
  for (let i = 0; i < (n || 60); i++) {
    weather.drops.push({ x: rnd(0, VIEW.w), y: rnd(0, VIEW.h), s: rnd(120, 260) });
  }
}

function drawWeather(kind, t, dt) {
  if (kind === 'rain') {
    for (const d of weather.drops) {
      d.y += d.s * dt;
      d.x -= d.s * 0.25 * dt;
      if (d.y > VIEW.h) { d.y = -6; d.x = rnd(0, VIEW.w + 120); }
      r(d.x, d.y, 1, 5, '#8fd8ff44');
    }
  } else if (kind === 'dust') {
    for (const d of weather.drops) {
      d.y -= d.s * 0.15 * dt;
      d.x += Math.sin(t + d.y * 0.05) * 4 * dt;
      if (d.y < -4) { d.y = VIEW.h + 4; d.x = rnd(0, VIEW.w); }
      r(d.x, d.y, 1, 1, '#7dffd044');
    }
  } else if (kind === 'spark') {
    for (const d of weather.drops) {
      d.y -= d.s * 0.5 * dt;
      if (d.y < -4) { d.y = VIEW.h + 4; d.x = rnd(0, VIEW.w); }
      r(d.x, d.y, 1, 2, '#ff8a3d55');
    }
  }
}
