'use strict';
/* =========================================================================
   90 boot — 渲染与主循环
   ========================================================================= */

function drawPlatform(p, pal) {
  r(p.x, p.y, p.w, 6, pal.top);
  r(p.x, p.y, p.w, 2, pal.edge);
  rl(p.x, p.y + 6, p.w, 3, pal.edge, 0.16);
  r(p.x, p.y + 6, p.w, Math.max(2, p.h - 6), pal.isl);
  // 侧面高光 / 底部暗边
  rl(p.x, p.y + 5, 1, p.h - 5, '#ffffff', 0.06);
  r(p.x + 2, p.y + p.h - 2, p.w - 4, 2, '#00000066');
  // 边缘颗粒
  const rng = mulberry32(Math.floor(p.x) + 11);
  for (let i = 0; i < Math.min(10, p.w / 10); i++) {
    rl(p.x + rng() * p.w, p.y + 2, 2, 1, '#ffffff', 0.12);
  }
}

function drawSpot(s, sc, t) {
  if (s.kind === 'shop') drawShop(s.id, s.x, s.y, t);
  else if (s.kind === 'hub5') drawPortal(s.x, s.y, '#22e0ff', t, 'HUB');
  else if (s.kind === 'spawn') drawPortal(s.x, s.y, '#ff3ea5', t, 'HOME');
  else if (s.kind === 'exit') drawPortal(s.x, s.y, '#ffcf4d', t, 'EXIT');
  else if (s.kind === 'challenge') {
    drawPortal(s.x, s.y, sc.pal.edge, t, String(s.c + 1));
    if (challengeCleared(s.i, s.c)) signText('✓', s.x, s.y - 70, '#5dff9b', 10, false);
  } else if (s.kind === 'world') {
    drawPortal(s.x, s.y, sc.pal.edge, t, String(s.i + 1));
    if (worldDone(s.i)) signText('✓', s.x, s.y - 66, '#5dff9b', 10, false);
  }
}

function drawBackground(scene, t) {
  const pal = scene.pal;
  gradientSky(pal.sky);
  stars(CAM.x, 991, t);

  // 地平线霓虹辉光（衬出楼群剪影）
  const hg = ctx.createLinearGradient(0, VIEW.h * 0.42, 0, VIEW.h * 0.9);
  hg.addColorStop(0, 'rgba(0,0,0,0)');
  hg.addColorStop(0.55, pal.edge + '22');
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  // 三层视差城市（空岛场景不画近景，免得楼压在岛下面）
  drawCityLayers(scene.bg === 'islands');

  // 城市场景在城市层上加一层压暗，让前景平台更好认
  if (scene.bg === 'city') {
    const vg2 = ctx.createLinearGradient(0, 110, 0, VIEW.h);
    vg2.addColorStop(0, 'rgba(4,6,12,0)');
    vg2.addColorStop(1, 'rgba(4,6,12,.3)');
    ctx.fillStyle = vg2;
    ctx.fillRect(0, 80, VIEW.w, VIEW.h - 80);
  }

  if (scene.bg === 'islands') {
    const rng = mulberry32(77);
    for (let i = 0; i < 6; i++) {
      const bx = (i * 260 - CAM.x * 0.16) % 1600;
      const x = bx < 0 ? bx + 1600 : bx;
      floatIsland(x - 60, 58 + rng() * 54, 70 + rng() * 50, pal.far, pal.mid);
    }
    // 岛下方的低空云
    for (let i = 0; i < 6; i++) {
      const cx2 = ((i * 300 - CAM.x * 0.2) % 1800 + 1800) % 1800 - 120;
      const cy2 = 322 + (i % 3) * 16;
      ctx.globalAlpha = 0.09;
      oval(cx2 + 80, cy2, 100, 9, '#9fd0ff');
      ctx.globalAlpha = 1;
    }
  }

  // 地平雾
  const g = ctx.createLinearGradient(0, VIEW.h * 0.55, 0, VIEW.h);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

function render(dt, t) {
  const sc = SC;
  if (!sc) return;
  if (sc.bg === 'inside') { renderInside(sc, t); return; }
  drawBackground(sc, t);

  ctx.save();
  ctx.translate(-Math.round(CAM.x), -Math.round(CAM.y));

  // 1. 岛体
  for (const p of sc.platforms) if (p.island) drawIsland(p, sc.pal, t);

  // 2. 连排背街楼（一条连续街墙，把建筑之间的缝填掉）
  if (sc.backRow) ctx.drawImage(sc.backRow.cv, sc.backRow.x, sc.backRow.y);

  // 3. 上层步道的支撑柱（画在楼后面，免得柱子横穿店面）
  for (const p of sc.platforms) if (p.terrace) drawTerracePillars(p, sc.pal);

  // 4. 上层：建筑 / 店铺 / 路灯
  if (sc.buildings) for (const b of sc.buildings) {
    if (b.lvl) drawBuildingProp(b.kind, b.x, b.y, b.w, b.h, b.seed, t);
  }
  for (const s of sc.spots) if (s.lvl) drawSpot(s, sc, t);
  if (sc.decos) for (const d of sc.decos) if (d.lvl) drawDeco(d.kind, d.x, d.y, t);

  // 5. 步道板 + 栏杆
  for (const p of sc.platforms) if (p.terrace) drawTerrace(p, sc.pal, t);

  // 6. 下层：建筑 / 街边小物件 / 店铺 / 传送门
  if (sc.buildings) for (const b of sc.buildings) {
    if (!b.lvl) drawBuildingProp(b.kind, b.x, b.y, b.w, b.h, b.seed, t);
  }
  if (sc.decos) for (const d of sc.decos) if (!d.lvl) drawDeco(d.kind, d.x, d.y, t);
  for (const s of sc.spots) if (!s.lvl) drawSpot(s, sc, t);

  // 6.5 电梯 / 其它前景结构（画在店面之前，不会被挡住）
  for (const s of sc.spots) if (s.kind === 'lift' && !s.lvl) drawLift(s, t);

  // 7. 跑酷关卡的平台
  for (const p of sc.platforms) {
    if (!p.island && !p.terrace && !p.step) drawPlatform(p, sc.pal);
  }

  // 任务点
  for (const b of sc.beacons) drawBeacon(b.x, b.y, b.done, t, b.idx);

  // 金币
  for (const c of sc.coins) if (!c.got) drawCoin(c.x, c.y, t, c.ph);

  // 玩家
  drawPlayer(P, t);

  // 粒子
  if (P.dust) {
    for (const d of P.dust) rl(d.x, d.y, 2, 2, '#ffffff', clamp(d.l * 2, 0, 0.6));
  }

  ctx.restore();

  // 天气
  if (sc.weather !== 'none') drawWeather(sc.weather, t, dt);

  // 限时效果
  drawBuffs();

  // 暗角
  const vg = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.35, VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.95);
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

let lastT = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  if (!lastT) lastT = ts;
  let dt = (ts - lastT) / 1000;
  lastT = ts;
  dt = clamp(dt, 0, 0.05);

  if (G.started && !G.paused && !G.shopOpen && !G.liftOpen) {
    G.time += dt;
    updatePlay(dt);
  }
  if (G.fade > 0) G.fade = Math.max(0, G.fade - dt * 4);

  render(dt, ts / 1000);

  if (Math.floor(G.time * 10) % 3 === 0) updateHUD();
}

/* ---------------- 启动 ---------------- */
function boot() {
  fit();
  uiInit();
  uiBind();
  loadScene('spawn');
  requestAnimationFrame(loop);
}

window.addEventListener('load', boot);
