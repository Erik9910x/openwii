"""Build original smooth sculptures into local-only GLBs. Y-up numeric space."""
import bpy,sys,os,math
from mathutils import Euler
folder=sys.argv[sys.argv.index('--')+1]
import json
specs=json.load(open(os.path.join(folder,'pack-spec.json')))
def material(color,metal=False):
    name=color+str(metal)
    if name in bpy.data.materials:return bpy.data.materials[name]
    m=bpy.data.materials.new(name)
    def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
    m.diffuse_color=tuple(linear(int(color[i:i+2],16)/255) for i in (1,3,5))+(1,)
    m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=m.diffuse_color;p.inputs['Roughness'].default_value=.32 if metal else .48;p.inputs['Metallic'].default_value=.6 if metal else .05
    return m
for spec in specs:
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for part in spec['parts']:
        shape=part['shape'];p=part['p'];s=part['s'];rot=part['rotation'];name=part['name']
        if shape=='wheel':
            bpy.ops.object.empty_add();parent=bpy.context.object;parent.name=name;parent.location=p
            for n,r,depth,col in [('tire',s[0],s[1],'#182032'),('rim',s[0]*.62,s[1]+.015,'#d6e0f0'),('hub',s[0]*.27,s[1]+.028,spec['parts'][0]['color'])]:
                bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r,depth=depth)
                ob=bpy.context.object;ob.name=name+'-'+n;ob.rotation_euler[1]=math.pi/2;ob.parent=parent
                ob.data.materials.append(material(col,n!='tire'))
                bevel=ob.modifiers.new('soft-machined-edge','BEVEL');bevel.width=.035;bevel.segments=3
                for face in ob.data.polygons:face.use_smooth=True
            continue
        if shape=='sphere':bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=1)
        elif shape=='box':bpy.ops.mesh.primitive_cube_add(size=1)
        elif shape in ('cylinder','cone'):
            bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=1,radius2=1 if shape=='cylinder' else 0,depth=1)
            ob=bpy.context.object
            # Primitive Z axis -> desired Y axis, baked before per-part rotation.
            ob.rotation_euler[0]=math.pi/2;bpy.ops.object.transform_apply(location=False,rotation=True,scale=False)
        elif shape=='torus':bpy.ops.mesh.primitive_torus_add(major_radius=1,minor_radius=.105,major_segments=32,minor_segments=8)
        elif shape=='text':
            bpy.ops.object.text_add();ob=bpy.context.object;ob.data.body=part['text'];ob.data.align_x='CENTER';ob.data.align_y='CENTER';ob.data.extrude=.02
        else:continue
        ob=bpy.context.object;ob.name=name;ob.location=p;ob.scale=s;ob.rotation_euler=rot
        ob.data.materials.append(material(part['color'],'frame' in name or 'exhaust' in name))
        if shape!='text':
            if shape=='box':
                bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
                bevel=ob.modifiers.new('sculpted-corners','BEVEL');bevel.width=.08;bevel.segments=3
                ob.modifiers.new('weighted-normals','WEIGHTED_NORMAL')
            for face in ob.data.polygons:face.use_smooth=True
    bpy.ops.export_scene.gltf(filepath=os.path.join(folder,spec['id']+'.glb'),export_format='GLB',export_yup=False,export_apply=True)
    print('Built',spec['id'])
