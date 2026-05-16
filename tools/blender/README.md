# Blender model pipeline

Procedural 3D models generated headlessly with Blender's Python API,
exported to `.glb` for use in the R3F site.

## Why headless / procedural?

- Reproducible — scripts live in version control, models regenerate
  byte-for-byte from the script
- No `.blend` files to wrestle with in git
- Easy to iterate: change a parameter, rerun, commit the new GLB

## Requirements

- `blender` (4.x) on PATH
- `python3-numpy` available to Blender (system numpy is auto-discovered)

```bash
sudo apt-get install -y blender python3-numpy libegl1 libgl1
```

## Generating models

Each script outputs a `.glb` into `public/models/` and a preview `.png`
next to itself.

```bash
# Tower (used in Scene 1 skyline / Scene 2 transitions)
blender --background --python tools/blender/build_tower.py
```

After running, commit:

- `public/models/<name>.glb`     — runtime asset, served by Vite
- `tools/blender/<name>-preview.png` — for review in PRs

## Using a model in an R3F scene

```tsx
import { useGLTF } from "@react-three/drei";

const TOWER_URL = `${import.meta.env.BASE_URL}models/tower.glb`;

export default function Tower() {
  const { scene } = useGLTF(TOWER_URL);
  return <primitive object={scene} scale={0.5} />;
}

useGLTF.preload(TOWER_URL);
```

## Conventions

- Keep individual GLBs under ~1 MB (lighting + lit windows + glass
  materials is enough; geometry stays low-poly)
- Z-up in Blender exports to Y-up in glTF (`export_yup=True`)
- Materials baked in: emission for lit windows, AgX color management
  for natural cinematic falloff
- Procedural seeds (`random.seed(42)`) so reruns are deterministic
