shader_type spatial;
render_mode diffuse_toon, specular_disabled;

uniform vec4 grass_color:source_color=vec4(.32,.49,.24,1.);
uniform vec4 soil_color:source_color=vec4(.46,.38,.25,1.);
uniform vec4 rock_color:source_color=vec4(.36,.38,.35,1.);
uniform vec4 path_color:source_color=vec4(.58,.49,.32,1.);
uniform vec4 shadow_tint:source_color=vec4(.25,.34,.39,1.);
uniform vec4 light_tint:source_color=vec4(1.,.94,.77,1.);
uniform float artistic_mode=1.0;
varying vec3 wp;

float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}

void vertex(){wp=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;}
void fragment(){
	float slope=1.-clamp(NORMAL.y,0.,1.);
	float macro=noise(wp.xz*.10);
	float path=1.-smoothstep(1.1,2.8,abs(wp.x+4.0+sin(wp.z*.22)*.7));
	path*=1.-smoothstep(10.,15.,abs(wp.z));
	vec3 c=mix(grass_color.rgb,soil_color.rgb,smoothstep(.30,.68,macro));
	c=mix(c,path_color.rgb,path*.72);
	c=mix(c,rock_color.rgb,smoothstep(.40,.68,slope));
	vec3 physical=c*(.86+macro*.18);
	vec3 painted=c+(macro-.5)*.09;
	ALBEDO=mix(physical,painted,artistic_mode);
	ROUGHNESS=.96;
}
void light(){
	float n=max(dot(NORMAL,LIGHT),0.);
	float bands=floor(n*4.)/3.;
	float shaped=mix(n,smoothstep(.12,.82,n),.55*artistic_mode);
	vec3 tone=mix(shadow_tint.rgb,light_tint.rgb,mix(shaped,bands,.30*artistic_mode));
	DIFFUSE_LIGHT+=ALBEDO*LIGHT_COLOR*tone*ATTENUATION;
}
