'use strict';
/* =========================================================================
   20 scenes — 十家小店、世界群岛、挑战关卡、场景切换
   ========================================================================= */

const SHOP_W2 = 96;

const SHOPS = [
  {
    id: 'store', name: '24H 便利店', keeper: '小七', line: '欢迎光临——夜班就我一个，随便看。',
    items: [
      { id: 'drink', name: '能量饮', desc: '60 秒 · 移动速度 +12', price: 40, max: 9, dur: 60, eff: { spd: 1 } },
      { id: 'batt', name: '备用电池', desc: '60 秒 · 冲刺冷却缩短', price: 60, max: 9, dur: 60, eff: { boots: true } },
      { id: 'bento', name: '夜宵便当', desc: '60 秒 · 起跳更高', price: 55, max: 9, dur: 60, eff: { jmp: 0.8 } },
      { id: 'torch', name: '手电筒', desc: '60 秒 · 任务点亮起光柱', price: 50, max: 9, dur: 60, eff: { detect: true } },
      { id: 'card', name: '会员卡', desc: '60 秒 · 每枚金币多收 1 枚', price: 80, max: 9, dur: 60, eff: { coinBonus: 1 } }
    ]
  },
  {
    id: 'cyber', name: '义体诊所', keeper: '阿玲', line: '腿不够快？换一副就是了，麻药另算。',
    items: [
      { id: 'dj', name: '二段跳义体', desc: '永久 · 空中还能再跳一次', price: 150, max: 1 },
      { id: 'leg', name: '强化跟腱', desc: '永久 · 起跳高度 +30', price: 70, max: 2 },
      { id: 'knee', name: '膝关节强化', desc: '90 秒 · 移动速度 +12', price: 65, max: 9, dur: 90, eff: { spd: 1 } },
      { id: 'amp', name: '肾上腺素', desc: '45 秒 · 冲刺冷却减半', price: 75, max: 9, dur: 45, eff: { boots: true } }
    ]
  },
  {
    id: 'ramen', name: '樱拉面', keeper: '老板娘', line: '跑累了？先吃碗热的再上路。',
    items: [
      { id: 'ramen', name: '赤汤拉面', desc: '60 秒 · 移动速度 +8', price: 35, max: 9, dur: 60, eff: { spd: 0.7 } },
      { id: 'gyoza', name: '煎饺', desc: '60 秒 · 起跳更高', price: 30, max: 9, dur: 60, eff: { jmp: 0.6 } },
      { id: 'tea', name: '热茶', desc: '60 秒 · 每枚金币多收 1 枚', price: 25, max: 9, dur: 60, eff: { coinBonus: 1 } },
      { id: 'bigbowl', name: '大碗加面', desc: '90 秒 · 速度 +12、起跳 +30', price: 70, max: 9, dur: 90, eff: { spd: 1, jmp: 1 } }
    ]
  },
  {
    id: 'music', name: '唱片行', keeper: 'DJ 阿飞', line: '节奏对了，脚就不累。',
    items: [
      { id: 'dash', name: '冲刺靴', desc: '永久 · 按 Shift 向前冲刺', price: 120, max: 1 },
      { id: 'tape', name: '磁带', desc: '60 秒 · 移动速度 +12', price: 40, max: 9, dur: 60, eff: { spd: 1 } },
      { id: 'mix', name: '混音台', desc: '90 秒 · 每枚金币多收 1 枚', price: 55, max: 9, dur: 90, eff: { coinBonus: 1 } },
      { id: 'phones', name: '监听耳机', desc: '90 秒 · 任务点亮起光柱', price: 45, max: 9, dur: 90, eff: { detect: true } }
    ]
  },
  {
    id: 'cloth', name: '霓裳', keeper: '裁缝', line: '跑酷也要好看，对吧。',
    items: [
      { id: 'coat0', name: '青蓝外套', desc: '永久 · 换一个配色', price: 30, max: 1 },
      { id: 'coat1', name: '落日外套', desc: '永久 · 换一个配色', price: 30, max: 1 },
      { id: 'coat2', name: '苔绿外套', desc: '永久 · 换一个配色', price: 30, max: 1 },
      { id: 'scarf', name: '霓虹围巾', desc: '60 秒 · 移动速度 +12', price: 35, max: 9, dur: 60, eff: { spd: 1 } }
    ]
  },
  {
    id: 'bank', name: '芯片兑换', keeper: '柜员', line: '芯片不收，金币可以。',
    items: [
      { id: 'detect', name: '芯片探测器', desc: '永久 · 任务点亮起光柱', price: 200, max: 1 },
      { id: 'chipbox', name: '芯片包', desc: '120 秒 · 每个任务多 1 枚芯片', price: 120, max: 9, dur: 120, eff: { chipBonus: 1 } },
      { id: 'vault', name: '保险箱', desc: '120 秒 · 每枚金币多收 1 枚', price: 90, max: 9, dur: 120, eff: { coinBonus: 1 } }
    ]
  },
  {
    id: 'cafe', name: '咖啡站', keeper: '阿库', line: '双份浓缩，跑一整夜都没问题。',
    items: [
      { id: 'coffee', name: '黑咖啡', desc: '60 秒 · 移动速度 +12', price: 25, max: 9, dur: 60, eff: { spd: 1 } },
      { id: 'espresso', name: '双份浓缩', desc: '60 秒 · 起跳高度 +30', price: 60, max: 9, dur: 60, eff: { jmp: 1 } },
      { id: 'latte', name: '拿铁', desc: '90 秒 · 速度 +6、起跳 +18', price: 45, max: 9, dur: 90, eff: { spd: 0.5, jmp: 0.6 } },
      { id: 'bean', name: '咖啡豆', desc: '90 秒 · 每枚金币多收 1 枚', price: 40, max: 9, dur: 90, eff: { coinBonus: 1 } }
    ]
  },
  {
    id: 'flower', name: '花店', keeper: '小满', line: '买束花吧，跑酷也可以很温柔。',
    items: [
      { id: 'clover', name: '幸运草', desc: '永久 · 每枚金币多收 1 枚', price: 60, max: 1 },
      { id: 'dry', name: '干花外套', desc: '永久 · 换一个配色', price: 30, max: 1 },
      { id: 'bouquet', name: '花束', desc: '60 秒 · 移动速度 +12', price: 30, max: 9, dur: 60, eff: { spd: 1 } },
      { id: 'honey', name: '花蜜', desc: '60 秒 · 起跳更高', price: 35, max: 9, dur: 60, eff: { jmp: 0.8 } }
    ]
  },
  {
    id: 'tool', name: '五金铺', keeper: '老周', line: '底子打好了，跑起来才稳。',
    items: [
      { id: 'boots', name: '加固靴', desc: '永久 · 冲刺冷却更短', price: 90, max: 1 },
      { id: 'grip', name: '防滑鞋底', desc: '永久 · 空中更好控制', price: 45, max: 1 },
      { id: 'spring', name: '弹簧鞋垫', desc: '60 秒 · 起跳高度 +30', price: 50, max: 9, dur: 60, eff: { jmp: 1 } },
      { id: 'oil', name: '润滑油', desc: '60 秒 · 移动速度 +12', price: 40, max: 9, dur: 60, eff: { spd: 1 } }
    ]
  },
  {
    id: 'arcade', name: '街机厅', keeper: '小马', line: '打通一关给你盖章——任务多给芯片。',
    items: [
      { id: 'badge', name: '连击徽章', desc: '永久 · 每个任务多 2 枚芯片', price: 80, max: 1 },
      { id: 'token', name: '游戏币', desc: '60 秒 · 每枚金币多收 1 枚', price: 40, max: 9, dur: 60, eff: { coinBonus: 1 } },
      { id: 'energy', name: '能量饮料', desc: '60 秒 · 移动速度 +12', price: 35, max: 9, dur: 60, eff: { spd: 1 } },
      { id: 'combo', name: '连击训练', desc: '120 秒 · 每个任务多 1 枚芯片', price: 60, max: 9, dur: 120, eff: { chipBonus: 1 } }
    ]
  }
];

