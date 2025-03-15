
import { Base } from "./base.js";

export class Group extends Base {

	#objects = [];

	get type() { return 'group'; }
	get objects() { return this.#objects; }
	
	load(data, factory) {

		const objects = [];
		const objs = data.objects;

		delete data.objects;
		super.load(data);

		let o;
		
		for (let i of objs) {

			o = factory.create(i.type, this.id, i.id);
			o.load(i, factory);

			objects.push(o);
		}

		this.#objects = objects;
	}

	draw(ctx) {

		ctx.save();

		const { x, y } = this.setGeometry(ctx);

		ctx.translate(x, y);

		for (const i of this.#objects)
			if (i.visible)
				i.draw(ctx);

		ctx.restore();
	}

	drawSelection(ctx) {

		let selected = false;

		ctx.save();

		const { x, y } = this.setGeometry(ctx);

		ctx.translate(x, y);

		for (const i of this.#objects) {
			if (selected = i.isSelected()) {
				i.drawSelection(ctx);
				break;
			}
		}

		ctx.restore();

		if (!selected) {
			this.drawBorder(ctx, 1, '#888', -1, true);
			super.drawSelection(ctx);
		}
	}

	drawSVG(svg, canvas) {
		const box = this.box(0, canvas)
			;

		svg.group(null, box);

		for (const i of this.#objects)
			i.drawSVG(svg, { x: -box.x, y: -box.y });

		svg.groupEnd();
	}

	isSelected() {

		for (const i of this.#objects)
			if (i.isSelected()) 
				return true;

		return super.isSelected();
	}

	handleClick(x, y) {
		let { X, Y, ox, oy, angle } = this.getGeometry(x, y )
			, w = this.width / 2, h = this.height / 2
			, objects = this.#getObjects();

		let node;

		// console.debug('GROUP onclick', ox, oy, [X, Y]);

		ox += w;
		oy += h;

		for (const i of objects) {

			if (node = i.handleClick(ox, oy))
				return {
					move(x, y) {

						x -= X;
						y -= Y;

						if (angle) {
							const cos = Math.cos(-angle)
								, sin = Math.sin(-angle);

							const rx = x * cos - y * sin
								, ry = x * sin + y * cos;

							x = rx;
							y = ry;
						}

						node.move(x + w, y + h);
					}
				}; 
		}

		return super.handleClick(x, y);
	}

	handleSelect(x, y, add) {

		const objects = this.#getObjects();
		let { ox, oy } = this.getGeometry(x, y);

		ox += this.width / 2;
		oy += this.height / 2;
			
		for (const i of objects)
			if (i.handleSelect(ox, oy)) {
				this.selected = false;
				return i; 
			}

		return super.handleSelect(x, y, add);
	}

	addObjects(objects) {

		if (this.#objects.length == 0) {

			const M = 5;

			const b = getBoundingBox(objects);

			this.x = b.x - M;
			this.y = b.y - M;
			this.width = b.width + 2*M;
			this.height = b.height + 2*M;
		}

		const angle = this.angle;
		const pi2 = Math.PI * 2;

		let a;

		for (const i of objects) {

			i.x = i.x - this.x;
			i.y = i.y - this.y;

			a = angle + i.angle;
			if (a >= pi2) a -= pi2;

			i.angle = a;

			this.#objects.push(i);

		}

	}
	
	#getObjects() {
		return [...this.#objects].reverse();
	}

	
}

function getBoundingBox(objects) {
  
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
  
	for (const i of objects) {
	  minX = Math.min(minX, i.x);
	  minY = Math.min(minY, i.y);
	  maxX = Math.max(maxX, i.x + i.width);
	  maxY = Math.max(maxY, i.y + i.height);
	}
  
	return {
	  x: minX,
	  y: minY,
	  width: maxX - minX,
	  height: maxY - minY
	};
  }