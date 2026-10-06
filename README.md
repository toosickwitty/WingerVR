# Winger VR

Winger drills for the Meta Quest 3, in the headset browser via WebXR. Pilot drill: **Shoulder** (receiving from the back).

Sibling of [winger](https://github.com/toosickwitty/winger) (the phone/desktop drills, live at toosickwitty.github.io/winger). Same engine, same physics, same Spanish positional-play vocabulary; this repo is where the headset version is built without disturbing the phone site.

## What is here

- `shoulder.html` — the phone/desktop Shoulder drill as pushed on 2026-10-05, the starting point. Single file: the Shape shell (kit, camera, scanning, board, stats) with `shoulder2.js` appended so its functions override the shell's.
- `src/shape_shell.html` — the Shape shell on its own.
- `src/shoulder2.js` — the drill: `RC` constants; `candidate()` (distance bands: tight 1-2 m → shield; 4-6.5 m → come to it; beyond `reachFor(tQ)` + 2.5-5 m → receive open; one far man in three gambles late); `tracksFor()` (honest tracks, 1.1 m body rule); `seqFrame()` (camera; `scanNow()`/`startScan()` drive the look, `SCAN_TURN` 105° from the chest); `verdict()` (call and scan graded separately, Correct/Workable/Incorrect); `finish()`; `drawBoard()`.
- `src/look.js` — the LOOK kit: Mixamo rig, idle/walk/run clips, procedural pass with disguise, ball material. `inject.py` installs it into a built page.
- `tools/` — the build chain: `build_shoulder2.py` (shell + shoulder2.js → shoulder.html), `inject.py` (LOOK kit, walk-adjust rule, wind-up), `fs_inject.py` (mobile full-screen meta). Paths inside point at the old scratchpad; edit `SP` at the top of each. `three.min.js` (r128) for offline testing; the pages load it from a CDN.

## The pilot

1. `renderer.xr.enabled = true`, a VRButton, a stereo-safe render loop (the shell's `loop()` becomes `renderer.setAnimationLoop`). Eye height comes from the headset, not `CFG.eyeHeight`.
2. Head-tracked scanning replaces the scripted 0.3 s tap-scan: record real head yaw/pitch over time; grade the scan on whether the defender was actually inside the view, when, and for how long. The Learn-mode distance tag becomes a sprite in the world over his head.
3. Calls on the controller thumbstick: push toward the ball = come to it, pull back = shield, click = receive open, flick away-then-toward = check away, then come. Voice optional (Web Speech API works in the Quest browser; stamp the decision at speech start).
4. The result box as a floating panel in front of him (an HTML-to-canvas texture or three-mesh-ui).
5. Camera translation (the run after a call) stays short and player-triggered; never during a scan. Comfort first.

Rules of the house: realistic speeds for an advanced 12-14-year-old (sprint 6.0 m/s, defender 5.8, firm pass 12-13 m/s decelerating 1.2 m/s²), nothing invented tactically, and nothing goes to GitHub without Jackson looking at it first.
