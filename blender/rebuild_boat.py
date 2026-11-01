"""Hackathoni detailed miniature. Run with Blender --background --python.
All geometry and material maps are original, deterministic, and editable.
Blender Z-up; the exporter supplies the website's Y-up coordinate system.
"""
from pathlib import Path
import bpy, math, random, numpy as np
from math import sin, cos, pi
from mathutils import Vector
random.seed(47)
HERE=Path(__file__).resolve().parent
ASSETS=HERE.parent/'public'/'assets'
TEX=ASSETS/'materials';TEX.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for m in list(bpy.data.materials):bpy.data.materials.remove(m)

def image_array(name,rgb):
 h,w=rgb.shape[:2];im=bpy.data.images.new(name,width=w,height=h,alpha=False)
 rgba=np.ones((h,w,4),dtype=np.float32);rgba[:,:,:3]=np.clip(rgb,0,1)
 im.pixels.foreach_set(rgba.ravel());im.filepath_raw=str(TEX/(name+'.png'));im.file_format='PNG';im.save();im.pack();return im

# Tangible surface maps, not flat colors. Longitudinal grain and over/under weave.
n=768;yy,xx=np.mgrid[0:n,0:n]/n;rng=np.random.default_rng(47)
grain=np.sin(yy*510+np.sin(xx*19)*1.7+np.sin(xx*7+yy*33)*2)*.045
grain+=np.sin(yy*1700+np.sin(xx*24)*4)*.024+rng.normal(0,.012,(n,n))
grain+=np.sin(yy*45+np.sin(xx*5)*2)*.045
woodimg=image_array('jackwood-grain',np.array([.34,.205,.11])[None,None,:]+grain[:,:,None]*np.array([1,.72,.44]))
u=(xx*32)%1;v=(yy*32)%1;ix=(xx*32).astype(int);iy=(yy*32).astype(int)
over=((ix+iy//2)%4)<2;strand=np.where(over,np.sin(pi*v)**.25,np.sin(pi*u)**.25)
weave=.65+.24*strand+.045*np.sin(xx*2600)+rng.normal(0,.016,(n,n))
weaveimg=image_array('woven-palm',weave[:,:,None]*np.array([.72,.53,.29]))
height=np.where(over,np.sin(pi*v),np.sin(pi*u))*.07
dy,dx=np.gradient(height);norm=np.stack((-dx*8,-dy*8,np.ones_like(dx)),axis=-1);norm/=np.linalg.norm(norm,axis=-1)[:,:,None]
normalimg=image_array('woven-palm-normal',norm*.5+.5);normalimg.colorspace_settings.name='Non-Color'

def material(name,color,rough=.55,metal=0,emission=0,texture=None,normal=None):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 if emission:bs.inputs['Emission Color'].default_value=(*color,1);bs.inputs['Emission Strength'].default_value=emission
 if texture:
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=texture;m.node_tree.links.new(t.outputs['Color'],bs.inputs['Base Color'])
 if normal:
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=normal;t.image.colorspace_settings.name='Non-Color';nn=m.node_tree.nodes.new('ShaderNodeNormalMap');nn.inputs['Strength'].default_value=.32;m.node_tree.links.new(t.outputs['Color'],nn.inputs['Color']);m.node_tree.links.new(nn.outputs['Normal'],bs.inputs['Normal'])
 return m
wood=material('01 / oiled jackwood grain',(.22,.09,.035),.36,texture=woodimg)
timber=material('02 / dark carved teak',(.105,.046,.019),.4)
woodlight=material('03 / teak end grain',(.33,.16,.067),.48)
hullmat=material('04 / resin-darkened timber',(.045,.027,.018),.38)
teal=material('05 / weathered lagoon enamel',(.026,.16,.145),.37)
bamboo=material('06 / handwoven palm mat',(.54,.33,.12),.8,texture=weaveimg,normal=normalimg)
cane=material('07 / honey cane',(.47,.29,.12),.62)
coir=material('08 / coir rope',(.31,.205,.10),.9)
brass=material('09 / aged brass',(.48,.29,.10),.27,.76)
ivory=material('10 / unbleached cotton',(.80,.74,.58),.93)
rust=material('11 / terracotta linen',(.57,.16,.075),.85)
black=material('12 / charcoal rubber',(.014,.018,.021),.8)
graphite=material('13 / anodized graphite',(.075,.09,.10),.29,.7)
silver=material('14 / satin aluminium',(.39,.43,.45),.25,.8)
keymat=material('15 / keyboard caps',(.028,.033,.037),.63)
paper=material('16 / warm paper',(.86,.83,.71),.9)
leafmat=material('17 / foliage',(.048,.18,.09),.65)
bulb=material('18 / glowing tungsten', (1,.51,.13),.26,emission=3.5)
glass=material('19 / smoky glass',(.13,.23,.22),.13,.35)
tea=material('20 / dark tea',(.12,.039,.01),.13)
skinm=[material('Skin / '+str(i),c,.53) for i,c in enumerate([(.40,.205,.105),(.59,.335,.19),(.29,.125,.06),(.68,.43,.27),(.48,.265,.14),(.35,.16,.073)])]
hairm=[material('Hair / dark',(.018,.012,.009),.62),material('Hair / chestnut',(.055,.026,.012),.62)]
shirts=[material('Linen / '+str(i),c,.95) for i,c in enumerate([(.12,.25,.28),(.52,.19,.09),(.63,.47,.22),(.21,.32,.23),(.72,.68,.55),(.24,.20,.34)])]
denim=material('Indigo denim',(.044,.074,.12),.93)
screenm=[]
for i in range(3):
 im=bpy.data.images.load(str(TEX/f'screen-{i+1}.png'));im.pack();m=material('Display / workspace '+str(i+1),(1,1,1),.4,texture=im)
 bs=m.node_tree.nodes.get('Principled BSDF');t=[a for a in m.node_tree.nodes if a.type=='TEX_IMAGE'][0];m.node_tree.links.new(t.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.32;screenm.append(m)

def empty(name,parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;return o
root=empty('houseboat');root['fuller_hull']=True;roof=empty('roof',root);P=root
def add(o,name,ma=None):
 o.name=name;o.parent=P
 if ma:o.data.materials.append(ma)
 return o
def smooth(o):
 for f in o.data.polygons:f.use_smooth=True
 return o
def cube(name,loc,size,ma,bevel=.015):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=add(bpy.context.object,name,ma);o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  m=o.modifiers.new('Rounded edges','BEVEL');m.width=bevel;m.segments=2
  o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 return o
def ell(name,loc,size,ma,seg=20,rings=12):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,radius=1,location=loc);o=add(bpy.context.object,name,ma);o.scale=size;return smooth(o)
def cyl(name,loc,r,d,ma,vertices=16,rot=None,r2=None):
 if r2 is None:bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d,location=loc)
 else:bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r2,depth=d,location=loc)
 o=add(bpy.context.object,name,ma)
 if rot:o.rotation_euler=rot
 return smooth(o)
def tube(name,pts,r,ma,res=1):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=res
 s=c.splines.new('POLY');s.points.add(len(pts)-1)
 for p,v in zip(s.points,pts):p.co=(*v,1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);return add(o,name,ma)
def link(name,a,b,r,ma,r2=None,vertices=12):
 a,b=Vector(a),Vector(b);o=cyl(name,(a+b)/2,r,(a-b).length,ma,vertices,r2=r2);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def mesh(name,verts,faces,ma,uv=None):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);add(o,name,ma)
 if uv:
  layer=me.uv_layers.new(name='UVMap')
  for f in me.polygons:
   for li in f.loop_indices:layer.data[li].uv=uv[me.loops[li].vertex_index]
 return o
