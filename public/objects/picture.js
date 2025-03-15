
import { Rect as Base } from "./rect.js";
import { LensBlur, TriangleBlur, ZoomBlur, Ink, BrightnessContrast, HueSaturation, Swirl, BulgePinch, Denoise, UnsharpMask, Noise, Sepia, Vignette, Vibrance } from "./filters.js";


let net; // tf

export class Picture extends Base {

	#file;
	#img;
	#bitmap;

	#mask;
	#maskPath;
	#maskX = 0;
	#maskY = 0;
	#maskScaleX = 1;
	#maskScaleY = 1;
	// #maskPoints;
	// #nodes;
	#filter;

	#imgX = 0;
	#imgY = 0;

	#imgWidth = 0;
	#imgHeight = 0;

	#keepProportion = true;
	#mirror = false;

	#cropX = 0;
	#cropY = 0;

	#cropWidth = 0;
	#cropHeight = 0;

	#clip;
	#blur = 0;

	get type() { return 'image'; }

	constructor(imgOrCtx) {
		super();

		if (imgOrCtx instanceof Picture) {
			this.#img = imgOrCtx.image();
			this.#img;
			this.#file = imgOrCtx.file;	
		}
		
	}

	get width() { return super.width; }
	get height() { return super.height; }

	set width(n) {
		super.width = n;
		this.#updateMaskPos();
	}

	set height(n) {
		super.height = n;
		this.#updateMaskPos();
	}

	// get strokeWidth() { return super.strokeWidth; }
	// set strokeWidth(n) {

	// 	const w = super.strokeWidth;

	// 	super.strokeWidth = n;

	// 	const d = Math.round((super.strokeWidth - w) / 2);

	// 	console.debug('Stroke: ', d);

	// 	this.x -= d;
	// 	this.#imgX += d;
	// 	this.width += 2*d;

	// 	this.y -= d;
	// 	this.#imgY += d;
	// 	this.height += 2*d;
	// }

	set file(f) { 
		// if (f instanceof File) { 
		// 	if (!this.#file) {
		// 		this.#file = f;
		// 		this.#img = this.load(f);
		// 	}
		// }
		this.#file = f;
	}

	set selected(b) {
		super.selected = b;

		// if (this.#maskPoints) {

		// 	if (b) {
		// 		const n = this.imgScale;
		// 		this.#nodes = this.#maskPoints.map(i => [i[0]*n, i[1]*n]);
		// 	}
		// 	else {
		// 		this.#nodes = null;
		// 	}

		// }
		
	}

	set imgX(n) { 
		if (typeof n == 'string') n = parseInt(n);
		this.#imgX = n; 
	}

	set imgY(n) { 
		if (typeof n == 'string') n = parseInt(n);
		this.#imgY = n; 
	}

	set imgWidth(n) { 
		if (typeof n == 'string') n = parseInt(n);
		if (n == 0) return;


		if (this.#imgWidth != 0 && this.#imgHeight != 0) {


			// let p = this.#imgHeight / (this.#imgWidth || 1);
			let p = this.#imgHeight / this.#imgWidth;

			// console.debug('## P', p);

			if (this.#keepProportion) {
				this.#imgHeight = Math.round(n * p);

				if (this.#imgHeight >= this.height) {
					this.#imgY = 0;
					this.height = this.#imgHeight;
				}
			}
		}

		this.#imgWidth = n; 

		if (this.#imgWidth >= this.width) {
			this.#imgX = 0;
			this.width = this.#imgWidth;
		}

		this.#updateMaskPos();
	}

	set imgHeight(n) { 
		if (typeof n == 'string') n = parseInt(n);
		if (n == 0) return;
		
		if (this.#imgWidth != 0 && this.#imgHeight != 0) {

			let p = this.#imgWidth / this.#imgHeight;

			if (this.#keepProportion) {
				this.#imgWidth = Math.round(n * p);

				if (this.#imgWidth >= this.width) {
					this.#imgX = 0;
					this.width = this.#imgWidth;
				}
			}
		}

		this.#imgHeight = n; 

		if (this.#imgHeight >= this.height) {
			this.#imgY = 0;
			this.height = this.#imgHeight;
		}

		this.#updateMaskPos();
	}

	set imgMirror(b) {
		this.#mirror = b;
	}

	set imgScale(n) {
		if (typeof n == 'string') n = parseFloat(n);
		if (isNaN(n) || n == 0) return;

		const resize = this.width == this.#imgWidth && this.height == this.#imgHeight;

		this.#imgWidth = Math.round(this.#img.width * n);
		this.#imgHeight = Math.round(this.#img.height * n);

		if (resize) {
			this.width = this.#imgWidth;
			this.height = this.#imgHeight;
		}
	}

