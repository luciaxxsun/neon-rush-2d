#!/bin/bash
# 一键发布到 GitHub Pages：改完源码后跑这个
set -e
cd "$(dirname "$0")"
GH="$HOME/AppData/Local/Programs/gh/bin/gh.exe"
python build_game.py
git add -A
git commit -m "更新：$(date '+%Y-%m-%d %H:%M')" || echo "(没有改动)"
git push origin main
echo
echo "已推送。Pages 大约 30~60 秒后更新："
echo "  https://luciaxxsun.github.io/neon-rush-2d/"
