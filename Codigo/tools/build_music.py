#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_music.py · Música de fondo original de "DF · Decisión Final"
===================================================================
Sintetiza desde cero (composición propia, sin samples y sin descargas) la pista
que suena durante el quiz del tribunal y la escribe como WAV PCM 16-bit,
44100 Hz, estéreo:  assets/audio/musica-quiz.wav

Solo usa la stdlib de Python (wave, math, struct, array, random): no hace falta
ffmpeg ni numpy. Ejecutar desde la carpeta Codigo/:

    python tools/build_music.py

Ficha musical
-------------
Tonalidad  Re menor (menor natural con Si bemol).
Compás     4/4 a 120 BPM -> la negra dura 0,5 s y el compás 2 s.
Duración   32 compases = 64,000 s exactos, pensados como LOOP PERFECTO:
           el cc.32 es una cadencia que se apaga ~0,2 s antes del cierre y el
           borde inicial ataca en 55 ms, así que la unión no "pega".
Estructura cc.1-8   introducción (bajo + pulso armónico, sin melodía)
           cc.9-16  tema A  ("la pregunta": lead staccato de corcheas)
           cc.17-24 tema B  ("la respuesta": registro alto, otra progresión)
           cc.25-32 reexposición de A con contramelodía + cierre que reabre.
Voces      bajo (cuadrada 50%), lead (cuadrada 25% con vibrato), armonía
           (triángulo en corcheas), contramelodía (triángulo), percusión NES.

