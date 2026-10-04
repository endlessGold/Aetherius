#[compute]
#version 450
layout(local_size_x=8, local_size_y=8, local_size_z=1) in;

layout(rgba16f, set=0, binding=0) uniform restrict image2D color_image;
layout(set=0, binding=1) uniform sampler2D depth_tex;
layout(set=0, binding=2) uniform sampler2D normal_roughness_tex;

layout(push_constant, std430) uniform Params {
	vec2 size;
	float detail_strength;
	float separation_strength;
	float depth_strength;
	float normal_strength;
	vec2 _padding;
} params;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 decode_normal(vec3 encoded) {
	vec3 n = encoded * 2.0 - 1.0;
	return normalize(n + vec3(0.00001));
}

void main() {
	ivec2 p = ivec2(gl_GlobalInvocationID.xy);
	ivec2 size = ivec2(params.size);
	if (any(greaterThanEqual(p, size))) return;

	vec2 texel = 1.0 / params.size;
	vec2 uv = (vec2(p) + 0.5) * texel;
	vec4 source = imageLoad(color_image, p);
	float center_luma = luma(source.rgb);
	float center_depth = textureLod(depth_tex, uv, 0.0).r;
	vec4 nr = textureLod(normal_roughness_tex, uv, 0.0);
	vec3 center_normal = decode_normal(nr.xyz);

	vec3 color_sum = vec3(0.0);
	float color_edge = 0.0;
	float depth_edge = 0.0;
	float normal_edge = 0.0;
	float count = 0.0;

	for (int y=-1; y<=1; ++y) {
		for (int x=-1; x<=1; ++x) {
			ivec2 q = clamp(p + ivec2(x,y), ivec2(0), size-1);
			vec2 quv = (vec2(q) + 0.5) * texel;
			vec3 qc = imageLoad(color_image, q).rgb;
			float qd = textureLod(depth_tex, quv, 0.0).r;
			vec3 qn = decode_normal(textureLod(normal_roughness_tex, quv, 0.0).xyz);
			color_sum += qc;
			color_edge = max(color_edge, abs(luma(qc) - center_luma));
			depth_edge = max(depth_edge, abs(qd - center_depth));
			normal_edge = max(normal_edge, 1.0 - clamp(dot(center_normal, qn), 0.0, 1.0));
			count += 1.0;
		}
	}

	vec3 local_mean = color_sum / count;
	float color_boundary = smoothstep(0.025, 0.16, color_edge);
	float depth_boundary = smoothstep(0.00035, 0.006, depth_edge) * params.depth_strength;
	float normal_boundary = smoothstep(0.025, 0.30, normal_edge) * params.normal_strength;
	float boundary = clamp(max(color_boundary, max(depth_boundary, normal_boundary)), 0.0, 1.0);

	float complexity = clamp(color_edge * 7.0 + normal_edge * 1.8 + depth_edge * 70.0, 0.0, 1.0);
	float detail_budget = smoothstep(0.10, 0.78, max(boundary, complexity));
	float simplify = (1.0 - detail_budget) * params.detail_strength;
	vec3 painted_mass = mix(source.rgb, local_mean, simplify);

	float separation = boundary * params.separation_strength;
	vec3 separated = painted_mass * (1.0 - separation * 0.12);
	separated += source.rgb * separation * 0.035;

	imageStore(color_image, p, vec4(max(separated, vec3(0.0)), source.a));
}
