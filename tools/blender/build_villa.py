"""
Modern luxury villa — Blender 4.x procedural model.

A low-poly contemporary single-family home: flat overhanging roof,
expansive floor-to-ceiling glass, warm interior glow, infinity pool,
landscape steps, slim columns. Designed to read clearly at distance.

Run:
  blender --background --python tools/blender/build_villa.py

Outputs:
  public/models/villa.glb
  tools/blender/villa-preview.png
"""

import os
import sys
import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
OUT_GLB = os.path.join(REPO_ROOT, "public", "models", "villa.glb")
OUT_PNG = os.path.join(SCRIPT_DIR, "villa-preview.png")
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.view_settings.view_transform = "AgX"
bpy.context.scene.view_settings.look = "AgX - Medium High Contrast"


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


# Materials
mat_stone     = material("Stone",       (0.65, 0.62, 0.56), 0.05, 0.78)
mat_wood      = material("Wood",        (0.34, 0.22, 0.13), 0.15, 0.55)
mat_glow      = material("Interior",    (0.97, 0.82, 0.52), 0.0, 0.35,
                         emit=(0.97, 0.82, 0.52), emit_strength=2.8)
mat_glass     = material("Glass",       (0.10, 0.12, 0.18), 0.75, 0.10,
                         emit=(0.10, 0.12, 0.18), emit_strength=0.12)
mat_gold      = material("Gold",        (0.78, 0.62, 0.30), 0.95, 0.22,
                         emit=(0.78, 0.62, 0.30), emit_strength=0.25)
mat_pool      = material("Pool",        (0.28, 0.55, 0.78), 0.5, 0.08,
                         emit=(0.28, 0.55, 0.78), emit_strength=0.35)
mat_decking   = material("Decking",     (0.20, 0.17, 0.13), 0.12, 0.7)
mat_landscape = material("Landscape",   (0.16, 0.20, 0.14), 0.0, 0.95)


# Root
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
root = bpy.context.active_object
root.name = "VillaRoot"

# Landscape plinth — the villa sits on a raised terraced platform
add_box("Plinth",
        (0, 0, 0.4),
        (6.0, 4.0, 0.4),
        mat_stone, parent=root)
add_box("PlinthEdge",
        (0, 0, 0.4),
        (6.05, 4.05, 0.42),
        mat_decking, parent=root)
add_box("PlinthTop",
        (0, 0, 0.81),
        (5.6, 3.6, 0.02),
        mat_decking, parent=root)

# Ground floor — long, low, lots of glass on one face
GF_H = 1.4
GF_Z = 0.82 + GF_H / 2
add_box("GroundStone",
        (-2.0, 0, GF_Z),
        (1.6, 3.0, GF_H / 2),
        mat_stone, parent=root)
add_box("GroundGlow",
        (1.6, 0, GF_Z),
        (2.0, 2.8, GF_H / 2 * 0.96),
        mat_glow, parent=root)
# Glass curtain wall in front of the glow box
add_box("GroundGlass",
        (1.6, 2.8, GF_Z),
        (2.0, 0.05, GF_H / 2),
        mat_glass, parent=root)
# Gold mullion lines on the glass
for i, x in enumerate([-1.0, 0.0, 1.0]):
    add_box(f"Mullion{i}",
            (1.6 + x, 2.85, GF_Z),
            (0.04, 0.03, GF_H / 2 * 0.95),
            mat_gold, parent=root)

# Upper floor — slightly cantilevered on glass side
UP_H = 1.2
UP_Z = GF_Z + GF_H / 2 + UP_H / 2 + 0.04
add_box("UpperStone",
        (-1.6, 0, UP_Z),
        (2.2, 3.0, UP_H / 2),
        mat_stone, parent=root)
add_box("UpperGlow",
        (1.9, 0, UP_Z),
        (1.5, 2.6, UP_H / 2 * 0.95),
        mat_glow, parent=root)
add_box("UpperGlass",
        (1.9, 2.65, UP_Z),
        (1.5, 0.05, UP_H / 2 * 0.95),
        mat_glass, parent=root)
