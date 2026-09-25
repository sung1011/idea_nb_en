"""Generate missing neural-voice mp3s and write public/audio/manifest.json."""

import asyncio
import json
import shutil
import subprocess
import sys
from pathlib import Path

import edge_tts


async def synthesize(text: str, voice: str, rate: str, dest: Path) -> None:
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(str(dest))


def shrink(src: Path) -> None:
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        return
    tmp = src.with_suffix('.tmp.mp3')
    result = subprocess.run(
        [
            ffmpeg,
            '-y',
            '-i',
            str(src),
            '-ac',
            '1',
            '-ar',
            '24000',
            '-codec:a',
            'libmp3lame',
            '-b:a',
            '40k',
            str(tmp),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if result.returncode != 0 or not tmp.exists():
        tmp.unlink(missing_ok=True)
        return
    if tmp.stat().st_size < src.stat().st_size:
        tmp.replace(src)
    else:
        tmp.unlink()


async def main() -> int:
    catalog_path = Path(sys.argv[1])
    audio_dir = Path(sys.argv[2])
    audio_dir.mkdir(parents=True, exist_ok=True)
    catalog = json.loads(catalog_path.read_text())
    clips = catalog['clips']
    sem = asyncio.Semaphore(6)
    failed: list[str] = []
    made = 0
    skipped = 0
    done = 0

    async def one(clip: dict) -> None:
        nonlocal made, skipped, done
        try:
            dest = audio_dir.parent / clip['file']
            dest.parent.mkdir(parents=True, exist_ok=True)
            if dest.exists() and dest.stat().st_size > 0:
                skipped += 1
                return
            async with sem:
                last = ''
                for attempt in range(3):
                    try:
                        await synthesize(clip['text'], clip['voice'], clip['rate'], dest)
                        if dest.stat().st_size <= 0:
                            raise RuntimeError('empty audio')
                        shrink(dest)
                        made += 1
                        return
                    except Exception as error:  # noqa: BLE001 — retry then record
                        last = str(error)
                        dest.unlink(missing_ok=True)
                        await asyncio.sleep(0.6 * (attempt + 1))
                failed.append(f"{clip['lang']} {clip['text']}: {last}")
        finally:
            done += 1
            if done % 50 == 0 or done == len(clips):
                print(f'progress {done}/{len(clips)}', flush=True)

    await asyncio.gather(*(one(clip) for clip in clips))

    ready = []
    for clip in clips:
        dest = audio_dir.parent / clip['file']
        if dest.exists() and dest.stat().st_size > 0:
            ready.append(clip)

    manifest = {
        'voices': {
            'en-US': {'voice': 'en-US-AnaNeural', 'rate': '-12%'},
            'zh-CN': {'voice': 'zh-CN-XiaoxiaoNeural', 'rate': '+0%'},
        },
        'clips': {clip['key']: clip['file'] for clip in ready},
    }
    manifest_path = audio_dir / 'manifest.json'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    total = sum((audio_dir / Path(clip['file']).name).stat().st_size for clip in ready)
    print(f'wrote {len(ready)} clips, {made} new, {skipped} reused, {total} bytes')
    if failed:
        print(f'FAILED {len(failed)}')
        for line in failed[:12]:
            print(line)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(asyncio.run(main()))
