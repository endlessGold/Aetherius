#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) uniform restrict image2D color_image;
layout(push_constant,std430) uniform Params { vec2 size; float detail_strength; float separation_strength; } params;
float luma(vec3 c){return dot(c,vec3(0.2126,0.7152,0.0722));}
void main(){
 ivec2 p=ivec2(gl_GlobalInvocationID.xy); ivec2 size=ivec2(params.size); if(any(greaterThanEqual(p,size))) return;
 vec4 c=imageLoad(color_image,p); float y=luma(c.rgb);
 vec3 mean=vec3(0.0); float edge=0.0; int count=0;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){ivec2 q=clamp(p+ivec2(i,j),ivec2(0),size-1);vec3 n=imageLoad(color_image,q).rgb;mean+=n;edge+=abs(luma(n)-y);count++;}
 mean/=float(count); edge/=float(count);
 float budget=smoothstep(0.015,0.12,edge);
 float simplify=(1.0-budget)*params.detail_strength;
 vec3 mass=mix(c.rgb,mean,simplify);
 float separation=smoothstep(0.035,0.16,edge)*params.separation_strength;
 mass*=1.0-separation*0.10;
 imageStore(color_image,p,vec4(mass,c.a));
}