	set imgKeepProportion(b) {
		this.#keepProportion = b;
	}

	set cropX(n) { 
		if (typeof n == 'string') n = parseInt(n);
		this.#cropX = n;
	}

	set cropY(n) { 
		if (typeof n == 'string') n = parseInt(n);
		this.#cropY = n; 
	}

	set cropWidth(n) { 
		if (typeof n == 'string') n = parseInt(n);
		this.#cropWidth = n;
	}

	set cropHeight(n) { 
		if (typeof n == 'string') n = parseInt(n);
		this.#cropHeight = n;
	}

	set cropMirror(b) {
		this.#mirror = b;
	}

	set mask(b) {
		
		if (b) {

			const sx = 1 / this.#maskScaleX
				, sy = 1 / this.#maskScaleY;
		

			this.#imgX = this.#cropX * sx;
			this.#imgY = this.#cropY * sy;

			this.#imgWidth = this.#cropWidth * sx;
			this.#imgHeight = this.#cropHeight * sy;

			this.fitSize();
		}
		else {

			const sx = this.#imgWidth / this.#cropWidth
				, sy = this.#imgHeight / this.#cropHeight;


			this.#imgWidth = this.#img.width * sx;
			this.#imgHeight = this.#img.height * sy;

			this.width = this.#imgWidth;
			this.height = this.#imgHeight;
		}

		this.#mask = b;
	}

	set maskPath(v) {
		this.#maskPath = v;
	}

	set maskX(n) {
		if (typeof n == 'string') n = parseInt(n);
		this.#maskX = n ?? 0;
	}

	set maskY(n) {
		if (typeof n == 'string') n = parseInt(n);
		this.#maskY = n ?? 0;
	}

	set maskScaleX(n) {
		if (typeof n == 'string') n = parseFloat(n);
		this.#maskScaleX = n;
	}

	set maskScaleY(n) {
		if (typeof n == 'string') n = parseFloat(n);
		this.#maskScaleY = n;
	}

