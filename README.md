# MeshForge — Video to 3D Model Prototype

A futuristic WebODM-inspired frontend prototype using plain HTML, CSS and JavaScript with Three.js.

## Behavior

- Users can upload a video; the selected file is displayed but is **not processed**.
- Processing controls such as camera model, iterations, feature quality, resize, depth refinement and texture options are interactive UI only.
- Clicking **Start Processing** simulates progress and then keeps the bundled fixed GLB reconstruction as the output.
- The 3D viewport supports orbit/360° rotation, zoom, pan, reset view, wireframe mode and fullscreen.
- Light/dark theme toggle is included.

## Files

- `index.html` — application structure
- `styles.css` — futuristic responsive UI
- `app.js` — Three.js viewer and demo interactions
- `model1.glb` — fixed demo 3D model (add the uploaded GLB file at this path)

## Run locally

Because ES modules and GLB loading are used, serve the folder over a local HTTP server instead of opening `index.html` directly.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

The app is static and can be hosted on GitHub Pages. Make sure `model1.glb` is present in the repository root before enabling Pages.
