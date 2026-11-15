'use strict';
/* =========================================================================
   40 ui — HUD / 提示 / 商店 / 标题 / 暂停 / 通关
   ========================================================================= */

const ui = {};

function uiInit() {
  const $ = id => document.getElementById(id);
  ui.coins = $('coins');
  ui.chips = $('chips');
  ui.area = $('area');
  ui.prompt = $('prompt');
  ui.toast = $('toast');
  ui.title = $('title');
  ui.shop = $('shop');
  ui.shopName = $('shopName');
  ui.shopKeep = $('shopKeep');
  ui.shopLine = $('shopLine');
  ui.shopCoins = $('shopCoins');
  ui.shopList = $('shopList');
  ui.pause = $('pause');
  ui.win = $('win');
  ui.best = $('best');
  ui.timer = $('timer');
  ui.shopArt = $('shopArt');
  ui.lift = $('lift');
  ui.liftBtns = $('liftBtns');
  ui.liftSub = $('liftSub');
  updateHUD();
}

/* 限时效果条（画在画布左上角，不占用 HUD 的三个 pill） */
function drawBuffs() {
  const list = G.buffs || [];
  if (!list.length) return;
  let y = 40;
  for (const b of list) {
    const pct = clamp(b.t / b.dur, 0, 1);
    const w = 96, x = 10;
    ctx.globalAlpha = 0.7;
    r(x, y, w, 14, '#070c14');
    ctx.globalAlpha = 1;
    rl(x, y, w * pct, 14, b.t < 10 ? '#ff6b35' : '#22e0ff', 0.22);
    rl(x, y, w, 1, '#22e0ff', 0.45);
    ctx.font = 'bold 9px "Microsoft YaHei",monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d8ecff';
    ctx.fillText(b.name, x + 5, y + 7.5);
    ctx.textAlign = 'right';
    ctx.fillStyle = b.t < 10 ? '#ff9f43' : '#ffcf4d';
    ctx.fillText(Math.ceil(b.t) + 's', x + w - 5, y + 7.5);
    y += 17;
  }
  ctx.textAlign = 'left';
}

function updateHUD() {
  if (!ui.coins) return;
  ui.coins.textContent = G.coins;
  ui.chips.textContent = G.chips;
  if (ui.area) ui.area.textContent = SC ? SC.title : '出生空岛';
}

let promptTxt = '';
function showPrompt(t) {
  promptTxt = t;
  if (!ui.prompt) return;
  if (t) {
    ui.prompt.textContent = t;
    ui.prompt.classList.add('on');
  } else {
    ui.prompt.classList.remove('on');
  }
}

let toastT = 0, toastTimer = null;
function toast(msg) {
  if (!ui.toast) return;
  ui.toast.textContent = msg;
  ui.toast.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove('on'), 1900);
}

/* ---------------- 商店 ---------------- */
function openShop(id) {
  if (!ui.shopName) uiInit();
  const shop = SHOPS.find(s => s.id === id);
  if (!shop) return;
  G.shopOpen = id;
  G.owned = G.owned || {};
  ui.shopName.textContent = shop.name;
  ui.shopKeep.textContent = shop.keeper;
  ui.shopLine.textContent = '“' + shop.line + '”';
  ui.shopCoins.textContent = G.coins;
  if (ui.shopArt && typeof drawShopInterior === 'function') {
    const inside = (G.scene === 'inside');
    ui.shopArt.style.display = inside ? 'none' : '';
    if (!inside) drawShopInterior(ui.shopArt.getContext('2d'), id);
  }
  renderShopItems(shop);
  ui.shop.classList.add('on');
  showPrompt('');
  SFX.door();
}

function renderShopItems(shop) {
  ui.shopList.innerHTML = '';
  shop.items.forEach(it => {
    const own = (G.owned[it.id] || 0);
    const maxed = own >= it.max;
    const row = document.createElement('div');
    row.className = 'item' + (maxed ? ' maxed' : '');
    row.innerHTML =
      '<div class="it"><b>' + it.name + '</b>' +
      '<span>' + it.desc + (it.max > 1 && !it.dur ? '（' + own + '/' + it.max + '）' : '') + '</span></div>' +
      '<div class="ip"><span class="price">' + (maxed ? '已拥有' : '◎ ' + it.price) + '</span>' +
      '<button class="buy" data-id="' + it.id + '"' + (maxed ? ' disabled' : '') + '>' +
      (maxed ? '—' : '购买') + '</button></div>';
    ui.shopList.appendChild(row);
  });
  ui.shopList.querySelectorAll('.buy').forEach(btn => {
    btn.addEventListener('click', () => buyItem(shop, btn.dataset.id));
  });
}

