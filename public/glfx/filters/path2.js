import { Shader } from '../core/shader.js';


const vertexShaderSource = ` 
attribute vec4 position;
varying vec2 texCoord;
void main() {
	gl_Position = vec4(position, 0, 1);
	texCoord = position * 0.5 + 0.5;
}
`;

const fragmentShaderSource = `
uniform sampler2D texture;
uniform vec4 targetColor;
uniform float threshold;
varying vec2 texCoord;

void main() {
    vec4 color = texture2D(texture, texCoord);
    float diff = distance(color.rgb, targetColor.rgb);
    float mask = step(diff, threshold); // 1 if within threshold, 0 otherwise
    gl_FragColor = vec4(vec3(mask), 1.0);
}
`;

// const fragmentShaderSource = `
// uniform sampler2D texture;
// uniform vec4 targetColor;
// uniform float threshold;
// varying vec2 texCoord;

// void main() {
// 	vec4 color = texture2D(texture, texCoord); // Adjust resolution
// 	float distance = length(color.rgb - targetColor);
// 	if (distance <= threshold) {
// 		gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // White for matching pixels
// 	} else {
// 		gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Black for others
// 	}
// }
// `;



/**
 * @filter           Edge
 * @description      Provides additive brightness and multiplicative contrast control.
 * @param brightness -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
 * @param contrast   -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
 */
export function detectPath(targetColor, threshold=0.1) {

	const gl = this._.gl;
	const simpleShader = this.simpleShader;

	gl.detectPath = gl.detectPath || new Shader(gl, vertexShaderSource, fragmentShaderSource);

	simpleShader.call(this, gl.detectPath, {
		targetColor,
		threshold
	});


	return this;
}