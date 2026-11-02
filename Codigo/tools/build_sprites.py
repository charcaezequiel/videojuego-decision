#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_sprites.py · Generador de DF · Decisión Final
Dibuja el pixel-art del vestuario (16-bit, chibi de 32x42) y escribe
    js/data/vestuario.js
que es el único archivo de datos que lee js/core/sprites.js.

Solo stdlib. Salida determinista (nada de random).
Uso:  python tools/build_sprites.py
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(ROOT, "js", "data", "vestuario.js")

W, H = 32, 42          # tamaño del avatar
TRANSPARENT = "."

# ---------------------------------------------------------------- paleta
# Colores BLOQUEADOS del proyecto (los mismos de tools/pixel.js).
# Una letra -> un color. La letra "S"/"s" es piel y sprites.js la sustituye.
PAL_FULL = {
    "K": "#1e0f08",  # tinta (contorno)
    "S": "#f2c9a0",  # piel  (= SKINS.media S)
    "s": "#d9a47c",  # piel en sombra (= SKINS.media s)
    "W": "#ffffff",  # blanco
    "C": "#fbebd3",  # crema
    "c": "#fbeeda",  # crema campo
    "F": "#f0dcb0",  # crema suave
    "L": "#f6d8a0",  # dorado claro
    "G": "#e0b070",  # dorado
    "g": "#c89a5a",  # dorado oscuro
    "Y": "#c9a24a",  # amarillo
    "N": "#4f8a56",  # verde
    "n": "#3f6e3a",  # verde oscuro
    "R": "#b23b3b",  # rojo
    "r": "#6d1f30",  # rojo oscuro
    "E": "#5f2d47",  # vino
    "e": "#4a1f37",  # vino oscuro
    "X": "#3c1525",  # vino muy oscuro
    "B": "#3a1a07",  # marrón
    "b": "#5a2c12",  # marrón suave
    "M": "#6b3a1f",  # marrón medio
    "m": "#8c5330",  # tan
    "D": "#2b2b31",  # denim (silueta neutra del cuerpo)
    "d": "#3d3d45",  # denim claro
    "A": "#8a7a80",  # gris
    "a": "#5a4a52",  # gris oscuro
}

# ---------------------------------------------------------------- geometría
HEAD_CX, HEAD_CY, HEAD_R = 16, 12, 8      # cabeza: disco r8 centrado en (16,12) -> y 4..20
CHIN_Y = 20
NECK_TOP, NECK_BOT = 18, 23
SHOULDER_Y, TORSO_BOT = 22, 31
LEG_TOP, LEG_BOT = 32, 38                 # piernas 32..38 (un 39 compartido con el pie)
FEET_TOP, FEET_BOT = 39, 41               # pies 39..41
LEG_L = (12, 14)                          # pierna izquierda (visible)
LEG_R = (17, 19)                          # pierna derecha
L_HAND = (6, 31, 3, 3)                    # mano derecha del personaje = lado izq. del espectador
R_HAND = (23, 31, 3, 3)                   # mano izquierda del personaje

# orden de pintura (menor primero); los "back grids" van detrás del cuerpo
Z_BACK = -2
Z = {
    "bolsos": 2, "bufandas": 3, "collares": 3, "pins": 4,
    "varios": 5, "barbijos": 6, "gafas": 7, "pelo": 8,
    "auriculares": 9, "gorros": 10, "mano": 11, "mascotas": 1,
}


