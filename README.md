# Safe Space WebXR

## Run locally

```powershell
cd "C:\Users\tshab\OneDrive\Desktop\Meta (In Progress)\SafeSpaceWebXR"
npm run dev -- --port 4173
```

Open `http://localhost:4173` on a computer.

## Test on Meta Quest 3

1. Deploy the `dist` folder to HTTPS hosting such as GitHub Pages or Vercel.
2. Open the HTTPS URL in Meta Quest Browser.
3. Choose **Enter VR**.
4. Use the Quest controller, gaze/hand ray, or pinch-to-select if supported by the browser.
5. Complete the first conversation and unlock the insight.

WebXR requires HTTPS in a headset browser except for loopback testing on a computer.

## Build

```powershell
npm run build
```

The deployable files are in `dist`.
