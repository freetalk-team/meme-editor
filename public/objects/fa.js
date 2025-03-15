
import { Text } from "./text.js";

export class Icon extends Text {

	#mask;

	get type() { return 'icon'; }

	constructor(value) {
		super();

		this.value = value;
		this.font = 'FontAwesome';
		this.size = 70;
	}

	draw(ctx) {
		super.draw(ctx);

		if (this.#mask)
			ctx.drawImage(this.#mask, 10, 10);
	}

	calculateBorderSize() {
		this.width = this.size;
		this.height = this.size;
	}

	detectMask(threshold=0.1) {

		const e = offctx.canvas
			, ctx = offctx
			, color = this.fill
			, width = Math.ceil(this.width)
			, height = Math.ceil(this.height)
			, x = -this.x
			, y = -this.y;


		e.width = width;
		e.height = height;

		ctx.save();
		ctx.clearRect(0, 0, width, height);
		ctx.translate(x, y);

		this.draw(ctx);

		ctx.restore();

		// this.#mask = glfx.detectEdge(e, color, threshold);
		const data = glfx.detectPath(e, color, threshold, '#00000000', '#000000');

		return { width, height, data };
	}
}


