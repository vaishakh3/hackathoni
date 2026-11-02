"""Replace portrait scans with warm, small-scale sculpted miniature figures.

Run with Blender --background --python blender/friendly_crew.py, then run
node blender/compress_model.mjs. The editable source scene is left intact.
"""
from pathlib import Path
from math import sin, cos, pi
import bpy
HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'houseboat.blend'))

def material(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.82;bs.inputs['Specular IOR Level'].default_value=.18
 return m
hair=material('Crew / soft dark hair',(.024,.016,.013))
feature=material('Crew / quiet facial details',(.065,.031,.019))
skins=[material('Crew / terracotta skin '+str(k),c) for k,c in enumerate([(.32,.17,.095),(.46,.27,.16),(.23,.11,.055),(.51,.32,.21),(.36,.19,.11),(.40,.22,.13)])]

def ell(name,loc,scale,ma,parent,segments=20,rings=12):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings)
 o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.scale=scale;o.data.materials.append(ma)
 for p in o.data.polygons:p.use_smooth=True
 return o

def curve(name,points,radius,ma,parent):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=1;c.resolution_u=2
 s=c.splines.new('POLY');s.points.add(len(points)-1)
 for p,v in zip(s.points,points):p.co=(*v,1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(ma)
 bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)

heads=sorted([o for o in bpy.data.objects if o.name.startswith('Maker / head')],key=lambda o:o.parent.name)
for k,head in enumerate(heads):
 for o in list(head.children_recursive):bpy.data.objects.remove(o,do_unlink=True)
 head.rotation_euler.x=-.10-(k%3)*.02
 skin=skins[k]
 # Quiet facial features are shaped for a miniature, without white eyeballs,
 # transparent hair cards, photographic skin or exaggerated expressions.
 ell('Crew / sculpted face',(0,0,.006),(.137,.122,.211),skin,head)
 for s in [-1,1]:
  ell('Crew / ear',(s*.135,-.003,-.006),(.024,.022,.043),skin,head,12,8)
  ell('Crew / downcast eye',(s*.052,.114,.026),(.012,.0035,.0045),feature,head,12,8)
 ell('Crew / nose',(0,.122,-.025),(.018,.021,.027),skin,head,12,8)
 curve('Crew / relaxed mouth',[(-.027,.107,-.083),(0,.111,-.086),(.027,.107,-.083)],.0024,feature,head)
 # A fitted cap with a varied hairline forms one opaque silhouette.
 verts=[];faces=[];N=24;R=10
 for j in range(R+1):
  for i in range(N):
   a=2*pi*i/N;front=max(0,cos(a));end=1.84-.67*front + .07*sin(a*2+k)
   t=.008+(end-.008)*j/R
   verts.append((.145*sin(t)*sin(a),.131*sin(t)*cos(a)-.007,.219*cos(t)+.012))
 for j in range(R):
  for i in range(N):
   a=j*N+i;b=j*N+(i+1)%N;faces.append((a,b,b+N,a+N))
 me=bpy.data.meshes.new('Crew / fitted hair');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('Crew / fitted hair',me);bpy.context.collection.objects.link(o);o.parent=head;me.materials.append(hair)
 for p in me.polygons:p.use_smooth=True
 if k in [1,3,5]:ell('Crew / tied hair',(0,-.13,.035),(.064,.057,.074),hair,head)
 else:ell('Crew / swept hair',(-.025,.002,.188),(.123,.116,.055),hair,head)
 # Keep hands and neck consistent with the face.
 old=bpy.data.materials.get('Skin / '+str(k))
 if old:
  for o in bpy.data.objects:
   if o.type=='MESH':
    for slot in o.material_slots:
     if slot.material==old:slot.material=skin
print('FRIENDLY_CREW',len(heads),flush=True)
# Reuse batching and baked contact shading; skip reopening the original scene.
source=(HERE/'optimize_export.py').read_text()
source=source.replace("bpy.ops.wm.open_mainfile(filepath=str(HERE/'houseboat.blend'))",'')
exec(compile(source,str(HERE/'optimize_export.py'),'exec'))
