"""Kura's promo soundtrack, made from nothing: every sound here is synthesized, so there is no sample or licence behind it.

python kura/promo-audio.py   writes images/promo/promo-audio.wav (44 s, 48 kHz, stereo).

120 BPM, one chord to the bar. Each scene of promo.html starts on a bar line and its moves land on the beat, so SCENE and the
sound effects below follow DRAW in promo.html: change one and the other has to move with it.
"""
from pathlib import Path
import wave

import numpy as np

SR = 48000
BEAT, BAR, DUR = .5, 2.0, 44.0
LEVEL = 10 ** (-3 / 20)  # the highest peak, which lands the whole near -15 LUFS
N = int(SR * DUR)
OUT = Path(__file__).resolve().parent / 'images/promo/promo-audio.wav'
SCENE = dict(intro=0, clean=4, edit=10, body=16, move=22, back=28, find=32, private=36, cta=40)
rng = np.random.default_rng(441)
TAU = 2 * np.pi


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def time(seconds):
    return np.arange(int(seconds * SR)) / SR


def band(x, lo, hi):
    """Keeps lo..hi Hz, with soft edges."""
    spectrum = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    gain = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(spectrum * gain, len(x))


class Bus:
    def __init__(self):
        self.a = np.zeros((2, N + SR * 4))

    def add(self, sound, at, gain=1., pan=0.):
        """A mono sound (pan -1..1) or a stereo one, starting at `at` seconds."""
        i = int(at * SR)
        if sound.ndim == 1:
            angle = (pan + 1) * np.pi / 4
            sound = np.stack([sound * np.cos(angle), sound * np.sin(angle)]) * 1.414
        n = min(sound.shape[1], self.a.shape[1] - i)
        self.a[:, i:i + n] += sound[:, :n] * gain


def reverb(x, seconds=2.0, decay=3.4, wet=.2):
    t = time(seconds)
    out = x.copy()
    size = 1 << int(np.ceil(np.log2(x.shape[1] + len(t))))
    for c in range(2):
        ir = band(rng.standard_normal(len(t)), 220, 6500) * np.exp(-t * decay)
        ir[:int(.018 * SR)] = 0
        ir /= np.sqrt((ir ** 2).sum())
        out[c] += wet * np.fft.irfft(np.fft.rfft(x[c], size) * np.fft.rfft(ir, size), size)[:x.shape[1]]
    return out


# ─────────────── instruments ───────────────
pads = {}


def pad(m, bright):
    """Three detuned voices, spread across the stereo field; `bright` sets how many partials sound."""
    key = (m, bright)
    if key not in pads:
        t = time(BAR + 1.2)
        sides = []
        for cents, side in ((-7, 0), (0, 2), (6, 1)):
            f = hz(m) * 2 ** (cents / 1200)
            voice = np.zeros(len(t))
            for k in range(1, 13):
                if f * k > 9000:
                    break
                voice += np.exp(-k / bright) / k * np.sin(TAU * f * k * t + rng.uniform(0, TAU))
            sides.append((voice, side))
        left = sum(v * (1. if s != 1 else .35) for v, s in sides)
        right = sum(v * (1. if s != 0 else .35) for v, s in sides)
        env = np.minimum(t / .28, 1) * np.clip((BAR + 1.2 - t) / 1.2, 0, 1) ** 1.5
        pads[key] = np.stack([left, right]) * env * .22
    return pads[key]


def pluck(m):
    t = time(1.1)
    f = hz(m)
    return np.sin(TAU * f * t + 2.1 * np.exp(-t * 11) * np.sin(TAU * 2 * f * t)) * np.exp(-t * 6.5) * np.minimum(t / .002, 1)


def mallet(m):
    t = time(1.8)
    f = hz(m)
    body = np.sin(TAU * f * t) + .32 * np.sin(TAU * 4 * f * t) * np.exp(-t * 13) + .1 * np.sin(TAU * 9.2 * f * t) * np.exp(-t * 34)
    return body * np.exp(-t * 3) * np.minimum(t / .0015, 1)


def bell(m, ring=2.3):
    t = time(3.)
    f = hz(m)
    return np.sin(TAU * f * t + 1.5 * np.exp(-t * 3.2) * np.sin(TAU * 3.01 * f * t)) * np.exp(-t * ring) * np.minimum(t / .002, 1)


