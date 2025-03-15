
import { Base } from "./base.js";

export class Canvas extends Base {

	get type() { return 'canvas'; }

	constructor() {
		super('canvas');

		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
		this.stroke = null;
		this.fill = '#fafafa';
	}

	get height() { return super.height; }
	set height(n) {
		const h = this.height;

		super.height = n;

		this.y += (h - this.height) / 2;
	}

	handleClick() {}
	handleSelect() {}

	draw(ctx) {
		this.drawRectangle(ctx);
	}
}