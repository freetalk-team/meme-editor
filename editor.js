import { Bubble } from './bubble.js';

export default class Editor {

	#canvas;
	#ctx;
	#r;
	#objects = [];
	#image;
	#node;
	#selected;
	#properties;
	#object = {};
	#crop = [1, 1];
	#border = 2;
	#color = '#111111';

	get canvas()  { return this.#ctx.canvas; }
	get context() { return this.#ctx; }

	set width(v) {
		this.canvas.width = v;
		this.canvas.height = v * 3/4;
	}

	set border(v) { this.#border = v; }
	set color(v) { this.#color = v; }

	constructor(canvas, properties) {
		this.#ctx = canvas.getContext('2d');

		const r = canvas.getBoundingClientRect();
		this.#onResize(r);

		this.#registerCanvasEvents();
		this.#registerResizeEvents();

		if (properties) {
			this.#properties = properties;
			this.#registerPropertiesEvents();
		}
	}

	add(type='bubble') {

		let o;

		switch (type) {

			case 'bubble':
			o = new Bubble(this);
			break;

			case 'rect':
			break;

		}

		if (o) {
			this.#objects.push(o);
			this.draw();
		}
		else {
			console.error('Unknown object type:', type);
		}

		return o;

	}

	export(name='meme', type='jpeg') {

		const e = document.createElement('canvas');
		const ctx = e.getContext('2d');

		e.width = this.canvas.width * this.#crop[0];
		e.height = this.canvas.height * this.#crop[1];

		ctx.drawImage(canvas, 0, 0);

		const img = e.toDataURL('image/' + type);
		const a = document.createElement('a');

		a.download = name + '.' + type;
		a.href = img;

		a.click();

	}

	async import(files) {
		if (this.#image)
			URL.revokeObjectURL(this.#image.src);

		const e = document.createElement('canvas');
		const canvas = this.canvas;

		e.width = canvas.width;
		e.height = canvas.height;

		const ctx = e.getContext("2d");

		let x = 0, y = 0, r, width = canvas.width, height, img;

		let maxWidth = 0, maxHeight = 0;
		let images = [];

		for (const i of files) {
			img = await loadImage(i);
			images.push(img);

			if (maxWidth < img.width)
				maxWidth = img.width;

			if (maxHeight < img.height)
				maxHeight = img.height;
		}

		const totalWidth = images.map(i => i.width).reduce((a, b) => a + b, 0);
		
		r = canvas.width / totalWidth;

		maxWidth *= r;
		maxHeight *= r;
		
		for (let i = 0, p; i < images.length; ++i) {

			img = images[i];

			p = img.width / totalWidth;
			width = img.width * r;
			height = img.height * r;

			y = 0;

			if (height < maxHeight) {
				y += (maxHeight - height) / 2;
			}

			console.log('Draw image:', x, y, width, height);
			ctx.drawImage(img, x, y, width, height);

			ctx.lineWidth = this.#border;
			ctx.strokeStyle = this.#color;
			ctx.strokeRect(x, 0, width, maxHeight);

			drawWatermark(ctx, 'www.sipme.io', maxHeight);

			URL.revokeObjectURL(img.src);

			x += width;
		}

		this.#image = await loadImage(e.toDataURL('image/png'));
		// image = await loadImage(e.toDataURL('image/octet-stream'));

		this.#crop[1] = maxHeight / canvas.height;
		this.draw();
	}

	draw() {

		const ctx = this.#ctx;

		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		if (this.#image)
			ctx.drawImage(this.#image, 0, 0);

		for (const i of this.#objects)
			i.draw();
	}

	#onResize(r) {

		const canvas = this.canvas;

		this.width = r.width;
		this.#r = [ canvas.width / r.width,  canvas.height / r.height];

		this.draw();

	}

	#registerCanvasEvents() {

		this.canvas.onclick = (e) => {

			if (this.#node) return;

			let x = e.offsetX * this.#r[0] // - e.offsetX
				, y = e.offsetY * this.#r[1]// - e.offsetY
				;

			let s;

			for (const i of [...this.#objects].reverse()) {

				if (i.handleSelect(x, y)) {
					s = i;
					// console.log('Bubble selected');
					x = -10;
					y = -10;

					i.selected = this.#object;
				}
			}

			if (this.#selected != s) {
				this.#selected = s;
				this.draw();
			}

			if (this.#properties) {
				if (this.#selected) 
					this.#properties.classList.remove('hidden');
				else 
					this.#properties.classList.add('hidden');

			}

		}

		this.canvas.onmousemove = (e) => {

			if (!this.#node) return;

			const x = e.offsetX * this.#r[0]
				, y = e.offsetY * this.#r[1]
				;

			this.#node.move(x, y);

			this.draw();
		}

		this.canvas.onmouseup = () => this.#node = null;

		this.canvas.onmousedown = (e) => {

			const x = e.offsetX * this.#r[0] // - e.offsetX
				, y = e.offsetY * this.#r[1]// - e.offsetY
				;

			this.#node = null;

			for (const i of this.#objects) {


				if (this.#node = i.handleClick(x, y)) {

					console.log('Bubble found');
					break;
				}
			}

			console.log(e);
		}
	}

	#registerPropertiesEvents() {

		const inputs = this.#properties.querySelectorAll('input,select,textarea');
		for (const i of inputs) {
			const name = i.id || i.getAttribute('role');

			if (name) {
				const [type, id] = name.split('-');

				if (type == 'object') 
					this.#object[id] = i;
			}
		}

		this.#properties.oninput = (e) => {

			const target = e.target;
			if (!target.value) return;

			const name = target.id || target.getAttribute('role');
			if (!name) return;

			let [type, id] = name.split('-')
				, value = target.value;

			if (target.type == 'checkbox') {
				value = target.checked;

				const a = target.getAttribute('for');

				if (a) {
					[type, id] = a.split('-');

					if (value) {
						const e = target.nextElementSibling; // todo: improve
						value = e.value;
					}
					else {
						value = '';
					}
				}
			}

			if (type == 'object' && this.#selected) {
				console.log('On update');
				
				const descriptor = Object.getOwnPropertyDescriptor(Bubble.prototype, id);

				if (descriptor)
					descriptor.set.call(this.#selected, value);

				this.draw();
			}

		}

	}

	#registerResizeEvents() {
		const resizeObserver = new ResizeObserver(e => this.#onResize(e[0].contentRect));
		resizeObserver.observe(this.canvas);
	}
}


function loadImage(file) {

	return new Promise((resolve, reject) => {

		const img = new Image;

		img.src = file instanceof Blob ? URL.createObjectURL(file) : file;

		img.onload = () => resolve(img);
		img.onerror = reject;

	});
}

function drawWatermark(ctx, text, height=ctx=canvas.height) {
	ctx.save();
	//ctx.translate(btn.x, btn.y);
	//ctx.rotate(angle);

	const W = ctx.canvas.width;

	const s = W / 50
		, x = W * 0.01
		, y = height - x
		;
	
	// ctx.rotate(-Math.PI/2);
	
	ctx.fillStyle = '#888';
	ctx.textBaseline = "middle";
	ctx.textAlign = "left";
	ctx.font = "bold " + `${s}px` + " monospace";
	ctx.fillText(text, x, y);
	ctx.restore();
}