#!/usr/bin/env python3
"""Génère l'icône de notification Android à partir du logo Kær.

Android n'utilise QUE le canal alpha de l'icône de notif (la couleur est
ignorée puis remplacée par la teinte `color` de app.json). Il faut donc une
silhouette blanche sur fond 100% transparent, pas le logo couleur.

Source : assets/icon.png (K blanc sur fond turquoise #5ABFC5, opaque).
Sortie : assets/notification-icon.png (K blanc, reste transparent).

Principe : le « K » est blanc (canaux R/G/B tous très élevés), le fond
turquoise a un R faible (~90). On dérive l'alpha du canal minimum (min des
R,G,B) : élevé pour le blanc, bas pour le turquoise. Une rampe entre deux
seuils préserve l'anti-aliasing des bords.
"""

from PIL import Image

SRC = "assets/icon.png"
OUT = "assets/notification-icon.png"
SIZE = 512

# Seuils sur le canal minimum (min(R,G,B)) :
#  - turquoise #5ABFC5 -> min = 90  -> transparent
#  - blanc     #FFFFFF -> min = 255 -> opaque
LOW = 150   # en dessous : totalement transparent
HIGH = 225  # au dessus : totalement opaque


def main() -> None:
    src = Image.open(SRC).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    px = src.load()

    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    op = out.load()

    span = HIGH - LOW
    for y in range(SIZE):
        for x in range(SIZE):
            r, g, b = px[x, y]
            minc = min(r, g, b)
            if minc <= LOW:
                a = 0
            elif minc >= HIGH:
                a = 255
            else:
                a = round((minc - LOW) / span * 255)
            if a:
                op[x, y] = (255, 255, 255, a)  # silhouette blanche

    out.save(OUT)
    print(f"OK -> {OUT} ({SIZE}x{SIZE}, blanc sur transparent)")


if __name__ == "__main__":
    main()