# ================================================================ Grid
class Grid(object):
    """Rejilla de caracteres con mapa letra->color y primitivas de dibujo."""

    def __init__(self, w=W, h=H):
        self.w = w
        self.h = h
        self.a = [[TRANSPARENT] * w for _ in range(h)]

    # --- primitivas bajas
    def px(self, x, y, ch):
        x = int(round(x)); y = int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h and ch != TRANSPARENT:
            self.a[y][x] = ch
        return self

    def erase(self, x, y):
        x = int(round(x)); y = int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.a[y][x] = TRANSPARENT
        return self

    def at(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.a[y][x]
        return TRANSPARENT

    def rect(self, x, y, w, h, ch):
        for j in range(int(y), int(y) + int(h)):
            for i in range(int(x), int(x) + int(w)):
                self.px(i, j, ch)
        return self

    def frame(self, x, y, w, h, ch):
        for i in range(int(x), int(x) + int(w)):
            self.px(i, int(y), ch); self.px(i, int(y + h - 1), ch)
        for j in range(int(y), int(y) + int(h)):
            self.px(int(x), j, ch); self.px(int(x + w - 1), j, ch)
        return self

    def hline(self, x0, x1, y, ch):
        lo, hi = min(x0, x1), max(x0, x1)
        for i in range(int(lo), int(hi) + 1):
            self.px(i, y, ch)
        return self

    def vline(self, x, y0, y1, ch):
        lo, hi = min(y0, y1), max(y0, y1)
        for j in range(int(lo), int(hi) + 1):
            self.px(x, j, ch)
        return self

    def line(self, x0, y0, x1, y1, ch):
        x0 = int(round(x0)); y0 = int(round(y0)); x1 = int(round(x1)); y1 = int(round(y1))
        dx = abs(x1 - x0); dy = -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        while True:
            self.px(x0, y0, ch)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy; x0 += sx
            if e2 <= dx:
                err += dx; y0 += sy
        return self

    def thick_line(self, x0, y0, x1, y1, ch, t=2):
        for k in range(t):
            self.line(x0 + k, y0 + k, x1 + k, y1 + k, ch)
        return self

    def disc(self, cx, cy, r, ch):
        """mismo criterio que pixel.js: i*i+j*j <= r*r + r*0.4"""
        rr = r * r + r * 0.4
        for j in range(-int(r) - 1, int(r) + 2):
            for i in range(-int(r) - 1, int(r) + 2):
                if i * i + j * j <= rr:
                    self.px(cx + i, cy + j, ch)
        return self

    def ring(self, cx, cy, r, ch, t=1):
        rr = r * r + r * 0.4
        ri = (r - t) * (r - t)
        for j in range(-r - 1, r + 2):
            for i in range(-r - 1, r + 2):
                d = i * i + j * j
                if ri <= d <= rr:
                    self.px(cx + i, cy + j, ch)
        return self

    def erase_disc(self, cx, cy, r):
        rr = r * r + r * 0.4
        for j in range(-r - 1, r + 2):
            for i in range(-r - 1, r + 2):
                if i * i + j * j <= rr:
                    self.erase(cx + i, cy + j)
        return self

    def poly(self, pts, ch):
        """relleno por scanline, igual que Canvas.poly de pixel.js"""
        ys = [p[1] for p in pts]
        for y in range(int(ys_min(ys)), int(ys_max(ys)) + 1):
            xs = []
            n = len(pts)
            for k in range(n):
                ax, ay = pts[k]
                bx, by = pts[(k + 1) % n]
                if (ay <= y < by) or (by <= y < ay):
                    xs.append(ax + (y - ay) * (bx - ax) / float(by - ay))
            xs.sort()
            for k in range(0, len(xs) - 1, 2):
                for x in range(int(round(xs[k])), int(round(xs[k + 1])) + 1):
                    self.px(x, y, ch)
        return self

    def hatch(self, x, y, w, h, ch, base, step=2, dx=1, dy=1):
        """trama diagonal entre dos colores (para telas)"""
        for j in range(h):
            for i in range(w):
                if self.at(x + i, y + j) == base and ((i * dx + j * dy) % step == 0):
                    self.px(x + i, y + j, ch)
        return self

    def paint_below(self, y, ch):
        for j in range(int(y), self.h):
            for i in range(self.w):
                if self.a[j][i] != TRANSPARENT:
                    self.a[j][i] = ch
        return self

    def paint_above(self, y, ch):
        for j in range(0, int(y)):
            for i in range(self.w):
                if self.a[j][i] != TRANSPARENT:
                    self.a[j][i] = ch
        return self

    def paint_row(self, y, x0, x1, ch):
        self.hline(x0, x1, y, ch)
        return self

    def keep_rows(self, y0, y1):
        """borra todo lo que quede fuera de [y0, y1]"""
        for j in range(self.h):
            if j < y0 or j > y1:
                for i in range(self.w):
                    self.a[j][i] = TRANSPARENT
        return self

    def shade_right(self, x_from, ch, ymin=0, ymax=None):
        for j in range(ymin, (ymax if ymax is not None else self.h)):
            for i in range(x_from, self.w):
                if self.a[j][i] not in (TRANSPARENT,):
                    self.a[j][i] = ch
        return self

    def shade_lowright(self, ch, kx=1.0, ky=1.0, ox=0.0, oy=0.0):
        """sombra en el cuarto inferior-derecho respecto del centro (16,13)"""
        for j in range(self.h):
            for i in range(self.w):
                if self.a[j][i] == "S":
                    if (i - 16) * kx + (j - 13) * ky > 6.5 + ox + oy:
                        self.a[j][i] = ch
        return self

    def outline(self, ch="K"):
        """contorno exterior de 1px alrededor de lo pintado"""
        snap = [row[:] for row in self.a]
        solid = lambda x, y: 0 <= x < self.w and 0 <= y < self.h and snap[y][x] != TRANSPARENT
        for j in range(self.h):
            for i in range(self.w):
                if solid(i, j):
                    continue
                if solid(i - 1, j) or solid(i + 1, j) or solid(i, j - 1) or solid(i, j + 1):
                    self.a[j][i] = ch
        return self

    def bbox(self):
        x0, y0, x1, y1 = self.w, self.h, -1, -1
        for j in range(self.h):
            for i in range(self.w):
                if self.a[j][i] != TRANSPARENT:
                    if i < x0: x0 = i
                    if i > x1: x1 = i
                    if j < y0: y0 = j
                    if j > y1: y1 = j
        if x1 < 0:
            return None
        return (x0, y0, x1, y1)

    def used_letters(self):
        seen = set()
        for row in self.a:
            for c in row:
                if c != TRANSPARENT:
                    seen.add(c)
        return seen

    def to_parts(self, z):
        """
        una PARTE por franja horizontal continua (sin filas vacías ni márgenes)
        -> mucho más compacto que un bloque de 32x42 por prenda.
        """
        parts = []
        band = []
        for j in range(self.h):
            row = "".join(self.a[j])
            if TRANSPARENT not in row:      # fila totalmente transparente
                if band:
                    parts.append(finish_band(band))
                    band = []
            else:
                band.append((j, row))
        if band:
            parts.append(finish_band(band))
        out = []
        for x, y, rows in parts:
            out.append({"x": x, "y": y, "z": z, "rows": rows})
        return out


def finish_band(band):
    """recorta una franja de filas: saca columnas totalmente vacías"""
    rows = [row for _, row in band]
    x0 = min(i for row in rows for i, ch in enumerate(row) if ch != TRANSPARENT)
    x1 = max(i for row in rows for i, ch in enumerate(row) if ch != TRANSPARENT)
    return (x0, band[0][0], [row[x0:x1 + 1] for row in rows])


def ys_min(ys):
    return min(ys)


def ys_max(ys):
    return max(ys)


# ================================================================ cuerpo
def def_body(g, b=None):
    """chibi de pie: cabeza 1/3, cuello, torso, dos brazos, dos piernas,
       dos manos, oreja derecha, cara simple. Silueta neutra en denim."""
    # -- cuello (primero, la cabeza lo tapa arriba)
    g.rect(14, NECK_TOP, 4, 5, "S")
    # -- cabeza
    g.disc(HEAD_CX, HEAD_CY, HEAD_R, "S")
    # -- cuello visible bajo el mentón + sombra de mentón
    g.rect(14, 21, 4, 2, "S")
    g.px(14, 21, "s"); g.px(15, 21, "s"); g.px(16, 21, "s"); g.px(17, 21, "s")
    g.px(17, 22, "s"); g.px(18, 21, "s"); g.px(18, 22, "s")
    # -- oreja derecha (visible porque mira levemente a la izquierda)
    g.rect(23, 12, 2, 4, "S")
    g.px(24, 13, "s"); g.px(23, 15, "s")
    # -- sombra de piel: lado derecho y bajo mentón
    g.shade_lowright("s")
    # -- cara: dos ojos (blanco + pupila) y boca de una línea
    g.rect(11, 12, 3, 2, "W"); g.rect(17, 12, 3, 2, "W")
    g.px(12, 12, "K"); g.px(12, 13, "K")            # pupila izq. (mirada a la izq.)
    g.px(17, 12, "K"); g.px(17, 13, "K")            # pupila der.
    g.hline(11, 13, 11, "B"); g.hline(17, 19, 11, "B")   # cejas
    g.hline(13, 16, 17, "K")                        # boca
    g.px(16, 15, "s")                               # nariz
    # -- torso (silueta neutra en denim)
    g.poly([(10, 22), (21, 22), (22, 32), (9, 32)], "D")
    g.vline(11, 24, 30, "d")                        # luz del hombro izquierdo
    g.hline(11, 20, 23, "d")                        # escote
    g.vline(15, 25, 30, "a")                        # pliegue central
    g.hline(10, 21, 30, "d")                        # bajo de la camiseta
    g.shade_right(20, "a", 24, 30)                  # sombra del costado derecho
    # -- dos brazos a los costados + dos manos
    g.rect(6, 23, 3, 8, "D"); g.rect(23, 23, 3, 8, "D")
    g.vline(9, 23, 31, "a"); g.vline(22, 23, 31, "a")   # costura: separa brazo/torso
    g.px(6, 24, "d"); g.px(6, 25, "d"); g.px(6, 26, "d")
    g.rect(*L_HAND, "S"); g.rect(*R_HAND, "S")
    g.px(8, 33, "s"); g.px(7, 33, "s"); g.px(25, 33, "s"); g.px(24, 33, "s")
    # -- dos piernas
    g.rect(LEG_L[0], LEG_TOP, 3, LEG_BOT - LEG_TOP + 1, "D")
    g.rect(LEG_R[0], LEG_TOP, 3, LEG_BOT - LEG_TOP + 1, "D")
    g.px(12, LEG_TOP, "d"); g.px(12, 34, "d"); g.px(12, 36, "d")
    g.px(19, 33, "a"); g.px(19, 35, "a"); g.px(19, 37, "a")
    g.hline(13, 16, 34, "a"); g.hline(13, 16, 38, "a")   # entrepierna / sombra
    # -- pies (descalzo: el calzado no lo pone el cuerpo)
    for x0, y0, x1, y1 in ((11, 39, 14, 41), (16, 39, 19, 41)):
        g.rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, "S")
        g.px(x0 - 1, 40, "S"); g.px(x0 - 1, 41, "S")
        g.hline(x0 - 1, x1, 41, "s")
    g.outline("K")


