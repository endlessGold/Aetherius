shader_type spatial;
render_mode diffuse_toon, specular_disabled;

uniform vec4 low_color : source_color = vec4(0.20,0.34,0.16,1.0);
uniform vec4 mid_color : source_color = vec4(0.45,0.58,0.25,1.0);
uniform vec4 high_color : source_color = vec4(0.72,0.69,0.46,1.0);
uniform vec4 rock_color : source_color = vec4(0.32,0.34,0.31,1.0);
uniform vec4 shadow_tint : source_color = vec4(0.34,0.43,0.48,1.0);
uniform vec4 rim_color : source_color = vec4(0.72,0.86,0.88,1.0);
uniform float macro_scale : hint_range(0.01,1.0) = 0.11;
uniform float macro_strength : hint_range(0.0,0.5) = 0.12;
uniform float slope_start : hint_range(0.0,1.0) = 0.55;
uniform float slope_blend : hint_range(0.01,0.5) = 0.18;
uniform float shadow_steps : hint_range(2.0,8.0) = 4.0;
uniform float rim_strength : hint_range(0.0,1.0) = 0.12;
uniform float painted_grain : hint_range(0.0,0.15) = 0.025;
uniform float secondary_shadow : hint_range(0.0,0.5) = 0.18;

varying vec3 world_pos;

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}
float value_noise(vec2 p) {
	vec2 i=floor(p), f=fract(p);
	f=f*f*(3.0-2.0*f);
	return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
void vertex() {
	world_pos = (MODEL_MATRIX * vec4(VERTEX,1.0)).xyz;
}
void fragment() {
	float h = clamp((world_pos.y + 3.0) / 10.0, 0.0, 1.0);
	vec3 terrain = mix(low_color.rgb, mid_color.rgb, smoothstep(0.12,0.52,h));
	terrain = mix(terrain, high_color.rgb, smoothstep(0.58,0.92,h));
	float slope = 1.0 - clamp(NORMAL.y,0.0,1.0);
	float rock = smoothstep(slope_start, slope_start+slope_blend, slope);
	terrain = mix(terrain, rock_color.rgb, rock);
	float macro = (value_noise(world_pos.xz*macro_scale)-0.5)*macro_strength;
	float grain = (hash21(floor(world_pos.xz*7.0))-0.5)*painted_grain;
	ALBEDO = clamp(terrain + macro + grain,0.0,1.0);
	ROUGHNESS = 1.0;
}
void light() {
	float ndl=max(dot(NORMAL,LIGHT),0.0);
	float band=floor(ndl*shadow_steps)/max(shadow_steps-1.0,1.0);
	float deep=smoothstep(0.0,secondary_shadow,ndl);
	vec3 deep_shadow=mix(shadow_tint.rgb*0.72,shadow_tint.rgb,deep);
	vec3 toon=mix(deep_shadow,vec3(1.0),band);
	float rim=pow(1.0-max(dot(NORMAL,VIEW),0.0),3.0)*rim_strength;
	DIFFUSE_LIGHT += ALBEDO*LIGHT_COLOR*toon*ATTENUATION + rim_color.rgb*rim;
}
