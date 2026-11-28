# Capture check

Made by tools/capture-check.ts at 2026-11-28T07:01:27.366Z. It drew single test frames and no film.

## Machine

- System: win32 10.0.26300 x64
- Processor: AMD Ryzen 7 9800X3D 8-Core Processor, 8 threads
- Memory: 66.2 GB
- Free disk here: 1272.2 GB
- Node: v24.13.0
- Git commit: c980c36861ff2f39ebfaa1bb59b34f99846312d5, changed tracked files: 0
- NVIDIA card by nvidia-smi: NVIDIA GeForce RTX 5080, 616.92, 16303 MiB

## Code and handoff files

- Engine hash: a455bc02904b0d42, the approved build
- Handoff files: 34 proved by size and sha256, 0 wrong

## ffmpeg

- ffmpeg: ffmpeg version 9.1-full_build-www.gyan.dev Copyright (c) 2000-2026 the FFmpeg developers
- libx264 encoder: yes; libvpx-vp9 decoder: yes
- Subtitle strip at 57 s: see through values from 0 to 255, alive

## Draw test preview: 6 frames at 960 by 540

- Browser: 158.0.8127.37
- Graphics the browser drew on: ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11)
- Engine hash of the page: a455bc02904b0d42; shutter 360 degrees
- NVIDIA card while drawing: busiest 73 percent, most memory in use 7904 MB (48 readings; before the draw 2 percent and 1582 MB)

| capture frame | film frame | what | PSNR dB | SSIM | seconds | render s | PNG MB | fine detail |
|---|---|---|---|---|---|---|---|---|
| 2200 | 1100 | film frame 1100, a frame the 30 fps film has | 48.97 | 0.9957 | 37.9 | 2.6 | 1.1 | n/a |
| 2201 | 1100 and a half | the new frame between film frames 1100 and 1101 | 48.94 | 0.9957 | 2.4 | 2.4 | 1.1 | n/a |
| 4880 | 2440 | film frame 2440, Mars flight in | 52.80 | 0.9975 | 6.0 | 1.5 | 1.1 | n/a |
| 4881 | 2440 and a half | the new frame between film frames 2440 and 2441 | 52.90 | 0.9976 | 0.2 | 0.2 | 1.1 | n/a |
| 9400 | 4700 | film frame 4700, Neptune flight in | 48.30 | 0.9943 | 36.9 | 36.9 | 1.1 | n/a |
| 9401 | 4700 and a half | the new frame between film frames 4700 and 4701 | 48.17 | 0.9943 | 1.7 | 1.7 | 1.1 | n/a |

## Draw test master: 24 frames at 1920 by 1080

- Browser: 158.0.8127.37
- Graphics the browser drew on: ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11)
- Engine hash of the page: a455bc02904b0d42; shutter 360 degrees
- NVIDIA card while drawing: busiest 100 percent, most memory in use 7154 MB (83 readings; before the draw 4 percent and 1622 MB)

| capture frame | film frame | what | PSNR dB | SSIM | seconds | render s | PNG MB | fine detail |
|---|---|---|---|---|---|---|---|---|
| 180 | 90 | Sun, surface view, film frame 90 (this frame has its own limit: 30.5 dB, SSIM 0.9) | 32.57 | 0.9401 | 51.8 | 0.3 | 4.8 | n/a |
| 660 | 330 | Sun, whole view, film frame 330 | 38.66 | 0.9746 | 0.1 | 0.0 | 5.0 | n/a |
| 1110 | 555 | Mercury, whole view, film frame 555 | 40.79 | 0.9655 | 5.3 | 0.6 | 4.2 | n/a |
| 1800 | 900 | Mercury, surface view, film frame 900 | 41.66 | 0.9854 | 0.3 | 0.2 | 5.0 | n/a |
| 2250 | 1125 | Venus, whole view, film frame 1125 | 40.72 | 0.9673 | 9.4 | 0.5 | 4.3 | n/a |
| 2730 | 1365 | Venus, surface view, film frame 1365 | 41.00 | 0.9621 | 0.2 | 0.1 | 4.2 | n/a |
| 3480 | 1740 | Earth, whole view, film frame 1740 | 41.84 | 0.9823 | 6.7 | 0.7 | 4.6 | n/a |
| 3930 | 1965 | Earth, surface view, film frame 1965 | 38.90 | 0.9620 | 0.2 | 0.1 | 4.7 | n/a |
| 4650 | 2325 | Mars, whole view, film frame 2325 | 40.23 | 0.9627 | 6.8 | 0.6 | 4.3 | n/a |
| 5220 | 2610 | Mars, surface view, film frame 2610 | 44.06 | 0.9851 | 1.9 | 1.8 | 4.5 | n/a |
| 5670 | 2835 | Jupiter, whole view, film frame 2835 | 40.55 | 0.9654 | 13.0 | 0.4 | 4.5 | n/a |
| 6300 | 3150 | Jupiter, surface view, film frame 3150 | 43.89 | 0.9852 | 0.3 | 0.2 | 4.5 | n/a |
| 6930 | 3465 | Saturn, whole view with the rings, film frame 3465 | 39.44 | 0.9646 | 13.6 | 0.4 | 4.6 | n/a |
| 7440 | 3720 | Saturn, surface view, film frame 3720 | 41.44 | 0.9826 | 2.4 | 2.3 | 4.7 | n/a |
| 7950 | 3975 | Uranus, whole view, film frame 3975 | 40.21 | 0.9565 | 5.4 | 0.4 | 4.4 | n/a |
| 8474 | 4237 | Uranus, surface view, film frame 4237 | 41.90 | 0.9628 | 1.1 | 1.0 | 4.1 | n/a |
| 9090 | 4545 | Neptune, whole view, film frame 4545 | 40.70 | 0.9504 | 2.1 | 2.0 | 4.2 | n/a |
| 9720 | 4860 | Neptune, surface view, film frame 4860 | 34.93 | 0.9262 | 0.8 | 0.7 | 4.2 | n/a |
| 10500 | 5250 | Ending, the look back with the stars, film frame 5250 | 40.67 | 0.9726 | 0.2 | 0.2 | 4.4 | n/a |
| 396 | 198 | Sun, flight out (heavy frame), film frame 198 (this frame has its own limit: 30.5 dB, SSIM 0.9) | 31.49 | 0.9152 | 1.2 | 1.1 | 4.7 | n/a |
| 1416 | 708 | Mercury, flight in (heavy frame), film frame 708 | 40.00 | 0.9606 | 2.2 | 2.1 | 4.0 | n/a |
| 6514 | 3257 | Jupiter, flight out (heavy frame), film frame 3257 | 36.75 | 0.9419 | 0.9 | 0.8 | 4.2 | n/a |
| 9480 | 4740 | Neptune, flight in (heavy frame), film frame 4740 | 38.18 | 0.9306 | 32.1 | 32.1 | 4.1 | n/a |
| 9916 | 4958 | Neptune, flight out (heavy frame), film frame 4958 | 34.96 | 0.9051 | 4.1 | 4.0 | 4.2 | n/a |

