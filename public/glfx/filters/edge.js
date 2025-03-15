import { Shader } from '../core/shader.js';
import { clamp } from "./common.js";

/* 

	Gx (Horizontal Edges)
	[-1  0  1]
	[-2  0  2]
	[-1  0  1]

	Gy (Vertical Edges)
	[-1 -2 -1]
	[ 0  0  0]
	[ 1  2  1]

	G = sqrt(Gx^2 + Gy^2); 
*/

const vertexShaderSource = ` 
attribute vec2 position;
varying vec2 texCoord;
void main() {
	gl_Position = vec4(position, 0, 1);
	texCoord = position * 0.5 + 0.5;
}`;

const fragmentSmoothShaderSource = `
uniform sampler2D texture;
uniform vec4 targetColor;
uniform float threshold;
uniform vec2 texSize;
varying vec2 texCoord;

void main() {
    vec2 texel = 1.0 / texSize; // Step size for neighboring pixels

    // Sobel Kernels
    float Gx[9];
    float Gy[9];

    Gx[0] = -1.0; Gx[1] =  0.0; Gx[2] =  1.0;
    Gx[3] = -2.0; Gx[4] =  0.0; Gx[5] =  2.0;
    Gx[6] = -1.0; Gx[7] =  0.0; Gx[8] =  1.0;

    Gy[0] = -1.0; Gy[1] = -2.0; Gy[2] = -1.0;
    Gy[3] =  0.0; Gy[4] =  0.0; Gy[5] =  0.0;
    Gy[6] =  1.0; Gy[7] =  2.0; Gy[8] =  1.0;

    // Neighboring pixel offsets
    vec2 offsets[9];
	offsets[0] = vec2(-1, -1); offsets[1] = vec2(0, -1); offsets[2] = vec2(1, -1);
    offsets[3] = vec2(-1,  0); offsets[4] = vec2(0,  0); offsets[5] = vec2(1,  0);
    offsets[6] = vec2(-1,  1); offsets[7] = vec2(0,  1); offsets[8] = vec2(1,  1);

    // Arrays for storing grayscale intensity and mask values
    float sample[9];
    float mask[9];

    for (int i = 0; i < 9; i++) {
        vec2 offset = offsets[i] * texel;
        vec4 color = texture2D(texture, texCoord + offset);

        float diff = distance(color.rgb, targetColor.rgb);
        mask[i] = (diff < threshold) ? 1.0 : 0.0;  // Select only target color regions

        // Convert to grayscale (Luma formula)
        sample[i] = dot(color.rgb, vec3(0.299, 0.587, 0.114)) * mask[i];
    }

    // Apply Sobel filter only to target color areas
    float edgeX = 0.0;
    float edgeY = 0.0;

    for (int i = 0; i < 9; i++) {
        edgeX += sample[i] * Gx[i];
        edgeY += sample[i] * Gy[i];
    }

    // Compute edge strength
    float edgeStrength = length(vec2(edgeX, edgeY));

	// 🔥 Improve edge visibility
	edgeStrength = smoothstep(0.05, 0.3, edgeStrength * 8.0);  // Adjust sensitivity

    // Show only detected edges (where mask is active)
   //gl_FragColor = vec4(vec3(edgeStrength * mask[4]), 1.0);
	gl_FragColor = vec4(vec3(edgeStrength), 1.0);
}
`;

const fragmentShaderSource = `
uniform sampler2D texture;
uniform vec4 targetColor;
uniform float threshold;
uniform vec2 texSize;
varying vec2 texCoord;

void main() {
    vec2 texel = 1.0 / texSize; // Step size for neighboring pixels

    // Sobel Kernels (Manually Assigned)
    float Gx[9];
    float Gy[9];

    Gx[0] = -1.0; Gx[1] =  0.0; Gx[2] =  1.0;
    Gx[3] = -2.0; Gx[4] =  0.0; Gx[5] =  2.0;
    Gx[6] = -1.0; Gx[7] =  0.0; Gx[8] =  1.0;

    Gy[0] = -1.0; Gy[1] = -2.0; Gy[2] = -1.0;
    Gy[3] =  0.0; Gy[4] =  0.0; Gy[5] =  0.0;
    Gy[6] =  1.0; Gy[7] =  2.0; Gy[8] =  1.0;

    // Neighboring pixel offsets
    vec2 offsets[9];
	offsets[0] = vec2(-1, -1); offsets[1] = vec2(0, -1); offsets[2] = vec2(1, -1);
    offsets[3] = vec2(-1,  0); offsets[4] = vec2(0,  0); offsets[5] = vec2(1,  0);
    offsets[6] = vec2(-1,  1); offsets[7] = vec2(0,  1); offsets[8] = vec2(1,  1);

    // Arrays for storing grayscale intensity and mask values
    float sample[9];
    float mask[9];

    for (int i = 0; i < 9; i++) {
        vec2 offset = offsets[i] * texel;
        vec4 color = texture2D(texture, texCoord + offset);

        float diff = distance(color.rgb, targetColor.rgb);
        mask[i] = (diff < threshold) ? 1.0 : 0.0;  // Select only target color regions

        // Convert to grayscale (Luma formula)
        sample[i] = dot(color.rgb, vec3(0.299, 0.587, 0.114)) * mask[i];
    }
 
	gl_FragColor = vec4(vec3(sample[4]), 1.0);
}
`;

