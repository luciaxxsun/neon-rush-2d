'use strict';
/* =========================================================================
   99 probe — 自动化验证（只在 #probe / #shot 时生效，正常游玩不影响）
   ========================================================================= */

(function () {
  const hash = location.hash.replace('#', '');
  if (!hash) return;
  const params = new URLSearchParams(hash);
  if (!params.has('probe') && !params.has('shot')) return;

  function api() {
    window.__NR = {
      P, G, input, CAM,
      get SC() { return SC; },
      loadScene, gotoScene, openShop, closeShop, buyItem, tryUse,
      tp(x, y) { P.x = x; P.y = y; P.vx = 0; P.vy = 0; },
      step(n) { for (let i = 0; i < n; i++) updatePlay(1 / 60); },
      snapCam() { updateCamera(0, true); }
    };
    return window.__NR;
  }

  function playMode() {
    if (!ui.title) uiInit();
    G.started = true;
    G.paused = false;
    ui.title.classList.remove('on');
    if (G.shopOpen) closeShop();
  }

  function runProbe() {
    const NR = api();
    const R = {};
    const cnt = k => SC.spots.filter(s => s.kind === k).length;

    loadScene('spawn');
    R.spawnShops = cnt('shop');
    R.spawnBuildings = SC.buildings.length;
    R.spawnPortal = cnt('hub5');
    R.spawnIslandW = SC.platforms[0].w;

    loadScene('hub5');
    R.hubPortals = cnt('world');
    R.hubReturn = cnt('spawn');
    R.hubBuildings = SC.buildings.length;

    // 每个世界的挑战门数量（应 5~10）
    R.worlds = [];
    let totalChal = 0;
    for (let i = 0; i < 5; i++) {
      loadScene('world', i);
      const n = cnt('challenge');
      totalChal += n;
      R.worlds.push({ i, chal: n, shops: cnt('shop'), bld: SC.buildings.length });
      if (!SC.platforms.length) R['w' + i + 'Fail'] = true;
    }
    R.totalChallenges = totalChal;

    // 挑战关卡
    loadScene('challenge', 0, 0);
    R.chalPlatforms = SC.platforms.length;
    R.chalCoins = SC.coins.length;
    R.chalBeacons = SC.beacons.length;
    R.chalExit = cnt('world');
    R.chalTitle = SC.title;

    // 跳跃高度
    loadScene('challenge', 0, 0);
    NR.tp(SC.platforms[0].x + 60, SC.platforms[0].y - P.h);
    P.onGround = true; P.jumps = 0; P.vy = 0;
    NR.step(2);
    const y0 = P.y;
    input.jp = 1; input.jh = 1;
    let apex = 0;
    for (let i = 0; i < 70; i++) { updatePlay(1 / 60); apex = Math.min(apex, P.y - y0); }
    input.jh = 0;
    R.jumpApex = Math.round(-apex);

    // 跑动
    loadScene('challenge', 0, 0);
    const x0 = P.x;
    input.r = 1;
    for (let i = 0; i < 60; i++) updatePlay(1 / 60);
    input.r = 0;
    R.runDist = Math.round(P.x - x0);

    // 金币
    loadScene('challenge', 0, 0);
    G.coins = 0;
    const c0 = SC.coins[0];
    NR.tp(c0.x - 6, c0.y - 9);
    NR.step(2);
    R.coinGain = G.coins;

    // 任务点：每个 +5，全清 +15，芯片无上限
    G.chips = 0;
    for (const b of SC.beacons.slice()) {
      NR.tp(b.x - 6, b.y - 24);
      NR.step(3);
    }
    R.beaconsDone = SC.beacons.every(b => b.done);
    R.chipsAfterOneChal = G.chips;
    R.chalCleared = challengeCleared(0, 0);
    // 再刷一遍，验证可以超过 20
    loadScene('challenge', 0, 1);
    for (const b of SC.beacons.slice()) {
      NR.tp(b.x - 6, b.y - 24);
      NR.step(3);
    }
    R.chipsAfterTwo = G.chips;
    R.chipsNoCap = G.chips > 20;

    // 掉落：挑战 → 回世界岛
    const before = G.scene;
    P.y = SC.killY + 60;
    NR.step(3);
    R.fellFrom = before;
    R.fellTo = G.scene;
    R.fellToWorld = G.world;

    // 掉落：世界岛 → 同一座岛
    loadScene('world', 3);
    const spawnX = P.x;
    NR.tp(P.x + 400, 240);
    P.y = SC.killY + 60;
    NR.step(3);
    R.worldFallScene = G.scene;
    R.worldFallWorld = G.world;
    R.worldFallHome = Math.abs(P.x - spawnX) < 4;

    // 掉落：出生空岛 → 出生空岛
    loadScene('spawn');
    const sx = P.x;
    P.y = SC.killY + 60;
    NR.step(3);
    R.spawnFallScene = G.scene;
    R.spawnFallHome = Math.abs(P.x - sx) < 4;

    // 空岛 → 中枢 → 世界岛 → 挑战 → 回世界岛
    loadScene('spawn');
    let sp = SC.spots.find(s => s.kind === 'hub5');
    NR.tp(sp.x - 6, sp.y - 24);
    NR.step(2);
    R.nearPortal = !!nearSpot;
    tryUse();
    R.afterPortal = G.scene;
    sp = SC.spots.find(s => s.kind === 'world' && s.i === 2);
    NR.tp(sp.x - 6, sp.y - 24);
    NR.step(2);
    tryUse();
    R.afterWorld = G.scene;
    R.worldIdx = G.world;
    sp = SC.spots.find(s => s.kind === 'challenge');
    NR.tp(sp.x - 6, sp.y - 24);
    NR.step(2);
    R.nearChal = nearSpot ? nearSpot.label : null;
    tryUse();
    R.afterChal = G.scene;
    R.chalIdx = G.chal;

    // 商店
    loadScene('spawn');
    G.coins = 900;
    openShop('cyber');
    R.shopOpen = !!G.shopOpen;
    buyItem(SHOPS.find(s => s.id === 'cyber'), 'dj');
    R.bought = G.up.dj;
    R.coinsLeft = G.coins;
    closeShop();
    R.shopClosed = !G.shopOpen;

    // 新店铺能不能开
    const opened = [];
    for (const s of SHOPS) { openShop(s.id); if (G.shopOpen === s.id) opened.push(s.id); closeShop(); }
    R.shopsOk = opened.length;

    // 二段跳
    loadScene('challenge', 0, 0);
    NR.step(3);
    P.y = 200; P.vy = 0; P.onGround = true; P.jumps = 0;
    input.jp = 1; input.jh = 1;
    for (let i = 0; i < 20; i++) updatePlay(1 / 60);
    const v1 = P.vy;
    input.jp = 1;
    for (let i = 0; i < 8; i++) updatePlay(1 / 60);
    R.doubleJump = P.vy < v1;

    // 双层地形
    loadScene('spawn');
    R.terraces = SC.platforms.filter(p => p.terrace).length;
    R.steps = SC.platforms.filter(p => p.step).length;
    R.upBuildings = SC.buildings.filter(b => b.lvl).length;
    R.upShops = SC.spots.filter(s => s.lvl && s.kind === 'shop').length;
    const t0 = SC.platforms.find(p => p.terrace);
    if (t0) {
      NR.tp(t0.x + 40, t0.y + 30);
      P.vy = -520; P.onGround = false; P.jumps = 0;
      let land = false;
      for (let i = 0; i < 80; i++) { updatePlay(1 / 60); if (P.onGround) { land = true; break; } }
      R.terraceJumpThrough = land && Math.abs((P.y + P.h) - t0.y) < 3;
      R.terraceY = t0.y;
      // 站在步道上不掉下去
      NR.step(30);
      R.standOnTerrace = P.onGround && Math.abs((P.y + P.h) - t0.y) < 3;
    }

    R.hudPills = document.querySelectorAll('#topbar .pill').length;
    R.hudTimer = !!document.getElementById('timer');
    R.chipsText = document.getElementById('chips').textContent;

    // 限时效果 + 穿过柜台 + 商品数量
    loadScene('spawn');
    enterShop('store');
    R.roomW = SC.roomW;
    R.items = SHOPS.find(s => s.id === 'store').items.length;
    G.buffs = []; G.coins = 999; G.owned = {}; G.up.spd = 0;
    const shopS = SHOPS.find(s => s.id === 'store');
    buyItem(shopS, 'drink');
    R.buffCount = (G.buffs || []).length;
    R.buffSpd = G.up.spd;
    R.buffT = Math.round(G.buffs[0].t);
    G.buffs[0].t = 10;
    buyItem(shopS, 'drink');
    R.buffRefresh = Math.round(G.buffs[0].t);
    for (let i = 0; i < 70; i++) updateBuffs(1);
    R.buffExpired = (G.buffs || []).length;
    R.spdAfterExpire = G.up.spd;
    R.permItemPrice = SHOPS.find(s => s.id === 'cyber').items[0].price;
    const cxs = SC.counter.x + 70;
    NR.tp(cxs, 300 - P.h);
    NR.step(4);
    R.pastCounterX = Math.round(P.x);
    R.canPassCounter = Math.abs(P.x - cxs) < 6;
    exitShop();

    // 音效
    R.sfxGroups = (typeof SFX_DATA !== 'undefined') ? Object.keys(SFX_DATA).length : 0;
    R.sfxList = (typeof SFX_DATA !== 'undefined') ? Object.keys(SFX_DATA).map(k => k + 'x' + SFX_DATA[k].length).join(',') : 'none';
    R.sfxKb = (typeof SFX_DATA !== 'undefined') ? Math.round(Object.keys(SFX_DATA).reduce((s, k) => s + SFX_DATA[k].join('').length, 0) / 1024) : 0;
    R.sfxApi = ['coin', 'jump', 'land', 'task', 'door', 'fall', 'buy', 'portal', 'chip', 'select'].filter(k => typeof SFX[k] === 'function').length;
    R.bgmKb = (typeof BGM_DATA !== 'undefined') ? Math.round(BGM_DATA.length / 1024) : 0;
    R.bgmApi = ['bgmToggle', 'bgmStart', 'isBgmOn'].filter(k => typeof SFX[k] === 'function').length;
    R.bgmBtn = !!document.getElementById('bgmBtn');

    // 全屏
    R.fsBtn = !!document.getElementById('fsBtn');
    R.fsBox = (() => {
      const b = document.getElementById('fsBtn');
      if (!b) return 'none';
      const chain = [];
      let el = b;
      while (el && el.id !== 'stage' && chain.length < 6) {
        const r0 = el.getBoundingClientRect();
        chain.push((el.id || el.tagName) + '(' + Math.round(r0.left) + ',' + Math.round(r0.top) + ',' + Math.round(r0.width) + ',' + Math.round(r0.height) + ')');
        el = el.parentElement;
      }
      if (el) { const r2 = el.getBoundingClientRect(); chain.push('stage(' + Math.round(r2.left) + ',' + Math.round(r2.top) + ',' + Math.round(r2.width) + ',' + Math.round(r2.height) + ')'); }
      return chain.join(' < ');
    })();
    R.uiScaled = getComputedStyle(document.getElementById('hud')).transform !== 'none';
    R.stageScale = document.getElementById('stage').style.getPropertyValue('--s') || '(unset)';
    R.furnKinds = Object.keys(FURN).map(k => k + ':' + FURN[k].length).join(',');

    // 室内场景（10 家店全都要能走进去）
    R.insideShops = [];
    R.renderOk = 0; R.renderErr = '';
    for (const sh of SHOPS) {
      loadScene('spawn');
      enterShop(sh.id);
      try { renderInside(SC, 0.4); R.renderOk++; } catch (e) { R.renderErr = R.renderErr || (sh.id + ':' + e.message); }
      R.insideShops.push(SC.kind + ':' + sh.id + ':' + SC.stands.length + '/' + sh.items.length + ':' + Math.round(SC.roomW) + ':' + ((FURN[sh.id] || []).length));
      exitShop();
    }
    R.insideCount = R.insideShops.filter(s => s.indexOf('inside:') === 0).length;
    R.insideStandsOk = R.insideShops.every(s => {
      const p = s.split(':');
      const q = p[2].split('/');
      return q[0] === q[1];
    });

    // 进门 → 走动 → 撞墙 → 展台买 → 柜台面板 → 出门
    loadScene('spawn');
    const doorShop = SC.spots.find(s => s.kind === 'shop');
    NR.tp(doorShop.x, 250 - P.h);
    NR.step(2);
    R.doorNear = nearSpot ? nearSpot.kind : null;
    enterShop(doorShop.id);
    R.insideKind = SC.kind;
    R.insideSpots = SC.spots.map(s => s.kind).join(',');
    R.insideSpawnX = Math.round(P.x);
    NR.step(20);
    R.insideGround = P.onGround;
    input.r = 1; NR.step(400); input.r = 0;
    R.insideRightX = Math.round(P.x);
    R.insideRightOk = P.x + P.w <= SC.roomW + 1;
    R.pastCounter = P.x + P.w > SC.counter.x + 8;
    input.l = 1; NR.step(200); input.l = 0;
    R.insideLeftX = Math.round(P.x);
    R.insideLeftOk = P.x >= -1;

    G.coins = 500; G.owned = {};
    const st = SC.spots.find(s => s.kind === 'buyStand');
    NR.tp(st.x, 300 - P.h); NR.step(2);
    R.nearStand = nearSpot ? nearSpot.kind : null;
    const itemId = SC.stands[st.i].item.id;
    tryUse();
    R.standBuy = (G.owned[itemId] || 0) === 1;

    const dk = SC.spots.find(s => s.kind === 'buyDesk');
    NR.tp(dk.x, 300 - P.h); NR.step(2);
    R.nearDesk = nearSpot ? nearSpot.kind : null;
    tryUse();
    R.deskPanel = !!G.shopOpen;
    R.deskRows = document.querySelectorAll('#shopList .buy').length;
    const buyBtn = document.querySelector('#shopList .buy:not([disabled])');
    const coinBefore = G.coins;
    if (buyBtn) buyBtn.click();
    R.panelBuy = buyBtn ? G.coins < coinBefore : false;
    closeShop();
    R.afterPanelKind = SC.kind;

    const lv = SC.spots.find(s => s.kind === 'leave');
    NR.tp(lv.x, 300 - P.h); NR.step(2);
    R.nearLeave = nearSpot ? nearSpot.kind : null;
    tryUse();
    R.backKind = SC.kind;
    R.backAtDoor = Math.abs(P.x - doorShop.x) < 40;

    // 世界岛上的店：进出要回到那个世界
    loadScene('world', 2);
    const wShop = SC.spots.find(s => s.kind === 'shop');
    NR.tp(wShop.x, 250 - P.h); NR.step(2);
    enterShop(wShop.id);
    exitShop();
    R.worldShopBack = SC.kind + '#' + G.world;
    R.worldShopX = Math.round(P.x - wShop.x);

    // 电梯不能跟着玩家跳（旧 bug：P.y < 200 就把轿厢画到上层）
    loadScene('spawn');
    const lfJ = SC.spots.find(s => s.kind === 'lift' && !s.lvl);
    NR.tp(lfJ.x, 232);
    NR.step(8);
    render(0.016, 1.0);
    const carY0 = lfJ.carY;
    R.liftCarStart = !!lfJ.car;
    input.jp = 1; input.jh = 1;
    NR.step(3);
    input.jp = 0;
    NR.step(14);
    render(0.016, 1.0);
    R.jumpFeetY = Math.round(P.y + P.h);
    R.jumpAirborne = (P.y + P.h) < 220;
    R.liftCarDuringJump = !!lfJ.car;
    R.liftCarYStart = Math.round(carY0);
    R.liftCarYDuringJump = Math.round(lfJ.carY);
    R.liftCarStays = Math.abs(lfJ.carY - carY0) < 2;
    input.jh = 0;
    NR.step(40);
    // 上到二层后轿厢才应该在上面
    const lfUp = SC.spots.find(s => s.kind === 'lift' && s.lvl);
    NR.tp(lfUp.x, 150 - P.h); NR.step(2);
    tryUse();
    gotoFloor(SC.floors[1]);
    NR.step(4);
    R.liftCarAt2F = !!lfJ.car;

    // 电梯
    loadScene('spawn');
    R.liftSpots = SC.spots.filter(s => s.kind === 'lift').length;
    R.floors = SC.floors.length;
    const lf = SC.spots.find(s => s.kind === 'lift' && !s.lvl);
    NR.tp(lf.x, 250 - P.h);
    NR.step(2);
    R.nearLift = nearSpot ? nearSpot.kind : null;
    tryUse();
    R.liftOpen = !!G.liftOpen;
    R.liftBtns = document.querySelectorAll('#liftBtns .fbtn').length;
    gotoFloor(SC.floors[1]);
    NR.step(12);
    R.afterFloor2 = Math.round(P.y + P.h);
    R.standUpstairs = Math.abs((P.y + P.h) - 150) < 3;
    const lf2 = SC.spots.find(s => s.kind === 'lift' && s.lvl);
    NR.tp(lf2.x, 150 - P.h);
    NR.step(2);
    R.nearLiftUp = nearSpot ? nearSpot.kind : null;
    tryUse();
    R.liftOpenUp = !!G.liftOpen;
    gotoFloor(SC.floors[0]);
    NR.step(12);
    R.afterFloor1 = Math.round(P.y + P.h);

    // 店内景
    G.coins = 300;
    openShop('cafe');
    const art = document.getElementById('shopArt');
    let nz = 0;
    if (art) {
      const d = art.getContext('2d').getImageData(0, 0, art.width, art.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i]) nz++;
    }
    R.shopArtPixels = nz;
    closeShop();

    document.title = 'PROBE ' + JSON.stringify(R);
  }

  function runShot() {
    const NR = api();
    playMode();
    const s = params.get('shot');
    const W = (x, y) => { NR.tp(x, y); };
    if (s === 'sfxwalk') {
      // 模拟走 10 秒（每 1.25 秒跳一次），统计每种音效被调用多少次
      const S = {};
      loadScene('spawn');
      NR.tp(560, 220);
      const K = (t, c) => window.dispatchEvent(new KeyboardEvent(t, { code: c }));
      K('keydown', 'KeyD');
      for (let i = 0; i < 40; i++) {
        if (i % 5 === 0) { K('keydown', 'Space'); NR.step(2); K('keyup', 'Space'); }
        NR.step(15);
      }
      K('keyup', 'KeyD');
      S.walkX = Math.round(P.x);
      S.sfxStats = (typeof SFX.stats === 'function') ? SFX.stats() : 'no-stats';
      document.title = 'PROBE ' + JSON.stringify(S);
      return;
    }
    if (s === 'spawn') {
      loadScene('spawn'); W(560, 220);
    } else if (s === 'spawn2') {
      loadScene('spawn');
      const shop = SC.spots.filter(v => v.kind === 'shop')[6];
      W(shop.x - 70, 220);
    } else if (s === 'up') {
      loadScene('spawn');
      const t0 = SC.platforms.find(p => p.terrace);
      W(t0.x + 110, t0.y - 24);
    } else if (s === 'lift') {
      loadScene('spawn');
      const lf = SC.spots.find(v => v.kind === 'lift' && !v.lvl);
      W(lf.x + 30, 232);
      openLift(lf);
    } else if (s === 'insfurn' || s === 'insramen') {
      loadScene('spawn');
      enterShop(s === 'insfurn' ? 'store' : 'ramen');
      NR.tp(358, 300 - P.h);
      NR.step(20);
      NR.snapCam();
    } else if (s && s.indexOf('inshop') === 0) {
      const ids = ['store', 'cloth', 'ramen', 'arcade', 'cyber'];
      const idx = Math.min(4, Math.max(0, parseInt(s.slice(6) || '0', 10) || 0));
      loadScene('spawn');
      enterShop(ids[idx]);
      NR.tp(560, 300 - P.h);
      NR.step(24);
      NR.snapCam();
    } else if (s === 'liftjump') {
      loadScene('spawn');
      const lfJ = SC.spots.find(v => v.kind === 'lift' && !v.lvl);
      NR.tp(lfJ.x, 232);
      NR.step(8);
      input.jp = 1; input.jh = 1;
      NR.step(3);
      input.jp = 0;
      NR.step(12);
      NR.snapCam();
      G.paused = true;
    } else if (s === 'inscounter') {
      loadScene('spawn');
      enterShop('store');
      NR.tp(SC.counter.x + 70, 300 - P.h);
      NR.step(20);
      NR.snapCam();
    } else if (s === 'insbuff') {
      loadScene('spawn');
      enterShop('store');
      G.coins = 999; G.buffs = []; G.owned = {}; G.up.spd = 0;
      const sh = SHOPS.find(v => v.id === 'store');
      buyItem(sh, 'drink');
      buyItem(sh, 'torch');
      NR.tp(760, 300 - P.h);
      NR.step(24);
      NR.snapCam();
    } else if (s === 'insdesk') {
      loadScene('spawn');
      enterShop('store');
      NR.tp(600, 300 - P.h);
      NR.step(24);
      NR.snapCam();
      openShop('store');
    } else if (s === 'hub') {
      loadScene('hub5'); W(380, 220);
    } else if (s === 'world') {
      loadScene('world', 0);
      const p = SC.spots.filter(v => v.kind === 'challenge')[1];
      W(p.x - 90, 220);
    } else if (s === 'worldwide') {
      loadScene('world', 3);
      const p = SC.spots.filter(v => v.kind === 'challenge')[0];
      W(p.x - 40, 220);
    } else if (/^w[1-5]$/.test(s)) {
      const i = parseInt(s.slice(1), 10) - 1;
      loadScene('world', i);
      const p = SC.spots.filter(v => v.kind === 'challenge')[0];
      W(p.x - 60, 220);
    } else if (s === 'chal') {
      loadScene('challenge', 0, 0);
      const p = SC.platforms[6];
      W(p.x + 18, p.y - 24);
    } else if (s === 'shop') {
      loadScene('spawn'); W(250, 220);
      openShop('ramen');
    } else if (s === 'shopitems') {
      loadScene('spawn'); W(130, 220);
      openShop('arcade');
    } else if (s === 'shopcafe') {
      loadScene('spawn');
      const sp2 = SC.spots.find(v => v.id === 'cafe');
      W(sp2.x - 40, 220);
    }
    NR.snapCam();
  }

  function go() {
    if (params.has('probe')) runProbe();
    else runShot();
  }

  if (document.readyState === 'complete') setTimeout(go, 40);
  else window.addEventListener('load', () => setTimeout(go, 40));
})();
