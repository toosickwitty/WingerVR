# WebXR, pilot step 1: installs src/xr.js into a built Shoulder page and hands the shell's frame
# loop to renderer.setAnimationLoop. Run it last, after build_shoulder2.py, inject.py and fs_inject.py.
#   python3 tools/xr_inject.py shoulder.html            (in place)
#   python3 tools/xr_inject.py in.html out.html
# Re-running on a page that already has it replaces the XR block with the current src/xr.js.
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'shoulder.html')
dst = sys.argv[2] if len(sys.argv) > 2 else src
s = open(src, encoding='utf-8').read()
xr = open(os.path.join(ROOT, 'src', 'xr.js'), encoding='utf-8').read().rstrip() + '\n'

def R(old, new, n=1):
    global s
    c = s.count(old); assert c == n, (c, old[:90]); s = s.replace(old, new)

BEGIN, END = '/* ===================== WEBXR: THE HEADSET', '/* =================== END WEBXR =================== */\n'
if BEGIN in s:                                   # already installed: swap in the current block
    a = s.index(BEGIN); b = s.index(END, a) + len(END)
    s = s[:a] + xr + s[b:]
else:
    cam = 'const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);\n'
    R(cam, cam + '\n' + xr)
    # the drill's per-frame step goes through raf(), so it keeps running inside an XR session
    R('    if (T < end){ requestAnimationFrame(step); return; }', '    if (T < end){ raf(step); return; }')
    # the shell's loop becomes the XR-safe animation loop
    R('function loop(){ LOOK.frame(actors, camera); renderer.render(scene,camera); requestAnimationFrame(loop); }',
      'function loop(){ renderer.setAnimationLoop(xrTick); }   // xrTick: src/xr.js')
open(dst, 'w', encoding='utf-8').write(s)
print('xr ok', dst, len(s)//1024, 'KB')
