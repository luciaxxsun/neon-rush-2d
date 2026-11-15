'use strict';
/* =========================================================================
   30 play — 2D 平台物理、相机、交互、重生
   ========================================================================= */

const PH = {
  grav: 1520,
  jumpV: 432,
  accel: 1500,
  fric: 1900,
  maxFall: 620,
  airMul: 0.72
};

function maxSpeed() {
  return 152 + G.up.spd * 12 + (P.dashT > 0 ? 200 : 0);
}
function jumpPower() {
  return PH.jumpV + G.up.jmp * 30;
}

function jump(power) {
  P.vy = -(power || jumpPower());
  P.onGround = false;
  P.coyote = 0;
  P.buffer = 0;
  SFX.jump();
  for (let i = 0; i < 5; i++) {
    P.dust = P.dust || [];
    P.dust.push({ x: P.x + P.w / 2, y: P.y + P.h, vx: rnd(-40, 40), vy: rnd(-30, -5), l: 0.3 });
  }
}

function overlap(ax, ay, aw, ah, s) {
  return ax < s.x + s.w && ax + aw > s.x && ay < s.y + s.h && ay + ah > s.y;
}

function moveX(dx) {
  P.x += dx;
  for (const s of SC.platforms) {
    if (s.oneWay) continue;
    if (overlap(P.x, P.y, P.w, P.h, s)) {
      if (dx > 0) P.x = s.x - P.w;
      else if (dx < 0) P.x = s.x + s.w;
      P.vx = 0;
    }
  }
}

function moveY(dy) {
  const prevFeet = P.y + P.h;
  P.y += dy;
  P.onGround = false;
  for (const s of SC.platforms) {
    if (!overlap(P.x, P.y, P.w, P.h, s)) continue;
    if (s.oneWay) {
      // 单向平台：只能从上面落下来，可以从下面穿上去
      if (dy <= 0 || prevFeet > s.y + 2) continue;
      if (P.vy > 90) SFX.land();
      P.y = s.y - P.h;
      P.vy = 0;
      P.onGround = true;
      P.jumps = 0;
      continue;
    }
    if (overlap(P.x, P.y, P.w, P.h, s)) {
      if (dy > 0) {
        P.y = s.y - P.h;
        P.vy = 0;
        if (!P.onGround) SFX.land();
        P.onGround = true;
        P.jumps = 0;
      } else if (dy < 0) {
        P.y = s.y + s.h;
        P.vy = 0;
      }
    }
  }
}

function updatePlayer(dt) {
  const dir = input.r - input.l;

  // 水平加速 / 摩擦
  const ms = maxSpeed();
  if (dir !== 0) {
    const am = G.up.grip ? 0.92 : PH.airMul;
    P.vx += dir * PH.accel * dt * (P.onGround ? 1 : am);
    P.face = dir;
    if (P.dashT <= 0) P.vx = clamp(P.vx, -ms, ms);
  } else if (P.dashT <= 0) {
    const f = PH.fric * dt * (P.onGround ? 1 : 0.45);
    if (Math.abs(P.vx) <= f) P.vx = 0;
    else P.vx -= Math.sign(P.vx) * f;
  }

  // 冲刺
  P.dashCd = Math.max(0, P.dashCd - dt);
  if (P.dashT > 0) {
    P.dashT -= dt;
    P.vx = P.face * 340;
  } else if (input.dash && G.up.dash && P.dashCd <= 0) {
    P.dashT = 0.16;
    let cd = (G.owned && G.owned.batt ? 0.55 : 0.95);
    if (G.up.boots) cd -= 0.2;
    P.dashCd = Math.max(0.28, cd);
    P.vx = P.face * 340;
    SFX.jump();
  }
  if (input.dash) input.dash = 0;

  // 跳跃缓冲 / 土狼时间
  P.coyote = P.onGround ? 0.1 : Math.max(0, P.coyote - dt);
  P.buffer = input.jp ? 0.13 : Math.max(0, P.buffer - dt);
  if (input.jp) input.jp = 0;

  if (P.buffer > 0) {
    if (P.onGround || P.coyote > 0) {
      jump();
      P.jumps = 1;
    } else if (G.up.dj && P.jumps < 2) {
      jump(jumpPower() * 0.9);
      P.jumps = 2;
      for (let i = 0; i < 6; i++) {
        (P.dust = P.dust || []).push({
          x: P.x + P.w / 2, y: P.y + P.h * 0.8,
          vx: rnd(-60, 60), vy: rnd(-10, 40), l: 0.3
        });
      }
    }
  }

  // 松键截断（可变跳跃高度）
  if (!input.jh && P.vy < -140) P.vy = -140;

  // 重力
  P.vy = Math.min(P.vy + PH.grav * dt, PH.maxFall);

  // 位移（分子步，防穿模）
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(P.vx * dt), Math.abs(P.vy * dt)) / 8));
  for (let i = 0; i < steps; i++) {
    moveX((P.vx * dt) / steps);
    moveY((P.vy * dt) / steps);
  }

  // 动画状态
  if (!P.onGround) P.state = P.vy < 0 ? 'jump' : 'fall';
  else if (Math.abs(P.vx) > 12) P.state = 'run';
  else P.state = 'idle';
  P.anim += (P.state === 'run' ? Math.abs(P.vx) * 0.028 : 3) * dt * 6;

  // 粒子
  if (P.dust) {
    for (let i = P.dust.length - 1; i >= 0; i--) {
      const d = P.dust[i];
      d.l -= dt;
      d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 200 * dt;
      if (d.l <= 0) P.dust.splice(i, 1);
    }
  }

  // 边界
  if (P.y > SC.killY) { onFall(); return; }
}

