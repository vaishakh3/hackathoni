"""Six original continuous-surface portraits; run after shape_kettuvallam.py.
All geometry is authored here, at the scale of the existing seated people.
"""
from pathlib import Path
import bpy, math, random
import numpy as np
from math import sin, cos, pi, exp, sqrt
HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'houseboat.blend'))
random.seed(104)

def material(name,color,rough=.7,metal=0):
 m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 return m
skincolors=[(.19,.085,.043),(.27,.13,.07),(.13,.055,.025),(.37,.21,.13),(.22,.10,.049),(.16,.069,.032)]
skins=[material('Skin / '+str(i),c,.66) for i,c in enumerate(skincolors)]
hair=material('Portrait / dark hair',(.006,.004,.003),.82)
hairlight=material('Portrait / hair sheen',(.010,.006,.004),.8)
eye=material('Portrait / eye ivory',(.46,.44,.37),.32)
iris=material('Portrait / brown iris',(.032,.016,.008),.37)
pupil=material('Portrait / pupil',(.004,.005,.004),.29)
crease=material('Portrait / warm shadow',(.045,.018,.011),.81)
brass=bpy.data.materials['09 / aged brass']
profile=np.array([[-.225,.013,.026,.027],[-.21,.055,.062,.022],[-.185,.083,.08,.018],[-.145,.107,.098,.012],[-.09,.129,.119,.005],[-.02,.143,.135,0],[.06,.145,.139,-.004],[.12,.14,.129,-.009],[.18,.12,.108,-.012],[.205,.097,.088,-.012],[.225,.071,.064,-.012],[.238,.041,.038,-.012],[.246,.001,.002,-.012]])
P=None
created=[]
def mesh(name,v,f,ma,uv=None):
 me=bpy.data.meshes.new(name);me.from_pydata(v,[],f);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.parent=P;o.data.materials.append(ma)
 for poly in me.polygons:poly.use_smooth=True
 if uv:
  layer=me.uv_layers.new(name='UVMap')
  for poly in me.polygons:
   for li in poly.loop_indices:layer.data[li].uv=uv[me.loops[li].vertex_index]
 created.append(o);return o

def tube(name,points,r,ma):
 # Direct mesh strips keep export deterministic without hundreds of curve conversions.
 from mathutils import Vector
 v=[];f=[];sides=5
 for j,p in enumerate(points):
  p=Vector(p);a=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(0,j-1)])
  a.normalize();u=a.cross(Vector((0,1,0)))
  if u.length<.001:u=a.cross(Vector((1,0,0)))
  u.normalize();w=a.cross(u)
  rad=r*(.65+.35*sin(pi*j/max(1,len(points)-1)))
  for k in range(sides):v.append(tuple(p+rad*(u*cos(2*pi*k/sides)+w*sin(2*pi*k/sides))))
  if j:
   for k in range(sides):q=j*sides+k;f.append((q,j*sides+(k+1)%sides,(j-1)*sides+(k+1)%sides,q-sides))
 return mesh(name,v,[tuple(reversed(a)) for a in f],ma)

def ell(name,loc,scale,ma):
 v=[];f=[];N=24;R=16
 for j in range(R+1):
  t=.001+(pi-.002)*j/R
  for i in range(N):
   a=2*pi*i/N;v.append((loc[0]+scale[0]*sin(t)*cos(a),loc[1]+scale[1]*sin(t)*sin(a),loc[2]+scale[2]*cos(t)))
 for j in range(R):
  for i in range(N):a=j*N+i;b=j*N+(i+1)%N;f.append((a,b,b+N,a+N))
 return mesh(name,v,[tuple(reversed(a)) for a in f],ma)

# Shape-preserving cubic interpolation gives continuous facial curvature.
_steps=np.diff(profile[:,0]);_slopes=np.diff(profile[:,1:],axis=0)/_steps[:,None];_tangents=np.zeros_like(profile[:,1:]);_tangents[0]=_slopes[0];_tangents[-1]=_slopes[-1]
for j in range(1,len(profile)-1):
 for d in range(3):
  a,b=_slopes[j-1,d],_slopes[j,d]
  if a*b>0:
   w1=2*_steps[j]+_steps[j-1];w2=_steps[j]+2*_steps[j-1];_tangents[j,d]=(w1+w2)/(w1/a+w2/b)
def dimensions(z):
 j=int(np.clip(np.searchsorted(profile[:,0],z)-1,0,len(profile)-2));h=_steps[j];t=np.clip((z-profile[j,0])/h,0,1)
 return ( (2*t**3-3*t*t+1)*profile[j,1:]+(t**3-2*t*t+t)*h*_tangents[j]+(-2*t**3+3*t*t)*profile[j+1,1:]+(t**3-t*t)*h*_tangents[j+1] ).tolist()
