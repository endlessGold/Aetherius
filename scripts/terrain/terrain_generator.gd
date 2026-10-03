class_name TerrainGenerator
extends RefCounted

var seed := 1337
var size := 42.0
var resolution := 92

func hash2(x:int,z:int)->float:
	var n=x*374761393+z*668265263+seed*69069
	n=(n^(n>>13))*1274126177
	return float(n&0x7fffffff)/2147483647.0

func noise2(x:float,z:float)->float:
	var xi=int(floor(x)); var zi=int(floor(z))
	var tx=x-xi; var tz=z-zi
	tx=tx*tx*(3.0-2.0*tx); tz=tz*tz*(3.0-2.0*tz)
	return lerp(lerp(hash2(xi,zi),hash2(xi+1,zi),tx),lerp(hash2(xi,zi+1),hash2(xi+1,zi+1),tx),tz)

func fbm(x:float,z:float)->float:
	var v=0.0; var a=0.55; var f=1.0; var n=0.0
	for i in range(5):
		v+=noise2(x*f,z*f)*a; n+=a; a*=0.5; f*=2.03
	return v/n

func height_at(x:float,z:float)->float:
	var n=fbm(x*0.085,z*0.085)
	var upper=smoothstep(-2.0,2.0,-z+5.0+sin(x*0.17)*2.0)
	var plateau=upper*3.6
	var basin=-smoothstep(8.0,2.0,Vector2(x-10.0,z-9.0).length())*1.6
	var ramp_band=1.0-smoothstep(2.0,5.5,abs(x+4.0))
	var ramp_t=smoothstep(-7.0,7.0,z)
	var ramp_height=lerp(3.6,0.0,ramp_t)
	var use_ramp=ramp_band*(1.0-smoothstep(2.0,7.0,abs(z)))
	var h=lerp(plateau,ramp_height,use_ramp)
	h+=basin+(n-0.5)*0.9
	var edge=max(abs(x),abs(z))/(size*0.5)
	return h-smoothstep(0.86,1.0,edge)*2.2

func build_mesh()->ArrayMesh:
	var st=SurfaceTool.new(); st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var step=size/float(resolution)
	for z in range(resolution):
		for x in range(resolution):
			var x0=-size*.5+x*step; var x1=x0+step
			var z0=-size*.5+z*step; var z1=z0+step
			var p00=Vector3(x0,height_at(x0,z0),z0); var p10=Vector3(x1,height_at(x1,z0),z0)
			var p01=Vector3(x0,height_at(x0,z1),z1); var p11=Vector3(x1,height_at(x1,z1),z1)
			for p in [p00,p01,p10,p10,p01,p11]:
				st.set_uv(Vector2((p.x/size)+.5,(p.z/size)+.5)); st.add_vertex(p)
	st.generate_normals()
	return st.commit()
