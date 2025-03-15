import { canvas } from './glfx/core/canvas.js';

export class WebGL {
	#canvas = canvas();

	detectMask(image, color, threshold=0.1) {
		const canvas = this.#canvas
			, width = image.width
			, height = image.height;

		if (typeof color == 'string') {
			color = hexToRgb(color).map(i => i / 255);
		}

		console.debug('Detecting color', color);

		// this.#canvas.width = image.width;
		// this.#canvas.height = image.height;

		const texture = canvas.texture(image);
		canvas.draw(texture).detectMask(color, threshold).update();
		// canvas.draw(texture).update(); working

		const pixelData = canvas.getPixelArray();

		const binaryMask = [];
		for (let i = 0; i < width * height * 4; i += 4) {
			const r = pixelData[i] / 255;
			if (r > 0.9) { // If it's red, part of the region
				binaryMask.push(1);
			} else {
				binaryMask.push(0);
			}
		}

		console.log('####', binaryMask);

		// return pixelData;

		// for test to draw the mask
		const imageBitmap = canvas.transferToImageBitmap();
		return imageBitmap; // Return the ImageBitmap with the blur applied
	}

	detectEdge(image, color, threshold=0.1) {
		const canvas = this.#canvas
			, width = image.width
			, height = image.height;

		if (typeof color == 'string')
			color = hexToRgb(color).map(i => i / 255);

		const texture = canvas.texture(image);
		canvas.draw(texture).detectEdge(color, threshold).update();

		const imageBitmap = canvas.transferToImageBitmap();

		return imageBitmap; // Return the ImageBitmap with the blur applied
	}