def g(x,z,cx,cz,sx,sz):return exp(-.5*((x-cx)/sx)**2-.5*((z-cz)/sz)**2)
def features(x,z):
 out=.012*g(x,z,0,-.15,.045,.034)
 out+=.018*g(x,z,0,.015,.016,.065)+.042*g(x,z,0,-.041,.020,.021)
 for s in [-1,1]:
  out-=.013*g(x,z,s*.057,.030,.030,.018)
  out+=.009*g(x,z,s*.055,.069,.037,.015)
  out+=.008*g(x,z,s*.079,-.034,.042,.028)
  out+=.011*g(x,z,s*.025,-.052,.011,.012)
 out+=.006*g(x,z,0,-.104,.037,.020)
 return out

def surface(x,z):
 w,d,c=dimensions(z);factor=max(.001,1-(x/w)**2);return c+d*sqrt(factor)+features(x,z)*factor**3

def hairline(a,k):
 front=max(0,cos(a));return -.028+.164*front**.8+(.006*sin(a*3+k) if front>.3 else .004*sin(a*4))
def hairpoint(t,a,k,extra=0):
 z=.244-(.244-hairline(a,k))*t;w,d,c=dimensions(z)
 return ((w+.007+extra)*sin(a),(d+.008+extra)*cos(a)+c,z+.005+extra)
