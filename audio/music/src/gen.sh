#!/bin/bash
# gen.sh TRACK TAKE : one music call for body-TRACK-tTAKE.json, tries output formats from best to least.
# Writes TRACK-tTAKE.<ext>, TRACK-tTAKE.hdr, and one line per attempt to gen-TRACK-tTAKE.log
cd /home/user/workspace/music-work || exit 9
t=$1; k=$2; body=body-$t-t$k.json; log=gen-$t-t$k.log
[ "$3" = "keep" ] || : > $log
for fmt in pcm_48000 mp3_48000_320 mp3_48000_192 mp3_44100_192 mp3_44100_128; do
  ext=mp3; [ "${fmt:0:3}" = "pcm" ] && ext=pcm
  out=$t-t$k.$ext
  s=$(date -u +%s)
  code=$(pplx credentials run "$MUSIC_CRED" -- curl -sS --max-time 900 -D $t-t$k.hdr -o $out.part -w '%{http_code}' -X POST "https://api.elevenlabs.io/v1/music?output_format=$fmt" -H 'Content-Type: application/json' -d @$body 2>>$log)
  e=$(date -u +%s)
  echo "ATTEMPT $fmt http $code secs $((e-s)) bytes $(stat -c %s $out.part 2>/dev/null) at $(date -u +%H:%M:%S)" >> $log
  if [ "$code" = "200" ]; then
    mv $out.part $out
    echo "OK $out format $fmt song-id $(grep -i '^song-id' $t-t$k.hdr | tr -d '\r' | cut -d' ' -f2)" >> $log
    echo "EXIT 0" >> $log; exit 0
  fi
  head -c 600 $out.part >> $log; echo >> $log
  if [ "$code" = "429" ]; then rm -f $out.part; node -e "setTimeout(()=>{},20000)"; exec ./gen.sh $t $k keep; fi
  if grep -qiE 'output_format|subscription|tier|not allowed|upgrade' $out.part; then rm -f $out.part; continue; fi
  rm -f $out.part
  echo "EXIT 3" >> $log; exit 3
done
echo "EXIT 4" >> $log; exit 4
