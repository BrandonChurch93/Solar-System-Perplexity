cd /home/user/workspace/repo
A=$(git ls-tree -r -l origin/main -- src/stops/mercury public/assets/mercury assets-src/mercury | awk '{s+=$4} END {print s}')
B=$(git ls-files -co --exclude-standard -- src/stops/mercury public/assets/mercury assets-src/mercury | while read f; do [ -f "$f" ] && stat -c %s "$f"; done | awk '{s+=$1} END {print s}')
echo "main $A bytes, tree $B bytes, net $(python3 -c "print('%+.3f MB' % (($B-$A)/1e6))")"
git ls-files -co --exclude-standard -- src/stops/mercury public/assets/mercury assets-src/mercury | while read f; do [ -f "$f" ] && echo "$(stat -c %s "$f") $f"; done | sort -rn | head -3
