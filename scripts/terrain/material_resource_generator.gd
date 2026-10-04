class_name MaterialResourceGenerator
extends RefCounted

const SIZE:=256

func generate_all()->Dictionary:
	var out={}
	for kind in ["grass","soil","rock","cliff","path"]:
		out[kind]=_make_set(kind)
	return out

func _make_set(kind:String)->Dictionary:
	var albedo=Image.create(SIZE,SIZE,false,Image.FORMAT_RGBA8)
	var height=Image.create(SIZE,SIZE,false,Image.FORMAT_RF)
	var rough=Image.create(SIZE,SIZE,false,Image.FORMAT_RF)
	for y in range(SIZE):
		for x in range(SIZE):
			var uv=Vector2(x,y)/float(SIZE)
			var n=_fbm(uv*Vector2(7.0,7.0),kind.hash())
			var detail=_fbm(uv*Vector2(31.0,31.0),kind.hash()+91)
			var h=clamp(n*.78+detail*.22,0.0,1.0)
			var c=_palette(kind,h,uv)
			albedo.set_pixel(x,y,Color(c.r,c.g,c.b,1.0))
			height.set_pixel(x,y,Color(h,0,0,1))
			rough.set_pixel(x,y,Color(_roughness(kind,h),0,0,1))
	var normal=_normal_from_height(height,2.8 if kind in ["rock","cliff"] else 1.35)
	return {"albedo":ImageTexture.create_from_image(albedo),"height":ImageTexture.create_from_image(height),"roughness":ImageTexture.create_from_image(rough),"normal":ImageTexture.create_from_image(normal)}

func _palette(kind:String,h:float,uv:Vector2)->Color:
	match kind:
		"grass": return Color("#426d35").lerp(Color("#8fa75a"),h)
		"soil": return Color("#5b4930").lerp(Color("#a48655"),h)
		"rock": return Color("#4f5754").lerp(Color("#8b8e82"),h)
		"cliff": return Color("#55585a").lerp(Color("#aaa58e"),h)
		"path":
			var edge=abs(_fract(uv.x*4.0)-.5)*2.0
			return Color("#756143").lerp(Color("#b29a65"),clamp(h*.8+(1.0-edge)*.15,0,1))
	return Color(h,h,h)

func _roughness(kind:String,h:float)->float:
	match kind:
		"grass": return .88-h*.08
		"soil": return .82-h*.12
		"rock": return .72-h*.20
		"cliff": return .76-h*.18
		"path": return .84-h*.15
	return .8

func _normal_from_height(src:Image,strength:float)->Image:
	var img=Image.create(SIZE,SIZE,false,Image.FORMAT_RGBA8)
	for y in range(SIZE):
		for x in range(SIZE):
			var l=src.get_pixel(max(x-1,0),y).r; var r=src.get_pixel(min(x+1,SIZE-1),y).r
			var d=src.get_pixel(x,max(y-1,0)).r; var u=src.get_pixel(x,min(y+1,SIZE-1)).r
			var n=Vector3((l-r)*strength,2.0,(d-u)*strength).normalized()
			img.set_pixel(x,y,Color(n.x*.5+.5,n.z*.5+.5,n.y*.5+.5,1))
	return img

func _fbm(p:Vector2,seed:int)->float:
	var total=0.0; var amp=.55; var f=1.0; var norm=0.0
	for i in range(5):
		total+=_value(p*f,seed+i*173)*amp; norm+=amp; amp*=.5; f*=2.03
	return total/norm

func _value(p:Vector2,seed:int)->float:
	var i=Vector2(floor(p.x),floor(p.y)); var f=p-i; f=f*f*(Vector2.ONE*3.0-f*2.0)
	return lerp(lerp(_hash(i,seed),_hash(i+Vector2.RIGHT,seed),f.x),lerp(_hash(i+Vector2.DOWN,seed),_hash(i+Vector2.ONE,seed),f.x),f.y)

func _hash(p:Vector2,seed:int)->float:
	return _fract(sin(p.dot(Vector2(127.1,311.7))+float(seed)*.013)*43758.5453)

func _fract(value:float)->float:
	return value-floor(value)
