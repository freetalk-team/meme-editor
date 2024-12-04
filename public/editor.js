import './utils.js';

import { Bubble, Rectangle } from './bubble.js';
import { Canvas } from './canvas.js';
import { Picture } from './picture.js';
import { Text as Letterpress } from './text.js';
import { Emoji } from './emoji.js';
import { IndexDB } from './db.js';

import { wrapProjects, wrapObjects, wrapProperties, wrapTools } from './wrappers.js';

export default class Editor extends EventTarget {

	#ctx;
	#r;
	#objects = [];
	#image;
	#node;
	#selected;
	#object = {};
	#crop = [1, 1];
	#border = 2;
	#color = '#111111';
	#db;

	#current;

	// DOM
	#properties;
	#objs;
	#projs;

	get canvas()  { return this.#ctx.canvas; }
	get context() { return this.#ctx; }

	get width() { return this.canvas.width; }
	get height() { return this.canvas.height; }

	set width(v) {

		const canvas = this.canvas;

		canvas.width = v;
		canvas.height = v * 3/4;

		const r = canvas.getBoundingClientRect();

		this.#onResize(r);
	}

	set border(v) { this.#border = v; }
	set color(v) { 
		this.#color = v;
		this.#objects[0].fill = v;

		this.draw(this.#ctx);
	}


	constructor(canvas) {
		super();
		
		this.#ctx = canvas.getContext('2d');

		const r = canvas.getBoundingClientRect();
		this.#onResize(r);

		this.#registerCanvasEvents();
		this.#registerResizeEvents();


		this.reset();
	}

	on(event, cb) { 
		this.addEventListener(event, cb); 
	}

	async init(db) {

		if (!db) {

			db = new Database;

			await db.init();
		}

		this.#db = db;

		await this.#loadProjects();
	}

	reset() {
		if (this.#image)
			URL.revokeObjectURL(this.#image.src);

		this.#image = null;
		this.#current = null;
		// this.#objects.splice(1, this.#objects.length - 1);

		const canvas = new Canvas;

		canvas.width = this.canvas.width;
		canvas.height = this.canvas.height;

		this.#objects = [canvas];

		this.draw();

		if (this.#projs)
			this.#projs.clearSelection();

		if (this.#objs) 
			this.#objs.clear();
		
	}

	add(type='bubble', value='') {

		let o;

		switch (type) {

			case 'bubble':
			o = new Bubble;
			break;

			case 'rect':
			o = new Rectangle;
			break;

			case 'text':
			o = new Letterpress;
			o.value = 'Text';
			break;

			case 'emoji':
			o = new Emoji(value);
			break;
		}

		if (o) {

			o.x = 50 + Math.random() * 400;
			o.y = 10 + Math.random() * 300;

			this.#objects.push(o);
			this.draw();

			this.#emit('newobject', o.id);

			if (this.#objs) 
				this.#objs.add(o);
			
		}
		else {
			console.error('Unknown object type:', type);
		}

		return o;
	}

	remove(id) {

		const i = this.#objects.findIndex(i => i.id == id);

		if (i != -1) {
			
			const [o] = this.#objects.splice(i, 1);

			o.release();

			this.draw();
		}
	}

	move(id, offset) {
		const i = this.#objects.findIndex(o => o.id == id);

		if (i == -1) return;

		const j = i - offset > 0 ? i - offset : 1;
		if (i == j) return;

		const [o] = this.#objects.splice(i, 1);

		this.#objects.splice(j, 0, o);

		if (this.#objs)
			this.#objs.swap(i - 1, j - 1);

		this.draw();
	}

	async export(name='meme', type='jpeg') {

		const e = document.createElement('canvas');
		const ctx = e.getContext('2d');

		const canvas = this.#objects[0];

		e.width = canvas.width;
		e.height = canvas.height;

		ctx.drawImage(this.canvas, canvas.x, canvas.y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

		drawWatermark(ctx, 'www.sipme.io');

		

		if (showSaveFilePicker) {

			const opts = {
				types: [
				{
					description: "Image file",
					accept: {
						"image/*": [".png", ".jpeg", ".jpg"],
					},
					suggestedName: 'meme.jpeg',
					startIn: 'pictures'
				},
				],
			};
			
			const file = await showSaveFilePicker(opts);
		// console.log('#', file);

			let [, ext] = file.name.split('.');

			if (ext == 'jpg') ext = 'jpeg';

			const mime = 'image/' + ext;

			const blob = await new Promise(resolve => e.toBlob(resolve, mime));

			const writable = await file.createWritable();

			await writable.write(blob);
			await writable.close();

		}
		else {
			const img = e.toDataURL('image/' + type);
			const a = document.createElement('a');

			a.download = name + '.' + type;
			a.href = img;

			a.click();
		}
	}

	async import(files) {

		if (!files) {
			const pickerOpts = {
				types: [
					{
					description: "Images",
					accept: {
						"image/*": [".png", ".webp", ".jpeg", ".jpg"],
					},
					},
				],
				excludeAcceptAllOption: true,
				multiple: true,
			};
		
			const handles = await showOpenFilePicker(pickerOpts);
			
			files = await Promise.all(handles.map(i => i.getFile()));
		}

		let img;
		
		for (const i of files) {

			img = new Picture;

			await img.load(i);

			img.x = Math.random() * (this.width - img.width);
			img.y = Math.random() * (this.height - img.height);

			this.#objects.push(img);

			if (this.#objs)
				this.#objs.add(img);
		}

		if (files.length > 1) {
			this.alignImages();
		}
		else {
			this.draw();
		}

	}

	async importInImage(files) {
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

	async save(id) {

		if (this.#objects.length < 2) {
			console.warn('Nothing to save');
			return;
		}

		const objects = this.#objects.map(i => Object.fromInstance(i, {}));

		console.debug(objects);

		try {

			await this.#db.put('meme', { id, objects, ts: Date.now() });

			if (this.#projs) {
				const projects = this.#projs.getElementIds();

				if (!projects.includes(id))
					this.#projs.add({ id, objects: this.#objects }, true);

				this.#projs.selectItem(id);
			}

			this.#emit('save', id);
		}
		catch(e) {
			console.error('Failed to save project');
		}
	}

	async open(id) {
		if (id == this.#current)
			return;

		const ObjectType = {
			rect: Rectangle,
			bubble: Bubble,
			text: Letterpress,
			emoji: Emoji,
			image: Picture,
			canvas: Canvas
		};

		try {

			const data = await this.#db.get('meme', id);

			console.debug('Open projects', data);

			for (const i of this.#objects)
				i.release();

			this.#objects = data.objects.map(i => Object.instanceFrom(new ObjectType[i.type], i));

			this.#current = id;

			const images = this.#objects.filter(i => i.type == 'image');

			await Promise.all(images.map(i => i.image()));

			this.draw();

			if (this.#projs) 
				this.#projs.selectItem(id);

			if (this.#objs) {

				this.#objs.clear();

				for (const i of this.#objects.slice(1)) 
					this.#objs.add(i);
			}

			this.#emit('open', id);
		}
		catch(e) {
			console.error('Failed to load objects');
		}

	}

	async delete(project) {

		if (project == this.#current) {
			this.reset();
		}

		try {

			await this.#db.rm('meme', project);

			if (this.#projs)
				this.#projs.delete(project);

				tjis.#emit('delete', project);
		}
		catch (e) {
			console.error('Failed to delete project');
		}

	}

	draw() {

		const ctx = this.#ctx;

		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		if (this.#image)
			ctx.drawImage(this.#image, 0, 0);

		for (const i of this.#objects)
			i.draw(ctx);
	}
	
	update(prop, value, o=this.#selected) {

		if (typeof o == 'string') o = this.#objects.find(i => i.id == o);
		if (!o) return;

		const setter = Object.getSetter(o, prop);

		if (setter) {
			setter.call(o, value);

			this.draw();

			if (this.#properties) {

				switch (prop) {

					
					case 'imgScale':
					this.#properties.assign({
						width: o.width,
						height: o.height,
						imgWidth: o.imgWidth,
						imgHeight: o.imgHeight,
					});
					break;

					case 'imgWidth':
					this.#properties.assign({ imgHeight: o.imgHeight });
					break;

					case 'imgHeight':
					this.#properties.assign({ imgWidth: o.imgWidth });
					break;
					
				}
			}
		}
	}

	select(id) {

		if (this.#selected && id == this.#selected.id)
			return;

		const o = this.#objects.find(i => i.id == id);

		if (o) {

			o.selected = true;

			if (this.#selected) 
				this.#selected.selected = false;

			this.#selected = o;

			if (this.#properties)
				o.properties = this.#properties;

			const object = Object.fromInstance(o);

			this.#emit('select', object);
		}

		this.draw();
	}

	alignImages() {
		const H = this.canvas.height
			, W = this.canvas.width
			, images = this.#objects.filter(i => i.type == 'image')
			, totalWidth = images.map(i => i.width).sum()
			;

		let img, x = 0, y = 0
			, maxHeight = images.map(i => i.imgHeight).max();

		let r = W / totalWidth, p;

		maxHeight *= r;
		y = (H - maxHeight) / 2;

		const canvas = this.#objects[0];

		canvas.y = y;
		canvas.height = maxHeight;
		canvas.width = W;

		for (const i of images) {

			r = i.imgHeight / i.imgWidth;
			p = i.width / totalWidth;

			i.width = p * W;
			i.height = r * i.width;

			i.imgWidth = i.width;
			i.imgHeight = i.height;

			i.height = maxHeight;
			i.imgY = (i.height - i.imgHeight) / 2;

			i.x = x;
			i.y = y;
			
			x += i.width;

			if (this.#properties) {

				if (i == this.#selected)
					i.properties = this.#properties;

			}
		}

		this.draw();
	}

	async detectHuman() {

		const path = await this.#selected.detectHuman();

		this.draw();
	}

	wrapProperties(container) {
		return this.#properties = wrapProperties(container, this);
	}

	wrapObjects(container, template) {
		return this.#objs = wrapObjects(container, this, template);
	}

	wrapProjects(container, template) {
		return this.#projs = wrapProjects(container, this, template);
	}

	wrapTools(container) {
		wrapTools(container, this);
	}


	#onResize(r) {

		const canvas = this.canvas;

		// this.width = r.width;
		this.#r = [ canvas.width / r.width,  canvas.height / r.height];

		this.draw();

	}

	#registerCanvasEvents() {

		const canvas = this.canvas;

		canvas.onclick = (e) => {

			if (this.#node) {
				this.#node = null;
				return;
			}

			let x = e.offsetX * this.#r[0] // - e.offsetX
				, y = e.offsetY * this.#r[1]// - e.offsetY
				;

			let s;

			for (const i of [...this.#objects].reverse()) {

				if (i.handleSelect(x, y)) {
					s = i;
					// console.log('Bubble selected');
					x = -10000;
					y = -10000;

					if (this.#properties) {
						// this.#properties.setAttribute('mode', i.type);

						i.properties = this.#properties;
					}


				}
			}

			if (this.#selected != s) {
				this.#selected = s;
				this.draw();

				const object = s ? Object.fromInstance(s) : null;

				if (this.#objs) {

					if (s)
						this.#objs.selectItem(object.id);
					else
						this.#objs.clearSelection();
				}

				this.#emit('select', object);
			}

		}

		canvas.onmousemove = (e) => {

			if (!this.#node) return;

			const x = e.offsetX * this.#r[0]
				, y = e.offsetY * this.#r[1]
				;

			this.#node.move(x, y);
			this.draw();

			if (this.#properties) {

				const o = this.#selected;

				this.#properties.set('x', o.x);
				this.#properties.set('y', o.y);
				this.#properties.set('width', o.width);
				this.#properties.set('height', o.height);
			}

			this.#emit('update', { x, y });
		}

		// this.canvas.onmouseup = () => this.#node = null;

		canvas.onmousedown = (e) => {

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

		}

		canvas.onkeydown = (e) => {

			const key = e.key;

			if (this.#selected) {

				if (key.startsWith('Arrow')) {

					const d = key.substr(5);

					switch (d) {

						case 'Up':
						this.#selected.y -= 5;
						break;

						case 'Down':
						this.#selected.y += 5;
						break;

						case 'Left':
						this.#selected.x -= 5;
						break;

						case 'Right':
						this.#selected.x += 5;
						break;

					}

					this.draw();
				}

			}
		}
	}

	#registerResizeEvents() {
		const resizeObserver = new ResizeObserver(e => this.#onResize(e[0].contentRect));
		resizeObserver.observe(this.canvas);
	}

	#emit(event, data) { 
		this.dispatchEvent(new CustomEvent(event, { detail: data })); 
	}

	async #loadProjects() {

		const projects = await this.#db.latest('meme');

		console.debug('Projects loaded', projects);

		for (const i of projects) {
			if (this.#projs) 
				this.#projs.add(i);
		}

		this.#emit('projects', projects);

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

function drawWatermark(ctx, text, height=ctx.canvas.height) {
	//ctx.translate(btn.x, btn.y);
	//ctx.rotate(angle);

	const W = ctx.canvas.width;

	const s = W / 50
		, x = W * 0.01
		, y = height - x
		;
	
	// ctx.rotate(-Math.PI/2);

	ctx.save();
	
	ctx.fillStyle = '#888';
	ctx.textBaseline = "middle";
	ctx.textAlign = "left";
	ctx.font = "bold " + `${s}px` + " monospace";
	ctx.fillText(text, x, y);

	ctx.restore();
}

class Database extends IndexDB {

	get name() { return 'meme'; }
	get version() { return 1; }

	onUpgrade(db, txn, ver) {
		switch (ver) {
		
			case 0:
			Database.addTable(db, 'meme');
			Database.addIndex('meme', 'ts', txn);
			break;
		}
	}
}