const SHOP_NAME = {};
SHOPS.forEach(s => { SHOP_NAME[s.id] = s.name; });

const WORLD_INFO = [
  { name: '霓虹街区', desc: '灯牌比星星还多' },
  { name: '雨夜码头', desc: '下不完的雨' },
  { name: '高层天台', desc: '风很大，别往下看' },
  { name: '熔炉工厂', desc: '热浪烫脚' },
  { name: '数据深渊', desc: '底下没有底' }
];

let SC = null;

function worldName(i) { return '世界 ' + (i + 1) + ' · ' + WORLD_INFO[i].name; }

/* ---------------- 排版工具 ---------------- */
function packRow(items, gap) {
  let x = 0;
  const out = [];
  for (const it of items) {
    out.push({ it, cx: x + it.w / 2 });
    x += it.w + gap;
  }
  return { out, total: Math.max(0, x - gap) };
}

function makeIslandScene(cfg) {
  const gap = cfg.gap || 24;
  const packed = packRow(cfg.items, gap);
  const margin = 130;
  const W = packed.total + margin * 2;
  const x0 = 20;
  const startX = x0 + margin;

  const plats = [{ x: x0, y: 250, w: W, h: 54, island: true }];
  const spots = [], buildings = [], decos = [], coins = [];

  for (const o of packed.out) {
    const cx = startX + o.cx;
    const it = o.it;
    if (it.t === 'shop') {
      spots.push({ kind: 'shop', id: it.id, x: cx, y: 250, r: 36, label: SHOP_NAME[it.id] });
    } else if (it.t === 'bld') {
      buildings.push({ kind: it.kind, x: cx, y: 250, w: it.w, h: Math.min(it.h, 84), seed: (cx * 7) | 0 });
    } else if (it.t === 'portal') {
      spots.push({ kind: it.to, i: it.i, c: it.c, x: cx, y: 250, r: 34, label: it.label, sub: it.sub });
    }
  }

  // 自动铺街边小物件（避开门/门面）
  let k = 0;
  for (let px = x0 + 60; px < x0 + W - 40; px += 108) {
    let busy = false;
    for (const s of spots) if (Math.abs(s.x - px) < 62) busy = true;
    if (busy) continue;
    const kinds = ['lamp', 'vend', 'crate', 'plant'];
    decos.push({ kind: kinds[k % 4], x: px, y: 250 });
    k++;
  }
  // 金币只放在岛两端的空地上，免得压在店面橱窗上
  coins.push({ x: x0 + 52, y: 224, got: false, ph: 1 });
  coins.push({ x: x0 + 78, y: 208, got: false, ph: 2 });
  coins.push({ x: x0 + W - 52, y: 224, got: false, ph: 3 });
  coins.push({ x: x0 + W - 78, y: 208, got: false, ph: 4 });

  /* ---------------- 上层步道 + 上层建筑 ---------------- */
  const upY = 150;
  const upRng = mulberry32(Math.floor(W) * 13 + 5);
  const upPlan = cfg.upper || ['apart', 'factory', 'apart', 'warehouse'];
  let ui2 = 0;
  let tx = x0 + 250;
  while (tx < x0 + W - 250) {
    const len = Math.min(210 + upRng() * 170, x0 + W - 210 - tx);
    if (len < 150) break;
    // 电梯（代替楼梯：按 E 选楼层）
    const liftX = tx + 26;
    spots.push({ kind: 'lift', x: liftX, y: 250, r: 42, label: '电梯', lvl: 0, car: false });
    spots.push({ kind: 'lift', x: liftX, y: upY, r: 42, label: '电梯', lvl: 1 });
    // 步道本体（单向：可以从下面跳穿，也可以从上面跳下来）
    plats.push({ x: tx, y: upY, w: len, h: 16, terrace: true, oneWay: true, lvl: 1 });
    // 步道上的一栋建筑 / 一家店
    const item = upPlan[ui2 % upPlan.length];
    if (item.indexOf('shop:') === 0) {
      const id = item.slice(5);
      if (len >= 176) {
        spots.push({ kind: 'shop', id, x: tx + len / 2, y: upY, r: 38, label: SHOP_NAME[id], lvl: 1 });
      }
    } else {
      const bw = Math.min(item === 'factory' ? 86 : 62, len - 26);
      buildings.push({
        kind: item, x: tx + len / 2, y: upY, w: bw,
        h: item === 'factory' ? 96 : 112, seed: ui2 * 97 + 13, lvl: 1
      });
    }
    // 步道上的路灯
    decos.push({ kind: 'lamp', x: tx + 16, y: upY, lvl: 1 });
    decos.push({ kind: 'lamp', x: tx + len - 16, y: upY, lvl: 1 });
    // 上层金币
    coins.push({ x: tx + len * 0.28, y: upY - 26, got: false, ph: ui2 });
    coins.push({ x: tx + len * 0.72, y: upY - 26, got: false, ph: ui2 + 1 });
    ui2++;
    tx += len + 96;
  }

  return {
    id: cfg.id, kind: cfg.id, pal: cfg.pal, title: cfg.title,
    floors: [{ y: 250, name: '1F · 街道' }, { y: upY, name: '2F · 阁楼' }],
    platforms: plats, spots, buildings, decos, coins, beacons: [],
    b: { x0: 0, x1: x0 + W + 40, y0: 0, y1: 120 },
    spawn: { x: x0 + 70, y: 220 },
    killY: 430, weather: cfg.weather || 'none', bg: 'islands',
    portalN: cfg.portalN || 0
  };
}

