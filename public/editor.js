import './utils.js';

import { Canvas } from './canvas.js';
import { Path } from './path.js';
import { Picture } from './picture.js';
import { Chart } from './chart.js';

import { EditorCanvas as Base } from './base.js';
import { WebGL } from './webgl.js';
import { IndexDB } from './db.js';

import { wrapProjects, wrapObjects, wrapProperties, wrapImages, wrapTools, wrapCanvas, wrapStatus, wrapActions, wrapNotifications } from './wrappers.js';

const kSite = 'www.sipme.io';

const defaultListHandler = {
	add() {},
	select() {},
	delete() {},
	clear() {},
	clearSelection() {},
	swap() {},
	enable(name, b) {}
};

const defaultHandler = {
	set() {},
	assign() {},
	mode() {}
};

const bgFill = '#fafafa';



const Type = {
	STRING: 1,
	JSON: 2,
	BLOB: 3,
	JPG: 4,
	PNG: 5,
	WEBP: 6,
	SVG: 7
};

export default class Editor extends Base {
	#db;

	#bg = new Canvas;
	#selected;
	#fill = '#eeeeee';
	#stroke = '#111111';
	#strokeWidth = 1;

	#mode = 'select';
	#vkeys = {};
	#hover = false;
	#projects;

	#x = 0;
	#y = 0;

	#current;
	#path;
	#node;
	#nodes = [];
	#selectedNodes = [];
	#images = new Map;
	#data = new Map;
	#file;
	#blobs = new Map;

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
		tools: defaultHandler,
		actions: defaultHandler,
		notify: defaultListHandler,
		images: defaultListHandler,