## Draw test uhd: 13 frames at 3840 by 2160

- Browser: 158.0.8127.37
- Graphics the browser drew on: ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11)
- Engine hash of the page: a455bc02904b0d42; shutter 360 degrees
- NVIDIA card while drawing: busiest 100 percent, most memory in use 7243 MB (94 readings; before the draw 14 percent and 1481 MB)

| capture frame | film frame | what | PSNR dB | SSIM | seconds | render s | PNG MB | fine detail |
|---|---|---|---|---|---|---|---|---|
| 3480 | 1740 | Earth, whole view, film frame 1740 | 38.06 | 0.9670 | 10.8 | 0.7 | 16.7 | 5.30 |
| 6930 | 3465 | Saturn, whole view with the rings, film frame 3465 | 38.46 | 0.9685 | 13.8 | 0.4 | 17.0 | 5.38 |
| 4650 | 2325 | Mars, whole view, film frame 2325 | 40.06 | 0.9675 | 7.5 | 0.7 | 15.5 | 2.81 |
| 10500 | 5250 | Ending, the look back with the stars, film frame 5250 | 37.06 | 0.9686 | 2.0 | 1.7 | 15.9 | 2.95 |
| 3930 | 1965 | Earth, surface view, film frame 1965 | 38.06 | 0.9664 | 0.5 | 0.2 | 17.2 | 4.06 |
| 5220 | 2610 | Mars, surface view, film frame 2610 | 40.67 | 0.9720 | 2.2 | 1.9 | 16.3 | 3.46 |
| 660 | 330 | Sun, whole view, film frame 330 | 36.49 | 0.9646 | 0.4 | 0.1 | 18.3 | 5.67 |
| 6300 | 3150 | Jupiter, surface view, film frame 3150 | 39.64 | 0.9699 | 9.6 | 8.4 | 16.3 | 3.18 |
| 9916 | 4958 | Neptune, flight out (heavy frame), film frame 4958 | 35.49 | 0.9206 | 9.8 | 9.6 | 15.3 | 2.02 |
| 9480 | 4740 | Neptune, flight in (heavy frame), film frame 4740 | 38.91 | 0.9424 | 37.6 | 37.3 | 14.9 | 1.59 |
| 396 | 198 | Sun, flight out (heavy frame), film frame 198 (this frame has its own limit: 30.5 dB, SSIM 0.9) | 31.68 | 0.9208 | 75.9 | 1.7 | 16.6 | 2.88 |
| 1416 | 708 | Mercury, flight in (heavy frame), film frame 708 | 39.61 | 0.9683 | 8.5 | 5.9 | 14.5 | 2.19 |
| 6514 | 3257 | Jupiter, flight out (heavy frame), film frame 3257 | 36.32 | 0.9503 | 6.2 | 6.0 | 15.2 | 2.21 |

## The whole film

- Time per frame at 3840 by 2160 on this machine: mean 6.3 s, slowest 37.6 s (13 test frames; the test holds more heavy frames than the film does)
- Hours for the 10800 frames of the 4K film, every frame at the mean of the test: 18.8
- Hours for the 4K film, every part of the film weighed by what it cost in the cloud: 14.9
- These are estimates from 13 frames, not a promise. The run prints its own remaining time from the first minutes on.
- Disk: a 4K frame is about 16.1 MB as PNG; the run holds at most 600 of them at a time (9.7 GB) beside the parts and the films. Keep 35 GB free; 1272.2 GB are free here.
- Graphics named by the browser in every test: ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11) (158.0.8127.37)
- The words asked for (--expect-gpu): RTX 5080
- Side by side pictures (left the approved film, right this machine; for 4K frames a second row at full size from the middle): C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side

## Verdict

LOOK. Nothing forbids the run, but a person reads these first:
- draw test master: frame 9720 (Neptune, surface view, film frame 4860) differs from the approved picture more than an encode explains: PSNR 34.93 dB, SSIM 0.9262. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009720.jpg.
- draw test master: frame 9916 (Neptune, flight out (heavy frame), film frame 4958) differs from the approved picture more than an encode explains: PSNR 34.96 dB, SSIM 0.9051. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009916.jpg.
- draw test uhd: frame 9916 (Neptune, flight out (heavy frame), film frame 4958) differs from the approved picture more than an encode explains: PSNR 35.49 dB, SSIM 0.9206. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\uhd-009916.jpg.

VERDICT: LOOK
