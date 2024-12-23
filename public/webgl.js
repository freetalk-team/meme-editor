import { canvas } from './glfx/core/canvas.js';

export class WebGL {
	#canvas = canvas();

	triangleBlur(image, radius=5) {

		const canvas = this.#canvas;

		// this.#canvas.width = image.width;
		// this.#canvas.height = image.height;

		const texture = canvas.texture(image);

		canvas.draw(texture).triangleBlur(radius).update();

		const imageBitmap = canvas.transferToImageBitmap();

		return imageBitmap; // Return the ImageBitmap with the blur applied
	}

	zoomBlur(image, strength=0.3, x=image.width/2, y=image.height/2) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).zoomBlur(x, y, strength).update();

		return canvas.transferToImageBitmap();
	}

	lensBlur(image, radius, brightness, angle) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).lensBlur(radius, brightness, angle).update();

		return canvas.transferToImageBitmap();
	}

	ink(image, strength=0.25) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).ink(strength).update();

		return canvas.transferToImageBitmap();
	}

	brightnessContrast(image, brightness=0, contrast=0) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).brightnessContrast(brightness, contrast).update();

		return canvas.transferToImageBitmap();
	}

	hueSaturation(image, hue=0, saturation=0) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).hueSaturation(hue, saturation).update();

		return canvas.transferToImageBitmap();
	}

	swirl(image, radius, angle, x=image.width/2, y=image.height/2) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).swirl(x, y, radius, angle).update();

		return canvas.transferToImageBitmap();
	}

	bulgePinch(image, radius, strength, x=image.width/2, y=image.height/2) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).bulgePinch(x, y, radius, strength).update();

		return canvas.transferToImageBitmap();
	}

	denoise(image, exponent) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).denoise(exponent).update();

		return canvas.transferToImageBitmap();
	}

	unsharpMask(image, radius, strength) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).unsharpMask(radius, strength).update();

		return canvas.transferToImageBitmap();
	}

	noise(image, amount) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).noise(amount).update();

		return canvas.transferToImageBitmap();
	}

	sepia(image, amount) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).sepia(amount).update();

		return canvas.transferToImageBitmap();
	}

	vignette(image, size, amount) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).vignette(size, amount).update();

		return canvas.transferToImageBitmap();
	}

	vibrance(image, amount) {
		const canvas = this.#canvas;
		const texture = canvas.texture(image);

		canvas.draw(texture).vibrance(amount).update();

		return canvas.transferToImageBitmap();
	}
}




/*
class WebGL {

	#ctx;

	constructor(canvas = new OffscreenCanvas(1024, 1024)) {

		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

		if (!gl) {
			alert("WebGL is not supported in your browser.");
			throw new Error("WebGL not supported.");
		}

		// Vertex Shader
		const vertexShaderSource = `
			attribute vec2 a_position;
			attribute vec2 a_texCoord;
			varying vec2 v_texCoord;
			void main() {
				gl_Position = vec4(a_position, 0.0, 1.0);
				v_texCoord = a_texCoord;
			}
		`;

		// Fragment Shader (Gaussian Blur)
		const fragmentShaderSource = `
			precision mediump float;

			uniform sampler2D u_image;
			uniform int u_radius; 
			uniform vec2 u_resolution;
			uniform vec2 u_direction;
			varying vec2 v_texCoord;

			void main() {
				vec4 color = vec4(0.0);
				float kernel[5];
				kernel[0] = 0.05;
				kernel[1] = 0.1;
				kernel[2] = 0.4;
				kernel[3] = 0.1;
				kernel[4] = 0.05;

				int r = u_radius * u_radius;

				const int MAX_RADIUS = 10;

				for (int i = -MAX_RADIUS; i <= MAX_RADIUS; i++) {

					if (i * i < r) 
						color += texture2D(u_image, v_texCoord + u_direction * float(i) / u_resolution) * kernel[i + 2];
				}

				gl_FragColor = color;
			}
		`;


		// Compile Shader
		function compileShader(type, source) {
			const shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(shader));
				gl.deleteShader(shader);
				return null;
			}
			return shader;
		}

		const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

		// Create Program
		const program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error(gl.getProgramInfoLog(program));
			return;
		}

		// Look up attributes and uniforms
		const a_position = gl.getAttribLocation(program, 'a_position');
		const a_texCoord = gl.getAttribLocation(program, 'a_texCoord');
		const u_image = gl.getUniformLocation(program, 'u_image');
		const u_resolution = gl.getUniformLocation(program, 'u_resolution');
		const u_direction = gl.getUniformLocation(program, 'u_direction');
		const u_radius = gl.getUniformLocation(program, 'u_radius');

		// Set up positions
		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			-1, -1, 1, -1, -1, 1,
			-1, 1, 1, -1, 1, 1,
		]), gl.STATIC_DRAW);

		// Set up texture coordinates
		const texCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			0, 0, 1, 0, 0, 1,
			0, 1, 1, 0, 1, 1,
		]), gl.STATIC_DRAW);

		this.blur = function(image, radius=5) {

			

			canvas.width = image.width;
			canvas.height = image.height;

			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

			// Set up WebGL and create a texture
			gl.viewport(0, 0, image.width, image.height);

			// Create texture
			const texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

			gl.useProgram(program);

			// Set radius
			gl.uniform1i(u_radius, radius);

			// Set resolution
			gl.uniform2f(u_resolution, canvas.width, canvas.height);

			// Set up position attribute
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.enableVertexAttribArray(a_position);
			gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

			// Set up texture coordinate attribute
			gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
			gl.enableVertexAttribArray(a_texCoord);
			gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

			// Render (Horizontal Blur)
			gl.uniform2f(u_direction, 1.0, 0.0); // Horizontal blur
			gl.drawArrays(gl.TRIANGLES, 0, 6);

			// Render (Vertical Blur)
			gl.uniform2f(u_direction, 0.0, 1.0); // Vertical blur
			gl.drawArrays(gl.TRIANGLES, 0, 6);

			// Convert the result from WebGL to a 2D image
			const imageBitmap = gl.canvas.transferToImageBitmap();

			return imageBitmap; // Return the ImageBitmap with the blur applied
		}

		this.#ctx = gl;
	}
}

*/
