"""Final proportions and continuous cloth surfaces for the cinematic model."""
from pathlib import Path
import bpy, bmesh, math
from mathutils import Vector
HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'houseboat.blend'))
root=bpy.data.objects['houseboat']
makers=[o for o in bpy.data.objects if o.type=='EMPTY' and o.name.startswith('Maker ') and 'workstation' in o.name]
for person in makers:
    if person.get('tailored'):continue
    parts=[o for o in person.children if o.type=='MESH' and o.data.materials and o.data.materials[0].name.startswith('Linen /')]
    if not parts:continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object
    o.name='Maker / continuous tailored shirt'
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bm=bmesh.new();bm.from_mesh(o.data)
    boundary=[e for e in bm.edges if e.is_boundary]
    bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(o.data);bm.free()
    rem=o.modifiers.new('Join shoulders and sleeves','REMESH');rem.mode='VOXEL';rem.voxel_size=.012;rem.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=rem.name)
    sm=o.modifiers.new('Relax fabric joins','SMOOTH');sm.factor=.85;sm.iterations=4
    bpy.ops.object.modifier_apply(modifier=sm.name)
    inv=person.matrix_world.inverted();world=o.matrix_world
    for v in o.data.vertices:
        p=inv@world@v.co
        # Small compressed folds gather at waist and underarm, with quieter
        # fabric across the chest. Their shadow survives normal web lighting.
        waist=math.exp(-((p.z-1.39)/.11)**2)
        side=min(1,abs(p.x)/.3)
        amount=.0045*math.sin(p.z*76+p.x*11)*(waist*.7+side*.45)
        v.co+=v.normal*amount
    dec=o.modifiers.new('Web cloth density','DECIMATE');dec.ratio=.45
    bpy.ops.object.modifier_apply(modifier=dec.name)
    for p in o.data.polygons:p.use_smooth=True
    print('TAILORED',person.name,len(o.data.vertices),flush=True)
    person['tailored']=True

if not root.get('cinematic_length'):
    bpy.context.view_layer.update()
    factor=1.16
    for person in makers:person.location.x*=factor
    # Extend the architecture and hull; retain natural actor proportions and
    # circular lifebuoys. Each maker brings their chair and workstation along.
    for o in bpy.data.objects:
        if o.type!='MESH':continue
        parent=o.parent;is_maker=False
        while parent:
            if parent in makers:is_maker=True;break
            parent=parent.parent
        if is_maker:continue
        inv=o.matrix_world.inverted()
        preserve=o.name.startswith(('Safety /','Fender /','Mooring /','Supplies /','Lighting /','Lantern /'))
        center=sum((o.matrix_world@Vector(c)).x for c in o.bound_box)/8
        for v in o.data.vertices:
            p=o.matrix_world@v.co
            p.x=p.x+center*(factor-1) if preserve else p.x*factor
            v.co=inv@p
    root['cinematic_length']=factor
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'houseboat.blend'))
print('BOAT_FINISH_COMPLETE',flush=True)
