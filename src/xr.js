/* ===================== WEBXR: THE HEADSET =====================
   Pilot step 1. Installed by tools/xr_inject.py right after the camera is made, so it sits
   inside the shell's script and sees renderer, scene, camera and CFG.

   The drill keeps writing his eyes to `camera` exactly as it does on a phone (camYP, aimAt,
   the bob in the stride). On a phone that camera is what gets drawn. In the headset it is
   not: the picture comes from xrCam, which three.js drives from the headset pose, and xrCam
   rides on `rig`, a body standing where the drill puts him.
     - where he stands: the rig follows the drill's eye along the ground, every frame
     - his height: the headset's own (local-floor), not CFG.eyeHeight, and no stride bob
     - which way his body faces: latched from the drill's eye when a rep is set up, and held
       for the whole play. His head does the looking. The world never turns under him;
       the scripted ball-follow and the scripted shoulder check do not move the picture.
   After each frame the head's real world pose is copied back into `camera`, so anything that
   reads camera.position (LOOK.frame's shadow distance, the Learn tag) sees where he really is.

   Frame loop: renderer.setAnimationLoop replaces the shell's requestAnimationFrame loop.
   In an immersive session the page's own requestAnimationFrame can stop (the 2D page is
   hidden), so the drill's per-frame steps go through raf(), which hands them to the XR
   frame while a session is running and to the window otherwise. renderer.render calls made
   outside the XR frame (the resize observer, the label redraw) are skipped while presenting:
   drawn there, they would land in the headset's framebuffer with a stale pose.               */
renderer.xr.enabled = true;
const rig = new THREE.Group(); rig.name = 'rig';
const xrCam = new THREE.PerspectiveCamera(70, 1, 0.1, 300);   // three replaces its projection with each eye's
rig.add(xrCam); scene.add(rig);
let xrFloor = true;                  // false only if the browser gave no local-floor space: then lift him by CFG.eyeHeight
let inXRFrame = false;
const xrOn = () => renderer.xr.isPresenting;

/* the drill's frame steps */
let xrQ = [];
const winQ = new Map();
function raf(cb){
  if (xrOn()){ xrQ.push(cb); return 0; }
  const id = requestAnimationFrame(t => { winQ.delete(id); cb(t); });
  winQ.set(id, cb); return id;
}
function xrMoveQueues(toXR){
  if (toXR){ winQ.forEach((cb, id) => { cancelAnimationFrame(id); xrQ.push(cb); }); winQ.clear(); }
  else { const q = xrQ; xrQ = []; q.forEach(cb => raf(cb)); }
}

const _render = renderer.render.bind(renderer);
renderer.render = (s, c) => { if (xrOn() && !inXRFrame) return; _render(s, c); };
const _setSize = renderer.setSize.bind(renderer);       // the headset owns the size while presenting
renderer.setSize = (w, h, u) => { if (!xrOn()) _setSize(w, h, u); };

/* the drill's eye -> his body. A write by the drill is anything that moved `camera` since the
   head pose was copied into it at the end of the last frame. */
const xrSeen = { p: new THREE.Vector3(), q: new THREE.Quaternion(), set: false };
const xrFwd = new THREE.Vector3();
let xrYawLocked = false;
function xrFollowDrill(force){
  const wrote = force || !xrSeen.set || !camera.position.equals(xrSeen.p) || !camera.quaternion.equals(xrSeen.q);
  if (!wrote) return;
  rig.position.set(camera.position.x, xrFloor ? 0 : CFG.eyeHeight, camera.position.z);
  /* the body turns only between plays (a new rep, a review), never while the ball is live */
  const live = typeof seqLive !== 'undefined' && seqLive;
  if (force || !live || !xrYawLocked){
    xrFwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
    if (Math.hypot(xrFwd.x, xrFwd.z) > 1e-3) rig.rotation.set(0, Math.atan2(-xrFwd.x, -xrFwd.z), 0);
    xrYawLocked = live;
  }
}
const xrS = new THREE.Vector3();
function xrHeadToCamera(){
  xrCam.matrixWorld.decompose(camera.position, camera.quaternion, xrS);
  camera.updateMatrixWorld(true);
  xrSeen.p.copy(camera.position); xrSeen.q.copy(camera.quaternion); xrSeen.set = true;
}
/* where he is looking, in the drill's terms (yaw: atan2(dx, dz), left is +; pitch: up is +).
   Step 2 records this over time to grade the scan. */
