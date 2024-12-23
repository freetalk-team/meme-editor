import './utils.js';

import { Bubble, Rectangle } from './bubble.js';
import { Canvas } from './canvas.js';
import { Picture } from './picture.js';
import { Text as Letterpress } from './text.js';
import { Emoji } from './emoji.js';
import { Path } from './path.js';
import { Arrow } from './arrow.js';

import { IndexDB } from './db.js';
import { WebGL } from './webgl.js';

import { wrapProjects, wrapObjects, wrapProperties, wrapTools, wrapCanvas, wrapStatus, wrapActions } from './wrappers.js';

const kSite = 'www.sipme.io';

const defaultListHandler = {
	add() {},
	select() {},
	delete() {},
	clear() {},
	clearSelection() {},
	swap() {}
};

const defaultHandler = {
	set() {},
	assign() {},
	mode() {}
};

export default class Editor extends EventTarget {

	#ctx;
	#gl;
	#r;

	#objects = [];
	#bg = new Canvas;
	#image;
	#selected;
	#crop = [1, 1];
	#border = 2;
	#fill = '#eeeeee';
	#stroke = '#111111';
	#strokeWidth = 1;

	#mode = 'select';
	#vkeys = {};
	#hover = false;

	#db;

	#zoom = 1;
	#X = 0;
	#Y = 0;
	#x = 0;
	#y = 0;

	#current;
	#path;
	#node;
	#nodes = [];
	#selectedNodes = [];

	#history = [];
	#historyIndex = 0;
	#historyUpdateTimeout = {};