heads=sorted([o for o in bpy.data.objects if o.name.startswith('Maker / head')],key=lambda o:o.parent.name)
for k,head in enumerate(heads):
 for o in list(head.children_recursive):bpy.data.objects.remove(o,do_unlink=True)
 P=head;head.rotation_euler.x=-.045-(k%3)*.018;skin=skins[k]
 lip=material('Portrait / natural lip '+str(k),tuple(c*f for c,f in zip(skincolors[k],(.84,.61,.67))),.62)
 inner=material('Portrait / ear shade '+str(k),tuple(c*.65 for c in skincolors[k]),.78)
 # A single sculpted skin surface integrates the chin, cheeks, sockets and nose.
 v=[];f=[];uv=[];N=96;R=76
 for j in range(R+1):
  z=-.224+.468*j/R;w,d,c=dimensions(z)
  for i in range(N):
   a=i*2*pi/N;x=w*sin(a);front=max(0,cos(a))
   v.append((x,c+d*cos(a)+features(x,z)*front**6,z));uv.append((i/N,j/R))
 for j in range(R):
  for i in range(N):a=j*N+i;b=j*N+(i+1)%N;f.append((a,b,b+N,a+N))
 mesh('Portrait / continuous sculpted head',v,[tuple(reversed(a)) for a in f],skin,uv)
 for s in [-1,1]:
  cx=s*.057;cz=.032
  def eyepoint(u,vv=0):
   x=cx+.027*u;arc=max(0,1-u*u)**.65;z=cz+arc*(.009 if vv>=0 else .0065)*vv
   return (x,surface(x,z)+.003+arc*.003*(1-abs(vv)*.3),z)
  ev=[];ef=[];NU=24;NV=8
  for j in range(NV+1):
   for i in range(NU+1):ev.append(eyepoint(-1+2*i/NU,-1+2*j/NV))
  for j in range(NV):
   for i in range(NU):a=j*(NU+1)+i;ef.append((a,a+1,a+NU+2,a+NU+1))
  mesh('Portrait / almond eye',ev,[tuple(reversed(a)) for a in ef],eye)
  irisx=cx-s*.001;irisz=cz-.001
  ell('Portrait / iris',(irisx,surface(irisx,irisz)+.008,irisz),(.008,.0018,.007),iris)
  ell('Portrait / pupil',(irisx,surface(irisx,irisz)+.010,irisz),(.0039,.0008,.0045),pupil)
  for side in [-1,1]:tube('Portrait / eyelid', [eyepoint(float(u),side) for u in np.linspace(-1,1,25)],.0018 if side==1 else .0012,skin)
  tube('Portrait / upper lash',[tuple(np.array(eyepoint(float(u),1))+np.array([0,.001,0])) for u in np.linspace(-.96,.96,24)],.0007,hair)
  for h in range(23):
   x=cx-.029+h*.0025;z=.073+.006*sin(pi*h/22)-.006*(h/22)
   tube('Portrait / individual brow hair',[(x,surface(x,z)+.0015,z),(x+s*.002,surface(x+s*.002,z+.004)+.002,z+.004)],.00045,hair)
  # Anatomical ear with an outer rim, concha and a small tragus.
  ell('Portrait / ear',(s*.147,-.008,-.004),(.027,.023,.053),skin)
  ell('Portrait / ear concha',(s*.160,.010,-.009),(.010,.008,.025),inner)
  tube('Portrait / ear helix',[(s*(.151+.020*sin(a)),.012+.005*sin(a),.003+.041*cos(a)) for a in np.linspace(-.4,pi*1.25,26)],.0025,skin)
  tube('Portrait / ear antihelix',[(s*.160,.018,-.024),(s*.162,.021,.002),(s*.157,.018,.022)],.0028,skin)
  ell('Portrait / tragus',(s*.145,.018,-.005),(.008,.005,.012),skin)
  # Nostril apertures are small and flattened, with the nose part of the head mesh.
  x=s*.018;z=-.059
  ell('Portrait / nostril',(x,surface(x,z)+.001,z),(.006,.0015,.0028),inner)
 # Closed lips with a restrained cupid's bow and a fine seam.
 for top in [True,False]:
  vv=[];ff=[]
  for i in range(41):
   u=-1+2*i/40;x=.037*u;arc=max(0,1-u*u)**.6;seam=-.107+.0015*cos(u*pi)
   extent=(.0045+.0025*exp(-((abs(u)-.30)/.22)**2)) if top else -.0065
   for j in range(5):
    t=j/4;z=seam+extent*arc*t;vv.append((x,surface(x,z)+.001+sin(t*pi)*.0028*arc,z))
  for i in range(40):
   for j in range(4):a=i*5+j;ff.append((a,a+5,a+6,a+1))
  mesh('Portrait / '+('upper lip' if top else 'lower lip'),vv,[tuple(reversed(a)) for a in ff] if top else ff,lip)
 tube('Portrait / mouth seam',[(.035*u,surface(.035*u,-.107+.0015*cos(u*pi))+.002,-.107+.0015*cos(u*pi)) for u in np.linspace(-1,1,30)],.00065,crease)
 # Scalp-shaped hair, fine combed fibers and individually varied silhouettes.
 vv=[];ff=[];N=96;R=28
 for j in range(R+1):
  for i in range(N):vv.append(hairpoint(.004+.996*j/R,i*2*pi/N,k))
 for j in range(R):
  for i in range(N):a=j*N+i;b=j*N+(i+1)%N;ff.append((a,b,b+N,a+N))
 vv.append((0,-.012,.251));
 for q in range(N):ff.append((len(vv)-1,q,(q+1)%N))
 mesh('Portrait / shaped hair foundation',vv,ff,hair)
 for i in range(200):
  a=i*2*pi/200
  pts=[]
  for t in np.linspace(.10+random.random()*.05,1,18):
   angle=a+.23*(1-t)+.02*sin(t*8+a)
   p=list(hairpoint(float(t),angle,k,.002));p[2]+=.002*sin(t*20+a) if k==2 else 0;pts.append(p)
  tube('Portrait / fine swept hair',pts,.0004+random.random()*.0003,hairlight if i%5==0 else hair)
 if k in [1,3,5]:
  ell('Portrait / low tied hair',(0,-.157,.058),(.061,.058,.062),hair)
  for j in range(28):
   a=j*2*pi/28
   tube('Portrait / tied hair strand',[(.062*sin(t)*cos(a),-.157+.059*cos(t),.058+.063*sin(t)*sin(a)) for t in np.linspace(.05,pi-.05,18)],.0012,hairlight if j%5==0 else hair)
  tube('Portrait / hair tie',[(.043*cos(a),-.185,.058+.044*sin(a)) for a in np.linspace(0,2*pi,40)],.0025,brass)
 if k==2:
  for j in range(130):
   x=random.uniform(-.096,.096);z=random.uniform(-.18,-.068)
   if abs(x)<.045 and z>-.13:continue
   w,_,_=dimensions(z)
   if abs(x)>w*.93:continue
   y=surface(x,z)+.001
   tube('Portrait / fine beard stubble',[(x,y,z),(x*.998,y+.001,z-.0025)],.00065,hair)
 if k in [0,4]:
  for s in [-1,1]:
   tube('Portrait / fine spectacles',[(s*.058+.034*cos(a),.149+.004*sin(a),.031+.024*sin(a)) for a in np.linspace(0,2*pi,49)],.0022,brass)
   tube('Portrait / glasses temple',[(s*.092,.15,.036),(s*.148,.016,.042),(s*.150,-.02,.025)],.0018,brass)
  tube('Portrait / glasses bridge',[(-.024,.153,.036),(0,.168,.041),(.024,.153,.036)],.002,brass)
 if k==5:
  for s in [-1,1]:tube('Portrait / small hoop earring',[(s*.16+.014*cos(a),.005,-.056+.018*sin(a)) for a in np.linspace(0,2*pi,32)],.0024,brass)
 print('Refined portrait',k+1,flush=True)
# Return the editable scene to a clean full-boat view.
for o in bpy.data.objects:
 if o.type=='MESH':o.hide_render=False
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'houseboat.blend'))
print('PORTRAITS_COMPLETE',len(created),flush=True)