/* ---------------- 出生空岛 ---------------- */
function buildSpawn() {
  const items = [
    { t: 'bld', kind: 'apart', w: 62, h: 150 },
    { t: 'shop', id: 'store', w: 96 },
    { t: 'shop', id: 'ramen', w: 96 },
    { t: 'bld', kind: 'factory', w: 96, h: 118 },
    { t: 'shop', id: 'cyber', w: 96 },
    { t: 'shop', id: 'music', w: 96 },
    { t: 'bld', kind: 'warehouse', w: 88, h: 76 },
    { t: 'shop', id: 'cloth', w: 96 },
    { t: 'portal', to: 'hub5', w: 104, label: '传送门 · 浮空中枢' },
    { t: 'shop', id: 'bank', w: 96 },
    { t: 'bld', kind: 'apart', w: 62, h: 170 },
    { t: 'shop', id: 'cafe', w: 96 },
    { t: 'shop', id: 'flower', w: 96 },
    { t: 'bld', kind: 'parking', w: 74, h: 110 },
    { t: 'shop', id: 'tool', w: 96 },
    { t: 'shop', id: 'arcade', w: 96 },
    { t: 'bld', kind: 'apart', w: 62, h: 140 }
  ];
  return makeIslandScene({
    id: 'spawn', pal: PAL.spawn, title: '出生空岛',
    items, gap: 6,
    upper: ['apart', 'shop:cafe', 'factory', 'shop:arcade', 'warehouse']
  });
}

