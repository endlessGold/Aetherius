#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) uniform readonly image2D normal_depth;
layout(r16f,set=0,binding=1) uniform writeonly image2D boundary_out;
layout(push_constant,std430) uniform P{vec2 size;float depth_weight;float normal_weight;}p;
void main(){ivec2 q=ivec2(gl_GlobalInvocationID.xy),s=ivec2(p.size);if(any(greaterThanEqual(q,s)))return;vec4 c=imageLoad(normal_depth,q);float e=0.;ivec2 d[4]=ivec2[](ivec2(1,0),ivec2(-1,0),ivec2(0,1),ivec2(0,-1));for(int i=0;i<4;i++){vec4 n=imageLoad(normal_depth,clamp(q+d[i],ivec2(0),s-1));e+=abs(c.w-n.w)*p.depth_weight+(1.-clamp(dot(c.xyz,n.xyz),0.,1.))*p.normal_weight;}imageStore(boundary_out,q,vec4(clamp(e*.25,0.,1.)));}
