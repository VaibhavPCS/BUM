# 🪔 Nawabi Dash — Diwali Samosa Run (Lucknow Edition)

A browser-based 3D endless runner made as a Diwali gift for Team PCS. Run through a Diwali-night
Lucknow street, dodge mithai thelas and torans, collect samosas, and enjoy some proper Lucknowi
Hinglish along the way. Pure HTML + CSS + JavaScript with Three.js. No build step, no installs.

![Nawabi Dash](docs/screenshot.jpg)

## Play

- **Hosted:** enable GitHub Pages once (see below) and the game is served at `https://<user>.github.io/<repo>/`.
- **Locally:** open `index.html` in Chrome, Edge, Safari or Firefox. (Serving over HTTP works best, e.g. `npx serve .` or `python3 -m http.server`, so the default founder photo loads.)

## Features

- **Your face on the runner.** Upload a photo (or take a selfie on mobile); it becomes the runner's face inside a Nawabi turban. The photo stays in your browser only.
- **Default runner: PCS Sir.** A placeholder monogram ships as `assets/founder.jpg`; replace that file with the real photo (same name) and it is used automatically.
- **"Hurdles pe poster" mode.** Flip a switch and the photo appears as a framed poster on the carts, autos and patakha boxes instead, while you run as a cartoon Nawab.
- **Samosas are the coins.** Regular samosas, golden samosas (5x), and samosa arcs over low obstacles.
- **Power-ups:** Chai Shield (smash through anything for 7 s), Jalebi Magnet (pulls samosas to you), Mithai ka Dabba (2x points).
- **Seven obstacle types:** diya rows, anaar (sparking), patakha boxes (jump); torans and kandil rows (slide); mithai thelas and `UP 32` autos (change lane).
- **Diwali-night Lucknow:** lit Awadhi facades with string lights, domes and minarets, kerb diyas, rangolis, marigold torans, paper lanterns, a hazy Rumi-Darwaza skyline, rockets and fireworks.
- **Lucknowi Hinglish everywhere:** taglines, praise for samosa streaks, near-miss lines, milestone shout-outs (Hazratganj, Rumi Darwaza, Bhool Bhulaiya, Gomti...), game-over banners and ranks from *Aminabad Rookie* to *Nawab-e-Lucknow*.
- **Synthesised sound:** dhol-and-pluck background loop and all effects generated with WebAudio, no audio files. Mute button in the HUD.
- **Local leaderboard**, best score, slow-motion crash, screen shake, share-to-WhatsApp text, mobile swipe controls, pause on tab switch.

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Change lane | ← → or A / D | swipe left / right |
| Jump | ↑, W or Space | swipe up or tap |
| Slide | ↓ or S (mid-air: slam down) | swipe down |
| Pause | P or Esc | ❚❚ button |

## Hosting on GitHub Pages (one time)

1. Open the repository **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the *Deploy to GitHub Pages* workflow manually from the Actions tab).

The workflow in `.github/workflows/deploy-pages.yml` publishes the repository root as a static site.
Any static host works too: Netlify Drop, Vercel, Cloudflare Pages, or `npx serve .` on the office Wi-Fi.

## Customising

| What | Where |
|---|---|
| Founder photo | `assets/founder.jpg` (see `assets/README.md`) |
| Hinglish lines, ranks, milestones | `js/config.js` → `ND.TEXT` |
| Speed, jump, spawn pacing, power-up durations | `js/config.js` → `ND.CFG` |
| Banner texts on torans | `js/config.js` → `ND.TEXT.bannerTexts` |
| Colours, fonts, UI | `css/style.css` (`:root` tokens) |
| Obstacles and pickups | `js/entities.js` |
| Street, buildings, fireworks | `js/world.js` |
| Textures (all drawn on canvas) | `js/textures.js` |

## Project layout

```
index.html          markup for HUD and screens
css/style.css       styling (Diwali-night palette, Cinzel Decorative + Baloo 2)
js/config.js        tuning constants + Hinglish text banks
js/audio.js         WebAudio SFX + music loop
js/textures.js      canvas-generated textures (road, facades, samosa, banners, face sprite...)
js/world.js         sky, street segments, buildings, diyas, torans, fireworks
js/entities.js      player, obstacles, pickups, particles, floating text
js/game.js          game loop, spawner, collisions, scoring, input, camera
js/ui.js            screens, HUD, photo upload, leaderboard, share
assets/             founder photo placeholder
```

Three.js r128 is loaded from cdnjs; everything else is in this repository.

Shubh Deepawali! Is Diwali, Prakash hi Prakash. ✨
