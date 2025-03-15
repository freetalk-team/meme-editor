import { Shader } from '../core/shader.js';


const vertexShaderSource = ` 
attribute vec2 position;
varying vec2 texCoord;
void main() {
	gl_Position = vec4(position, 0, 1);
	texCoord = position * 0.5 + 0.5;
}`;

const fragmentBinaryShaderSource = `
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

const fragmentSobelShaderSource = `
uniform sampler2D texture;
varying vec2 texCoord;
uniform vec2 texSize;

void main() {
    vec2 texel = 1.0 / texSize;
    
    float sobelX[9];
    float sobelY[9];

    sobelX[0] = -1.0; sobelX[1] =  0.0; sobelX[2] =  1.0;
    sobelX[3] = -2.0; sobelX[4] =  0.0; sobelX[5] =  2.0;
    sobelX[6] = -1.0; sobelX[7] =  0.0; sobelX[8] =  1.0;

    sobelY[0] = -1.0; sobelY[1] = -2.0; sobelY[2] = -1.0;
    sobelY[3] =  0.0; sobelY[4] =  0.0; sobelY[5] =  0.0;
    sobelY[6] =  1.0; sobelY[7] =  2.0; sobelY[8] =  1.0;

    vec2 offsets[9];
    offsets[0] = vec2(-1, -1); offsets[1] = vec2(0, -1); offsets[2] = vec2(1, -1);
    offsets[3] = vec2(-1,  0); offsets[4] = vec2(0,  0); offsets[5] = vec2(1,  0);
    offsets[6] = vec2(-1,  1); offsets[7] = vec2(0,  1); offsets[8] = vec2(1,  1);

    float edgeX = 0.0;
    float edgeY = 0.0;

    for (int i = 0; i < 9; i++) {
        vec2 offset = offsets[i] * texel;
        float intensity = texture2D(texture, texCoord + offset).r;
        edgeX += intensity * sobelX[i];
        edgeY += intensity * sobelY[i];
    }

    float edgeStrength = length(vec2(edgeX, edgeY));
    gl_FragColor = vec4(vec3(edgeStrength), 1.0);
}

`;

/**
 * @filter           Edge
 * @description      Provides additive brightness and multiplicative contrast control.
 * @param brightness -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
 * @param contrast   -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
 */
export function detectPath(targetColor, threshold=0.1) {

	const gl = this._.gl;
	const simpleShader = this.simpleShader;

	gl.detectPathBinary = gl.detectPathBinary || new Shader(gl, null, fragmentBinaryShaderSource);
	gl.detectPathSobel = gl.detectPathSobel || new Shader(gl, null, fragmentSobelShaderSource);

	simpleShader.call(this, gl.detectPathBinary, {
		targetColor,
		threshold
	});

	simpleShader.call(this, gl.detectPathSobel, {
		texSize: [this.texture.width, this.texture.height]
	});

	return this;
}