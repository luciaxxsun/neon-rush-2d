'use strict';
/* =========================================================================
   12 city — 背景天际线：三层视差、预渲染到离屏画布，楼体细节（霓虹灯带、
   广告牌、竖招牌、天线、水箱、阳台、管道、收分造型）
   ========================================================================= */

const NEON = ['#22e0ff', '#ff3ea5', '#ffcf4d', '#5dff9b', '#7a4bff', '#ff8a3d'];
const CITY = { cache: {}, key: '' };

function mixHex(a, b, t) {
  const na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16);
  let r = Math.round(((na >> 16) & 255) * (1 - t) + ((nb >> 16) & 255) * t);
  let g = Math.round(((na >> 8) & 255) * (1 - t) + ((nb >> 8) & 255) * t);
  let bl = Math.round((na & 255) * (1 - t) + (nb & 255) * t);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}

function bR(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function bA(c, x, y, w, h, col, a) {
  c.globalAlpha = a;
  bR(c, x, y, w, h, col);
  c.globalAlpha = 1;
}

/* ---------- 单栋楼 ---------- */
function drawTower(c, x, bw, h, baseY, pal, rng, lv, fog) {
  const y = baseY - h;
  const skyLow = pal.sky[pal.sky.length - 1];
  const skyHigh = pal.sky[Math.max(0, pal.sky.length - 2)];
  const body = mixHex(skyLow, pal.mid || '#182a56', fog);
  const bodyDark = mixHex(skyHigh, '#0a1020', 0.55);
  const accent = NEON[(rng() * NEON.length) | 0];
  const accent2 = NEON[(rng() * NEON.length) | 0];
  const style = (rng() * 4) | 0;

  const topH = style === 1 || style === 3 ? Math.round(h * (0.16 + rng() * 0.14)) : 0;
  const shaftW = Math.round(bw * (0.56 + rng() * 0.16));

  // 主楼体
  bR(c, x, y + topH, bw, h - topH, body);
  // 右侧暗面
  bR(c, x + bw - 3, y + topH, 3, h - topH, mixHex(body, '#000000', 0.45));
  // 左侧亮边（受 neon 反光）
  if (lv >= 2) bR(c, x, y + topH, 1, h - topH, mixHex(body, accent, 0.35));

  // 收分塔顶
  if (topH > 0) {
    bR(c, x + (bw - shaftW) / 2, y, shaftW, topH + 2, mixHex(body, '#ffffff', 0.06));
    bR(c, x + (bw - shaftW) / 2 + shaftW - 2, y, 2, topH + 2, mixHex(body, '#000000', 0.4));
  }

  const roofY = topH > 0 ? y : y;
  const roofX = topH > 0 ? x + (bw - shaftW) / 2 : x;
  const roofW = topH > 0 ? shaftW : bw;

  // 楼顶霓虹压边
  if (lv >= 2) {
    bR(c, roofX, roofY, roofW, 1, accent);
    bA(c, roofX, roofY + 1, roofW, 3, accent, 0.14);
  } else {
    bR(c, roofX, roofY, roofW, 1, mixHex(body, '#ffffff', 0.18));
  }

  // 楼顶设备
  if (lv >= 2) {
    const rk = rng();
    if (rk < 0.4) {
      // 天线
      const ax = roofX + roofW * (0.3 + rng() * 0.4);
      bR(c, ax, roofY - 13, 1, 13, mixHex(body, '#ffffff', 0.35));
      bR(c, ax - 1, roofY - 14, 3, 2, '#ff4d6d');
    } else if (rk < 0.7) {
      // 水箱
      const tx = roofX + roofW * 0.5 - 5;
      bR(c, tx, roofY - 9, 10, 9, mixHex(body, '#ffffff', 0.12));
      bR(c, tx + 1, roofY - 11, 8, 2, mixHex(body, '#000000', 0.3));
      bR(c, tx, roofY - 9, 10, 1, mixHex(body, accent, 0.3));
    } else {
      // 空调机组
      bR(c, roofX + 3, roofY - 6, 8, 6, mixHex(body, '#ffffff', 0.1));
      bR(c, roofX + 3, roofY - 6, 8, 1, mixHex(body, '#ffffff', 0.25));
    }
    if (rng() > 0.72) bR(c, roofX + roofW - 10, roofY - 3, 4, 3, mixHex(body, '#ffffff', 0.2));
  }

  // 广告牌（挂在楼体上沿）
  if (lv >= 3 && rng() > 0.55) {
    const bwd = Math.min(roofW - 6, 26 + rng() * 14);
    const bx = roofX + (roofW - bwd) / 2;
    const by = roofY + 5;
    bR(c, bx - 1, by - 1, bwd + 2, 15, mixHex(accent, '#ffffff', 0.25));
    bR(c, bx, by, bwd, 13, '#080b14');
    const bars = 2 + ((rng() * 2) | 0);
    for (let i = 0; i < bars; i++) {
      bR(c, bx + 2, by + 2 + i * 4, bwd - 4, 2, i % 2 ? accent2 : accent);
    }
    bA(c, bx - 2, by + 15, bwd + 4, 4, accent, 0.12);
  }

  // 竖向霓虹招牌
  if (lv >= 2 && rng() > 0.45) {
    const side = rng() > 0.5;
    const sx = side ? x + bw - 5 : x + 1;
    const sy = y + topH + 8 + rng() * 10;
    const sh = 16 + rng() * 22;
    bR(c, sx, sy, 4, sh, mixHex(accent2, '#000000', 0.15));
    for (let i = 0; i < 4; i++) bA(c, sx + 1, sy + 3 + i * 5, 2, 2, '#ffffff', 0.55);
    bA(c, sx - 3, sy, 10, sh, accent2, 0.10);
  }

  // 窗户
  if (lv >= 1) {
    const pad = 4;
    const cw = lv === 3 ? 5 : 4;
    const ch = lv === 3 ? 4 : 3;
    const gx = lv === 3 ? 3 : 4;
    const gy = lv === 3 ? 4 : 4;
    const cols = Math.floor((bw - pad * 2) / (cw + gx));
    const rows = Math.floor((h - topH - 8) / (ch + gy));
    const litP = lv === 3 ? 0.5 : (lv === 2 ? 0.42 : 0.3);
    const WC = ['#ffe6b8', '#cfe9ff', '#ffd9a8', '#a8e6ff'];
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        const wx = x + pad + rx * (cw + gx);
        const wy = y + topH + 6 + ry * (ch + gy);
        // 窗框
        bA(c, wx, wy, cw, ch, '#050810', 0.75);
        if (rng() < litP) {
          const col = rng() > 0.85 ? accent : WC[(rng() * WC.length) | 0];
          bA(c, wx + 1, wy + 1, cw - 2, ch - 2, col, lv === 3 ? 0.55 + rng() * 0.45 : 0.4 + rng() * 0.35);
        }
      }
    }
    // 楼层横线
    if (lv === 3) {
      for (let fy = y + topH + 10; fy < baseY - 6; fy += 18) bA(c, x, fy, bw, 1, '#000000', 0.35);
    }
  }

  // 阳台 / 管道 / 外挂机（近景）
  if (lv === 3) {
    if (rng() > 0.55) {
      for (let i = 0; i < 3; i++) {
        const by = y + topH + 12 + i * 16 + rng() * 4;
        bR(c, x - 2, by, 7, 2, mixHex(body, '#ffffff', 0.16));
      }
    }
    if (rng() > 0.5) {
      const px2 = x + 6 + rng() * (bw - 14);
      bR(c, px2, y + topH + 6, 2, h - topH - 10, mixHex(body, '#000000', 0.3));
      bR(c, px2, y + topH + 6, 1, h - topH - 10, mixHex(body, '#ffffff', 0.10));
    }
    if (rng() > 0.6) {
      const ax2 = x + 4 + rng() * (bw - 12);
      bR(c, ax2, y + topH + 22, 6, 4, mixHex(body, '#ffffff', 0.18));
    }
  }

  // 楼底灯光（街道反光）
  if (lv >= 2) bA(c, x + 2, baseY - 3, bw - 4, 3, accent, 0.22);
  // 整体霓虹晕
  if (lv === 3) bA(c, x - 4, y, bw + 8, h, accent, 0.035);
}

