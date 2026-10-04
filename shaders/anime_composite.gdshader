shader_type canvas_item;
render_mode unshaded;
uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
uniform float value_steps : hint_range(2.0,8.0)=5.0;
uniform float saturation : hint_range(0.5,1.5)=1.05;
void fragment(){vec4 c=texture(screen_texture,SCREEN_UV);float l=dot(c.rgb,vec3(.2126,.7152,.0722));float q=floor(l*value_steps+.5)/value_steps;vec3 chroma=c.rgb-vec3(l);COLOR=vec4(clamp(vec3(q)+chroma*saturation,0.0,1.0),c.a);}