/* ---------------- 浮空中枢：5 个世界门 ---------------- */
function buildHub() {
  const items = [
    { t: 'bld', kind: 'apart', w: 62, h: 150 },
    { t: 'shop', id: 'cafe', w: 96 },
    { t: 'bld', kind: 'factory', w: 88, h: 104 },
    { t: 'portal', to: 'world', i: 0, w: 112, label: '进入 · ' + worldName(0), sub: WORLD_INFO[0].desc },
    { t: 'portal', to: 'world', i: 1, w: 112, label: '进入 · ' + worldName(1), sub: WORLD_INFO[1].desc },
    { t: 'portal', to: 'world', i: 2, w: 112, label: '进入 · ' + worldName(2), sub: WORLD_INFO[2].desc },
    { t: 'portal', to: 'world', i: 3, w: 112, label: '进入 · ' + worldName(3), sub: WORLD_INFO[3].desc },
    { t: 'portal', to: 'world', i: 4, w: 112, label: '进入 · ' + worldName(4), sub: WORLD_INFO[4].desc },
    { t: 'bld', kind: 'warehouse', w: 80, h: 70 },
    { t: 'shop', id: 'tool', w: 96 },
    { t: 'bld', kind: 'apart', w: 58, h: 170 },
    { t: 'shop', id: 'arcade', w: 96 },
    { t: 'portal', to: 'spawn', w: 104, label: '返回 · 出生空岛' }
  ];
  return makeIslandScene({
    id: 'hub5', pal: PAL.hub5, title: '浮空中枢',
    items, gap: 8
  });
}

