"""
Procedural luxury tower — Blender 4.x Python script.

Builds a stylized penthouse-condo skyscraper:
  - Concrete shaft with horizontal slab trim
  - Glass curtain walls (lit windows)
  - Rooftop crown with warm-glow penthouse cap
  - Antenna spire

Run headlessly:
  blender --background --python tools/blender/build_tower.py

Outputs:
  public/models/tower.glb     (used by the R3F site)
  tools/blender/preview.png   (still render for review)
"""

import os
import sys
import bpy
from math import pi
from mathutils import Vector

# --------------------------------------------------------------------------- #
# Resolve paths relative to the repo root, regardless of CWD when invoked.
# --------------------------------------------------------------------------- #
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
OUT_GLB = os.path.join(REPO_ROOT, "public", "models", "tower.glb")
OUT_PNG = os.path.join(SCRIPT_DIR, "preview.png")
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)

# --------------------------------------------------------------------------- #
# Reset the scene completely.
# --------------------------------------------------------------------------- #
bpy.ops.wm.read_factory_settings(use_empty=True)

# Linear color space + tone mapping for cinematic look
bpy.context.scene.view_settings.view_transform = "AgX"
bpy.context.scene.view_settings.look = "AgX - Medium High Contrast"
bpy.context.scene.unit_settings.system = "METRIC"

# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def add_box(name, location, scale, material=None):
    bpy.ops.mesh.primitive_cube_add(size=2, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    if material is not None:
        obj.data.materials.append(material)
    return obj

def make_material(name, base_color, metallic=0.1, roughness=0.5,
                  emission_color=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission_color is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission_color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


# --------------------------------------------------------------------------- #
# Materials
# --------------------------------------------------------------------------- #
mat_concrete = make_material("Concrete", (0.13, 0.14, 0.16), 0.2, 0.78)
mat_glass    = make_material("Glass",    (0.05, 0.06, 0.09), 0.7, 0.12,
                             emission_color=(0.05, 0.06, 0.09),
                             emission_strength=0.0)
mat_trim     = make_material("Trim",     (0.18, 0.16, 0.13), 0.85, 0.3)
mat_window   = make_material("Window",   (0.95, 0.75, 0.4),  0.0, 0.4,
                             emission_color=(0.95, 0.75, 0.4),
                             emission_strength=4.0)
mat_dim_win  = make_material("DimWindow", (0.4, 0.32, 0.18), 0.0, 0.4,
                             emission_color=(0.4, 0.32, 0.18),
                             emission_strength=1.2)
mat_pent     = make_material("PenthouseGlow",
                             (0.95, 0.75, 0.4), 0.0, 0.3,
                             emission_color=(0.98, 0.78, 0.45),
                             emission_strength=6.0)

# --------------------------------------------------------------------------- #
# Tower body
# --------------------------------------------------------------------------- #
FLOORS = 24
FLOOR_H = 1.2
TOWER_W = 3.0
TOWER_D = 3.0
TOWER_TOP = FLOORS * FLOOR_H

# Main shaft
shaft = add_box("TowerShaft",
                location=(0, 0, TOWER_TOP / 2),
                scale=(TOWER_W / 2, TOWER_D / 2, TOWER_TOP / 2),
                material=mat_concrete)

# Recessed glass curtain walls on front and back
add_box("CurtainFront",
        location=(0, TOWER_D / 2 + 0.005, TOWER_TOP / 2),
        scale=(TOWER_W * 0.42, 0.04, TOWER_TOP / 2 * 0.985),
        material=mat_glass)
add_box("CurtainBack",
        location=(0, -TOWER_D / 2 - 0.005, TOWER_TOP / 2),
        scale=(TOWER_W * 0.42, 0.04, TOWER_TOP / 2 * 0.985),
        material=mat_glass)

# Horizontal slab trim between floors
for i in range(FLOORS + 1):
    add_box(f"Slab{i}",
            location=(0, 0, i * FLOOR_H),
            scale=((TOWER_W + 0.12) / 2, (TOWER_D + 0.12) / 2, 0.02),
            material=mat_trim)

# Lit window dots on front and back faces
WIN_COLS = 6
WIN_SPACING = TOWER_W * 0.78 / (WIN_COLS - 1)
highlight_floors = {0, 7, 14, 21, FLOORS - 1}

import random
random.seed(42)

for f in range(FLOORS):
    is_highlight = f in highlight_floors
    for c in range(WIN_COLS):
        lit = is_highlight or random.random() > 0.35
        mat = mat_window if (is_highlight or lit) else mat_dim_win
        x = -((WIN_COLS - 1) * WIN_SPACING) / 2 + c * WIN_SPACING
        z = f * FLOOR_H + FLOOR_H / 2
        # Front window plane
        add_box(f"WinF{f}_{c}",
                location=(x, TOWER_D / 2 + 0.05, z),
                scale=(0.10, 0.005, 0.20),
                material=mat)
        # Back window plane
        add_box(f"WinB{f}_{c}",
                location=(x, -TOWER_D / 2 - 0.05, z),
                scale=(0.10, 0.005, 0.20),
                material=mat)

# Penthouse crown — slightly larger overhanging box
crown_h = 1.6
add_box("Crown",
        location=(0, 0, TOWER_TOP + crown_h / 2),
        scale=(TOWER_W * 0.6, TOWER_D * 0.6, crown_h / 2),
        material=mat_concrete)

# Glowing penthouse glass
add_box("CrownGlass",
        location=(0, 0, TOWER_TOP + crown_h / 2),
        scale=(TOWER_W * 0.52, TOWER_D * 0.52, crown_h * 0.4),
        material=mat_pent)

# Antenna spire
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.08,
    depth=3.6,
    location=(0, 0, TOWER_TOP + crown_h + 1.8)
)
spire = bpy.context.active_object
spire.name = "Spire"
spire.data.materials.append(mat_trim)

# --------------------------------------------------------------------------- #
# Lighting + camera for preview render
# --------------------------------------------------------------------------- #
# Ground plane (preview only, will not be exported)
bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "PreviewGround"
ground_mat = make_material("Ground", (0.03, 0.04, 0.06), 0.1, 0.95)
ground.data.materials.append(ground_mat)

# Sky / world background — deep navy
world = bpy.data.worlds.new("World")
bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.02, 0.03, 0.08, 1.0)
bg.inputs["Strength"].default_value = 0.6

