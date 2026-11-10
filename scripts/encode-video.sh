#!/usr/bin/env bash
# Owner: Agent C — hero video pipeline.
#
# Turns one source clip into the hero media set used by VideoHero (names fixed in src/lib/media.ts):
#   public/media/hero-saigon-mobile.{mp4,webm}      720×1280 portrait   (target ≤ 2.5 MB)
#   public/media/hero-saigon-desktop.{mp4,webm}     1920×1080 landscape (target ≤ 5 MB)
#   public/media/hero-saigon-poster.{webp,avif}           1920×1080 poster (first frame)
#   public/media/hero-saigon-poster-portrait.{webp,avif}  720×1280 poster
#   public/media/hero-saigon-bg.webp                tiny pre-blurred background for other pages
#
# Usage:
#   scripts/encode-video.sh <source-video> [start-seconds=0] [duration-seconds=12] [out-dir=public/media]
#   e.g. scripts/encode-video.sh ~/Downloads/nguyen-hue-night.mov 3.5 10
#
# MP4: H.264, -preset veryfast, CRF 28, no audio, +faststart. WebM: VP9 (CRF 36), no audio.
# Duration must be 8–15 s (SPEC). Pick a start/duration whose first and last frames match for a
# seamless loop. Requires ffmpeg with libx264, libvpx-vp9 and libwebp (libaom-av1 or libsvtav1 for AVIF).
set -euo pipefail

die() {
  echo "encode-video: $*" >&2
  exit 1
}

if ! command -v ffmpeg >/dev/null 2>&1; then
  die "ffmpeg が見つかりません / ffmpeg not found. Install it first:
  macOS: brew install ffmpeg · Ubuntu: sudo apt install ffmpeg · Windows: winget install Gyan.FFmpeg"
fi

SRC="${1:-}"
START="${2:-0}"
DUR="${3:-12}"
OUT="${4:-public/media}"

[[ -n "$SRC" ]] || die "usage: $0 <source-video> [start=0] [duration=12] [out-dir=public/media]"
[[ -f "$SRC" ]] || die "source not found: $SRC"
awk -v d="$DUR" 'BEGIN { exit !(d >= 8 && d <= 15) }' || die "duration must be 8–15 seconds (got $DUR)"
mkdir -p "$OUT"

has_encoder() { ffmpeg -hide_banner -encoders 2>/dev/null | grep -qw "$1"; }
for enc in libx264 libvpx-vp9 libwebp; do
  has_encoder "$enc" || die "this ffmpeg build lacks the $enc encoder"
done
AV1=""
if has_encoder libaom-av1; then AV1="libaom-av1"; elif has_encoder libsvtav1; then AV1="libsvtav1"; fi

FF=(ffmpeg -hide_banner -loglevel error -y)
CUT=(-ss "$START" -t "$DUR" -i "$SRC")
# Cover-crop to the exact frame size, cap at 30 fps, even dimensions, yuv420p for Safari.
vf() { echo "scale=$1:$2:force_original_aspect_ratio=increase,crop=$1:$2,fps=30,format=yuv420p"; }

encode() { # name width height
  local name="$1" w="$2" h="$3" filter
  filter="$(vf "$w" "$h")"
  echo "▶ $name ($w×$h)"
  "${FF[@]}" "${CUT[@]}" -vf "$filter" -an \
    -c:v libx264 -preset veryfast -crf 28 -profile:v high -movflags +faststart \
    "$OUT/hero-saigon-$name.mp4"
  "${FF[@]}" "${CUT[@]}" -vf "$filter" -an \
    -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
    "$OUT/hero-saigon-$name.webm"
}

poster() { # suffix width height
  local base="$OUT/hero-saigon-poster$1" filter
  filter="scale=$2:$3:force_original_aspect_ratio=increase,crop=$2:$3"
  "${FF[@]}" -ss "$START" -i "$SRC" -frames:v 1 -vf "$filter" -c:v libwebp -quality 78 "$base.webp"
  if [[ -n "$AV1" ]]; then
    "${FF[@]}" -ss "$START" -i "$SRC" -frames:v 1 -vf "$filter,format=yuv420p" \
      -c:v "$AV1" -still-picture 1 -crf 32 "$base.avif" 2>/dev/null ||
      echo "  (AVIF skipped: $AV1 failed)"
  else
    echo "  (AVIF skipped: no AV1 encoder in this ffmpeg)"
  fi
}

encode mobile 720 1280
encode desktop 1920 1080
echo "▶ posters"
poster "" 1920 1080
poster "-portrait" 720 1280
"${FF[@]}" -ss "$START" -i "$SRC" -frames:v 1 \
  -vf "scale=96:-2,gblur=sigma=4" -c:v libwebp -quality 60 "$OUT/hero-saigon-bg.webp"

# ───── Size report vs. SPEC targets ─────
bytes() { wc -c <"$1" | tr -d ' '; }
report() { # file limit-bytes
  local f="$1" limit="$2" b
  [[ -f "$f" ]] || return 0
  b="$(bytes "$f")"
  awk -v f="$(basename "$f")" -v b="$b" -v l="$limit" 'BEGIN {
    mark = (l > 0) ? ((b <= l) ? "OK  " : "OVER") : "    ";
    if (l > 0) printf "%s %-44s %7.2f MB  (target ≤ %.1f MB)\n", mark, f, b / 1048576, l / 1048576;
    else       printf "%s %-44s %7.1f KB\n", mark, f, b / 1024;
  }'
}
echo
echo "Sizes:"
over=0
for f in mobile.mp4 mobile.webm; do report "$OUT/hero-saigon-$f" $((2560 * 1024)); done
for f in desktop.mp4 desktop.webm; do report "$OUT/hero-saigon-$f" $((5 * 1024 * 1024)); done
for f in poster.webp poster.avif poster-portrait.webp poster-portrait.avif bg.webp; do
  report "$OUT/hero-saigon-$f" 0
done
[[ "$(bytes "$OUT/hero-saigon-mobile.mp4")" -le $((2560 * 1024)) ]] || over=1
[[ "$(bytes "$OUT/hero-saigon-desktop.mp4")" -le $((5 * 1024 * 1024)) ]] || over=1
if [[ $over -eq 1 ]]; then
  echo "⚠ Over budget: shorten the clip (≥ 8 s) or raise CRF (e.g. 30–32) in this script." >&2
fi
echo "Done. Update CREDITS.md with the video source and licence."
