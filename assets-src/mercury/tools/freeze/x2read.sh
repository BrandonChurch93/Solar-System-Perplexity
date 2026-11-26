export POSES=/tmp/m/poses-m5.json
cd /home/user/workspace/repo
W=$PWD/out/work/mercury/place
which=$1
if [ "$which" = base ]; then
  rm -rf /tmp/m/lbr; mkdir /tmp/m/lbr
  for k in $(seq 1978 2022); do ln -s $W/r6/$(printf "k%06d.png" $k) /tmp/m/lbr/; done
  for k in $(seq 2023 2040); do ln -s $W/p1/$(printf "k%06d.png" $k) /tmp/m/lbr/; done
  nice python3 /tmp/m/picp.py /tmp/m/lbr 1978 2040 /tmp/m/base-rise.json > /tmp/m/base-rise.txt 2>&1
else
  rm -rf /tmp/m/lxr; mkdir /tmp/m/lxr
  for k in $(seq 1978 2022); do ln -s $W/x2/$(printf "k%06d.png" $k) /tmp/m/lxr/; done
  for k in $(seq 2023 2040); do ln -s $W/p1/$(printf "k%06d.png" $k) /tmp/m/lxr/; done
  nice python3 /tmp/m/picp.py /tmp/m/lxr 1978 2040 /tmp/m/x2-rise.json > /tmp/m/x2-rise.txt 2>&1
fi
