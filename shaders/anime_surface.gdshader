shader_type spatial;
render_mode diffuse_toon, specular_disabled;

uniform vec4 base_color : source_color = vec4(0.55,0.65,0.45,1.0);
uniform vec4 shadow_tint : source_color = vec4(0.33,0.42,0.48,1.0);
uniform vec4 rim_color : source_color = vec4(0.84,0.94,0.93,1.0);
uniform float shadow_steps : hint_range(2.0,6.0) = 3.0;
uniform float secondary_shadow : hint_range(0.0,0.5) = 0.18;
uniform float rim_strength : hint_range(0.0,1.0) = 0.16;
uniform float painted_variation : hint_range(0.0,0.2) = 0.035;

float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
void fragment(){
	float grain=(hash21(floor(UV*96.0))-0.5)*painted_variation;
	ALBEDO=clamp(base_color.rgb+grain,0.0,1.0);
	ROUGHNESS=1.0;
	SPECULAR=0.0;
}
void light(){
	float ndl=max(dot(NORMAL,LIGHT),0.0);
	float stepped=floor(ndl*shadow_steps)/max(shadow_steps-1.0,1.0);
	float deep=smoothstep(0.0,secondary_shadow,ndl);
	vec3 shade=mix(shadow_tint.rgb*0.72,shadow_tint.rgb,deep);
	vec3 lit=mix(shade,vec3(1.0),stepped);
	float rim=pow(1.0-max(dot(NORMAL,VIEW),0.0),3.0)*rim_strength;
	DIFFUSE_LIGHT+=ALBEDO*LIGHT_COLOR*lit*ATTENUATION+rim_color.rgb*rim;
}