Mezcla: ganancia propia por voz, paneo sutil en lead y contramelodía,
saturación suave (tanh) sin recorte duro y pico normalizado a 0,72: la música es
un fondo (el juego la atenúa a 0,5 y deja aire para los efectos de sonido).
"""

import math
import os
import struct
import sys
import time
import wave
from array import array
from random import Random

if hasattr(sys.stdout, "reconfigure"):                # consolas Windows (cp1252)
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# --------------------------------------------------------------------------
# 1 · Reloj y salida
# --------------------------------------------------------------------------
SR = 44100                       # muestras por segundo
BPM = 120.0
BEAT = 60.0 / BPM                # 0,5 s  (una negra)
BAR = 4.0 * BEAT                 # 2,0 s  (un compás de 4/4)
BARS = 32                        # 32 compases
EIGHTH = BEAT / 2.0              # 0,25 s (corchea: pulso base del chiptune)
TOTAL_SEC = BARS * BAR           # 64,0 s exactos = múltiplo perfecto del compás
TOTAL = int(round(TOTAL_SEC * SR))
TAU = 2.0 * math.pi

PEAK_TARGET = 0.72               # pico final, muy lejos del clipping
EDGE_FADE = 0.055                # ataque suave del borde inicial (costura del loop)

OUT_DIR = os.path.join("assets", "audio")
OUT_WAV = os.path.join(OUT_DIR, "musica-quiz.wav")
OUT_LIC = os.path.join(OUT_DIR, "LICENCIA.txt")

VOICES = ["lead", "bajo", "armonía", "contramelodía", "percusión"]

# --------------------------------------------------------------------------
# 2 · Notas y afinación
# --------------------------------------------------------------------------
_SEMITONE = {"C": 0, "B#": 0, "Cb": 11, "D": 2, "Db": 1, "C#": 1, "E": 4, "Eb": 3,
             "D#": 3, "F": 5, "E#": 5, "Gb": 6, "F#": 6, "G": 7, "Ab": 8, "G#": 8,
             "A": 9, "Bb": 10, "A#": 10, "B": 11}


def n(name):
    """'D5' -> 74 · número MIDI (La 4 = 69 = 440 Hz)."""
    return (int(name[-1]) + 1) * 12 + _SEMITONE[name[:-1]]


def hz(midi_id):
    """Frecuencia del temperamento igual."""
    return 440.0 * 2.0 ** ((midi_id - 69) / 12.0)


# --------------------------------------------------------------------------
# 3 · Osciladores (devuelven (muestra, fase_final) para encadenar sin golpe)
# --------------------------------------------------------------------------
def square(dut, freq, phase=0.0, duty=0.5, vib_hz=5.5, vib_depth=0.0, sr=SR):
    """Cuadrada de duty variable (25% / 50%: la firma sonora de la NES).
    vib_depth = desviación de frecuencia en tanto por uno (0.004 = ±0,4%)."""
    m = int(round(dut * sr))
    out = [0.0] * m
    p = phase
    inc = freq / sr
    k = 0.0
    for i in range(m):
        if vib_depth:
            k = min(1.0, (i / sr) / 0.08)          # el vibrato entra crescendo
            p += inc * (1.0 + vib_depth * k * math.sin(TAU * vib_hz * i / sr))
        else:
            p += inc
        if p >= 1.0:
            p -= math.floor(p)
        out[i] = 1.0 if p < duty else -1.0
    return out, p


def saw(dut, freq, phase=0.0, sr=SR):
    """Diente de sierra (por si se quiere un lead más ancho)."""
    m = int(round(dut * sr))
    out = [0.0] * m
    p = phase
    inc = freq / sr
    for i in range(m):
        p += inc
        if p >= 1.0:
            p -= math.floor(p)
        out[i] = 2.0 * p - 1.0
    return out, p


def tri(dut, freq, phase=0.0, sr=SR):
    """Triángulo: armonía y contramelodía, redondas y no invasivas."""
    m = int(round(dut * sr))
    out = [0.0] * m
    p = phase
    inc = freq / sr
    for i in range(m):
        p += inc
        if p >= 1.0:
            p -= math.floor(p)
        out[i] = 4.0 * abs(p - 0.5) - 1.0
    return out, p


def sine(dut, freq, phase=0.0, sr=SR):
    """Seno (base del bombo)."""
    m = int(round(dut * sr))
    out = [0.0] * m
    p = phase
    inc = freq / sr
    for i in range(m):
        p += inc
        if p >= 1.0:
            p -= math.floor(p)
        out[i] = math.sin(TAU * p)
    return out, p


def noise(dut, rng, sr=SR):
    """Ruido blanco reproducible (semilla fija): base de caja y hi-hat."""
    m = int(round(dut * sr))
    return [rng.random() * 2.0 - 1.0 for _ in range(m)]


# --------------------------------------------------------------------------
# 4 · Envolvente ADSR lineal (siempre termina en 0 -> costura de loop limpia)
# --------------------------------------------------------------------------
def adsr(dut, a=0.004, d=0.06, s=0.6, r=0.05, peak=1.0, floor=0.0, sr=SR):
    """Ataque, caída a `s` (sustain), mantenimiento y liberación hasta `floor`.
    Si la nota dura menos que A+D+R se reescalan proporcionalmente, de modo que
    NINGUNA voz quede abierta al final del compás 32."""
    m = int(round(dut * sr))
    if m <= 1:
        return [0.0] * max(m, 0)
    while a + d + r > dut * 0.98:
        a, d, r = a * 0.9, d * 0.9, r * 0.9
    na = max(int(round(a * sr)), 1)
    nd = max(int(round(d * sr)), 1)
    nr = max(int(round(r * sr)), 1)
    nh = max(m - na - nd - nr, 0)
    out = [0.0] * m
    i = 0
    for j in range(na):                            # ataque
        out[j] = floor + (peak - floor) * (j / na)
    i += na
    for j in range(nd):                            # caída al sustain
        out[i + j] = peak - (peak - s) * (j / nd)
    i += nd
    for j in range(nh):                            # mantenimiento
        out[i + j] = s
    i += nh
    for j in range(nr):                            # liberación a cero
        out[i + j] = s + (floor - s) * (j / nr)
    return out


# --------------------------------------------------------------------------
# 5 · Filtros para la percusión de ruido
# --------------------------------------------------------------------------
def lowpass(data, fc, sr=SR):
    """Paso bajo de un polo."""
    k = math.exp(-TAU * fc / sr)
    b = 1.0 - k
    out = [0.0] * len(data)
    acc = 0.0
    for i, x in enumerate(data):
        acc = b * x + k * acc
        out[i] = acc
    return out


def highpass(data, fc, sr=SR):
    """Paso alto = señal - paso bajo (se aplica dos veces para 12 dB/oct)."""
    lp = lowpass(data, fc, sr)
    return [x - l for x, l in zip(data, lp)]


def bandpass(data, f0, q=1.0, sr=SR):
    """Biquad paso-banda (RBJ): da cuerpo a la caja sin picos."""
    w0 = TAU * f0 / sr
    al = math.sin(w0) / (2.0 * q)
    a0 = 1.0 + al
    b0, b1, b2 = al / a0, 0.0, -al / a0
    a1, a2 = -2.0 * math.cos(w0) / a0, (1.0 - al) / a0
    out = [0.0] * len(data)
    x1 = x2 = y1 = y2 = 0.0
    for i, x0 in enumerate(data):
        y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        out[i] = y0
        x2, x1 = x1, x0
        y2, y1 = y1, y0
    return out


# --------------------------------------------------------------------------
# 6 · Armonía: progresión por compás
#     i - VI - III - VII = Dm - Bb - F - C   (introducción, tema A, reexposición)
#     cc.17-20: i - VII - VI - V  (Dm - C - Bb - A)  -> tensión del tema B
#     cc.21-24: i - VII - VI - v  (Dm - C - Bb - G)  -> puente de vuelta
# --------------------------------------------------------------------------
PROGRESSION = {
    1:  ["Dm", "Bb", "F", "C", "Dm", "Bb", "F", "C"],        # cc. 1- 8
    9:  ["Dm", "Bb", "F", "C", "Dm", "Bb", "F", "C"],        # cc. 9-16  tema A
    17: ["Dm", "C", "Bb", "A", "Dm", "C", "Bb", "G"],        # cc.17-24  tema B
    25: ["Dm", "Bb", "F", "C", "Dm", "Bb", "F"],             # cc.25-31  reexposición
    32: ["Dm"],                                             # cc.32     cadencia de cierre
}
BAR_CHORD = {}
for _start, _seq in PROGRESSION.items():
    for _i, _ch in enumerate(_seq):
        BAR_CHORD[_start + _i] = _ch

VOICING = {                       # tríadas cerradas en el registro de la armonía
    "Dm": ("D4", "F4", "A4"),
    "Bb": ("Bb3", "D4", "F4"),
    "F":  ("C4", "F4", "A4"),
    "C":  ("C4", "E4", "G4"),
    "A":  ("A3", "E4"),           # quinta al aire: dominante sin tercera, no choca
    "G":  ("G3", "Bb3", "D4"),
}
BASS_ROOT = {"Dm": "D2", "Bb": "Bb1", "F": "F2", "C": "C2", "A": "A1", "G": "G1"}
FIFTH = {"Dm": "A2", "Bb": "F2", "F": "C3", "C": "G2", "A": "E2", "G": "D2"}

# Rasgueo del bajo (8 corcheas por compás): 0 = fundamental, 1 = quinta, . = silencio
BASS_PATTERN = {
    "intro":   ["0", ".", "0", "0", ".", "0", ".", "1"],
    "main":    ["0", "0", "1", "0", "0", "0", "1", "0"],
    "tension": ["0", ".", "0", "1", "0", ".", "1", "0"],
    "final":   ["0", ".", ".", ".", ".", ".", ".", "."],
}

# --------------------------------------------------------------------------
# 7 · Melodías (posición y duración en corcheas, desde el compás de referencia)
#     cc.1-8 van sin melodía: la "pregunta" entra recién en el compás 9.
# --------------------------------------------------------------------------
THEME_A_BODY = [
    # c.9  (Dm)  motivo "pregunta" en corcheas, staccato
    (0, 1, "D5"), (1, 1, "D5"), (2, 1, "F5"), (3, 1, "A5"),
    (4, 1, "G5"), (5, 1, "F5"), (6, 1, "D5"),
    # c.10 (Bb)
    (8, 1, "D5"), (9, 1, "D5"), (10, 1, "F5"), (11, 1, "A5"),
    (12, 1, "Bb5"), (13, 1, "F5"), (14, 1, "D5"),
    # c.11 (F)
    (16, 1, "C6"), (17, 1, "A5"), (18, 1, "F5"), (19, 1, "A5"),
    (20, 1, "C6"), (21, 1, "A5"), (22, 1, "F5"),
    # c.12 (C)  respuesta corta, deja hueco
    (24, 1, "G5"), (25, 1, "E5"), (26, 1, "G5"), (27, 1, "C6"),
    (28, 1, "A5"), (29, 1, "G5"), (30, 1, "E5"),
    # c.13 (Dm) repetición con salto de octava
    (32, 1, "D5"), (33, 1, "D5"), (34, 1, "F5"), (35, 1, "A5"),
    (36, 1, "D6"), (37, 1, "A5"), (38, 1, "F5"),
    # c.14 (Bb)
    (40, 1, "D5"), (41, 1, "D5"), (42, 1, "F5"), (43, 1, "A5"),
    (44, 1, "Bb5"), (45, 1, "A5"), (46, 1, "F5"),
    # c.15 (F)  escala ascendente
    (48, 1, "A5"), (49, 1, "G5"), (50, 1, "F5"), (51, 1, "E5"),
    (52, 1, "F5"), (53, 1, "G5"), (54, 1, "A5"),
]
# c.16 (C)  giro que cierra el período con una floritura diatónica (Do-Si♭-La-Sol)
THEME_A_TURN = [
    (56, 1, "G5"), (57, 1, "E5"), (58, 1, "G5"), (59, 1, "C6"),
    (60, 0.5, "Bb5"), (61, 0.5, "A5"), (62, 0.5, "G5"), (63, 0.5, "F5"),
]
THEME_A = THEME_A_BODY + THEME_A_TURN

THEME_B = [
    # c.17 (Dm) sube una 5ª: "la respuesta"
    (0, 1, "A5"), (1, 1, "A5"), (2, 1, "C6"), (3, 1, "D6"),
    (4, 1, "C6"), (5, 1, "A5"), (6, 1, "F5"),
    # c.18 (C)
    (8, 1, "G5"), (9, 1, "G5"), (10, 1, "A5"), (11, 1, "C6"),
    (12, 1, "A5"), (13, 1, "G5"), (14, 1, "E5"),
    # c.19 (Bb)
    (16, 1, "F5"), (17, 1, "A5"), (18, 1, "Bb5"), (19, 1, "D6"),
    (20, 1, "Bb5"), (21, 1, "A5"), (22, 1, "F5"),
    # c.20 (A)  dominante, con más aire
    (24, 1, "E5"), (25, 1, "A5"), (26, 1, "C6"), (28, 1, "E6"),
    (29, 1, "C6"), (30, 1, "A5"),
    # c.21 (Dm) clímax agudo
    (32, 1, "D6"), (33, 1, "A5"), (34, 1, "F5"), (35, 1, "A5"),
    (36, 1, "D6"), (37, 1, "F6"), (38, 1, "D6"),
    # c.22 (C)
    (40, 1, "C6"), (41, 1, "A5"), (42, 1, "G5"), (43, 1, "A5"),
    (44, 1, "C6"), (45, 1, "G5"), (46, 1, "E5"),
    # c.23 (Bb)
    (48, 1, "D6"), (49, 1, "Bb5"), (50, 1, "A5"), (51, 1, "Bb5"),
    (52, 1, "D6"), (53, 1, "F6"), (54, 1, "D6"),
    # c.24 (G)  puente que empuja de vuelta a Re menor
    (56, 1, "Bb5"), (57, 1, "G5"), (58, 1, "F5"), (59, 1, "G5"),
    (60, 1, "Bb5"), (61, 1, "D6"), (62, 0.5, "E6"), (63, 0.5, "C6"),
]

# Contramelodía de la reexposición (posiciones relativas al cc.26): blancas graves
COUNTER = [
    (0, 4, "F4"), (4, 4, "D4"),        # c.26 Bb
    (8, 4, "C4"), (12, 4, "F4"),       # c.27 F
    (16, 4, "E4"), (20, 4, "G4"),      # c.28 C
    (24, 4, "A4"), (28, 4, "D4"),      # c.29 Dm
    (32, 4, "F4"), (36, 4, "D4"),      # c.30 Bb
    (40, 4, "G4"), (44, 4, "E4"),      # c.31 C  -> prepara la cadencia
]

LEAD_SECTIONS = [
    {"bar_from": 9,  "bar_to": 16, "events": THEME_A},
    {"bar_from": 17, "bar_to": 24, "events": THEME_B},
    # Reexposición: el tema A vuelve en su registro, más legato y con la
    # contramelodía grave por debajo; el cc.32 queda libre para la cadencia.
    {"bar_from": 25, "bar_to": 31, "events": THEME_A_BODY, "staccato": 0.62},
]

# Cadencia final (cc.32): Re menor sostenido que se apaga solo dentro del compás.
FINAL_HELD = [(0, 1, "D5"), (2, 6, "A5")]

# --------------------------------------------------------------------------
# 8 · Percusión (posiciones en semicorcheas 0..15) y ganancias de mezcla
# --------------------------------------------------------------------------
DRUM_KICK = {1: [], 2: [], 3: [0], 4: [0], 5: [0, 8], 6: [0, 8], 7: [0, 8], 8: [0, 8]}
DRUM_KICK.update({b: [0, 8] for b in range(9, 32)})
DRUM_KICK[32] = [0]
DRUM_SNARE = {b: [4, 12] for b in range(7, 32)}
DRUM_SNARE.update({24: [4, 10, 12, 14], 32: []})       # redoblado al final del tema B
DRUM_HAT = {b: [0, 2, 4, 6, 8, 10, 12, 14] for b in range(3, 32)}
DRUM_HAT.update({1: [], 2: [], 17: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14],
                 24: [0, 2, 4, 6, 8, 10, 12, 14, 15], 32: []})
HAT_ACCENT = (0, 4, 8, 12)               # corcheas marcadas sobre el pulso

GAIN = {"bass": 0.215, "bass_off": 0.175, "pad": 0.085, "pad_off": 0.062,
        "lead": 0.165, "lead_tail": 0.052, "counter": 0.095,
        "kick": 0.20, "snare": 0.13, "hat": 0.065}
WIDTH = {"lead": 0.20, "counter": -0.32, "pad": -0.10}   # paneo sutil (L<0<R)

# --------------------------------------------------------------------------
# 9 · Síntesis de cada voz
# --------------------------------------------------------------------------
def voice_bass(freq, dut):
    """Cuadrada 50% + envolvente rápida: el pulso grave del tribunal."""
    w, _ = square(dut, freq, 0.0, duty=0.5)
    e = adsr(dut, a=0.003, d=0.05, s=0.55, r=0.035)
    for i in range(len(w)):
        w[i] *= e[i]
    return w


def voice_lead(freq, dut):
    """Cuadrada 25%, decay corto, staccato y vibrato sutil (±0,4% a 5,5 Hz)."""
    w, _ = square(dut, freq, 0.0, duty=0.25, vib_hz=5.5, vib_depth=0.004)
    e = adsr(dut, a=0.010, d=0.05, s=0.52, r=0.045)
    for i in range(len(w)):
        w[i] *= e[i]
    return w


def voice_counter(freq, dut):
    """Triángulo lento: la voz que responde por debajo del tema."""
    w, _ = tri(dut, freq)
    e = adsr(dut, a=0.035, d=0.12, s=0.6, r=0.14)
    for i in range(len(w)):
        w[i] *= e[i]
    return w


def voice_pad(freq, dut):
    """Armonía punteada en corcheas (triángulo, muy por debajo del lead)."""
    w, _ = tri(dut, freq)
    e = adsr(dut, a=0.008, d=0.05, s=0.4, r=0.04)
    for i in range(len(w)):
        w[i] *= e[i]
    return w


_RNG = Random(0xDF17)                     # semilla fija -> el WAV es idéntico siempre


def drum_kick(dut=0.12):
    """Bombo: seno con caída de 120 -> 45 Hz y decay de 0,12 s."""
    m = int(round(dut * SR))
    out = [0.0] * m
    p = 0.0
    for i in range(m):
        t = i / SR
        p += (45.0 + 75.0 * math.exp(-t / 0.028)) / SR
        out[i] = math.sin(TAU * p) * math.exp(-t / (dut / 3.2))
    return out


def drum_snare(dut=0.09):
    """Caja: ruido blanco filtrado (paso-banda ~1,9 kHz) con decay de 0,08-0,09 s."""
    x = noise(dut, _RNG)
    body = bandpass(x, 1900.0, 0.9)
    thin = highpass(x, 1400.0)
    m = len(x)
    out = [0.0] * m
    for i in range(m):
        g = math.exp(-(i / SR) / (dut / 3.4))
        out[i] = (0.75 * body[i] + 0.35 * thin[i]) * g
    return out


def drum_hat(dut=0.035):
    """Hi-hat: ruido con paso-alto de dos polos y decay de 0,03 s."""
    x = highpass(highpass(noise(dut, _RNG), 6800.0), 6800.0)
    m = len(x)
    out = [0.0] * m
    for i in range(m):
        out[i] = x[i] * math.exp(-(i / SR) / (dut / 3.0))
    return out


# --------------------------------------------------------------------------
# 10 · Programación (escribe las notas en el bus)
# --------------------------------------------------------------------------
class Bus:
    """Suma de todas las voces: `c` = centro (todas), `s` = parte paneada."""

    def __init__(self):
        self.c = array("d", [0.0]) * TOTAL
        self.s = array("d", [0.0]) * TOTAL
        self._cache = {}                  # las notas graves se repiten: se calculan 1 vez
        self.overflow = 0                 # eventos que desbordan el sample final (debe ser 0)

    def cached(self, key, fn):
        hit = self._cache.get(key)
        if hit is None:
            hit = fn()
            self._cache[key] = hit
        return hit

    def add(self, start, chunk, gain, width=0.0):
        c, s = self.c, self.s
        if start < TOTAL and start + len(chunk) > TOTAL:
            self.overflow += 1            # la envolvente seguiría abierta al cerrar el loop
        n0 = min(len(chunk), TOTAL - start)
        if n0 <= 0:
            return
        gc = gain * math.sqrt(max(1.0 - width * width, 0.0))
        ws = gain * width * 0.7071
        for i in range(n0):
            v = chunk[i]
            c[start + i] += v * gc
            s[start + i] += v * ws

    def at(self, bar, pos):
        """Sample inicial de (compás 1-based, posición en corcheas)."""
        return int(round(((bar - 1) * BAR + pos * EIGHTH) * SR))


def render_chord_notes(bus, bar, pos, dur, names, synth, gain, width, tag):
    """Acorde punteado; 2 muestras de desfase por nota = pequeño "strum" estéreo."""
    for j, name in enumerate(names):
        f = hz(n(name))
        chunk = bus.cached((tag, round(f, 3), round(dur, 4)), lambda: synth(f, dur))
        bus.add(bus.at(bar, pos) + j * 2, chunk, gain, width)


def bass_pattern_for(bar):
    if bar <= 4:
        return BASS_PATTERN["intro"]
    if bar <= 16:
        return BASS_PATTERN["main"]
    if bar <= 24:
        return BASS_PATTERN["tension"]
    if bar < 32:
        return BASS_PATTERN["main"]
    return BASS_PATTERN["final"]


def render_bass_and_pad(bus, bar, chord, pattern):
    """Bajo (fundamental + quinta en corcheas) y armonía del acorde."""
    root = hz(n(BASS_ROOT[chord]))
    fifth = hz(n(FIFTH[chord]))
    is_main = pattern is BASS_PATTERN["main"]
    for slot, mark in enumerate(pattern):
        if mark == ".":
            continue
        f = root if mark == "0" else fifth
        g = GAIN["bass"] if mark == "0" else GAIN["bass_off"]
        dur = 0.46 if bar == 32 else (0.165 if is_main else 0.205)
        chunk = bus.cached(("bass", round(f, 3), round(dur, 4)),
                           lambda: voice_bass(f, dur))
        bus.add(bus.at(bar, slot), chunk, g)
    # armonía: corcheas punteadas, con aire en la 4ª corchea de los compases impares.
    # El cc.32 toca UN solo acorde largo (1,30 s) para que nada se corte en el borde.
    tones = VOICING[chord]
    slots = (0,) if bar == 32 else range(8)
    for slot in slots:
        if slot and slot == 6 and bar % 2 == 1:
            continue
        dur = 1.30 if bar == 32 else 0.205
        g = 0.11 if bar == 32 else (GAIN["pad"] if slot % 2 == 0 else GAIN["pad_off"])
        render_chord_notes(bus, bar, slot, dur, tones, voice_pad, g, WIDTH["pad"], "pad")


def render_lead(bus, events, bar_from, bar_to, transpose=0, staccato=0.74):
    """Lead + eco de corchea (bucle de delay de 0,25 s, muy bajo: da cuerpo)."""
    delay = int(EIGHTH * SR)
    for (pos, dur, name) in events:
        bar = bar_from + int(pos // 8)
        if bar > bar_to:
            continue
        f = hz(n(name) + transpose)
        d = dur * EIGHTH * staccato
        start = bus.at(bar, pos - 8 * (bar - bar_from))
        chunk = bus.cached(("lead", round(f, 3), round(d, 4)), lambda: voice_lead(f, d))
        bus.add(start, chunk, GAIN["lead"], WIDTH["lead"])
        tail = bus.cached(("tail", round(f, 3), round(d, 4)),
                          lambda: voice_lead(f, min(d, 0.09)))
        bus.add(start + delay, tail, GAIN["lead_tail"], WIDTH["lead"] * 0.6)


def render_counter(bus, bar_from=26, bar_to=31):
    """Blancas (4 corcheas = 1 s) de contramelodía, siempre dentro de su compás."""
    for (pos, dur, name) in COUNTER:
        bar = bar_from + int(pos // 8)
        if not bar_from <= bar <= bar_to:
            continue
        f = hz(n(name))
        d = dur * EIGHTH * 0.9                      # 0,9 s: deja aire entre blancas
        chunk = bus.cached(("cnt", round(f, 3), round(d, 4)),
                           lambda: voice_counter(f, d))
        bus.add(bus.at(bar, pos - 8 * (bar - bar_from)), chunk,
                GAIN["counter"], WIDTH["counter"])


def render_final_chord(bus, bar=32):
    """El tema se apaga y queda Re menor sostenido que se desvanece antes del cc.1.
    (El bajo y la armonía del cc.32 ya los puso render_bass_and_pad con patrón
    "final": nota larga + acorde de 1,30 s que llega a cero dentro del compás.)"""
    for (pos, dur, name) in FINAL_HELD:
        f = hz(n(name))
        d = dur * EIGHTH * 0.86
        chunk = bus.cached(("fin", round(f, 3), round(d, 4)), lambda: voice_lead(f, d))
        bus.add(bus.at(bar, pos), chunk, GAIN["lead"], WIDTH["lead"])
    render_chord_notes(bus, bar, 0, 1.30, ("A4",), voice_counter, 0.07,
                       WIDTH["counter"], "cnt")


def render_drums(bus, bar):
    for pos in DRUM_KICK.get(bar, []):
        bus.add(bus.at(bar, pos / 2.0), bus.cached(("kick",), drum_kick), GAIN["kick"])
    for pos in DRUM_SNARE.get(bar, []):
        bus.add(bus.at(bar, pos / 2.0), bus.cached(("snare",), drum_snare), GAIN["snare"])
    for pos in DRUM_HAT.get(bar, []):
        g = GAIN["hat"] * (1.35 if pos in HAT_ACCENT else 0.8)
        bus.add(bus.at(bar, pos / 2.0), bus.cached(("hat",), drum_hat), g)


# --------------------------------------------------------------------------
# 11 · Mezcla maestra: DC fuera, saturación suave, pico 0,72, costura limpia
# --------------------------------------------------------------------------
def dc_block(data, fc=20.0, sr=SR):
    """Paso-alto de un polo ("DC blocker") a 20 Hz, inaudible sobre la música.

    Las cuadradas de duty 25%/50% y los sustains traen continua: si sólo se
    resta la media global, los silencios del final del cc.32 quedan corridos por
    un offset, y eso es justo lo que hace "pegar" la unión del loop. Con este
    filtro el silencio vuelve a cero y la costura queda muda."""
    r = 1.0 - TAU * fc / sr
    out = [0.0] * len(data)
    px = py = 0.0
    for i, x in enumerate(data):
        y = x - px + r * py
        out[i] = y
        px, py = x, y
    return out


def mixdown(bus):
    def mean(buf):
        return sum(buf) / float(len(buf))

    def rms(buf):
        return math.sqrt(sum(v * v for v in buf) / float(len(buf)))

    mc, ms = mean(bus.c), mean(bus.s)
    # L = centro + paneo, R = centro - paneo
    lim_c = [bus.c[i] + bus.s[i] for i in range(TOTAL)]
    lim_s = [bus.c[i] - bus.s[i] for i in range(TOTAL)]
    del bus.c, bus.s                                 # liberamos los buses (2 x 22 MB)
    lim_c = dc_block(lim_c)                          # continua fuera -> silencio = 0 real
    lim_s = dc_block(lim_s)
    # saturación blanda tipo tanh: nunca hay recorte duro -> no clipea
    peak = 0.0
    drive, norm = 1.15, math.tanh(1.15)
    for i in range(TOTAL):
        x = math.tanh(drive * lim_c[i]) / norm
        y = math.tanh(drive * lim_s[i]) / norm
        lim_c[i] = x
        lim_s[i] = y
        ax, ay = abs(x), abs(y)
        if ax > peak:
            peak = ax
        if ay > peak:
            peak = ay
    scale = PEAK_TARGET / peak if peak > 1e-9 else 1.0
    nf = int(EDGE_FADE * SR)                         # 55 ms: el cc.1 vuelve suave
    for i in range(TOTAL):
        v = lim_c[i] * scale
        w = lim_s[i] * scale
        if i < nf:
            g = 0.5 - 0.5 * math.cos(math.pi * i / nf)
            v *= g
            w *= g
        lim_c[i] = v
        lim_s[i] = w
    peak_out = max(max(lim_c), -min(lim_c), max(lim_s), -min(lim_s))
    return {"L": lim_c, "R": lim_s,
            "dc_in": max(abs(mc), abs(ms)), "dc_out": max(abs(mean(lim_c)), abs(mean(lim_s))),
            "rms": rms(lim_c), "peak": peak_out}


def to_int16(left, right):
    """PCM 16-bit con dither triangular; el pico 0,72 deja margen de sobra: no recorta."""
    rng = Random(7)
    frames = array("h", [0]) * (TOTAL * 2)
    k = 32767.0
    i = 0
    for s in range(TOTAL):
        d = (rng.random() + rng.random() - 1.0) * 0.8
        v = left[s] * k + d
        w = right[s] * k + d
        frames[i] = max(-32768, min(32767, int(v + 0.5) if v >= 0 else -int(-v + 0.5)))
        frames[i + 1] = max(-32768, min(32767, int(w + 0.5) if w >= 0 else -int(-w + 0.5)))
        i += 2
    return frames


# --------------------------------------------------------------------------
# 12 · Documentación textual de la estructura (leída de los datos reales)
# --------------------------------------------------------------------------
def chord_of(bar):
    """Acorde del compás: cc.1 y cc.32 comparten Re menor -> el loop cierra en tónica."""
    return BAR_CHORD.get(bar, "Dm")


def section_of(bar):
    return ("intro" if bar <= 8 else "tema A" if bar <= 16 else
            "tema B" if bar <= 24 else "reexpo")


def structure_report():
    print("\n== 5. ESTRUCTURA (32 compases · el cc.32 cadencia al cc.1) ==")
    print("  {:>3} {:<5} {:<8} {:<14} {:<12} {:^5} {:^4} {:^5}  {}".format(
        "cc.", "acorde", "bajo/pad", "lead", "contramel.", "kb", "sn", "hh", "sección"))
    print("  " + "-" * 78)
    for bar in range(1, BARS + 1):
        pat = bass_pattern_for(bar)
        if bar <= 8:
            lead = "—"
        elif bar <= 16:
            lead = "tema A"
        elif bar <= 24:
            lead = "tema B (agudo)"
        elif bar <= 31:
            lead = "tema A + cm."
        else:
            lead = "acorde final"
        cnt = "sí" if (26 <= bar <= 31) else ("cierre" if bar == 32 else "—")
        print("  {:>3} {:<5} {:<8} {:<14} {:<12} {:^5} {:^4} {:^5}  {}".format(
            bar, chord_of(bar),
            ("on" if any(m != "." for m in pat) else "off") + "/on",
            lead, cnt, len(DRUM_KICK.get(bar, [])), len(DRUM_SNARE.get(bar, [])),
            len(DRUM_HAT.get(bar, [])), section_of(bar)))
    print("""
  cc. 1- 8  introducción (sin melodía): bajo en corcheas sobre los fundamentales
            Re / Si♭ / Fa / Do + armonía punteada; hi-hat desde cc.3, bombo desde
            cc.5 (pulso entero desde cc.5), caja desde cc.7.
  cc. 9-16  TEMA A (Dm-Bb-F-C): lead cuadrada 25% staccato, motivo de 4 compases
            + giro final en cc.16 (la "pregunta").
  cc.17-24  TEMA B (Dm-C-Bb-A / Dm-C-Bb-G): lead una 5ª above, con La y Sol en el
            bajo, más tenso; redoblado de caja al cerrar cc.24 (la "respuesta").
  cc.25-32  REEXPOSICIÓN: tema A en su registro, más legato (staccato 0,62), con
            contramelodía de blancas graves (cc.26-31); cc.32 = Re menor sostenido
            que se apaga ~0,2 s antes del sample final -> loop hacia el cc.1.""")


# --------------------------------------------------------------------------
# 13 · Escritura del WAV y validaciones
# --------------------------------------------------------------------------
def write_wav(path, left, right):
    frames = to_int16(left, right)
    os.makedirs(OUT_DIR, exist_ok=True)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.setnframes(TOTAL)
        wf.writeframes(frames.tobytes())
    return frames


LICENCIA = """DF · Decisión Final — música de fondo "musica-quiz"
========================================================

