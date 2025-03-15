import { Base } from "./base.js";
import { Arrow } from "./arrow.js";

export class Gradient extends Base {

	#gradient;
	#vector;

	get fillGradient() { return this.#gradient; }
	set fillGradient(v) {
		this.#gradient = v;

		if (v) {

			if (!this.#vector) {

				this.#vector = new Arrow;

				const w = this.width
					, m = w / 10;

				this.#vector.visible = false;
				this.#vector.x = m;
				this.#vector.y = this.height / 2 - 10;
				this.#vector.width = w - 2*m;
				this.#vector.strokeWidth = 1;
				this.#vector.stroke = '#1111ee';
			}
		}
		else {

			if (this.#vector)
				this.#vector.selected = false;
		}
	}

	set fillGradientVector(b) {
		this.#vector.visible = b;
	}

	get fillGradientVector() {
		return this.#vector?.visible;
	}

	clone() {
		const o = super.clone();

		if (this.#vector)
			o.#vector = this.#vector.clone();

		return o;
	}

	load(data) {
		const { fillGradientVector, ...rest } = data;

		if (fillGradientVector) {
			this.#vector = new Arrow;
			this.#vector.load(fillGradientVector);

			this.#vector.visible = false;
		}

		super.load(rest);
	}

	save() {
		const { fillGradientVector, ...data } = super.save();

		if (fillGradientVector)
			data.fillGradientVector = this.#vector.save();

		return data;
	}

	drawSelection(ctx) {
		if (this.#gradient && this.#vector.visible) {

			ctx.save();

			const { x, y } = this.setGeometry(ctx);

			ctx.translate(x, y);

			this.#vector.draw(ctx);
			this.#vector.drawSelection(ctx);

			ctx.restore();
		}
		
		super.drawSelection(ctx);
	}

	fillRectangle(ctx, x, y) {
		if (this.#gradient) {

		}
		else {
			super.fillRectangle(ctx, x, y);
		}
	}

	fillRoundRectangle(ctx, x, y, radius) {

		let fill = this.fillColor();

		if (this.#gradient) 
			fill = this.#createGardient(ctx, fill);
		
		
		super.fillRoundRectangle(ctx, x, y, radius, fill);
	}

	fillEllipse(ctx, radiusX, radiusY) {

		let fill = this.fillColor();

		if (this.#gradient) 
			fill = this.#createGardient(ctx, fill);
			
		super.fillEllipse(ctx, radiusX, radiusY, fill);
	}

	fillPath(ctx, path) {
		let fill = this.fillColor();

		if (this.#gradient) 
			fill = this.#createGardient(ctx, fill);
			
		super.fillPath(ctx, path, fill);
	}

	fillText(ctx, text, x, y) {
		let fill = this.fillColor();

		if (this.#gradient) 
			fill = this.#createGardient(ctx, fill);

		super.fillText(ctx, text, x, y, fill);
	}

	// handleSelect(x, y, add) {
	// 	if (this.#gradient && this.#show) {
	// 		const selected = this.#vector.handleSelect(x - this.x, y - this.y);

	// 		if (selected) 
	// 			return selected;
	// 	}

	// 	return super.handleSelect(x, y, add);
	// }

	handleClick(x, y) {
		if (this.#gradient && this.#vector.visible) {

			const w = this.width / 2
				, h = this.height / 2;

			let { ox, oy } = this.getGeometry(x, y);

			ox += w;
			oy += h;

			// console.debug('Graadient', ox, oy);

			const node = this.#vector.handleClick(ox, oy);
			if (node)
				return {
					move: (x, y) => {

						let { ox, oy } = this.getGeometry(x, y);

						ox += w;
						oy += h;

						return node.move(ox, oy);
					}
				};
		}

		return super.handleClick(x, y);
	}

	#createGardient(ctx, fill=this.fillColor()) {
		const [x0, y0, x1, y1] = this.#vector.getCoordinates(true);
		
		const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

		// console.log('Gradirnt fill:', x0, x1);

		gradient.addColorStop(0, fill);
		gradient.addColorStop(1, this.#gradient);

		return gradient;
	}
} 
