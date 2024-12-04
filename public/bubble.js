import { Base } from "./base.js";
import { Rectangle } from "./rect.js";

class Bubble extends Rectangle {

	#beak = 'left';

	#pX;
	#pY;

	get type() { return 'bubble'; }

	get x() { return super.x; }
	get y() { return super.y; }

	get px() { return this.#pX; }
	get py() { return this.#pY; }

	set px(v) { this.#pX = v; }
	set py(v) { this.#pY = v; }
	
	get beak() { return this.#beak; }

	set x(v) {
		const d = super.x - this.#pX;

		super.x = v;
		this.#pX = super.x - d;
	}

	set y(v) {
		const d = super.y - this.#pY;
		
		super.y = v;
		this.#pY = super.y - d;
	}


	set beak(v) {

		const d = Math.min(Math.abs(this.x - this.#pX), Math.abs(this.#pX - this.width - this.x));
		// const d = this.#beak == 'left' ? this.x - this.#pX : this.#pX - this.x - this.width;

		this.#pX = v == 'left' ? this.x - d : this.x + this.width + d;
		this.#beak = v;
	}

	constructor() {

		super();

		this.#pX = this.x - 30;
		this.#pY = this.y + 50;

		this.radius = 10;
	}
	
	draw(ctx) {

		ctx.save();

		this.#drawBubble(ctx);
		this.drawText(ctx);
		this.#drawSelection(ctx);

		ctx.restore();
	}

	handleClick(x, y) {

		if (!this.selected) return;

		let X = this.#pX, Y = this.#pY;

		if (this.inNode(x, y, X, Y))
			return {

				move: (x, y) => {
					this.#pX = x;
					this.#pY = y;
				}

			};

		return super.handleClick(x, y);
	}

	updatePos(x, y) {
		const X = this.x
			, Y = this.y
			;

		super.updatePos(x, y);

		// this.#pX -= X - this.x;
		// this.#pY -= Y - this.y;
	}

	#drawSelection(ctx) {

		if (!this.selected) return;

		Base.prototype.draw.call(this, ctx);

		this.drawNode(ctx, this.#pX, this.#pY);

	}

	#drawBubble(ctx) {

		ctx.save();

		ctx.lineWidth = this.strokeWidth;

		const x = this.x
			, y = this.y
			, width = this.width
			, height = this.height
			, fill = this.fill
			, stroke = this.stroke
			;

		let radius = this.radius;
		
		if (typeof radius === 'number') {
			radius = {
				tl: radius,
				tr: radius,
				br: radius,
				bl: radius
			};
		} else {
			const defaultRadius = {
				tl: 0,
				tr: 0,
				br: 0,
				bl: 0
			};

			for (var side in defaultRadius) {
				radius[side] = radius[side] || defaultRadius[side];
			}
		}

		ctx.beginPath();
		ctx.moveTo(x + radius.tl, y);
		ctx.lineTo(x + width - radius.tr, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		if (this.#beak == 'right') {
			ctx.lineTo(x + width, y + radius.tl);
			ctx.lineTo(this.#pX, this.#pY);
			ctx.lineTo(x + width, y + radius.tl + 20);
		}
		ctx.lineTo(x + width, y + height - radius.br);
	
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		ctx.lineTo(x + radius.bl, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);

		if (this.#beak == 'left') {
			ctx.lineTo(x, y + radius.tl + 20);
			ctx.lineTo(this.#pX, this.#pY);
		}
		
		ctx.lineTo(x, y + radius.tl);
		
		ctx.quadraticCurveTo(x, y, x + radius.tl, y);
		ctx.closePath();

		this.drawPath(ctx);

		ctx.restore();
	}
}

export {
	Rectangle,
	Bubble
}