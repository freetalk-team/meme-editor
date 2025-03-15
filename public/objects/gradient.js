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

		const gradient = this.#gradient + this.alphaHex();

		let [x0, y0, x1, y1] = this.#vector.getCoordinates(true);

		// const x = this.x, y = this.y;

		// x0 += x, y0 += y, x1 += x, y1+= y;
		
		const g = ctx.createLinearGradient(x0, y0, x1, y1);
		// let gradient;

		

		// // Clip vector to fit within the rectangle
		// const clippedVector = clipLineToRect(x0, y0, x1, y1, this);


		// if (clippedVector) {
		//   // Create the gradient using the clipped vector
		//   gradient = ctx.createLinearGradient(
		// 	clippedVector.x0, clippedVector.y0,
		// 	clippedVector.x1, clippedVector.y1
		//   );
		// }
		// else {

		// 	gradient = ctx.createLinearGradient(x0, y0, x1, y1);
		// }
	  

		// console.log('Gradirnt fill:', x0, x1);

		g.addColorStop(0, fill);
		g.addColorStop(1, gradient);

		return g;
	}
} 

/**
   * Function to compute intersection of a line (vector) with a rectangle
   */
function clipLineToRect(x0, y0, x1, y1, rect) {
    let t0 = 0, t1 = 1; // Parameters for line segment
    const dx = x1 - x0, dy = y1 - y0;

    function clip(p, q) {
      if (p === 0) return q < 0;
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
      return true;
    }

    if (
      clip(-dx, x0 - rect.x) && clip(dx, rect.x + rect.width - x0) &&
      clip(-dy, y0 - rect.y) && clip(dy, rect.y + rect.height - y0)
    ) {
      return {
        x0: x0 + t0 * dx,
        y0: y0 + t0 * dy,
        x1: x0 + t1 * dx,
        y1: y0 + t1 * dy,
      };
    }
    return null; // No intersection
  }