Obra              : "Decisión Final (Tema del Tribunal)" — música de fondo original
                    del quiz del juego educativo web argentino "DF · Decisión Final".
Autor             : Grupo LPC · DF Decisión Final
Año de composición: 2026
Ficha técnica     : Re menor · 120 BPM · compás 4/4 · 32 compases · 64,000 s · loop perfecto.
Voces             : bajo (cuadrada 50%), lead (cuadrada 25% con vibrato), armonía
                    (triángulo), contramelodía (triángulo) y percusión NES
                    (bombo, caja y hi-hat sintetizados con ruido filtrado).
Formato           : WAV PCM 16-bit, 44100 Hz, estéreo — assets/audio/musica-quiz.wav
Generación        : sintetización procedural 100% con la stdlib de Python
                    (herramienta: tools/build_music.py). Sin samples, sin librerías
                    de audio externas y sin descargas de red: cada muestra se calcula
                    en código, así que la pista es regenerable y auditable.

LICENCIA
--------
Dominio público / CC0 1.0 Universal.

El Grupo LPC · DF Decisión Final renuncia a todos los derechos de autor y derechos
connexos sobre esta composición y sobre la grabación (sound recording), en la máxima
medida permitida por la ley. Podés copiarla, modificarla, fusionarla, distribuirla y
usarla en un producto comercial sin pedir permiso y sin atribución obligatoria.

