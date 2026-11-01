"""Studio renders of the detailed editable boat and its workshop."""
from pathlib import Path
import bpy, sys
from mathutils import Vector
HERE=Path(__file__).resolve().parent;OUT=HERE.parent/'public'/'assets'
bpy.ops.wm.open_mainfile(filepath=str(HERE/'houseboat.blend'))
for o in list(bpy.data.objects):
 if o.type in {'LIGHT','CAMERA'}:bpy.data.objects.remove(o,do_unlink=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.cycles.max_bounces=6;scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.28,.36,.40,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
def area(name,loc,power,color,size,target=(0,0,1.2)):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Studio / warm key',(1,-6,10),1800,(1,.81,.60),8)
area('Studio / sky fill',(-6,1,8),1300,(.67,.82,1),7)
area('Studio / broad rim',(5,7,9),2400,(1,.88,.68),6)
for x in [-2.2,.1,2.4]:
 bpy.ops.object.light_add(type='POINT',location=(x,0,2.6));o=bpy.context.object;o.name='Studio / cabin light';o.data.energy=35;o.data.color=(1,.55,.23);o.data.shadow_soft_size=.4
bpy.ops.object.camera_add(location=(4.2,-18.5,4.1));cam=bpy.context.object;cam.name='Presentation camera';cam.rotation_euler=(Vector((.65,0,2.55))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=18.2;scene.camera=cam
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.2
# Save a useful opening view for someone continuing the model in Blender.
for screen in bpy.data.screens:
 for a in screen.areas:
  if a.type=='VIEW_3D':
   a.spaces.active.region_3d.view_distance=17
   a.spaces.active.region_3d.view_location=(0,0,1.7)
   a.spaces.active.region_3d.view_rotation=cam.rotation_euler.to_quaternion()
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'houseboat.blend'))
scene.render.filepath=str(OUT/'boat-night.png');bpy.ops.render.render(write_still=True)
if '--hero-only' in sys.argv:sys.exit(0)
for o in bpy.data.objects:
 p=o.parent
 while p:
  if p.name=='roof':o.hide_render=True;break
  p=p.parent
cam.location=(13,-18,17);cam.rotation_euler=(Vector((0,0,1.2))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=15.8
scene.render.filepath=str(OUT/'boat-cutaway.png');bpy.ops.render.render(write_still=True)
cam.location=(5.5,-7,6);cam.rotation_euler=(Vector((.1,0,1.5))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=7.4
scene.render.resolution_x=1800;scene.render.resolution_y=1200;scene.cycles.samples=48
scene.render.filepath=str(HERE.parent/'workshop-detail.png');bpy.ops.render.render(write_still=True)
print('DETAILED_RENDERS_COMPLETE',flush=True)
