#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
把 src/head.html + src/js/*.js 拼成单文件游戏（纯 canvas 2D，无外部依赖）。
产物:
  霓虹狂奔2D.html   离线双击版
  game.html         网站版（内容相同，便于隧道/子路径访问）
用法: python build_game.py
"""
import glob
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))


def read(p):
    with open(p, "r", encoding="utf-8") as f:
        return f.read()


def main():
    head = read(os.path.join(ROOT, "src", "head.html"))
    files = sorted(glob.glob(os.path.join(ROOT, "src", "js", "*.js")))
    if not files:
        sys.exit("no js files")
    parts = []
    for f in files:
        parts.append("/* ==== " + os.path.basename(f) + " ==== */")
        parts.append(read(f))
    body = "\n".join(parts)
    html = head + body + "\n</script>\n</body>\n</html>\n"

    out1 = os.path.join(ROOT, "霓虹狂奔2D.html")
    with open(out1, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    out2 = os.path.join(ROOT, "game.html")
    with open(out2, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)

    print("built %s  %.1f KB" % (out1, os.path.getsize(out1) / 1024.0))
    print("built %s  %.1f KB  (%d js)" % (out2, os.path.getsize(out2) / 1024.0, len(files)))


if __name__ == "__main__":
    main()