def text(name,body,loc,size,ma,rot=(pi/2,0,0)):
 cu=bpy.data.curves.new(name,'FONT');cu.body=body;cu.size=size;cu.align_x='CENTER';cu.align_y='CENTER';cu.extrude=.0008;cu.resolution_u=3
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;return add(o,name,ma)
def ring(name,loc,r,minor,ma,rot=(0,0,0),segments=32):
 bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=minor,major_segments=segments,minor_segments=8,location=loc,rotation=rot);return smooth(add(bpy.context.object,name,ma))
def grain_uv(o):
 if o.type!='MESH':return
 layer=o.data.uv_layers.active or o.data.uv_layers.new()
 for f in o.data.polygons:
  normal=f.normal
  for li in f.loop_indices:
   v=o.data.vertices[o.data.loops[li].vertex_index].co
   layer.data[li].uv=(v.x*.32,v.y*1.2 if abs(normal.z)>.5 else v.z*1.2)

print('Building the hand-stitched hull',flush=True)
# Gracefully lifted ends, separate overlapping strakes and warm carved gunwale.
def width(t):return 1.85*max(.00001,sin(pi*t))**.25
def hullpoint(t,a,offset=0):
 x=-6.65+13.3*t;w=width(t);rise=.83*abs(2*t-1)**8
 depth=0 if cos(a)>=0 else 1.25*(-cos(a))**.65
 return (x,(w+offset)*sin(a),.62-depth+rise)
vs=[];fs=[];uv=[];N=96;S=32
for i in range(N+1):
 for j in range(S+1):
  vs.append(hullpoint(i/N,j/S*2*pi));uv.append((i/N*3,j/S))
for i in range(N):
 for j in range(S):a=i*(S+1)+j;fs.append((a,a+1,a+S+2,a+S+1))
smooth(mesh('Resin hull with swept bow',vs,fs,hullmat,uv))
for s in [-1,1]:
 for k,a in enumerate([1.75,1.95,2.18,2.4,2.65]):
  tube('Overlapping wooden strake', [hullpoint(.006+.988*i/100,s*a,.012) for i in range(101)],.028,timber)
 # A narrow painted sheer stripe, not an entirely plastic hull.
 tube('Lagoon sheer band',[hullpoint(.012+.976*i/96,s*1.60,.025) for i in range(97)],.045,teal)
 tube('Brass pinstripe',[hullpoint(.013+.974*i/96,s*1.575,.03) for i in range(97)],.010,brass)
 for i in range(2,44):
  t=i/46
  for a in [1.83,2.1,2.4]:
   x,y,z=hullpoint(t,s*a,.034)
   tube('Coir stitch',[(x-.025,y,z-.043),(x+.025,y+s*.009,z+.043)],.008,coir,0)
 # Raised sheer rail sweeps into the bow.
 pts=[(-6.65+13.3*t,s*width(t),.69+.83*abs(2*t-1)**8) for t in np.linspace(.009,.991,100)]
 tube('Carved sheer rail',pts,.085,wood)