def bass(m, seconds):
    t = time(seconds + .06)
    f = hz(m)
    s = np.tanh(1.7 * (np.sin(TAU * f * t) + .35 * np.sin(TAU * 2 * f * t)))
    return s * np.minimum(t / .005, 1) * np.clip((seconds + .06 - t) / .06, 0, 1)


def kick():
    t = time(.34)
    phase = np.cumsum(TAU * (47 + 120 * np.exp(-t * 36)) / SR)
    return np.sin(phase) * np.exp(-t * 10) + .25 * band(rng.standard_normal(len(t)), 1500, 7000) * np.exp(-t * 240)


def clap():
    t = time(.28)
    noise = band(rng.standard_normal(len(t)), 900, 5200)
    env = np.exp(-t * 19) * .8
    for at in (0, .011, .023):
        env = env + np.exp(-np.maximum(t - at, 0) * 300) * (t >= at)
    return noise * env * .32


def hat(ring=70):
    t = time(.16)
    return band(rng.standard_normal(len(t)), 7500, 16000) * np.exp(-t * ring)


# ─────────────── sound effects ───────────────
def sweep(seconds, lo, hi, q=.32, fall=.35):
    """Noise through a band that glides lo → hi: a swish whose speed is the speed of the thing moving."""
    n = int(seconds * SR)
    noise = rng.standard_normal(n)
    k = np.linspace(0, 1, n)
    fc = lo * (hi / lo) ** k
    g = 2 * np.sin(np.pi * np.minimum(fc, SR / 6) / SR)
    low = mid = 0.
    out = np.empty(n)
    for i in range(n):
        low += g[i] * mid
        high = noise[i] - low - q * mid
        mid += g[i] * high
        out[i] = mid
    env = np.minimum(k / (1 - fall), 1) ** 1.6 * np.minimum((1 - k) / fall, 1) ** 1.2
    return out * env / (np.abs(out).max() + 1e-9)


def moving(sound, pan_from, pan_to):
    pan = np.linspace(pan_from, pan_to, len(sound))
    angle = (pan + 1) * np.pi / 4
    return np.stack([sound * np.cos(angle), sound * np.sin(angle)]) * 1.414


def pop(m):
    """A soft drop of sound: the pitch leaps up as it starts."""
    t = time(.16)
    f = hz(m) * (1 + .5 * (1 - np.exp(-t * 60)))
    return np.sin(np.cumsum(TAU * f / SR)) * np.exp(-t * 34) * np.minimum(t / .001, 1)


def tick(f=2600):
    t = time(.022)
    return (np.sin(TAU * f * t) * .5 + band(rng.standard_normal(len(t)), 2500, 11000) * .7) * np.exp(-t * 330)


def key():
    t = time(.05)
    down = band(rng.standard_normal(len(t)), 1200, 6500) * np.exp(-t * 200)
    thud = np.sin(TAU * 240 * t) * np.exp(-t * 130) * .7
    return down + thud


def shutter():
    t = time(.13)
    click = band(rng.standard_normal(len(t)), 1800, 9000)
    return click * (np.exp(-t * 260) + .75 * np.exp(-np.maximum(t - .07, 0) * 240) * (t >= .07))


def thump():
    t = time(.3)
    return np.sin(np.cumsum(TAU * (58 + 42 * np.exp(-t * 26)) / SR)) * np.exp(-t * 15)


def latch():
    t = time(.2)
    return thump()[:len(t)] * .7 + band(rng.standard_normal(len(t)), 900, 5000) * (np.exp(-t * 180) + .6 * np.exp(-np.maximum(t - .05, 0) * 200) * (t >= .05))


def sizzle(seconds):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    crackle = (rng.random(n) > .9965) * rng.standard_normal(n)
    hiss = band(rng.standard_normal(n), 3500, 13000) * .22
    body = band(crackle, 1500, 9000) * 7 + hiss
    return body * np.minimum(t / .08, 1) * np.clip((seconds - t) / .45, 0, 1)