# ================================================================ helpers
def face_oval(g, r=6):
    g.erase_disc(16, 15, r)
    return g


def curls(g, base="R", hi="m", lo="r", mod=11):
    """textura rizada determinista sobre una masa de un color"""
    for j in range(g.h):
        for i in range(g.w):
            if g.a[j][i] == base:
                m = (i * 7 + j * 5) % mod
                if m == 0:
                    g.px(i, j, hi)
                elif m in (4, 5):
                    g.px(i, j, lo)
    return g


# ================================================================ PELO
def pelo_largo(g, b):
    """pelirroja rizada y larga: el avatar del prototipo"""
    g.disc(16, 9, 9, "R")                       # masa alta (y 0..18)
    face_oval(g, 6)                             # despeja la cara
    for cx in (11, 16, 21):                     # flequillo sobre la frente
        g.disc(cx, 8, 2, "R")
    g.rect(5, 9, 3, 8, "R")                     # mechón lateral izquierdo
    g.rect(24, 9, 3, 8, "R")                    # mechón lateral derecho
    for cy in (15, 19, 23, 27):                 # rizos que caen por el costado
        g.disc(4, cy, 3, "R")
        g.disc(27, cy, 3, "R")
    g.disc(10, 32, 2, "R"); g.disc(21, 32, 2, "R")   # puntas sobre los hombros
    b.rect(9, 18, 14, 13, "R")                  # melena detrás del cuerpo
    curls(g, "R", "m", "r")
    curls(b, "R", "m", "r")


def pelo_corto(g, b):
    """corto y prolijo, castaño"""
    g.disc(16, 9, 9, "M")
    face_oval(g, 6)
    g.rect(6, 9, 2, 5, "M"); g.rect(24, 9, 2, 5, "M")
    for i in range(10, 23, 2):                  # brillo del peine
        g.px(i, 5, "m"); g.px(i + 1, 6, "m")
    for i in range(9, 24, 3):
        g.px(i, 10, "B")
    g.keep_rows(0, 16)


def pelo_rizado(g, b):
    """rizas voluminosas (afro)"""
    g.disc(16, 8, 10, "m")
    g.disc(7, 12, 4, "m"); g.disc(25, 12, 4, "m")
    face_oval(g, 6)
    for cx in (7, 12, 16, 21, 25):
        g.disc(cx, 8, 2, "m")
    curls(g, "m", "M", "b", 9)
    g.keep_rows(0, 19)


def pelo_coleta(g, b):
    """recogido con coleta al costado derecho"""
    g.disc(16, 9, 9, "B")
    face_oval(g, 6)
    g.rect(6, 9, 2, 4, "B"); g.rect(24, 9, 2, 4, "B")
    for i in range(10, 22, 2):
        g.px(i, 6, "M"); g.px(i + 1, 7, "M")
    g.keep_rows(0, 16)
    b.thick_line(26, 12, 28, 26, "B", 3)        # coleta por detrás del brazo
    b.disc(28, 27, 3, "B")
    b.disc(27, 20, 3, "B")
    for j in range(13, 27, 3):
        b.hline(26, 29, j, "M")
    g.rect(24, 10, 3, 2, "E")                   # vincha


def pelo_trenzas(g, b):
    """dos trenzas con moño"""
    g.disc(16, 9, 9, "b")
    face_oval(g, 6)
    g.rect(6, 9, 2, 4, "b"); g.rect(24, 9, 2, 4, "b")
    g.rect(11, 5, 10, 2, "B")
    g.keep_rows(0, 15)
    for k in range(6):
        y = 14 + k * 3
        g.disc(4 + (k % 2), y, 3, "b")
        g.disc(27 - (k % 2), y, 3, "b")
        g.hline(2, 6, y + 2, "B")
        g.hline(25, 29, y + 2, "B")
    g.rect(2, 31, 4, 2, "R"); g.rect(26, 31, 4, 2, "R")


# ================================================================ GORROS
def gorro_gorra(g, b):
    """gorra con visera hacia la izquierda del espectador"""
    g.disc(16, 7, 7, "E")
    g.paint_below(9, "E")
    g.keep_rows(0, 9)
    g.rect(10, 8, 12, 2, "E")
    g.poly([(4, 9), (17, 9), (18, 11), (4, 11)], "X")
    for i in range(6, 16):                      # costura de la visera
        if i % 3 == 0:
            g.px(i, 10, "e")
    g.px(16, 1, "G"); g.px(16, 2, "G")          # botoncito
    g.hline(12, 20, 8, "e")


def gorro_boina(g, b):
    """boina francesa torcida"""
    g.disc(15, 6, 7, "E")
    g.disc(21, 7, 4, "E")
    g.paint_below(10, "E")
    g.keep_rows(0, 10)
    g.rect(9, 9, 14, 2, "X")
    g.px(15, 0, "K"); g.px(16, 0, "K"); g.px(15, 1, "C")   # tallito
    g.hline(10, 19, 8, "e")
    for i in range(11, 19, 2):
        g.px(i, 5, "e")


def gorro_sombrero(g, b):
    """sombrero ancho de tribunal"""
    g.rect(9, 4, 14, 7, "B")
    g.erase(9, 4); g.erase(22, 4); g.erase(9, 5); g.erase(22, 5)
    g.hline(10, 21, 4, "B")
    g.rect(3, 10, 26, 2, "B")
    g.disc(16, 10, 11, "B")
    g.paint_below(10, "B")
    g.keep_rows(3, 11)
    g.rect(9, 8, 14, 2, "E")                    # cinta
    g.rect(19, 8, 3, 2, "G")                    # hebilla
    for i in range(5, 27):
        if i % 4 == 0:
            g.px(i, 10, "b")
    g.hline(4, 27, 11, "M")
    g.rect(10, 4, 12, 1, "b")