# Individually laid deck boards, staggered end joints, brass nails.
for j in range(-8,9):
 y=j*.205;limit=6.65-13.3/pi*math.asin(min(1,((abs(y)+.10)/1.85)**4))
 segments=max(2,int(limit*2/1.8));edges=np.linspace(-limit,limit,segments+1)
 for a,b in zip(edges[:-1],edges[1:]):
  o=cube('Deck / individual teak plank',((a+b)/2,y,.645),(b-a-.012,.197,.065),wood,.006);grain_uv(o)
  for x in [a+.07,b-.07]:
   for dy in [-.06,.06]:cyl('Deck / countersunk nail',(x,y+dy,.681),.009,.004,brass,8)
# Stern cabin with inset panels and louvred shutters, window glass and curtain folds.
cube('Cabin / foundation',(-3.85,0,.78),(2.0,3.12,.18),timber)
cube('Cabin / rear wall',(-4.8,0,1.72),(.10,3.05,1.94),bamboo)
for s in [-1,1]:
 cube('Cabin / sill',(-3.82,s*1.56,1.15),(1.95,.12,.96),wood,.025)
 for x in [-4.65,-3.82,-3.0]:
  cube('Cabin / inset panel',(x,s*1.63,1.18),(.66,.04,.59),bamboo,.02)
  for z in [.84,1.51]:cube('Cabin / panel molding',(x,s*1.66,z),(.73,.045,.04),woodlight,.008)
 for x in [-4.76,-2.86]:cube('Cabin / corner post',(x,s*1.56,1.89),(.13,.13,2.37),timber,.025)
 cube('Window / smoky glass',(-3.82,s*1.565,2.2),(1.70,.026,1.02),glass,.01)
 for x in [-4.71,-3.82,-2.94]:cube('Window / mullion',(x,s*1.60,2.2),(.045,.09,1.14),woodlight,.008)
 for z in [1.66,2.73]:cube('Window / lintel',(-3.82,s*1.61,z),(1.87,.13,.075),wood,.014)
 for x in [-4.62,-3.02]:
  for k in range(9):
   o=cube('Window / louvre shutter',(x,s*1.65,1.82+k*.1),(.24,.055,.07),woodlight,.007);o.rotation_euler.x=s*.24
 for k in range(7):ell('Window / cotton curtain',(-4.45+k*.058,s*1.48,2.15),(.038,.04,.5),ivory,12,8)
 # Lower balustrade, turned spindles, hand carved brackets.
 for z in [.86,1.30]:cube('Balustrade / rail',(.65,s*1.67,z),(6.9,.10,.08),wood,.02)
 for x in np.linspace(-2.65,4.0,27):
  link('Balustrade / spindle',(x,s*1.67,.9),(x,s*1.67,1.26),.018,woodlight)
  ell('Balustrade / turned bead',(x,s*1.67,1.07),(.035,.035,.06),timber,12,8)
 for x in [-2.75,-.5,1.8,4.08]:
  cyl('Pavilion / timber column',(x,s*1.68,1.93),.055,2.52,wood,20)
  for z,r,d in [(.85,.092,.17),(1.1,.071,.09),(2.87,.092,.18),(2.99,.13,.06)]:cyl('Pavilion / turned capital',(x,s*1.68,z),r,d,timber,20)
  for direction in [-1,1]:
   tube('Pavilion / curved knee brace',[(x+direction*(.45*(1-t)**2),s*1.68,2.64+.39*t) for t in np.linspace(0,1,13)],.032,woodlight)
  for z in [1.0,2.84]:
   for k in range(4):ring('Pavilion / coir lashing',(x,s*1.68,z+k*.017),.061,.009,coir,segments=16)

# Woven barrel canopy, softly tapered at each end, real interior ribs and lashings.
P=roof
def roofpoint(x,a,extra=0):
 taper=1-.10*(abs(x)/5.05)**6
 return (x,(1.99+extra)*cos(a)*taper,3.05+(1.20+extra)*sin(a)-.20*(abs(x)/5.05)**6)
vs=[];uv=[];fs=[];NX=64;NA=40
for i in range(NX+1):
 for j in range(NA+1):
  vs.append(roofpoint(-5.04+i*10.08/NX,j*pi/NA));uv.append((i/NX*3.4,j/NA*1.75))
for i in range(NX):
 for j in range(NA):a=i*(NA+1)+j;fs.append((a,a+1,a+NA+2,a+NA+1))
canopy=smooth(mesh('Canopy / woven palm mat layers',vs,fs,bamboo,uv));m=canopy.modifiers.new('Mat thickness','SOLIDIFY');m.thickness=.045
for x in np.linspace(-5.04,5.04,17):
 tube('Canopy / lapped mat binding',[roofpoint(x,a,.018) for a in np.linspace(0,pi,49)],.022,coir)