def glide(seconds, m_from, m_to):
    t = time(seconds)
    f = hz(m_from + (m_to - m_from) * t / seconds)
    return np.sin(np.cumsum(TAU * f / SR)) * np.minimum(t / .02, 1) * np.clip((seconds - t) / .05, 0, 1)


def sparkle(bus, at, gain=.1, notes=(86, 90, 93, 97, 98)):
    for i, m in enumerate(notes):
        bus.add(bell(m, 5), at + i * .0625, gain * (1 - i * .1), pan=-.5 + i * .25)


# ─────────────── the music ───────────────
D, FSM, G, A = (38, [62, 66, 69, 76]), (42, [61, 64, 66, 69]), (43, [62, 66, 67, 71]), (45, [62, 64, 69, 71])
BM = (35, [59, 62, 66, 69])
LOOP = [D, FSM, G, A]
TUNE = [[(0, 74, 1), (1, 76, .5), (1.5, 78, 1.5), (3.5, 76, .5), (4, 73, 1), (5, 76, .5), (5.5, 69, 2.5)],
        [(0, 74, 1), (1, 78, .5), (1.5, 79, 1), (2.5, 78, .5), (3, 74, 1), (4, 76, 1), (5, 73, .5), (5.5, 71, .5), (6, 69, 2)]]
BASS = [(0, 0, .45), (.5, 0, .4), (1.5, 12, .4), (2, 0, .45), (2.5, 0, .4), (3.5, 7, .4)]
ARP = [0, 2, 1, 3, 2, 1, 3, 2]
DROP = 18  # Private: the drums stop and the harmony darkens for two bars


def chord(bar):
    if bar == DROP:
        return BM
    if bar == DROP + 1:
        return G
    if bar == 20:
        return G
    if bar == 21:
        return D
    return LOOP[bar % 4]


def music():
    pads_bus, keys, low, drums, lead = Bus(), Bus(), Bus(), Bus(), Bus()
    kicks = []
    for bar in range(22):
        at = bar * BAR
        root, notes = chord(bar)
        bright = 2.2 if bar in (DROP, DROP + 1) else 3.2 if bar < 2 else 5.5 if 11 <= bar < 14 or bar >= 20 else 4.2
        for m in notes:
            pads_bus.add(pad(m, bright), at, .8)
        pads_bus.add(pad(root + 24, bright), at, .55)

        # The arpeggio: eighths to begin and in Private, sixteenths once the groove is in.
        step = .5 if bar < 2 or bar in (DROP, DROP + 1) else .25
        vel = .1 if bar < 2 else .07 if bar in (DROP, DROP + 1) else .13
        if bar < 20:
            for i in range(int(4 / step)):
                m = notes[ARP[i % 8]] + (12 if i % 8 == 5 else 0)
                keys.add(pluck(m), at + i * step * BEAT, vel * (1 if i % 4 == 0 else .72), pan=.45 * np.sin(i * 1.3))

        if 2 <= bar < DROP:
            for beat, shift, seconds in BASS:
                low.add(bass(root + shift, seconds), at + beat * BEAT, .34)
        elif bar in (DROP, DROP + 1):
            low.add(bass(root, 1.9), at, .2)
        elif bar == 20:
            low.add(bass(root, .95), at, .32)
            low.add(bass(A[0], .95), at + 1, .32)
        elif bar == 21:
            low.add(bass(root, 1.9), at, .32)

        beats = [] if bar < 2 or bar >= DROP else [0, 2] if bar >= 16 else [0, 1, 2, 3]
        for b in beats:
            drums.add(kick(), at + b * BEAT, .62)
            kicks.append(at + b * BEAT)
        if 5 <= bar < 16:
            for b in (1, 3):
                drums.add(clap(), at + b * BEAT, .36, pan=.05)
        if 4 <= bar < 16:
            for i in range(4):
                drums.add(hat(), at + (i + .5) * BEAT, .1, pan=.25)
        if 11 <= bar < 14:
            for i in range(16):
                drums.add(hat(120), at + i * .125, .05, pan=-.25)
            drums.add(hat(16), at + 1.75, .07, pan=.3)

    def play(phrase, start, voice, gain, shift=0, pan=0.):
        for beat, m, _ in TUNE[phrase]:
            lead.add(voice(m + shift), start + beat * BEAT, gain, pan=pan)

    for start_bar, voice, gain, shift in ((4, mallet, .17, 0), (8, mallet, .2, 0), (12, bell, .1, 12)):
        play(0, start_bar * BAR, voice, gain, shift, -.12)
        play(1, (start_bar + 2) * BAR, voice, gain, shift, .12)
    # A harmony under the tune where the film lifts.
    play(0, 8 * BAR, mallet, .09, -5, .3)
    play(1, 10 * BAR, mallet, .09, -5, -.3)

    # The ending: the tune's turn, and the last chord left to ring.
    for i, m in enumerate((74, 78, 81, 86)):
        lead.add(bell(m, 1.5), 40.5 + i * .25, .16, pan=-.3 + i * .2)
    lead.add(bell(90, 1.1), 42, .15)
    lead.add(bell(81, 1.2), 42, .09, pan=.3)

    # Everything but the drums ducks under the kick, which gives the groove its breath.
    duck = np.ones(pads_bus.a.shape[1])
    for k in kicks:
        i = int(k * SR)
        n = int(.3 * SR)
        duck[i:i + n] *= 1 - .42 * np.exp(-np.arange(n) / SR / .1)
    mix = pads_bus.a * duck * .42 + keys.a * (.45 + .55 * duck) + low.a * (.3 + .7 * duck) * .75 + drums.a * .85 + lead.a * 1.25
    # Echoes on the arpeggio, left then right.
    echo = np.zeros_like(mix)
    for tap in range(1, 4):
        d = int(.375 * tap * SR)
        echo[tap % 2, d:] += (keys.a[0] + keys.a[1])[:-d] * .2 * .55 ** tap
    return reverb(mix + echo, wet=.17) * shape(mix.shape[1])


