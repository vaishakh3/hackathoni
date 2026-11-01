"""Reference-driven kettuvallam silhouette: swept ends, woven arches, roof dormers.
Run after build_boat.py, before compression. Safe to run again on this scene.
"""
from pathlib import Path
import bpy, math, runpy
from math import sin,cos,pi
from mathutils import Vector
HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'houseboat.blend'))
root=bpy.data.objects['houseboat'];roof=bpy.data.objects['roof'];P=roof
M=bpy.data.materials
wood=M['01 / oiled jackwood grain'];dark=M['02 / dark carved teak'];cane=M['07 / honey cane'];coir=M['08 / coir rope'];bamboo=M['06 / handwoven palm mat'];brass=M['09 / aged brass'];ivory=M['10 / unbleached cotton'];teal=M['05 / weathered lagoon enamel']
# The broad working barge carries the cabin across almost its whole length.
if not root.get('fuller_hull'):
 def unwarp(x):
  if abs(x)<=4.8:return x
  a=(.62 if x>0 else .26)/1.85**2;d=(-1+math.sqrt(1+4*a*(abs(x)-4.8)))/(2*a)
  return math.copysign(4.8+d,x)
 def limit(y,exponent):return 6.65-13.3/pi*math.asin(min(1,(abs(y)/1.85)**(1/exponent)))
 for o in bpy.data.objects:
  if o.type!='MESH':continue
  if o.name.startswith(('Resin hull','Overlapping wooden strake','Lagoon sheer band','Brass pinstripe','Coir stitch','Carved sheer rail')):
   inv=o.matrix_world.inverted()
   for v in o.data.vertices:
    p=o.matrix_world@v.co;t=(unwarp(p.x)+6.65)/13.3;factor=min(2.5,max(.00001,sin(pi*max(0,min(1,t))))**(-.32));p.y*=factor;v.co=inv@p
  if o.name.startswith('Deck / individual'):
   inv=o.matrix_world.inverted()
   for v in o.data.vertices:
    p=o.matrix_world@v.co;old=limit(p.y,.57);new=limit(p.y,.25)
    if old<2.6:p.x*=new/max(.1,old)
    elif abs(p.x)>2.5:p.x=math.copysign(2.5+(abs(p.x)-2.5)*(new-2.5)/(old-2.5),p.x)
    v.co=inv@p
 root['fuller_hull']=True
for o in list(bpy.data.objects):
 if o.name.startswith('Kettu /'):bpy.data.objects.remove(o,do_unlink=True)
for o in bpy.data.objects:
 if o.name.startswith('Pavilion /'):
  transform=o.matrix_world.copy();o.parent=roof;o.matrix_world=transform
 if o.name.startswith('Face / cheek') and not o.get('refined'):
  o.scale.y*=.42;o.scale.z*=.8;o['refined']=True

def mesh(name,vs,fs,ma,uv=None):
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('Kettu / '+name,me);bpy.context.collection.objects.link(o);o.parent=P;me.materials.append(ma)
 if uv:
  layer=me.uv_layers.new()
  for f in me.polygons:
   for li in f.loop_indices:layer.data[li].uv=uv[me.loops[li].vertex_index]
 return o
def tube(name,pts,r,ma,sides=8):
 vs=[];fs=[]
 for i,p in enumerate(pts):
  p=Vector(p);t=(Vector(pts[min(i+1,len(pts)-1)])-Vector(pts[max(i-1,0)])).normalized();a=t.cross(Vector((0,0,1))).normalized()
  if a.length<.1:a=t.cross(Vector((0,1,0))).normalized()
  b=t.cross(a)
  for k in range(sides):vs.append(p+r*(a*cos(k*2*pi/sides)+b*sin(k*2*pi/sides)))
 for i in range(len(pts)-1):
  for k in range(sides):a=i*sides+k;b=i*sides+(k+1)%sides;fs.append((a,b,b+sides,a+sides))
 o=mesh(name,vs,fs,ma)
 for f in o.data.polygons:f.use_smooth=True
 return o
def cube(name,loc,size,ma,bevel=.015):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name='Kettu / '+name;o.parent=P;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(ma)
 if bevel:
  mod=o.modifiers.new('Soft handmade edges','BEVEL');mod.width=bevel;mod.segments=2;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def archheight(x,center):
 q=(x-center)/.76
 return 2.19+.70*math.sqrt(max(0,1-q*q))

