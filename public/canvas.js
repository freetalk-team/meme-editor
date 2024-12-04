
import { Base } from "./base.js";

export class Canvas extends Base {

	get type() { return 'canvas'; }

	#fill = '#fafafa';

	set fill(v) { this.#fill = v; }
	get fill() { return this.#fill; }

	constructor() {
		super('canvas');

		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
	}

	handleClick() {}
	handleSelect() {}

	draw(ctx) {
		ctx.fillStyle = this.#fill;
		ctx.fillRect(this.x, this.y, this.width, this.height);
	}
}