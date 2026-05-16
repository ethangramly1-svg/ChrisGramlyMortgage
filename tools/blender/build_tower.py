"""
Luxury condo tower — Blender 4.x procedural model.

Refined skyscraper with:
  - Dark concrete shaft with horizontal slab trim
  - Gold-trimmed vertical mullions framing window bays
  - Bay-recessed glass curtain walls on four sides
  - Warm lit window dots, brighter on highlighted floors
  - Penthouse cap: glowing glass crown with gold roof
  - Rooftop terrace platform with infinity pool + cabanas
  - Slender antenna spire with glowing top

Run:
  blender --background --python tools/blender/build_tower.py

Outputs:
  public/models/tower.glb            (~600 KB)
  tools/blender/tower-preview.png    (1280x720 Eevee render)
"""

import os
import sys
import random
import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
OUT_GLB = os.path.join(REPO_ROOT, "public", "models", "tower.glb")
OUT_PNG = os.path.join(SCRIPT_DIR, "tower-preview.png")
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)

# Reset
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.view_settings.view_transform = "AgX"
bpy.context.scene.view_settings.look = "AgX - Medium High Contrast"

random.seed(31)


def material(name, base, metallic=0.1, roughness=0.5, emit=None, emit_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emit is not None:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emit_strength
    return mat


def add_box(name, loc, scale, mat=None, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    if mat is not None:
        obj.data.materials.append(mat)
    if parent is not None:
        obj.parent = parent
    return obj


# ---------- Materials ----------
mat_concrete  = material("Concrete",     (0.10, 0.11, 0.13), 0.18, 0.82)
mat_dark      = material("DarkBase",     (0.05, 0.06, 0.08), 0.30, 0.65)
mat_glass     = material("Glass",        (0.05, 0.07, 0.10), 0.85, 0.10,
                         emit=(0.05, 0.07, 0.10), emit_strength=0.08)
mat_gold      = material("Gold",         (0.78, 0.62, 0.30), 0.95, 0.25,
                         emit=(0.78, 0.62, 0.30), emit_strength=0.25)
mat_window    = material("Window",       (0.95, 0.78, 0.42), 0.0, 0.4,
                         emit=(0.95, 0.78, 0.42), emit_strength=2.2)
mat_dimwin    = material("DimWindow",    (0.36, 0.28, 0.16), 0.0, 0.5,
                         emit=(0.36, 0.28, 0.16), emit_strength=0.55)
mat_penthouse = material("PenthouseGlow", (0.98, 0.80, 0.46), 0.0, 0.25,
                         emit=(0.98, 0.80, 0.46), emit_strength=3.0)
mat_pool      = material("Pool",         (0.30, 0.55, 0.78), 0.7, 0.08,
                         emit=(0.30, 0.55, 0.78), emit_strength=0.35)
mat_terrace   = material("Terrace",      (0.16, 0.16, 0.18), 0.25, 0.6)


# ---------- Tower body ----------
FLOORS = 28
FH = 1.2          # floor height
TW = 3.4          # tower width (X)
TD = 3.4          # tower depth (Y)
TOP_Y = FLOORS * FH

bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
tower_root = bpy.context.active_object
tower_root.name = "TowerRoot"

# Main shaft
add_box("Shaft", (0, 0, TOP_Y / 2),
        (TW / 2, TD / 2, TOP_Y / 2),
        mat_concrete, parent=tower_root)

# Recessed curtain walls on all four sides (slight inset behind mullions)
INSET_W = TW * 0.84
for sign in (1, -1):
    add_box(f"Curtain_y{sign}",
            (0, sign * (TD / 2 + 0.005), TOP_Y / 2),
            (INSET_W / 2, 0.03, TOP_Y / 2 * 0.985),
            mat_glass, parent=tower_root)
    add_box(f"Curtain_x{sign}",
            (sign * (TW / 2 + 0.005), 0, TOP_Y / 2),
            (0.03, INSET_W / 2, TOP_Y / 2 * 0.985),
            mat_glass, parent=tower_root)

# Slab trim between floors
for i in range(FLOORS + 1):
    add_box(f"Slab{i}", (0, 0, i * FH),
            ((TW + 0.14) / 2, (TD + 0.14) / 2, 0.025),
            mat_dark, parent=tower_root)

# Vertical gold mullions framing window bays — four sides
MULLION_COUNT = 5
MULLION_SP = INSET_W / (MULLION_COUNT - 1)
for c in range(MULLION_COUNT):
    x = -INSET_W / 2 + c * MULLION_SP
    for sign in (1, -1):
        add_box(f"MullY{sign}_{c}",
                (x, sign * (TD / 2 + 0.04), TOP_Y / 2),
                (0.04, 0.02, TOP_Y / 2 * 0.97),
                mat_gold, parent=tower_root)
        add_box(f"MullX{sign}_{c}",
                (sign * (TW / 2 + 0.04), x, TOP_Y / 2),
                (0.02, 0.04, TOP_Y / 2 * 0.97),
                mat_gold, parent=tower_root)

# Lit window dots between mullions
WIN_COLS = MULLION_COUNT - 1
highlight_floors = {0, 6, 13, 20, FLOORS - 1}
for f in range(FLOORS):
    hi = f in highlight_floors
    for c in range(WIN_COLS):
        bay = -INSET_W / 2 + (c + 0.5) * MULLION_SP
        z = f * FH + FH * 0.5
        lit = hi or random.random() > 0.32
        m = mat_window if lit else mat_dimwin
        # Front + back
        for sign in (1, -1):
            add_box(f"WinY{sign}_{f}_{c}",
                    (bay, sign * (TD / 2 + 0.05), z),
                    (MULLION_SP * 0.32, 0.005, FH * 0.32),
                    m, parent=tower_root)
            add_box(f"WinX{sign}_{f}_{c}",
                    (sign * (TW / 2 + 0.05), bay, z),
                    (0.005, MULLION_SP * 0.32, FH * 0.32),
                    m, parent=tower_root)


# ---------- Penthouse crown ----------
CROWN_H = 2.0
add_box("CrownBase",
        (0, 0, TOP_Y + CROWN_H * 0.18),
        (TW * 0.60, TD * 0.60, CROWN_H * 0.18),
        mat_terrace, parent=tower_root)
add_box("CrownGlass",
        (0, 0, TOP_Y + CROWN_H * 0.55),
        (TW * 0.52, TD * 0.52, CROWN_H * 0.40),
        mat_penthouse, parent=tower_root)
add_box("CrownRoof",
        (0, 0, TOP_Y + CROWN_H * 0.98),
        (TW * 0.56, TD * 0.56, CROWN_H * 0.04),
        mat_gold, parent=tower_root)

# Antenna spire
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.06, depth=4.0,
    location=(0, 0, TOP_Y + CROWN_H + 2.0)
)
spire = bpy.context.active_object
spire.name = "Spire"
spire.data.materials.append(mat_gold)
spire.parent = tower_root

bpy.ops.mesh.primitive_uv_sphere_add(
    radius=0.18,
    location=(0, 0, TOP_Y + CROWN_H + 4.1)
)
spire_top = bpy.context.active_object
spire_top.name = "SpireTop"
spire_top.data.materials.append(mat_penthouse)
spire_top.parent = tower_root


# ---------- Rooftop terrace ----------
TERRACE_Z = TOP_Y + 0.16
add_box("TerraceDeck",
        (TW * 0.5, 0, TERRACE_Z),
        (TW * 0.5, TD * 0.5, 0.08),
        mat_terrace, parent=tower_root)
add_box("Pool",
        (TW * 0.7, 0, TERRACE_Z + 0.08),
        (TW * 0.28, TD * 0.30, 0.05),
        mat_pool, parent=tower_root)
for i in (0, 1):
    add_box(f"Cabana{i}",
            (TW * 0.5, (-1 if i == 0 else 1) * TD * 0.35, TERRACE_Z + 0.18),
            (0.22, 0.22, 0.18),
            mat_dark, parent=tower_root)


# ---------- Preview render ----------
bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "PreviewGround"
ground.data.materials.append(material("Ground", (0.03, 0.04, 0.07), 0.05, 0.95))

world = bpy.data.worlds.new("World")
bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.025, 0.035, 0.085, 1.0)
bg.inputs["Strength"].default_value = 0.85

