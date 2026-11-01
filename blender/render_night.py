from pathlib import Path
import bpy,os
from mathutils import Vector
BASE=str(Path(__file__).resolve().parent.parent/'public'/'assets')
bpy.ops.wm.open_mainfile(filepath=str(Path(__file__).resolve().parent/'houseboat.blend'))
# Render atmosphere, no background so parent can compose over indigo water.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene.world.color=(.08,.12,.24);scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.17,.24,.42,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.18

def area(name,loc,power,color,size):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1.2))-o.location).to_track_quat('-Z','Y').to_euler()
area('Moon softbox',(0,-7,12),850,(.34,.55,1),9)
area('Warm cabin softbox',(2,-4,5),230,(1,.56,.21),7)
area('Rear rim',(-4,6,8),1100,(.22,.45,1),8)
for x in [-2,1,3]:
 bpy.ops.object.light_add(type='POINT',location=(x,0,2.6));o=bpy.context.object;o.data.energy=55;o.data.color=(1,.38,.08);o.data.shadow_soft_size=.5
bpy.ops.object.camera_add(location=(16,-22,13));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.5))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=16.3;scene.camera=cam
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-.05
scene.render.filepath=os.path.join(BASE,'boat-night.png');bpy.ops.render.render(write_still=True)
print('HACKATHONI_ASSET_COMPLETE', flush=True)