for x in [-5.06,-3.8,-2.55,-1.27,0,1.27,2.55,3.8,5.06]:
 tube('Canopy / split bamboo rib',[roofpoint(x,a,.045) for a in np.linspace(0,pi,49)],.045,timber)
 tube('Canopy / interior bamboo rib',[roofpoint(x,a,-.075) for a in np.linspace(0,pi,41)],.045,cane)
 for a in np.linspace(.1,pi-.1,11):
  px,py,pz=roofpoint(x,a,.05)
  tube('Canopy / crossed coir ties',[(px-.065,py-.02,pz),(px+.065,py+.02,pz+.014)],.011,coir,0)
for a in np.linspace(.09,pi-.09,37):tube('Canopy / fine bamboo battens',[roofpoint(x,a,.014) for x in np.linspace(-5.03,5.03,49)],.008,cane,0)
for s in [-1,1]:
 pts=[roofpoint(x,0 if s==1 else pi,.02) for x in np.linspace(-5.08,5.08,50)]
 tube('Canopy / rolled eave',pts,.075,timber)
 for x in np.linspace(-4.94,4.94,65):
  yy=roofpoint(x,0 if s==1 else pi)[1]
  cube('Canopy / scalloped fascia',(x,yy,2.96),(.105,.045,.17),cane,.025)
 # Festoon lamps: small sockets and bulbs, not oversized white spheres.
 cable=[]
 for x in np.linspace(-4.8,4.8,97):cable.append((x,s*1.93,2.91-.15*abs(sin((x+4.8)*pi/1.6))))
 tube('Lighting / festoon cable',cable,.009,black)
 for k,x in enumerate(np.linspace(-4.7,4.7,27)):
  z=2.91-.15*abs(sin((x+4.8)*pi/1.6))
  cyl('Lighting / brass socket',(x,s*1.93,z-.025),.026,.06,brass,12)
  ell('Lighting / tungsten globe',(x,s*1.93,z-.09),(.035,.035,.05),bulb,12,8)
# Three hanging hurricane lamps with metal cages.
for x in [-2.2,.1,2.4]:
 tube('Lantern / suspension',[(x,0,4.17),(x,0,2.78)],.012,brass)
 cyl('Lantern / cap',(x,0,2.75),.14,.08,brass,20,r2=.08)
 cyl('Lantern / luminous glass',(x,0,2.56),.085,.28,bulb,20)
 cyl('Lantern / base',(x,0,2.40),.13,.06,brass,20)
 for a in [0,pi/2,pi,pi*1.5]:link('Lantern / cage',(x+.11*cos(a),.11*sin(a),2.42),(x+.11*cos(a),.11*sin(a),2.72),.012,brass)
P=root

# Long handmade workshop table, chamfered edge, trestle base, stools and cane backs.
for j in range(5):
 o=cube('Workshop / tabletop board',(.10,-.46+j*.23,1.61),(5.65,.222,.10),wood,.014);grain_uv(o)
for x in [-2.25,2.45]:
 cube('Workshop / trestle foot',(x,0,.76),(.16,1.05,.12),timber,.03)
 cube('Workshop / trestle upright',(x,0,1.14),(.13,.16,.71),timber,.02)
 link('Workshop / diagonal trestle',(x,-.44,.8),(x,0,1.48),.045,woodlight)
 link('Workshop / diagonal trestle',(x,.44,.8),(x,0,1.48),.045,woodlight)
cube('Workshop / stretcher',(.1,0,.89),(4.8,.12,.11),timber,.02)

def laptop(k):
 ma=silver if k%2 else graphite
 cube('Laptop / machined base',(0,.57,1.694),(.57,.40,.035),ma,.014)
 cube('Laptop / recessed keyboard',(0,.65,1.715),(.51,.17,.006),black,.006)
 for row in range(4):
  for col in range(12):
   cube('Laptop / individual keycap',(-.228+col*.0415,.59+row*.039,1.722),(.033,.028,.007),keymat,.004)
   if row<3 and col%2==0:cube('Laptop / key legend',(-.228+col*.0415,.59+row*.039,1.727),(.009,.008,.001),ivory,.001)
 cube('Laptop / space bar',(0,.55,1.72),(.19,.027,.006),keymat,.004)
 cube('Laptop / inset trackpad',(0,.45,1.715),(.19,.10,.002),silver,.006)
 for sx in [-1,1]:
  cyl('Laptop / hinge',(sx*.20,.766,1.727),.018,.105,ma,16,(0,pi/2,0))
  for z in range(3):cube('Laptop / side port',(sx*.286,.5+z*.067,1.694),(.004,.032,.011),black,.002)
 # Display tilts eleven degrees away from the maker.
 display=empty('Laptop / hinged display',P);display.location=(0,.765,1.735);display.rotation_euler.x=-.16
 global_parent=P
 # Use a temporary parent so bezel, webcam, and image stay exactly coplanar.
 globals()['P']=display
 cube('Laptop / thin display shell',(0,0,.175),(.57,.022,.355),ma,.014)
 cube('Laptop / black glass bezel',(0,-.014,.175),(.545,.008,.329),black,.009)
 mesh('Laptop / screen image',[(-.257,-.019,.03),(.257,-.019,.03),(.257,-.019,.315),(-.257,-.019,.315)],[(0,1,2,3)],screenm[k%3],[(0,0),(1,0),(1,1),(0,1)])
 ell('Laptop / webcam',(0,-.021,.331),(.005,.002,.005),glass,12,8)
 cube('Laptop / camera indicator',(.017,-.021,.331),(.004,.001,.004),leafmat,.001)
 text('Laptop / tiny wordmark','HACKATHONI',(0,-.02,.015),.014,ivory)
 ring('Laptop / lid sticker',(0,.014,.18),.045,.008,teal,(pi/2,0,0),24)
 globals()['P']=global_parent

