# Shoulder v2: receiving from the back. The Shape page is the shell (kit, scanning, camera, board,
# stats); the drill itself is shoulder2.js, appended so its functions replace Shape's.
SP='/tmp/claude-0/-home-claude/f6571da2-cf7d-5442-9292-3dfeb2aa021f/scratchpad'
s = open(SP + '/backup/shape.html', encoding='utf-8').read()
def R(old, new, n=1):
    global s
    c = s.count(old); assert c == n, (c, old[:90]); s = s.replace(old, new)
R("<title>Shape — juego de posición off the ball</title>", "<title>Shoulder — receiving from the back</title>")
R('<div class="mark">Shape<span>.</span></div>', '<div class="mark">Shoulder<span>.</span></div>')
R("const KEY = 'shape:v1';", "const KEY = 'shoulder:recv:v3';")
s = s.replace('</style>', '.ans .sub b{color:var(--go);font-weight:600}</style>', 1)
R('<div class="sub" id="veilSub">Five lanes. When it freezes: your lane, and your line.</div>',
  '<div class="sub" id="veilSub">A ball from your defensive line. Look over your shoulder while it travels, then call it.</div>')
a = s.index('<p class="note">16 reps, about five minutes. Spanish positional play'); b = s.index('</p></p></p>', a) + len('</p></p></p>')
s = s[:a] + '''<p class="note">16 reps, about six minutes. The ball is played to you on the wing from your own defensive line, 17-26 m, at a top-level youth pace. While it travels, <b>look over your shoulder</b> (tap the left or right half of the screen; on a computer the &larr; &rarr; keys) &mdash; 0.3 s each, as often as you like &mdash; and <b>call it before it arrives</b>, in the terms the Spanish school uses: <b>Receive open</b>, stay and take it half-turned (<i>de perfil</i>); <b>Come to it</b>, the supporting unmarking movement (<i>desmarque de apoyo</i>); <b>Shield, set it back</b>, body between him and the ball and first time to the man facing play (<i>de espaldas, juega de cara</i>); <b>Check away, then come</b>, a step toward goal to drag him, then come short (<i>fintar y salir</i>).<br><br>The read is <b>his distance against the length of the ball</b>. Tight on your back (1-2 m): shield. Close enough to get there (4-6 m): come to it, as the ball leaves his foot &mdash; he goes early, and if you stand still he cuts it out. Too far to reach a ball this long (10 m and more on a 20 m pass, 13 m on a 30 m pass): receive open and take it facing play &mdash; now and then he gambles from there anyway, and arrives after it. One look, before the strike or as it travels, is enough to read the distance (mirar antes de recibir). In Learn, his distance sits over his head while you look, so the eye learns what 5 m and 14 m look like. Everything after your call is played out: who gets there first, and by how much.<br><br><b>Learn</b> paints the lanes on the grass. <b>Test</b> takes that away.</p>''' + s[b:]
pass
s = s.replace("Replay the clip and your run", "Replay the clip")
R("const SCAN_OUT = 110, SCAN_HOLD = 130, SCAN_BACK = 110;", "const SCAN_OUT = 130, SCAN_HOLD = 170, SCAN_BACK = 120;   // a full shoulder check, head and shoulders: about 0.4 s")
R("  hFov: 100,                        // HORIZONTAL degrees: a winger's picture, both lines and the ball", "  hFov: 82,                         // HORIZONTAL degrees: facing his own passer, 20-30 m away")
s += '\n<script>\n' + open(SP + '/shoulder2.js', encoding='utf-8').read() + '\n</script>\n'
open(SP + '/backup/shoulder.html', 'w', encoding='utf-8').write(s); print('shoulder v2 ok', len(s)//1024, 'KB')
