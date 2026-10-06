# Phones and tablets: full screen while held sideways, back out when held upright.
# Computers (no touch screen) are left exactly as they are. Idempotent.
import sys
DRILLS = ('shoulder.html','movement.html','cross.html','through.html','finish.html','backpost.html',
          'snap.html','thirdman.html','third8.html','pared.html','arrive.html','shape.html','interior.html','nine.html','recall.html')
META = ('<meta name="apple-mobile-web-app-capable" content="yes">\n'
        '<meta name="mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
        '<meta name="apple-mobile-web-app-title" content="Winger">\n')
JS = r'''<script id="fs-sideways">
/* Phone or tablet held sideways: fill the whole screen, no browser bar.
   Browsers only allow full screen from a touch, so it starts on the first
   touch after the device is turned (or on Start). Turning it upright again
   leaves full screen. A computer (no touch screen) never goes full screen.
   iPhone Safari does not allow web pages to go full screen; there the drill
   runs without the browser bar when opened from the Home Screen. */
(function(){
  const touch = (navigator.maxTouchPoints || 0) > 0 && matchMedia('(pointer: coarse)').matches;
  if (!touch) return;
  const d = document, de = d.documentElement;
  const req = de.requestFullscreen || de.webkitRequestFullscreen;
  const ex = d.exitFullscreen || d.webkitExitFullscreen;
  const fsEl = () => d.fullscreenElement || d.webkitFullscreenElement;
  const mq = matchMedia('(orientation: landscape)');
  const quiet = p => { if (p && p.catch) p.catch(() => {}); };
  function enter(){
    if (!req || fsEl() || !mq.matches) return;
    try { quiet(req.call(de, { navigationUI: 'hide' })); } catch (_) {}
  }
  function leave(){ if (ex && fsEl()) { try { quiet(ex.call(d)); } catch (_) {} } }
  function turned(){ if (mq.matches) enter(); else leave(); }
  if (mq.addEventListener) mq.addEventListener('change', turned); else mq.addListener(turned);
  addEventListener('orientationchange', () => setTimeout(turned, 200));
  ['touchend', 'pointerup', 'click'].forEach(t => d.addEventListener(t, enter, { capture: true, passive: true }));
  /* the canvas follows the new size */
  const fire = () => setTimeout(() => dispatchEvent(new Event('resize')), 120);
  d.addEventListener('fullscreenchange', fire); d.addEventListener('webkitfullscreenchange', fire);
  /* iPhone in Safari: say how to get the full-screen version */
  const iPhone = /iPhone|iPod/.test(navigator.userAgent), app = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  if (iPhone && !app){
    const box = d.querySelector('#rotate span');
    if (box && !d.getElementById('fsTip')){ const t = d.createElement('span'); t.id = 'fsTip';
      t.innerHTML = 'For full screen with no browser bar: tap Share, then <b style="font:inherit;color:inherit;text-transform:none;letter-spacing:0;font-weight:600">Add to Home Screen</b>, and open Winger from there.';
      box.after(t); }
  }
})();
</script>
'''
def patch(path, drill):
    s = open(path, encoding='utf-8').read()
    if 'apple-mobile-web-app-capable' not in s:
        k = s.index('<meta name="viewport"'); k = s.index('>', k) + 1
        s = s[:k] + '\n' + META.rstrip('\n') + s[k:]
    if drill and 'id="fs-sideways"' not in s:
        k = s.rindex('</body>') if '</body>' in s else len(s)
        s = s[:k] + JS + s[k:]
    open(path, 'w', encoding='utf-8').write(s)
    print(path, 'meta', 'apple-mobile-web-app-capable' in s, 'js', 'id="fs-sideways"' in s)
if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/outputs/'
    for f in DRILLS: patch(root + f, True)
    patch(root + 'index.html', False)