# Warm key light (moon/sun)
bpy.ops.object.light_add(type="SUN", location=(-20, -15, 40))
key = bpy.context.active_object
key.data.color = (1.0, 0.88, 0.7)
key.data.energy = 3.0
key.rotation_euler = (0.5, 0.0, 0.9)

# Cool fill from opposite side
bpy.ops.object.light_add(type="AREA", location=(25, 20, 18))
fill = bpy.context.active_object
fill.data.color = (0.6, 0.7, 1.0)
fill.data.energy = 60
fill.data.size = 20

# Camera — three-quarter view at penthouse height
bpy.ops.object.camera_add(location=(28, -32, 18), rotation=(1.25, 0.0, 0.75))
cam = bpy.context.active_object
cam.data.lens = 70
bpy.context.scene.camera = cam

# --------------------------------------------------------------------------- #
# Render preview PNG (Eevee for speed; Cycles would be slower)
# --------------------------------------------------------------------------- #
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT_PNG
# Eevee bloom + ambient occlusion for cinema look
scene.eevee.use_bloom = True
scene.eevee.bloom_threshold = 0.6
scene.eevee.bloom_intensity = 0.4
scene.eevee.use_gtao = True
scene.eevee.gtao_distance = 1.0

print("Rendering preview...")
bpy.ops.render.render(write_still=True)

# --------------------------------------------------------------------------- #
# Export GLB (exclude preview ground + lights + camera)
# --------------------------------------------------------------------------- #
# Select only the tower objects
bpy.ops.object.select_all(action="DESELECT")
EXCLUDE = {"PreviewGround", "Light", "Light.001", "Sun", "Camera"}
for obj in bpy.context.scene.objects:
    if obj.type == "MESH" and obj.name not in EXCLUDE:
        obj.select_set(True)

print(f"Exporting GLB to {OUT_GLB}")
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
)

# --------------------------------------------------------------------------- #
# Done
# --------------------------------------------------------------------------- #
try:
    size = os.path.getsize(OUT_GLB)
    print(f"OK  glb={size} bytes  png={os.path.getsize(OUT_PNG)} bytes")
except OSError as e:
    print(f"FAIL  {e}", file=sys.stderr)
    sys.exit(1)
