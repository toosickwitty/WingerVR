import re, sys
SP='/tmp/claude-0/-home-claude/f6571da2-cf7d-5442-9292-3dfeb2aa021f/scratchpad'
look=open(SP+'/look.js',encoding='utf-8').read()

def func_span(s, name, start=0):
    a=s.index('function '+name+'(', start)
    j=s.index('{',a); d=0
    while True:
        if s[j]=='{': d+=1
        elif s[j]=='}':
            d-=1
            if d==0: return a, j+1
        j+=1

for f in ('shoulder.html','movement.html','cross.html','through.html','finish.html','backpost.html','snap.html','thirdman.html','third8.html','pared.html','arrive.html','shape.html','interior.html','nine.html','recall.html'):
    p='/mnt/user-data/outputs/'+f
    s=open(SP+'/backup/'+f,encoding='utf-8').read()      # always from the untouched copy

    # 1. the visual kit, ahead of the 3D section
    anchor='/* ---------------- 3D ---------------- */'
    assert s.count(anchor)==1, f
    s=s.replace(anchor, look+'\n'+anchor)

    # 2. world: sky, light, shadows, pitch, stadium
    old_world="""scene.background = new THREE.Color(0x0a1410);
scene.fog = new THREE.Fog(0x0a1410, 60, 130);
scene.add(new THREE.HemisphereLight(0xd6e8ff, 0x24422d, 0.95));
const sun = new THREE.DirectionalLight(0xffffff, 0.85);
sun.position.set(-25, 40, 25); scene.add(sun);"""
    assert old_world in s, f
    s=s.replace(old_world, "const sun = LOOK.setupWorld(renderer, scene);   // sky, stadium, pitch, light and shadow")

    # 3. the old flat turf is replaced by the pitch in setupWorld
    after=s.index(anchor)            # the drill's own code starts at the 3D section
    a,b=func_span(s,'turfTexture',after)
    s=s[:a]+s[b:]
    g0=s.index('const ground = new THREE.Mesh(new THREE.PlaneGeometry(150,160),')
    g1=s.index('ground.rotation.x = -Math.PI/2; scene.add(ground);')+len('ground.rotation.x = -Math.PI/2; scene.add(ground);')
    s=s[:g0]+s[g1:]

    # 4. the player
    a,b=func_span(s,'makePlayer',s.index(anchor))
    s=s[:a]+'const makePlayer = LOOK.makePlayer;   // the footballer lives in LOOK above'+s[b:]
    for old in ("const SKINS = [0xf2d8b8, 0xe8c9a0, 0xc9985f, 0x9a6238, 0x6b4126];",
                "const HAIRS = [0x2a1d16, 0x14100c, 0x5a3a20, 0x8f7040, 0x1c1c1c];",
                "const BOOTS = [0xf2f5ef, 0xf5d33a, 0xff4f9d, 0x2ee6a8, 0x1a1a1a, 0xff8a2b];"):
        assert old in s, (f, old)
    s=s.replace("const SKINS = [0xf2d8b8, 0xe8c9a0, 0xc9985f, 0x9a6238, 0x6b4126];",
                "const SKINS = LOOK.SKINS, HAIRS = LOOK.HAIRS, BOOTS = LOOK.BOOTS;")
    s=s.replace("const HAIRS = [0x2a1d16, 0x14100c, 0x5a3a20, 0x8f7040, 0x1c1c1c];\n","")
    s=s.replace("const BOOTS = [0xf2f5ef, 0xf5d33a, 0xff4f9d, 0x2ee6a8, 0x1a1a1a, 0xff8a2b];\n","")

    # 5. a proper match ball, casting a shadow
    s=re.sub(r"const bl = new THREE\.Mesh\(new THREE\.SphereGeometry\(0\.115, ?10, ?8\),\s*new THREE\.MeshLambertMaterial\(\{ color: 0xf7f7f2 \}\)\);",
             "const bl = new THREE.Mesh(new THREE.SphereGeometry(0.115, 24, 16), LOOK.ballMaterial());\n  bl.castShadow = true;", s)

    # 5b. tell the rig who is backpedalling, so the captured walk runs in reverse for them
    old_look = "{ skin: pick(SKINS), hair: pick(HAIRS), boot: pick(BOOTS) });"
    assert s.count(old_look) == 1, f
    s = s.replace(old_look, "{ skin: pick(SKINS), hair: pick(HAIRS), boot: pick(BOOTS), back: !!opt.backpedal, pre: opt.pre });")

    # 6. shadows follow the action
    old_loop="function loop(){ renderer.render(scene,camera); requestAnimationFrame(loop); }"
    assert old_loop in s, f
    s=s.replace(old_loop, "function loop(){ LOOK.frame(actors, camera); renderer.render(scene,camera); requestAnimationFrame(loop); }")

    # 7. the 3D view follows its box, not just the window: panels swapping
    #    under it change its height, which used to stretch the picture
    old_rs = "addEventListener('resize', resize);"
    assert s.count(old_rs) == 1, f
    s = s.replace(old_rs, old_rs + "\nif (window.ResizeObserver) new ResizeObserver(() => { resize(); const ft = document.querySelector('footer'); if (ft) ft.scrollTop = 0; if (labels.style.display === 'block' && labels.innerHTML){ renderer.render(scene,camera); drawLabels(); } }).observe(stage);")

    # 8. landscape phones: the panel sits beside the pitch so the picture keeps its full height
    css = """
@media (orientation:landscape) and (max-height:500px){
  /* a phone on its side: every pixel of height goes to the pitch */
  header{padding:4px 12px;gap:10px} .mark{font-size:17px} .meta{font-size:13px}
  .iconbtn{padding:3px 8px;font-size:12px}
  .sides{padding:0 12px 4px} .side .lab{font-size:11px;margin-bottom:2px} .track{height:3px}
  .big{font-size:34px} .sub{font-size:13px}
  /* during the look: the pitch gets the full width, answers sit in one short row */
  footer{padding:7px 10px calc(7px + env(safe-area-inset-bottom))}
  .ask{font-size:20px;margin-bottom:6px}
  .ask small{display:inline;margin:0 0 0 8px;font-size:12px}
  .answers{grid-template-columns:repeat(4,1fr);gap:6px}
  .ans{min-height:0;padding:8px 7px;font-size:15px}
  .ans .sub{font-size:10px;margin-top:3px}
  /* reading the review: the panel moves beside the pitch so the picture keeps its height */
  body:has(#panelFeedback:not(.hide)), body:has(#panelSummary:not(.hide)), body:has(#panelIdle:not(.hide)){
    display:grid;grid-template-columns:minmax(0,1fr) minmax(290px,40%);grid-template-rows:auto auto minmax(0,1fr)}
  body:has(#panelFeedback:not(.hide)) header, body:has(#panelSummary:not(.hide)) header, body:has(#panelIdle:not(.hide)) header{grid-column:1 / -1}
  body:has(#panelFeedback:not(.hide)) .sides, body:has(#panelSummary:not(.hide)) .sides, body:has(#panelIdle:not(.hide)) .sides{grid-column:1;grid-row:2}
  body:has(#panelFeedback:not(.hide)) #stage, body:has(#panelSummary:not(.hide)) #stage, body:has(#panelIdle:not(.hide)) #stage{grid-column:1;grid-row:3}
  body:has(#panelFeedback:not(.hide)) footer, body:has(#panelSummary:not(.hide)) footer, body:has(#panelIdle:not(.hide)) footer{
    grid-column:2;grid-row:2 / 4;overflow-y:auto;border-top:0;border-left:1px solid var(--line);padding:10px}
  .row{padding:6px 8px;gap:7px} .row .wy{font-size:12px;line-height:1.35}
  .rank{gap:4px;margin-bottom:8px}
  .cta{padding:11px;font-size:17px}
  .tag{font-size:11.5px;padding:1px 5px}
}
"""
    assert s.count("</style>") == 1, f
    s = s.replace("</style>", css + "</style>")

    # 9. feet that match the ground covered: nobody under a shuffle is moved at all,
    #    and a backpedal faces straight away from where he is going (eyes still on the ball)
    a = "  const run = mps * (CFG.flashMs/1000);"
    assert s.count(a) == 1, f
    s = s.replace(a, "  const run = mps < 0.15 ? 0 : mps * (CFG.flashMs/1000);")
    a = "  const faceYaw = opt.backpedal ? toRec : moveYaw;"
    assert s.count(a) == 1, f
    s = s.replace(a, "  const faceYaw = opt.backpedal ? moveYaw + Math.PI : moveYaw;")

    # 10. keepers stand set and square to the ball: no walking across the goal side-on
    a = "  opt = opt || {};\n  const speed = opt.speed || 0;"
    assert s.count(a) == 1, f
    s = s.replace(a, "  opt = opt || {};\n  if (kind === 'gk') opt = Object.assign({}, opt, { speed:0, mps:0, backpedal:false, pre:0 });\n  const speed = opt.speed || 0;")

    # 11. the rest of the regulation markings: penalty arc (the D) and centre circle, 9.15 m
    a = "stripe(0,-41.5,0.35,0.35);"
    if 'const LW = 0.12, HL = 52.5' in s: a = "\x00already-a-full-pitch"   # Shape, Interior, Nine draw both ends themselves
    else: assert s.count(a) == 1, f
    s = s.replace(a, a + """
(function arcs(){                                                  // 9.15 m from the spot, outside the box only
  const seg = (x0, z0, x1, z1) => { const L = Math.hypot(x1-x0, z1-z0), m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, L), lineMat);
    m.position.set((x0+x1)/2, 0.011, (z0+z1)/2); m.rotation.y = Math.atan2(x1-x0, z1-z0); scene.add(m); };
  const lim = Math.acos(5.5/9.15);
  for (let i = 0; i < 16; i++){ const a0 = -lim + 2*lim*i/16, a1 = -lim + 2*lim*(i+1)/16;
    seg(9.15*Math.sin(a0), -41.5 + 9.15*Math.cos(a0), 9.15*Math.sin(a1), -41.5 + 9.15*Math.cos(a1)); }
  for (let i = 0; i < 48; i++){ const a0 = 2*Math.PI*i/48, a1 = 2*Math.PI*(i+1)/48;
    seg(9.15*Math.sin(a0), 9.15*Math.cos(a0), 9.15*Math.sin(a1), 9.15*Math.cos(a1)); }
  stripe(0, 0, 0.3, 0.3);                                        // centre spot
})();""")

    # 12. nobody creeps in slow motion: under walking pace a player stands; walkers stroll at a natural tempo
    a = "  const mps = opt.mps === undefined ? speed * CFG.mps.sprint : opt.mps;"
    assert s.count(a) == 1, f
    s = s.replace(a, "  let mps = opt.mps === undefined ? speed * CFG.mps.sprint : opt.mps;\n"
      "  /* Nobody at this level stands still while the ball is live. Slower than a walk would look like\n"
      "     slow-motion skating, so he adjusts at a real walk (1.3-1.7 m/s) instead: along his own line if he\n"
      "     has one, otherwise toward the ball. Only the keeper and a man told to hold (feet set) stay put. */\n"
      "  let driftToBall = false;\n"
      "  if (kind !== 'gk' && !opt.hold && mps < 1.3){\n"
      "    if (speed <= 0.05 || Math.hypot(moveOx - ox, moveOz - oz) < 0.05) driftToBall = true;\n"
      "    mps = 1.3 + Math.random()*0.4;\n"
      "  }\n"
      "  if (opt.hold) mps = 0;")
    a = "  const moveYaw = speed > 0.05\n"
    assert s.count(a) == 1, f
    s = s.replace(a, "  const moveYaw = !driftToBall && speed > 0.05\n")
    a = "if (opt.pre === undefined) opt.pre = mps >= 2.4 ? 1.4 : (mps >= 0.35 ? Math.min(mps, 1.0) : 0);"
    if a in s: s = s.replace(a, "if (opt.pre === undefined) opt.pre = mps >= 2.4 ? 1.4 : (mps >= 1.2 ? 1.3 : 0);")

    # 13. a way back to the list of drills, beside Reset
    btn = '<button class="iconbtn" id="reset">Reset</button>'
    assert s.count(btn)==1, f
    s=s.replace(btn, '<a class="iconbtn" id="home" href="index.html" aria-label="All drills">&lsaquo; Drills</a>\n  '+btn)
    rot = '<span>This drill needs the whole width of the pitch in one look.</span>'
    if s.count(rot)==1: s=s.replace(rot, rot+'\n  <a class="iconbtn" href="index.html" style="margin-top:6px">&lsaquo; All drills</a>')
    s=s.replace('</style>', 'a.iconbtn{text-decoration:none;display:inline-flex;align-items:center;white-space:nowrap}\n@media (max-width:480px){ header{gap:8px;padding-left:10px;padding-right:10px} .iconbtn{padding:4px 7px;font-size:12px} }\n</style>', 1)
    # 13b. the passer's wind-up is the kit's pass (plant, hips, backswing, contact), not a leg draw
    a = """function windUp(k){
  if (!passerRig) return;
  const draw = Math.max(0, (k - 0.45) / 0.55);
  const legs = passerRig.userData.legs || [];
  legs.forEach(({ leg, knee }, i) => {
    if (i === 0){ leg.rotation.x = -draw*0.75; knee.rotation.x = draw*0.95; }
    else { leg.rotation.x = draw*0.22; knee.rotation.x = 0.12; }
  });
  passerRig.userData.upper.rotation.x = draw*0.16;
  passerRig.rotation.z = -draw*0.05;
}"""
    a2 = a.replace("const draw = Math.max(0, (k - 0.45) / 0.55);", "const draw = Math.max(0, (k - 0.45) / 0.55);          // nothing for the first half")
    if a2 in s: a = a2
    if a in s:
        s = s.replace(a, """/* k runs 0 to 1 up to the strike: the kit plays the real pass (a glance at the target, the plant
   foot beside the ball, hips open, backswing, contact); after it, the follow-through */
let windLast = 0;
function windUp(k){
  if (!passerRig || !passerRig.userData.pass) return;
  const r = (typeof current !== 'undefined' && current && current.zBase !== undefined) ? ((Math.abs(current.zBase)*7919) % 100)/100 : 0.5;   // disguise: about one rep in four
  const dis = r < 0.25, feint = r < 0.12 ? (r < 0.06 ? 1 : -1) : 0;
  if (k > 0){ passerRig.userData.pass(-1 + 1.7*Math.min(1, k), { foot: 'R', power: 0.6, open: 0.7, look: dis ? 0 : 1, feint }); windLast = k >= 1 ? performance.now() : 0; }
  else { const e = performance.now() - windLast;
    if (windLast && e < 450) passerRig.userData.pass(0.7 + 0.5*Math.min(1, e/450)); else { windLast = 0; passerRig.userData.pass(null); } }
}""")
    # 14. on a computer: space bar for the next rep, R to replay
    keys = '''
/* keyboard: space = next rep, R = replay (whichever is on screen) */
addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const on = id => { const b = document.getElementById(id); return b && b.offsetParent !== null && !b.disabled ? b : null; };
  if (e.code === 'Space' || e.key === ' '){ e.preventDefault(); if (e.repeat) return; const b = on('next'); if (b) b.click(); }
  else if (e.key === 'r' || e.key === 'R'){ if (e.repeat) return; const b = on('replay'); if (b){ e.preventDefault(); b.click(); } }
});
'''
    k = s.rindex('</script>')
    s = s[:k] + keys + s[k:]
    open(p,'w',encoding='utf-8').write(s)
    look_end=s.index('return { LEGSIGN, setupWorld')
    print(f, 'installed | LOOK makePlayer kept:', s.count('function makePlayer(', 0, look_end)==1,
          '| drill makePlayer removed:', s.count('function makePlayer(', look_end)==0, '| ball upgraded:', s.count('LOOK.ballMaterial()')-1)

# phones/tablets: full screen when sideways
import subprocess, os
subprocess.run(["python3", os.path.join(os.path.dirname(os.path.abspath(__file__)), "fs_inject.py")], check=True)