function buyItem(shop, itemId) {
  const it = shop.items.find(i => i.id === itemId);
  if (!it) return;
  G.owned = G.owned || {};
  const own = G.owned[it.id] || 0;
  if (own >= it.max) return;
  if (G.coins < it.price) { toast('金币不够，差 ' + (it.price - G.coins) + ' 枚'); return; }
  G.coins -= it.price;
  G.owned[it.id] = own + 1;
  if (it.dur && it.eff) addBuff(it);
  else applyItem(it.id);
  SFX.buy();
  ui.shopCoins.textContent = G.coins;
  updateHUD();
  renderShopItems(shop);
  toast(it.dur ? ('购买 · ' + it.name + '（' + it.dur + ' 秒）') : ('永久获得 · ' + it.name));
}

/* ---------------- 限时效果 ---------------- */
function addBuff(it) {
  G.buffs = G.buffs || [];
  const ex = G.buffs.find(b => b.id === it.id);
  if (ex) { ex.t = it.dur; return; }        // 同一种只续时间，不叠加
  for (const k in it.eff) {
    const v = it.eff[k];
    if (typeof v === 'boolean') G.up[k] = v;
    else G.up[k] += v;
  }
  G.buffs.push({ id: it.id, name: it.name, dur: it.dur, t: it.dur, eff: it.eff });
}

function clearBuff(b) {
  for (const k in b.eff) {
    const v = b.eff[k];
    if (typeof v === 'boolean') G.up[k] = false;
    else G.up[k] = Math.max(0, G.up[k] - v);
  }
}

function updateBuffs(dt) {
  if (!G.buffs || !G.buffs.length) return;
  for (const b of G.buffs) {
    b.t -= dt;
    if (b.t <= 0) {
      clearBuff(b);
      b.dead = true;
      toast('效果结束 · ' + b.name);
    }
  }
  G.buffs = G.buffs.filter(b => !b.dead);
}

function applyItem(id) {
  switch (id) {
    case 'drink': G.up.spd += 1; break;
    case 'batt': break;                     // 由 G.owned.batt 判定
    case 'dj': G.up.dj = true; break;
    case 'leg': G.up.jmp += 1; break;
    case 'ramen': G.up.spd += 0.7; break;
    case 'dash': G.up.dash = true; break;
    case 'coat0': G.up.coat = 0; break;
    case 'coat1': G.up.coat = 1; break;
    case 'coat2': G.up.coat = 2; break;
    case 'dry': G.up.coat = 3; break;
    case 'detect': G.up.detect = true; break;
    case 'coffee': G.up.spd += 1; break;
    case 'espresso': G.up.jmp += 1; break;
    case 'clover': G.up.coinBonus = 1; break;
    case 'boots': G.up.boots = true; break;
    case 'grip': G.up.grip = true; break;
    case 'badge': G.up.chipBonus = 2; break;
  }
}

function closeShop() {
  if (!G.shopOpen) return;
  G.shopOpen = null;
  ui.shop.classList.remove('on');
  SFX.door();
}

/* ---------------- 电梯 ---------------- */
function liftCarSpot(spot) {
  if (!SC || !SC.spots || !spot) return null;
  for (const v of SC.spots) {
    if (v.kind === 'lift' && !v.lvl && Math.abs(v.x - spot.x) < 8) return v;
  }
  return null;
}

