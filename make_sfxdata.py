#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
把 assets/sfx/*.wav 转成小体积 MP3、再 base64 内嵌成 src/js/95-sfxdata.js
（保持游戏单文件、离线可播）
用法: python make_sfxdata.py
"""
import base64
import glob
import json
import shutil
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "assets", "sfx")
OUT = os.path.join(ROOT, "src", "js", "95-sfxdata.js")
FF = os.path.join(
    os.environ.get("LOCALAPPDATA", ""),
    r"Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    r"\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe",
)
if not os.path.exists(FF):
    FF = "ffmpeg"

# 逻辑名 -> 截取时长（秒）
TRIM = {
    "coin": 0.40, "jump": 0.30, "land": 0.35, "task": 0.95, "door": 0.55,
    "fall": 0.30, "buy": 0.55, "portal": 0.95, "chip": 0.60, "select": 0.07,
}


def mp3_b64(wav, seconds, tmpdir):
    stem = os.path.splitext(os.path.basename(wav))[0]
    mp3 = os.path.join(tmpdir, stem + ".mp3")
    subprocess.run(
        [FF, "-y", "-loglevel", "error", "-i", wav, "-t", str(seconds),
         "-ac", "1", "-ar", "22050", "-b:a", "64k", mp3],
        check=True,
    )
    keep = os.path.join(SRC, "mp3")
    os.makedirs(keep, exist_ok=True)
    shutil.copyfile(mp3, os.path.join(keep, stem + ".mp3"))
    with open(mp3, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii"), os.path.getsize(mp3)


def main():
    if not os.path.isdir(SRC):
        sys.exit("no assets/sfx")
    groups = {}
    for wav in sorted(glob.glob(os.path.join(SRC, "*.wav"))):
        name = os.path.splitext(os.path.basename(wav))[0]
        parts = name.rsplit("_", 1)
        key = parts[0] if len(parts) == 2 and parts[1].isdigit() else name
        groups.setdefault(key, []).append(wav)

    tmpdir = tempfile.mkdtemp()
    data, total = {}, 0
    lines = []
    for key in sorted(groups):
        secs = TRIM.get(key, 0.8)
        items = []
        for wav in groups[key]:
            b64, size = mp3_b64(wav, secs, tmpdir)
            items.append(b64)
            total += size
        data[key] = items
        lines.append('  %s: [%s]' % (json.dumps(key), ",".join('"%s"' % s for s in items)))

    body = "/* 音效数据（base64 MP3，forge_sfx 生成后转码内嵌）—— 由 make_sfxdata.py 生成 */\n"
    body += "const SFX_DATA = {\n" + ",\n".join(lines) + "\n};\n"

    # 背景音乐（forge_music 生成的无缝循环）
    bgm = os.path.join(os.path.dirname(SRC), "music", "bgm_city.mp3")
    if os.path.isfile(bgm):
        with open(bgm, "rb") as f:
            body += "\n/* 背景音乐：forge_music 生成的 8 小节无缝循环 */\n"
            body += 'const BGM_DATA = "%s";\n' % base64.b64encode(f.read()).decode("ascii")
        print("bgm %s %.1f KB" % (os.path.basename(bgm), os.path.getsize(bgm) / 1024.0))

    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(body)

    print("groups: %s" % ", ".join("%s x%d" % (k, len(v)) for k, v in sorted(data.items())))
    print("mp3 total %.1f KB -> %s (%.1f KB)" % (total / 1024.0, OUT, os.path.getsize(OUT) / 1024.0))


if __name__ == "__main__":
    main()
