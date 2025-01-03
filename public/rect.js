
import { Base } from "./base.js";
import { Text } from "./text.js";

export class Rect extends Base {
	#radius = 0;

	get type() { return 'rect'; }
	get radius() { return this.#radius; }

	set radius(n) {
		if (typeof n == 'string') n = parseInt(n);
		this.#radius = n;
	}

	draw(ctx) {
		this.drawRoundRectangle(ctx, this.#radius);
	}

	strokeBorder(ctx) {

		if (this.strokeWidth > 0)
			super.drawBorder(ctx, this.strokeWidth, this.stroke, -this.strokeWidth / 2);
	}

	

	drawSVG(svg, group=false) {

		const fill = this.fill ? { color: this.fill, alpha: this.alpha } : null
			, stroke = this.stroke ? { color: this.stroke, width: this.strokeWidth } : null
			, shadow = this.shadow ? { id: this.id, color: this.shadowColor, width: this.shadowWidth } : null
			, box = this.box();

		if (group) 
			box.angle = 0;

		svg.rect(box, this.#radius, fill, stroke, shadow);
	}
}

export class Rectangle extends Rect {

	#text;

	get type() { return 'label'; }

	constructor() {
		super();

		const t = new Text(this);

		t.x = 10;
		t.y = 10;
		t.shadowColor = '#555555';

		this.#text = t;
	}
	
	// get x() { return super.x; }
	// get y() { return super.y; }
	get width() { return super.width; }
	get height() { return super.height; }
	get angle() { return super.angle; }

	get text() { return this.#text.value; }
	get textOffsetX() { return this.#text.x; }
	get textOffsetY() { return this.#text.y; }
	get textSize() { return this.#text.size; }
	get textBold() { return this.#text.bold; }
	get textItalic() { return this.#text.italic; }
	get textFill() { return this.#text.fill; }
	get textStroke() { return this.#text.stroke; }
	get textStrokeWidth() { return this.#text.strokeWidth; }
	get textFont() { return this.#text.font; }
	get textShadow() { return this.#text.shadow; }
	get textShadowWidth() { return this.#text.shadowWidth; }
	get textShadowColor() { return this.#text.shadowColor; }


	set width(n) {
		if (typeof n == 'string') n = parseInt(n);
		super.width = n;
		this.#text.width = n - this.#text.x*2;
	}

	set height(n) {
		if (typeof n == 'string') n = parseInt(n);
		super.height = n;
		this.#text.height = n - this.#text.y*2;
	}

	set angle(n) {
		if (typeof n == 'string') n = parseFloat(n);
		super.angle = n;
		this.#text.angle = n;
	}


	set textOffsetX(n) {
		if (typeof n == 'string') n = parseInt(n);
		this.#text.x = n;
		this.#text.width = this.width - 2*n;
	}

	set textOffsetY(n) {
		if (typeof n == 'string') n = parseInt(n);
		this.#text.y = n;
		this.#text.height = this.height - 2*n;
	}

	set textSize(n) {
		if (typeof n == 'string') n = parseInt(n);
		this.#text.size = n;
	}

	set textBold(b) {
		this.#text.bold = b;
	}

	set textItalic(b) {
		this.#text.italic = b;
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
		if (typeof n == 'string') n = parseInt(n);
		this.#text.strokeWidth = n;
	}

	set textShadow(v) {
		this.#text.shadow = v;
	}

	set textShadowWidth(n) {
		if (typeof n == 'string') n = parseInt(n);
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

		ctx.save();
		ctx.translate(this.x, this.y);

		this.#text.draw(ctx);

		ctx.restore();
	}

	drawText(ctx) {
		this.#text.draw(ctx);
	}

	drawSVG(svg) {

		const x = this.x + this.#text.x
			, y = this.y + this.#text.y
			, box= this.box();

		svg.group(box);

		super.drawSVG(svg, true);

		this.#text.drawSVG(svg, x, y, true);

		svg.groupEnd();
	}
}
