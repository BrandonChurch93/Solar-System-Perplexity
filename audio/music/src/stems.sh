#!/bin/bash
# stems.sh : the generator's own stem separation on the three kept takes, to look for a voice stem. Reads nothing but the raw takes.
cd /home/user/workspace/music-work || exit 9
for t in hybrid orchestral ambient; do
  s=$(date -u +%s)
  code=$(pplx credentials run "$MUSIC_CRED" -- curl -sS --max-time 900 -o stems/$t.zip -w '%{http_code}' -X POST "https://api.elevenlabs.io/v1/music/stem-separation?output_format=mp3_44100_128" -F "file=@out/raw/$t-take3.mp3;type=audio/mpeg" 2>>stems/log.txt)
  e=$(date -u +%s)
  echo "STEMS $t http $code secs $((e-s)) bytes $(stat -c %s stems/$t.zip 2>/dev/null)" >> stems/log.txt
  [ "$code" = "200" ] || { head -c 400 stems/$t.zip >> stems/log.txt; echo >> stems/log.txt; }
done
echo "EXIT 0" >> stems/log.txt