def maker(k,x,s):
 global P
 parent=empty('Maker %02d / editable person and workstation'%(k+1),root);parent.location=(x,s*1.02,0);parent.rotation_euler.z=pi if s==1 else 0;P=parent
 skin=skinm[k];cloth=shirts[k];hair=hairm[k%2]
 # Chair frame, woven seat, rattan back, padded seat and tension rails.
 for xx in [-.24,.24]:
  for y in [-.20,.20]:link('Chair / splayed leg',(xx*1.15,y*1.15,.69),(xx,y,1.09),.033,wood)
 cube('Chair / seat frame',(0,0,1.09),(.58,.53,.08),wood,.045)
 cube('Chair / linen cushion',(0,.005,1.145),(.53,.48,.09),ivory if k%2 else teal,.06)
 tube('Chair / curved rattan back',[(-.27,-.23,1.15),(-.30,-.26,1.60),(-.24,-.28,1.78),(0,-.29,1.84),(.24,-.28,1.78),(.30,-.26,1.6),(.27,-.23,1.15)],.034,cane)
 for j in range(-4,5):tube('Chair / woven back strand',[(j*.056,-.27,1.25),(j*.056,-.29,1.73-.18*(abs(j)/4)**2)],.009,coir,0)
 for z in np.linspace(1.27,1.69,8):tube('Chair / horizontal cane', [(-.25,-.28,z),(.25,-.28,z)],.008,cane,0)
 # Trousers taper at knee and ankle, seated hips and individually articulated legs.
 ell('Maker / trouser hips',(0,.02,1.27),(.245,.20,.15),denim)
 for side in [-1,1]:
  a=(side*.135,.04,1.27);b=(side*.18,.40,1.19);c=(side*.19,.44,.79)
  link('Maker / trouser thigh',a,b,.12,denim,.103,16);ell('Maker / knee',b,(.106,.115,.11),denim)
  link('Maker / trouser calf',b,c,.10,denim,.064,16)
  tube('Maker / trouser seam',[(side*.238,.06,1.28),(side*.27,.38,1.17),(side*.25,.44,.84)],.004,woodlight,0)
  cyl('Maker / cuff',(side*.19,.44,.84),.070,.065,denim,16)
  ell('Maker / sneaker upper',(side*.19,.51,.75),(.095,.17,.077),ivory if k%2==0 else black)
  cube('Maker / sneaker sole',(side*.19,.53,.700),(.194,.34,.035),ivory,.024)
  for j in range(4):tube('Maker / sneaker lace',[(side*.19-.05,.47+j*.029,.802-j*.004),(side*.19+.05,.48+j*.029,.802-j*.004)],.004,ivory,0)
 # A tailored torso loft, rather than an egg for a body.
 vv=[];ff=[]
 for z,rx,ry,cy in [(1.30,.205,.155,0),(1.37,.23,.16,.01),(1.62,.245,.155,.035),(1.82,.27,.14,.055),(1.92,.19,.12,.065),(1.96,.08,.075,.065)]:
  for j in range(24):a=j*2*pi/24;vv.append((rx*cos(a),cy+ry*sin(a),z))
 for j in range(5):
  for q in range(24):a=j*24+q;b=j*24+(q+1)%24;ff.append((a,b,b+24,a+24))
 smooth(mesh('Maker / shaped linen shirt',vv,ff,cloth))
 tube('Maker / shirt hem',[(-.19,.13,1.33),(0,.17,1.32),(.19,.13,1.33)],.007,cloth)
 if k in [0,2,4]:
  tube('Maker / button placket',[(0,.19,1.37),(0,.20,1.76),(0,.145,1.90)],.008,woodlight,0)
  for z in [1.42,1.56,1.70,1.83]:ell('Maker / shirt button',(0,.204,z),(.009,.004,.009),ivory,12,8)
  cube('Maker / chest pocket',(-.13,.187,1.73),(.12,.013,.12),cloth,.012)
  for sx in [-1,1]:mesh('Maker / folded collar',[(sx*.02,.15,1.94),(sx*.11,.13,1.92),(sx*.065,.195,1.85)],[(0,1,2)],cloth)
 else:
  tube('Maker / neckline',[(.083*cos(a),.066+.077*sin(a),1.954) for a in np.linspace(0,2*pi,25)],.013,cloth)
  if k==3:text('Maker / printed tee','BUILD',(0,.204,1.73),.065,ivory,(pi/2,0,pi))
 # Relaxed shoulders, bent elbows, forearms, wrists, palm and separate fingers.
 for side in [-1,1]:
  shoulder=(side*.25,.055,1.82);elbow=(side*(.31 if k%2 else .34),.27,1.57);wrist=(side*.18,.49,1.71)
  mid=Vector(shoulder).lerp(Vector(elbow),.62)
  link('Maker / shirt sleeve',shoulder,mid,.112,cloth,.09,16);ell('Maker / sleeve shoulder',shoulder,(.11,.115,.10),cloth)
  link('Maker / upper arm',mid,elbow,.078,skin,.068,16);ell('Maker / elbow',elbow,(.069,.067,.07),skin)
  link('Maker / forearm',elbow,wrist,.073,skin,.047,16)
  hand=(side*.17,.535,1.715);ell('Maker / hand',hand,(.062,.067,.025),skin)
  for finger in range(4):
   fx=side*.17+(finger-1.5)*.027;length=[.058,.077,.072,.052][finger]
   tube('Maker / finger',[(fx,.565,1.716),(fx,.59,1.712),(fx,.59+length*.45,1.704)],.010,skin)
   ell('Maker / fingernail',(fx,.59+length*.35,1.715),(.006,.009,.0018),skin,8,6)
  tube('Maker / thumb',[(side*.13,.53,1.72),(side*.10,.56,1.72),(side*.105,.59,1.713)],.014,skin)
  if side==-1 and k%2==0:
   ring('Maker / watch strap',wrist,.049,.010,black,(pi/2,0,0),20);cube('Maker / watch face',(wrist[0],wrist[1],wrist[2]+.046),(.059,.043,.012),graphite,.009)
 # Neck, shaped head, jaw, cheek planes and small facial features.
 cyl('Maker / neck',(0,.065,1.99),.073,.16,skin,20)
 head=empty('Maker / head',parent);head.location=(0,.075,2.18);head.rotation_euler.x=.10+(k%3)*.025;head.rotation_euler.z=[-.12,.08,.03,-.08,.14,-.06][k];P=head
 ell('Face / skull',(0,0,.04),(.155,.142,.20),skin,28,18)
 ell('Face / lower face',(0,.018,-.075),(.12,.116,.115),skin,24,14)
 for s2 in [-1,1]:
  ell('Face / cheek',(s2*.084,.113,-.02),(.058,.034,.061),skin)
  ell('Face / ear',(s2*.153,-.002,.005),(.032,.029,.062),skin,16,10)
  ell('Face / ear fold',(s2*.166,.014,.007),(.008,.01,.036),skin,12,8)
  ell('Face / eye',(s2*.062,.137,.043),(.030,.009,.013),ivory,16,10)
  ell('Face / iris',(s2*.061,.145,.042),(.012,.004,.012),hair,12,8)
  ell('Face / pupil',(s2*.061,.148,.042),(.005,.002,.008),black,12,8)
  tube('Face / upper eyelid',[(s2*.062-.028,.144,.045),(s2*.062,.15,.054),(s2*.062+.028,.144,.045)],.004,skin)
  tube('Face / eyebrow',[(s2*.061-.028,.13,.082),(s2*.061,.142,.088),(s2*.061+.028,.128,.08)],.008,hair)
 ell('Face / nose bridge',(0,.137,.018),(.022,.025,.051),skin)
 ell('Face / nose tip',(0,.166,-.017),(.031,.028,.022),skin)
 tube('Face / lips',[(-.042,.121,-.081),(0,.135,-.087),(.042,.121,-.081)],.005,skin)
 tube('Face / mouth',[(-.035,.124,-.085),(0,.137,-.090),(.035,.124,-.085)],.0028,timber,0)
 # Hair cap and combed locks, with individual variation in silhouette.
 vv=[];ff=[]
 for j in range(10):
  for q in range(32):
   a=q*2*pi/32;edge=1.25+.36*max(0,-sin(a));theta=.015+(edge-.015)*j/9
   vv.append((.161*sin(theta)*cos(a),.149*sin(theta)*sin(a)-.007,.052+.207*cos(theta)))
 for j in range(9):
  for q in range(32):a=j*32+q;b=j*32+(q+1)%32;ff.append((a,b,b+32,a+32))
 smooth(mesh('Hair / sculpted cap',vv,ff,hair))
 for q in range(12):
  a=q*2*pi/12
  tube('Hair / swept lock',[(.163*sin(t)*cos(a+t*.19),.15*sin(t)*sin(a+t*.19)-.007,.052+.21*cos(t)) for t in np.linspace(.1,1.28,11)],.009,hair)
 if k in [1,3,5]:
  ell('Hair / tied bun',(0,-.155,.10),(.09,.09,.09),hair)
  ring('Hair / tie',(0,-.16,.10),.074,.009,rust,(pi/2,0,0),20)
 if k in [0,4]:
  for s2 in [-1,1]:
   ring('Face / brass spectacles',(s2*.063,.154,.044),.037,.0045,brass,(pi/2,0,0),24)
   tube('Face / glasses temple',[(s2*.098,.15,.05),(s2*.15,.015,.055),(s2*.145,-.02,.04)],.004,brass)
  tube('Face / glasses bridge',[(-.026,.154,.047),(0,.165,.055),(.026,.154,.047)],.004,brass)
 if k==2:
  for s2 in [-1,1]:tube('Face / beard line',[(s2*.10,.095,-.048),(s2*.08,.11,-.11),(s2*.035,.12,-.151),(0,.118,-.16)],.016,hair)
 if k==5:
  for s2 in [-1,1]:ring('Face / hoop earring',(s2*.17,.005,-.052),.023,.004,brass,(pi/2,0,0),20)
 P=parent;laptop(k)
 # Ceramic chai with handle, coasters, handwritten notebooks and charging cable.
 cyl('Desk / cork coaster',(.41,.58,1.677),.09,.009,coir,20)
 cyl('Desk / ceramic chai cup',(.41,.58,1.738),.057,.113,rust if k%2 else ivory,24,r2=.067)
 cyl('Desk / tea',(.41,.58,1.797),.057,.004,tea,24)
 ring('Desk / cup rim',(.41,.58,1.798),.062,.006,ivory,segments=24)
 ring('Desk / cup handle',(.485,.58,1.748),.036,.009,rust if k%2 else ivory,(pi/2,0,0),20)
 cube('Desk / notebook cover',(-.41,.58,1.68),(.23,.30,.016),teal,.005)
 cube('Desk / notebook pages',(-.41,.58,1.696),(.21,.28,.015),paper,.003)
 for j in range(5):tube('Desk / pencil notes',[(-.49,.50+j*.027,1.705),(-.35+random.random()*.035,.50+j*.027,1.705)],.0017,timber,0)
 link('Desk / pencil',(-.53,.48,1.72),(-.49,.72,1.72),.006,cane,vertices=8)
 tube('Desk / USB cable',[(.287,.5,1.694),(.34,.49,1.69),(.34,.35,1.66),(.4,.31,1.4),(.34,.3,1.0)],.006,black)
 cube('Desk / USB plug',(.292,.5,1.694),(.04,.025,.016),silver,.003)
 P=root

