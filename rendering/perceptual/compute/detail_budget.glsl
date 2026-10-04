#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(r16f,set=0,binding=0) uniform readonly image2D complexity_img;
layout(r16f,set=0,binding=1) uniform readonly image2D importance_img;
layout(r16f,set=0,binding=2) uniform writeonly image2D budget_out;
layout(push_constant,std430) uniform P{vec2 size;float base_budget;float focal_gain;}p;
void main(){ivec2 q=ivec2(gl_GlobalInvocationID.xy);if(any(greaterThanEqual(q,ivec2(p.size))))return;float h=imageLoad(complexity_img,q).r;float f=imageLoad(importance_img,q).r;float b=clamp(p.base_budget+p.focal_gain*f-max(0.,h-.35)*.65,.08,1.);imageStore(budget_out,q,vec4(b));}
