'use strict';
/* =========================================================================
   14 shops — 十种店面（覆盖 10-art 里的旧版 drawShop）+ 不可进入的大型建筑
   ========================================================================= */

const SHOP_ART = {
  store: { body: '#1c2a48', trim: '#22e0ff', sign: '24H 便利店', bg: '#22e0ff', fg: '#04121a', win: 'shelf', awn: 'stripe' },
  cyber: { body: '#251a33', trim: '#ff3ea5', sign: '义体诊所', bg: '#a0165e', fg: '#ffffff', win: 'arms', awn: 'none' },
  ramen: { body: '#2f1d0c', trim: '#ffcf4d', sign: '樱 拉 面', bg: '#ffcf4d', fg: '#2a1503', win: 'noren', awn: 'noren' },
  music: { body: '#1a1e38', trim: '#7a4bff', sign: '唱 片 行', bg: '#4a22a8', fg: '#e9e2ff', win: 'vinyl', awn: 'stripe' },
  cloth: { body: '#2b1a38', trim: '#ff8ad5', sign: '霓 裳', bg: '#ff8ad5', fg: '#2a0618', win: 'mannequin', awn: 'stripe' },
  bank: { body: '#152828', trim: '#5dff9b', sign: '芯 片 兑 换', bg: '#5dff9b', fg: '#02110c', win: 'vault', awn: 'none' },
  cafe: { body: '#2e2118', trim: '#ffb347', sign: '咖 啡 站', bg: '#ffb347', fg: '#2a1403', win: 'cups', awn: 'plain' },
  flower: { body: '#17281c', trim: '#5dff9b', sign: '花 店', bg: '#5dff9b', fg: '#06231a', win: 'flowers', awn: 'green' },
  tool: { body: '#22262e', trim: '#ff8a3d', sign: '五 金 铺', bg: '#ff8a3d', fg: '#241203', win: 'tools', awn: 'none' },
  arcade: { body: '#120e24', trim: '#7a4bff', sign: '街 机 厅', bg: '#7a4bff', fg: '#efe6ff', win: 'screens', awn: 'stripe' }
};

