/* ===================== SHOULDER: RECEIVING FROM THE BACK =====================
   A ball from his own defensive line, 17-26 m. While it travels he looks over his shoulder
   (a tap left or right, or the arrow keys: a third of a second each) when he chooses, and
   calls it before it arrives. Four calls, in the terms the Spanish school uses:
     Receive open   - hold your width and take it half-turned (recibir de perfil), so the
                      first touch goes forward
     Come to it     - the supporting unmarking movement (desmarque de apoyo): go and meet it
     Shield, set it back - show for it, body between, and play first time to the man
                      facing play (el que recibe de espaldas juega de cara)
     Check away, then come - a step toward goal to drag the marker, then come short
                      (fintar y salir): separation, at the cost of half a second
   The man behind him holds off (5-9 m), is tight on his back (1-2 m), or jumps: at some
   moment while the ball travels he sprints past the shoulder to cut it out. A look before
   he goes shows a man standing still (mirar antes de recibir: as it is struck, and again as
   it travels). And some balls are not for him at all: played to the full-back supporting
   underneath him, when the right thing is to hold the width (amplitud) and not come short
   into the full-back's lane. Everything after the call is a race, played out.
   Speeds: a top-level 12-14 year old. Sprint 6.0 m/s for him (quick first steps), 5.8 for
   the defender; a firm ball from the back 13.5 m/s, slowing on the grass.                */
const SCAN_TURN = 105*Math.PI/180;        // the check: head 105 degrees from the chest, toward the shoulder he looked over
/* the check itself: 0.10 s out, 0.10 s there, 0.10 s back onto the ball, 0.30 s in all, the time a
   top 12-14-year-old's own check takes (the shell's glance is 0.35 s) */
const SH_OUT = 100, SH_HOLD = 100, SH_BACK = 100;
function scanNow(){
  if (!scan) return null;
  const t = performance.now() - scan.t0, E = q => q < 0.5 ? 2*q*q : 1 - Math.pow(-2*q + 2, 2)/2;
  if (t >= SH_OUT + SH_HOLD + SH_BACK){ scan = null; return null; }
  const k = t < SH_OUT ? E(t/SH_OUT) : t < SH_OUT + SH_HOLD ? 1 : E(1 - (t - SH_OUT - SH_HOLD)/SH_BACK);
  return { dir: scan.dir, k };
}
const RC = { v0: 13.0, dec: 1.2, youV: 6.0, youA: 7.5, defV: 5.8, defA: 7, react: 0.15, strike: 1000, after: 1500, window: 0.65, feint: 0.45 };
const ballS = t => t <= 0 ? 0 : Math.max(0, RC.v0*t - RC.dec*t*t/2);
const ballT = L => { const r = RC.v0*RC.v0 - 2*RC.dec*L; return r > 0 ? (RC.v0 - Math.sqrt(r))/RC.dec : Infinity; };
const runS = (t, v, a) => { if (t <= 0) return 0; const ta = v/a; return t < ta ? a*t*t/2 : a*ta*ta/2 + v*(t - ta); };
const runT = (d, v, a) => { const ta = v/a, da = a*ta*ta/2; return d <= da ? Math.sqrt(2*d/a) : ta + (d - da)/v; };
/* how far back a man can be and still cut out a ball that reaches the spot in front of you at tQ, if he goes 0.2 s after the strike */
const reachFor = tQ => { let lo = 0, hi = 30; for (let i = 0; i < 30; i++){ const m = (lo + hi)/2; (0.2 + runT(m - 1.3, RC.defV, RC.defA) < tQ ? lo : hi) === lo ? lo = m : hi = m; } return lo; };
const RC_BAG = { hold: 4, jump: 7, tight: 5 };                    // every ball is played to him
const KEY_NAME = { hold: 'too far to get there', jump: 'close enough to get there', tight: 'tight on your back', width: 'holding off; the ball was for your full-back' };
const CALLS = [['open','●','Receive open','<b>Too far for this ball.</b> Stay, half-turned, take it facing play'],
               ['meet','↓','Come to it','<b>Close enough to get there.</b> Go and meet the ball, win the race'],
               ['shield','↑','Shield, set it back','<b>On your back.</b> Body between; first time to the man facing play'],
               ['feint','⇅','Check away, then come','<b>Close, watching you.</b> Drag him a step, then come short']];
