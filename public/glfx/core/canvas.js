import { Texture } from './texture.js';
import { Shader } from './shader.js';

import { brightnessContrast } from '../filters/adjust/brightnesscontrast.js';
import { hexagonalPixelate } from '../filters/fun/hexagonalpixelate.js';
import { hueSaturation } from '../filters/adjust/huesaturation.js';
import { colorHalftone } from '../filters/fun/colorhalftone.js';
import { triangleBlur } from '../filters/blur/triangleblur.js';
import { unsharpMask } from '../filters/adjust/unsharpmask.js';
import { perspective } from '../filters/warp/perspective.js';
import { matrixWarp } from '../filters/warp/matrixwarp.js';
import { bulgePinch } from '../filters/warp/bulgepinch.js';
import { tiltShift } from '../filters/blur/tiltshift.js';
import { dotScreen } from '../filters/fun/dotscreen.js';
import { edgeWork } from '../filters/fun/edgework.js';
import { lensBlur } from '../filters/blur/lensblur.js';
import { zoomBlur } from '../filters/blur/zoomblur.js';
import { noise } from '../filters/adjust/noise.js';
import { denoise } from '../filters/adjust/denoise.js';
import { curves } from '../filters/adjust/curves.js';
import { swirl } from '../filters/warp/swirl.js';
import { ink } from '../filters/fun/ink.js';
import { vignette } from '../filters/adjust/vignette.js';
import { vibrance } from '../filters/adjust/vibrance.js';
import { sepia } from '../filters/adjust/sepia.js';
import { detectMask } from '../filters/mask.js';
import { detectEdge } from '../filters/edge.js';
import { detectPath } from '../filters/path2.js';

var gl;

function clamp(lo, value, hi) {
	return Math.max(lo, Math.min(value, hi));
}

function wrapTexture(texture) {
	return {
		_: texture,
		loadContentsOf: function(element) {
			// Make sure that we're using the correct global WebGL context
			gl = this._.gl;
			this._.loadContentsOf(element);
		},
		destroy: function() {
			// Make sure that we're using the correct global WebGL context
			gl = this._.gl;
			this._.destroy();
		}
	};
}

function texture(element) {
	return wrapTexture(Texture.fromElement(this._.gl, element));
	// return wrapTexture(wrap(Texture.fromElement)(element));
}

function initialize(width, height) {
	var type = gl.UNSIGNED_BYTE;

	// Go for floating point buffer textures if we can, it'll make the bokeh
	// filter look a lot better. Note that on Windows, ANGLE does not let you
	// render to a floating-point texture when linear filtering is enabled.
	// See https://crbug.com/172278 for more information.
	// if (gl.getExtension('OES_texture_float') && gl.getExtension('OES_texture_float_linear')) {
	// 	var testTexture = new Texture(gl, 100, 100, gl.RGBA, gl.FLOAT);
	// 	try {
	// 		// Only use gl.FLOAT if we can render to it
	// 		testTexture.drawTo(function() { type = gl.FLOAT; });
	// 	} catch (e) {
	// 	}
	// 	testTexture.destroy();
	// }

	if (this._.texture) this._.texture.destroy();
	if (this._.spareTexture) this._.spareTexture.destroy();
	this.width = width;
	this.height = height;
	this._.texture = new Texture(gl, width, height, gl.RGBA, type);
	this._.spareTexture = new Texture(gl, width, height, gl.RGBA, type);
	this._.extraTexture = this._.extraTexture || new Texture(gl, 0, 0, gl.RGBA, type);
	this._.flippedShader = this._.flippedShader || new Shader(gl, null, '\
		uniform sampler2D texture;\
		varying vec2 texCoord;\
		void main() {\
			gl_FragColor = texture2D(texture, vec2(texCoord.x, 1.0 - texCoord.y));\
		}\
	');
	this._.isInitialized = true;
}

/*
   Draw a texture to the canvas, with an optional width and height to scale to.
   If no width and height are given then the original texture width and height
   are used.
*/
function draw(texture, width, height) {
	if (!this._.isInitialized || texture._.width != this.width || texture._.height != this.height) {
		initialize.call(this, width ? width : texture._.width, height ? height : texture._.height);
	}

	const gl = this._.gl;

	texture._.use();
	this._.texture.drawTo(function() {
		Shader.getDefaultShader(gl).drawRect();
	});

	return this;
}

function update() {
	this._.texture.use();
	this._.flippedShader.drawRect();
	return this;
}

function simpleShader(shader, uniforms, textureIn, textureOut) {
	(textureIn || this._.texture).use();
	this._.spareTexture.drawTo(function() {
		shader.uniforms(uniforms).drawRect();
	});
	this._.spareTexture.swapWith(textureOut || this._.texture);
}

function replace(node) {
	node.parentNode.insertBefore(this, node);
	node.parentNode.removeChild(node);
	return this;
}

function contents() {
	const gl = this._.gl;
	var texture = new Texture(gl, this._.texture.width, this._.texture.height, gl.RGBA, gl.UNSIGNED_BYTE);
	this._.texture.use();
	texture.drawTo(function() {
		Shader.getDefaultShader(gl).drawRect();
	});
	return wrapTexture(texture);
}