function drawShop(kind, x, gy, t) {
  const A = SHOP_ART[kind] || SHOP_ART.store;
  const W = SHOP_W, H = SHOP_H;
  const x0 = Math.round(x - W / 2), y0 = Math.round(gy - H);
  const cx = x;

  rl(x0 + 6, gy - 4, W - 12, 5, '#000000', 0.35);

  // 墙体
  r(x0, y0 + 18, W, H - 18, A.body);
  for (let yy = y0 + 22; yy < gy - 4; yy += 6) rl(x0 + 1, yy, W - 2, 1, '#000000', 0.26);
  r(x0, y0 + 18, 4, H - 18, '#0b1020');
  r(x0 + W - 4, y0 + 18, 4, H - 18, '#0b1020');

  // 招牌
  const sy = y0 + 2;
  r(x0 + 4, sy, W - 8, 16, '#080c16');
  r(x0 + 4, sy, W - 8, 2, A.trim);
  rl(x0 + 4, sy + 14, W - 8, 2, A.trim, 0.4);
  r(x0 + 8, sy + 4, W - 16, 9, A.bg);
  signText(A.sign, cx, sy + 8.5, A.fg, 8, false);

  // 雨棚
  if (A.awn === 'stripe') {
    const aw = W - 10;
    for (let i = 0; i < aw / 8; i++) r(x0 + 5 + i * 8, sy + 16, 8, 5, i % 2 ? A.trim : '#f2f7ff');
    r(x0 + 5, sy + 21, aw, 1, '#00000055');
  } else if (A.awn === 'green') {
    for (let i = 0; i < (W - 12) / 8; i++) r(x0 + 6 + i * 8, sy + 16, 8, 5, i % 2 ? '#2f7a4a' : '#5dff9b');
  } else if (A.awn === 'plain') {
    r(x0 + 5, sy + 16, W - 10, 4, '#8a5a2a');
    r(x0 + 5, sy + 20, W - 10, 1, '#c98a4a');
  } else if (A.awn === 'noren') {
    r(x0 + 6, sy + 16, W - 12, 2, '#3a2a1a');
  }

  const wy = y0 + 30, wh = 30;

  if (A.win === 'shelf') {
    r(x0 + 8, wy, 44, wh, '#0a2230');
    r(x0 + 8, wy, 44, 2, '#2ad0ff');
    for (let i = 0; i < 3; i++) {
      r(x0 + 11, wy + 7 + i * 8, 38, 3, '#123448');
      const cols = ['#ff5ad9', '#5dff9b', '#ffcf4d', '#22e0ff'];
      for (let j = 0; j < 7; j++) r(x0 + 12 + j * 5, wy + 4 + i * 8, 3, 3, cols[(i + j) % 4]);
    }
    rl(x0 + 8, wy, 44, wh, '#9fe8ff', 0.10);
    r(x0 + 12, wy + 2, 2, 24, '#ffffff22');
    r(x0 + 58, wy, 30, wh, '#08161f');
    r(x0 + 58, wy, 30, 2, A.trim);
    r(x0 + 60, wy + 4, 12, wh - 6, '#12384a');
    r(x0 + 74, wy + 4, 12, wh - 6, '#12384a');
    r(x0 + 72, wy + 4, 2, wh - 6, '#04121a');
    r(x0 + 62, wy + 14, 3, 10, A.trim);
    r(x0 + W - 10, gy - 14, 8, 14, '#0d2a1a');
    r(x0 + W - 10, gy - 15, 8, 2, '#3d8a5a');
  } else if (A.win === 'arms') {
    r(x0 + 8, wy, 50, wh, '#0d0a16');
    for (let i = 0; i < 4; i++) r(x0 + 10, wy + 4 + i * 7, 46, 1, '#2a1a3a');
    for (let i = 0; i < 3; i++) {
      const ax = x0 + 14 + i * 15;
      r(ax, wy + 6, 5, 14, '#5a4a6a');
      r(ax, wy + 6, 5, 2, '#8a7aa0');
      r(ax + 1, wy + 19, 3, 5, '#3a2f4a');
    }
    rl(x0 + 8, wy, 50, wh, '#ff3ea5', 0.08);
    r(x0 + 30, wy - 2, 12, 4, '#ff2b4d');
    r(x0 + 34, wy - 6, 4, 12, '#ff2b4d');
    r(x0 + 64, wy, 24, wh, '#120c1c');
    r(x0 + 66, wy + 3, 20, wh - 6, '#241634');
    r(x0 + 74, wy + 3, 1, wh - 6, '#0a0610');
  } else if (A.win === 'noren') {
    r(x0 + 8, wy, 80, wh, '#2a1a0c');
    for (let i = 0; i < 8; i++) r(x0 + 8 + i * 10, wy, 1, wh, '#1a0f06');
    for (let i = 0; i < 4; i++) {
      r(x0 + 10 + i * 19, wy, 17, 12, '#c8341f');
      rl(x0 + 10 + i * 19, wy + 11, 17, 1, '#7a1a0c', 0.9);
    }
    signText('拉', x0 + 18, wy + 6, '#ffe6c9', 8, false);
    signText('麺', x0 + 56, wy + 6, '#ffe6c9', 8, false);
    oval(x0 + 6, wy - 4, 4, 5, '#ff5a3d');
    rl(x0 + 6, wy - 10, 1, 3, '#ffcf4d', 0.8);
    oval(x0 + W - 8, wy - 4, 4, 5, '#ff5a3d');
    for (let i = 0; i < 4; i++) {
      const yy = wy + 16 - ((t * 14 + i * 9) % 30);
      rl(x0 + 20 + i * 16 + Math.sin(t + i) * 3, yy, 6, 3, '#ffd9b0', 0.10 + 0.06 * Math.sin(t * 3 + i));
    }
    rl(x0 + 4, gy - 8, W - 8, 8, '#ff8a3d', 0.18);
    r(x0 - 6, gy - 8, 8, 8, '#2a1a0c');
    r(x0 - 6, gy - 9, 8, 2, '#c8341f');
    r(x0 + W - 4, gy - 8, 8, 8, '#2a1a0c');
    r(x0 + W - 4, gy - 9, 8, 2, '#c8341f');
  } else if (A.win === 'vinyl') {
    r(x0 + 8, wy, 52, wh, '#12101f');
    for (let i = 0; i < 3; i++) {
      const dx = x0 + 20 + i * 14, dy = wy + 12 + (i % 2) * 8;
      oval(dx, dy, 6, 6, '#2c2444');
      oval(dx, dy, 4, 4, '#413466');
      oval(dx, dy, 2, 2, '#a78bff');
      rl(dx - 3, dy - 4, 2, 2, '#ffffff', 0.5);
    }
    rl(x0 + 8, wy, 52, wh, '#7a4bff', 0.1);
    r(x0 + 62, wy, 12, 26, '#0c0a16');
    oval(x0 + 68, wy + 8, 4, 4, '#241a3a');
    oval(x0 + 68, wy + 19, 4, 4, '#241a3a');
    r(x0 + 78, wy, 10, wh, '#120f22');
    for (let i = 0; i < 3; i++) {
      const yy = wy - 4 - ((t * 10 + i * 8) % 16);
      rl(x0 + 14 + i * 18, yy, 2, 4, A.trim, 0.5 + 0.3 * Math.sin(t * 2 + i));
    }
    r(x0 - 5, gy - 6, 6, 6, '#0c0a16');
    r(x0 - 5, gy - 7, 6, 1, A.trim);
  } else if (A.win === 'mannequin') {
    r(x0 + 8, wy, 46, wh, '#1a0f1e');
    rl(x0 + 8, wy, 46, wh, '#ff8ad5', 0.1);
    oval(x0 + 26, wy + 10, 4, 4, '#d8cfe0');
    r(x0 + 21, wy + 14, 10, 10, '#ff8ad5');
    r(x0 + 23, wy + 24, 3, 6, '#c96aa0');
    r(x0 + 27, wy + 24, 3, 6, '#c96aa0');
    r(x0 + 38, wy + 4, 14, 2, '#8a7a94');
    for (let i = 0; i < 3; i++) r(x0 + 40 + i * 4, wy + 6, 3, 12, ['#ffcf4d', '#22e0ff', '#ff3ea5'][i]);
    r(x0 + 58, wy, 30, wh, '#180e20');
    r(x0 + 60, wy + 3, 26, wh - 6, '#2a1830');
    r(x0 + 4, gy - 10, 5, 10, '#2a1830');
    oval(x0 + 6, gy - 13, 2, 2, '#c9bfd6');
  } else if (A.win === 'vault') {
    r(x0 + 8, wy, W - 16, wh + 6, '#0a1414');
    oval(x, wy + 16, 20, 18, '#1a2a26');
    oval(x, wy + 16, 15, 14, '#0e1a16');
    for (let a = 0; a < 4; a++) {
      const ang = a * Math.PI / 2 + Math.PI / 4;
      r(cx + Math.cos(ang) * 9 - 1, wy + 16 + Math.sin(ang) * 8 - 1, 3, 3, A.trim);
    }
    r(cx - 2, wy + 14, 4, 4, A.trim);
    for (let i = 0; i < 3; i++) r(x0 + 14 + i * 9, gy - 12, 8, 4, '#ffcf4d');
    r(x0 + 12, wy - 6, 16, 12, '#0c1a16');
    r(x0 + 14, wy - 4, 12, 7, A.trim);
    rl(x0 + 8, gy - 10, W - 16, 10, A.trim, 0.14);
  } else if (A.win === 'cups') {
    // 咖啡站：吧台、咖啡机、杯子
    r(x0 + 8, wy, 62, wh, '#2e1d0a');
    r(x0 + 8, wy + 18, 62, 12, '#4a2e12');
    r(x0 + 8, wy + 18, 62, 1, '#8a5a2a');
    // 咖啡机
    r(x0 + 12, wy + 4, 16, 14, '#4a3620');
    r(x0 + 14, wy + 6, 12, 6, '#e0a860');
    r(x0 + 16, wy + 14, 3, 4, '#241608');
    r(x0 + 22, wy + 14, 3, 4, '#241608');
    // 杯子排
    for (let i = 0; i < 5; i++) {
      r(x0 + 34 + i * 6, wy + 12, 4, 5, '#f2e6d0');
      r(x0 + 34 + i * 6, wy + 12, 4, 1, '#8a5a2a');
    }
    // 蒸汽
    for (let i = 0; i < 3; i++) {
      const yy = wy + 2 - ((t * 12 + i * 10) % 22);
      rl(x0 + 18 + i * 5 + Math.sin(t + i) * 2, yy, 3, 3, '#ffe6c9', 0.18);
    }
    r(x0 + 72, wy, 16, wh, '#1a1008');
    r(x0 + 74, wy + 3, 12, wh - 6, '#2e1d0c');
    r(x0 + 74, wy + 3, 12, 1, A.trim);
    // 户外小桌
    r(x0 + W - 12, gy - 9, 12, 2, '#5a3a1c');
    r(x0 + W - 8, gy - 9, 2, 9, '#3a2410');
  } else if (A.win === 'flowers') {
    // 花店：橱窗里三层花桶
    r(x0 + 8, wy, 52, wh, '#0e1c12');
    for (let i = 0; i < 5; i++) {
      const fx = x0 + 13 + i * 10;
      r(fx, wy + 14, 7, 10, '#2a3a2a');
      oval(fx + 3, wy + 12, 4, 4, ['#ff5ad9', '#ffcf4d', '#ff8ad5', '#c9a0ff', '#5dff9b'][i]);
      oval(fx + 3, wy + 8, 2.5, 3, '#3d8a5a');
    }
    r(x0 + 8, wy + 24, 52, 2, '#1e3a26');
    rl(x0 + 8, wy, 52, wh, '#5dff9b', 0.08);
    r(x0 + 64, wy, 24, wh, '#101c14');
    r(x0 + 66, wy + 3, 20, wh - 6, '#1a2c20');
    // 门口花桶
    r(x0 - 4, gy - 10, 9, 10, '#2a3a2a');
    oval(x0, gy - 12, 5, 4, '#ff5ad9');
    r(x0 + W - 6, gy - 9, 8, 9, '#2a3a2a');
    oval(x0 + W - 2, gy - 11, 4, 4, '#ffcf4d');
  } else if (A.win === 'tools') {
    // 五金铺：洞洞板挂工具
    r(x0 + 8, wy, 56, wh, '#14181e');
    for (let i = 0; i < 8; i++) r(x0 + 10 + i * 7, wy + 2, 1, wh - 4, '#1e242c');
    // 扳手 / 锤子 / 锯
    r(x0 + 14, wy + 6, 3, 14, '#8a95a5');
    r(x0 + 12, wy + 5, 7, 3, '#8a95a5');
    r(x0 + 28, wy + 7, 3, 10, '#6a4420');
    r(x0 + 25, wy + 4, 9, 5, '#8a95a5');
    r(x0 + 42, wy + 6, 4, 16, '#a5b0c0');
    r(x0 + 40, wy + 6, 8, 2, '#6a7a8a');
    r(x0 + 54, wy + 4, 4, 18, '#5a6a7a');
    rl(x0 + 8, wy, 56, wh, '#ff8a3d', 0.06);
    r(x0 + 68, wy, 20, wh, '#0e1218');
    r(x0 + 70, wy + 3, 16, wh - 6, '#2a1c10');
    r(x0 + 70, wy + 3, 16, 2, A.trim);
    // 门口堆的钢管
    for (let i = 0; i < 3; i++) r(x0 + W - 10, gy - 6 + i, 12, 2, '#6a7a8a');
  } else if (A.win === 'screens') {
    // 街机厅：一排发光机台
    r(x0 + 8, wy, W - 16, wh, '#08060f');
    for (let i = 0; i < 4; i++) {
      const ax = x0 + 11 + i * 18;
      r(ax, wy + 6, 14, 20, '#181230');
      r(ax + 1, wy + 8, 12, 10, ['#22e0ff', '#ff3ea5', '#ffcf4d', '#5dff9b'][i]);
      r(ax + 3, wy + 20, 8, 2, '#0a0814');
      r(ax + 2, wy + 26, 10, 2, '#2a1a4a');
    }
    for (let i = 0; i < 5; i++) {
      rl(x0 + 10 + i * 16, wy - 6 - ((t * 14 + i * 12) % 20), 2, 2, A.trim, 0.5);
    }
    rl(x0 + 8, wy, W - 16, wh, '#7a4bff', 0.12);
    r(x0 + W - 12, gy - 18, 8, 18, '#141024');
    r(x0 + W - 11, gy - 16, 6, 8, A.trim);
  }

  // 门口光
  rl(x0 + 6, gy - 8, W - 12, 8, A.trim, 0.10);
  rl(cx - 20, gy - 3, 40, 3, A.trim, 0.30);
}

