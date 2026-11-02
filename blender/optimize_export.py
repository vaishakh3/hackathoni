"""Export the editable scene, batching materials while retaining the liftable roof."""
from pathlib import Path
import bpy, numpy as np
HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'houseboat.blend'))
# The bow bunting has no independent supports when the canopy is raised.
# Leave the editable source intact, but omit both cord and pennants from exports.
bunting=[o for o in bpy.data.objects if o.name.startswith('Flags /')]
for o in bunting:bpy.data.objects.remove(o,do_unlink=True)
print('REMOVED_UNSUPPORTED_BUNTING',len(bunting),flush=True)
root=bpy.data.objects['houseboat'];roof=bpy.data.objects['roof']
bpy.context.view_layer.update();groups={}
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 canopy=False;p=o.parent
 while p:
  if p==roof:canopy=True;break
  p=p.parent
 ma=o.data.materials[0] if o.data.materials else None
 groups.setdefault((canopy,ma.name if ma else ''),[]).append(o)
for (isroof,name),objects in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:
  mat=o.matrix_world.copy();o.parent=None;o.matrix_world=mat;o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);o.parent=roof if isroof else root;o.name=('Canopy / ' if isroof else 'Boat / ')+name
for o in list(bpy.data.objects):
 if o.type=='EMPTY' and o not in [root,roof]:bpy.data.objects.remove(o,do_unlink=True)
# Short-range ambient occlusion is baked into vertex colors. This gives the
# rail joints, floor, window recesses and furnishings contact depth in WebGL,
# without requiring a screen-space effect or many real-time shadow maps.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.bake.target='VERTEX_COLORS';scene.render.bake.use_clear=True
ao=bpy.data.materials.new('Export-only contact shading');ao.use_nodes=True
ns=ao.node_tree.nodes;ns.clear();out=ns.new('ShaderNodeOutputMaterial')
emit=ns.new('ShaderNodeEmission');occ=ns.new('ShaderNodeAmbientOcclusion')
occ.inputs['Distance'].default_value=.45;occ.samples=16
ao.node_tree.links.new(occ.outputs['Color'],emit.inputs['Color']);ao.node_tree.links.new(emit.outputs[0],out.inputs['Surface'])
bpy.ops.object.select_all(action='DESELECT');baked=[]
for o in bpy.data.objects:
 if o.type!='MESH':continue
 ma=o.data.materials[0]
 # Alpha hair and emissive displays keep their own color response.
 if ma.name.startswith(('Cinematic portrait /','Display /','18 /')):continue
 attr=o.data.color_attributes.new(name='Contact shading',type='FLOAT_COLOR',domain='CORNER')
 o.data.color_attributes.active_color_index=len(o.data.color_attributes)-1
 o.data.color_attributes.render_color_index=len(o.data.color_attributes)-1
 o.data.materials[0]=ao;o.select_set(True);baked.append((o,ma,attr))
if baked:
 bpy.context.view_layer.objects.active=baked[0][0]
 bpy.ops.object.bake(type='EMIT')
 for o,ma,attr in baked:
  values=np.empty(len(attr.data)*4,dtype=np.float32);attr.data.foreach_get('color',values)
  values=values.reshape(-1,4);values[:,:3]=.58+.42*np.clip(values[:,:3],0,1)**.8;values[:,3]=1
  attr.data.foreach_set('color',values.ravel());o.data.materials[0]=ma
print('CONTACT_SHADING_BAKED',len(baked),flush=True)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
 if o.type in {'MESH','EMPTY'}:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(HERE.parent/'public'/'assets'/'houseboat.glb'),export_format='GLB',use_selection=True,export_apply=True,export_lights=False,export_cameras=False,export_yup=True,export_vertex_color='ACTIVE')
print('OPTIMIZED_MESH_COUNT',sum(o.type=='MESH' for o in bpy.data.objects))
