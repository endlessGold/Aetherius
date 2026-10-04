#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rg16f,set=0,binding=0) uniform readonly image2D velocity_img;
layout(r32ui,set=0,binding=1) uniform readonly uimage2D object_now;
layout(r32ui,set=0,binding=2) uniform readonly uimage2D object_prev;
layout(rgba16f,set=0,binding=3) uniform readonly image2D history_prev;
layout(rgba16f,set=0,binding=4) uniform writeonly image2D history_out;
layout(push_constant,std430) uniform P{vec2 size;float persistence;float pad;}p;
void main(){ivec2 q=ivec2(gl_GlobalInvocationID.xy),s=ivec2(p.size);if(any(greaterThanEqual(q,s)))return;vec2 v=imageLoad(velocity_img,q).xy;ivec2 prev=ivec2(vec2(q)-v*vec2(s));bool inside=all(greaterThanEqual(prev,ivec2(0)))&&all(lessThan(prev,s));vec4 h=vec4(0.);if(inside&&imageLoad(object_now,q).r==imageLoad(object_prev,prev).r)h=imageLoad(history_prev,prev)*p.persistence;imageStore(history_out,q,h);}
