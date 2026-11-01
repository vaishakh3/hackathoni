"""Fit six distinct MakeHuman CC0 portraits to the seated workshop figures.

Keeps authored clothing, hands and poses. Uses hm08 facial topology, fitted
hair cards, textured eyes and diffuse skin maps from the CC0 system assets.
Source assets are stored beside this script in character-source/.
"""
from pathlib import Path
import bpy, numpy as np, gzip, math
HERE=Path(__file__).resolve().parent
SOURCE=HERE/'character-source'
bpy.ops.wm.open_mainfile(filepath=str(HERE/'houseboat.blend'))

def obj(path):
    verts=[];uv=[];faces=[];faceuv=[];groups={};group=''
    for line in path.read_text().splitlines():
        p=line.split()
        if not p:continue
        if p[0]=='v':verts.append(list(map(float,p[1:4])))
        elif p[0]=='vt':uv.append(tuple(map(float,p[1:3])))
        elif p[0]=='g':group=p[1]
        elif p[0]=='f':
            inds=[int(x.split('/')[0])-1 for x in p[1:]]
            faces.append(inds);faceuv.append([int(x.split('/')[1])-1 for x in p[1:]])
            groups.setdefault(group,[]).append(len(faces)-1)
    return np.array(verts),uv,faces,faceuv,groups

base,baseuv,basefaces,basefaceuv,groups=obj(SOURCE/'base.obj')
bodyfaces=groups['body']
headfaces=[i for i in bodyfaces if all(base[v,1]>5.87 and abs(base[v,0])<1.4 for v in basefaces[i])]
headverts=sorted(set(v for i in headfaces for v in basefaces[i]))
headindex={old:new for new,old in enumerate(headverts)}

def material(name,file,roughness=.65,alpha=False):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True
    ns=m.node_tree.nodes;lk=m.node_tree.links;bs=ns.get('Principled BSDF')
    for n in list(ns):
        if n.type=='TEX_IMAGE':ns.remove(n)
    im=bpy.data.images.load(str(SOURCE/file),check_existing=True);im.pack()
    t=ns.new('ShaderNodeTexImage');t.image=im;lk.new(t.outputs['Color'],bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value=roughness;bs.inputs['Specular IOR Level'].default_value=.24
    if alpha:
        lk.new(t.outputs['Alpha'],bs.inputs['Alpha'])
        m.surface_render_method='DITHERED';m.use_backface_culling=False
    return m

skins=[material('Cinematic portrait / skin '+str(i),'skin-'+str(i%2)+'.jpg') for i in range(6)]
eyes=material('Cinematic portrait / brown eyes','brown_eye.png',.3)
hairmats={name:material('Cinematic portrait / '+name,name+'/'+name+'_diffuse.png',.83,True) for name in ['short01','short03','bob01']}

def morph(v,name,weight):
    path=SOURCE/'targets'/(name+'.target.gz')
    if not path.exists():return
    for line in gzip.open(path,'rt'):
        p=line.split()
        if len(p)==4 and p[0].isdigit():v[int(p[0])]+=np.array(list(map(float,p[1:])))*weight

def fitted(asset,human):
    path=SOURCE/asset
    old,uv,faces,fuv,g=obj(path.with_suffix('.obj'))
    scale=np.ones(3);binding=[];active=False
    for line in path.with_suffix('.mhclo').read_text().splitlines():
        p=line.split()
        if not p or p[0].startswith('#'):continue
        if p[0] in ['x_scale','y_scale','z_scale']:
            axis={'x_scale':0,'y_scale':1,'z_scale':2}[p[0]]
            scale[axis]=abs(human[int(p[1]),axis]-human[int(p[2]),axis])/float(p[3])
        elif p[0]=='verts':active=True
        elif active and len(p)==9 and p[0].isdigit():
            binding.append((list(map(int,p[:3])),list(map(float,p[3:6])),list(map(float,p[6:9]))))
        elif active and p[0].startswith('delete'):break
    assert len(binding)==len(old),(asset,len(binding),len(old))
    v=np.array([np.sum(human[ix]*np.array(w)[:,None],axis=0)+np.array(off)*scale for ix,w,off in binding])
    return v,uv,faces,fuv

def mesh(name,verts,faces,uv,fuv,ma,parent,center,scale=.17,subdivide=False):
    v=[(p[0]*scale,(p[2]-.45)*scale,(p[1]-center)*scale) for p in verts]
    # Y-up to Z-up with a forward-facing portrait reverses handedness.
    fs=[list(reversed(f)) for f in faces]
    me=bpy.data.meshes.new(name);me.from_pydata(v,[],fs);me.update()
    o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.parent=parent;me.materials.append(ma)
    layer=me.uv_layers.new(name='UVMap')
    for p,uvface in zip(me.polygons,fuv):
        p.use_smooth=True
        for li,ui in zip(p.loop_indices,reversed(uvface)):layer.data[li].uv=uv[ui]
    if subdivide:
        bpy.context.view_layer.objects.active=o;o.select_set(True)
        mod=o.modifiers.new('Portrait surface subdivision','SUBSURF');mod.levels=1
        bpy.ops.object.modifier_apply(modifier=mod.name);o.select_set(False)
    return o

heads=sorted([o for o in bpy.data.objects if o.name.startswith('Maker / head')],key=lambda o:o.parent.name)
for k,head in enumerate(heads):
    for o in list(head.children_recursive):bpy.data.objects.remove(o,do_unlink=True)
    human=base.copy();sex='female' if k%2 else 'male'
    # Blended phenotype targets produce varied individual faces, all adults.
    for family,weight in [('asian',.5),('african',.22),('caucasian',.28)]:morph(human,'macrodetails/'+family+'-'+sex+'-young',weight)
    morph(human,'head/'+['head-oval','head-round','head-square','head-oval','head-rectangular','head-diamond'][k],.16)
    eyeids=set(v for fi in groups['joint-l-eye'] for v in basefaces[fi])
    eyepos=np.mean(human[list(eyeids)],axis=0)
    center=eyepos[1]-.04/.17
    head.rotation_euler.x=-.12-(k%3)*.025
    mesh('Maker / anatomical portrait '+str(k),human[headverts],[[headindex[v] for v in basefaces[i]] for i in headfaces],baseuv,[basefaceuv[i] for i in headfaces],skins[k],head,center,subdivide=True)
    ev,euv,ef,efu=fitted('eyes/high-poly',human)
    mesh('Maker / detailed eyes '+str(k),ev,ef,euv,efu,eyes,head,center)
    style=['short01','bob01','short03','bob01','short01','short03'][k]
    hv,hu,hf,hfu=fitted(style+'/'+style,human)
    # Keep the fringe above the eyes so each face remains readable.
    for point in hv:
        if point[2]>.86 and abs(point[0])<.67:point[1]=max(point[1],eyepos[1]+.24)
    mesh('Maker / textured hair '+str(k),hv,hf,hu,hfu,hairmats[style],head,center)
    # Match the existing neck and hands to the more nuanced face palette.
    color=[(.25,.12,.065),(.39,.22,.13),(.19,.083,.041),(.43,.25,.15),(.29,.14,.075),(.34,.18,.09)][k]
    bs=bpy.data.materials['Skin / '+str(k)].node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.65

bpy.data.objects['houseboat']['portrait_source']='MakeHuman CC0 hm08 / system assets, fitted and adapted for Hackathoni'
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'houseboat.blend'))
print('ANATOMICAL_PORTRAITS_COMPLETE',flush=True)