/* =========================================================================
   不可进入的大型建筑（背景层次）
   ========================================================================= */
function drawBuildingProp(kind, x, gy, w, h, seed, t) {
  const rng = mulberry32(seed | 0);
  const x0 = Math.round(x - w / 2), y0 = Math.round(gy - h);
  const dark = '#0e1830';
  const body = '#1c2742';
  const body2 = '#27354f';
  const neon = ['#22e0ff', '#ff3ea5', '#ffcf4d', '#5dff9b'][(seed | 0) % 4];

  if (kind === 'apart') {
    // 居民楼：阳台 + 晾衣 + 空调
    r(x0, y0, w, h, body);
    r(x0, y0, w, 2, '#2b3a58');
    r(x0 + w - 3, y0, 3, h, dark);
    for (let fy = y0 + 8; fy < gy - 6; fy += 16) {
      rl(x0, fy, w, 1, '#0a1018', 0.9);
      const cols = Math.max(2, Math.floor((w - 8) / 9));
      for (let c2 = 0; c2 < cols; c2++) {
        const wx = x0 + 5 + c2 * 9;
        r(wx, fy + 3, 5, 5, '#070c14');
        if (rng() > 0.45) rl(wx + 1, fy + 4, 3, 3, '#ffe6b8', 0.45 + rng() * 0.4);
      }
      if (rng() > 0.6) {
        // 晾衣杆
        r(x0 + 2, fy + 1, w - 8, 1, '#3a4a66');
        for (let k = 0; k < 3; k++) {
          if (rng() > 0.4) r(x0 + 5 + k * 8 + rng() * 3, fy + 2, 3, 5, ['#ff5ad9', '#22e0ff', '#ffcf4d', '#f2f7ff'][(rng() * 4) | 0]);
        }
      }
    }
    // 楼顶：水箱 + 天线
    r(x0 + w * 0.2, y0 - 7, w * 0.3, 7, '#2a3a58');
    r(x0 + w * 0.72, y0 - 12, 1, 12, '#3a4a66');
    r(x0 + w * 0.72 - 1, y0 - 13, 3, 2, '#ff4d6d');
    // 门厅
    r(x0 + w / 2 - 7, gy - 16, 14, 16, '#0a0f1a');
    r(x0 + w / 2 - 5, gy - 14, 10, 14, '#1a2438');
    rl(x0 + w / 2 - 9, gy - 2, 18, 2, neon, 0.5);
  } else if (kind === 'factory') {
    // 工厂：锯齿屋顶 + 烟囱 + 管道
    r(x0, y0 + 14, w, h - 14, body);
    // 锯齿顶
    for (let i = 0; i < 4; i++) {
      const sx = x0 + i * (w / 4);
      ctx.fillStyle = body2;
      ctx.beginPath();
      ctx.moveTo(sx, y0 + 14);
      ctx.lineTo(sx + w / 8, y0 + 2);
      ctx.lineTo(sx + w / 4, y0 + 14);
      ctx.closePath();
      ctx.fill();
    }
    // 烟囱
    r(x0 + w * 0.14, y0 - 22, 9, 34, '#2a3248');
    r(x0 + w * 0.14 - 1, y0 - 24, 11, 3, '#3a4a66');
    for (let i = 0; i < 4; i++) {
      const sy = y0 - 26 - ((t * 9 + i * 11) % 34);
      rl(x0 + w * 0.14 + 1 + Math.sin(t + i) * 3, sy, 7, 4, '#8fa5c8', 0.10 + 0.05 * i);
    }
    // 高窗
    for (let i = 0; i < 7; i++) {
      const wx = x0 + 8 + i * (w - 16) / 7;
      r(wx, y0 + 18, 7, 6, '#071018');
      if (rng() > 0.35) rl(wx, y0 + 18, 7, 6, '#ffcf4d', 0.42);
    }
    // 腰部窄窗
    for (let i = 0; i < 6; i++) {
      const wx = x0 + 10 + i * (w - 20) / 6;
      r(wx, y0 + 30, 5, 4, '#060e14');
      if (rng() > 0.5) rl(wx, y0 + 30, 5, 4, '#22e0ff', 0.35);
    }
    // 霓虹厂牌
    r(x0 + w * 0.3, y0 + 40, w * 0.4, 9, '#080c16');
    r(x0 + w * 0.3, y0 + 40, w * 0.4, 1, neon);
    signText('FACTORY', x0 + w * 0.5, y0 + 45, neon, 7, false);
    // 黄黑警示条
    for (let i = 0; i < 4; i++) r(x0 + w * 0.3 + i * 6, gy - 4, 3, 3, '#ffcf4d');
    // 管道
    r(x0 + w * 0.55, y0 + 14, 3, h - 20, '#3a4a66');
    r(x0 + w * 0.55, y0 + 30, 3, 2, '#5a6a8a');
    // 卷帘门
    r(x0 + w * 0.3, gy - 18, w * 0.34, 18, '#0c1220');
    for (let i = 0; i < 6; i++) r(x0 + w * 0.3, gy - 18 + i * 3, w * 0.34, 1, '#1a2438');
    rl(x0 + w * 0.3, gy - 20, w * 0.34, 2, neon, 0.5);
    // 警示灯
    r(x0 + w - 8, y0 + 16, 3, 3, '#ff4d6d');
  } else if (kind === 'warehouse') {
    // 仓库：低矮 + 波纹墙 + 大门
    r(x0, y0 + 8, w, h - 8, body);
    for (let i = 0; i < w / 4; i++) rl(x0 + i * 4, y0 + 8, 1, h - 8, '#0e1626', 0.8);
    r(x0, y0 + 6, w, 4, body2);
    r(x0, y0 + 6, w, 1, neon);
    r(x0 + w * 0.18, gy - 20, w * 0.3, 20, '#0b1018');
    r(x0 + w * 0.18, gy - 20, w * 0.3, 1, '#3a4a66');
    for (let i = 0; i < 5; i++) r(x0 + w * 0.18, gy - 17 + i * 4, w * 0.3, 1, '#141e30');
    // 货箱
    for (let i = 0; i < 3; i++) {
      r(x0 + w * 0.62 + i * 9, gy - 9 - (i % 2) * 5, 8, 8 + (i % 2) * 5, '#33220f');
      r(x0 + w * 0.62 + i * 9, gy - 9 - (i % 2) * 5, 8, 1, '#6a4420');
    }
    rl(x0 + w * 0.14, gy - 22, w * 0.4, 22, neon, 0.06);
  } else {
    // 停车楼：多层开口 + 车位 + 车
    r(x0, y0 + 6, w, h - 6, body);
    r(x0, y0 + 4, w, 3, body2);
    const floors = Math.max(3, Math.floor((h - 12) / 18));
    for (let f = 0; f < floors; f++) {
      const fy = y0 + 10 + f * ((h - 14) / floors);
      r(x0, fy, w, 1, '#2a3a58');
      // 立柱
      for (let c2 = 0; c2 < 3; c2++) r(x0 + 4 + c2 * ((w - 10) / 2.2), fy + 1, 3, (h - 14) / floors - 2, '#0a1018');
      // 车
      if (rng() > 0.45) {
        const cxp = x0 + 8 + rng() * (w - 26);
        r(cxp, fy + 6, 12, 5, ['#22e0ff', '#ff3ea5', '#ffcf4d', '#5dff9b'][(rng() * 4) | 0]);
        r(cxp + 2, fy + 4, 8, 3, '#3a4a66');
        r(cxp + 2, fy + 5, 6, 2, '#8fd8ff');
      }
    }
    rl(x0, y0 + 4, w, 2, neon, 0.6);
    r(x0 + w / 2 - 8, gy - 14, 16, 14, '#0a0f1a');
    rl(x0 + w / 2 - 9, gy - 2, 18, 2, neon, 0.5);
  }
}