/* ---------- 一层城市 ---------- */
function buildLayer(pal, seed, lv, baseY, hMin, hMax, fog) {
  const W = 1600, H = VIEW.h;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  const rng = mulberry32(seed);
  let x = -30;
  while (x < W - 60) {
    const bw = Math.round(lv === 1 ? 18 + rng() * 30 : (lv === 2 ? 30 + rng() * 44 : 44 + rng() * 66));
    if (x + bw > W - 4) break;
    const h = Math.round(hMin + rng() * (hMax - hMin));
    drawTower(c, x, bw, h, baseY + Math.round((rng() - 0.5) * 8), pal, rng, lv, fog);
    x += bw + Math.round(rng() * (lv === 3 ? 6 : 14));
  }
  return cv;
}

/* ---------- 场景预制 ---------- */
function darkenLayer(cv, k) {
  const c = cv.getContext('2d');
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = 'rgba(3,5,10,' + k + ')';
  c.fillRect(0, 0, cv.width, cv.height);
  c.globalCompositeOperation = 'source-over';
}

function buildCityFor(scene) {
  const key = scene.id + ':' + (scene.world || 0);
  if (CITY.key === key) return;
  CITY.key = key;
  CITY.cache = {};
  const pal = scene.pal;
  CITY.cache.far = buildLayer(pal, 1337 + (scene.world || 0) * 11, 1, 250, 70, 190, 0.62);
  CITY.cache.mid = buildLayer(pal, 2401 + (scene.world || 0) * 17, 2, 268, 60, 165, 0.34);
  CITY.cache.near = buildLayer(pal, 3571 + (scene.world || 0) * 23, 3, 330, 78, 150, 0.0);
  darkenLayer(CITY.cache.near, 0.5);   // 近景压暗，别抢前景平台
}