// const fragmentShaderSource = `
// uniform sampler2D texture;
// uniform vec4 targetColor;
// uniform float threshold;
// uniform vec2 texSize;
// varying vec2 texCoord;

// void main() {
// 	vec2 texel = 1.0 / texSize; // Step size

// 	// Sobel Kernels
// 	float Gx[9] = float[9](
// 		-1.0,  0.0,  1.0,
// 		-2.0,  0.0,  2.0,
// 		-1.0,  0.0,  1.0
// 	);

// 	float Gy[9] = float[9](
// 		-1.0, -2.0, -1.0,
// 		 0.0,  0.0,  0.0,
// 		 1.0,  2.0,  1.0
// 	);

// 	vec2 offsets[9] = vec2[9](
// 		vec2(-1, -1), vec2(0, -1), vec2(1, -1),
// 		vec2(-1,  0), vec2(0,  0), vec2(1,  0),
// 		vec2(-1,  1), vec2(0,  1), vec2(1,  1)
// 	);

// 	float sample[9];
// 	float mask[9];

// 	for (int i = 0; i < 9; i++) {
// 		vec2 offset = offsets[i] * texel;
// 		vec4 color = texture2D(texture, texCoord + offset);

// 		float diff = distance(color.rgb, targetColor.rgb);
// 		mask[i] = (diff < threshold) ? 1.0 : 0.0;

// 		// Convert to grayscale
// 		sample[i] = dot(color.rgb, vec3(0.299, 0.587, 0.114)) * mask[i];
// 	}

// 	// Apply Sobel filter
// 	float edgeX = 0.0;
// 	float edgeY = 0.0;

// 	for (int i = 0; i < 9; i++) {
// 		edgeX += sample[i] * Gx[i];
// 		edgeY += sample[i] * Gy[i];
// 	}

// 	// Edge strength
// 	float edgeStrength = length(vec2(edgeX, edgeY));

// 	// Show only edges where mask is active
// 	gl_FragColor = vec4(vec3(edgeStrength * mask[4]), 1.0);
// }`;


// const fragmentShaderSource = `
// uniform sampler2D texture;
// uniform vec2 texSize;
// varying vec2 texCoord;

// void main() {
// 	vec2 texel = 1.0 / texSize; // Step size

// 	// Sobel Kernel Weights
// 	float Gx[9];
// 	float Gy[9];

// 	Gx[0] = -1.0; Gx[1] =  0.0; Gx[2] =  1.0;
// 	Gx[3] = -2.0; Gx[4] =  0.0; Gx[5] =  2.0;
// 	Gx[6] = -1.0; Gx[7] =  0.0; Gx[8] =  1.0;

// 	Gy[0] = -1.0; Gy[1] = -2.0; Gy[2] = -1.0;
// 	Gy[3] =  0.0; Gy[4] =  0.0; Gy[5] =  0.0;
// 	Gy[6] =  1.0; Gy[7] =  2.0; Gy[8] =  1.0;

// 	float sample[9];
// 	int idx = 0;

// 	// Get grayscale intensity values
// 	for (int i = -1; i <= 1; i++) {
// 		for (int j = -1; j <= 1; j++) {
// 			vec2 offset = vec2(float(i), float(j)) * texel;
// 			vec3 color = texture2D(texture, texCoord + offset).rgb;
// 			sample[idx] = dot(color, vec3(0.299, 0.587, 0.114)); // Convert to grayscale
// 			idx++;
// 		}
// 	}

// 	// Compute Gx and Gy
// 	float edgeX = 0.0;
// 	float edgeY = 0.0;
	
// 	for (int i = 0; i < 9; i++) {
// 		edgeX += sample[i] * Gx[i];
// 		edgeY += sample[i] * Gy[i];
// 	}

// 	// Compute gradient magnitude
// 	float edgeStrength = length(vec2(edgeX, edgeY));

// 	// Output edge visualization
// 	gl_FragColor = vec4(vec3(edgeStrength), 1.0);
// }`;

/**
 * @filter           Edge
 * @description      Provides additive brightness and multiplicative contrast control.
 * @param brightness -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
 * @param contrast   -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
 */
export function detectEdge(targetColor, threshold=0.1) {

	const gl = this._.gl;
	const simpleShader = this.simpleShader;

	gl.detectEdge = gl.detectEdge || new Shader(gl, vertexShaderSource, fragmentShaderSource);

	simpleShader.call(this, gl.detectEdge, {
		targetColor,
		threshold,
		texSize: [this.texture.width, this.texture.height]
	});

	return this;
}