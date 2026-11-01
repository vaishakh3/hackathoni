"""Cinematic material pass. Preserves the editable boat and liftable roof.

Palm weave: generated for Hackathoni. Timber PBR: Poly Haven, CC0.
Run after shape_kettuvallam.py / portraits, before optimize_export.py.
"""
from pathlib import Path
import bpy, numpy as np
from mathutils import Vector
HERE = Path(__file__).resolve().parent
TEX = HERE.parent / 'public' / 'assets' / 'materials'
bpy.ops.wm.open_mainfile(filepath=str(HERE / 'houseboat.blend'))

def image(name, noncolor=False):
    im = bpy.data.images.load(str(TEX / name), check_existing=True)
    if noncolor: im.colorspace_settings.name = 'Non-Color'
    im.pack()
    return im

wood = image('timber-diff.jpg')
woodnormal = image('timber-nor_gl.jpg', True)
woodrough = image('timber-rough.jpg', True)
palm = image('palm-weave.png')
# Derive a tangent normal from the weave's luminance. This is a technical
# material map, while the color image retains the original generated artwork.
w,h = palm.size
pixels = np.empty(w*h*4, np.float32); palm.pixels.foreach_get(pixels)
rgb = pixels.reshape(h,w,4)[:,:,:3]
height = np.dot(rgb, [.2126,.7152,.0722])
dy,dx = np.gradient(height)
normal = np.stack((-dx*3.0,-dy*3.0,np.ones_like(dx)),axis=-1)
normal /= np.linalg.norm(normal,axis=-1)[:,:,None]
rgba = np.ones((h,w,4),np.float32);rgba[:,:,:3]=normal*.5+.5
pn = bpy.data.images.new('Palm weave / tangent normal',width=w,height=h,alpha=False)
pn.colorspace_settings.name='Non-Color';pn.pixels.foreach_set(rgba.ravel())
pn.filepath_raw=str(TEX/'palm-weave-normal.png');pn.file_format='PNG';pn.save();pn.pack()

def pbr(name, colorimage, normalimage=None, roughimage=None, roughness=.7):
    m=bpy.data.materials[name];m.use_nodes=True
    nodes=m.node_tree.nodes;links=m.node_tree.links
    bs=nodes.get('Principled BSDF')
    for n in list(nodes):
        if n not in [bs,nodes.get('Material Output')]:nodes.remove(n)
    bs.inputs['Base Color'].default_value=(1,1,1,1)
    bs.inputs['Roughness'].default_value=roughness
    bs.inputs['Specular IOR Level'].default_value=.28
    n=nodes.new('ShaderNodeTexImage');n.image=colorimage;links.new(n.outputs['Color'],bs.inputs['Base Color'])
    if normalimage:
        n=nodes.new('ShaderNodeTexImage');n.image=normalimage
        normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.45
        links.new(n.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],bs.inputs['Normal'])
    if roughimage:
        n=nodes.new('ShaderNodeTexImage');n.image=roughimage;links.new(n.outputs['Color'],bs.inputs['Roughness'])
    return m

woodmats=[]
for name in ['01 / oiled jackwood grain','02 / dark carved teak','03 / teak end grain','04 / resin-darkened timber']:
    woodmats.append(pbr(name,wood,woodnormal,woodrough))
palm_mat=pbr('06 / handwoven palm mat',palm,pn,roughness=.84)
for n in palm_mat.node_tree.nodes:
    if n.type=='NORMAL_MAP':n.inputs['Strength'].default_value=.22
for o in bpy.data.objects:
    if o.type=='MESH' and o.data.materials and o.data.materials[0]==palm_mat and not o.get('fine_weave_uv'):
        if o.data.uv_layers.active:
            for v in o.data.uv_layers.active.data:v.uv*=2.3
        o['fine_weave_uv']=True

# World-aligned UVs keep grain continuous along the keel and deck. Different
# small parts inherit the same material scale instead of stretched square maps.
bpy.context.view_layer.update()
for o in bpy.data.objects:
    if o.type=='MESH' and o.name.startswith('Cabin /') and o.data.materials and o.data.materials[0]==palm_mat:
        layer=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
        for poly in o.data.polygons:
            n=o.matrix_world.to_3x3()@poly.normal
            axis=max(range(3),key=lambda i:abs(n[i]))
            for li in poly.loop_indices:
                p=o.matrix_world@o.data.vertices[o.data.loops[li].vertex_index].co
                u,v=(p.x,p.y) if axis==2 else ((p.x,p.z) if axis==1 else (p.y,p.z))
                layer.data[li].uv=(u*.9,v*.9)
for o in bpy.data.objects:
    if o.type!='MESH' or not o.data.materials:continue
    if o.data.materials[0] not in woodmats:continue
    uv=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
    for poly in o.data.polygons:
        n=o.matrix_world.to_3x3()@poly.normal
        axis=max(range(3),key=lambda i:abs(n[i]))
        for li in poly.loop_indices:
            p=o.matrix_world@o.data.vertices[o.data.loops[li].vertex_index].co
            u,v=(p.x,p.y) if axis==2 else ((p.x,p.z) if axis==1 else (p.y,p.z))
            uv.data[li].uv=(u*.27,v*.38)

# Reduce chalky highlights. Soft honey-colored lamps read as practical lighting.
for name in ['07 / honey cane','08 / coir rope']:
    bs=bpy.data.materials[name].node_tree.nodes.get('Principled BSDF')
    bs.inputs['Specular IOR Level'].default_value=.2
lamp=bpy.data.materials['18 / glowing tungsten'].node_tree.nodes.get('Principled BSDF')
lamp.inputs['Emission Color'].default_value=(1,.29,.055,1)
lamp.inputs['Emission Strength'].default_value=2.8
lamp.inputs['Base Color'].default_value=(1,.49,.15,1)
for m in bpy.data.materials:
    if m.name.startswith('Display /'):
        m.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=.55

# Keep a record in the asset itself for future Blender work.
bpy.data.objects['houseboat']['material_pass']='Cinematic / Poly Haven timber + authored palm weave'
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'houseboat.blend'))
print('CINEMATIC_MATERIALS_COMPLETE',flush=True)
