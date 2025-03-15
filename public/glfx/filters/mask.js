import { Shader } from '../core/shader.js';
import { clamp } from "./common.js";

const vertexShaderSource = ` 
attribute vec2 position;
varying vec2 texCoord;
void main() {
	gl_Position = vec4(position, 0, 1);
	texCoord = position * 0.5 + 0.5;
}`;

// fliped 
// const vertexShaderSource = ` 
// attribute vec2 position;
// varying vec2 texCoord;
// void main() {
// 	gl_Position = vec4(position, 0, 1);
// 	texCoord = vec2(position.x * 0.5 + 0.5, 1.0 - (position.y * 0.5 + 0.5));
// }`;

// const vertexShaderSource = '\
// attribute vec2 vertex;\
// attribute vec2 _texCoord;\
// attribute vec2 position;\
// varying vec2 texCoord;\
// void main() {\
// 	texCoord = _texCoord;\
// 	gl_Position = vec4(vertex * 2.0 - 1.0, 0.0, 1.0);\
// }';

const fragmentShaderSource = `
uniform sampler2D texture;
uniform vec4 targetColor;
uniform vec4 highlightColor;
uniform vec4 fillColor;
uniform float threshold;
varying vec2 texCoord;

void main() {
	vec4 color = texture2D(texture, texCoord);
	float diff = distance(color.rgb, targetColor.rgb);
	if (diff < threshold) {
		// gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Highlighted in red 
		gl_FragColor = highlightColor;
	} else {
		// gl_FragColor = color;
		// gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // black 
		gl_FragColor = fillColor; // black 
	}
}`;

/**
 * @filter           Brightness / Contrast
 * @description      Provides additive brightness and multiplicative contrast control.
 * @param brightness -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
 * @param contrast   -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
 */
export function detectMask(targetColor, threshold=0.1, highlightColor, fillColor) {

	const gl = this._.gl;
	const simpleShader = this.simpleShader;

	gl.detectMask = gl.detectMask || new Shader(gl, vertexShaderSource, fragmentShaderSource);


	// let positionBuffer;

	// if (!positionBuffer) {
	// 	positionBuffer = gl.createBuffer();
	// 	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	// 	const positions = new Float32Array([
	// 		-1, -1,  1, -1, -1,  1,
	// 		-1,  1,  1, -1,  1,  1
	// 	]);

	// fliped
	// const positions = new Float32Array([
	// 	-1, 1,  1, 1, -1, -1,
	// 	-1, -1,  1, 1, 1, -1
	//   ]);

	// 	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

	// 	const positionLocation = gl.getAttribLocation(gl.detectMask.program, 'a_position');
	// 	gl.enableVertexAttribArray(positionLocation);
	// 	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
	// }


	// const pixels = new Uint8Array(4);
	// gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

	// const targetColor = [pixels[0] / 255, pixels[1] / 255, pixels[2] / 255, 1.0];

	// const vertexAttribute = gl.getAttribLocation(gl.detectMask.program, 'vertex');
	// console.log("WEBGL Mask vertext attr", vertexAttribute);

	simpleShader.call(this, gl.detectMask, {
		targetColor,
		highlightColor,
		fillColor,
		threshold
	});


	// const pixelData = this.getPixelArray();


	return this;
}