import { Shader } from "../../core/shader.js";

/**
 * @filter         Unsharp Mask
 * @description    A form of image sharpening that amplifies high-frequencies in the image. It
 *                 is implemented by scaling pixels away from the average of their neighbors.
 * @param radius   The blur radius that calculates the average of the neighboring pixels.
 * @param strength A scale factor where 0 is no effect and higher values cause a stronger effect.
 */
export function unsharpMask(radius, strength) {

	const gl = this._.gl;
	const simpleShader = this.simpleShader;

	gl.unsharpMask = gl.unsharpMask || new Shader(gl, null, '\
		uniform sampler2D blurredTexture;\
		uniform sampler2D originalTexture;\
		uniform float strength;\
		uniform float threshold;\
		varying vec2 texCoord;\
		void main() {\
			vec4 blurred = texture2D(blurredTexture, texCoord);\
			vec4 original = texture2D(originalTexture, texCoord);\
			gl_FragColor = mix(blurred, original, 1.0 + strength);\
		}\
	');

	// Store a copy of the current texture in the second texture unit
	this._.extraTexture.ensureFormat(this._.texture);
	this._.texture.use();
	this._.extraTexture.drawTo(function() {
		Shader.getDefaultShader(gl).drawRect();
	});

	// Blur the current texture, then use the stored texture to detect edges
	this._.extraTexture.use(1);
	this.triangleBlur(radius);
	gl.unsharpMask.textures({
		originalTexture: 1
	});
	simpleShader.call(this, gl.unsharpMask, {
		strength: strength
	});
	this._.extraTexture.unuse(1);

	return this;
}
