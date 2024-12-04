
import { Rect } from "./rect.js";
// import { Human } from './human.js';

// let human;

export class Picture extends Rect {

	#file;
	#img;

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
	#blur = 5;

	get type() { return 'image'; }

	set file(f) { 
		if (f instanceof File) { 
			this.#file = f;
			this.#img = this.load(f);
		}
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

		// let p = this.#imgHeight / (this.#imgWidth || 1);
		let p = this.#cropHeight / (this.#cropWidth || 1);

		console.debug('## P', p);

		this.#imgWidth = n; 

		if (this.#keepProportion)
			this.#imgHeight = this.#imgWidth * p;
	}

	set imgHeight(n) { 
		if (typeof n == 'string') n = parseInt(n);
		if (n == 0) return;

		let p = this.#imgWidth / (this.#imgHeight || 1);

		this.#imgHeight = n; 

		if (this.#keepProportion)
			this.#imgWidth = this.#imgHeight * p;
	}

	set imgMirror(b) {
		this.#mirror = b;
	}

	set imgScale(n) {
		if (typeof n == 'string') n = parseFloat(n);
		if (isNaN(n) || n == 0) return;

		const resize = this.width == this.#imgWidth && this.height == this.#imgHeight;

		this.#imgWidth = this.#img.width * n;
		this.#imgHeight = this.#img.height * n;

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

	get file() { return this.#file; }

	get imgX() { return this.#imgX; }
	get imgY() { return this.#imgY; }
	get imgWidth() { return Math.round(this.#imgWidth); }
	get imgHeight() { return Math.round(this.#imgHeight); }
	get imgMirror() { return this.#mirror; }
	get imgScale() { return this.#imgWidth / this.#img.width; }
	get imgKeepProportion() { return this.#keepProportion; }
	get cropX() { return this.#cropX; }
	get cropY() { return this.#cropY; }
	get cropWidth() { return this.#cropWidth; }
	get cropHeight() { return this.#cropHeight; }

	
	release() {
		if (this.#img)
			URL.revokeObjectURL(this.#img.src);
	}

	draw(ctx) {

		this.drawRectangle(ctx);

		const x = this.x + this.#imgX
			, y = this.y + this.#imgY
			, width = Math.min(this.width, this.#imgWidth)
			, height = Math.min(this.height, this.#imgHeight)
			;

		// console.debug('Draw image:', x, y, this.#imgWidth, this.#imgHeight);

		ctx.save();

		// mirror
		if (this.#mirror) {
			ctx.translate(x, y);
			ctx.scale(-1, 1);
			// ctx.drawImage(this.#img, 0, 0, -this.#imgWidth, this.#imgHeight);
			ctx.drawImage(this.#img, 
				this.#cropX, this.#cropY, this.#cropWidth, this.#cropHeight,
				0, 0, -width, height);
		}
		else {
			ctx.drawImage(this.#img, 
				this.#cropX, this.#cropY, this.#cropWidth, this.#cropHeight,
				x, y, width, height);
		}

		// this.blur(ctx);

		if (this.#clip) {
			ctx.fillStyle = '#222';
			ctx.fill(this.#clip);
		}

		ctx.restore();

		this.drawBorder(ctx, this.strokeWidth, this.stroke);
		this.drawSelection(ctx);
	}

	updateSize(x, y) {

		super.updateSize(x, y);

		if (Math.abs(this.width - this.#imgWidth) < 4)
			this.width = this.#imgWidth;

		if (Math.abs(this.height - this.#imgHeight) < 4)
			this.height = this.#imgHeight;

	}

	image() {
		return this.#img;
	}

	blur(ctx, radius=this.#blur) {

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

	async load(file) {
		this.#file = file;
		this.#img = await Picture.load(file);

		console.debug('Image imported:', this.#img.width, this.#img.height);

		this.width = this.width || this.#img.width;
		this.height = this.height || this.#img.height;

		this.#imgWidth = this.#imgWidth || this.#img.width;
		this.#imgHeight = this.#imgHeight || this.#img.height;

		this.#cropX = 0;
		this.#cropY = 0;

		this.#cropWidth = this.#img.width;
		this.#cropHeight = this.#img.height;

	}

	async detectHuman() {
		if (!human) {

			const opt = {
				body: { enabled: true }, // Enable body detection
				async: true,
			};

			human = new Human(opt);

			await human.load();
   			await human.warmup();
		}

		const result = await human.detect(this.#img);
		const keypoints = result.body[0].keypoints;

		const path = new Path2D();
		const bodyOutline = [
			/*'nose', */'leftShoulder', 'leftElbow', 'leftWrist', // Left arm
			'leftHip', 'rightHip',                           // Torso
			'rightShoulder', 'rightElbow', 'rightWrist',     // Right arm
			'nose'                                           // Close back to head
		];

		// Move to the first keypoint
		const firstPoint = keypoints.find(kp => kp.part === bodyOutline[0]);
		if (firstPoint) {
			path.moveTo(firstPoint.position[0], firstPoint.position[1]);
		}

		// Connect remaining points
		for (let i = 1; i < bodyOutline.length; i++) {
			const point = keypoints.find(kp => kp.part === bodyOutline[i]);
			if (point) {
				path.lineTo(point.position[0], point.position[1]);
			}
		}

		// Create a path using the keypoints
		// const path = new Path2D();
		// keypoints.forEach((kp, index) => {
		// 	if (index === 0) {
		// 		path.moveTo(kp.position[0], kp.position[1]);
		// 	} else {
		// 		path.lineTo(kp.position[0], kp.position[1]);
		// 	}
		// });
		// path.closePath();

		this.#clip = path;

		// console.debug(result);

		// const segmentation = result.body[0]?.segmentation;

		// if (!segmentation) {
		// 	console.error('No body detected');
		// 	return;
		// }

		// console.debug(segmentation);
	}

	static async load(file) {
		return new Promise((resolve, reject) => {

			const img = new Image;
	
			img.src = URL.createObjectURL(file);
	
			img.onload = () => resolve(img);
			img.onerror = reject;

		});
	}
}