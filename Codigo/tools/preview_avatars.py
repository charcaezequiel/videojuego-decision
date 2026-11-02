#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
preview_avatars.py · Vista previa en terminal del pixel-art generado.

Lee js/data/vestuario.js (el archivo de datos real, no una copia) y compone
los personajes pintando las PARTES en orden de z, como hace js/core/sprites.js.

Uso:
    python tools/preview_avatars.py            # bloques Unicode con color
    python tools/preview_avatars.py --ascii    # letras (para revisar silueta)
    python tools/preview_avatars.py --all      # + los 40 items uno por uno
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "js", "data", "vestuario.js")

TRANS = (".", " ")


def load_vestuario(path=DATA):
    """extrae el objeto DF.vestuario del JS y lo devuelve como dict"""
    with open(path, "r", encoding="utf-8") as fh:
        src = fh.read()
    if not src.startswith("window.DF = window.DF || {};"):
        raise SystemExit("vestuario.js no empieza con window.DF = window.DF || {};")
    m = re.search(r"DF\.vestuario\s*=\s*(\{.*\})\s*;\s*$", src, re.S)
    if not m:
        raise SystemExit("no se encontró DF.vestuario")
    js = re.sub(r'([{\[,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', m.group(1))
    return json.loads(js)


# ---------------------------------------------------------------- composición
def compose(V, parts_list):
    w, h = V["size"]
    grid = [[None] * w for _ in range(h)]
    pal = V["pal"]
    all_parts = []
    for parts in parts_list:
        all_parts.extend(parts)
    for p in sorted(all_parts, key=lambda q: (q["z"], q["y"], q["x"])):
        for j, row in enumerate(p["rows"]):
            y = p["y"] + j
            if y < 0 or y >= h:
                continue
            for i, ch in enumerate(row):
                x = p["x"] + i
                if ch in TRANS or x < 0 or x >= w:
                    continue
                grid[y][x] = pal.get(ch, "#ff00ff")
    return grid


def avatar_parts(V, spec):
    """body + lo que lleve puesto, igual que sprites.js avatar()"""
    parts = list(V["body"])
    for cat in V["categories"]:
        if cat["key"] == "mascotas" and spec.get("noPet"):
            continue
        key = spec.get(cat["key"])
        if not key:
            continue
        it = next((i for i in cat["items"] if i["key"] == key), None)
        if it:
            parts.extend(it["parts"])
    return parts


# ---------------------------------------------------------------- salida
def hex2rgb(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def fg(c):
    return "\x1b[38;2;%d;%d;%dm" % hex2rgb(c)


def bg(c):
    return "\x1b[48;2;%d;%d;%dm" % hex2rgb(c)


def print_blocks(grid, w, h, scale=1):
    for y in range(0, h, 2):
        line = []
        for x in range(w):
            top = grid[y][x]
            bot = grid[y + 1][x] if y + 1 < h else None
            if top == bot:
                if top is None:
                    line.append("  ")
                else:
                    line.append(bg(top) + "  " + "\x1b[0m")
            elif top is None:
                line.append(bg(bot) + "▄▄" + "\x1b[0m")
            elif bot is None:
                line.append(bg(bot) + "\x1b[38;2;0;0;0m▀▀" + "\x1b[0m")
            else:
                line.append(fg(top) + bg(bot) + "▀▀" + "\x1b[0m")
        sys.stdout.write("".join(line) + "\n")


def print_letters(grid, w, h):
    for y in range(h):
        row = []
        for x in range(w):
            c = grid[y][x]
            row.append("  " if c is None else ("??" if c == "#ff00ff" else letter_of(grid, x, y)))
        sys.stdout.write("".join(row) + "\n")


_LETTER_CACHE = {}


def letter_of(grid, x, y):
    """letra legible por color (reutiliza la paleta invertida)"""
    inv = _LETTER_CACHE.get("inv")
    if inv is None:
        return "?"
    return inv.get(grid[y][x], "?")


def setup_letters(V):
    _LETTER_CACHE["inv"] = {hex2rgbstr(h): k for k, h in V["pal"].items()}


def hex2rgbstr(c):
    return c.lower()


def show(V, title, grid):
    w, h = V["size"]
    print("")
    print("\x1b[1m%s\x1b[0m  (%dx%d)" % (title, w, h))
    if MODE == "ascii":
        print_letters(grid, w, h)
    else:
        print_blocks(grid, w, h)


MODE = "blocks"


def main():
    global MODE
    args = sys.argv[1:]
    if "--ascii" in args:
        MODE = "ascii"
    dump_all = "--all" in args
    V = load_vestuario()
    if MODE == "ascii":
        setup_letters(V)
    w, h = V["size"]
    print("\x1b[1mpreview_avatars.py · datos leídos de js/data/vestuario.js\x1b[0m")
    print("size %dx%d · %d colores · %d items en %d categorías" % (
        w, h, len(V["pal"]),
        sum(len(c["items"]) for c in V["categories"]), len(V["categories"])))

    default = {"pelo": "largo", "varios": "cadena"}
    show(V, "avatar default  (pelo:largo + varios:cadena)",
         compose(V, [avatar_parts(V, default)]))

    dressed = dict(default)
    dressed.update({"gorros": "gorra", "gafas": "sol", "bufandas": "bufanda",
                    "pins": "balanza", "bolsos": "bandolera", "mano": "martillo",
                    "mascotas": "perro"})
    show(V, "avatar equipado al máximo (para ver solapamientos)",
         compose(V, [avatar_parts(V, dressed)]))

    show(V, "JUEZ", compose(V, [V["judge"]["parts"]]))
    show(V, "FISCAL", compose(V, [V["prosecutor"]["parts"]]))

    if dump_all:
        for cat in V["categories"]:
            for it in cat["items"]:
                print("")
                print("\x1b[1m%s / %s\x1b[0m  lvl %d" % (cat["key"], it["key"], it["lvl"]))
                if MODE == "ascii":
                    setup_letters(V)
                show_grid(cat["key"] + "/" + it["key"], compose(V, [it["parts"]]), V)
    return 0


def show_grid(title, grid, V):
    w, h = V["size"]
    if MODE == "ascii":
        print_letters(grid, w, h)
    else:
        print_blocks(grid, w, h)


if __name__ == "__main__":
    sys.exit(main())