function blitLayer(cv, factor, y, alpha) {
  if (!cv) return;
  const W = cv.width;
  let off = (CAM.x * factor) % W;
  if (off < 0) off += W;
  ctx.globalAlpha = alpha === undefined ? 1 : alpha;
  ctx.drawImage(cv, -Math.round(off), Math.round(y));
  ctx.drawImage(cv, -Math.round(off) + W, Math.round(y));
  ctx.globalAlpha = 1;
}

function drawCityLayers(skipNear, nearAlpha) {
  if (!CITY.cache.far) return;
  blitLayer(CITY.cache.far, 0.10, 0);
  blitLayer(CITY.cache.mid, 0.24, 0);
  if (!skipNear) blitLayer(CITY.cache.near, 0.46, 0, nearAlpha === undefined ? 1 : nearAlpha);
}

/* =========================================================================
   岛上的连排背街楼（预渲染成一条连续街墙，填掉建筑之间的缝）
   ========================================================================= */
function buildBackRowCanvas(sc) {
  const p0 = sc.platforms[0];
  const H = 220;
  const W = Math.ceil(p0.w) + 44;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;

  const rng = mulberry32(Math.floor(p0.x) * 31 + 7);
  const gy = H - 8;
  const bodies = ['#121a2e', '#151f38', '#101a2c', '#182342', '#141c33'];
  const WC = ['#ffe6b8', '#cfe9ff', '#ffd9a8', '#a8e6ff'];
  const neon = sc.pal.edge;

  let x = 0;
  while (x < W) {
    const bw = 24 + Math.round(rng() * 48);
    const bh = 44 + Math.round(rng() * 96);
    c.fillStyle = bodies[(rng() * bodies.length) | 0];
    c.fillRect(x, gy - bh, bw + 1, bh);
    c.fillStyle = '#26365299';
    c.fillRect(x, gy - bh, bw + 1, 2);

    const cols = Math.max(1, Math.floor((bw - 6) / 8));
    const rows = Math.max(1, Math.floor((bh - 10) / 9));
    for (let ry = 0; ry < rows; ry++) {
      for (let cx2 = 0; cx2 < cols; cx2++) {
        const wx = x + 4 + cx2 * 8;
        const wy = gy - bh + 5 + ry * 9;
        if (rng() > 0.58) {
          c.globalAlpha = 0.4 + rng() * 0.4;
          c.fillStyle = WC[(rng() * WC.length) | 0];
          c.fillRect(wx, wy, 4, 4);
          c.globalAlpha = 1;
        } else {
          c.fillStyle = 'rgba(4,7,14,.85)';
          c.fillRect(wx, wy, 4, 4);
        }
      }
    }

    if (rng() > 0.5) {
      c.globalAlpha = 0.3;
      c.fillStyle = neon;
      c.fillRect(x, gy - bh - 1, bw, 1);
      c.fillRect(x, gy - bh + 2, bw, 1);
      c.globalAlpha = 1;
    }
    if (rng() > 0.7) {
      const sx = x + 3 + rng() * Math.max(1, bw - 10);
      c.globalAlpha = 0.14;
      c.fillStyle = '#ffffff';
      c.fillRect(sx, gy - bh + 8, 3, 16);
      c.globalAlpha = 1;
    }
    if (rng() > 0.72) {
      c.fillStyle = '#2a3a58';
      c.fillRect(x + 3, gy - bh + 6, 5, 4);
    }
    x += bw + 1;   // 紧挨着，形成连续街墙
  }
  return { cv, x: p0.x - 22, y: 250 - (H - 8) };
}