# Woven enclosing walls with actual open arched apertures. The shell lifts with the roof.
centers=[-3.8,-1.88,.04,1.96]
for s in [-1,1]:
 y=s*1.745
 vs=[];fs=[];uv=[]
 def panel(x1,x2,z1,z2,z3=None,z4=None):
  a=len(vs);vs.extend([(x1,y,z1),(x2,y,z2),(x2,y,z4 if z4 is not None else z2),(x1,y,z3 if z3 is not None else z1)])
  fs.append((a,a+1,a+2,a+3));uv.extend([(x*.6,z*.55) for x,_,z in vs[-4:]])
 # Full lower woven panels sit between the dark sheer rail and window sill.
 panel(-4.85,2.92,.86,.86,1.30,1.30)
 bounds=[-4.85]+[v for c in centers for v in [c-.76,c+.76]]+[2.92]
 for j in range(0,len(bounds)-1,2):panel(bounds[j],bounds[j+1],1.30,1.30,3.10,3.10)
 for c in centers:
  for j in range(40):
   x1=c-.76+1.52*j/40;x2=c-.76+1.52*(j+1)/40
   panel(x1,x2,archheight(x1,c),archheight(x2,c),3.10,3.10)
 wall=mesh('woven arched cabin',vs,fs,bamboo,uv);solid=wall.modifiers.new('Woven wall thickness','SOLIDIFY');solid.thickness=.055
 for c in centers:
  pts=[(c-.76,y-s*.008,1.30),(c-.76,y-s*.008,2.19)]+[(c-.76*cos(a),y-s*.008,2.19+.70*sin(a)) for a in [j*pi/40 for j in range(41)]]+[(c+.76,y-s*.008,1.30)]
  tube('carved arched window surround',pts,.048,dark,12)
  tube('coir window welt',[(x,y+s*.04,z) for x,_,z in pts],.021,cane)
  cube('window sill',(c,y,1.30),(1.65,.20,.07),wood,.025)
  # Open lattice screens below eye level, as in the supplied traditional examples.
  for k in range(9):
   x=c-.65+k*.1625
   tube('cane window lattice',[(x,y,1.34),(min(c+.69,x+.28),y,1.61)],.012,cane)
   tube('cane window lattice',[(x,y,1.61),(min(c+.69,x+.28),y,1.34)],.012,cane)
  tube('window lattice top',[(c-.70,y,1.63),(c+.70,y,1.63)],.025,wood)
  # Bound edges convey the layered material around the large opening.
  for j in range(19):
   a=j*pi/18;px=c-.795*cos(a);pz=2.19+.735*sin(a)
   tube('window coir tie',[(px-.024,y-s*.045,pz-.015),(px+.024,y+s*.07,pz+.015)],.007,coir,6)
 # Long horizontal mat battens and exterior corner lashings.
 for z in [.95,1.11,3.04,3.14]:tube('woven cabin batten',[(-4.87,y+s*.045,z),(2.94,y+s*.045,z)],.025,cane)
 for x in [-4.84,-2.84,-.92,1.0,2.91]:
  tube('woven cabin upright',[(x,y+s*.045,.89),(x,y+s*.045,3.12)],.027,cane)
  for z in [.96,1.10,2.95,3.08]:tube('corner binding',[(x-.05,y-s*.025,z),(x+.05,y+s*.065,z+.018)],.009,coir)

# Deform existing hull and roof once: a pointed, rising prow and lifted roof tips.
if not root.get('reference_silhouette'):
 hullprefix=('Resin hull','Overlapping wooden strake','Lagoon sheer band','Brass pinstripe','Coir stitch','Carved sheer rail')
 for o in bpy.data.objects:
  if o.type!='MESH':continue
  if o.name.startswith(hullprefix):
   inv=o.matrix_world.inverted()
   for v in o.data.vertices:
    p=o.matrix_world@v.co
    if p.x>4.8:
     t=min(1,(p.x-4.8)/1.85);p.x+=.62*t*t;p.z+=.85*t**4
    if p.x<-4.8:
     t=min(1,(-p.x-4.8)/1.85);p.x-=.26*t*t;p.z+=.40*t**4
    v.co=inv@p
  if o.name.startswith('Canopy /'):
   inv=o.matrix_world.inverted()
   for v in o.data.vertices:
    p=o.matrix_world@v.co;p.z+=.38*(abs(p.x)/5.1)**6;v.co=inv@p
 root['reference_silhouette']=True

