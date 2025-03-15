
import { Base } from "./object.js";
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

	

	drawSVG(svg, canvas={ x: 0, y: 0 }, group=false) {

		const fill = this.getFill()
			, stroke = this.getStroke()
			, shadow = this.getShadow()
			, box = this.box(0, canvas);

		if (group) 
			box.angle = 0;

		svg.rect(box, this.#radius, fill, stroke, shadow);
	}

	getPath(x=this.x, y=this.y, sx=1, sy=1) {
		const p = new Path2D;

		const w = this.width * sx
			, h = this.height * sy
			, r = this.#radius * Math.min(sx, sy);

		p.roundRect(x - w / 2, y - h / 2, w, h, r);

		return p;
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
	get textAlign() { return this.#text.align; }
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

	set textAlign(v) {
		this.#text.align = v;
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

	getText() {
		return this.#text;
	}

	centerText() {
		const textOffsetX = Math.floor(this.width / 2)
			, textAlign = 'center';

		this.textOffsetX = textOffsetX;
		this.textAlign = textAlign;

		return { textOffsetX, textAlign };
	}

	draw(ctx) {

		super.draw(ctx);

		ctx.save();

		const { x, y } = this.setGeometry(ctx);

		ctx.translate(x, y);

		this.#text.draw(ctx);

		ctx.restore();
	}

	drawText(ctx) {
		this.#text.draw(ctx);
	}

	drawSVG(svg, canvas) {

		const box = this.box(0, canvas)
			, x = -(this.x - canvas.x)
			, y = -(this.y - canvas.y)
			;

		svg.group(null, box);

		super.drawSVG(svg, canvas, true);

		this.#text.drawSVG(svg, { x, y });

		svg.groupEnd();
	}
	
}