/* ---------------- 世界岛：商铺 + 大型建筑 + 5~10 个挑战门 ---------------- */
function buildWorldIsland(idx) {
  const pal = PAL.worlds[idx];
  const n = 5 + idx;                         // 5 ~ 9 个挑战
  const shopPool = ['store', 'ramen', 'cyber', 'cafe', 'flower', 'tool', 'music', 'bank'];
  const items = [
    { t: 'bld', kind: 'apart', w: 62, h: 140 },
    { t: 'shop', id: shopPool[idx % shopPool.length], w: 96 },
    { t: 'bld', kind: idx === 3 ? 'factory' : 'warehouse', w: 90, h: idx === 3 ? 120 : 74 },
    { t: 'shop', id: shopPool[(idx + 3) % shopPool.length], w: 96 },
    { t: 'bld', kind: 'parking', w: 70, h: 104 },
    { t: 'shop', id: shopPool[(idx + 5) % shopPool.length], w: 96 },
    { t: 'bld', kind: 'apart', w: 62, h: 160 }
  ];
  for (let c = 0; c < n; c++) {
    items.push({
      t: 'portal', to: 'challenge', i: idx, c, w: 104,
      label: '挑战 ' + (idx + 1) + '-' + (c + 1),
      sub: '跑酷 · ' + (3 + (c % 3)) + ' 个任务点'
    });
  }
  items.push({ t: 'portal', to: 'hub5', w: 100, label: '返回 · 浮空中枢' });

  // 挑战门之间穿插大型建筑，街道不空
  const mixed = [];
  items.forEach((it, i) => {
    mixed.push(it);
    if (it.t === 'portal' && it.to === 'challenge' && i % 2 === 0) {
      mixed.push({ t: 'bld', kind: i % 4 === 0 ? 'apart' : 'warehouse', w: 58, h: i % 4 === 0 ? 120 : 66 });
    }
  });

  const sc = makeIslandScene({
    id: 'world', pal, title: worldName(idx),
    items: mixed, gap: 6, portalN: n, weather: 'none'
  });
  sc.world = idx;
  sc.challenges = n;
  return sc;
}