Se agradece (pero no se exige) el crédito:
    "Música: Grupo LPC · DF Decisión Final — CC0".

Texto completo de CC0: https://creativecommons.org/publicdomain/zero/1.0/legalcode.es

NOTA PARA EL EQUIPO
-------------------
* js/core/music.js e index.html usan assets/audio/musica-quiz.mp3 y, como respaldo,
  assets/audio/musica-quiz.wav. En esta máquina NO hay ffmpeg para generar .ogg, así
  que ese formato ya no se declara: el navegador reproduce el MP3 (todos los actuales)
  o el WAV directamente.
* Si alguien consigue .ogg, puede agregarlo con el MISMO nombre base (musica-quiz) en
  esta carpeta y declararlo como <source> en index.html: el reproductor lo va a
  preferir por tamaño. Cualquier conversión debe
  conservar los 64,000 s exactos — la pista está compuesta como loop de 32 compases a
  120 BPM y recortar o editar en el medio rompe la costura.
* La pista viene normalizada a un pico de 0,72 y sin clipping; el juego la atenúa a
  0,5. Está pensada para sonar de fondo y no tapar los efectos de sonido.
"""


def verify():
    ok = True
    with wave.open(OUT_WAV, "rb") as wf:
        ch, sw, fr, nf = (wf.getnchannels(), wf.getsampwidth(),
                          wf.getframerate(), wf.getnframes())
        dur = nf / float(fr)
        data = wf.readframes(nf)
    print("\n== 2. CABECERA WAV (módulo wave) ==")
    print("  canales sampwidth framerate nframes duración")
    print(f"  {ch} {sw} {fr} {nf} {round(dur, 6)}")
    if [ch, sw, fr] != [2, 2, 44100] or round(dur, 6) != 64.0:
        ok = False
        print("  [FALLA] la cabecera no cumple  2 2 44100 ... 64.0")

    with open(OUT_WAV, "rb") as fh:
        hdr = fh.read(44)
    (riff, riff_size, waveid, fmtid, fmt_size, fmt, chn, rate, byterate, align,
     bits, dataid, data_size) = struct.unpack("<4sI4s4sIHHIIHH4sI", hdr)
    print(f"  RIFF={riff.decode()}:{waveid.decode()} · {fmtid.decode()}=PCM({fmt}) "
          f"canales={chn} rate={rate} align={align} bits={bits} "
          f"data={data_size} bytes -> {data_size // (chn * 2)} frames")

    print("\n== 3. CLIPPING / PICO ==")
    arr = array("h")
    arr.frombytes(data)
    mx = 0
    for v in arr:
        a = -v if v < 0 else v
        if a > mx:
            mx = a
    ratio = mx / 32767.0
    rms = math.sqrt(sum(v * v for v in arr) / float(len(arr))) / 32767.0
    print(f"  max_abs_int16 = {mx}   (tope absoluto 32767 -> sin clipping: OK)")
    print(f"  pico = {ratio:.4f} del rango   (rango pedido 0.60-0.75 · buscado {PEAK_TARGET})")
    print(f"  rms  = {rms:.4f}   (cabezal para los efectos de sonido: "
          f"{'holgado' if rms < 0.25 else 'apretado'})")
    if not (0 <= mx <= 32767) or not (0.60 <= ratio <= 0.75):
        ok = False
        print("  [FALLA] pico fuera de rango o clipping")

    print("\n== 4. COSTURA DEL LOOP (primeros / últimos 500 samples) ==")
    w = 500
    first = arr[0:w * 2:2]                      # canal L del borde inicial
    last = arr[(TOTAL - w) * 2:TOTAL * 2:2]     # canal L del borde final
    p_first = max(max(first), -min(first))
    p_last = max(max(last), -min(last))
    print(f"  pico primeros 500 = {p_first:>6} ({p_first / 32767.0:.4f} del rango)")
    print(f"  pico últimos  500 = {p_last:>6} ({p_last / 32767.0:.4f} del rango)")
    print(f"  salto cc.32 -> cc.1: último sample {arr[-2]} -> primero {arr[0]} "
          f"(delta {abs(int(arr[0]) - int(arr[-2]))} = {abs(int(arr[0]) - int(arr[-2])) / 32767.0:.5f})")
    if p_first / 32767.0 > 0.12 or p_last / 32767.0 > 0.02:
        ok = False
        print("  [FALLA] alguna envolvente sigue abierta en el borde")
    else:
        print("  LOOP LIMPIO: las envolventes cierran en cero y el borde inicial ataca "
              "de a poco -> la unión no pega.")
    return ok


def main():
    t0 = time.time()
    print(f"== 1. SINTETIZANDO {TOTAL_SEC:.3f} s = {BARS} compases a {BPM:.0f} BPM · "
          f"{SR} Hz · 16-bit · estéreo ==")
    bus = Bus()
    for bar in range(1, BARS + 1):                    # base armónica y rítmica
        render_bass_and_pad(bus, bar, chord_of(bar), bass_pattern_for(bar))
        render_drums(bus, bar)
    for sec in LEAD_SECTIONS:                         # melodías
        render_lead(bus, sec["events"], sec["bar_from"], sec["bar_to"],
                    sec.get("transpose", 0), sec.get("staccato", 0.74))
    render_counter(bus)                               # contramelodía cc.26-31
    render_final_chord(bus, 32)                       # cadencia de cierre/apertura

    mix = mixdown(bus)
    frames = write_wav(OUT_WAV, mix["L"], mix["R"])
    with open(OUT_LIC, "w", encoding="utf-8") as fh:
        fh.write(LICENCIA)

    print(f"  voces: {', '.join(VOICES)}")
    print(f"  notas por voz: lead {len(THEME_A) + len(THEME_B) + len(THEME_A_BODY) + len(FINAL_HELD)}"
          f" · armonía {sum(len(VOICING[chord_of(b)]) for b in range(1, BARS + 1))}"
          f" · contramelodía {len(COUNTER)} · patrones de bajo {len(BASS_PATTERN)}")
    print(f"  DC offset: entrada {mix['dc_in']:.6f} -> salida {mix['dc_out']:.8f}")
    print(f"  pico maestro: {mix['peak']:.4f} · rms {mix['rms']:.4f} · "
          f"muestras cacheadas {len(bus._cache)} · eventos que desbordan el cierre: {bus.overflow}")
    print(f"  escritos: {OUT_WAV} ({os.path.getsize(OUT_WAV):,} bytes) y {OUT_LIC}")
    print(f"  tiempo de síntesis: {time.time() - t0:.1f} s")

    structure_report()
    ok = verify()
    if bus.overflow:
        ok = False
        print("  [FALLA] hay notas que se cortan en el sample final: el loop pegararía")
    print("\nVALIDACIÓN GLOBAL:", "TODO OK" if ok else "CON FALLOS")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
