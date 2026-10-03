shader_type spatial;
render_mode diffuse_toon, specular_toon;
uniform vec4 base_color : source_color = vec4(1.0);
uniform vec4 shadow_tint : source_color = vec4(0.38,0.48,0.55,1.0);
uniform vec4 rim_color : source_color = vec4(0.75,0.9,1.0,1.0);
uniform vec4 emission_color : source_color = vec4(0.0,0.0,0.0,1.0);
uniform float emission_strength : hint_range(0.0,2.0) = 0.0;
uniform float color_steps : hint_range(2.0,8.0) = 4.0;
uniform float painted_variation : hint_range(0.0,0.2) = 0.045;
uniform float rim_strength : hint_range(0.0,1.0) = 0.18;
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
void fragment(){float grain=(hash21(floor(UV*96.0))-0.5)*painted_variation;ALBEDO=clamp(base_color.rgb+grain,0.0,1.0);ROUGHNESS=0.9;EMISSION=emission_color.rgb*emission_strength;}
void light(){float ndl=max(dot(NORMAL,LIGHT),0.0);float band=floor(ndl*color_steps)/max(color_steps-1.0,1.0);vec3 lit=mix(shadow_tint.rgb,vec3(1.0),band);float rim=pow(1.0-max(dot(NORMAL,VIEW),0.0),3.0)*rim_strength;DIFFUSE_LIGHT+=ALBEDO*LIGHT_COLOR*lit*ATTENUATION+rim_color.rgb*rim;}