/* =========================================================================
   电梯
   ========================================================================= */
function drawLift(s, t) {
  const gy = s.y;
  const w = 34, x0 = Math.round(s.x - w / 2);
  const top = 96;
  const carH = 44;
  // 轿厢位置只看电梯自己的楼层状态，跟玩家跳不跳无关
  const targetY = s.car ? 150 - carH : gy - carH;
  if (s.carY === undefined) s.carY = targetY;
  s.carY += (targetY - s.carY) * 0.16;
  const carY = Math.round(s.carY);

  // 外框
  r(x0 - 5, top - 9, w + 10, gy - top + 9, '#1b2740');
  r(x0 - 4, top - 8, w + 8, 2, '#33456a');
  r(x0 - 3, top - 6, 2, gy - top + 6, '#33456a');
  r(x0 + w + 1, top - 6, 2, gy - top + 6, '#33456a');
  // 玻璃井道
  r(x0 + 1, top, w - 2, gy - top, '#0d1a2c');
  rl(x0 + 3, top + 4, w - 6, gy - top - 8, '#22e0ff', 0.06);
  // 导轨
  r(x0 + 2, top + 2, 2, gy - top - 4, '#3d5373');
  r(x0 + w - 4, top + 2, 2, gy - top - 4, '#3d5373');
  // 横档
  for (let yy = top + 26; yy < gy - 14; yy += 26) rl(x0 + 4, yy, w - 8, 1, '#16223a', 1);

  // 地面门（先画，轿厢停在一层时会被轿厢盖住，看起来像开着门）
  r(x0 - 4, gy - 34, w + 8, 34, '#243350');
  r(x0 - 4, gy - 34, w + 8, 2, '#4a6088');
  r(x0 - 2, gy - 31, 15, 31, '#2e3f5e');
  r(x0 + 16, gy - 31, 15, 31, '#28374f');
  r(x0 + 15, gy - 31, 1, 31, '#0a1220');
  rl(x0 - 2, gy - 3, w + 4, 2, '#22e0ff', 0.3);

  // 轿厢
  r(x0 + 4, carY, w - 8, carH, '#31456a');
  r(x0 + 4, carY, w - 8, 2, '#6a86b0');
  r(x0 + 6, carY + 4, w - 12, carH - 8, '#16253c');
  rl(x0 + 7, carY + 6, w - 14, 12, '#ffe6b8', 0.34);
  rl(x0 + 7, carY + 18, w - 14, 1, '#ffe6b8', 0.5);
  r(x0 + 4, carY + carH - 3, w - 8, 3, '#0e1a2b');
  rl(x0 + 4, carY, w - 8, 1, '#7fd4ff', 0.55);
  // 轿厢里的人
  r(x0 + 13, carY + 19, 6, 14, '#31497a');
  r(x0 + 14, carY + 14, 5, 5, '#d8a98a');

  // 顶部楼层显示
  r(x0 - 2, top - 24, w + 4, 14, '#070c16');
  r(x0 - 2, top - 24, w + 4, 1, '#ff9f43');
  signText(s.car ? '2F' : '1F', s.x, top - 17, '#ff9f43', 8, false);

  // 呼叫灯
  const blink = 0.55 + 0.45 * Math.sin(t * 3);
  rl(x0 + w + 6, gy - 26, 5, 5, '#ff3ea5', blink);
  rl(x0 + w + 3, gy - 29, 11, 11, '#ff3ea5', 0.1 * blink);
  // 招牌
  r(x0 - 4, gy - 58, w + 8, 13, '#070c16');
  r(x0 - 4, gy - 58, w + 8, 1, '#22e0ff');
  signText('电 梯', s.x, gy - 51, '#9fe8ff', 7, false);
}