def gorro_cinta(g, b):
    """vincha deportiva ancha con moño"""
    for dx in range(0, 8):
        y = 7 - (dx // 3)
        g.px(16 - dx, y, "R"); g.px(16 + dx, y, "R")
        g.px(16 - dx, y + 1, "R"); g.px(16 + dx, y + 1, "R")
    for dx in range(0, 7):
        y = 8 - (dx // 4)
        g.px(16 - dx, y + 2, "r"); g.px(16 + dx, y + 2, "r")
    g.rect(22, 5, 4, 2, "R"); g.rect(23, 3, 2, 5, "R")
    g.px(23, 4, "r"); g.px(24, 6, "r")


# ================================================================ AURICULARES
def aur_basicos(g, b):
    """diadema + copas sobrias"""
    g.ring(16, 12, 9, "D", 2)
    g.keep_rows(1, 6)                           # solo el arco superior
    g.thick_line(8, 5, 10, 9, "D", 2)           # baja hasta la oreja
    g.thick_line(24, 5, 22, 9, "D", 2)
    for cx in (5, 27):
        g.rect(cx - 2, 9, 5, 8, "D")
        g.disc(cx, 13, 2, "a")
        g.px(cx, 13, "A")
    g.hline(7, 9, 3, "A"); g.hline(23, 25, 3, "A")


def aur_gamer(g, b):
    """gamer con micrófono y LED"""
    g.ring(16, 12, 10, "K", 2)
    g.keep_rows(0, 5)
    g.paint_row(1, 12, 20, "K")
    g.hline(13, 19, 2, "D")
    g.rect(15, 0, 3, 2, "D")
    g.rect(2, 8, 6, 10, "K")
    g.rect(24, 8, 6, 10, "K")
    g.rect(3, 9, 4, 8, "D")
    g.rect(25, 9, 4, 8, "D")
    g.rect(4, 11, 2, 4, "R"); g.rect(26, 11, 2, 4, "R")
    g.disc(5, 13, 1, "G"); g.disc(27, 13, 1, "G")
    g.thick_line(6, 17, 11, 19, "K", 2)         # brazo del micrófono
    g.disc(12, 20, 2, "D")
    g.px(12, 20, "a")


def aur_retro(g, b):
    """retro: diadema fina + copas de madera"""
    g.ring(16, 12, 9, "g", 1)
    g.keep_rows(2, 6)
    g.hline(12, 20, 3, "g")
    g.rect(15, 1, 2, 2, "b")
    for cx in (5, 27):
        g.disc(cx, 13, 3, "m")
        g.ring(cx, 13, 3, "B", 1)
        g.disc(cx, 13, 1, "b")
        g.px(cx - 1, 11, "M"); g.px(cx + 1, 15, "B")
    g.px(8, 7, "b"); g.px(24, 7, "b")


# ================================================================ BUFANDAS
def buf_bufanda(g, b):
    """bufanda anudada al cuello, con flecos"""
    g.rect(10, 20, 13, 4, "E")
    g.rect(8, 21, 3, 3, "E"); g.rect(22, 21, 3, 3, "E")
    g.rect(12, 24, 6, 3, "e")                   # nudo
    g.rect(13, 27, 5, 8, "E")                   # caída
    for j in range(28, 36, 3):
        g.hline(13, 17, j, "g")                 # rayas
    for i in range(13, 18):
        g.px(i, 36, "E"); g.px(i, 37, "g")      # flecos
    g.rect(9, 21, 12, 1, "X")
    g.px(11, 23, "C"); g.px(19, 23, "C")


def buf_capa(g, b):
    """capa terecié: por detrás del cuerpo + hombrera adelante"""
    b.poly([(10, 21), (23, 21), (29, 39), (4, 39)], "E")
    b.poly([(11, 22), (22, 22), (26, 34), (7, 34)], "e")
    for i in range(5, 29):
        if i % 5 == 0:
            b.px(i, 38, "G")
    for j in range(22, 39):
        b.px(4 + (j // 6), j, "X"); b.px(28 - (j // 6), j, "X")
    b.hline(5, 27, 39, "X")
    g.rect(9, 21, 15, 3, "E")                   # yugo
    g.hline(10, 23, 22, "G")                    # cadenal dorado
    g.px(16, 21, "L"); g.px(15, 21, "g"); g.px(17, 21, "g")
    g.disc(11, 22, 1, "G"); g.disc(21, 22, 1, "G")


# ================================================================ VARIOS
def var_cadena(g, b):
    """cadena dorada con dije (el default del juego)"""
    for i in range(11, 22):                     # arco de eslabones
        dip = 23 + max(0, 3 - abs(i - 16) // 2)
        g.px(i, dip, "G" if i % 2 else "g")
        g.px(i, dip + 1, "g" if i % 2 else "G")
    g.hline(12, 20, 24, "G")
    g.rect(14, 25, 5, 2, "G")
    g.rect(15, 27, 3, 2, "g")
    g.px(16, 27, "L")
    g.frame(14, 25, 5, 4, "K")
    g.px(16, 26, "L"); g.px(16, 28, "g")


def var_panelo(g, b):
    """pañuelo al cuello con lunares"""
    g.poly([(11, 21), (21, 21), (16, 29)], "R")
    g.rect(12, 20, 9, 2, "r")
    g.px(13, 22, "C"); g.px(17, 22, "C"); g.px(15, 24, "C"); g.px(19, 23, "C")
    g.px(14, 23, "C"); g.px(18, 25, "C"); g.px(16, 27, "C")
    g.hline(12, 20, 21, "r")


def var_reloj(g, b):
    """reloj en la muñeca"""
    g.rect(6, 29, 4, 1, "g")
    g.rect(6, 32, 4, 1, "g")
    g.frame(7, 29, 3, 4, "K")
    g.rect(7, 30, 2, 2, "C")
    g.px(8, 30, "G"); g.px(8, 31, "K"); g.px(7, 31, "K")
    g.px(6, 31, "G"); g.px(10, 31, "G")


def var_lentes_pecho(g, b):
    """gafas de sol colgadas en el escote"""
    g.rect(11, 24, 4, 3, "K")
    g.rect(17, 24, 4, 3, "K")
    g.hline(15, 16, 24, "D")
    g.rect(12, 25, 2, 1, "d"); g.rect(18, 25, 2, 1, "d")
    g.px(11, 25, "W"); g.px(17, 25, "W")
    g.thick_line(11, 23, 9, 21, "D", 2)
    g.thick_line(20, 23, 22, 21, "D", 2)


# ================================================================ BARBIJOS
def _mascara(g, base, shade, valve):
    g.rect(9, 16, 14, 5, base)
    g.rect(10, 21, 12, 2, base)
    g.poly([(9, 21), (23, 21), (16, 24)], base)
    g.px(11, 15, base); g.px(21, 15, base)
    g.hline(10, 22, 18, shade)
    g.hline(11, 21, 20, shade)
    g.px(16, 16, shade)
    g.thick_line(9, 16, 7, 13, shade, 1)
    g.thick_line(23, 16, 25, 13, shade, 1)
    if valve:
        g.disc(21, 19, 2, shade)
        g.px(21, 19, "A")


def bar_comun(g, b):
    """barbijo quirúrgico claro"""
    _mascara(g, "C", "A", False)
    g.hline(10, 22, 17, "W")
    g.px(12, 19, "W"); g.px(19, 19, "W")


def bar_negro(g, b):
    """barbijo negro con válvula"""
    _mascara(g, "D", "K", True)
    g.hline(11, 21, 17, "a")
    g.px(13, 19, "a"); g.px(18, 19, "a")


# ================================================================ GAFAS
def _lentes(g, frame, lens, r=3):
    for cx, x0, x1 in ((12, 9, 15), (18, 16, 22)):
        g.rect(x0, 12, x1 - x0 + 1, 3, lens)
        g.ring(cx, 13, r, frame, 1)
    g.hline(15, 16, 12, frame)
    g.thick_line(8, 12, 7, 11, frame, 1)
    g.thick_line(22, 12, 24, 11, frame, 1)


def gaf_pasta(g, b):
    """armazón grueso de pasta"""
    for cx in (12, 18):
        g.disc(cx, 13, 3, "c")
    _lentes(g, "X", "c", 3)
    for cx in (12, 18):
        g.ring(cx, 13, 4, "X", 1)
    g.px(10, 12, "W"); g.px(16, 12, "W")


def gaf_sol(g, b):
    """gafas de sol cuadradas"""
    g.rect(9, 11, 7, 5, "K")
    g.rect(16, 11, 7, 5, "K")
    g.hline(13, 19, 11, "D")
    g.px(15, 11, "D"); g.px(16, 11, "D")
    for k in range(4):
        g.px(10 + k, 12 + k, "d"); g.px(17 + k, 12 + k, "d")
    g.px(10, 12, "W"); g.px(17, 12, "W")
    g.px(11, 13, "W"); g.px(18, 13, "W")
    g.thick_line(9, 12, 6, 10, "K", 2)
    g.thick_line(23, 12, 25, 10, "K", 2)


def gaf_aviador(g, b):
    """aviador: lente lagriforme y metal dorado"""
    for x0, x1 in ((9, 15), (17, 23)):
        g.poly([(x0, 11), (x1, 11), (x1 - 1, 16), (x0 + 1, 15)], "a")
    for x0, x1 in ((9, 15), (17, 23)):
        g.hline(x0, x1, 11, "G")
        g.vline(x0, 12, 14, "G")
        g.vline(x1, 12, 14, "G")
        g.hline(x0 + 1, x1 - 1, 16, "G")
    g.hline(15, 17, 12, "G")
    g.px(16, 11, "G")
    g.px(10, 13, "A"); g.px(11, 14, "A"); g.px(18, 13, "A"); g.px(19, 14, "A")
    g.px(12, 12, "W"); g.px(20, 12, "W")


# ================================================================ COLLARES
def col_fino(g, b):
    """cadena finita con piedrita"""
    for i in range(12, 21):
        dip = 21 + max(0, 2 - abs(i - 16))
        g.px(i, dip, "g")
    g.px(16, 24, "G")
    g.px(16, 25, "R")
    g.px(15, 24, "L")


def col_cuenta(g, b):
    """vuelta de cuentas de colores"""
    pts = [(11, 21), (13, 23), (16, 24), (19, 23), (21, 21)]
    cols = ["N", "Y", "E", "Y", "N"]
    for (x, y), c in zip(pts, cols):
        g.disc(x, y, 2, c)
        g.px(x, y - 1, "K")
    g.px(16, 23, "L")


def col_medalla(g, b):
    """medalla con cinta"""
    g.thick_line(12, 20, 15, 25, "R", 1)
    g.thick_line(20, 20, 17, 25, "R", 1)
    g.px(13, 22, "r"); g.px(19, 22, "r")
    g.disc(16, 27, 3, "G")
    g.ring(16, 27, 3, "g", 1)
    g.vline(16, 25, 29, "g")
    g.hline(13, 19, 27, "g")
    g.px(15, 26, "L")


# ================================================================ PINS
def pin_balanza(g, b):
    """broche de la balanza"""
    g.vline(15, 25, 29, "G")
    g.hline(13, 18, 25, "G")
    for x in (13, 18):
        g.vline(x, 25, 27, "g")
        g.hline(x - 1, x + 1, 27, "g")
        g.px(x - 1, 28, "g"); g.px(x + 1, 28, "g")
    g.hline(14, 16, 29, "g")
    g.px(15, 24, "L")


def pin_corazon(g, b):
    """broche corazón"""
    g.disc(14, 26, 2, "R")
    g.disc(17, 26, 2, "R")
    g.poly([(12, 27), (19, 27), (15, 30)], "R")
    g.px(13, 26, "W"); g.px(14, 25, "r")


def pin_estrella(g, b):
    """broche estrella"""
    g.px(15, 25, "Y")
    g.hline(15, 15, 26, "Y")
    g.hline(13, 17, 27, "Y")
    g.hline(14, 16, 28, "Y")
    g.px(14, 29, "Y"); g.px(16, 29, "Y")
    g.px(15, 27, "L"); g.px(15, 28, "g")


# ================================================================ BOLSOS
def bol_mochila(g, b):
    """mochila al costado (detrás) con tirante adelante"""
    b.rect(24, 22, 7, 13, "E")
    b.rect(23, 23, 1, 11, "e"); b.rect(30, 24, 1, 9, "e")
    b.rect(24, 22, 7, 3, "X")
    b.rect(26, 24, 2, 3, "e")
    b.rect(25, 29, 4, 3, "X")
    b.px(26, 28, "G"); b.px(27, 28, "G")
    b.hline(25, 29, 34, "X")
    g.thick_line(10, 22, 11, 30, "X", 2)
    g.thick_line(20, 22, 22, 26, "X", 2)
    g.px(11, 30, "G"); g.px(22, 26, "G")


def bol_bandolera(g, b):
    """bandolera cruzada con bolsillo en la cadera"""
    g.thick_line(9, 22, 19, 31, "M", 3)
    g.px(10, 23, "m"); g.px(13, 26, "m"); g.px(16, 29, "m")
    g.rect(16, 31, 6, 6, "b")
    g.rect(16, 31, 6, 2, "M")
    g.frame(16, 31, 6, 6, "K")
    g.px(21, 33, "G"); g.px(21, 32, "G")
    g.hline(17, 20, 35, "B")


def bol_cartera(g, b):
    """cartera colgada de la mano"""
    g.rect(26, 28, 1, 3, "X")
    g.ring(27, 30, 2, "X", 1)
    g.rect(24, 32, 7, 6, "E")
    g.rect(24, 32, 7, 2, "e")
    g.frame(24, 32, 7, 6, "K")
    g.px(27, 34, "G"); g.px(27, 35, "g")
    g.hline(25, 29, 36, "X")


# ================================================================ MANO
def man_martillo(g, b):
    """martillo de juez levantado"""
    g.thick_line(8, 30, 5, 22, "M", 2)
    g.px(6, 27, "m"); g.px(5, 24, "m")
    g.rect(2, 19, 7, 3, "B")
    g.hline(2, 8, 19, "M")
    g.px(2, 20, "m"); g.px(8, 20, "m")
    g.frame(2, 19, 7, 3, "K")
    g.rect(1, 19, 1, 3, "G"); g.rect(9, 19, 1, 3, "G")


def man_carpeta(g, b):
    """carpeta con expediente"""
    g.rect(4, 26, 9, 7, "C")
    g.rect(4, 26, 9, 7, "G")
    g.rect(5, 25, 8, 2, "C")
    g.px(6, 25, "K"); g.px(8, 25, "K"); g.px(10, 25, "K")
    g.frame(4, 26, 9, 7, "B")
    g.rect(4, 29, 9, 1, "B")
    g.px(5, 31, "L"); g.px(6, 31, "g")
    g.rect(6, 30, 1, 2, "R")


def man_pluma(g, b):
    """pluma de escribano"""
    g.thick_line(8, 31, 11, 24, "g", 2)
    g.px(12, 22, "K"); g.px(11, 23, "K")
    g.poly([(11, 24), (14, 16), (17, 15), (13, 24)], "C")
    g.poly([(11, 24), (13, 24), (15, 18), (14, 17)], "F")
    g.px(16, 16, "W"); g.px(15, 18, "W"); g.px(13, 21, "W")
    g.px(11, 32, "K"); g.px(10, 32, "G")


def man_escudo(g, b):
    """escudo/broche de tribunal"""
    g.rect(3, 23, 7, 7, "E")
    g.rect(4, 30, 5, 1, "e")
    g.rect(5, 31, 3, 1, "e")
    g.rect(6, 32, 1, 1, "X")
    g.frame(3, 23, 7, 7, "K")
    g.rect(4, 24, 5, 5, "c")
    g.vline(6, 25, 28, "g")
    g.hline(4, 8, 25, "g")
    g.px(6, 24, "G")


# ================================================================ MASCOTAS
def mas_perro(g, b):
    """perro flaco, cola y orejas paradas"""
    g.rect(23, 35, 8, 4, "m")
    g.disc(30, 34, 3, "m")
    g.poly([(29, 29), (31, 33), (28, 33)], "m")
    g.poly([(26, 29), (28, 33), (25, 33)], "M")
    g.rect(31, 35, 2, 2, "M")
    g.hline(31, 32, 36, "M")
    g.px(32, 34, "K")
    g.px(32, 35, "R")
    g.rect(23, 35, 2, 2, "M")
    g.thick_line(23, 36, 20, 32, "m", 2)
    g.px(20, 31, "M")
    g.vline(24, 39, 40, "m"); g.vline(26, 39, 40, "m")
    g.vline(29, 39, 40, "m"); g.vline(31, 39, 40, "m")
    g.hline(24, 31, 38, "M")
    g.hline(24, 31, 36, "M")


def mas_gato(g, b):
    """gato sentado con cola en S"""
    g.disc(28, 37, 4, "D")
    g.disc(27, 30, 3, "D")
    g.poly([(24, 27), (26, 30), (23, 30)], "D")
    g.poly([(30, 27), (31, 30), (28, 30)], "D")
    g.px(25, 30, "R"); g.px(29, 30, "R")
    g.px(27, 31, "a")
    g.thick_line(32, 33, 31, 28, "D", 2)
    g.px(32, 29, "D")
    g.hline(28, 30, 27, "D")
    g.hline(25, 31, 41, "D")
    g.px(26, 41, "a"); g.px(30, 41, "a")


def mas_loro(g, b):
    """loro sobre un perchero"""
    g.rect(23, 40, 8, 1, "M")
    g.vline(27, 36, 40, "B")
    g.rect(24, 28, 6, 9, "R")
    g.rect(25, 30, 5, 6, "Y")
    g.px(26, 33, "N"); g.px(28, 34, "N")
    g.disc(27, 27, 3, "R")
    g.rect(24, 26, 3, 3, "R")
    g.poly([(24, 26), (22, 27), (24, 29)], "G")
    g.px(24, 27, "K")
    g.poly([(29, 33), (33, 38), (28, 37)], "N")
    g.hline(25, 29, 39, "Y")
    g.px(26, 37, "G")


def mas_conejo(g, b):
    """conejo con orejas largas"""
    g.disc(28, 38, 4, "C")
    g.rect(28, 35, 4, 3, "C")
    g.disc(26, 31, 3, "C")
    g.thick_line(25, 29, 24, 22, "C", 2)
    g.thick_line(29, 29, 30, 22, "C", 2)
    g.thick_line(25, 28, 24, 23, "c", 1)
    g.thick_line(29, 28, 30, 23, "c", 1)
    g.px(26, 31, "K")
    g.px(26, 33, "R")
    g.px(31, 38, "F"); g.px(31, 39, "F")
    g.px(26, 41, "c"); g.px(28, 41, "c")


# ================================================================ JUEZ / FISCAL
def def_judge(g, b):
    # pelo: peluca blanca de juez
    g.disc(16, 9, 9, "W")
    face_oval(g, 6)
    g.rect(5, 9, 4, 8, "W"); g.rect(23, 9, 4, 8, "W")
    g.rect(6, 17, 3, 8, "W"); g.rect(23, 17, 3, 8, "W")
    for cx in (7, 12, 16, 20, 25):
        g.disc(cx, 8, 2, "W")
    for cx in (7, 25):
        g.disc(cx, 25, 2, "W")
    for i in range(9, 24):
        if i % 3 == 0:
            g.px(i, 6, "F")
    g.px(8, 20, "F"); g.px(24, 20, "F")
    # toga negra
    g.rect(8, 21, 17, 12, "K")
    g.poly([(7, 32), (26, 32), (29, 41), (4, 41)], "K")
    g.rect(2, 36, 5, 6, "K"); g.rect(26, 36, 5, 6, "K")
    g.rect(9, 22, 15, 10, "D")
    g.rect(22, 22, 2, 10, "D")
    g.rect(2, 39, 5, 3, "D"); g.rect(26, 39, 5, 3, "D")
    # bands
    g.hline(15, 16, 22, "G")
    g.thick_line(14, 23, 13, 40, "G", 2)
    g.thick_line(18, 23, 19, 40, "G", 2)
    for j in range(24, 40, 2):
        g.px(13, j, "Y"); g.px(20, j + 1, "Y")
    # cuello + cara
    g.rect(14, 18, 4, 4, "S")
    g.disc(16, 12, 8, "S")
    g.rect(14, 21, 4, 2, "S")
    g.shade_lowright("s")
    g.rect(11, 12, 3, 2, "W"); g.rect(17, 12, 3, 2, "W")
    g.px(12, 12, "K"); g.px(12, 13, "K"); g.px(17, 12, "K"); g.px(17, 13, "K")
    g.hline(13, 16, 17, "K")
    g.hline(10, 13, 10, "A"); g.hline(18, 21, 10, "A")     # cejas serenas
    # jabot
    g.rect(14, 21, 4, 2, "C")
    g.thick_line(15, 23, 15, 25, "C", 2)
    g.thick_line(16, 23, 16, 25, "C", 2)
    # brazos
    g.rect(6, 23, 3, 7, "K"); g.rect(22, 23, 3, 7, "K")
    g.rect(6, 27, 3, 4, "C")
    # martillo levantado en la mano derecha
    g.thick_line(7, 28, 4, 23, "M", 2)
    g.rect(7, 18, 7, 3, "B")
    g.hline(7, 13, 18, "M")
    g.rect(6, 18, 1, 3, "G"); g.rect(14, 18, 1, 3, "G")
    g.frame(7, 18, 7, 3, "K")
    g.rect(6, 28, 3, 3, "S")
    g.rect(22, 30, 3, 3, "S")


def def_pros(g, b):
    # saco
    g.poly([(9, 22), (22, 22), (23, 32), (8, 32)], "D")
    g.poly([(13, 22), (18, 22), (18, 31), (13, 31)], "K")
    g.thick_line(13, 22, 16, 27, "K", 2)
    g.thick_line(19, 22, 16, 27, "K", 2)
    # corbata
    g.poly([(15, 24), (18, 24), (17, 29), (16, 29)], "R")
    g.rect(16, 22, 1, 2, "r")
    g.px(16, 25, "r"); g.px(17, 26, "r")
    # cuello de camisa
    g.rect(14, 20, 5, 3, "C")
    g.px(13, 21, "c"); g.px(19, 21, "c")
    # cuello
    g.rect(14, 18, 4, 4, "S")
    # cabeza
    g.disc(16, 12, 8, "S")
    g.rect(14, 21, 4, 2, "S")
    g.rect(23, 12, 2, 4, "S")
    g.shade_lowright("s")
    # ojos afilados
    g.hline(10, 13, 10, "B"); g.hline(17, 20, 10, "B")
    g.rect(11, 12, 3, 2, "W"); g.rect(17, 12, 3, 2, "W")
    g.px(12, 12, "K"); g.px(12, 13, "K"); g.px(17, 12, "K"); g.px(17, 13, "K")
    g.hline(13, 16, 17, "K"); g.px(17, 17, "K")
    # pelo corto oscuro
    g.rect(8, 4, 17, 4, "B")
    g.hline(8, 23, 8, "B")
    for x0, x1, y in ((7, 9, 9), (22, 24, 9), (7, 8, 10), (23, 24, 10),
                      (7, 8, 11), (23, 24, 11), (7, 7, 12), (24, 24, 12)):
        g.hline(x0, x1, y, "B")
    for i in range(9, 22, 2):
        g.px(i, 5, "M"); g.px(i + 1, 6, "b")
    # brazos y manos
    g.rect(6, 23, 3, 8, "D"); g.rect(22, 23, 3, 8, "D")
    g.px(24, 26, "K"); g.px(24, 28, "K")
    g.rect(6, 31, 3, 3, "S"); g.rect(22, 31, 3, 3, "S")
    # pantalón y zapatos
    g.rect(11, 32, 4, 7, "K"); g.rect(17, 32, 4, 7, "K")
    g.px(11, 33, "D"); g.px(17, 34, "D")
    g.hline(13, 16, 34, "D"); g.hline(13, 16, 38, "K")
    g.rect(10, 39, 5, 3, "X"); g.rect(16, 39, 6, 3, "X")
    g.px(9, 40, "X"); g.px(15, 40, "X")
    g.hline(9, 14, 40, "K"); g.hline(15, 21, 40, "K")


# ================================================================ catálogo
CATS = [
    ("pelo", "PELO", "HAIR", [
        ("largo", "Largo rizado", "Long Curls", 0, pelo_largo),
        ("corto", "Corto", "Short", 3, pelo_corto),
        ("rizado", "Rizado", "Curly", 5, pelo_rizado),
        ("coleta", "Coleta", "Ponytail", 2, pelo_coleta),
        ("trenzas", "Trenzas", "Braids", 7, pelo_trenzas),
    ]),
    ("gorros", "GORROS", "HATS", [
        ("gorra", "Gorra", "Cap", 1, gorro_gorra),
        ("boina", "Boina", "Beret", 4, gorro_boina),
        ("sombrero", "Sombrero", "Hat", 8, gorro_sombrero),
        ("cinta", "Cinta", "Headband", 0, gorro_cinta),
    ]),
    ("auriculares", "AURICULARES", "HEADPHONES", [
        ("basicos", "Básicos", "Basic", 2, aur_basicos),
        ("gamer", "Gamer", "Gamer", 6, aur_gamer),
        ("retro", "Retro", "Retro", 9, aur_retro),
    ]),
    ("bufandas", "BUFANDAS", "SCARVES", [
        ("bufanda", "Bufanda", "Scarf", 3, buf_bufanda),
        ("capa", "Capa", "Cape", 10, buf_capa),
    ]),
    ("varios", "VARIOS", "MISC", [
        ("cadena", "Cadena", "Chain", 0, var_cadena),
        ("panuelo", "Pañuelo", "Neckerchief", 4, var_panelo),
        ("reloj", "Reloj", "Watch", 1, var_reloj),
        ("lentes_sol_pecho", "Gafas al pecho", "Glasses on chest", 6, var_lentes_pecho),
    ]),
    ("barbijos", "BARBIJOS", "MASKS", [
        ("comun", "Común", "Standard", 0, bar_comun),
        ("negro", "Negro", "Black", 7, bar_negro),
    ]),
    ("gafas", "GAFAS", "GLASSES", [
        ("pasta", "De pasta", "Frames", 0, gaf_pasta),
        ("sol", "De sol", "Sunglasses", 5, gaf_sol),
        ("aviador", "Aviador", "Aviators", 8, gaf_aviador),
    ]),
    ("collares", "COLLARES", "NECKLACES", [
        ("fino", "Fino", "Thin", 2, col_fino),
        ("cuenta", "De cuentas", "Beaded", 6, col_cuenta),
        ("medalla", "Medalla", "Medal", 9, col_medalla),
    ]),
    ("pins", "PINS", "PINS", [
        ("balanza", "Balanza", "Scales", 0, pin_balanza),
        ("corazon", "Corazón", "Heart", 3, pin_corazon),
        ("estrella", "Estrella", "Star", 8, pin_estrella),
    ]),
    ("bolsos", "BOLSOS", "BAGS", [
        ("mochila", "Mochila", "Backpack", 4, bol_mochila),
        ("bandolera", "Bandolera", "Satchel", 7, bol_bandolera),
        ("cartera", "Cartera", "Handbag", 10, bol_cartera),
    ]),
    ("mano", "MANO", "HELD ITEM", [
        ("martillo", "Martillo", "Gavel", 0, man_martillo),
        ("carpeta", "Carpeta", "Folder", 5, man_carpeta),
        ("pluma", "Pluma", "Quill", 9, man_pluma),
        ("escudo", "Escudo", "Badge", 2, man_escudo),
    ]),
    ("mascotas", "MASCOTAS", "PETS", [
        ("perro", "Perro", "Dog", 0, mas_perro),
        ("gato", "Gato", "Cat", 5, mas_gato),
        ("loro", "Loro", "Parrot", 10, mas_loro),
        ("conejo", "Conejo", "Rabbit", 3, mas_conejo),
    ]),
]


def build_item(cat_key, fn):
    front = Grid()
    back = Grid()
    fn(front, back)
    zb = Z[cat_key]
    parts = []
    if back.bbox() is not None:
        parts.extend(back.outline("K").to_parts(Z_BACK))
    parts.extend(front.outline("K").to_parts(zb))
    parts.sort(key=lambda p: (p["z"], p["y"], p["x"]))
    return parts


def build_figure(fn, z=0):
    g = Grid()
    b = Grid()
    fn(g, b)
    parts = []
    if b.bbox() is not None:
        parts.extend(b.outline("K").to_parts(Z_BACK))
    parts.extend(g.outline("K").to_parts(z))
    parts.sort(key=lambda p: (p["z"], p["y"], p["x"]))
    return parts


# ================================================================ ensamble
def pal_for(letters):
    pal = {}
    for k in PAL_FULL:                      # orden estable de la paleta bloqueada
        if k in letters:
            pal[k] = PAL_FULL[k]
    pal["S"] = PAL_FULL["S"]
    pal["s"] = PAL_FULL["s"]
    return pal


def assemble():
    body_grid = Grid()
    def_body(body_grid)
    body_parts = body_grid.to_parts(0)
    letters = set(body_grid.used_letters())

    categories = []
    for key, es, en, items in CATS:
        c = {"key": key, "name": {"es": es, "en": en}, "items": []}
        for ikey, ies, ien, lvl, fn in items:
            parts = build_item(key, fn)
            for p in parts:
                for row in p["rows"]:
                    letters |= set(ch for ch in row if ch != TRANSPARENT)
            c["items"].append({"key": ikey, "name": {"es": ies, "en": ien},
                               "lvl": lvl, "parts": parts})
        categories.append(c)

    judge = build_figure(def_judge)
    pros = build_figure(def_pros)
    for f in (judge, pros):
        for p in f:
            for row in p["rows"]:
                letters |= set(ch for ch in row if ch != TRANSPARENT)

    letters |= {"S", "s", "K"}
    return {
        "size": [W, H],
        "pal": pal_for(letters),
        "body": body_parts,
        "categories": categories,
        "judge": {"w": W, "h": H, "parts": judge},
        "prosecutor": {"w": W, "h": H, "parts": pros},
    }


# ================================================================ chequeos
def selfcheck(V):
    errs = []
    need = ["pelo", "gorros", "auriculares", "bufandas", "varios", "barbijos",
            "gafas", "collares", "pins", "bolsos", "mano", "mascotas"]
    got = [c["key"] for c in V["categories"]]
    if got != need:
        errs.append("keys de categorias mal: %r" % got)
    total = sum(len(c["items"]) for c in V["categories"])
    if total != 40:
        errs.append("total de items = %d (debe ser 40)" % total)
    if "S" not in V["pal"] or "s" not in V["pal"]:
        errs.append("pal debe tener S y s")
    def check_parts(name, parts):
        for p in parts:
            if not p["rows"]:
                errs.append("%s: parte vacía" % name)
                continue
            n = len(p["rows"][0])
            for row in p["rows"]:
                if len(row) != n:
                    errs.append("%s: filas de distinto largo en x=%s y=%s" % (name, p["x"], p["y"]))
                    break
                for ch in row:
                    if ch not in (TRANSPARENT, " ") and ch not in V["pal"]:
                        errs.append("%s: letra %r fuera de pal" % (name, ch))
                        break
                if p["x"] < 0 or p["x"] + n > W or p["y"] < 0 or p["y"] + len(p["rows"]) > H:
                    errs.append("%s: fuera de 32x42 (x=%d y=%d w=%d h=%d)" %
                                (name, p["x"], p["y"], n, len(p["rows"])))
    check_parts("body", V["body"])
    for cat in V["categories"]:
        for it in cat["items"]:
            check_parts("%s/%s" % (cat["key"], it["key"]), it["parts"])
    for key in ("judge", "prosecutor"):
        check_parts(key, V[key]["parts"])
    for cat, ikey in (("pelo", "largo"), ("varios", "cadena"),
                      ("mascotas", "perro"), ("mano", "martillo")):
        c = next((x for x in V["categories"] if x["key"] == cat), None)
        if not c or not any(i["key"] == ikey for i in c["items"]):
            errs.append("falta %s/%s" % (cat, ikey))
    lvl0 = sum(1 for c in V["categories"] for i in c["items"] if i["lvl"] == 0)
    if lvl0 != 8:
        errs.append("items lvl:0 = %d (deben ser 8)" % lvl0)
    return errs


# ================================================================ salida JS
def to_js(V):
    def enc(o, ind):
        pad = "  " * ind
        pad2 = "  " * (ind + 1)
        if isinstance(o, dict):
            ks = list(o.keys())
            if not ks:
                return "{}"
            out = ["{"]
            for i, k in enumerate(ks):
                comma = "," if i < len(ks) - 1 else ""
                key = k if all(ch.isalnum() or ch == "_" for ch in k) and not k[0].isdigit() else json.dumps(k)
                out.append("%s%s: %s%s" % (pad2, key, enc(o[k], ind + 1), comma))
            out.append("%s}" % pad)
            return "\n".join(out)
        if isinstance(o, list):
            if not o:
                return "[]"
            if all(not isinstance(x, (dict, list)) for x in o):
                if all(isinstance(x, str) and len(x) > 24 for x in o):
                    body = (",\n" + pad2).join(json.dumps(x) for x in o)
                    return "[\n" + pad2 + body + "\n" + pad + "]"
                return "[" + ", ".join(json.dumps(x) if isinstance(x, str)
                                       else ("true" if x is True else "false" if x is False
                                             else repr(x)) for x in o) + "]"
            out = ["["]
            for i, x in enumerate(o):
                comma = "," if i < len(o) - 1 else ""
                out.append("%s%s%s" % (pad2, enc(x, ind + 1), comma))
            out.append("%s]" % pad)
            return "\n".join(out)
        if isinstance(o, str):
            return json.dumps(o, ensure_ascii=False)
        if isinstance(o, bool):
            return "true" if o else "false"
        if isinstance(o, int):
            return repr(o)
        return json.dumps(o, ensure_ascii=False)

    head = (
        "/* =========================================================\n"
        "   vestuario.js · DATOS GENERADOS por tools/build_sprites.py\n"
        "   No editar a mano: editar el generador y volver a correr\n"
        "       python tools/build_sprites.py\n"
        "   size  : avatar de 32x42   pal: letra -> color (S/s = piel)\n"
        "   body  : chibi base        categories: 12 (40 items)\n"
        "   judge / prosecutor: personajes del tribunal\n"
        "   ========================================================= */\n"
        "var DF = window.DF;   /* mismo objeto; permite require() en Node */\n"
    )
    return head + "\nDF.vestuario = " + enc(V, 0) + ";\n"


def main():
    V = assemble()
    errs = selfcheck(V)
    if errs:
        for e in errs:
            sys.stderr.write("ERROR: %s\n" % e)
        return 1
    js = "window.DF = window.DF || {};\n" + to_js(V)
    d = os.path.dirname(OUT_PATH)
    if not os.path.isdir(d):
        os.makedirs(d)
    with open(OUT_PATH, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(js)
    print("escrito %s (%d bytes)" % (OUT_PATH, len(js.encode("utf-8"))))
    print("pal: %d colores · body %d partes · %d items en %d categorias" % (
        len(V["pal"]), len(V["body"]),
        sum(len(c["items"]) for c in V["categories"]), len(V["categories"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
