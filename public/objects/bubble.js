import { Rectangle as Base } from "./label.js";

class Bubble extends Base {

	#beak = 'left';
	#beakWidth = 0.2;
	#beakPosition = 0;

	#pX;
	#pY;
	#path;

	get type() { return 'bubble'; }

	set radius(n) {
		if (typeof n == 'string') n = parseInt(n);
		super.radius = n;
		this.updatePath()
	}
	get radius() { return super.radius; }

	get width() { return super.width; }
	set width(n) {
		super.width = n;
		this.updatePath()
	}

	get height() { return super.height; }
	set height(n) {
		super.height = n;
		this.updatePath()
	}

	get px() { return this.#pX; }
	get py() { return this.#pY; }

	set px(v) { this.#pX = v; this.#beak = this.#pX < 0 ? 'left' : 'right'; }
	set py(v) { this.#pY = v; }
	
	get beak() { return this.#beak; }
	set beak(v) {
		if (this.#beak == v) return;

		// let h = this.#beak == 'top' || this.#beak == 'bottom';

		switch (v) {
			case 'left':
			case 'right':
			this.#pX = -this.#pX + this.width;
			break;

			case 'top':
			case 'bottom':
			this.#pY = -this.#pY + this.height;
			break;
		}

		// this.#pX = -this.#pX + this.width;
		this.#beak = v;

		this.updatePath();
	}

	get beakWidth() { return this.#beakWidth; }
	set beakWidth(n) {
		if (typeof n == 'string') n = parseFloat(n);
		this.#beakWidth = n;

		this.updatePath();
	}

	get beakPosition() { return this.#beakPosition; }
	set beakPosition(n) {
		if (typeof n == 'string') n = parseFloat(n);
		this.#beakPosition = n;

		this.updatePath();
	}

	constructor() {

		super();

		this.#pX = -30;
		this.#pY = 50;

		this.radius = 10;
	}

	draw(ctx) {
		this.drawPath(ctx, this.#path);

		ctx.save();

		ctx.translate(this.x, this.y);

		this.drawText(ctx);

		ctx.restore();
	}
	
	handleClick(x, y) {

		if (!this.isSelected()) return;

		let X = this.x + this.#pX, Y = this.y + this.#pY;

		if (this.inNode(x, y, X, Y))
			return {

				move: (x, y) => {
					this.#pX = x - this.x;
					this.#pY = y - this.y;

					this.updatePath();
				}

			};

		return super.handleClick(x, y);
	}

	updatePath() {
		this.#path = this.getPath();
	}

	getPath() {

		const width = this.width
			, height = this.height
			, dx = this.#pX
			, dy = this.#pY
			, x = -width / 2
			, y = -height / 2
			, px = x + dx
			, py = y + dy
			;

		let radius = this.radius;

		const len = this.#beak == 'top' || this.#beak == 'bottom' ? width : height;
		const maxw =  len - 2*radius
			, w = maxw * this.#beakWidth
			, d = (maxw - w) * this.#beakPosition
			;

		radius = {
			tl: radius,
			tr: radius,
			br: radius,
			bl: radius
		};

		const path = new Path2D;

		path.moveTo(x + radius.tl, y);
		if (this.#beak == 'top') {
			path.lineTo(x + radius.tl + d, y);
			path.lineTo(px, py);
			path.lineTo(x + radius.tl + d + w, y);
		}
		path.lineTo(x + width - radius.tr, y);
		path.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		if (this.#beak == 'right') {
			path.lineTo(x + width, y + radius.tl + d);
			path.lineTo(px, py);
			path.lineTo(x + width, y + radius.tl + w + d);
		}
		path.lineTo(x + width, y + height - radius.br);
	
		path.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);

		if (this.#beak == 'bottom') {
			path.lineTo(x + radius.tl + d + w, y + height);
			path.lineTo(px, py);
			path.lineTo(x + radius.tl + d, y + height);
		}

		path.lineTo(x + radius.bl, y + height);
		path.quadraticCurveTo(x, y + height, x, y + height - radius.bl);

		if (this.#beak == 'left') {
			path.lineTo(x, y + radius.tl + w + d);
			path.lineTo(px, py);
			path.lineTo(x, y + radius.tl + d);
		}
		
		path.lineTo(x, y + radius.tl);
		
		path.quadraticCurveTo(x, y, x + radius.tl, y);
		path.closePath();

		return path;
	}

	drawSelection(ctx, mode) {

		this.drawNode(ctx, this.x + this.#pX, this.y + this.#pY);

		super.drawSelection(ctx);
	}
}

export {
	Bubble
}