for i, x in enumerate([-0.7, 0.7]):
    add_box(f"UpperMullion{i}",
            (1.9 + x, 2.70, UP_Z),
            (0.04, 0.03, UP_H / 2 * 0.95),
            mat_gold, parent=root)

# Flat overhanging roof
ROOF_Z = UP_Z + UP_H / 2 + 0.05
add_box("Roof",
        (0, 0, ROOF_Z),
        (4.4, 3.4, 0.08),
        mat_decking, parent=root)
add_box("RoofEdge",
        (0, 0, ROOF_Z + 0.04),
        (4.5, 3.5, 0.03),
        mat_gold, parent=root)

# Slim columns supporting the cantilever
for x in (1.4, 3.4):
    add_box(f"Column_{x}",
            (x, 2.9, (GF_Z + ROOF_Z) / 2),
            (0.08, 0.08, (ROOF_Z - GF_Z + GF_H) / 2),
            mat_gold, parent=root)

# Infinity pool extending from the house out to the front
add_box("PoolDeck",
        (3.0, 0, 0.82),
        (2.8, 1.6, 0.04),
        mat_decking, parent=root)
add_box("Pool",
        (3.0, 0, 0.86),
        (2.4, 1.2, 0.03),
        mat_pool, parent=root)
# Lounger trio
for i in range(3):
    add_box(f"Lounger{i}",
            (3.0 + (i - 1) * 0.7, 1.45, 0.94),
            (0.22, 0.10, 0.05),
            mat_wood, parent=root)

# Landscape strip — a low garden hedge behind the villa
add_box("Hedge",
        (-5.0, 0, 0.5),
        (0.4, 3.6, 0.5),
        mat_landscape, parent=root)
add_box("EntryStep",
        (-3.6, 0, 0.30),
        (0.6, 1.4, 0.06),
        mat_decking, parent=root)

# Two stone pillars at the entrance with warm uplights
for sign in (1, -1):
    add_box(f"EntryPillar_{sign}",
            (-4.4, sign * 1.0, 0.95),
            (0.12, 0.12, 0.65),
            mat_stone, parent=root)
    add_box(f"EntryLight_{sign}",
            (-4.4, sign * 1.0, 1.55),
            (0.14, 0.14, 0.06),
            mat_glow, parent=root)


# ---------- Preview render ----------
bpy.ops.mesh.primitive_plane_add(size=120, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "PreviewGround"
ground.data.materials.append(material("Ground", (0.03, 0.04, 0.07), 0.0, 0.95))

world = bpy.data.worlds.new("World")
bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.025, 0.035, 0.085, 1.0)
bg.inputs["Strength"].default_value = 0.7

# Warm dusk key
bpy.ops.object.light_add(type="SUN", location=(-18, -10, 30))
key = bpy.context.active_object
key.data.color = (1.0, 0.78, 0.55)
key.data.energy = 2.6
key.rotation_euler = (0.7, 0.0, 0.7)

# Cool fill from opposite
bpy.ops.object.light_add(type="AREA", location=(15, -18, 14))
fill = bpy.context.active_object
fill.data.color = (0.55, 0.75, 1.0)
fill.data.energy = 70
fill.data.size = 18

# Hero three-quarter camera, pulled back far enough to see the whole villa
bpy.ops.object.camera_add(location=(22, -20, 9), rotation=(1.20, 0.0, 0.82))
cam = bpy.context.active_object
cam.data.lens = 35
bpy.context.scene.camera = cam

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT_PNG
scene.eevee.use_bloom = True
scene.eevee.bloom_threshold = 1.1
scene.eevee.bloom_intensity = 0.12
scene.eevee.bloom_radius = 3.0
scene.eevee.use_gtao = True
scene.eevee.gtao_distance = 0.7

print("Rendering villa preview...")
bpy.ops.render.render(write_still=True)


# ---------- Export GLB ----------
bpy.ops.object.select_all(action="DESELECT")
EXCLUDE = {"PreviewGround", "Camera"}
for obj in bpy.context.scene.objects:
    if obj.name in EXCLUDE:
        continue
    if obj.type == "LIGHT":
        continue
    if obj.type in {"MESH", "EMPTY"}:
        obj.select_set(True)

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
