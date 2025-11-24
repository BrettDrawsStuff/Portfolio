# BrettDrawsStuff — Sketchbook Portfolio (ready-to-deploy)

This repository contains a minimal static prototype of your sketchbook-style portfolio (cover, page flips, six pages: Home, About Me, Digital Art, Animations/GIFs, Sketchbook, Demo Reel).

What to do locally
- Quick test (no build tools required):
  - Option A: Open `index.html` directly in a modern browser.
  - Option B: Run a simple local server (recommended so assets load consistently):
    - Python 3: `python -m http.server 8000` then open http://localhost:8000
    - Node (if you have `http-server`): `npx http-server -c-1 .` then open http://localhost:8080

Adding the Carrotflower font
- Place Carrotflower font files into the `fonts/` folder:
  - Recommended formats: `Carrotflower.woff2` and `Carrotflower.woff`
- Edit the `@font-face` src in `styles.css` if you use a different filename.
- If you don't add the font, the site falls back to `Amatic SC` (Google Fonts).

Deploy to GitHub Pages (automatic)
- Push this repository to GitHub.
- The included GitHub Actions workflow (on push to `main`) will automatically build and publish the repository to the `gh-pages` branch.
- After the workflow completes, your site will be available at:
  - Project pages: `https://<your-username>.github.io/<repo-name>/`
  - User pages (if repo named `<your-username>.github.io`): `https://<your-username>.github.io/`

Manual deployment (alternative)
- You can also enable GitHub Pages to use the `gh-pages` branch in the repo settings after pushing the branch.

Notes & next steps
- Replace the placeholder content in each page with your actual images, GIFs, and video embeds. Put image assets in an `assets/` folder (e.g., `assets/featured.jpg`).
- If you want, I can:
  - Add a gallery layout and lazy-loading for images.
  - Trace or create hand-drawn SVG doodles and inline them.
  - Push these files to a new repository for you and enable the deployment action.
