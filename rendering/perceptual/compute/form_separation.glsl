#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(r16f,set=0,binding=0) uniform readonly image2D boundary_img;
layout(r16f,set=0,binding=1) uniform readonly image2D importance_img;
layout(rgba16f,set=0,binding=2) uniform writeonly image2D operator_out;
layout(push_constant,std430) uniform P{vec2 size;float strength;float edge_bias;}p;
void main(){ivec2 q=ivec2(gl_GlobalInvocationID.xy);if(any(greaterThanEqual(q,ivec2(p.size))))return;float b=imageLoad(boundary_img,q).r;float f=imageLoad(importance_img,q).r;float need=smoothstep(p.edge_bias,1.,b)*(0.45+0.55*f)*p.strength;float shadow=need*.45;float value=need*.30;float atmosphere=need*.15;float edge=need*.10;imageStore(operator_out,q,vec4(shadow,value,atmosphere,edge));}