print('Modeling six people, hands, faces, clothes and complete workstations',flush=True)
for k,(x,s) in enumerate([(-1.8,-1),(-1.8,1),(.10,-1),(.10,1),(2,-1),(2,1)]):
 maker(k,x,s);print('Maker',k+1,'complete',flush=True)

# Bow lounge and helm, brass wheel, rope fenders, boarding steps and useful clutter.
for s in [-1,1]:
 cube('Bow / bench frame',(4.4,s*.78,.99),(1.5,.62,.55),wood,.05)
 cube('Bow / cushion',(4.4,s*.78,1.30),(1.43,.57,.12),ivory,.06)
 for x in [4.0,4.7]:
  cushion=cube('Bow / accent pillow',(x,s*.90,1.49),(.46,.17,.38),rust if x<4.3 else teal,.09);cushion.rotation_euler.x=s*.15
  tube('Bow / pillow piping',[(x-.19,s*.805,1.34),(x-.19,s*.805,1.64),(x+.19,s*.805,1.64),(x+.19,s*.805,1.34),(x-.19,s*.805,1.34)],.005,ivory,0)
cube('Helm / console',(5.27,0,1.26),(.45,.49,1.06),wood,.045)
cube('Helm / instrument panel',(5.03,0,1.63),(.025,.40,.26),graphite,.01)
for y in [-.10,.10]:cyl('Helm / round gauge',(5.009,y,1.67),.055,.012,ivory,20,(0,pi/2,0))
ring('Helm / wheel',(4.95,0,1.52),.25,.026,wood,(0,pi/2,0),40)
for a in np.linspace(0,2*pi,8,endpoint=False):
 link('Helm / spoke',(4.95,0,1.52),(4.95,.31*cos(a),1.52+.31*sin(a)),.014,brass)
 ell('Helm / spoke grip',(4.95,.31*cos(a),1.52+.31*sin(a)),(.027,.035,.035),woodlight,12,8)