		reset() {
			this.properties.mode();
			this.projects.clearSelection();
			this.objects.clear();
			this.tools.mode('select');
			this.actions.mode('select');
			this.actions.set('attach', false);
		}
	};

	get db() { return this.#db; }

	get x() { return 0; }
	get y() { return 0; }

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
		this.#bg.properties = this.#dom.canvas;

		this.draw();
	}

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
			if (this.#selected) {
				const g = this.findGroup(this.#selected);

				this.#nodes = this.#selected.getNodes(g);
			}
			break;
		}

		this.draw();

		this.#dom.tools.mode(this.#mode);
		this.#dom.status.set('mode', this.#mode.toUpperCase());
	}

	constructor(canvas) {
		super(canvas);

		window.app = this;
		
		try {
			if (!window.glfx) 
				window.glfx = new WebGL();

		}
		catch (e) {
			console.error('Failed to init WbGL');
		}

		this.#registerCanvasEvents();
		this.#registerResizeEvents();

		this.#bg.width = 1200;
		this.#bg.height = 630;

		this.width = 1200;

		this.reset();
	}

	async init(db) {

		if (!db) {
			db = new Database;
			await db.init();
		}

		this.#db = db;

		await tf.setBackend('webgl');

		// await this.#loadProjects();
	}

	loadProjects() {
		if (this.#projects) return;

		this.#loadProjects();
	}

	center() {
		return [ this.width / 2, this.height / 2];
	}

	reset() {

		this.#selected = null;
		this.#current = null;
		this.#history = [];
		this.#historyIndex = 0;
		this.#path = null;
		this.#mode = 'select';
		this.#nodes = [];
		this.#bg.fill = bgFill;
		this.#file = null;
		this.#blobs.clear();
		// this.#objects.splice(1, this.#objects.length - 1);

		this.canvas.focus();

		const objects = super.reset();
		const charts = objects.filter(i => i.type == 'chart');

		let data;

		for (let i of charts) {
			data = i.getData();

			if (data.refs == 0)
				this.#data.delete(i.file);
		}

		this.#bg.properties = this.#dom.canvas;
		this.#dom.reset();
	}

	drawBefore(ctx) {
		this.#bg.draw(ctx);
	}

	drawAfter(ctx) {
		if (this.#path)
			this.#path.draw(ctx, this.#mode);

		// ctx.restore();
		
		if (this.#mode == 'edit' && this.#selected?.visible) {
			for (const i of this.#nodes)
				i.draw(ctx);
		}
	}

	draw(selection=true) {
		super.draw(selection, this.#mode);
	}

	add(type, value='', parent=null) {

		const o = super.create(type, parent);

		switch (o.type) {

			case 'bubble':
			o.width = 300;
			o.height = 150;
			break;

			case 'rect':
			case 'label':
			o.width = 350;
			o.height = 200;
			break;

			case 'circle':
			o.width = 200;
			o.height = 200;
			break;

			case 'text':
			o.setText('Text');
			break;

			case 'emoji':
			case 'icon':
			o.setText(value);
			break;

			case 'chart':
			o.width = 400;
			o.height = 300;
			break;

			case 'image':
			if (value) {
				const image = this.#images.get(value);
				if (!image) {
					// todo: ???
				}
				
				o.setImage(image);
			}
			break;
		}

		if (o) {

			this.#mode = 'select';

			o.fill = this.#fill;
			o.stroke = this.#stroke;
			o.strokeWidth = this.#strokeWidth;

			o.x = 50 + Math.round(Math.random() * 400);
			o.y = 10 + Math.round(Math.random() * 300);

			this.#dom.objects.add(o);

			this.select(o);

			this.emit('newobject', o.id);
		}
		else {
			console.error('Unknown object type:', type);
		}

		return o;
	}

	remove(id=this.#selected?.id) {

		const o = this.find(id);

		super.remove(id);

		if (o.type == 'chart' && o.getData().refs == 0)
			this.#data.delete(o.file);

		if (id == this.#selected?.id) {

			this.#selected = null;
			this.emit('select', null);
			this.#dom.properties.mode();
		}

		this.#dom.objects.delete(id);
	}

	move(id, offset) {

		const id2 = super.reorderObject(id, offset);

		this.draw();
		this.#dom.objects.swap(id, id2);
	}

	applyMask(id) {

		const g = this.findGroup(id);
		const objects = g.objects;
		const i = objects.findIndex(o => o.id == id);

		const o = objects[i - 1];

		if (o && o.type == 'image') {
			o.setMask(objects[i]);

			this.draw();
		}


		// if (i < 2) return;

		// let i = this.#objects.findIndex(o => o.id == id);
		// if (i < 2) return;

		// const path = this.#objects[i];

		// for (i--; i >= 0; --i) {
		// 	const o = this.#objects[i];
		// 	if (o.type == 'image') {
		// 		o.setMask(path);

		// 		this.#dom.properties.set('mask', path.name, path.id);
		// 		this.draw();

		// 		return;
		// 	}
		// }
	}

	export(name='meme', type='jpeg') {

		const canvas = this.#bg;

		const e = new OffscreenCanvas(canvas.width, canvas.height);
		const ctx = e.getContext('2d');


		// e.width = canvas.width;
		// e.height = canvas.height;

		/* todo: Slection must be removed
			1. Translate to canvas origin ctx.translate(-canvas.x, - canvas.y)  
			2. call draw in canvas (this.draw(ctx))
		*/

		ctx.drawImage(this.canvas, canvas.x, canvas.y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

		drawWatermark(ctx, kSite);

		return this.#exportCanvas(e, name, type);
	}

	exportObject() {
		if (!this.#selected) return;

		const o = this.#selected;

		const e = new OffscreenCanvas(o.width, o.height);
		const ctx = e.getContext('2d');

		ctx.translate(-o.x, -o.y);

		o.draw(ctx);

		// o.selected = false;
		// this.draw();

		// const e = document.createElement('canvas');
		// // const e = new OffscreenCanvas(o.width, o.height);
		// const ctx = e.getContext('2d');

		// const m = o.strokeWidth / 2 + o.shadowWidth + 5;
		// const b = o.boundingBox(-m);

		// e.width = b.width;
		// e.height = b.height;

		// ctx.drawImage(this.canvas, b.x, b.y, b.width, b.height, 0, 0, b.width, b.height);

		// o.selected = true;
		// this.draw();

		// drawWatermark(ctx, kSite);

		return this.#exportCanvas(e, o.name, 'png');
	}

	async attach(id) {

		if (!showSaveFilePicker) {
			this.#dom.notify.add('Browser not supported!', 'error');
			return;
		}
	
		const opts = {
			id: 'project',
			suggestedName: 'MyProject.memed',
			startIn: 'documents',
			types: [
				{
					description: "Project file",
					accept: { "application/memed": ['.memed'] }
				}
			]
		};

		
		try {
		
			const file = await showSaveFilePicker(opts);

			// this.#file = await file.getFile();
			this.#file = file;
			
			await this.#saveProject(id);

			this.#dom.notify.add('Attached !', 'success');
		}
		catch (e) {
			console.error('Failed to export project', e);
			
			this.#dom.notify.add('Failed export !', 'error');
		}
	}

	async import(files) {

		if (!files) {
			const pickerOpts = {
				id: 'import',
				types: [
					{
						description: "Images",
						accept: { "image/*": [".png", ".webp", ".jpeg", ".jpg"] }
					},
					{
						description: "CSV",
						accept: { 'text/csv': ['.csv'] }
					}
				],
				excludeAcceptAllOption: true,
				multiple: true,
			};
		
			const handles = await showOpenFilePicker(pickerOpts);
			
			files = await Promise.all(handles.map(i => i.getFile()));
		}

		if (files.length == 1) {

			const mime = files[0].type;

			if (mime == 'text/csv') 
				return this.#importCSV(files[0]);
			else if (mime == '')
				return this.#openProject(files[0]);
		}
	
		return this.#importImages(files);
	}

	async save(id) {

		try {

			const objects = super.save();
			const canvas = this.#bg.save();

			await this.#db.put('meme', { 
				id, 
				canvas, 
				objects, 
				ts: Date.now(), 
				file: this.#file,
				// blobs: Array.from(this.#blobs.values())
				blobs: this.#blobs
			});


			if (this.#dom.projects) {
				const projects = this.#dom.projects.getElementIds();

				if (!projects.includes(id))
					this.#dom.projects.add({ id, objects: this.objects });

				this.#dom.projects.selectItem(id);
			}

			this.#saveProject(id);

			this.emit('save', id);

			this.#dom.notify.add('Saved !', 'success');
		}
		catch(e) {
			console.error('Failed to save project');

			this.#dom.notify.add('Failed !', 'error');
		}
	}

	async open(id) {
		if (id == this.#current)
			return;

		this.reset();

		try {

			const project = await this.#db.get('meme', id);

			// backward compatibility
			if (!project.canvas) 
				[ project.canvas ] = project.objects.splice(0, 1);
			
			const objects = super.open(project.objects);
			const images = objects.filter(i => i.type == 'image');
			const paths = Object.fromArray(objects.filter(i => i.type == 'path'));

			this.#bg.load(project.canvas);
			this.#blobs = project.blobs;
			this.#file = project.file;
			
			// console.debug('Open projects', data);

			// await Promise.all(images.map(i => i.image()));

			let image, filename, mask, file;

			for (const i of images) {

				filename = i.file;
				image = this.#images.get(filename);

				if (!image || image._refs == 0) {
					file = this.#blobs.get(filename);
					image = await i.loadImage(file);

					this.#images.set(filename, image);
				}
				else {
					i.setImage(image);
				}

				mask = i.maskPath;
				if (mask) {
					mask = paths[mask];
					if (mask) {
						i.setMask(mask, false);
					}
				}
			}

			this.#current = id;

			this.draw();
			this.emit('open', id);

			this.#dom.projects.select(id);

			for (const i of this.objects) 
				this.#dom.objects.add(i);

			this.#bg.properties = this.#dom.canvas;
			this.#dom.actions.assign({
				width: this.#bg.width,
				height: this.#bg.height,
				attach: !!this.#file
			});

		}
		catch(e) {
			console.error('Failed to load objects', e);
		}

	}

	async delete(project) {

		if (project == this.#current) {
			this.reset();
		}

		try {

			await this.#db.rm('meme', project);

			this.emit('delete', project);
			this.#dom.projects.delete(project);

		}
		catch (e) {
			console.error('Failed to delete project');
		}
	}
	
	update(prop, value, o=this.#selected) {

		if (typeof o == 'string') o = o == 'canvas' ? this.#bg : this.find(o);
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

			const before = o.save();

			setter.call(o, value);

			this.draw();

			const after = o.save();
			const update = {};

			delete after[prop];

			for (const [name, v] of Object.entries(after)) {
				if (before[name] != v) 
					update[name] = v;
			}

			this.#dom.properties.assign(update);
			
		}
	}

	select(id, add) {
		if (this.#select(id, add))
			this.draw();
	}

	group() {

		const selected = [];

		for (const i of this.all) {
			if (i.isSelected()) {

				this.findGroup(i, true);

				selected.push(i);
				i.selected = false;
			}
		}

		const o = super.add('group');
		o.addObjects(selected);

		for (const i of selected)
			this.#dom.objects.delete(i.id);

		this.#dom.objects.add(o);

		this.select(o);
		this.emit('newobject', o.id);
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

		const b = super.copy(id);

		b.x += 10;
		b.y += 10;

		this.draw();

		this.#dom.objects.add(b, id); 
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
			, images = this.objects.filter(i => i.type == 'image')
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

	centerImage(o=this.#selected) {
		if (!o || o.type != 'image')
			return;

		const data = o.centerInBox();

		this.#dom.properties.assign(data);

		this.draw();
	}

	fitImageSize(o=this.#selected) {
		if (!o || o.type != 'image')
			return;

		const data = o.fitSize();

		this.#dom.properties.assign(data);

		this.draw();
	}

	centerText(o=this.#selected) {
		if (!o) return;

		const data = o.centerText();

		this.#dom.properties.assign(data);

		this.draw();
	}

	centerView() {
		this.updateView(true);
		this.draw();
	}

	async detectBody(threshold) {

		if (!this.#selected || this.#selected.type != 'image') return;

		const image = this.#selected;
		const path = await Path.detectBody(image, threshold);

		if (path) {

			const g = this.findGroup(image);

			this.#addPath(g, path);
			this.draw();

			this.#dom.properties.set('mask', path.name, path.id);
			this.#dom.objects.select(path.id);
		}
		else {
			this.#dom.notify.add('Failed to detect human !', 'error');
		}

	}

	wrap() {

		this.wrapProperties('properties');
		this.wrapObjects('objects', 'item-object');
		this.wrapProjects('projects', 'item-project');
		this.wrapImages('images', 'item-image');
		this.wrapCanvas('background');
		this.wrapStatus('status');
		this.wrapActions('actions');
		this.wrapTools('tools');
		this.wrapNotifications('notifications', 'item-notification');

		// const body = document.body;
		const body = this.canvas.parentElement;

		let counter = 0;

		body.ondragover = (e) => {
			e.preventDefault();
			if (counter == 0)
				body.classList.add('dnd');
		}	
		
		body.ondragleave = e => {
			if (--counter == 0)
				body.classList.remove('dnd');
		}

		body.ondrop = (e) => {
			// console.log("File(s) dropped");

			// Prevent default behavior (Prevent file from being opened)
			e.preventDefault();

			counter = 0;
			body.classList.remove('dnd');

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

		document.onmousedown = (e) => {

			const target = e.target;

			if (target.classList.contains('v-sash')) {

				const area = target.previousElementSibling;
				const reverse = target.classList.contains('reverse');
				//console.log('SASH mousedown', e.target);
	
				const startX = e.clientX;
				// const startW = parseInt(document.defaultView.getComputedStyle(area).width, 10);
				const startW = area.offsetWidth;
	
				//console.log('SASH resize start', startX, startW);
	
				document.body.style.cursor = 'e-resize';
	
				const doDrag = (e) => {
					// console.log('###', e.clientX);
					const delta = startX - e.clientX;
					const width = reverse ? startW + delta : startW - delta;
					
					// console.log('SASH => ', reverse, delta, width);
	
					area.style.width = `${width}px`;
				};
	
				const stopDrag = (e) => {
					document.documentElement.removeEventListener('mousemove', doDrag, false);
					document.documentElement.removeEventListener('mouseup', stopDrag, false);
	
					document.body.style.cursor = 'default';
	
					// todo: use custom attribute
					const id = area.id;
					if (id) {
						const width = parseInt(area.style.width);
						this.updateWidth(id, width);
					}
				};
	
				document.documentElement.addEventListener('mousemove', doDrag, false);
				document.documentElement.addEventListener('mouseup', stopDrag, false);
			}

			// todo: handle v slider properly
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

	wrapImages(container, template) {
		return this.#dom.images = wrapImages(container, this, template);
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

	wrapNotifications(container, template) {
		return this.#dom.notify = wrapNotifications(container, template);
	}

	#updateFromHistory(index, undo=false) {
		const { id, values } = this.#history[index];
		const latest = {};
		const o = this.find(id);

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

	#select(id, add) {
		let o;

		// console.debug('## Select:', id);

		if (typeof id == 'string') {
			if (this.#selected && id == this.#selected.id)
				return false;

			o = this.find(id);

		}
		else {
			o = id;
		}

		let data;
		
		if (o) {
			o.selected = true;
			o.properties = this.#dom.properties;

			data = o.save();
		}

		const changed = this.#selected != o;

		if (changed) {

			if (this.#selected) {
				if (add)
					this.#dom.objects.enable('group', true);
				else {
					this.#selected.selected = false;
					this.#dom.objects.enable('group', false);
				}
			}
			else {
				this.#dom.objects.enable('group', false);
			}

			this.#selected = o;

			this.#dom.properties.mode(o?.type);
			this.#dom.objects.select(o?.id, add);

			this.emit('select', data);
		}

		return changed;
	}

	#onResize(r) {
		this.setSize(r.width, r.height);
	}

	#addPath(group, path=this.#path) {
		
		if (!path.closed)
			path.end();

		super.add(path, group);
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

		const add = this.#vkeys.Control;

		if (this.#selected && !add)
			this.#selected.selected = false;

		let o;

		for (const i of [...this.objects].reverse()) {

			if (i.visible && (o = i.handleSelect(x, y, add)))
				break;
		}

		this.select(o, add);
	}

	#handleSelectDown(x, y) {
		this.#node = null;

		for (const i of this.objects) {
			if (this.#node = i.handleClick(x, y)) {

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

		for (let i = 0, p, o; i < this.objects.length; ++i) {

			o = this.objects[i];

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
			this.emit('update', data);
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
			this.#addPath(this);
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

		// this.emit('update', { x, y });
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

	
	#registerCanvasEvents() {

		const canvas = this.canvas;

		canvas.onclick = (e) => {

			const [x, y ] = this.getCordinates(e.offsetX, e.offsetY);

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

			let [x, y ] = this.getCordinates(e.offsetX, e.offsetY);

			this.#dom.status.assign({ x: Math.round(x), y: Math.round(y) });

			if (this.#vkeys.Shift) {
				const dx = Math.abs(x - this.#x)
					, dy = Math.abs(y - this.#y)
					, d = Math.abs(dx - dy)
					, t = Math.max(3, 3 * dx / 10);
					;

				// console.debug('MOVE:', dx, dy, t);

				if (d < t)
					y = y < this.#y ? this.#y - dx : this.#y + dx;
				else if (dx < dy) 
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

			const [x, y ] = this.getCordinates(e.offsetX, e.offsetY);

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

			const [x, y ] = this.getCordinates(e.offsetX, e.offsetY);

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
						this.#addPath(this);

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
			else if (this.#mode == 'edit') {
				switch (key) {

					case 'Delete':
					this.removeNode();
					this.draw();
					return;

					case 'n':
					this.insertNode();
					this.draw();
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

				case 'g':
				this.group();
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

					const d = e.deltaY < 0 ? 0.1 : -0.1;

					this.updateZoom(d);
					this.#dom.actions.set('zoom', this.zoom);
				}
				else if (this.#vkeys.Shift) {
					const dx = e.deltaY < 0 ? -30 : 30;
					this.updatePosition(dx, 0);
				}
				else {
					const dy = e.deltaY < 0 ? -30 : 30;
					this.updatePosition(0, dy);
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
		resizeObserver.observe(this.canvas.parentElement);
	}

	async #loadProjects() {

		this.#projects = [];

		const projects = await this.#db.latest('meme');

		console.debug('Projects loaded', projects);

		this.#dom.projects.clear();

		for (const i of projects.reverse()) {
			this.#projects.push({ name: i.id, objects: i.objects.length });
			this.#dom.projects.add(i);
		}

		this.emit('projects', projects);

	}

	updateView(center=false) {

		super.updateView(center);

		this.#dom.status.set('zoom', this.zoom.toFixed(2));
	}

	async #exportCanvas(canvas, name, type, box=this.#bg.box()) {
		if (showSaveFilePicker) {
	
			const opts = {
				types: [
					{
						description: "Image file",
						accept: {
							"image/*": [".png", ".jpeg", ".jpg", '.svg'],
						},
						suggestedName: 'meme.jpeg',
						startIn: 'pictures'
					}
				]
			};

			try {
			
				const file = await showSaveFilePicker(opts);
			// console.log('#', file);
		
				let content, [, ext] = file.name.split('.');
		
				if (ext == 'jpg') ext = 'jpeg';
		
				const mime = 'image/' + ext;
				const writable = await file.createWritable();
		
				if (ext == 'svg') {
					content = super.toSVG(box);
				}
				else {
					// content = await new Promise(resolve => canvas.toBlob(resolve, mime));
					content = await canvas.convertToBlob({ type: mime });
				}
		
				await writable.write(content);
				await writable.close();

				this.#dom.notify.add('Exported !', 'success');
			}
			catch (e) {
				console.error('Failed to export image', e);
				
				this.#dom.notify.add('Failed export !', 'error');
			}
	
		}
		else {
			const img = e.toDataURL('image/' + type);
			const a = document.createElement('a');
	
			a.download = name + '.' + type;
			a.href = img;
	
			a.click();
		}
	}

	async #importCSV(file) {
		console.debug('Parsing csv file');

		const id = file.name;
		const text = await file.text();
		const data = parseCSV(text);

		let error = 0;

		if (data.length > 1) {

			const content = Chart.processData(data); 
			if (content) {
				if (!this.#selected || this.#selected.type != 'chart') {
					this.add('chart');
				}
	
				const o = this.#selected;
	
				content.refs = 0;
				o.setData(content);
	
				this.#data.set(id, content);

				this.draw();
	
				await this.#db.put('file', { id, file, type: 'csv' });
	
				this.#dom.properties.set('kind', this.#selected.kind);
			}
			else {
				error = true;
			}

			
		}
		
		if (error) {
			console.error('Invalid CSV data');

			this.#dom.notify.add('Failed to import CSV !', 'error');
		}
	}

	async #importImages(files) {
		let img, image, id, link;

		for (const i of files) {

			id = i.name;
			
			// await this.db.put('file', { id, i, type: 'image' });

			img = Editor.create('image');
			img.file = i;

			image = this.#images.get(id);

			if (!image || image._refs == 0) {
				
				image = await img.loadImage(i);

				this.#images.set(id, image);

				link = await Picture.thumb(image); 

				this.#dom.images.add({ id, link, type: i.type, size: i.size, width: image.width, height: image.height });
			}
			else {
				img.setImage(image);
			}

			this.add(img);
			this.#blobs.set(id, i);
		}

		if (files.length > 1) {
			this.alignImages();
		}
		else {
			this.draw();
		}
	}

	async #saveProject(id) {
		if (!this.#file) return;

		const Type = {
			PROJECT: 3,
			IMAGE: 20,
			CSV: 30
		};

		const writable = await this.#file.createWritable();

		const objects = super.save();
		const canvas = this.#bg.save();

		// objects.filter(i => i.type == 'image').map(i => i.file = i.file.name);

		await appendToStream(writable, Type.PROJECT, { 
			id,
			canvas,
			objects
		});

		for (const [id, i] of this.#blobs.entries()) {
			await appendToStream(writable, Type.IMAGE, id);
			await appendToStream(writable, Type.IMAGE, i.type);
			await appendToStream(writable, Type.IMAGE, i);
		}
	
		await writable.close();
	}

	async #openProject(file) {
		const arrayBuffer = await file.arrayBuffer(); // Read the entire file into an ArrayBuffer
		const dataView = new DataView(arrayBuffer); // Use DataView for binary parsing

		let a, offset = 0
			, len;

		function read() {
			offset += 2;

			//[ id, type ] = a;

			len = dataView.getUint32(offset);
			offset += 4;

			a = new Uint8Array(arrayBuffer, offset, len);
			offset += len;
		}

		read();

		const json = unzip(a);
		const project = JSON.parse(json);

		const decoder = new TextDecoder;

		for (let id, type, blob, img; offset < dataView.byteLength;) {
			

			read();
			id = decoder.decode(a);

			read();
			type = decoder.decode(a);

			read();
			blob = new Blob([a], { type });
			blob.name = id;

			img = await Picture.load(blob);
			img._file = blob;
			img._ref = 0;

			this.#images.set(id, img);
			this.#blobs.set(id, blob);
		}


		const objects = super.open(project.objects);
		const images = objects.filter(i => i.type == 'image');

		this.#bg.load(project.canvas);
		
		let img;

		for (const i of images) {
		
			img = this.#images.get(i.file);

			i.setImage(img);
		}

		this.draw();
	}
}

async function appendToStream(writer, id, v) {

	let content, type;

	if (typeof v == 'string') {
		type = Type.STRING;
		content = v.toArrayBuffer();
	}
	else if (v instanceof Blob) {
		type = fromMime(v.type);
		content = new Uint8Array(await v.arrayBuffer());
	}
	else  {
		type = Type.JSON;
		content = zip(JSON.stringify(v));
	}

	return writeStream(writer, id, type, content);

	function fromMime(mime) {

		switch (mime) {

			case 'image/jpg':
			return Type.JPG;

			case 'image/png':
			return Type.PNG;

			case 'image/webp':
			return Type.WEBP;
		}

	}
}

function writeStream(stream, id, type, content) {

	const buf = new Uint8Array(2 + 4 + content.byteLength);
	const buffer = buf.buffer;
	const view = new DataView(buffer);

	view.setUint32(2, content.byteLength);
	buf.set(content, 6);

	return stream.write(buf);


	// const typeBuffer = new Uint8Array([id, type]); // Assuming type is 1 byte
	// const contentLength = content.byteLength || content.length;
	// const lengthBuffer = new Uint32Array([contentLength]);
		
	// const tlvBuffer = new Uint8Array(typeBuffer.byteLength + lengthBuffer.byteLength + contentLength);
	
	// tlvBuffer.set(typeBuffer, 0);
	// tlvBuffer.set(lengthBuffer, typeBuffer.byteLength);
	// tlvBuffer.set(content, typeBuffer.byteLength + lengthBuffer.byteLength);

	// return stream.write(tlvBuffer);
}


function readFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => resolve(e.target.result);
		reader.onerror = reject;
 
		reader.readAsArrayBuffer(file);
	});
}



class Database extends IndexDB {

	get name() { return 'meme'; }
	get version() { return 2; }

	onUpgrade(db, txn, ver) {
		switch (ver) {
		
			case 0:
			Database.addTable(db, 'meme');
			Database.addIndex('meme', 'ts', txn);

			case 1:
			Database.addTable(db, 'file');
			Database.addIndex('file', 'type', txn);

			break;
		}
	}
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

function parseCSV(csvText) {
	const rows = [];
	let currentRow = [];
	let currentCell = '';
	let insideQuotes = false;

	for (let i = 0; i < csvText.length; i++) {
		const char = csvText[i];
		const nextChar = csvText[i + 1];

		if (char === '"') {
			if (insideQuotes && nextChar === '"') {
				// Handle double quotes as an escaped quote
				currentCell += '"';
				i++;  // Skip next quote
			} else {
				// Toggle quote state
				insideQuotes = !insideQuotes;
			}
		} else if (char === ',' && !insideQuotes) {
			// End of cell
			currentRow.push(currentCell.trim());
			currentCell = '';
		} else if (char === '\n' && !insideQuotes) {
			// End of row
			currentRow.push(currentCell.trim());
			rows.push(currentRow);
			currentRow = [];
			currentCell = '';
		} else {
			// Regular character
			currentCell += char;
		}
	}
	
	// Push the last row if it wasn't added
	if (currentRow.length > 0 || currentCell !== '') {
		currentRow.push(currentCell.trim());
		rows.push(currentRow);
	}
	
	return rows;
}