def shape(n):
    """How present the music is in each scene: it builds to the move, thins for search, and nearly stops for Private."""
    at = [0, 3.5, 4, 9.5, 10, 15.5, 16, 21.5, 22, 27.5, 28, 31.5, 32, 35.5, 36, 39.5, 40, DUR]
    level = [.6, .7, .78, .78, .84, .84, .9, .9, 1, 1, .8, .8, .7, .7, .52, .52, .92, .92]
    return np.interp(np.arange(n) / SR, at, level)


def effects():
    b = Bus()
    s = SCENE

    def tags(at, count, gap=.125, gain=.15):
        for i, m in enumerate((74, 76, 78, 81, 83)[:count]):
            b.add(pop(m + 7), at + i * gap, gain)

    # Every cut gets a breath in, so a change of scene is heard as well as seen.
    for name in ('clean', 'edit', 'body', 'move', 'back', 'find', 'private', 'cta'):
        b.add(sweep(.5, 500, 6000, q=.5, fall=.12), s[name] - .46, .1)

    # Introduction: the name arrives, then the five parts.
    sparkle(b, s['intro'] + .5, .1)
    b.add(thump(), s['intro'] + .5, .15)
    tags(s['intro'] + 1.5, 5)

    # Cleanup: kept flies right on a rising pair, deleted flies left on a falling one, then the finds.
    t0 = s['clean']
    b.add(moving(sweep(.62, 500, 3800), .1, .85), t0 + 1.32, .3)
    b.add(mallet(81), t0 + 1.5, .1, pan=.3)
    b.add(mallet(86), t0 + 1.625, .1, pan=.45)
    b.add(moving(sweep(.62, 900, 240), -.1, -.85), t0 + 2.82, .32)
    b.add(mallet(74), t0 + 3, .09, pan=-.3)
    b.add(mallet(69), t0 + 3.125, .09, pan=-.45)
    for i in range(4):
        b.add(pop(81 + 2 * i), t0 + 3.5 + i * .25, .13, pan=.45)
        for j in range(5):
            b.add(tick(3000 + 240 * j), t0 + 3.56 + i * .25 + j * .03, .028, pan=.45)

    # AI edit: a sweep as the after wipes across, a glint as it lands, a shutter for each other kind.
    t0 = s['edit']
    b.add(moving(sweep(1.0, 350, 5200, q=.42, fall=.2), .55, -.55), t0 + 1, .3)
    sparkle(b, t0 + 2, .09)
    for i in range(3):
        b.add(shutter(), t0 + 3 + i * .5, .17, pan=.4)
        b.add(pop(78 + 4 * i), t0 + 3 + i * .5, .1, pan=.4)

    # Body and food: two pops, the line drawn across, then the pan's sizzle under the wipe.
    t0 = s['body']
    b.add(pop(69), t0 + 1, .15, pan=-.45)
    b.add(pop(81), t0 + 1.5, .15, pan=.45)
    b.add(moving(glide(.5, 79, 91) * .5 + sweep(.5, 2000, 7000) * .5, -.7, .7), t0 + 2, .1)
    b.add(moving(sweep(1.0, 350, 5200, q=.42, fall=.2), .55, -.55), t0 + 3.5, .24)
    b.add(sizzle(1.5), t0 + 3.55, .1)
    sparkle(b, t0 + 4.5, .08)

    # The move: six photos leave one by one, climbing, and Kura answers when the last arrives.
    t0 = s['move']
    for i in range(6):
        b.add(moving(sweep(.4, 700 + 180 * i, 4200 + 300 * i, q=.5), -.65, .55), t0 + 1 + i * .125, .13)
        b.add(pop(74 + (0, 2, 4, 7, 9, 12)[i]), t0 + 1.32 + i * .125, .09, pan=.55)
    for i, m in enumerate((74, 78, 81)):
        b.add(bell(m + 12, 2.6), t0 + 2.375 + i * .08, .12, pan=.4)
    for i in range(3):
        b.add(pop(78 + 3 * i), t0 + 3 + i * .25, .14, pan=(-.4, 0, .4)[i])

    # Backup: the count ticks up, and a clean ring as it gets there.
    t0 = s['back']
    for i in range(22):
        b.add(tick(2200), t0 + .8 + 2.6 * (i / 22) ** .8, .024, pan=-.1)
    b.add(bell(86, 3), t0 + 3.5, .13)
    b.add(bell(93, 3), t0 + 3.56, .09)

    # Search: the keys, the results, and the pins dropping on the map.
    t0 = s['find']
    for i in range(7):
        b.add(key(), t0 + .7 + i * .125 + rng.uniform(-.012, .012), .13, pan=.3)
    for i in range(4):
        b.add(pop(83 + 2 * i), t0 + 1.625 + i * .07, .07, pan=.4)
    b.add(sweep(.3, 500, 2500), t0 + 1.85, .09)
    for i in range(4):
        b.add(pop(69 + 5 * i), t0 + 2.5 + i * .125, .13, pan=.3)

    # Private: a finger on the sensor, then the lock gives.
    t0 = s['private']
    b.add(thump(), t0 + 1, .17)
    b.add(thump(), t0 + 1.25, .1)
    b.add(latch(), t0 + 2, .2)
    for i, m in enumerate((74, 81, 86)):
        b.add(bell(m, 2.2), t0 + 2.05 + i * .09, .1, pan=-.25 + i * .25)

    # The close.
    sparkle(b, s['cta'] + .25, .08)
    b.add(thump(), s['cta'] + .25, .14)
    tags(s['cta'] + .75, 5, gain=.12)
    b.add(shutter(), s['cta'] + 1.5, .1)
    return reverb(b.a, seconds=1.3, decay=5, wet=.14)


def main():
    tune, fx = music(), effects()
    mix = tune * .62 + fx * 1.5
    mix = mix[:, :N]
    t = np.arange(N) / SR
    mix = mix * np.minimum(t / .03, 1) * np.clip((DUR - t) / 1.2, 0, 1)
    # Only the very tops are rounded off, so the quiet scenes stay quiet and the effects stand out.
    mix /= np.abs(mix).max()
    knee = .7
    over = np.abs(mix) > knee
    mix[over] = np.sign(mix[over]) * (knee + (1 - knee) * np.tanh((np.abs(mix[over]) - knee) / (1 - knee)))
    mix *= LEVEL / np.abs(mix).max()
    pcm = (mix.T * 32767).astype('<i2')
    OUT.parent.mkdir(exist_ok=True)
    with wave.open(str(OUT), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(OUT, f'{N / SR:.1f} s, peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS')


if __name__ == '__main__':
    main()
