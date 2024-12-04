
import { Base } from "./base.js";
import { Text } from "./text.js";

export class Rect extends Base {
	#radius = 0;
	#stroke = '#000000';
	#strokeWidth = 1;
	#fill = '#eeeeee';
	#shadow = 'none';
	#shadowColor = '#444444';
	#shadowWidth = 2;

	get type() { return 'rect'; }
	
	get radius() { return this.#radius; }
	get stroke() { return this.#stroke; }
	get strokeWidth() { return this.#strokeWidth; }
	get fill() { return this.#fill; }
	get shadow() { return this.#shadow; }
	get shadowWidth() { return this.#shadowWidth; }
	get shadowColor() { return this.#shadowColor; }

	set radius(n) {
		if (typeof n == 'string') n = parseInt(n);
		this.#radius = n;
	}

	set stroke(v) {
		this.#stroke = v;
	}

	set strokeWidth(n) {
		if (typeof n == 'string') n = parseInt(n);
		this.#strokeWidth = n;
	}

	set fill(v) {
		this.#fill = v;
	}

	set shadow(v) {
		this.#shadow = v;
	}

	set shadowWidth(n) {
		if (typeof n == 'string') n = parseInt(n);
		this.#shadowWidth = n;
	}

	set shadowColor(v) {
		this.#shadowColor = v;
	}

	draw(ctx) {

		ctx.lineWidth = this.#strokeWidth;

		if (this.#radius == 0)
			this.drawRectangle(ctx);
		else
			this.drawRectangleRound(ctx);
	}

	drawRectangle(ctx) {

		if (this.#shadow == 'stroke') {

			this.addShadowRect(ctx, false);
			this.fillRect(ctx, false);
			this.strokeRect(ctx, false);
		}
		else {
			this.fillRect(ctx, this.#shadow == 'fill');
			this.strokeRect(ctx, this.#shadow == 'stroke');
		}
		
	}

	drawRectangleRound(ctx) {

		ctx.save();

		const x = this.x
			, y = this.y
			, width = this.width
			, height = this.height
			, fill = this.#fill
			, stroke = this.#stroke
			;

		let radius = this.#radius;
		
		if (typeof radius === 'number') {
			radius = {
				tl: radius,
				tr: radius,
				br: radius,
				bl: radius
			};
		} else {
			var defaultRadius = {
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
		ctx.lineTo(x + width, y + height - radius.br);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		ctx.lineTo(x + radius.bl, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
		ctx.lineTo(x, y + radius.tl);
		
		ctx.quadraticCurveTo(x, y, x + radius.tl, y);
		ctx.closePath();

		this.drawPath(ctx);

		ctx.restore();
	}

	drawPath(ctx) {

		const fill = this.#fill
			, stroke = this.#stroke
			;

		if (this.#shadow == 'stroke') {

			this.addShadow(ctx, false);

			if (fill) {
				ctx.fillStyle = fill;
				ctx.fill();
			}

			if (stroke) {
				ctx.strokeStyle = stroke;
				ctx.stroke();
			}

			return;
		}

		if (fill) {
			ctx.fillStyle = fill;

			if (this.#shadow == 'fill')
				this.addShadow(ctx, true);

			ctx.fill();
		}

		if (stroke) {
			ctx.strokeStyle = stroke;
			ctx.stroke();
		}
	}

	drawBorder(ctx) {

		if (this.#strokeWidth > 0)
			super.drawBorder(ctx, this.#strokeWidth, this.#stroke, -this.#strokeWidth / 2);
	}

	drawShadow(ctx, fill=true) {

		if (fill) {
			if (this.#shadow == 'fill')
				this.addShadow(ctx, true);
		}
		else {
			if (this.#shadow == 'stroke')
				this.addShadow(ctx, false);
		}
	}

	fillRect(ctx, shadow=false) {
		if (this.#fill) {
			ctx.fillStyle = this.#fill;

			if (shadow)
				this.addShadowRect(ctx);
			
			ctx.fillRect(this.x, this.y, this.width, this.height);
		}
	}

	strokeRect(ctx, shadow=false) {
		if (this.#stroke) {
			ctx.strokeStyle = this.#stroke;

			if (shadow) {

				this.addShadowRect(ctx, false);
				this.fillRect(ctx, false);
			}
			else 
				ctx.strokeRect(this.x, this.y, this.width, this.height);
		}
	}

	addShadowRect(ctx, fill=true) {
		if (this.#shadowWidth == 0) return;

		const draw = fill ? ctx.fillRect : ctx.strokeRect

		ctx.save();

		this.#addShadow(ctx);
		draw.call(ctx, this.x, this.y, this.width, this.height);
		ctx.restore();

		// ctx.save();

		// ctx.shadowColor = this.#shadowColor; // color
		// ctx.shadowBlur = 5; // blur level
		// ctx.shadowOffsetX = 0; // horizontal offset
		// ctx.shadowOffsetY = this.#shadowWidth; // vertical offset

		// draw.call(ctx, this.x, this.y, this.width, this.height);

		// ctx.restore();
	}

	addShadow(ctx, fill=true) {

		if (this.#shadowWidth == 0) return;

		const draw = fill ? ctx.fill : ctx.stroke;

		ctx.save();

		this.#addShadow(ctx);
		draw.call(ctx);

		ctx.restore();
	}

	#addShadow(ctx) {
		ctx.shadowColor = this.#shadowColor; // color
		ctx.shadowBlur = 5; // blur level
		ctx.shadowOffsetX = this.#shadowWidth; // horizontal offset
		ctx.shadowOffsetY = this.#shadowWidth; // vertical offset
	}
}

export class Rectangle extends Rect {
	
	#text;

	get x() { return super.x; }
	get y() { return super.y; }

	get text() { return this.#text.value; }
	get textOffsetX() { return this.#text.x - this.x; }
	get textOffsetY() { return this.#text.y - this.y; }
	get textSize() { return this.#text.size; }
	get textFill() { return this.#text.fill; }
	get textStroke() { return this.#text.stroke; }
	get textStrokeWidth() { return this.#text.strokeWidth; }
	get textFont() { return this.#text.font; }
	get textShadow() { return this.#text.shadow; }
	get textShadowWidth() { return this.#text.shadowWidth; }
	get textShadowColor() { return this.#text.shadowColor; }

	constructor() {
		super();

		
		this.width = 200;
		this.height = 150;

		const t = new Text;

		t.x = this.x + 10;
		t.y = this.y + 10;
		t.shadowColor = '#555555';

		this.#text = t;
	}

	set x(n) {

		const d = this.#text.x - super.x;

		super.x = n;

		this.#text.x = super.x + d;
	}

	set y(n) {

		const d = this.#text.y - super.y;

		super.y = n;
		this.#text.y = super.y + d;
	}
	

	set textOffsetX(n) {
		this.#text.x = n;
		this.#text.x += this.x;

		console.debug('Text offset', this.#text.x);
	}

	set textOffsetY(n) {
		this.#text.y = n;
		this.#text.y += this.y;
	}

	set textSize(n) {
		this.#text.size = n;
	}

	set textFont(n) {
		this.#text.font = n;
	}

	set textFill(v) {
		this.#text.fill = v;
	}

	set textStroke(v) {
		this.#text.stroke = v;
	}

	set textStrokeWidth(n) {
		this.#text.strokeWidth = n;
	}

	set textShadow(v) {
		this.#text.shadow = v;
	}

	set textShadowWidth(n) {
		this.#text.shadowWidth = n;
	}

	set textShadowColor(v) {
		this.#text.shadowColor = v;
	}

	set text(s) {
		this.#text.value = s;
	}

	// set properties(obj) {
	// 	super.properties = obj;
	// 	this.textProperties = obj
	// }

	// set textProperties(obj) {

	// 	const data = {
	// 		textOffsetX: Math.floor(this.#text.x - this.x),
	// 		textOffsetY: Math.floor(this.#text.y - this.y),
	// 		textSize: this.#text.size,
	// 		text: this.#text.value,
	// 		textFont: this.#text.font,

	// 		textFill: !!this.#text.fill ? this.#text.fill : false,
	// 		textStroke: !!this.#text.stroke ? this.#text.stroke : false
	// 	};

	// 	obj.assign(data);
		
	// }

	draw(ctx) {

		super.draw(ctx);

		this.#text.draw(ctx);
		this.drawSelection(ctx);
	}

	drawText(ctx) {
		this.#text.draw(ctx);
	}
}