function xrHeadYP(){
  xrFwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
  return [Math.atan2(xrFwd.x, xrFwd.z), Math.asin(Math.max(-1, Math.min(1, xrFwd.y)))];
}

function xrTick(){
  const now = performance.now();
  if (xrQ.length){ const q = xrQ; xrQ = []; q.forEach(cb => cb(now)); }
  LOOK.frame(actors, camera);
  if (xrOn()){
    xrFollowDrill(false);
    inXRFrame = true;
    try { renderer.render(scene, xrCam); } finally { inXRFrame = false; }
    xrHeadToCamera();
  } else renderer.render(scene, camera);
}

/* the trigger on either controller presses whatever the page is waiting on: Start session,
   Next rep, Another session. The calls come in step 3, on the thumbstick. */
function xrPress(){
  for (const id of ['start', 'next', 'again']){
    const b = document.getElementById(id);
    if (b && !b.disabled && b.offsetParent !== null){ b.click(); return id; }
  }
  return null;
}
for (let i = 0; i < 2; i++){ const c = renderer.xr.getController(i); c.addEventListener('select', xrPress); rig.add(c); }

renderer.xr.addEventListener('sessionstart', () => {
  xrMoveQueues(true); xrSeen.set = false;
  xrFollowDrill(true);
  document.body.classList.add('xr');
});
renderer.xr.addEventListener('sessionend', () => {
  xrMoveQueues(false);
  document.body.classList.remove('xr');
  /* back on the page: put the drill's own eye back */
  if (typeof resize === 'function') resize();
});

/* VRButton: the three.js one, in the page's own header style. Hidden where there is no headset. */
const VRButton = {
  createButton(renderer){
    const b = document.createElement('button');
    b.id = 'vrbtn'; b.className = 'iconbtn'; b.hidden = true; b.textContent = 'Enter VR';
    b.style.cssText = 'color:var(--go);border-color:var(--go)';
    let session = null;
    async function start(){
      const init = { optionalFeatures: ['local-floor', 'bounded-floor'] };
      try {
        const s = await navigator.xr.requestSession('immersive-vr', init);
        try { await s.requestReferenceSpace('local-floor'); xrFloor = true; }
        catch (e) { xrFloor = false; console.warn('no local-floor: standing him at CFG.eyeHeight', e); }
        renderer.xr.setReferenceSpaceType(xrFloor ? 'local-floor' : 'local');
        await renderer.xr.setSession(s);
        session = s; b.textContent = 'Exit VR';
        s.addEventListener('end', () => { session = null; b.textContent = 'Enter VR'; });
      } catch (e) { console.error('could not start VR', e); b.textContent = 'VR failed'; setTimeout(() => b.textContent = 'Enter VR', 2500); }
    }
    b.onclick = () => { if (session) session.end(); else start(); };
    if (navigator.xr && navigator.xr.isSessionSupported)
      navigator.xr.isSessionSupported('immersive-vr').then(ok => { b.hidden = !ok; }).catch(() => {});
    if (!window.isSecureContext) console.warn('WebXR needs https (GitHub Pages is fine)');
    return b;
  }
};
(function(){
  const b = VRButton.createButton(renderer), at = document.getElementById('reset');
  if (at && at.parentNode) at.parentNode.insertBefore(b, at); else document.body.appendChild(b);
})();
/* =================== END WEBXR =================== */