function onFall() {
  G.falls++;
  SFX.fall();
  if (G.scene === 'inside') {
    P.x = SC.spawn.x; P.y = SC.spawn.y; P.vx = 0; P.vy = 0;
    return;
  }
  if (G.scene === 'challenge') {
    toast('掉下去了 · 回到' + WORLD_INFO[G.world].name);
    gotoScene('world', G.world);
    return;
  }
  if (G.scene === 'world') toast('掉下去了 · 回到这座岛');
  else if (G.scene === 'spawn') toast('掉下去了 · 回到出生空岛');
  else toast('掉下去了……');
  P.x = SC.spawn.x; P.y = SC.spawn.y; P.vx = 0; P.vy = 0;
}

/* ---------------- 相机 ---------------- */
function updateCamera(dt, snap) {
  const look = P.face * 26;
  const tx = P.x + P.w / 2 - VIEW.w / 2 + look;
  const ty = P.y + P.h / 2 - VIEW.h * 0.55;
  if (snap) {
    CAM.x = tx; CAM.y = ty;
  } else {
    CAM.x = lerp(CAM.x, tx, 1 - Math.exp(-7 * dt));
    CAM.y = lerp(CAM.y, ty, 1 - Math.exp(-5 * dt));
  }
  CAM.x = clamp(CAM.x, SC.b.x0, Math.max(SC.b.x0, SC.b.x1 - VIEW.w));
  CAM.y = clamp(CAM.y, SC.b.y0, Math.max(SC.b.y0, SC.b.y1 - VIEW.h * 0.4));
}

/* ---------------- 交互 ---------------- */
let nearSpot = null;

function scanInteract() {
  nearSpot = null;
  if (!SC) return;
  const cx = P.x + P.w / 2;
  const feet = P.y + P.h;
  let bd = 1e9;
  for (const s of SC.spots) {
    const dx = Math.abs(cx - s.x);
    const dy = Math.abs(feet - s.y);
    if (dx < s.r && dy < 46 && dx < bd) { bd = dx; nearSpot = s; }
  }
  if (nearSpot) {
    let label = nearSpot.label;
    if (nearSpot.kind === 'shop') label = '进店 · ' + nearSpot.label;
    else if (nearSpot.kind === 'world' || nearSpot.kind === 'challenge') label = '进入 · ' + nearSpot.label;
    else if (nearSpot.kind === 'hub5') label = '进入传送门 · 浮空中枢';
    else if (nearSpot.kind === 'lift') label = '乘电梯 · 选楼层';
    else if (nearSpot.kind === 'buyStand') label = '买 ' + nearSpot.label + ' · ◎' + nearSpot.price;
    else if (nearSpot.kind === 'buyDesk') label = '柜台 · 打开商品面板';
    else if (nearSpot.kind === 'leave') label = '出门 · 回岛上';
    else label = nearSpot.label;
    showPrompt('E  ' + label);
  } else {
    showPrompt('');
  }
}

function tryUse() {
  if (G.shopOpen || G.liftOpen) return;
  const s = nearSpot;
  if (!s) return;
  if (s.kind === 'shop') { enterShop(s.id); }
  else if (s.kind === 'leave') exitShop();
  else if (s.kind === 'buyDesk') openShop(SC.shopId);
  else if (s.kind === 'buyStand') {
    const shop = SHOPS.find(x => x.id === SC.shopId);
    if (shop && SC.stands[s.i]) buyItem(shop, SC.stands[s.i].item.id);
  }
  else if (s.kind === 'hub5') gotoScene('hub5');
  else if (s.kind === 'spawn') gotoScene('spawn');
  else if (s.kind === 'exit') gotoScene('hub5');
  else if (s.kind === 'world') { G.lastWorld = s.i; gotoScene('world', s.i); }
  else if (s.kind === 'challenge') gotoScene('challenge', s.i, s.c);
  else if (s.kind === 'lift') openLift(s);
}

/* ---------------- 任务点 ---------------- */
function updateBeacons() {
  const cx = P.x + P.w / 2;
  const feet = P.y + P.h;
  const bonus = G.up.chipBonus || 0;
  for (const b of SC.beacons) {
    if (b.done) continue;
    if (Math.abs(cx - b.x) < 24 && Math.abs(feet - b.y) < 52) {
      b.done = true;
      G.tasksDone[b.id] = true;
      G.chips += 5 + bonus;
      G.coins += 20;
      SFX.task();
      toast('任务完成 · 芯片 +' + (5 + bonus) + ' · 金币 +20');
      if (SC.beacons.every(v => v.done) && !SC.cleared) {
        SC.cleared = true;
        G.chalClear = G.chalClear || {};
        G.chalClear['w' + SC.world + 'c' + SC.chal] = true;
        G.chips += 15;
        setTimeout(() => { toast('挑战通关 · 芯片 +15'); updateHUD(); }, 700);
      }
      updateHUD();
    }
  }
}

/* ---------------- 金币 ---------------- */
function updateCoins() {
  const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
  const gain = 1 + (G.up.coinBonus || 0);
  for (const c of SC.coins) {
    if (c.got) continue;
    if (Math.abs(cx - c.x) < 12 && Math.abs(cy - c.y) < 14) {
      c.got = true;
      G.coins += gain;
      SFX.coin();
      updateHUD();
    }
  }
}

/* ---------------- 每帧 ---------------- */
function updatePlay(dt) {
  if (G.shopOpen || G.liftOpen) return;
  updateBuffs(dt);
  const sub = Math.min(dt, 1 / 30);
  updatePlayer(sub);
  if (G.scene === 'challenge') { updateBeacons(); updateCoins(); }
  else updateCoins();
  updateCamera(sub, false);
  scanInteract();
  if (input.e) { input.e = 0; tryUse(); }
}