bpy.ops.object.light_add(type="SUN", location=(-25, -18, 50))
key = bpy.context.active_object
key.data.color = (1.0, 0.85, 0.65)
key.data.energy = 3.2
key.rotation_euler = (0.55, 0.0, 0.85)

bpy.ops.object.light_add(type="AREA", location=(28, 22, 22))
fill = bpy.context.active_object
fill.data.color = (0.55, 0.7, 1.0)
fill.data.energy = 90
fill.data.size = 25

bpy.ops.object.camera_add(location=(26, -30, 22), rotation=(1.25, 0.0, 0.72))
cam = bpy.context.active_object
cam.data.lens = 75
bpy.context.scene.camera = cam

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT_PNG
scene.eevee.use_bloom = True
scene.eevee.bloom_threshold = 1.0
scene.eevee.bloom_intensity = 0.12
scene.eevee.bloom_radius = 3.0
scene.eevee.use_gtao = True
scene.eevee.gtao_distance = 0.8

print("Rendering tower preview...")
bpy.ops.render.render(write_still=True)


# ---------- Export GLB (tower only) ----------
bpy.ops.object.select_all(action="DESELECT")
EXCLUDE = {"PreviewGround", "Camera"}
for obj in bpy.context.scene.objects:
    if obj.name in EXCLUDE:
        continue
    if obj.type == "LIGHT":
        continue
    if obj.type in {"MESH", "EMPTY"}:
        obj.select_set(True)

print(f"Exporting GLB to {OUT_GLB}")
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
)

try:
    size = os.path.getsize(OUT_GLB)
    print(f"OK  glb={size} bytes  png={os.path.getsize(OUT_PNG)} bytes")
except OSError as e:
    print(f"FAIL  {e}", file=sys.stderr)
    sys.exit(1)