/* ---------------- 跑酷挑战 ---------------- */
function buildChallenge(wi, ci) {
  const pal = PAL.worlds[wi];
  const rng = mulberry32(9001 + wi * 733 + ci * 137);
  const plats = [], coins = [], beacons = [], spots = [];

  let x = -40, y = 252;
  plats.push({ x: -40, y: 252, w: 190, h: 90 });

  x = 150;
  const steps = 26 + ci * 3 + wi * 2;
  const ys = [];
  for (let i = 0; i < steps; i++) {
    const gap = Math.round(24 + rng() * 28 + ci * 1.2);
    const w = Math.round(54 + rng() * 70);
    const dy = Math.round((rng() * 2 - 1) * 30);
    const ny = clamp(y + dy, 132, 300);
    x += gap;
    if (gap > 44 && rng() > 0.5) {
      plats.push({ x: x - gap * 0.5 - 12, y: Math.min(y, ny) + 14, w: 24, h: 10 });
    }
    plats.push({ x, y: ny, w, h: 16 });
    const arc = 2 + (rng() > 0.45 ? 1 : 0);
    for (let c = 0; c < arc; c++) {
      const tt = (c + 1) / (arc + 1);
      coins.push({
        x: x - gap + gap * tt,
        y: Math.min(y, ny) - 24 - Math.sin(tt * Math.PI) * 16,
        got: false, ph: rng() * 9
      });
    }
    if (rng() > 0.5) coins.push({ x: x + w * (0.2 + rng() * 0.6), y: ny - 18, got: false, ph: rng() * 9 });
    ys.push({ x, y: ny, w });
    y = ny;
    x += w;
  }

  const endX = x + 46;
  plats.push({ x: endX, y, w: 240, h: 26 });

  const beaconN = 3 + (ci % 3);
  const picks = [];
  for (let k = 0; k < beaconN; k++) {
    picks.push(Math.round((k + 0.6) * ys.length / beaconN));
  }
  for (let k = 0; k < picks.length; k++) {
    const p = ys[clamp(picks[k], 0, ys.length - 1)];
    const id = 'w' + wi + 'c' + ci + 't' + k;
    beacons.push({ id, idx: k, x: p.x + p.w / 2, y: p.y, done: !!G.tasksDone[id] });
  }

  spots.push({ kind: 'world', i: wi, x: endX + 190, y, r: 34, label: '出口 · 返回' + WORLD_INFO[wi].name });

  return {
    id: 'challenge', kind: 'challenge', world: wi, chal: ci,
    pal, title: '挑战 ' + (wi + 1) + '-' + (ci + 1) + ' · ' + WORLD_INFO[wi].name,
    platforms: plats, spots, coins, beacons, buildings: [], decos: [],
    b: { x0: -60, x1: endX + 320, y0: 40, y1: 240 },
    spawn: { x: 10, y: 220 },
    killY: 470,
    weather: wi === 1 ? 'rain' : (wi === 3 ? 'spark' : (wi === 4 ? 'dust' : 'none')),
    bg: 'city'
  };
}

/* ---------------- 切换 ---------------- */
function loadScene(kind, a, b) {
  if (kind === 'spawn') SC = buildSpawn();
  else if (kind === 'hub5') SC = buildHub();
  else if (kind === 'inside') SC = buildInside(a);
  else if (kind === 'world') { G.world = a | 0; SC = buildWorldIsland(G.world); }
  else if (kind === 'challenge') { G.world = a | 0; G.chal = b | 0; SC = buildChallenge(G.world, G.chal); }
  else SC = buildSpawn();

  G.scene = SC.id;
  P.x = SC.spawn.x; P.y = SC.spawn.y;
  P.vx = 0; P.vy = 0; P.onGround = false; P.jumps = 0; P.dashT = 0;
  P.face = 1;
  CAM.x = clamp(P.x - VIEW.w * 0.35, SC.b.x0, SC.b.x1 - VIEW.w);
  CAM.y = clamp(P.y - VIEW.h * 0.55, SC.b.y0, SC.b.y1);
  G.fade = 1;
  if (typeof buildCityFor === 'function' && SC.bg !== 'inside') buildCityFor(SC);
  if (SC.bg === 'islands' && typeof buildBackRowCanvas === 'function') SC.backRow = buildBackRowCanvas(SC);
  initWeather(SC.weather, 80);
  if (typeof ui !== 'undefined' && ui.area) ui.area.textContent = SC.title;
  if (typeof scanInteract === 'function') scanInteract();
}

function gotoScene(kind, a, b) {
  SFX.door();
  loadScene(kind, a, b);
}

/* ---------------- 进度 ---------------- */
function challengeCleared(wi, ci) {
  G.chalClear = G.chalClear || {};
  return !!G.chalClear['w' + wi + 'c' + ci];
}

function worldDone(i) {
  const n = 5 + i;
  for (let c = 0; c < n; c++) if (!challengeCleared(i, c)) return false;
  return true;
}