cyl('Helm / brass hub',(4.93,0,1.52),.055,.09,brass,20,(0,pi/2,0))
# Brass cleats, tightly twisted ropes and rubber fenders hung on coir.
for x in [-5.5,5.6]:
 for s in [-1,1]:
  y=s*.75;cube('Mooring / cleat base',(x,y,.83),(.23,.13,.035),brass,.015)
  link('Mooring / cleat horn',(x-.16,y,.91),(x+.16,y,.91),.026,brass)
  for k in range(4):ring('Mooring / rope coil',(x-.23,y,.85+k*.018),.17+k*.007,.012,coir,segments=28)
for s in [-1,1]:
 for x in [-3.15,2.9]:
  tube('Fender / hanging rope',[(x,s*1.70,1.32),(x,s*1.93,.65),(x,s*1.98,.25)],.014,coir)
  ring('Fender / rubber tyre',(x,s*1.98,.38),.245,.061,black,(pi/2,0,0),32)
  for a in np.linspace(0,2*pi,24,endpoint=False):
   tube('Fender / tyre tread',[(x+.252*cos(a),s*2.035,.38+.252*sin(a)),(x+.27*cos(a+.03),s*2.02,.38+.27*sin(a+.03))],.007,graphite,0)
# Safety rings have curved colored bands, a perimeter rope and attachment knots.
for s in [-1,1]:
 for x in [-2.5,3.6]:
  ring('Safety / lifebuoy',(x,s*1.75,1.22),.23,.066,ivory,(pi/2,0,0),40)
  for a in [0,pi/2,pi,pi*1.5]:
   tube('Safety / lifebuoy red band',[(x+.23*cos(a+t),s*1.75,1.22+.23*sin(a+t)) for t in np.linspace(-.15,.15,6)],.068,rust)
  tube('Safety / ring perimeter rope',[(x+.32*cos(a),s*1.75,1.22+.32*sin(a)) for a in np.linspace(0,2*pi,41)],.01,coir)