	detectPath(image, color, threshold=0.1, highlightColor='#ff0000', fillColor='#000000') {
		const canvas = this.#canvas
			, width = image.width
			, height = image.height;

		if (typeof color == 'string')
			color = hexToRgb(color).map(i => i / 255);

		if (typeof highlightColor == 'string')
			highlightColor = hexToRgb(highlightColor).map(i => i / 255);

		if (typeof fillColor == 'string')
			fillColor = hexToRgb(fillColor).map(i => i / 255);

		const texture = canvas.texture(image);
		canvas.draw(texture).detectMask(color, threshold, highlightColor, fillColor).update();

		// const imageData = canvas.getPixelArray();

		// // let contours = extractContours(imageData, canvas.width, canvas.height);
		// // let simplifiedContours = contours.map(contour => simplifyPath(contour, 2.0));
		// // let bezierPaths = simplifiedContours.map(fitBezierPath);

		// console.debug(bezierPaths);

		const pixels = canvas.getPixelArray();

		return pixels;

		// // Extract points
		// const points = [];
		// for (let y = 0; y < height; y++) {
		// 	for (let x = 0; x < width; x++) {
		// 		const index = (y * width + x) * 4;
		// 		if (pixels[index] === 255) { // Check if the pixel is red
		// 			points.push({ x, y });
		// 		}
		// 	}
		// }

		// const simplifiedPoints = simplifyPath(points, 2.0); // Adjust epsilon as needed
		// const bezierCurves = fitBezierCurves(simplifiedPoints, 5.0); // Adjust maxError as needed

		// console.log('Curves', bezierCurves);

		// // const imageBitmap = canvas.transferToImageBitmap();

		// // return imageBitmap;
		// return bezierCurves;
	}

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


function hexToRgb(hex) {
    // Remove the '#' if present
    hex = hex.replace(/^#/, '');
    
    // Expand shorthand hex (e.g., #F53 → #FF5533)
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    // Convert to RGB values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
	let a = 255;

	if (hex.length == 8)
		a = parseInt(hex.substring(6, 8), 16);


    return [r, g, b, a]; // Returns an array [r, g, b]
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

function simplifyPath(points, epsilon) {
    if (points.length <= 2) return points;

    let maxDistance = 0;
    let index = 0;

    for (let i = 1; i < points.length - 1; i++) {
        const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
        if (distance > maxDistance) {
            maxDistance = distance;
            index = i;
        }
    }

    if (maxDistance > epsilon) {
        const left = simplifyPath(points.slice(0, index + 1), epsilon);
        const right = simplifyPath(points.slice(index), epsilon);
        return left.slice(0, -1).concat(right);
    } else {
        return [points[0], points[points.length - 1]];
    }
}

function perpendicularDistance(point, lineStart, lineEnd) {
    const numerator = Math.abs(
        (lineEnd.y - lineStart.y) * point.x -
        (lineEnd.x - lineStart.x) * point.y +
        lineEnd.x * lineStart.y -
        lineEnd.y * lineStart.x
    );
    const denominator = Math.sqrt(
        Math.pow(lineEnd.y - lineStart.y, 2) + Math.pow(lineEnd.x - lineStart.x, 2)
    );
    return numerator / denominator;
}

function fitBezierCurves(points, maxError) {
    const curves = [];
    let left = 0;

    while (left < points.length - 1) {
        let right = points.length - 1;
        let bezier = fitSingleBezier(points.slice(left, right + 1));

        while (calculateError(points.slice(left, right + 1), bezier) > maxError) {
            right--;
            bezier = fitSingleBezier(points.slice(left, right + 1));
        }

        curves.push(bezier);
        left = right;
    }

    return curves;
}

function fitSingleBezier(points) {
    // Fit a single Bézier curve to the points
    // This is a simplified implementation; consider using a library for better results
    const p0 = points[0];
    const p3 = points[points.length - 1];
    const p1 = { x: (p0.x + p3.x) / 2, y: (p0.y + p3.y) / 2 }; // Placeholder for control points
    const p2 = { x: (p0.x + p3.x) / 2, y: (p0.y + p3.y) / 2 }; // Placeholder for control points
    return [p0, p1, p2, p3];
}

function calculateError(points, bezier) {
    // Calculate the error between the points and the Bézier curve
    let error = 0;
    for (const point of points) {
        const t = findClosestT(bezier, point);
        const curvePoint = bezierPoint(bezier, t);
        error += Math.pow(point.x - curvePoint.x, 2) + Math.pow(point.y - curvePoint.y, 2);
    }
    return Math.sqrt(error);
}

function findClosestT(bezier, point, tolerance = 0.0001) {
    let t = 0.5; // Start with the midpoint
    let step = 0.25; // Initial step size

    // Perform a binary search to find the closest t
    for (let i = 0; i < 100; i++) { // Limit iterations to avoid infinite loops
        const distance1 = distanceSquared(point, bezierPoint(bezier, t - step));
        const distance2 = distanceSquared(point, bezierPoint(bezier, t));
        const distance3 = distanceSquared(point, bezierPoint(bezier, t + step));

        if (distance1 < distance2) {
            t -= step;
        } else if (distance3 < distance2) {
            t += step;
        } else {
            step /= 2; // Reduce step size for finer precision
        }

        if (step < tolerance) break; // Stop when the step size is small enough
    }

    return t;
}

function distanceSquared(p1, p2) {
    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
}


function bezierPoint(bezier, t) {
    const [p0, p1, p2, p3] = bezier;
    const u = 1 - t;
    return {
        x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
}


// function extractContours(imageData, width, height) {
// 	const contours = [];
// 	const visited = new Set();

// 	function isEdge(x, y) {
// 		if (x < 0 || y < 0 || x >= width || y >= height) return false;
// 		return imageData[(y * width + x) * 4] > 128; // Check if pixel is part of edge
// 	}

// 	function traceContour(startX, startY) {
// 		let x = startX, y = startY;
// 		let contour = [];
// 		let directions = [[1,0], [0,1], [-1,0], [0,-1]]; // Right, Down, Left, Up
// 		let dir = 0; // Start direction

// 		do {
// 			contour.push([x, y]);
// 			visited.add(`${x},${y}`);

// 			for (let i = 0; i < 4; i++) {
// 				let newDir = (dir + i) % 4;
// 				let nx = x + directions[newDir][0];
// 				let ny = y + directions[newDir][1];

// 				if (isEdge(nx, ny) && !visited.has(`${nx},${ny}`)) {
// 					x = nx;
// 					y = ny;
// 					dir = newDir;
// 					break;
// 				}
// 			}
// 		} while (x !== startX || y !== startY);

// 		return contour;
// 	}

// 	for (let y = 0; y < height; y++) {
// 		for (let x = 0; x < width; x++) {
// 			if (isEdge(x, y) && !visited.has(`${x},${y}`)) {
// 				contours.push(traceContour(x, y));
// 			}
// 		}
// 	}

// 	return contours;
// }

// function simplifyPath(points, epsilon) {
// 	if (points.length < 3) return points;

// 	let dmax = 0;
// 	let index = 0;
// 	let end = points.length - 1;

// 	for (let i = 1; i < end; i++) {
// 		let d = perpendicularDistance(points[i], points[0], points[end]);
// 		if (d > dmax) {
// 			index = i;
// 			dmax = d;
// 		}
// 	}

// 	if (dmax > epsilon) {
// 		let left = simplifyPath(points.slice(0, index + 1), epsilon);
// 		let right = simplifyPath(points.slice(index, end + 1), epsilon);
// 		return [...left.slice(0, left.length - 1), ...right];
// 	} else {
// 		return [points[0], points[end]];
// 	}
// }

// function perpendicularDistance(pt, lineStart, lineEnd) {
// 	let num = Math.abs(
// 		(lineEnd[1] - lineStart[1]) * pt[0] - (lineEnd[0] - lineStart[0]) * pt[1] + 
// 		lineEnd[0] * lineStart[1] - lineEnd[1] * lineStart[0]
// 	);
// 	let den = Math.sqrt(
// 		Math.pow(lineEnd[1] - lineStart[1], 2) + Math.pow(lineEnd[0] - lineStart[0], 2)
// 	);
// 	return num / den;
// }

// function fitBezierPath(points) {
// 	const path = new Path2D();
// 	if (points.length < 2) return path;

// 	path.moveTo(points[0][0], points[0][1]);

// 	for (let i = 1; i < points.length - 1; i++) {
// 		let midX = (points[i][0] + points[i + 1][0]) / 2;
// 		let midY = (points[i][1] + points[i + 1][1]) / 2;
// 		path.quadraticCurveTo(points[i][0], points[i][1], midX, midY);
// 	}

// 	path.lineTo(points[points.length - 1][0], points[points.length - 1][1]);

// 	return path;
// }