const CALL_NAME = { open: 'receive open', meet: 'come to it', shield: 'shield and set it back', feint: 'check away, then come' };
function newBag(){
  const n = CFG.repsPerSession, ids = Object.keys(RC_BAG), tot = ids.reduce((a, k) => a + RC_BAG[k], 0);
  const left = {}; ids.forEach(k => left[k] = Math.floor(RC_BAG[k]*n/tot));
  let short = n - ids.reduce((a, k) => a + left[k], 0); ids.slice().sort(() => Math.random() - 0.5).forEach(k => { if (short > 0){ left[k]++; short--; } });
  const out = []; let prev = null;
  for (let i = 0; i < n; i++){ const elig = ids.filter(k => left[k] > 0 && (k !== prev || ids.filter(z => left[z] > 0).length === 1));
    const k = elig[Math.floor(Math.random()*elig.length)]; out.push(k); left[k]--; prev = k; }
  return out;
}
function candidate(side, key){
  const z0 = rand(-4, 10), you = [27.4 + rand(-0.8, 0.8), z0];
  const passer = [rand(8, 19), z0 + rand(17, 26)];
  /* the structure: his full-back supporting underneath him, the 8 inside, the 6 by the passer */
  const RB = [you[0] - rand(2.5, 4.5), z0 + rand(9, 13)];
  const target = key === 'width' ? RB : you;
  const L = d2(passer, target), u = unit(passer, target), ub = [-u[0], -u[1]];
  const Tb = ballT(L); if (!isFinite(Tb) || Tb > 3.2 || Tb < 1.4) return null;
  /* the bands. How far he is, against how long the ball is in the air, is the whole read:
       tight  on his back, 1.2-2 m                       -> shield
       jump   close enough to get there, 4-6.5 m         -> come to it (he goes early; stand still and he cuts it out)
       hold   beyond his reach for this ball, +2.5-5 m   -> receive open (one in three gambles late anyway, and fails) */
  const Q = [you[0] + ub[0]*1.3, you[1] + ub[1]*1.3], tQ = ballT(L - 1.3);
  const reach = reachFor(tQ);                                                            // the farthest he can cut it out from, going 0.2 s after the strike
  const d0 = key === 'tight' ? rand(1.2, 2.0) : key === 'jump' ? rand(4.0, 6.5) : reach + rand(2.5, 5);
  if (key === 'hold' && z0 - d0 < -40) return null;
  const def = [you[0] - rand(0.3, 1.6), you[1] - d0];
  let ts = null, gamble = false;
  if (key === 'jump') ts = rand(0.1, 0.4);                                              // he reads the pass and goes
  if (key === 'hold' && Math.random() < 1/3){ gamble = true; ts = rand(0.5, 0.9); }     // too far, goes anyway, arrives late
  const others = [
    { id: 'RB', own: true,  at: RB },
    { id: 'R8', own: true,  at: [you[0] - rand(10, 14), z0 + rand(-3, 5)] },
    { id: 'TM', own: false, at: [you[0] - rand(7, 11), z0 + rand(-8, -3)] },
    { id: 'TB', own: false, at: [you[0] - rand(1, 4), z0 - rand(13, 18)] },
    { id: 'N9', own: true,  at: [you[0] - rand(14, 19), z0 - rand(10, 15)] },
    { id: 'S6', own: true,  at: [passer[0] - rand(4, 9), passer[1] - rand(6, 10)] },
    { id: 'TW', own: false, at: [RB[0] - rand(3, 6), RB[1] + rand(2, 5)] }                // their winger, on our full-back
  ];
  for (const o of others){ if (d2(o.at, def) < 3 || d2(o.at, you) < 3 || d2(o.at, passer) < 3) return null; }
  for (const o of others) for (const q of others) if (o !== q && d2(o.at, q.at) < 2.8) return null;
  if (key === 'width' && laneD(def, passer, RB) < 2.5) return null;                      // the ball to the full-back is on
  if (laneD(RB, passer, you) < 2.5 && key !== 'width') return null;                     // the ball to him is on
  const sc = { side, key, you, passer, RB, target, L, u, ub, Tb, d0, def, ts, gamble, reach, Q, tQ, others, start: you, wingX: you[0], zBase: you[1], scans: [], action: null, td: null };
  if (key === 'jump'){ if (tracksFor(sc, 'meet', 1.0).tInt !== null) return null; if (tracksFor(sc, 'open', 0.5).tInt === null) return null; }   // go by 1.0 s and you win; stand and he cuts it out
  if (key === 'hold' && gamble){ const R = tracksFor(sc, 'open', 0.5); if (R.tInt !== null) return null; }                                   // the gamble must fail
  return Object.assign(sc, {
    ev: [{ role: 'P', at: passer, ts: 0, sh: { own: {}, opp: {} } }, { role: key === 'width' ? 'RB' : 'YOU', at: target, ts: RC.strike, ta: RC.strike + Tb*1000, len: L }],
    tFreeze: RC.strike + Tb*1000 + RC.after });
}
function laneD(q, a, b){ const vx = b[0]-a[0], vz = b[1]-a[1], L2 = vx*vx + vz*vz || 1; let t = ((q[0]-a[0])*vx + (q[1]-a[1])*vz)/L2; t = Math.max(0, Math.min(1, t)); return Math.hypot(q[0] - (a[0]+vx*t), q[1] - (a[1]+vz*t)); }
function makeScene(side, key){ for (let i = 0; i < 600; i++){ const s = candidate(side, key); if (s) return s; } return candidate(side, 'hold') || makeScene(side, 'hold'); }
/* everyone's track, given his call (made td seconds after the strike; null = none) */
function tracksFor(s, action, td){
  const tr = {}, ball = [], me = [], DT = 50, strike = RC.strike, tEnd = s.tFreeze || (RC.strike + s.Tb*1000 + RC.after);
  const you = s.you, def = s.def, ub = s.ub, u = s.u, width = s.key === 'width';
  const tGo = (td === null || action === 'open') ? null : td + RC.react;
  const toward = unit(you, s.passer);                            // the way to the ball, from where he stands
  const meAt = t => {
    if (tGo === null || t <= tGo) return you.slice();
    if (action === 'meet'){ const d = Math.min(runS(t - tGo, RC.youV, RC.youA), s.L - 1); return [you[0] + toward[0]*d, you[1] + toward[1]*d]; }
    if (action === 'shield'){ const d = Math.min(0.7, runS(t - tGo, 2.5, 6)); return [you[0] - toward[0]*d, you[1] - toward[1]*d]; }
    if (action === 'feint'){                                      // a step toward goal, then come short
      const f = Math.min(1.2, runS(t - tGo, 3.0, 8)); if (t <= tGo + RC.feint) return [you[0] - toward[0]*f, you[1] - toward[1]*f];
      const d = Math.min(runS(t - tGo - RC.feint, RC.youV, RC.youA) - 1.2, s.L - 1); return [you[0] + toward[0]*d, you[1] + toward[1]*d]; }
    return you.slice();
  };
  /* the meeting */
  let tMeet = s.Tb, pMeet = (width ? s.RB : you).slice();
  if (!width && (action === 'meet' || action === 'feint') && tGo !== null){
    for (let t = tGo; t <= s.Tb + 0.01; t += 0.01){ const m = meAt(t); if (ballS(t) >= d2(s.passer, m) - 0.3){ tMeet = t; pMeet = m; break; } }
    if (tMeet === s.Tb) pMeet = meAt(s.Tb);
  } else if (!width && action === 'shield' && tGo !== null){ pMeet = meAt(s.Tb); tMeet = ballT(d2(s.passer, pMeet)); }
  /* the man behind him */
  let tInt = null, pInt = null;
  const lagMe = t => meAt(t - 0.3);                              // a tight man reacts a third of a second late
  const defAt = t => {
    if (s.key === 'tight'){ const m = lagMe(t); return [m[0] - 0.4, m[1] - 1.4]; }
    if ((s.key === 'hold' && !s.gamble) || width) return [def[0] + 0.3*Math.sin(t*2.1), def[1] + 0.25*Math.sin(t*1.3)];
    if (t < s.ts) return def.slice();
    const tgt = ((action === 'meet' || action === 'feint') && tGo !== null) ? pMeet : s.Q;
    const D = d2(def, tgt) || 1, r = Math.min(D, runS(t - s.ts, RC.defV, RC.defA));
    return [def[0] + (tgt[0]-def[0])/D*r, def[1] + (tgt[1]-def[1])/D*r];
  };
  if (s.key === 'jump' || (s.key === 'hold' && s.gamble)){
    const tgt = ((action === 'meet' || action === 'feint') && tGo !== null) ? pMeet : s.Q, tArr = s.ts + runT(d2(def, tgt), RC.defV, RC.defA);
    const tBallThere = ballT(d2(s.passer, tgt));
    if (tArr <= Math.min(tBallThere, tMeet) + 0.12){ tInt = Math.min(tBallThere, tMeet); pInt = tgt; }
  } else if (s.key === 'tight' && (action === 'open' || td === null)){ tInt = s.Tb + 0.15; pInt = you.slice(); }
  const tTake = tInt !== null ? tInt : tMeet, pTake = tInt !== null ? pInt : pMeet;
  /* the lay-off: shield and set it back goes first time to the full-back */
  const layOff = !width && action === 'shield' && tInt === null, tLay = tTake + 0.35, layT = 0.9;
  /* bodies. Nobody runs through anybody: once the ball is taken he pulls up within a stride; if his
     path reaches a body (a defender who got there first, a team-mate) he stops short of it and stays
     there; a man carrying the ball past him goes round, a body's width away. */
  const BODY = 1.1;
  let mPrev = you.slice(), blocked = false;
  const clearOf = (q, from) => { const dx = q[0] - from[0], dz = q[1] - from[1], d = Math.hypot(dx, dz); if (d >= BODY) return q;
    const px = -ub[1], pz = ub[0], sgn = (dx*px + dz*pz) >= 0 ? 1 : -1, need = Math.sqrt(Math.max(0, BODY*BODY - Math.pow(dx*ub[0] + dz*ub[1], 2))) - (dx*px + dz*pz)*sgn;
    return [q[0] + px*sgn*need, q[1] + pz*sgn*need]; };
  for (let T = 0; T <= tEnd + 1e-6; T += DT){
    const t = (T - strike)/1000;
    let m = meAt(Math.min(t, tTake + 0.2));
    let ddRaw = (tInt !== null && t > tInt) ? [defAt(tInt)[0] + ub[0]*4.5*Math.min(1, (t - tInt)/1.2), defAt(tInt)[1] + ub[1]*4.5*Math.min(1, (t - tInt)/1.2)] : defAt(t);
    const dd = s.key === 'tight' ? ddRaw : clearOf(ddRaw, mPrev);          // a running man goes round a body, never through it
    if (!blocked && d2(m, mPrev) > 1e-6){
      const bodies = [dd, ...s.others.map(o => o.at)];
      if (bodies.some(q => d2(q, m) < BODY)){                                 // he pulls up a body's width short, and stays there
        let lo = 0, hi = 1; for (let i = 0; i < 12; i++){ const f = (lo + hi)/2, q = [mPrev[0] + (m[0]-mPrev[0])*f, mPrev[1] + (m[1]-mPrev[1])*f]; if (bodies.some(b => d2(b, q) < BODY)) hi = f; else lo = f; }
        m = [mPrev[0] + (m[0]-mPrev[0])*lo, mPrev[1] + (m[1]-mPrev[1])*lo]; blocked = true; } }
    else if (blocked) m = mPrev;
    mPrev = m;
    me.push([T, m[0], m[1]]);
    let bp;
    if (t <= 0) bp = [s.passer[0] + u[0]*0.6, s.passer[1] + u[1]*0.6];
    else if (t <= tTake) bp = [s.passer[0] + u[0]*ballS(t), s.passer[1] + u[1]*ballS(t)];
    else if (tInt !== null){ const dd = defAt(t); bp = [dd[0] + ub[0]*0.4, dd[1] + ub[1]*0.4]; }
    else if (width){ const k = Math.min(1, (t - tTake)/1.2); bp = [s.RB[0] - 3.5*k, s.RB[1] - 4*k]; }      // the full-back carries it forward
    else if (layOff && t > tLay){ const k = Math.min(1, (t - tLay)/layT); bp = [pTake[0] + (s.RB[0] - pTake[0])*k, pTake[1] + (s.RB[1] - pTake[1])*k]; }
    else bp = [m[0] + 0.35*toward[0], m[1] + 0.35*toward[1]];
    ball.push([T, bp[0], bp[1]]);
    (tr.D = tr.D || []).push([T, dd[0], dd[1]]);
    (tr.P = tr.P || []).push([T, s.passer[0], s.passer[1]]);
    for (const o of s.others){
      let q = o.at;
      if (o.id === 'RB' && width && t > tTake){ const k = Math.min(1, (t - tTake)/1.2); q = [o.at[0] - 3.5*k, o.at[1] - 4*k]; }
      else if (o.id === 'RB' && action === 'meet' && !width && tGo !== null && t > tGo){ q = [o.at[0], o.at[1] - Math.min(2, (t - tGo)*1.5)]; }   // he pushes up behind you
      else { const drift = 0.5*Math.sin(T/900 + o.at[0]); q = [o.at[0] + drift, o.at[1] + 0.3*Math.cos(T/700)]; }
      (tr[o.id] = tr[o.id] || []).push([T, q[0], q[1]]);
    }
  }
  return { tr, ball, me, tMeet, pMeet, tInt, pInt, tTake, pTake, layOff, tLay };
}
/* --------------------------------------------------------------------------- */
function nextRep(){
  replaying = false;
  seqGen++; const rb = el('replay'); if (rb){ rb.disabled = false; rb.textContent = 'Replay the clip'; }
  if (rep >= CFG.repsPerSession) return endSession();
  rep++;
  lastSide = stats.side === 'alt' ? -lastSide : (stats.side === 'R' ? 1 : -1);
  el('hmeta').textContent = 'Rep '+rep+' / '+CFG.repsPerSession+' · '+(lastSide === 1 ? 'Right' : 'Left');
  if (!bag.length) bag = newBag();
  current = makeScene(lastSide, bag.pop());
  current.T = tracksFor(current, null, null);
  ranked = [];
  buildScene2(current);
  seqFrame(current, 0);
  labels.style.display = 'none'; labels.innerHTML = ''; el('leaders').style.display = 'none';
  maskEl.style.display = 'none'; timer.style.display = 'none';
  document.getElementById('mapwrap').style.display = 'none';
  show(pAsk);
  el('askWord').firstChild.textContent = 'Watch';
  el('askHint').textContent = 'A ball from the back. Look over your shoulder while it travels; call it before it arrives.';
  el('answers').innerHTML = '';
  setVeil(true, (current.side === 1 ? 'Right wing' : 'Left wing') + (learning() ? ' · Learn' : ' · Test'), 'A ball from your defensive line. Look over your shoulder while it travels: ' + (matchMedia('(hover: hover) and (pointer: fine)').matches ? '← or →' : 'tap left or right') + '. Then call it.');
  setTimeout(flash, CFG.cueMs);
}
function buildScene2(s){
  while (actors.children.length) actors.remove(actors.children[0]);
  placed = []; passerRig = null; ACT = {};
  const own = { P: true, D: false }; s.others.forEach(o => own[o.id] = o.own);
  Object.keys(s.T.tr).forEach(id => {
    const p0 = s.T.tr[id][0];
    place(own[id] ? 'own' : 'opp', p0[1] - s.wingX, p0[2] - s.zBase, s, p0[1] - s.wingX, p0[2] - s.zBase - 1, null, { speed: 0.6, mps: 3.47, pre: 0, hold: true });
    const e = placed[placed.length - 1]; e.custom = true; ACT[id] = e;
  });
  passerRig = ACT.P.mesh;
  const bl = new THREE.Mesh(new THREE.SphereGeometry(0.115, 24, 16), LOOK.ballMaterial()); bl.castShadow = true; actors.add(bl); ballMesh = bl;
  carrierRing = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.0, 40), new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
  carrierRing.rotation.x = -Math.PI/2; carrierRing.position.y = 0.03; actors.add(carrierRing);
  laneLines.visible = learning();
  document.getElementById('radar').style.display = 'none';
}
let seqT = 0;
function seqFrame(s, T){
  seqT = T;
  const wx = p => [s.side*p[0], p[1]];
  const bt = trackAt(s.T.ball, T), B = wx(bt.p);
  ballMesh.position.set(B[0], 0.115, B[1]); ballMesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -bt.dist/0.115);
  Object.keys(ACT).forEach(id => {
    const o = ACT[id], t = trackAt(s.T.tr[id], T), p = wx(t.p), sp = Math.hypot(t.v[0], t.v[1]);
    o.mesh.position.set(p[0], 0, p[1]); o.ex = p[0]; o.ez = p[1];
    let ya;
    if (id === 'P') ya = Math.atan2(s.u[0], s.u[1]);
    else if (sp > 2.2) ya = Math.atan2(t.v[0], t.v[1]);
    else ya = Math.atan2(bt.p[0] - t.p[0], bt.p[1] - t.p[1]);
    /* the heading settles rather than snaps: a man moving slowly keeps facing the ball, and a turn takes a few frames */
    const yaW = Math.atan2(s.side*Math.sin(ya), Math.cos(ya));
    if (o.yaw === undefined || Math.abs(T - (o.yawT || 0)) > 400) o.yaw = yaW; else o.yaw += wrapA(yaW - o.yaw)*0.18;
    o.yawT = T; o.mesh.rotation.y = o.yaw;
    const pg = o.mesh.userData.poseGait;
    if (sp > 0.6){ const name = sp > 2.3 ? 'run' : 'walk'; if (pg) pg(name, t.dist/(name === 'run' ? 3.47 : 1.67)); }
    else if (pg) pg('idle', T/1000);
    if (o.mesh.userData.pass){ const pp = id === 'P' ? passPhase(s, 'P', T) : { k: null }; o.mesh.userData.pass(pp.k, pp.o); }
  });
  const t = (T - RC.strike)/1000;
  if (carrierRing){ const R = s.T; const holder = t <= 0 ? s.passer : t < R.tTake ? null : R.tInt !== null ? trackAt(R.tr.D, T).p : (s.key === 'width' || (R.layOff && t > R.tLay + 0.9)) ? trackAt(R.tr.RB, T).p : trackAt(R.me, T).p;
    carrierRing.visible = !!holder; if (holder){ const q = wx(holder); carrierRing.position.set(q[0], 0.03, q[1]); } }
  /* his eyes: on the ball, with a little lag; a scan turns the head 90 degrees; receiving open, he is half-turned up the pitch */
  const mt = trackAt(s.T.me, T), me = wx(mt.p), msp = Math.hypot(mt.v[0], mt.v[1]);
  const lag = wx(trackAt(s.T.ball, Math.max(0, T - 150)).p);
  const yp = ypTo(me[0], me[1], lag[0], 0.5, lag[1]); yp[1] = Math.max(yp[1], -0.35);
  if (s.decided && s.action === 'open' && t > s.td){ const k = Math.min(1, (t - s.td)/0.5); const up = ypTo(me[0], me[1], me[0] - s.side*8, 1.3, me[1] - 20); yp[0] += wrapA(up[0] - yp[0])*0.45*k; yp[1] += (up[1] - yp[1])*0.3*k; }
  const sc = scanNow();
  /* the shoulder check. His chest is to the centre of the pitch, half-turned, eyes on the passer behind-
     inside. The check turns the head 105 degrees from the chest toward the shoulder he looked over, in
     0.3 s. Over the open shoulder (away from the passer) that puts the goal-side man and the touchline
     up the pitch in the picture; over the other shoulder he sees his own half, and nothing. */
  if (sc){ const chest = -s.side*Math.PI/2, look = chest + sc.dir*SCAN_TURN;
    yp[0] += wrapA(look - yp[0])*sc.k; yp[1] = yp[1] + (-0.22 - yp[1])*sc.k; }
  camYP(me[0], me[1], yp[0], yp[1]);
  /* Learn mode: while he looks, the man's distance sits over his head, so the eye learns what 5 m and 14 m look like */
  (function(){ let tag = document.getElementById('dtag');
    if (!tag){ tag = document.createElement('div'); tag.id = 'dtag'; tag.style.cssText = 'position:absolute;display:none;pointer-events:none;font-family:Barlow Condensed,sans-serif;font-size:22px;font-weight:600;letter-spacing:.08em;color:#fff27a;text-shadow:0 1px 3px #000;transform:translate(-50%,-110%)'; stage.appendChild(tag); }
    const D = ACT.D && ACT.D.mesh; if (!(sc && sc.k > 0.5 && learning() && D)){ tag.style.display = 'none'; return; }
    camera.updateMatrixWorld(); const v = new THREE.Vector3(D.position.x, 1.75, D.position.z).project(camera);
    if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1){ tag.style.display = 'none'; return; }
    const r = stage.getBoundingClientRect(), dm = Math.hypot(D.position.x - camera.position.x, D.position.z - camera.position.z);
    tag.textContent = dm.toFixed(0) + ' m'; tag.style.left = ((v.x + 1)/2*r.width) + 'px'; tag.style.top = Math.max(34, (1 - v.y)/2*r.height) + 'px'; tag.style.display = 'block'; })();
  if (msp > 0.5) camera.position.y += Math.sin(mt.dist/1.7*Math.PI)*0.035*Math.min(1, msp/4);
}
function seqTimes(){ return { end: current ? current.tFreeze : 5000 }; }
function flash(){
  setVeil(false);
  const c = current;
  offerCalls(c);
  runSequence(() => { if (current !== c) return; if (!c.decided) decide(null); else finish(); });
}
function offerCalls(c){
  const box = el('answers'); box.innerHTML = '';
  CALLS.forEach(([id, arw, lab, sub]) => {
    const b = document.createElement('button'); b.className = 'ans';
    b.innerHTML = '<span class="arw">' + arw + '</span><span class="cap">' + lab + '</span><span class="sub">' + sub + '</span>';
    b.onclick = () => { if (current === c && !c.decided && seqT >= RC.strike) decide(id, b); };
    box.appendChild(b);
  });
  el('askWord').firstChild.textContent = 'Call it';
  el('askHint').textContent = 'Before it arrives. Look first.';
}
function startScan(dir){
  if (!seqLive || scan) return false;
  scan = { dir, t0: performance.now() };
  if (current && !current.decided) current.scans.push((seqT - RC.strike)/1000);
  return true;
}
function decide(action, btn){
  const c = current; if (!c || c.decided) return;
  c.decided = true; c.action = action; c.td = action === null ? null : (seqT - RC.strike)/1000; c.late = action === null;
  c.T = tracksFor(c, action || 'open', action === null ? null : c.td);
  [...el('answers').children].forEach(b => { b.disabled = true; if (btn && b === btn) b.classList.add('part'); });
  el('askHint').textContent = action === null ? 'No call: the ball is on you.' : 'Watch what happens.';
  if (action === null) finish();
}
/* the verdict, in the Spanish school's terms */
function verdict(c){
  const act = c.action || 'open', R = c.T, key = c.key, nm = v => v.toFixed(1) + ' s', got = R.tInt === null, m = v => v.toFixed(0) + ' m';
  let tier, text;
  if (key === 'hold'){
    tier = act === 'open' ? 3 : 1;
    const far = 'He was ' + m(c.d0) + ' off, and a ' + m(c.L) + ' ball is in the air ' + nm(c.Tb) + ': from there he cannot reach it' + (c.gamble ? ', and when he went anyway at ' + nm(c.ts) + ' he arrived after it' : '') + '. ';
    text = act === 'open' ? far + 'You took it half-turned (de perfil): you see the ball and the pitch at once, and the first touch goes forward.'
         : act === 'meet' ? far + 'Coming to it is for a man who can get there: here it gave up ' + m(d2(c.you, R.pMeet)) + ' and the chance to receive facing play, for nothing.'
         : act === 'shield' ? far + 'Nobody to shield from. You set it back when you could have turned and gone forward.'
         : far + 'No marker to drag. The feint cost you half a second for nothing.';
  } else if (key === 'jump'){
    if (act === 'meet' || act === 'feint'){ tier = got ? (act === 'meet' ? 3 : 2) : 0;
      const near = 'He was ' + m(c.d0) + ' off: close enough to get to a ' + m(c.L) + ' ball, and he went at ' + nm(c.ts) + '. ';
      text = got ? near + (act === 'feint' ? 'You checked away first, which cost half a second, then came to it at ' + nm(c.td + RC.feint) : 'You came to it (desmarque de apoyo) at ' + nm(c.td)) + ' and met it ' + m(d2(c.you, R.pMeet)) + ' up the line, ' + Math.max(0.05, c.ts + runT(d2(c.def, R.pMeet), RC.defV, RC.defA) - R.tMeet).toFixed(1) + ' s before he could get there.' + (act === 'feint' ? ' With a man that close, go straight to the ball: the feint is for a man who is set and watching you.' : '')
                 : near + 'Right idea, too late: you went at ' + nm(c.td + (act === 'feint' ? RC.feint : 0)) + (act === 'feint' ? ' (after the feint)' : '') + ', and he cut it out ' + m(d2(c.you, R.pInt)) + ' in front of you. Within six metres, go as the ball leaves his foot.'; }
    else { tier = 0;
      text = 'He was ' + m(c.d0) + ' off: close enough to get to a ' + m(c.L) + ' ball. ' + (act === 'open' ? 'You stood and took it half-turned' : 'You showed and shielded') + ', and he sprinted past your shoulder, went at ' + nm(c.ts) + ' and cut it out ' + m(d2(c.you, R.pInt)) + ' in front of you. Possession lost on your own wing. A man within six metres can only be beaten by going to the ball.'; }
  } else if (key === 'tight'){
    tier = act === 'shield' ? 3 : act === 'feint' ? 2 : act === 'meet' ? 2 : 0;
    text = act === 'shield' ? 'He was on your back. You showed for it, put your body between him and the ball, and played first time to your full-back, the man facing play (de espaldas, juega de cara). Possession kept, and the ball is now going forward.'
         : act === 'feint' ? 'He was on your back. The check away dragged him a step, and you came short with ' + m(1.5) + ' of separation (fintar y salir). Good; the first-time ball back to the man facing play is the surer one.'
         : act === 'meet' ? 'He was on your back. Coming to it took it ' + m(d2(c.you, R.pMeet)) + ' away from him. Good; showing and setting it back first time keeps the width and the ball.'
         : 'He was on your back and you tried to take it half-turned: as it arrived he came round you and nicked it. With a man on your back you receive back to goal and play to the man facing play.';
  } else {
    tier = act === 'open' ? 3 : act === 'meet' ? 0 : 1;
    text = act === 'open' ? 'The ball was for your full-back underneath you, and you held your width (amplitud): their full-back stays pinned on you, your full-back receives facing play and carries it forward.'
         : act === 'meet' ? 'The ball was for your full-back. You came short into his lane: two in a lane, their full-back follows you in, and the width is gone. Read the line of the pass: it was never for you.'
         : act === 'shield' ? 'The ball was for your full-back, and nobody was on your back. Showing for it brought you into his lane; hold the width instead.'
         : 'The ball was for your full-back. The feint pulled you off your line for nothing; hold the width.';
  }
  /* the look: mirar antes de recibir */
  const callGrade = c.late ? 'Incorrect' : tier === 3 ? 'Correct' : tier > 0 ? 'Workable' : 'Incorrect';
  /* the ladder: what he did decides the call */
  const LADDER = { hold: [m(c.d0) + ' off, too far to reach a ' + m(c.L) + ' ball', 'receive open', 'take it facing play'],
                   jump: [m(c.d0) + ' off, close enough to get there', 'come to it', 'win the race'],
                   tight: ['already on your back', 'shield and set it back', 'keep the ball'],
                   width: ['not moving, and the ball was for your full-back', 'receive open', 'hold the width'] }[key];
  text = '<b>He was ' + LADDER[0] + ' → the call: ' + LADDER[1] + ', ' + LADDER[2] + '.</b> ' + text;
  const sc = c.scans.filter(t => c.td === null || t <= c.td), after = c.scans.length - sc.length, informative = sc.length > 0;
  let look, lookGrade;
  if (!c.scans.length){ look = 'You never looked. The call was a guess whatever it was.'; lookGrade = 'Incorrect'; }
  else if (!sc.length){ look = 'You looked only after you had called (' + c.scans.map(nm).join(', ') + '). A look that comes after the decision cannot inform it.'; lookGrade = 'Incorrect'; }
  else { look = 'You looked at ' + sc.map(nm).join(', ') + ' and saw him ' + m(c.d0) + ' off' + (key === 'jump' && sc.some(t => t >= c.ts) ? ', already going' : '') + '.' + (after ? ' (' + after + ' more after the call.)' : ''); lookGrade = 'Correct'; }
  if (tier === 3 && !informative && key !== 'width'){ tier = 2; look += ' Right call, but a guess: mirar antes de recibir. Check as it is struck and again as it travels.'; }
  if (c.late){ tier = 0; text = text.replace('</b> ', '</b> No call before it arrived. '); }
  return { tier, text, look, callGrade, lookGrade };
}
function finish(){
  const c = current, v = verdict(c), pts = v.tier;
  sPts += pts; sMax += 3; const k = c.side === 1 ? 'R' : 'L'; stats[k].pts += pts; stats[k].max += 3; if (pts === 3) sBest++;
  paintSides(); saveStats();
  const box = el('rank'); box.innerHTML = '';
  const row = (chip, cls, html) => { const r = document.createElement('div'); r.className = 'row' + (cls ? ' picked' : ''); r.innerHTML = (chip ? '<span class="chip ' + cls + '">' + chip + '</span>' : '') + '<span class="wy">' + html + '</span>'; box.appendChild(r); };
  const gcls = { Correct: 't3', Workable: 't1', Incorrect: 't0' };
  row('Call · ' + v.callGrade, gcls[v.callGrade], '<b>Your call: ' + (c.action ? CALL_NAME[c.action] : 'none') + '.</b> ' + v.text);
  row('Scan · ' + v.lookGrade, gcls[v.lookGrade], '<b>Your scans</b> (<i>mirar antes de recibir</i>). ' + v.look);
  row(null, '', '<b>The cues.</b> Too far to reach this ball (about 10 m on a 20 m pass, 13 m on a 30 m pass) → receive open. Within six metres → come to it, as it leaves his foot. On your back → shield, set it back. Close, set and watching you → check away, then come.');
  row(null, '', '<b>Receiving from the back, the Spanish way.</b> Take the ball half-turned (<i>de perfil</i>) so the first touch goes forward. Man coming from behind: go to the ball (<i>desmarque de apoyo</i>), he cannot get past you to it. Man on your back: receive back to goal and play first time to the man facing play (<i>de espaldas, juega de cara</i>); or drag him with a step away and come short (<i>fintar y salir</i>). Look as it is struck and again as it travels.');
  const nm = v2 => v2.toFixed(1) + ' s', m = v2 => v2.toFixed(0) + ' m';
  row(['Turnover', 'Workable', 'Good', 'Best'][pts], 't' + pts, '<b>The clock</b> (from the strike). He was ' + m(c.d0) + ' off, ' + KEY_NAME[c.key] + (c.ts !== null ? ', went at ' + nm(c.ts) : '') + ' · the ball: ' + m(c.L) + ' · your looks: ' + (c.scans.length ? c.scans.map(nm).join(', ') : 'none') + ' · your call: ' + (c.action ? CALL_NAME[c.action] + ' at ' + nm(c.td) : 'none') + ' · the ball arrived at ' + nm(c.Tb) + '.');
  drawBoard(c); document.getElementById('mapwrap').style.display = 'flex'; show(pFeed);
}
function drawBoard(s){
  const svg = document.getElementById('map'); svg.innerHTML = '';
  svg.setAttribute('viewBox', '-56 -37.5 112 75');
  svgEl('rect', { x: -100, y: -100, width: 200, height: 200, fill: '#16301d' });
  const g = svgEl('g', { id: 'world', transform: 'matrix(0 1 -1 0 0 0)' }), L = (tag, at) => svgEl(tag, at, g), W = s.side, P = p => [W*p[0], p[1]];
  L('rect', { x: -34, y: -52.5, width: 68, height: 105, class: 'pitch' });
  [-20.16, -9.16, 9.16, 20.16].forEach(x => L('line', { x1: x, y1: -52.5, x2: x, y2: 52.5, stroke: '#fff', 'stroke-width': .22, 'stroke-dasharray': '1.4 1.2', opacity: .35 }));
  L('rect', { x: -34, y: -52.5, width: 68, height: 105, class: 'ln' }); L('line', { x1: -34, y1: 0, x2: 34, y2: 0, class: 'ln' }); L('circle', { cx: 0, cy: 0, r: 9.15, class: 'ln' });
  [[-52.5, 1], [52.5, -1]].forEach(([gz, d]) => { L('rect', { x: -20.15, y: d === 1 ? gz : gz - 16.5, width: 40.3, height: 16.5, class: 'ln' }); L('rect', { x: -9.16, y: d === 1 ? gz : gz - 5.5, width: 18.32, height: 5.5, class: 'ln' }); });
  const txt = (x, z, t, size, fill, dy) => { const e = svgEl('text', { x: -z, y: x + (dy || 0), 'font-size': size, 'text-anchor': 'middle', fill: fill || '#fff' }); e.textContent = t; };
  const path = (k, col, w, dash) => { const d = k.filter((_, i) => i % 2 === 0).map((q, i) => (i ? 'L ' : 'M ') + W*q[1] + ' ' + q[2]).join(' '); if (d) L('path', { d, stroke: col, 'stroke-width': w, fill: 'none', 'stroke-dasharray': dash || 'none', opacity: .9 }); };
  const tStrike = RC.strike, tTake = tStrike + s.T.tTake*1000;
  path(s.T.ball.filter(q => q[0] >= tStrike && q[0] <= tTake), '#ffffff', .35, '1.2 .8');
  if (s.T.layOff) path(s.T.ball.filter(q => q[0] >= tStrike + s.T.tLay*1000 && q[0] <= tStrike + (s.T.tLay + 0.9)*1000), '#c6ef2f', .3, '1 .8');
  path(s.T.tr.D.filter(q => q[0] <= tTake + 600), '#ff8a70', .4);
  path(s.T.me.filter(q => q[0] <= tTake + 600), '#c6ef2f', .45);
  const dot = (p, col, r, stroke) => L('circle', { cx: p[0], cy: p[1], r, fill: col, stroke: stroke || '#200', 'stroke-width': .2 });
  for (const id in s.T.tr){ const own = id === 'P' || s.others.some(o => o.id === id && o.own); dot(P(trackAt(s.T.tr[id], tStrike).p), id === 'D' ? '#ff5a3c' : own ? '#5aa9ff' : '#ff5a3c', 1.0, own ? '#fff' : '#200'); }
  const y0 = P(s.you); dot(y0, '#c6ef2f', 1.1, '#fff'); txt(y0[0], y0[1], 'YOU', 2.0, '#c6ef2f', W === 1 ? -2.6 : 3.4);
  const rb = P(s.RB); txt(rb[0], rb[1], 'YOUR FULL-BACK', 1.6, '#8cc4ff', W === 1 ? 3.2 : -2.2);
  const dd = P(trackAt(s.T.tr.D, tStrike).p); txt(dd[0], dd[1], s.d0.toFixed(0) + ' M' + (s.ts !== null ? ', WENT AT ' + s.ts.toFixed(1) + ' S' : s.key === 'tight' ? ', ON YOUR BACK' : ', HOLDING'), 1.8, '#ff8a70', W === 1 ? 3.4 : -2.4);
  const tk = P(s.T.pTake); L('circle', { cx: tk[0], cy: tk[1], r: 1.6, fill: 'none', stroke: s.T.tInt === null ? '#c6ef2f' : '#ff5a3c', 'stroke-width': .45 });
  txt(tk[0], tk[1], s.T.tInt === null ? (s.key === 'width' ? 'HIS BALL' : s.T.layOff ? 'YOURS, THEN BACK' : 'YOURS') : 'CUT OUT', 1.9, s.T.tInt === null ? '#c6ef2f' : '#ff8a70', W === 1 ? -3.0 : 3.8);
  const at = svgEl('text', { x: 44, y: 36.6, 'font-size': 2.3, 'text-anchor': 'middle', opacity: .7 }); at.textContent = 'ATTACKING ▶';
  s.scans.forEach(t => { const q = P(trackAt(s.T.ball, tStrike + t*1000).p); L('circle', { cx: q[0], cy: q[1], r: .9, fill: 'none', stroke: '#8cc4ff', 'stroke-width': .35 }); });
  if (s.td !== null){ const q = P(trackAt(s.T.ball, tStrike + s.td*1000).p); L('circle', { cx: q[0], cy: q[1], r: .9, fill: '#c6ef2f' }); txt(q[0], q[1], 'YOUR CALL', 1.6, '#c6ef2f', W === 1 ? -2.0 : 2.8); }
}
function replayLook(){
  if (replaying || !current) return;
  replaying = true;
  const btn = el('replay'); btn.disabled = true; btn.textContent = 'Watching…';
  show(pAsk); el('askWord').firstChild.textContent = 'Watch'; el('askHint').textContent = 'The same again, with your call.'; el('answers').innerHTML = '';
  document.getElementById('mapwrap').style.display = 'none';
  const c = current;
  runSequence(() => setTimeout(() => { if (!replaying || current !== c) return; document.getElementById('mapwrap').style.display = 'flex'; show(pFeed); replaying = false; btn.disabled = false; btn.textContent = 'Replay the clip'; }, 450));
}
function prefetchNext(){}
/* the buttons were bound to the shell's functions before this script ran: rebind */
el('next').onclick = nextRep; el('replay').onclick = replayLook;
