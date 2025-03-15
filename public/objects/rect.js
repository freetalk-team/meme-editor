
import { Gradient as Base } from "./gradient.js";
import { Path } from './path.js';

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

		super.draw(ctx);
	}

	strokeBorder(ctx) {

		if (this.strokeWidth > 0)
			super.drawBorder(ctx, this.strokeWidth, this.stroke, -this.strokeWidth / 2);
	}

	

	drawSVG(svg, group=false) {

		const fill = this.getFill()
			, stroke = this.getStroke()
			, shadow = this.getShadow()
			, box = this.box();

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
	
	// toPath() {

	// 	const w = this.width
	// 		, h = this.height
	// 		, x = this.x
	// 		, y = this.y
	// 		, segments = [
	// 			[x, y],
	// 			[x + w, y],
	// 			[x + w, y + h]
	// 		];

	// 	// Change its prototype to Path
	// 	Object.setPrototypeOf(this, Path.prototype);

	// 	this.segments = segments;
	// 	this.close();

	// }
}