# A second flowing roof lip and tapered ridge make the roof read as layered thatch.
for s in [-1,1]:
 pts=[]
 for i in range(101):
  x=-5.20+i*10.40/100;edge=abs(x)/5.2
  pts.append((x,s*(1.99-.18*edge**6),3.04+.25*edge**6))
 tube('layered sweeping eave',pts,.042,cane,12)
 tube('second eave binding',[(x,y+s*.025,z+.10) for x,y,z in pts],.018,coir)
 # Tightly wrapped ends rather than a clean manufactured roof edge.
 for k in range(64):
  x=-5.1+k*10.2/63;edge=abs(x)/5.2;y=s*(1.99-.18*edge**6);z=3.04+.25*edge**6
  tube('eave coir wrap',[(x-.012,y-s*.055,z-.05),(x+.012,y+s*.055,z+.06)],.007,coir,6)

# Three small dormer gables, lattice ventilators and saddle roofs.
for cx in [-3.4,-.35,2.7]:
 for s in [-1,1]:
  y=s*.50
  # Dark recess behind the triangular cane lattice.
  mesh('clerestory shadow',[(cx-.58,y,4.10),(cx+.58,y,4.10),(cx,y,4.68)],[(0,1,2)],dark)
  tube('clerestory gable',[(cx-.63,y,4.10),(cx,y,4.73),(cx+.63,y,4.10)],.034,cane)
  tube('clerestory sill',[(cx-.62,y-s*.015,4.14),(cx+.62,y-s*.015,4.14)],.024,wood)
  for k in range(-5,6):
   x=cx+k*.10;top=4.66-abs(k*.1)*.95
   tube('clerestory vertical lattice',[(x,y+s*.018,4.16),(x,y+s*.018,top)],.010,cane)
  for z in [4.28,4.41,4.54]:
   w=(4.67-z)/.95;tube('clerestory cross lattice',[(cx-w,y+s*.02,z),(cx+w,y+s*.02,z)],.010,cane)
 verts=[(cx-.70,-.65,4.13),(cx,-.65,4.77),(cx+.70,-.65,4.13),(cx-.70,.65,4.13),(cx,.65,4.77),(cx+.70,.65,4.13)]
 canopy=mesh('dormer woven roof',verts,[(0,1,4,3),(1,2,5,4)],bamboo,[(0,0),(.5,0),(1,0),(0,1),(.5,1),(1,1)])
 sol=canopy.modifiers.new('Palm layer thickness','SOLIDIFY');sol.thickness=.045
 for s in [-1,1]:tube('dormer rolled roof trim',[(cx-.73,s*.67,4.15),(cx,s*.67,4.79),(cx+.73,s*.67,4.15)],.033,coir)
 tube('dormer ridge',[(cx,-.70,4.79),(cx,.70,4.79)],.036,cane)

# Front veranda: a broad arch and fine lattice rail visible behind the raised prow.
x=4.95
pts=[(x,-1.40,1.30),(x,-1.48,2.40),(x,-1.78,2.95)]+[(x,-1.78*cos(j*pi/40),2.95+1.42*sin(j*pi/40)) for j in range(41)]+[(x,1.48,2.40),(x,1.40,1.30)]
tube('veranda grand arch',pts,.060,wood,12)
tube('veranda cane welt',[(x+.045,y,z) for _,y,z in pts],.025,cane)
# The fascia deliberately has an open center so the helmsman and deck remain readable.
for s in [-1,1]:
 tube('veranda flared bracket',[(4.80,s*1.78,2.30),(4.85,s*1.70,2.65),(4.95,s*1.48,2.93)],.048,cane)

# Hand carved scrolling accent on each pointed end.
P=root
for x,z,sgn in [(6.97,2.02,1),(-6.75,1.69,-1)]:
 for s in [-1,1]:
  pts=[]
  for j in range(49):
   a=j/48*pi*2.2;r=.13*(1-j/60);pts.append((x+sgn*r*cos(a),s*.09,z+r*sin(a)))
  tube('prow carved spiral',pts,.014,brass)

bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
 if o.name.startswith('Kettu /'):o.select_set(True)
bpy.context.view_layer.objects.active=next(o for o in bpy.data.objects if o.name.startswith('Kettu /'))
bpy.ops.object.convert(target='MESH')
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'houseboat.blend'))
runpy.run_path(str(HERE/'optimize_export.py'),run_name='__main__')
print('REFERENCE_KETTUVALLAM_COMPLETE',flush=True)