	// DOM
	#dom = {
		properties: defaultHandler, 
		objects: defaultListHandler,
		projects: defaultListHandler,
		canvas: defaultHandler,
		status: defaultHandler,
		tools: defaultHandler
		
	};

	get canvas()  { return this.#ctx.canvas; }
	get context() { return this.#ctx; }

	get width() { return this.canvas.width; }
	get height() { return this.canvas.height; }

	set width(n) {

		const w = n > 800 ? n : 800;

		const canvas = this.canvas;
		// const s = canvas.width / v;

		canvas.width = w;
		canvas.height = w * 3/4;

		this.#bg.width = n;
		this.#bg.x = (w - n) / 2;

		if (this.#bg.height < canvas.height) {
			this.#bg.y = (canvas.height - this.#bg.height) / 2;
		}
		else {
			this.#bg.y = 0;
			this.#bg.height = canvas.height;
		}

		const r = canvas.getBoundingClientRect();

		this.#onResize(r);
	}

	set height(n) {

		if (n > this.canvas.height) n = this.canvas.height;

		this.#bg.y = (this.canvas.height - n) / 2;
		this.#bg.height = n;

		if (this.#dom.canvas)
			this.#bg.properties = this.#dom.canvas;

		this.draw();
	}

	// set border(v) { this.#border = v; }
	// set color(v) { 
	// 	this.#color = v;
	// 	this.#objects[0].fill = v;

	// 	this.draw(this.#ctx);
	// }

	set fill(v) {
		this.#fill = v;
	}

	set stroke(v) {
		this.#stroke = v;
	}

	set strokeWidth(n) {
		this.#strokeWidth = n;
	}

	set mode(v) {


		switch (this.#mode) {
			case 'draw':
			if (this.#path) {
				this.#path = null;
			}
			break;

			case 'edit':
			this.#nodes = [];
			break;
		}

		this.#mode = v;

		switch (this.#mode) {
			case 'edit':
			if (this.#selected)
				this.#nodes = this.#selected.getNodes();
			break;
		}

		this.draw();

		this.#dom.tools.mode(this.#mode);
	}

	set zoom(n) {

		this.#zoom = n;
		this.#updateView();

		this.draw();
	}

	constructor(canvas) {
		super();
		
		this.#ctx = canvas.getContext('2d');

		try {
			if (!window.glfx) 
				window.glfx = new WebGL();

			this.#gl = glfx;
		}
		catch (e) {
			console.error('Failed to init WbGL');
		}

		const r = canvas.getBoundingClientRect();
		this.#onResize(r);

		this.#registerCanvasEvents();
		this.#registerResizeEvents();

		this.#bg.width = 1200;
		this.#bg.height = 630;

		this.width = 1200;

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

		await tf.setBackend('webgl');
	}

	reset() {
		if (this.#image)
			URL.revokeObjectURL(this.#image.src);

		this.#selected = null;
		this.#image = null;
		this.#current = null;
		this.#history = [];
		this.#historyIndex = 0;
		this.#path = null;
		this.#mode = 'select';
		this.#nodes = [];
		// this.#objects.splice(1, this.#objects.length - 1);

		this.#zoom = 1;
		this.#X = 0;
		this.#Y = 0;

		this.#objects = [this.#bg];

		this.draw();
		this.canvas.focus();

		this.#dom.projects.clearSelection();
		this.#dom.objects.clear();
		this.#bg.properties = this.#dom.canvas;

		this.#dom.tools.mode('select');
	}

	draw() {

		const ctx = this.#ctx;

		ctx.save();

		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		ctx.scale(this.#zoom, this.#zoom);
		ctx.translate(this.#X, this.#Y);

		// ctx.fillStyle = '#fff';
		// ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		if (this.#image)
			ctx.drawImage(this.#image, 0, 0);

		for (const i of this.#objects)
			if (i.visible)
				i.draw(ctx, this.#mode);

		if (this.#selected?.visible)
			this.#selected.drawSelection(ctx, this.#mode);	

		if (this.#path)
			this.#path.draw(ctx, this.#mode);
		
		if (this.#mode == 'edit' && this.#selected?.visible) {
			for (const i of this.#nodes)
				i.draw(ctx);
		}

		ctx.restore();
		
	}

	add(type='bubble', value='') {

		let o;

		switch (type) {

			case 'bubble':
			o = new Bubble;
			break;

			case 'rect':
			case 'rectext':
			o = new Rectangle;
			break;

			case 'text':
			o = new Letterpress;
			o.value = 'Text';
			break;

			case 'emoji':
			o = new Emoji(value);
			break;

			case 'arrow':
			o = new Arrow;
			break;
		}

		if (o) {

			this.#mode = 'select';

			o.fill = this.#fill;
			o.stroke = this.#stroke;
			o.strokeWidth = this.#strokeWidth;

			o.x = 50 + Math.round(Math.random() * 400);
			o.y = 10 + Math.round(Math.random() * 300);

			this.#objects.push(o);
			this.select(o);

			this.#emit('newobject', o.id);

			this.#dom.objects.add(o);
			
		}
		else {
			console.error('Unknown object type:', type);
		}

		return o;
	}

	remove(id=this.#selected?.id) {

		const i = this.#objects.findIndex(i => i.id == id);

		if (i != -1) {
			
			const [o] = this.#objects.splice(i, 1);

			o.release();


			if (id == this.#selected?.id) {

				this.#selected = null;
				this.#emit('select', null);
				this.#dom.properties.mode();
			}

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
		this.#dom.objects.swap(i - 1, j - 1);

		this.draw();
	}

	applyMask(id) {
		let i = this.#objects.findIndex(o => o.id == id);
		if (i < 2) return;

		const path = this.#objects[i];

		for (i--; i >= 0; --i) {
			const o = this.#objects[i];
			if (o.type == 'image') {
				o.setMask(path);

				this.#dom.properties.set('mask', path.name, path.id);
				this.draw();

				return;
			}
		}
	}

	export(name='meme', type='jpeg') {

		const e = document.createElement('canvas');
		const ctx = e.getContext('2d');

		const canvas = this.#objects[0];

		e.width = canvas.width;
		e.height = canvas.height;

		ctx.drawImage(this.canvas, canvas.x, canvas.y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

		drawWatermark(ctx, kSite);

		return exportCanvas(e, name, type);
	}

	exportObject() {
		if (!this.#selected) return;

		const o = this.#selected;

		o.selected = false;
		this.draw();

		const e = document.createElement('canvas');
		// const e = new OffscreenCanvas(o.width, o.height);
		const ctx = e.getContext('2d');

		e.width = o.width;
		e.height = o.height;

		ctx.drawImage(this.canvas, o.x, o.y, o.width, o.height, 0, 0, o.width, o.height);

		o.selected = true;
		this.draw();

		// drawWatermark(ctx, kSite);

		return exportCanvas(e, o.name, 'png');
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

		const maxWidth = this.#bg.width
			, maxHeight = this.#bg.height
			;
		
		for (const i of files) {

			img = new Picture(this.#gl);

			await img.load(i, maxWidth, maxHeight);

			img.x = Math.round(Math.random() * (this.width - img.width));
			img.y = Math.round(Math.random() * (this.height - img.height));

			this.#objects.push(img);
			this.#dom.objects.add(img);
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

			ctx.lineWidth = 1;
			ctx.strokeStyle = '#eeeeee';
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

			if (this.#dom.projects) {
				const projects = this.#dom.projects.getElementIds();

				if (!projects.includes(id))
					this.#dom.projects.add({ id, objects: this.#objects }, true);

				this.#dom.projects.selectItem(id);
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

		this.reset();

		const ObjectType = {
			rect: Rectangle,
			label: Rectangle,
			bubble: Bubble,
			text: Letterpress,
			emoji: Emoji,
			image: Picture,
			path: Path,
			arrow: Arrow,
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
			const paths = Object.fromArray(this.#objects.filter(i => i.type == 'path'));

			await Promise.all(images.map(i => i.image()));

			let mask;

			for (const i of images) {
				mask = i.maskPath;
				if (mask) {
					mask = paths[mask];
					if (mask) {
						i.setMask(mask, false);
					}
				}
			}

			this.draw();
			this.#emit('open', id);

			this.#dom.projects.select(id);

			for (const i of this.#objects.slice(1)) 
				this.#dom.objects.add(i);

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

			this.#emit('delete', project);
			this.#dom.projects.delete(project);

		}
		catch (e) {
			console.error('Failed to delete project');
		}

	}

	
	
	update(prop, value, o=this.#selected) {

		if (typeof o == 'string') o = this.#objects.find(i => i.id == o);
		if (!o) return;

		const { setter, getter } = Object.getProperty(o, prop);

		if (setter) {

			if (getter) {

				if (!this.#historyUpdateTimeout[prop]) {

					this.#historyUpdateTimeout[prop] = setTimeout(() => {

						this.#history.splice(this.#historyIndex++, this.#history.length);

						const value = getter.call(o);
						const values = {};

						values[prop] = value;

						console.debug('Adding to history', this.#historyIndex, prop, '=>', value);

						const e = { id: o.id, values };

						this.#history.push(e);
						this.#historyUpdateTimeout[prop] = null;

					}, 2000);

				}
				
			}

			setter.call(o, value);

			this.draw();

			switch (prop) {
				
				case 'imgScale':
				this.#dom.properties.assign({
					width: o.width,
					height: o.height,
					imgWidth: o.imgWidth,
					imgHeight: o.imgHeight,
				});
				break;

				case 'imgWidth':
				this.#dom.properties.assign({ imgHeight: o.imgHeight });
				break;

				case 'imgHeight':
				this.#dom.properties.assign({ imgWidth: o.imgWidth });
				break;
				
			}
		}
	}

	select(id) {
		if (this.#select(id))
			this.draw();
	}

	removeNode() {

		const node = this.#selectedNodes.shift();
		if (node == null) return;

		if (this.#selected.remove(node)) {
			this.#nodes = this.#nodes.filter(i => i != node);
			this.draw();
		}

	}

	insertNode() {
		let node = this.#selectedNodes[0]
		if (node == null) return;

		node = this.#selected.split(node);

		this.#nodes.push(node);

		this.draw();
	}

	copy(id) {
		let o, i = this.#objects.length;

		if (typeof id == 'string') {
			i = this.#objects.findIndex(i => i.id == id);
			if (i == -1) return;

			o = this.#objects[i];
			
		}
		else
			o = id;


		const data = Object.fromInstance(o);
		const b = new o.__proto__.constructor(o);

		Object.instanceFrom(b, data);

		b.id = data.id + '_2';
		b.x += 10;
		b.y += 10;

		this.#objects.splice(i + 1, 0, b);
		this.draw();

		this.#dom.objects.add(b, i - 1); // canvas is 0
	}

	undo() {
		if (this.#historyIndex > 0) {
			this.#updateFromHistory(--this.#historyIndex, true);
		}
	}

	redo() {
		if (this.#historyIndex < this.#history.length - 1) {
			this.#updateFromHistory(++this.#historyIndex);
		}
	}

	alignImages() {
		const H = this.#bg.height
			, W = this.#bg.width
			, images = this.#objects.filter(i => i.type == 'image')
			, totalWidth = images.map(i => i.width).sum()
			;

		let x = this.#bg.x, y = this.#bg.y
			, maxHeight = images.map(i => i.imgHeight).max();

		let r = W / totalWidth, p;

		maxHeight *= r;
		y += (H - maxHeight) / 2;

		// const canvas = this.#objects[0];

		// canvas.y = y;
		// canvas.height = maxHeight;
		// canvas.width = W;

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


			if (i == this.#selected)
				i.properties = this.#dom.properties;

		}

		this.draw();
	}

	centerImage() {
		if (!this.#selected || this.#selected.type != 'image')
			return;

		const o = this.#selected;

		const W = o.width
			, H = o.height
			, w = o.imgWidth
			, h = o.imgHeight
			;

		if (w < W)
			o.imgX = Math.round((W - w) / 2);
		
		if (h < H)
			o.imgY = Math.round((H - h) / 2);

		this.draw();
	}

	centerView() {
		this.#updateView(true);
		this.draw();
	}

	async detectBody(threshold) {

		if (!this.#selected || this.#selected.type != 'image') return;

		const path = await Path.detectBody(this.#selected, threshold);

		if (path) {
			this.#path = path;
			this.#addPath();
			this.draw();
		}

		this.#dom.properties.set('mask', path.name, path.id);
	}

	wrap() {

		this.wrapProperties('properties');
		this.wrapObjects('objects', 'item-object');
		this.wrapProjects('projects', 'item-project');
		this.wrapCanvas('background');
		this.wrapStatus('status');
		this.wrapActions('actions');
		this.wrapTools('tools');

		const body = document.body;

		body.ondragover = (e) => e.preventDefault();
		body.ondrop = (e) => {
			// console.log("File(s) dropped");

			// Prevent default behavior (Prevent file from being opened)
			e.preventDefault();

			const files = [];

			if (e.dataTransfer.items) {
				// Use DataTransferItemList interface to access the file(s)
				for (const item of e.dataTransfer.items) {
					// If dropped items aren't files, reject them
					if (item.kind === "file") {
						const file = item.getAsFile();
						// console.log(`… file[${i}].name = ${file.name}`);

						files.push(file);
					}
				}
			} else {
				// Use DataTransfer interface to access the file(s)
				e.dataTransfer.files.forEach((file, i) => {
					console.log(`… file[${i}].name = ${file.name}`);

					files.push(file);
				});
			}

			console.log("File(s) dropped", files);

			this.import(files);
		}
	}

	wrapProperties(container) {
		return this.#dom.properties = wrapProperties(container, this);
	}

	wrapObjects(container, template) {
		return this.#dom.objects = wrapObjects(container, this, template);
	}

	wrapProjects(container, template) {
		return this.#dom.projects = wrapProjects(container, this, template);
	}

	wrapCanvas(container) {
		this.#dom.canvas = wrapCanvas(container, this);
		this.#bg.properties = this.#dom.canvas;

		return this.#dom.canvas;
	}

	wrapTools(container) {
		return this.#dom.tools = wrapTools(container, this);
	}

	wrapStatus(container) {
		return this.#dom.status = wrapStatus(container);
	}

	wrapActions(container) {
		return this.#dom.actions = wrapActions(container, this);
	}

	#updateFromHistory(index, undo=false) {
		const { id, values } = this.#history[index];
		const latest = {};
		const o = this.#objects.find(i => i.id == id);

		if (o) {


			for (const [prop, value] of Object.entries(values)) {

				const { setter, getter } = Object.getProperty(o, prop);

				if (getter)
					latest[prop] = getter.call(o);

				if (setter)
					setter.call(o, value);

				this.#dom.properties.set(prop, value);
				
			}

			this.draw();

			if (undo && index == this.#history.length - 1) {
				this.#history.push({ id, values: latest });
			}
			
		}
	}

	#select(id) {
		let o;

		console.debug('## Select:', id);

		if (typeof id == 'string') {
			if (this.#selected && id == this.#selected.id)
				return false;

			o = this.#objects.find(i => i.id == id);

		}
		else {
			o = id;
		}

		let data;
		
		if (o) {
			o.selected = true;
			o.properties = this.#dom.properties;

			data = Object.fromInstance(o);
		}

		const changed = this.#selected != o;

		if (changed) {

			if (this.#selected) 
				this.#selected.selected = false;

			this.#selected = o;

			this.#dom.properties.mode(o?.type);
			this.#dom.objects.select(o?.id);

			this.#emit('select', data);
		}

		return changed;
	}

	#onResize(r) {

		const canvas = this.canvas;

		// this.width = r.width;
		this.#r = [ canvas.width / r.width,  canvas.height / r.height];

		// const bg = this.#objects[0];

		

		this.draw();

	}

	#addPath(path=this.#path) {
		
		if (!path.closed)
			path.end();

		this.#objects.push(path);
		this.#path = null;

		this.#select(path);
		this.#dom.objects.add(path);
	}

	#handleSelectClick(x, y) {
		if (this.#node) {

			if (this.#selected) {

				this.#history.splice(this.#historyIndex++, this.#history.length);

				const e = { 
					id: this.#selected.id, 
					values: {
						x: this.#node.x,
						y: this.#node.y,
						width: this.#node.width,
						height: this.#node.height
					} 
				};

				this.#history.push(e);

			}

			this.#node = null;

			return;
		}

		if (this.#selected)
			this.#selected.selected = false;

		let o;

		for (const i of [...this.#objects].reverse()) {

			if (i.visible && i.handleSelect(x, y)) {
				o = i;
				break;
			}
		}

		this.select(o);
	}

	#handleSelectDown(x, y) {
		this.#node = null;

		for (const i of this.#objects) {
			if (this.#node = i.handleClick(x, y, 'select')) {

				this.#node.x = i.x;
				this.#node.y = i.y;
				this.#node.width = i.width;
				this.#node.height = i.height;

				break;
			}
		}
	}

	#handleSelectMove(x, y) {
		if (!this.#node) return;

		for (let i = 1, p, o; i < this.#objects.length; ++i) {

			o = this.#objects[i];

			if (o == this.#selected)
				continue;

			if (p = o.snap(x, y)) {
				x = p[0];
				y = p[1];
				break;
			}

		}

		this.#node.move(x, y);
		this.draw();


		const o = this.#selected;


		if (o) {
			const data = {
				x: o.x,
				y: o.y,
				width: o.width,
				height: o.height,
				angle: o.angle
			};

			this.#dom.properties.assign(data);
			this.#emit('update', data);
		}

	}

	#handleDrawClick(x, y) {

	}

	#handleDrawDown(x, y) {

		if (!this.#path) {
			this.#path = new Path;

		}

		this.#path.mouseDown(x, y, this.#vkeys);

		if (this.#path.closed) {
			this.#addPath();
		}

		this.draw();
		
	}

	#handleDrawUp(x, y) {
		if (this.#path) {
			this.#path.mouseUp(x, y, this.#vkeys);
			this.draw();
		}
	}

	#handleDrawMove(x, y) {

		if (this.#path) {
			this.#path.mouseMove(x, y, this.#vkeys);
			this.draw();
		}

	}

	#handleEditDown(x, y) {
		this.#node = null;

		for (const i of this.#nodes) {
			if (this.#node = i.handleSelect(x, y)) {
				this.draw();

				this.#dom.actions.mode('edit');
				return;
			}
		}

		this.#dom.actions.mode('');
	}

	#handleEditMove(x, y) {
		if (!this.#node) return;

		this.#node.move(x, y);
		this.draw();

		// if (this.#dom.properties) {

		// 	const o = this.#selected;

		// 	if (o) {
		// 		this.#dom.properties.set('x', o.x);
		// 		this.#dom.properties.set('y', o.y);
		// 		this.#dom.properties.set('width', o.width);
		// 		this.#dom.properties.set('height', o.height);
		// 	}
		// }

		// this.#emit('update', { x, y });
	}

	#handleEditClick(x, y) {

		if (this.#node && this.#node.control) {

			if (this.#node.selected)
				this.#selectedNodes.unshift(this.#node);
			else
				this.#selectedNodes = this.#selectedNodes.filter(i => i != this.#node);
		}
		
		this.#node = null;
	}

	#getCordinates(x, y) {
		return [
			x * this.#r[0] / this.#zoom - this.#X,
			y * this.#r[1] / this.#zoom - this.#Y
		];
	}

	#registerCanvasEvents() {

		const canvas = this.canvas;

		canvas.onclick = (e) => {

			const [x, y ] = this.#getCordinates(e.offsetX, e.offsetY);

			switch (this.#mode) {

				case 'select':
				this.#handleSelectClick(x, y);
				break;

				case 'draw':
				this.#handleDrawClick(x, y);
				break;

				case 'edit':
				this.#handleEditClick(x, y);
				break;
			}

		}

		canvas.onmousemove = (e) => {

			let [x, y ] = this.#getCordinates(e.offsetX, e.offsetY);

			this.#dom.status.assign({ x: Math.round(x), y: Math.round(y) });

			if (this.#vkeys.Shift) {
				const dx = Math.abs(x - this.#x)
					, dy = Math.abs(y - this.#y)
					;

				if (dx < dy) 
					x = this.#x;
				else 
					y = this.#y;
			}

			switch (this.#mode) {

				case 'select':
				this.#handleSelectMove(x, y);
				break;

				case 'draw':
				this.#handleDrawMove(x, y);
				break;

				case 'edit':
				this.#handleEditMove(x, y);
				break;
			}
			
		}

		// this.canvas.onmouseup = () => this.#node = null;

		canvas.onmousedown = (e) => {

			const [x, y ] = this.#getCordinates(e.offsetX, e.offsetY);

			this.#x = x;
			this.#y = y;

			switch (this.#mode) {

				case 'select':
				this.#handleSelectDown(x, y);
				break;

				case 'draw':
				this.#handleDrawDown(x, y);
				break;

				case 'edit':
				this.#handleEditDown(x, y);
				break;
			}

		}

		canvas.onmouseup = (e) => {

			const [x, y ] = this.#getCordinates(e.offsetX, e.offsetY);

			switch (this.#mode) {

				// case 'select':
				// this.#handleSelectDown(x, y);
				// break;

				case 'draw':
				this.#handleDrawUp(x, y);
				break;
			}

		}

		canvas.onmouseenter = (e) => {
			this.#hover = true;
		}

		canvas.onmouseleave = (e) => {
			this.#hover = false;
		}

		canvas.onkeydown = (e) => {

			const key = e.key;

			if (this.#mode == 'draw') {

				switch (key) {

					case 'Enter':
					if (this.#path)
						this.#addPath();

					case 'Escape':
					this.#path = null;
					this.draw();
					return;

					case 'Backspace':
					if (this.#path) {
						this.#path.undo();
						this.draw();
					}
					return;
				}

			}

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

					return;
				}
			}

			switch (key) {

				case 's':
				this.mode = 'select';
				break;

				case 'e':
				this.mode = 'edit';
				break;

				case 'd':
				this.mode = 'draw';
				break;

				case 'r':
				this.add('rect');
				break;

				case 'b':
				this.add('bubble');
				break;

				case 't':
				this.add('text');
				break;

				// case 'j':
				// this.add('emoji');
				// break;
			}
		}

		window.onwheel = e => {
			// console.debug(e.deltaX, e.deltaY);

			if (this.#hover) {

				if (this.#vkeys.Control) {
					if (e.deltaY < 0)
						this.#zoom += 0.1;
					else
						this.#zoom -= 0.1;

					this.#updateView();
					this.#dom.actions.set('zoom', this.#zoom);
				}
				else if (this.#vkeys.Shift) {
					
					if (e.deltaY < 0)
						this.#X -= 30;
					else
						this.#X += 30;
				}
				else {
					
					if (e.deltaY < 0)
						this.#Y -= 30;
					else
						this.#Y += 30;
				}


				this.draw();
			}
		}

		window.onkeydown = (e) => {

			const key = e.key;

			if (['Control', 'Shift'].includes(key)) {
				this.#vkeys[key] = true;
				return;
			}
		}

		window.onkeyup = (e) => {

			const key = e.key;

			if (['Control', 'Shift'].includes(key))
				delete this.#vkeys[key];
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
			if (this.#dom.projects) 
				this.#dom.projects.add(i);
		}

		this.#emit('projects', projects);

	}

	#updateView(center=false) {

		const width = this.canvas.width
			, height = this.canvas.height
			, w = width * this.#zoom
			, h = height * this.#zoom;

		if (this.#zoom <= 1 || center) {

			this.#X = (width - w) / 2;
			this.#Y = (height - h) / 2;
 
		} 

		this.#dom.status.set('zoom', this.#zoom.toFixed(2));
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

async function exportCanvas(canvas, name, type) {
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

		const blob = await new Promise(resolve => canvas.toBlob(resolve, mime));

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