function openLift(spot) {
  if (!ui.liftBtns) uiInit();
  G.liftOpen = spot;
  const floors = (SC && SC.floors) ? SC.floors : [{ y: 250, name: '1F' }];
  const here = spot.y;
  // 轿厢开到玩家这一层
  const carSpot = liftCarSpot(spot);
  if (carSpot) carSpot.car = here < 200;
  ui.liftSub.textContent = SC ? SC.title : '';
  ui.liftBtns.innerHTML = '';
  floors.forEach((f, i) => {
    const b = document.createElement('button');
    b.className = 'fbtn' + (Math.abs(f.y - here) < 6 ? ' now' : '');
    b.innerHTML = '<b>' + (i + 1) + '</b>' + f.name;
    b.addEventListener('click', () => gotoFloor(f));
    ui.liftBtns.appendChild(b);
  });
  ui.lift.classList.add('on');
  showPrompt('');
  SFX.door();
}

function closeLift() {
  if (!G.liftOpen) return;
  G.liftOpen = null;
  if (ui.lift) ui.lift.classList.remove('on');
  SFX.door();
}

function gotoFloor(f) {
  const spot = G.liftOpen;
  closeLift();
  if (!spot) return;
  // 轿厢停在目标层
  const carSpot = liftCarSpot(spot);
  if (carSpot) carSpot.car = f.y < 200;
  G.fade = 1;
  P.x = spot.x + 20;
  P.y = f.y - P.h;
  P.vx = 0; P.vy = 0; P.onGround = true; P.jumps = 0; P.coyote = 0;
  CAM.x = clamp(P.x - VIEW.w * 0.35, SC.b.x0, SC.b.x1 - VIEW.w);
  CAM.y = clamp(P.y - VIEW.h * 0.55, SC.b.y0, SC.b.y1);
  toast('电梯 · ' + f.name);
  if (typeof scanInteract === 'function') scanInteract();
}

/* ---------------- 标题 / 暂停 / 通关 ---------------- */
function startGame() {
  G.started = true;
  G.liftOpen = null;
  ui.title.classList.remove('on');
  SFX.resume();
  loadScene('spawn');
  toast('往左走是店，往右走也是店，中间是传送门');
}

function togglePause() {
  if (!G.started || G.won) return;
  G.paused = !G.paused;
  ui.pause.classList.toggle('on', G.paused);
}

function showWin() {
  const s = Math.floor(G.time);
  ui.best.innerHTML =
    '芯片 <b>' + G.chips + '/' + G.chipsTotal + '</b>　金币 <b>' + G.coins + '</b>　用时 <b>' +
    Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + '</b>　掉落 <b>' + G.falls + '</b> 次';
  ui.win.classList.add('on');
  ui.pause.classList.remove('on');
  G.paused = true;
}

/* ---------------- 绑定 ---------------- */
function uiBind() {
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('shopClose').addEventListener('click', closeShop);
  document.getElementById('liftClose').addEventListener('click', closeLift);
  document.getElementById('resumeBtn').addEventListener('click', togglePause);
  document.getElementById('againBtn').addEventListener('click', () => location.reload());
  const mb = document.getElementById('muteBtn');
  mb.addEventListener('click', () => {
    const m = !SFX.isMuted();
    SFX.mute(m);
    mb.textContent = m ? '静音' : '音效';
    mb.classList.toggle('off', m);
  });

  addEventListener('nr-esc', () => {
    if (G.shopOpen) closeShop();
    else if (G.liftOpen) closeLift();
    else togglePause();
  });

  // 触屏
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) {
    const pad = document.getElementById('touch');
    pad.classList.add('on');
    const hold = (el, on, off) => {
      el.addEventListener('touchstart', e => { e.preventDefault(); on(); }, { passive: false });
      el.addEventListener('touchend', e => { e.preventDefault(); off && off(); }, { passive: false });
      el.addEventListener('touchcancel', e => { e.preventDefault(); off && off(); }, { passive: false });
    };
    hold(document.getElementById('tLeft'), () => { keys.tl = 1; syncTouch(); }, () => { keys.tl = 0; syncTouch(); });
    hold(document.getElementById('tRight'), () => { keys.tr = 1; syncTouch(); }, () => { keys.tr = 0; syncTouch(); });
    hold(document.getElementById('tJump'), () => { input.jp = 1; input.jh = 1; }, () => { input.jh = 0; });
    hold(document.getElementById('tUse'), () => { input.e = 1; });
  }
}

function syncTouch() {
  input.l = (keys.KeyA || keys.ArrowLeft || keys.tl) ? 1 : 0;
  input.r = (keys.KeyD || keys.ArrowRight || keys.tr) ? 1 : 0;
}
