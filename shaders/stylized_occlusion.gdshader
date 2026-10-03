shader_type canvas_item;
render_mode unshaded;
uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
uniform sampler2D depth_texture : hint_depth_texture, filter_nearest;
uniform float radius : hint_range(0.25,4.0)=1.35;
uniform float strength : hint_range(0.0,1.0)=0.32;
uniform float contact_bias : hint_range(0.0,0.05)=0.006;
uniform float micro_suppression : hint_range(0.0,1.0)=0.72;
uniform vec4 occlusion_tint : source_color=vec4(0.24,0.31,0.34,1.0);
float linear_depth(vec2 uv){float d=texture(depth_texture,uv).r;vec3 ndc=vec3(uv*2.0-1.0,d);vec4 view=INV_PROJECTION_MATRIX*vec4(ndc,1.0);view.xyz/=max(view.w,0.00001);return -view.z;}
void fragment(){vec2 uv=SCREEN_UV;vec4 base=texture(screen_texture,uv);float center=linear_depth(uv);vec2 px=1.0/vec2(textureSize(depth_texture,0));float occ=0.0;vec2 dirs[8]=vec2[](vec2(1,0),vec2(-1,0),vec2(0,1),vec2(0,-1),vec2(.707,.707),vec2(-.707,.707),vec2(.707,-.707),vec2(-.707,-.707));for(int i=0;i<8;i++){float sd=linear_depth(uv+dirs[i]*px*radius*3.0);occ+=smoothstep(0.0,0.16,center-sd-contact_bias);}occ/=8.0;occ=smoothstep(micro_suppression*0.35,1.0,occ)*strength;COLOR=vec4(mix(base.rgb,base.rgb*occlusion_tint.rgb,occ),base.a);}
