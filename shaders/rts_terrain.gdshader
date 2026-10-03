shader_type spatial;
render_mode diffuse_toon, specular_disabled;

uniform sampler2D grass_albedo : source_color, repeat_enable;
uniform sampler2D grass_normal : hint_normal, repeat_enable;
uniform sampler2D soil_albedo : source_color, repeat_enable;
uniform sampler2D rock_albedo : source_color, repeat_enable;
uniform sampler2D cliff_albedo : source_color, repeat_enable;
uniform sampler2D path_albedo : source_color, repeat_enable;
uniform sampler2D roughness_map : repeat_enable;
uniform vec4 shadow_tint:source_color=vec4(.25,.34,.39,1.);
uniform vec4 light_tint:source_color=vec4(1.,.94,.77,1.);
uniform float artistic_mode=1.0;
uniform float texture_scale=.105;
varying vec3 wp;

float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}
void vertex(){wp=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;}
void fragment(){
	vec2 uv=wp.xz*texture_scale;
	float slope=1.-clamp(NORMAL.y,0.,1.);
	float macro=noise(wp.xz*.085);
	float path=1.-smoothstep(1.1,2.8,abs(wp.x+4.0+sin(wp.z*.22)*.7));
	path*=1.-smoothstep(10.,15.,abs(wp.z));
	float soil=smoothstep(.34,.67,macro)*(1.-path);
	float cliff=smoothstep(.38,.67,slope);
	vec3 g=texture(grass_albedo,uv).rgb;
	vec3 s=texture(soil_albedo,uv*1.07).rgb;
	vec3 r=texture(rock_albedo,uv*.88).rgb;
	vec3 c=texture(cliff_albedo,uv*Vector2(.72,1.35)).rgb;
	vec3 p=texture(path_albedo,uv*1.15).rgb;
	vec3 base=mix(g,s,soil*.62);
	base=mix(base,p,path*.86);
	base=mix(base,mix(r,c,.65),cliff);
	float physical_light=.88+macro*.15;
	vec3 physical=base*physical_light;
	vec3 painted=base+(macro-.5)*.075;
	painted=mix(painted,painted*vec3(.88,.96,1.03),smoothstep(.55,1.,slope)*.22);
	ALBEDO=mix(physical,painted,artistic_mode);
	ROUGHNESS=texture(roughness_map,uv).r;
}
void light(){
	float n=max(dot(NORMAL,LIGHT),0.);
	float bands=floor(n*4.)/3.;
	float shaped=mix(n,smoothstep(.12,.82,n),.55*artistic_mode);
	vec3 tone=mix(shadow_tint.rgb,light_tint.rgb,mix(shaped,bands,.30*artistic_mode));
	DIFFUSE_LIGHT+=ALBEDO*LIGHT_COLOR*tone*ATTENUATION;
}