/* =========================================================================
   店铺内景（进店时画在面板上方）
   ========================================================================= */
function drawShopInterior(c2, shopId) {
  const A = SHOP_ART[shopId] || SHOP_ART.store;
  const shop = (typeof SHOPS !== 'undefined') ? SHOPS.find(s => s.id === shopId) : null;
  const W = 480, H = 150;
  const R2 = (x, y, w, h, c) => { c2.fillStyle = c; c2.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

  R2(0, 0, W, H, A.body);
  const g = c2.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,.5)');
  g.addColorStop(0.45, 'rgba(0,0,0,.12)');
  g.addColorStop(1, 'rgba(0,0,0,.6)');
  c2.fillStyle = g;
  c2.fillRect(0, 0, W, H);

  // 地砖
  for (let i = 0; i < 11; i++) R2(i * 44, 122, 43, 28, i % 2 ? '#111a29' : '#0b111c');
  R2(0, 122, W, 1, A.trim);
  c2.globalAlpha = 1;

  // 左侧橱窗：看得到外面的街
  R2(10, 16, 118, 88, '#060d17');
  R2(13, 19, 112, 82, '#0a1728');
  const neon = ['#22e0ff', '#ff3ea5', '#ffcf4d', '#5dff9b', '#7a4bff'];
  for (let i = 0; i < 6; i++) {
    c2.globalAlpha = 0.55;
    R2(18 + i * 18, 34 + ((i * 7) % 40), 9, 3, neon[i % 5]);
    R2(20 + i * 17, 58 + ((i * 11) % 30), 5, 14, neon[(i + 2) % 5]);
  }
  c2.globalAlpha = 1;
  R2(10, 16, 118, 3, '#2b3a56');
  R2(10, 101, 118, 3, '#2b3a56');
  R2(10, 16, 3, 88, '#2b3a56');
  R2(125, 16, 3, 88, '#2b3a56');
  R2(67, 16, 2, 88, '#22304a');

  // 天花板灯条
  for (let i = 0; i < 3; i++) {
    R2(150 + i * 56, 8, 40, 3, '#e8f6ff');
    c2.globalAlpha = 0.12;
    R2(146 + i * 56, 11, 48, 26, '#9fe8ff');
    c2.globalAlpha = 1;
  }

  // 货架
  R2(140, 44, 168, 3, A.trim);
  R2(140, 78, 168, 3, A.trim);
  R2(140, 112, 168, 3, A.trim);
  for (let i = 0; i < 3; i++) {
    // 下层杂物
    for (let k = 0; k < 8; k++) {
      const col = ['#ff5ad9', '#5dff9b', '#ffcf4d', '#22e0ff', '#ff8a3d'][(i + k) % 5];
      R2(146 + k * 20, 95 + (k % 2) * 3, 12, 14 - (k % 2) * 3, col);
      c2.globalAlpha = 0.5;
      R2(146 + k * 20, 95 + (k % 2) * 3, 12, 3, '#ffffff');
      c2.globalAlpha = 1;
    }
  }
  // 中层：这家店真正的货
  if (shop) {
    shop.items.forEach((it, i) => {
      const bx = 150 + i * 54;
      R2(bx, 52, 40, 24, '#0c1420');
      R2(bx + 2, 54, 36, 20, A.bg);
      c2.globalAlpha = 0.85;
      R2(bx + 2, 54, 36, 4, '#ffffff');
      c2.globalAlpha = 1;
      c2.font = 'bold 10px "Microsoft YaHei",monospace';
      c2.textAlign = 'center';
      c2.fillStyle = A.fg;
      c2.fillText(it.name.slice(0, 4), bx + 20, 69);
      c2.textAlign = 'left';
      // 价签
      R2(bx + 8, 78, 24, 10, '#0b101c');
      c2.font = 'bold 9px "Microsoft YaHei",monospace';
      c2.textAlign = 'center';
      c2.fillStyle = '#ffb02e';
      c2.fillText('◎' + it.price, bx + 20, 86);
      c2.textAlign = 'left';
      // 价签挂线
      R2(bx + 19, 74, 1, 4, '#2b3a56');
    });
  }

  // 柜台
  R2(310, 94, 164, 30, '#101a2b');
  R2(310, 94, 164, 4, A.trim);
  R2(312, 98, 160, 10, '#16223a');
  R2(310, 122, 164, 6, '#0a1220');
  R2(310, 121, 164, 1, '#000000');
  // 柜台上的东西
  R2(322, 84, 16, 10, '#1c2438');
  R2(324, 79, 12, 6, '#2ad0ff');
  R2(346, 87, 9, 7, '#ffcf4d');
  R2(452, 80, 14, 14, '#0c1420');
  R2(454, 82, 10, 10, A.trim);
  // 吊灯
  R2(392, 0, 2, 12, '#2b3a56');
  R2(384, 12, 18, 4, '#3d5373');
  R2(386, 16, 14, 3, '#ffe6b8');
  c2.globalAlpha = 0.12;
  R2(376, 19, 34, 40, '#ffe6b8');
  c2.globalAlpha = 1;

  // 店长（站在柜台后）
  const kx = 420, ky = 48;
  R2(kx - 12, ky + 26, 24, 34, '#1b2740');
  R2(kx - 12, ky + 26, 24, 3, A.trim);
  R2(kx - 12, ky + 40, 24, 2, '#0f1728');
  R2(kx - 8, ky + 6, 16, 20, '#d8a98a');
  R2(kx - 9, ky + 3, 18, 7, '#151b2a');
  R2(kx - 9, ky + 9, 4, 12, '#151b2a');
  R2(kx + 5, ky + 9, 4, 12, '#151b2a');
  R2(kx - 5, ky + 14, 3, 3, '#0c1220');
  R2(kx + 3, ky + 14, 3, 3, '#0c1220');
  R2(kx - 4, ky + 20, 8, 2, '#8a5a4a');
  R2(kx + 12, ky + 28, 7, 18, '#1b2740');
  R2(kx + 15, ky + 44, 8, 5, '#d8a98a');

  // 墙上招牌
  R2(322, 20, 148, 18, '#070c16');
  R2(322, 20, 148, 2, A.trim);
  c2.font = 'bold 12px "Microsoft YaHei",monospace';
  c2.textAlign = 'center';
  c2.fillStyle = A.bg;
  c2.fillText(A.sign, 396, 34);
  c2.textAlign = 'left';

  // 地板反光
  c2.globalAlpha = 0.12;
  R2(10, 126, 118, 10, '#9fe8ff');
  R2(318, 126, 156, 8, A.trim);
  c2.globalAlpha = 1;
}