# Lettered enamel nameplate, fasteners and tiny registry plaque.
cube('Identity / enamel nameplate',(.4,-1.78,1.13),(2.95,.055,.32),ivory,.026)
text('Identity / name','H A C K A T H O N I',(.4,-1.813,1.14),.174,teal)
for x in [-1.0,1.8]:ell('Identity / brass screw',(x,-1.82,1.13),(.019,.005,.019),brass,12,8)
cube('Identity / builder plaque',(-4.42,-1.71,1.07),(.38,.025,.20),brass,.007)
text('Identity / number','TH-01',(-4.42,-1.73,1.07),.055,timber)
# The things people bring: canvas rucksack, thermos, bottles, headphone case.
for x,s in [(-2.85,-1),(2.95,1)]:
 cube('Supplies / canvas backpack',(x,s*1.1,.95),(.42,.29,.51),rust,.09)
 cube('Supplies / front pocket',(x,s*1.27,.89),(.29,.07,.23),rust,.04)
 tube('Supplies / zipper',[(x-.15,s*1.31,1.0),(x+.15,s*1.31,1.0)],.006,brass)
 for sx in [-1,1]:tube('Supplies / bag strap',[(x+sx*.14,s*.99,1.15),(x+sx*.19,s*.89,.85),(x+sx*.14,s*.99,.74)],.02,teal)
 tube('Supplies / carry handle',[(x-.07,s*1.10,1.20),(x-.06,s*1.10,1.27),(x+.06,s*1.10,1.27),(x+.07,s*1.10,1.20)],.016,teal)
cube('Power / extension strip',(.2,.05,.88),(1.0,.17,.07),ivory,.02)
for x in [-.1,.1,.3,.5]:
 for y in [.015,.085]:cyl('Power / socket',(x,y,.918),.013,.003,black,10)
tube('Power / mains lead',[(.71,.05,.90),(1,.15,.71),(2.5,.15,.7),(3.0,.4,.7),(3.3,1.5,.7)],.013,black)
cyl('Galley / flask',(-3.05,.8,1.0),.095,.53,silver,24)
cyl('Galley / flask lid',(-3.05,.8,1.285),.098,.05,teal,24)
# Little potted palms and leaf veins on the rear deck.
for x,y in [(-5.12,-.62),(-5.12,.62)]:
 cyl('Plant / terracotta pot',(x,y,.95),.18,.35,rust,24,r2=.22)
 cyl('Plant / soil',(x,y,1.13),.205,.018,timber,24)
 for j in range(9):
  a=j*2*pi/9;z=1.48+random.random()*.22;end=(x+.28*cos(a),y+.28*sin(a),z)
  tube('Plant / stem',[(x,y,1.12),(x+.10*cos(a),y+.1*sin(a),z),end],.009,leafmat)
  leaf=ell('Plant / leaf',end,(.14,.045,.014),leafmat,12,8);leaf.rotation_euler.z=a
# Fine bunting across the bow has thickness, folds and stitched hems.
tube('Flags / bunting line',[(3.8,-1.65,2.89),(4.4,0,3.18),(3.8,1.65,2.89)],.009,coir)
for j in range(7):
 y=-1.4+j*.46;x=4.4-.6*abs(y)/1.65;z=3.18-.29*abs(y)/1.65
 mesh('Flags / cloth pennant',[(x,y-.12,z),(x+.025,y,z-.035),(x,y+.12,z),(x+.04,y,z-.29)],[(0,1,3),(1,2,3)],[teal,ivory,rust][j%3])

print('Saving editable model and optimized GLB',flush=True)
# Convert only geometry; preserve named editable objects and groups in the .blend.
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
 if o.type in {'CURVE','FONT','MESH'}:o.select_set(True)
bpy.context.view_layer.objects.active=next(o for o in bpy.data.objects if o.type=='MESH')
bpy.ops.object.convert(target='MESH')
for o in bpy.data.objects:
 if o.type=='MESH' and o.data.materials and o.data.materials[0]==wood:grain_uv(o)
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'houseboat.blend'))
# Merge static geometry by material, while the entire roof stays independently liftable.
groups={}
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
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ASSETS/'houseboat.glb'),export_format='GLB',use_selection=True,export_apply=True,export_lights=False,export_cameras=False,export_yup=True,export_image_format='AUTO')
triangles=sum(len(p.vertices)-2 for o in bpy.data.objects if o.type=='MESH' for p in o.data.polygons)
print('COMPLETE: meshes',sum(o.type=='MESH' for o in bpy.data.objects),'triangles',triangles,'bytes',(ASSETS/'houseboat.glb').stat().st_size,flush=True)
