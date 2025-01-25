
import { Base } from "./object.js";
import { Point } from "./curve.js";

const M = 8;

export class Arrow extends Base {

	#v = [200, 0];
	#arrow = 'end';

	get type() { return 'arrow'; }

	constructor() {
		super();

		this.width = 200;
		this.height = 20;
	}

	get y() { return super.y + this.height / 2; }
	set y(n) {
		if (typeof n == 'string') n = parseInt(n);
		super.y = n - this.height / 2;
	}

	set fill(v) {}
	get fill() { return this.stroke; }

	get stroke() { return super.stroke; }
	set stroke(v) {
		super.stroke = v;
		super.fill = v;
	}

	get arrow() { return this.#arrow; }
	set arrow(v) { this.#arrow = v; }

	draw(ctx) {
		// Math.hypot

		let [x0, y0, x, y] = this.#getCoordinates();

		const m = M + this.strokeWidth*1.3;

		ctx.save();
		ctx.translate(x0, y0);
		ctx.rotate(this.angle);


		let X = x - x0
			, Y = y - y0
			, a0, a1
			;

		x0 = 0;

		if (this.#arrow == 'begin' || this.#arrow == 'both') {
			x0 += m;

			const p = new Path2D;

			p.moveTo(m, m/2);
			p.lineTo(0, 0);
			p.lineTo(m, -m/2);
			p.closePath();

			a0 = p;
		}
		else {
			this.#drawDot(ctx, 0, 0);
		}

		if (this.#arrow == 'end' || this.#arrow == 'both') {
			X -= m;

			const p = new Path2D;

			p.moveTo(X, m/2);
			p.lineTo(X + m, 0);
			p.lineTo(X, -m/2);
			p.closePath();

			a1 = p;
		}
		else {
			this.#drawDot(ctx, X, Y);
		}

		this.drawLine(ctx, X + 1, Y, x0, 0);

		if (a0) this.fillPath(ctx, a0, false, 0);
		if (a1) this.fillPath(ctx, a1, false, 0);

		this.drawLine(ctx, X + 1, 0, x0 - 1, 0, false);
		
		// this.drawLineShadow(ctx, X + 1, Y + 1, 0, 0);

		ctx.restore();

		super.draw(ctx);
	}

	drawSelection(ctx) {
		// this.drawBorder(ctx, 1, '#888', -3, true);
		// super.drawSelection(ctx);

		const [x0, y0, x, y] = this.#getCoordinates();

		ctx.save();
		ctx.translate(x0, y0);
		ctx.rotate(this.angle);

		this.drawNode(ctx, 0, 0);
		this.drawNode(ctx, x - x0, y - y0);

		ctx.restore();

	}

	// toSVGFilter() {

	// 	if (!this.shadow) return '';

	// 	const id = this.id + '-shadow'
	// 		, dx = this.shadowWidth
	// 		, color = this.shadowColor
	// 		;

	// 	return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${dx}" dy="${dx}" stdDeviation="5" flood-color="${color}"/></filter>`;
	// 	// return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="2" dy="2" stdDeviation="5" flood-color="${color}"/></filter>`;
	// }

	drawSVG(svg) {

		const m = M /*+ this.strokeWidth*1.3*/
			, mh = m/2;

		const stroke = this.stroke
			, x = this.x
			, y = this.y
			, box = this.box();

		let x1 = x
			, x2 = this.x + this.width
			, r = this.strokeWidth * 0.7
			;

		if (r < 2) r = 2;

		let segments;

		box.x = 0;
		box.y = 0;
		box.width = 0;
		box.height = 0;

		svg.group(box, { color: stroke, alpha: 1 }, { color: stroke, width: this.strokeWidth });
		
		box.angle = 0;

		if (this.#arrow == 'both') {
			x2 -= m;
			x1 += m;

			segments = [
				new Point(x1, y),
				new Point(x1, y + mh),
				new Point(x1 - m, y), 
				new Point(x1, y - mh),

				new Point(x1, y),
				new Point(x2, y),

				new Point(x2, y + mh),
				new Point(x2 + m, y),
				new Point(x2, y - mh),

				new Point(x2, y)
			];
		}	
		else if (this.#arrow == 'end') {
			x2 -= m;

			segments = [
				new Point(x1, y),
				new Point(x2, y),

				new Point(x2, y + mh),
				new Point(x2 + m, y),
				new Point(x2, y - mh),

				new Point(x2, y)

			];

			svg.circle(x1, y, r);
		}
		else if (this.#arrow == 'begin') {

			x1 += m;

			segments = [
				new Point(x2, y),
				new Point(x1, y),
				
				new Point(x1, y + mh),
				new Point(x1 - m, y), 
				new Point(x1, y - mh),
				
				new Point(x1, y)
			];

			svg.circle(x2, y, r);
		}
		else {

			segments = [
				new Point(x1, y),
				new Point(x2, y)
			];

			svg.circle(x1, y, r);
			svg.circle(x2, y, r);
		}

		svg.path(box, { segments, closed: true });
		svg.groupEnd();
	}
	 
	handleClick(x, y) {
		const [x0, y0, x1, y1] = this.#getCoordinates(true);

		if (this.inNode(x, y, x0, y0))
			return {
				move: (x, y) => {
					this.x = Math.round(x);
					this.y = Math.round(y - this.height / 2);
				}
			};


		if (this.inNode(x, y, x1, y1))
			return {
				move: (x, y) => {

					const [x0, y0 ] = this.#getCoordinates();

					// console.log('####', x0, y0, this.width);
					let a = Math.asin((y - y0) / this.width);
					if (isNaN(a))
						a = y > y0 ? Math.PI / 2 : Math.PI * 3/2;
					else if (x < x0)
						a = Math.PI - a;
					else if (a < 0)
						a = 2*Math.PI + a;

					if (y == y0) this.width = Math.abs(x - x0);
					else if (x == x0) this.width = Math.abs(y - y0);
					else this.width = Math.hypot(x - x0, y - y0);

					this.angle = a;
					
				}
			};

		return null;
	}

	handleSelect(x, y) {

		// Calculate the center of rotation
		const cx = this.x;
		const cy = this.y;
		const angle = this.angle;
	
		// Translate point to rotate around (cx, cy)
		const translatedX = x - cx;
		const translatedY = y - cy;
	
		// Apply reverse rotation
		const cosTheta = Math.cos(-angle);
		const sinTheta = Math.sin(-angle);
		
		const rotatedX = translatedX * cosTheta - translatedY * sinTheta;
		const rotatedY = translatedX * sinTheta + translatedY * cosTheta;
	
		// Translate back
		const finalX = rotatedX + cx;
		const finalY = rotatedY + cy;
	
		// Check if the point lies within the axis-aligned rectangle
		const rectLeft = this.x;
		const rectTop = super.y;
		const rectRight = rectLeft + this.width;
		const rectBottom = rectTop + this.height;
	
		return (finalX >= rectLeft && finalX <= rectRight && 
				finalY >= rectTop && finalY <= rectBottom);
	}

	#drawDot(ctx, x, y) {

		let r = this.strokeWidth * 0.7;

		if (r < 2) r = 2;

		this.drawNode(ctx, x, y, this.stroke, true, r);
	}

	#getCoordinates(rotate=false) {

		let x0 = this.x
			, y0 = this.y
			, x = this.width
			, y = 0
			;

		if (rotate) {
			y = x * Math.sin(this.angle);
			x *= Math.cos(this.angle);
		}

		return [ x0, y0, x0 + x, y0 + y ];
	}
}