	set blur(n) {
		if (typeof n == 'string') n = parseInt(n);
		if (this.#bitmap) this.#bitmap.close();

		this.#bitmap = n > 0 ? glfx.blur(this.#img, n) : null;
	}

	set filter(v) {

		if (this.#filter) {
			this.#filter.release();
			this.#filter = null;
		}

		switch (v) {

			case 'triangleBlur':
			this.#filter = new TriangleBlur(this);
			break;

			case 'zoomBlur':
			this.#filter = new ZoomBlur(this);
			break;

			case 'lensBlur':
			this.#filter = new LensBlur(this);
			break;

			case 'ink':
			this.#filter = new Ink(this);
			break;

			case 'contrast':
			this.#filter = new BrightnessContrast(this);
			break;

			case 'hue':
			this.#filter = new HueSaturation(this);
			break;

			case 'swirl':
			this.#filter = new Swirl(this);
			break;

			case 'bulge':
			this.#filter = new BulgePinch(this);
			break;

			case 'denoise':
			this.#filter = new Denoise(this);
			break;

			case 'unsharp':
			this.#filter = new UnsharpMask(this);
			break;

			case 'noise':
			this.#filter = new Noise(this);
			break;

			case 'sepia':
			this.#filter = new Sepia(this);
			break;

			case 'vignette':
			this.#filter = new Vignette(this);
			break;

			case 'vibrance':
			this.#filter = new Vibrance(this);
			break;
		}
	}

	set filterRadius(n) {
		if (!this.#filter) return;
		if (typeof n == 'string') n = parseInt(n);
		this.#filter.radius = n;
	}

	set filterStrength(n) {
		if (!this.#filter) return;
		if (typeof n == 'string') n = parseFloat(n);
		this.#filter.strength = n;
	}

	set filterBrightness(n) {
		if (!this.#filter) return;
		if (typeof n == 'string') n = parseFloat(n);
		this.#filter.brightness = n;
	}

	set filterAngle(n) {
		if (!this.#filter) return;
		if (typeof n == 'string') n = parseFloat(n);
		this.#filter.angle = n;
	}

	set filterContrast(n) {
		if (!this.#filter) return;
		if (typeof n == 'string') n = parseFloat(n);
		this.#filter.contrast = n;
	}

	set filterHue(n) {
		if (!this.#filter) return;
		if (typeof n == 'string') n = parseFloat(n);
		this.#filter.hue = n;
	}

	set filterSaturation(n) {
		if (!this.#filter) return;
		if (typeof n == 'string') n = parseFloat(n);
		this.#filter.saturation = n;
	}

	set filterExponent(n) {
		if (!this.#filter) return;
		if (typeof n == 'string') n = parseInt(n);
		this.#filter.exponent = n;
	}

	set filterAmount(n) {
		if (!this.#filter) return;
		if (typeof n == 'string') n = parseFloat(n);
		this.#filter.amount = n;
	}

	set filterSize(n) {
		if (!this.#filter) return;
		if (typeof n == 'string') n = parseFloat(n);
		this.#filter.size = n;
	}

	get file() { return this.#file; }

	get imgX() { return this.#imgX; }
	get imgY() { return this.#imgY; }
	get imgWidth() { return Math.round(this.#imgWidth); }
	get imgHeight() { return Math.round(this.#imgHeight); }
	get imgMirror() { return this.#mirror; }
	get imgScale() { return this.#imgWidth / this.#cropWidth; }
	// get imgKeepProportion() { return this.#keepProportion; }
	get cropX() { return this.#cropX; }
	get cropY() { return this.#cropY; }
	get cropWidth() { return this.#cropWidth; }
	get cropHeight() { return this.#cropHeight; }
	get mask() { return this.#mask; }
	get maskPath() { return typeof this.#maskPath == 'string' ? this.#maskPath : this.#maskPath?.id; }
	get maskX() { return this.#maskX; }
	get maskY() { return this.#maskY; }
	get maskScaleX() { return this.#maskScaleX; }
	get maskScaleY() { return this.#maskScaleY; }
	get blur() { return this.#blur; }

	get filter() { return this.#filter?.name; }
	get filterRadius() { return this.#filter?.radius ?? 0; }
	get filterStrength() { return this.#filter?.strength ?? 0; }
	get filterBrightness() { return this.#filter?.brightness ?? 0; }
	get filterAngle() { return this.#filter?.angle ?? 0; }
	get filterContrast() { return this.#filter?.contrast ?? 0; }
	get filterHue() { return this.#filter?.hue ?? 0; }
	get filterSaturation() { return this.#filter?.saturation ?? 0; }
	get filterExponent() { return this.#filter?.exponent ?? 0; }
	get filterAmount() { return this.#filter?.amount ?? 0; }
	get filterSize() { return this.#filter?.size ?? 0; }


	image() { return this.#img; }
	setImage(img) {
		this.#img = img;
		this.#file = this.#file || img._file;
		this.#imgWidth = this.#imgWidth || img.width;
		this.#imgHeight = this.#imgHeight || img.height;
		this.#cropWidth = this.#cropWidth || this.#imgWidth;
		this.#cropHeight = this.#cropHeight || this.#imgHeight;
		this.width = this.width || this.#imgWidth;
		this.height = this.height || this.#imgHeight;

		img._refs++;

		if (this.#filter)
			this.#filter.setBitmap();
	}

	glfx() { return glfx; }



	setMask(path) { 
		this.#mask = path.name;
		this.#maskPath = path;
	}

	applyMask(path) {

		const [X, Y] = this.center()
			, [pX, pY] = path.center();
	
		const sx = this.#imgWidth / this.#img.width
			, sy = this.#imgHeight / this.#img.height;

		this.#maskX = (pX - X) / sx;
		this.#maskY = (pY - Y) / sy;
		this.#maskScaleX = 1 / sx;
		this.#maskScaleY = 1 / sy;

		this.setMask(path);
		this.#applyMask();
	
	}

	clone() {

		this.#img._refs++;

		const o = super.clone();
		o.#img = this.#img;

		return o;
	}
	
	release() {
		if (this.#img && --this.#img._refs == 0) {
			URL.revokeObjectURL(this.#img.src);
		}

		if (this.#bitmap)
			this.#bitmap.close();
	}

	getPrivate() {
		const p = super.getPrivate();

		p.imgKeepProportion = this.#keepProportion;

		return p;
	}

	load(data) {

		const { filter, imgWidth, imgHeight, ...rest } = data;

		super.load(rest);

		if (filter)
			this.filter = filter;

		this.#imgWidth = imgWidth;
		this.#imgHeight = imgHeight;

		if (this.#mask)
			this.#updateMaskPos();
	}

	draw(ctx) {

		super.draw(ctx);

		const width = Math.min(this.width, this.#imgWidth)
			, height = Math.min(this.height, this.#imgHeight)
			, img = this.#filter?.getBitmap() || this.#img;

		// if (!this.#mask) 
		// 	this.drawRectangle(ctx);

		// console.debug('Draw image:', x, y, this.#imgWidth, this.#imgHeight);

		ctx.save();

		let { x, y } = this.setGeometry(ctx);

		x += this.#imgX;
		y += this.#imgY;

		// mirror
		if (this.#mirror) 
			ctx.scale(-1, 1);

		let path, X = 0, Y = 0, W = img.width, H = img.height;
		
		if (this.#mask) {
			const sx = (this.#imgWidth / this.#cropWidth) * this.#maskScaleX
				, sy = (this.#imgHeight / this.#cropHeight) * this.#maskScaleX;

			path = this.#maskPath.getPath(this.#maskX, this.#maskY, sx, sy);

			this.#maskPath.fillPathway(ctx, path, false, 0);

			ctx.save();
			ctx.clip(path);

			X = this.#cropX;
			Y = this.#cropY;
			W = this.#cropWidth;
			H = this.#cropHeight;
		}
		
		ctx.drawImage(img, X, Y, W, H, x, y, width, height);

		if (path) {
			ctx.restore();
			this.#maskPath.strokePath(ctx, path, false, 0);
		}

		if (this.#clip) {
			ctx.fillStyle = '#222';
			ctx.fill(this.#clip);
		}

		ctx.restore();

		// this.strokeBorder(ctx);
	}

	drawSelection(ctx) {
		if (this.strokeWidth == 0)
			this.drawBorder(ctx, 1, '#333', 0, true);

		super.drawSelection(ctx);
	}

	updateSize(x, y) {
		super.updateSize(x, y);

		if (Math.abs(this.width - this.#imgWidth) < 4)
			this.width = this.#imgWidth;

		if (Math.abs(this.height - this.#imgHeight) < 4)
			this.height = this.#imgHeight;
	}

	centerInBox() {
		const W = this.width
			, H = this.height
			, w = this.#imgWidth
			, h = this.#imgHeight
			;

		if (w < W)
			this.#imgX = Math.round((W - w) / 2);
		
		if (h < H)
			this.#imgY = Math.round((H - h) / 2);

		this.#maskX = 0;
		this.#maskY = 0;

		return { imgX: this.#imgX, imgY: this.#imgY };
	}

	fitSize() {

		// this.x += this.#cropX;
		// this.y += this.#cropY;

		this.width = this.#imgWidth;
		this.height = this.imgHeight;

		this.#imgX = 0;
		this.#imgY = 0;

		this.#maskX = 0;
		this.#maskY = 0;

		return { width: this.width, height: this.height, imgX: 0, imgY: 0 };
	}

	blurSlow(ctx, radius=this.#blur) {

		if (radius == 0) return;

		const x = this.x + this.#imgX
			, y = this.y + this.#imgY
			, width = this.#imgWidth
			, height = this.#imgHeight
			;

		const imageData = ctx.getImageData(x, y, width, height);
		const data = imageData.data;

		// Apply a simple blur effect (box blur)
		const tempData = new Uint8ClampedArray(data); // Copy original data

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let r = 0, g = 0, b = 0, count = 0;

				// Average pixels in a square around the current pixel
				for (let dy = -radius; dy <= radius; dy++) {
					for (let dx = -radius; dx <= radius; dx++) {
						const nx = x + dx;
						const ny = y + dy;

						// Ensure neighbor is within bounds
						if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
							const index = (ny * width + nx) * 4;
							r += tempData[index];
							g += tempData[index + 1];
							b += tempData[index + 2];
							count++;
						}
					}
				}

				// Set the pixel to the average color
				const index = (y * width + x) * 4;
				data[index] = r / count;       // Red
				data[index + 1] = g / count;  // Green
				data[index + 2] = b / count;  // Blue
				// Alpha remains unchanged
			}
		}

		// Put the modified image data back onto the canvas
		ctx.putImageData(imageData, x, y);
	}

	async loadImage(file, maxWidth=1200, maxHeight=900) {
		this.#file = file.name;

		let img = await Picture.load(file);

		console.debug('Image imported:', img.width, img.height);

		const dw = maxWidth - img.width;
		const dh = maxHeight - img.height;

		if (dw < 0 || dh < 0) {

			const r = (dw < dh) ? maxWidth / img.width : maxHeight / img.height
				, width = img.width * r
				, height = img.height * r;

			const canvas = offctx.canvas;

			canvas.width = width;
			canvas.height = height;

			offctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);

			URL.revokeObjectURL(img.src);

			// todo relase
			// this.#img = createImageBitmap(maskCanvas, 0, 0, width.height);

			// renders but tf not accept it
			// this.#img = maskCanvas.transferToImageBitmap();
			img = await canvasToImage(canvas);
		}

		img._refs = 0;
		img._file = file;

		this.setImage(img);

		return img;
	}

	toBlob() {

		if (!this.isModified()) 
			return this.#img._file;

		const canvas = offctx.canvas;

		// todo: rotation
		canvas.width = this.#imgWidth;
		canvas.height = this.#imgHeight;

		offctx.save();
		offctx.translate(-this.x, -this.y);

		this.draw(offctx);

		offctx.restore();

		let mime = this.#img._file?.type || 'image/jpg';

		if (this.#mask)
			mime = 'image/png';


		return canvasToBlob(canvas, mime);
	}

	isModified() {
		return this.#mirror ||
			this.#mask ||
			this.#img.width != this.#imgWidth ||
			this.#img.height != this.#imgHeight ||
			this.#filter;

	}

	async detectBodySelfie(threshold=0.7) {

		await loadTensorflow();

		const img = this.#bitmap || this.#img;

		const opt = {
			runtime: 'mediapipe', // or 'tfjs'
  			// solutionPath: 'dist/selfie_segmentation.js',
  			modelType: 'general'
		};

		const segmenter = await bodySegmentation.createSegmenter(bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation, opt);

		const segmentation = await segmenter.segmentPeople(img);

		// The mask image is an binary mask image with a 1 where there is a person and
		// a 0 where there is not.
		const coloredPartImage = await bodySegmentation.toBinaryMask(segmentation);

		this.#mask = createBinaryMaskPath(coloredPartImage);
	}

	#updateMaskPos() {

		const sx = (this.#imgWidth / this.#cropWidth) * this.#maskScaleX
			, sy = (this.#imgHeight / this.#cropHeight) * this.#maskScaleY;


		this.#maskX = this.width > this.#imgWidth
			? -(this.width - this.#imgWidth) / (2*sx) + this.#imgX
			: 0;

		this.#maskY = this.height > this.#imgHeight
			? -(this.height - this.#imgHeight) / (2*sy) + this.#imgY
			: 0;
	}

	#applyMask(x=this.#maskPath.x, y=this.#maskPath.y) {

		// console.debug('APPLY MASK:', x, y);

		const path = this.#maskPath
			, sx = 1 / this.#maskScaleX
			, sy = 1 / this.#maskScaleY
			, w = path.width * this.#maskScaleX
			, h = path.height * this.#maskScaleY;

		this.#cropX = (x - this.x) * this.#maskScaleX;
		this.#cropY = (y - this.y) * this.#maskScaleY;

		this.#cropWidth = w;
		this.#cropHeight = h;

		this.#imgX = this.#cropX * sx;
		this.#imgY = this.#cropY * sy;

		this.#imgWidth = this.#cropWidth * sx;
		this.#imgHeight = this.#cropHeight * sy;

		this.fitSize();
	}

	static load = loadImage;
	static thumb = createThumbnail;
}

function loadImage(fileOrBlob) {
	return new Promise((resolve, reject) => {

		const img = new Image;

		img.src = URL.createObjectURL(fileOrBlob);

		img.onload = () => resolve(img);
		img.onerror = reject;

	});
}

async function createThumbnail(image, maxWidth=100, maxHeight=100) {

	let blob;

	if (image instanceof Blob) {
		blob = image;
	}

	else {

		// Calculate the aspect ratio
		const aspectRatio = image.width / image.height;

		let thumbnailWidth = maxWidth;
		let thumbnailHeight = maxHeight;

		if (image.width > image.height) {
			thumbnailHeight = Math.min(maxHeight, maxWidth / aspectRatio);
		} else {
			thumbnailWidth = Math.min(maxWidth, maxHeight * aspectRatio);
		}

		const canvas = offctx.canvas;

		// Set canvas dimensions to the calculated size
		canvas.width = thumbnailWidth;
		canvas.height = thumbnailHeight;

		offctx.drawImage(image, 0, 0, thumbnailWidth, thumbnailHeight);

		blob = await canvasToBlob(canvas, 'image/jpg');
	}

	return URL.createObjectURL(blob);
}

function canvasToBlob(canvas, mime='image/png') {
	// return new Promise((resolve, reject) => canvas.toBlob(resolve, mime));
	return canvas.convertToBlob({ type: mime });
}

async function canvasToImage(canvas) {

	const blob = await canvasToBlob(canvas);

	return loadImage(blob);

}

function applyBlurEffect(image, gl) {

	const canvas = gl.canvas;

	canvas.width = image.width;
	canvas.height = image.height;

	// Flip the image vertically
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	// Create texture
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	gl.useProgram(program);

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


	// Set up WebGL to process the image
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

	// Create WebGL texture from the image
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	// Simulate applying blur (you can replace with actual shader code for a blur effect)
	// For simplicity, here we just render the image directly.

	// Draw the image to the OffscreenCanvas
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	// Convert the result from WebGL to a 2D image
	const imageBitmap = gl.canvas.transferToImageBitmap();

	return imageBitmap; // Return the ImageBitmap with the blur applied
}

function applyBlurEffect2(image) {
	return new Promise((resolve) => {
		// Set up WebGL to process the image
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

		// Create WebGL texture from the image
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		// Simulate applying blur (you can replace with actual shader code for a blur effect)
		// For simplicity, here we just render the image directly.

		// Draw the image to the OffscreenCanvas
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// Convert the result from WebGL to a 2D image
		const imageBitmap = offscreenCanvas.transferToImageBitmap();
		resolve(imageBitmap); // Return the ImageBitmap with the blur applied
	});
}

function invertMask(mask) {

	const data = mask.data;

	for (let i = 0; i < data.length; i += 4) {
		// Invert the alpha channel (255 - alpha)
		data[i + 3] = 255 - data[i + 3];
	}

}

function applyMaskAndDraw(ctx, image, mask, x, y, width, height) {
	// Create a temporary canvas for the mask
	// const maskCanvas = document.createElement('canvas');
	// const maskCtx = maskCanvas.getContext('2d');
	maskCanvas.width = mask.width;
	maskCanvas.height = mask.height;

	// Draw the mask image data onto the temporary mask canvas
	maskCtx.putImageData(mask, 0, 0);

	// Get the mask image data pixels
	const maskData = maskCtx.getImageData(0, 0, mask.width, mask.height);
	const data = maskData.data;

	// Begin a new path for the main canvas
	ctx.save(); // Save the current state of the main canvas
	ctx.beginPath();

	// Create a path based on non-transparent pixels in the mask
	for (let i = 0; i < data.length; i += 4) {
		const alpha = data[i + 3]; // Alpha channel
		if (alpha > 0) {
			const px = (i / 4) % mask.width;
			const py = Math.floor(i / 4 / mask.width);
			ctx.rect(x + px, y + py, 1, 1);
		}
	}

	// Clip the drawing region to the defined path
	ctx.clip();

	// Draw the image onto the main canvas within the clipped region
	ctx.drawImage(image, x, y, width, height);

	// Restore the original state of the canvas to remove the clip
	ctx.restore();
}

function drawImageWithMask(ctx, image, maskPath, scale, x, y, width, height) {

	console.debug('Draw image with mask', scale, x, y, width, height);

	ctx.save();
	ctx.translate(x, y); // Move the context to the correct position
	ctx.scale(scale, scale);

	// Apply the precomputed mask path
	ctx.clip(maskPath);

	// Draw the image within the clipped area
	ctx.drawImage(image, 0, 0, width, height);

	ctx.restore();
}


function createMaskPath(mask) {
	const path = new Path2D();
	const { width, height, data } = mask;

	for (let i = 0; i < data.length; i += 4) {
		const alpha = data[i + 3]; // Alpha channel
		if (alpha > 0) {
			const px = (i / 4) % width;
			const py = Math.floor(i / 4 / width);
			path.rect(px, py, 1, 1);
		}
	}

	return path;
}

function createBinaryMaskPath(mask) {
	const path = new Path2D();

	console.log(mask);

	return path;
}

function createMaskPath2(mask) {
	const { width, height, data } = mask;
	const edgePoints = [];

	// Find edge points by detecting where the alpha changes from 0 to > 0
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			const alpha = data[i + 3];

			if (alpha > 	0) {
				// Check if any neighbor is transparent (indicating an edge)
				if (
					x === 0 || y === 0 || x === width - 1 || y === height - 1 ||
					data[((y - 1) * width + x) * 4 + 3] === 0 ||
					data[((y + 1) * width + x) * 4 + 3] === 0 ||
					data[(y * width + (x - 1)) * 4 + 3] === 0 ||
					data[(y * width + (x + 1)) * 4 + 3] === 0
				) {
					edgePoints.push([x, y]);
				}
			}
		}
	}

	// Function to smooth points using a simplified Chaikin's algorithm
	function smoothPoints(points) {
		const smoothed = [];
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[i];
			const p1 = points[i + 1];

			const q = [(3 * p0[0] + p1[0]) / 4, (3 * p0[1] + p1[1]) / 4];
			const r = [(p0[0] + 3 * p1[0]) / 4, (p0[1] + 3 * p1[1]) / 4];

			smoothed.push(q);
			smoothed.push(r);
		}
		return smoothed;
	}

	// Smooth the edge points to create smoother curves
	let smoothedPoints = smoothPoints(edgePoints);

	// Create the Path2D and draw the Bezier curve
	const path = new Path2D();

	if (smoothedPoints.length > 0) {
		// Move to the first point
		path.moveTo(smoothedPoints[0][0], smoothedPoints[0][1]);

		for (let i = 1; i < smoothedPoints.length - 2; i += 2) {
			const cp1 = smoothedPoints[i];
			const cp2 = smoothedPoints[i + 1];
			const end = smoothedPoints[i + 2];
			path.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], end[0], end[1]);
		}

		// Close the path by connecting back to the first point
		path.closePath();
	}

	return path;
}

function createMaskPath3(mask) {
	const { width, height, data } = mask;
	const edgePoints = [];

	// Step 1: Detect edge points by finding boundary pixels
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const i = (y * width + x) * 4;
			const alpha = data[i + 3];

			if (alpha > 0) {
				// Check if the current pixel has any neighboring transparent pixel (indicating an edge)
				if (
					data[((y - 1) * width + x) * 4 + 3] === 0 ||
					data[((y + 1) * width + x) * 4 + 3] === 0 ||
					data[(y * width + (x - 1)) * 4 + 3] === 0 ||
					data[(y * width + (x + 1)) * 4 + 3] === 0
				) {
					edgePoints.push([x, y]);
				}
			}
		}
	}

	// Step 2: Sort the edge points to create a continuous path
	function sortEdgePoints(points) {
		if (points.length === 0) return [];

		const sorted = [points.shift()];
		
		while (points.length > 0) {
			const lastPoint = sorted[sorted.length - 1];
			let closestIndex = 0;
			let closestDistance = Infinity;

			for (let i = 0; i < points.length; i++) {
				const [x1, y1] = lastPoint;
				const [x2, y2] = points[i];
				const distance = Math.hypot(x2 - x1, y2 - y1);

				if (distance < closestDistance) {
					closestDistance = distance;
					closestIndex = i;
				}
			}

			sorted.push(points.splice(closestIndex, 1)[0]);
		}

		return sorted;
	}

	const sortedPoints = sortEdgePoints(edgePoints);

	// Step 3: Smooth the points using Chaikin's Algorithm
	function smoothPoints(points, iterations = 2) {
		let smoothed = points;

		for (let it = 0; it < iterations; it++) {
			const newPoints = [];
			for (let i = 0; i < smoothed.length - 1; i++) {
				const p0 = smoothed[i];
				const p1 = smoothed[i + 1];

				const q = [(3 * p0[0] + p1[0]) / 4, (3 * p0[1] + p1[1]) / 4];
				const r = [(p0[0] + 3 * p1[0]) / 4, (p0[1] + 3 * p1[1]) / 4];

				newPoints.push(q);
				newPoints.push(r);
			}
			newPoints.push(smoothed[smoothed.length - 1]); // Add the last point
			smoothed = newPoints;
		}

		return smoothed;
	}

	// const smoothedPoints = smoothPoints(sortedPoints);
	const smoothedPoints = reducePoints(smoothPoints(sortedPoints), 60);
	// const smoothedPoints = smoothAndReducePoints(sortedPoints, 60);

	console.debug(smoothedPoints);

	const path = pathFromPoints(smoothedPoints);

	return [ path, smoothedPoints ];
}

function pathFromPoints(points) {
	// Step 4: Create the Path2D with Bezier curves
	const path = new Path2D();
	if (points.length > 0) {
		path.moveTo(points[0][0], points[0][1]);

		for (let i = 1; i < points.length - 2; i += 2) {
			const cp1 = points[i];
			const cp2 = points[i + 1];
			const end = points[i + 2];
			path.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], end[0], end[1]);
		}

		path.closePath();
	}

	return path;
}

async function loadTensorflow() {
	if (!net) {
		net = await bodyPix.load({
			//architecture: 'MobileNetV1',
			architecture: 'ResNet50',
			outputStride: 16,
			// multiplier: 0.75,
			multiplier: 1, // For resnet50
			quantBytes: 2
		});

		// maskCanvas = document.createElement('canvas');
		// maskCtx = maskCanvas.getContext('2d');
	}
}

function reducePoints(points, targetCount) {
	if (points.length <= targetCount) {
		return points; // No need to reduce if there are fewer points than the target
	}

	// Step 1: Calculate cumulative distances along the path
	const distances = [0]; // First point has distance 0
	for (let i = 1; i < points.length; i++) {
		const [x1, y1] = points[i - 1];
		const [x2, y2] = points[i];
		const distance = Math.hypot(x2 - x1, y2 - y1);
		distances.push(distances[i - 1] + distance);
	}

	const totalLength = distances[distances.length - 1];

	// Step 2: Calculate the interval length for resampling
	const interval = totalLength / (targetCount - 1);

	// Step 3: Resample points at regular intervals
	const resampledPoints = [points[0]]; // Start with the first point
	let currentDistance = interval;
	
	for (let i = 1; i < distances.length; i++) {
		while (currentDistance <= distances[i]) {
			// Linear interpolation between points[i - 1] and points[i]
			const t = (currentDistance - distances[i - 1]) / (distances[i] - distances[i - 1]);
			const [x1, y1] = points[i - 1];
			const [x2, y2] = points[i];
			const interpolatedPoint = [
				x1 + t * (x2 - x1),
				y1 + t * (y2 - y1)
			];

			resampledPoints.push(interpolatedPoint);
			currentDistance += interval;
		}
	}

	// Ensure the last point is included
	resampledPoints.push(points[points.length - 1]);

	return resampledPoints;
}

function smoothAndReducePoints(points, targetCount) {
	if (points.length < 3) {
		return points; // Not enough points to smooth
	}

	// Step 1: Smooth the points using a simple Catmull-Rom spline
	function catmullRomSpline(points, numSegments = 10) {
		const smoothedPoints = [];
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[Math.max(i - 1, 0)];
			const p1 = points[i];
			const p2 = points[i + 1];
			const p3 = points[Math.min(i + 2, points.length - 1)];

			for (let t = 0; t <= 1; t += 1 / numSegments) {
				const t2 = t * t;
				const t3 = t2 * t;

				const x = 0.5 * (
					(2 * p1[0]) +
					(-p0[0] + p2[0]) * t +
					(2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
					(-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
				);

				const y = 0.5 * (
					(2 * p1[1]) +
					(-p0[1] + p2[1]) * t +
					(2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
					(-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
				);

				smoothedPoints.push([x, y]);
			}
		}
		smoothedPoints.push(points[points.length - 1]); // Add the last point
		return smoothedPoints;
	}

	// Step 2: Reduce the points by resampling to the target count
	function resamplePoints(points, targetCount) {
		const distances = [0];
		for (let i = 1; i < points.length; i++) {
			const [x1, y1] = points[i - 1];
			const [x2, y2] = points[i];
			distances.push(distances[i - 1] + Math.hypot(x2 - x1, y2 - y1));
		}

		const totalLength = distances[distances.length - 1];
		const interval = totalLength / (targetCount - 1);

		const resampledPoints = [points[0]];
		let currentDistance = interval;

		for (let i = 1; i < distances.length; i++) {
			while (currentDistance <= distances[i]) {
				const t = (currentDistance - distances[i - 1]) / (distances[i] - distances[i - 1]);
				const [x1, y1] = points[i - 1];
				const [x2, y2] = points[i];
				resampledPoints.push([
					x1 + t * (x2 - x1),
					y1 + t * (y2 - y1)
				]);
				currentDistance += interval;
			}
		}

		resampledPoints.push(points[points.length - 1]);
		return resampledPoints;
	}

	// Step 3: Remove collinear points
	function removeCollinearPoints(points) {
		if (points.length <= 2) {
			return points;
		}

		const reducedPoints = [points[0]];

		for (let i = 1; i < points.length - 1; i++) {
			const [x1, y1] = reducedPoints[reducedPoints.length - 1];
			const [x2, y2] = points[i];
			const [x3, y3] = points[i + 1];

			if ((x2 - x1) * (y3 - y1) !== (y2 - y1) * (x3 - x1)) {
				reducedPoints.push(points[i]);
			}
		}

		reducedPoints.push(points[points.length - 1]);
		return reducedPoints;
	}

	// Perform smoothing, resampling, and reduction
	const smoothedPoints = catmullRomSpline(points);
	const resampledPoints = resamplePoints(smoothedPoints, targetCount);
	return removeCollinearPoints(resampledPoints);
}
