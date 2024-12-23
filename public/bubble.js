import { Base } from "./base.js";
import { Rectangle } from "./rect.js";

class Bubble extends Rectangle {

	#beak = 'left';
	#beakWidth = 0.2;

	#pX;
	#pY;

	get type() { return 'bubble'; }

	get px() { return this.#pX; }
	get py() { return this.#pY; }

	set px(v) { this.#pX = v; this.#beak = this.#pX < 0 ? 'left' : 'right'; }
	set py(v) { this.#pY = v; }
	
	get beak() { return this.#beak; }
	set beak(v) {
		if (this.#beak == v) return;

		this.#pX = -this.#pX + this.width;
		this.#beak = v;

		this.updatePath();
	}

	get beakWidth() { return this.#beakWidth; }
	set beakWidth(n) {
		if (typeof n == 'string') n = parseFloat(n);
		this.#beakWidth = n;

		this.updatePath();
	}

	constructor() {

		super();

		this.#pX = -30;
		this.#pY = 50;

		this.radius = 10;
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

		const maxw =  height - 2*radius
			, w = maxw * this.#beakWidth;

		radius = {
			tl: radius,
			tr: radius,
			br: radius,
			bl: radius
		};

		const path = new Path2D;

		path.moveTo(x + radius.tl, y);
		path.lineTo(x + width - radius.tr, y);
		path.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		if (this.#beak == 'right') {
			path.lineTo(x + width, y + radius.tl);
			path.lineTo(px, py);
			path.lineTo(x + width, y + radius.tl + w);
		}
		path.lineTo(x + width, y + height - radius.br);
	
		path.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		path.lineTo(x + radius.bl, y + height);
		path.quadraticCurveTo(x, y + height, x, y + height - radius.bl);

		if (this.#beak == 'left') {
			path.lineTo(x, y + radius.tl + w);
			path.lineTo(px, py);
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
	Rectangle,
	Bubble
}
