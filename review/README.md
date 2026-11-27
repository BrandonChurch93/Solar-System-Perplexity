# The public review page

This folder is the source of the public page for Solar System Fly-Through. It is a page of its own: only what a visitor should see, with the finished film at the top. Its type, colors, controls and wording come from the film. The working review page (the one with every scorecard and comparison) is a different page and stays private.

Address: https://www.perplexity.ai/computer/a/solar-system-fly-through-revie-JcnDqi9ISLC3WVLFqVx59w

## What is here

- index.html: the whole page (markup, styles and script in one file).
- assets/stills/: 36 pictures (for each of the nine stops the whole view and the surface view from the film, and the two approved pictures they were built from) and poster.jpg, the picture shown before the film starts.
- assets/font/: Lato Medium, the type of the film's subtitles, with its licence (OFL.txt).
- assets/vendor/: hls.js 1.7.4 (light build), which plays the film's pieces in browsers that cannot do so on their own, with its licence.
- make-assets.py: makes assets/stills from the film's frames and from references/approved.
- publish.sh: puts the page and the film together in one folder, ready to be deployed.

## The film is not in this folder

The film file is larger than this repo's limit of 95 MB for one file (the 30 fps film is 402 MB), so it stays with the hosted page. publish.sh takes the film file as its first argument.

## How the film is served, and why

The host does not answer requests for a part of a file. MEASURED on 27 November 2026 from the public page: a request for a range of bytes of the film got status 200 with no Content-Range, no Accept-Ranges and no Content-Length, and a jump to 2:31 in the film as one file fell back to 0:00. A browser can then play one large file only from its start.

So publish.sh cuts the film into pieces at its own key frames, with no new encoding: the picture and the sound in the pieces are the same bytes as in the film file. The page loads media/film.m3u8, the list of the pieces, and asks only for the pieces it needs. Nothing of the film is loaded before the visitor asks for it.

MEASURED on the public address in a browser that was not signed in (Chromium): the film started on "Begin the flight" and ran in real time, and the Neptune stop on the flight line jumped it from 0:49 to 2:31, where it ran on after about 6 seconds. STATED, not tested here (there is no Safari on the build machine): Safari plays such a list on its own, without hls.js.

## How to publish

1. Run: bash review/publish.sh "the film file" "a folder inside the workspace"
2. Deploy that folder as a site with index.html as its entry point. The first deploy gives the page its entry in the library and its address.
3. Make that library entry public (publish the artifact). Without this step the address shows "This artifact is private" to anyone who is not signed in as the owner.
4. Open the address in a browser that is not signed in. The page must show, the film must start on "Begin the flight", and a stop on the flight line must jump the film there.

To replace the film (for example with the 60 fps film), change the FILM numbers at the top of the script in index.html, run publish.sh with the new file and deploy the same folder again to the same library entry. The address stays the same.

## How to rebuild the pictures

Run: python3 review/make-assets.py (it needs the film's master picture file and references/approved; the paths stand at the top of the script).
