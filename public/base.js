import { Base } from './object.js';
import { Bubble, Rectangle } from './bubble.js';
import { Canvas } from './canvas.js';
import { Picture } from './picture.js';
import { Text } from './text.js';
import { Emoji } from './emoji.js';
import { Path } from './path.js';
import { Arrow } from './arrow.js';
import { Chart } from './chart.js';
import { Group } from './group.js';

import { SVG } from './svg.js';

const ObjectType = {
	rect: Rectangle,
	label: Rectangle,
	bubble: Bubble,
	text: Text,
	emoji: Emoji,
	image: Picture,
	path: Path,
	arrow: Arrow,
	chart: Chart,
	group: Group,
	canvas: Canvas
};

export class EditorBase extends EventTarget {

	#root = [];
	#objects = new Map;

	get objects() { return this.#root; }
	get all() { return Array.from(this.#objects.values()); }

	on(event, cb) { 
		this.addEventListener(event, cb); 
	}

	emit(event, data) { 
		this.dispatchEvent(new CustomEvent(event, { detail: data })); 
	}

	find(id) {
		return this.#objects.get(id);
	}

	findGroup(idOrObject, remove=false, release=remove) {

		const id = typeof idOrObject == 'string' ? idOrObject : idOrObject.id;

		const find = (g) => {
			const objects = g.objects;
			const index = objects.findIndex(i => i.id == id);

			if (index >= 0) {

				if (remove) {
					const [o] = objects.splice(index, 1);

					if (remove == 'purge') {
						o.release();
						this.#objects.delete(id);
					}
				}

				return g;  // Found and reordered
			}
		};
	  
		let g;

		// Search through all groups for the object
		for (let obj of this.#objects.values()) {
			if (obj.type === 'group') {
				g = find(obj);
				if (g) 
					return g;
			}
		}
		
		return find(this, remove);
	}


	reset() {

		const objects = this.all;

		this.#root = [];
		this.#objects.clear();

		for (const i of objects)
			i.release();

		return objects;
	}

	save() {

		if (this.#root.length == 0) {
			console.warn('Nothing to save');
			return false;
		}

		const objects = this.#root.map(i => i.save());
	
		return objects;
	}

	open(objects) {

		let o;

		for (let i of objects) {
			o = this.create(i.type, null, i.id);
			o.load(i, this);
		}

		return this.all;
	}

	create(typeOrObjects, parent, id) {

		const o = typeof typeOrObjects == 'string' ? EditorBase.create(typeOrObjects) : typeOrObjects;

		if (id) o.id = id;

		this.#objects.set(o.id, o);

		if (parent) {
			const p = typeof parent == 'string' ? this.#objects.get(parent) : parent;
			p.objects.push(o);
		} else {
			this.#root.push(o);
		}

		return o;
	}

	remove(id) {
		return this.findGroup(id, 'purge');
	}

	copy(idOrObject) {
		const id = typeof idOrObject == 'string' ? idOrObject : idOrObject.id;

		const g = this.findGroup(id);
		const objects = g.objects;

		const index = objects.findIndex(i => i.id == id);
		const o = objects[index];
		const n = o.clone();

		this.create(n, g);

		return n;
	}

	reorderObject(id, delta) {

		const g = this.findGroup(id);
		const objects = g.objects;

		const index = objects.findIndex(i => i.id == id);
		const newIndex = Math.max(0, Math.min(objects.length - 1, index + delta));

		const o = objects[index];

		objects.splice(index, 1);  // Remove the object from its current position
		objects.splice(newIndex, 0, o);  // Insert at the new position

		return objects[index].id;
	}

	

	static create(type, ...params) {
		const Type = ObjectType[type] || Base;
		return new Type(...params); 
	}
}

export class EditorCanvas extends EditorBase {

	#r = { x: 1, y: 1 };

	#ctx;
	#zoom = 1;
	#x = 0;
	#y = 0;

	get canvas()  { return this.#ctx.canvas; }
	get context() { return this.#ctx; }
	get width() { return this.canvas.width; }
	get height() { return this.canvas.height; }

	constructor(canvas) {
		super();
		
		this.#ctx = canvas.getContext('2d');

		const r = canvas.getBoundingClientRect();
		this.setSize(r.width, r.height);
	}

	get zoom() { return this.#zoom; }
	set zoom(n) {

		this.#zoom = n;
		this.updateView();

		this.draw();
	}

	
	reset() {
		const objects = super.reset();

		this.#zoom = 1;
		this.#x = 0;
		this.#y = 0;

		this.draw();

		return objects;
	}

	setSize(width, height) {

		const parentWidth = width;
		const parentHeight = height;
		const canvas = this.canvas;

		// Canvas's original aspect ratio (4:3)
		const canvasAspectRatio = 4 / 3;

		// Determine the maximum size the canvas can be while respecting its aspect ratio
		let newWidth = parentWidth;
		let newHeight = parentWidth / canvasAspectRatio;

		if (newHeight > parentHeight) {
			newHeight = parentHeight;
			newWidth = parentHeight * canvasAspectRatio;
		}

		// Apply the new size to the canvas element
		canvas.style.width = `${newWidth}px`;
		canvas.style.height = `${newHeight}px`;

		// Adjust the canvas's internal resolution for rendering
		// canvas.width = newWidth;
		// canvas.height = newHeight;
		
		// console.debug('Resize:', r);


		// this.width = r.width;
		this.#r.x = canvas.width / newWidth;
		this.#r.y = canvas.height / newHeight;
	}

	add(type, parent=null) {
		const o = this.create(type, parent);

		if (o) {
			this.draw();
			this.emit('newobject', o.id);
		}

		return o;
	}

	remove(id) {
		super.remove(id);
		this.draw();
	}

	draw(selection=false, ...params) {

		const ctx = this.#ctx;

		ctx.save();

		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.translate(this.#x, this.#y);

		// ctx.save();
		ctx.scale(this.#zoom, this.#zoom);

		this.drawBefore(ctx);

		for (const i of this.objects) {
			if (!i.visible) continue;

			i.draw(ctx, ...params);

			if (selection && i.isSelected())
				i.drawSelection(ctx, ...params);
		}
		

		this.drawAfter(ctx, ...params);

		ctx.restore();

	}

	drawBefore() {}
	drawAfter() {}

	toSVG(canvas) {
		const w = Math.ceil(canvas.width)
			, h = Math.ceil(canvas.height);


		const svg = new SVG(w, h);

		for (const i of this.objects) {
			if (!i.visible) continue;

			i.drawSVG(svg, canvas);
		}

		return svg.toString();
	}

	getCordinates(x, y) {
		return [
			x * this.#r.x / this.#zoom - this.#x,
			y * this.#r.y / this.#zoom - this.#y
		];
	}


	updateZoom(d) {
		this.#zoom += d;
		this.updateView();
	}

	updatePosition(dx, dy) {
		this.#x += dx;
		this.#y += dy;
	}

	updateView(center=false) {

		const width = this.canvas.width
			, height = this.canvas.height
			, w = width * this.#zoom
			, h = height * this.#zoom;

		if (this.#zoom <= 1 || center) {

			this.#x = (width - w) / 2;
			this.#y = (height - h) / 2;
 
		} 

	}
}

//export const CanvasMixin 