/*
   Get a Uint8 array of pixel values: [r, g, b, a, r, g, b, a, ...]
   Length of the array will be width * height * 4.
*/
function getPixelArray() {
	var w = this._.texture.width;
	var h = this._.texture.height;
	var array = new Uint8Array(w * h * 4);
	this._.texture.drawTo(function() {
		gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, array);
	});
	return array;
}

function getPixelArrayFloat() {
	var w = this._.texture.width;
	var h = this._.texture.height;
	var array = new Float32Array(w * h);
	this._.texture.drawTo(function() {
		gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_FLOAT, array);
	});
	return array;
}

// function wrap(func) {
// 	return function() {
// 		// Make sure that we're using the correct global WebGL context
// 		gl = this._.gl;

// 		// Now that the context has been switched, we can call the wrapped function
// 		return func.apply(this, arguments);
// 	};
// }

// function wrap(func, ...args) {
// 	return func(this._.gl, ...args);
// }

// function wrap(func) {
//     return function(...args) {

// 		const oldgl = gl;

// 		console.log(gl);

// 		gl = this._.gl;

// 		try {
//             return func(...args);      // Call the original function
//         } finally {
//             gl = oldgl;  // Restore the original global variable
//         }
//     }
// }

// function wrap(func) {
//     return function (...args) {
//         // Create a Proxy that intercepts global variable access
//         const proxy = new Proxy(this, {
//             get(target, prop) {
//                 if (prop === 'gl') return this._.gl; // Redirect `globalVar`
//                 return Reflect.get(target, prop); // Default behavior
//             },
// 			set(target, prop, value) {
// 				Reflect.set(target, prop, value)
// 			}
//         });

//         // Use Function.prototype.call to execute in the context of the Proxy
//         return func.call(proxy, ...args);
//     };
// }

// function wrap(func) {
//     return function (...args) {
        
//         // Use Function.prototype.call to execute in the context of the Proxy
//         return func.call(globalThis, ...args);
//     };
// }

function wrap(func) {
	return function(...args) {

		return func.call(this, ...args);
	}
}

export function canvas() {

	const canvas = new OffscreenCanvas(512, 512);

	// var canvas = document.createElement('canvas');
	try {
		gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl', { premultipliedAlpha: false });
	} catch (e) {
		gl = null;
	}
	if (!gl) {
		throw 'This browser does not support WebGL';
	}
	canvas._ = {
		gl: gl,
		isInitialized: false,
		texture: null,
		spareTexture: null,
		flippedShader: null
	};


	// Core methods
	canvas.texture = texture.bind(canvas);;
	// canvas.draw = wrap(gl, draw);
	canvas.draw = draw.bind(canvas);
	canvas.update = update.bind(canvas);
	canvas.replace = replace.bind(canvas);
	canvas.contents = contents.bind(canvas);
	canvas.getPixelArray = getPixelArray.bind(canvas);
	canvas.getPixelArrayFloat = getPixelArrayFloat.bind(canvas);

	canvas.simpleShader = simpleShader.bind(canvas);
	

	// Filter methods
	canvas.brightnessContrast = wrap.bind(canvas)(brightnessContrast);
	canvas.hexagonalPixelate = wrap.bind(canvas)(hexagonalPixelate);
	canvas.hueSaturation = wrap.bind(canvas)(hueSaturation);
	canvas.colorHalftone = wrap.bind(canvas)(colorHalftone);
	canvas.triangleBlur = wrap.bind(canvas)(triangleBlur);
	canvas.unsharpMask = wrap.bind(canvas)(unsharpMask);
	canvas.perspective = wrap.bind(canvas)(perspective);
	canvas.matrixWarp = wrap.bind(canvas)(matrixWarp);
	canvas.bulgePinch = wrap.bind(canvas)(bulgePinch);
	canvas.tiltShift = wrap.bind(canvas)(tiltShift);
	canvas.dotScreen = wrap.bind(canvas)(dotScreen);
	canvas.edgeWork = wrap.bind(canvas)(edgeWork);
	canvas.lensBlur = wrap.bind(canvas)(lensBlur);
	canvas.zoomBlur = wrap.bind(canvas)(zoomBlur);
	canvas.noise = wrap.bind(canvas)(noise);
	canvas.denoise = wrap.bind(canvas)(denoise);
	canvas.curves = wrap.bind(canvas)(curves);
	canvas.swirl = wrap.bind(canvas)(swirl);
	canvas.ink = wrap.bind(canvas)(ink);
	canvas.vignette = wrap.bind(canvas)(vignette);
	canvas.vibrance = wrap.bind(canvas)(vibrance);
	canvas.sepia = wrap.bind(canvas)(sepia);
	canvas.detectMask = wrap.bind(canvas)(detectMask);
	canvas.detectEdge = wrap.bind(canvas)(detectEdge);
	canvas.detectPath = wrap.bind(canvas)(detectPath);

	return canvas;
};
