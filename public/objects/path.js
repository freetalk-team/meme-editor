
import { Gradient as Base } from "./gradient.js";
import { Point, Curve2, Curve3 } from './curve.js';

import { detectBody, createMaskPath } from "./common.js";


export class Path extends Base {

	get type() { return 'path'; }

	#segments = [];

	#tangent = false;
	#closed = false;

	#cursor;
	#click;
	#last;

	#path;

	get closed() { return this.#closed; }
	set closed(b) { this.#closed = !!b; }

	get segments() { return this.#segments.map(i => i.toArray()); }
	set segments(a) {

		let p, segments = [];

		for (const i of a) {


			if (i.length == 6) {
				p = new Curve3;

				p.cp.set(i[0], i[1]);
				p.cp2.set(i[2], i[3]);
				p.set(i[4], i[5]);
			}
			else if (i.length == 4) {
				p = new Curve2;

				p.cp.set(i[0], i[1]);
				p.set(i[2], i[3]);
			}
			else {
				p = new Point(i[0], i[1]);
			}

			segments.push(p);
		}

		this.#segments = segments;
		this.updatePath();
	}

	getNodes(canvas={ x: 0, y: 0 }) {

		const box = Object.assign({}, canvas, { x: -canvas.x, y: -canvas.y });
		const nodes = this.#segments.map(i => new Node(this, i, box));

		for (let i = 1; i < nodes.length; ++i) {
			nodes[i].prev = nodes[i - 1];
			nodes[i - 1].next = nodes[i];
		}


		if (this.#closed) {
			const s = nodes[0];
			const e = nodes.last();

			e.next = s;
			s.prev = e;
		}

		return nodes;
	}


	draw(ctx, mode='select') {

		if (this.#segments.length == 0) return;

		const draw = mode == 'draw';
		const angle = mode == 'edit' ? 0 : this.angle;
		const ended = this.#closed || !this.#cursor;

		if (this.#segments.length > 1) {
			const path = this.#path;

			if (!draw && this.#closed)
				this.drawPath(ctx, path, true, angle);
			else
				this.strokePath(ctx, path, ended, angle);
		}

		const last = this.#segments.last();

		if (draw && !ended) {

			const start = this.#segments[0];

			this.drawNode(ctx, start.x, start.y);

			ctx.save();
			ctx.strokeStyle = '#f33';
			ctx.lineWidth = 1;

			const path = new Path2D;
			const cp = this.#cursor.controlPoint();

			let p = last;

			path.moveTo(last.x, last.y);

			this.#cursor.draw(path);

			ctx.stroke(path);
			ctx.strokeStyle = '#33f';


			if (this.#tangent) {
				p = new Point(cp.x, cp.y);
				p.invert(last.x, last.y);
			}

			ctx.moveTo(p.x, p.y);
			ctx.lineTo(cp.x, cp.y);

			ctx.stroke();

			this.drawNode(ctx, cp.x, cp.y);
			if (this.#tangent)
				this.drawNode(ctx, p.x, p.y);


			if (this.#segments.length > 1 && this.inNode(this.#cursor.x, this.#cursor.y, start.x, start.y))
				this.drawNode(ctx, this.#cursor.x, this.#cursor.y, '#f33', '#f33');
			else
				this.drawNode(ctx, this.#cursor.x, this.#cursor.y);


			ctx.restore();
		}
		else {
			super.draw(ctx);
		}

	}

	drawSelection(ctx, mode) {

		if (mode == 'edit') {

		}
		else {
			this.drawBorder(ctx, 1, '#888', -2, true);
			super.drawSelection(ctx, mode);
		}
	}

	strokeTaperedPath(ctx) {}

	drawSVG(svg) {

		const fill = this.getFill()
			, stroke = this.getStroke()
			, shadow = this.getShadow()
			, path = { segments: this.#segments, closed: this.#closed }
			, box = this.box();

		svg.path(box, path, fill, stroke, shadow);
	}

	addPoint(x, y) {
		this.#segments.push(new Point(x, y));
	}

	addCurve2(x, y, cp1x, cp1y) {

		const c = new Curve2(x, y);

		c.cp.set(cp1x, cp1y);

		this.#segments.push(c);
	}


	addCurve3(x, y, cp1x, cp1y, cp2x, cp2y) {

		const c = new Curve3(x, y);

		c.cp.set(cp1x, cp1y);
		c.cp2.set(cp2x, cp2y);

		this.#segments.push(c);
	}

	mouseMove(x, y, vkeys) {

		//console.debug('Mouse move', this.#cursor);

		if (this.#click && !this.inNode(x, y, this.#click.x, this.#click.y)) {
			this.#click = null;
			this.#tangent = true;

			if (vkeys.Control) {
				this.#cursor = new Curve2;
				this.#cursor.cp.set(x, y);
			}
			else {

				this.#toCurve();
			}
		}

		if (this.#tangent)
			this.#segments.last().tangent(x, y);

		this.#cursor.set(x, y);


		this.#path = this.getPath();
	}

	mouseDown(x, y, vkeys) {

		// console.debug('PATH down:', x, y);

		if (!this.#cursor)
			this.#cursor = new Point(x, y);

		this.#click = new Point(x, y);
		this.#tangent = false;

		this.#addPoint();


	}

	mouseUp(x, y, vkeys) {
		// console.debug('PATH up:', x, y, this.#click);

		if (this.#tangent) {

			const last = this.#segments.last();

			this.#cursor = new Curve2(x, y);
			// this.#cursor.cp.invert(last.x, last.y);

			this.#tangent = false;
		}

		this.#last = this.#segments.length - 1;

		// if (this.inNode(x, y, this.#click.x, this.#click.y)) {
		// 	this.#tangent = false;
		// }
		// else {
		// 	this.#click = this.#click.toCurve();
		// 	this.#cursor = this.#cursor.toCurve();
		// 	this.#segments[this.#segments.length - 1] = this.#click;
		// }


		this.#click = null;

		// else {

		// }

	}

	getPath(x, y, sx=1, sy=1) {

		let segments = this.#segments;
	
		return Path.getPath(segments, this.#closed, x, y, sx, sy);
	}

	updatePath() {
		// const [x, y] = this.center();
		// this.#updateSize(x, y);

		this.#path = this.getPath();
	}

	updateSize(x, y) {

		const w = this.width
			, h = this.height;

		super.updateSize(x, y);

		const sx = (this.width / w)
			, sy = (this.height / h);

		this.scale(sx, sy);
	}

	close(updateSize=true) {
		// todo: remove first point
		// start point should be the last point

		// console.debug('PATH close:', this.#segments[0]);

		let first = this.#segments[0];
		let last = this.#segments.last();

		if (first.isLine()) {
			this.#segments.shift();
			first = this.#segments[0];
		}

		if (!last.isLine() && !first.isLine()) {

			// console.debug('First:', first);
			// console.debug('Last:', last);

			first = first.toCurve(last.x, last.y);
			last = last.toCurve(last.x, last.y);

			first.cp.set(2*last.x - last.cp2.x, 2*last.y - last.cp2.y);
			first.cp.set(last.cp2.x, last.cp2.y);
			first.cp.invert(last.x, last.y);

			// // last.cp2.set(first.cp.x, first.cp.y);
			// // last.cp2.invert(first.x, first.y);

			// console.debug('First:', first);
			// console.debug('Last:', last);

			this.#segments[0] = first;
			this.#segments[this.#segments.length - 1] = last;

		}

		// console.debug('PATH close reduce:', this.#segments);

		this.#closed = true;
		this.end(updateSize);
	}

	end(updateSize=true) {

		if (updateSize)
			this.#updateSize();

		this.#cursor = null;
		this.move(0, 0);

		console.group('Path end:');
		console.table(this.segments);
		console.groupEnd();
	}

	remove(i) {

		if (this.#segments.length < 3)
			return false;

		let segment;

		if (i instanceof Node) {
			i.prev.next = i.next;
			i.next.prev = i.prev;

			segment = i.segment;

			i = this.#segments.findIndex(s => s == segment);
		}
		else {
			segment = this.#segments[i];
		}

		const next = i < this.#segments.length - 1 ? this.#segments[i + 1] : this.#segments[0];
		const prev = i > 0 ? this.#segments[i - 1] : this.#segments.last();
		const lambda = 1.75; // test 0.75, 1.25


		if (segment.isLine()) {



		}
		else {
			if (next.isLine()) {

			}
			else {

				if (prev.isLine()) {

				}
				else {

					const x = prev.x + lambda * (prev.x - prev.cp2.x)
						, y = prev.y + lambda * (prev.y - prev.cp2.y)
						, cp = segment.cp2 || segment;

					next.cp.set(x, y);
					next.cp2.set(cp);

					prev.tangent(x, y);
				}

			}
		}

		this.#segments.splice(i, 1);
		this.updatePath();

		return true;
	}

	split(i, sharp) {


		let segment, node;

		if (i instanceof Node) {
			node = i;

			segment = i.segment;

			i = this.#segments.findIndex(s => s == segment);
		}
		else {
			segment = this.#segments[i];
		}

		const prev = i > 0 ? this.#segments[i - 1] : this.#segments.last();
		const s = segment.split(prev);

		if (sharp)
			segment.sharp(true);

		this.#segments.splice(i + 1, 0, s);
		// this.#segments.splice(i, 0, s);
		this.updatePath();

		const n = new Node(this, s);

		if (node) {
			n.next = node.next;
			n.prev = node;

			node.next = n;

		}

		return n;
	}

	undo() {
		this.#cursor = this.#segments.pop();
		this.#last--;
	}

	move(x, y) {
		const [X, Y] = this.center();

		const dx = x - X
			, dy = y - Y
			;

		for (const i of this.#segments)
			i.move(dx, dy);

		this.#path = this.getPath();
	}

	scale(sx, sy) {

		// console.debug('SCALE:', sx, sy);
		// console.debug(this.segments);

		for (const i of this.#segments)
			i.scale(sx, sy);

		// console.debug(this.segments);

		this.updatePath();
	}
	// #last() {
	// 	return this.#segments[this.#last ?? 0];
	// }

	#toCurve() {
		// this.#cursor = this.#cursor.toCurve();

		if (this.#segments.length < 2) return;

		const start = this.#segments[this.#segments.length - 2];
		const last = this.#segments.last().toCurve(start.x, start.y);

		// console.log(last);

		this.#segments[this.#segments.length - 1] = last;

		// if (this.#last) {
		// 	const c = this.#segments[this.#last].toCurve()
		// 		, cp = c.cp2 || c.cp;

		// 	cp.set(last.cp.x, last.cp.y);
		// 	// cp.invert(c.x, c.y);
		// 	// const s = this.#segments[this.#last];

		// 	this.#segments[this.#last] = c;

		// }
	}

	#addPoint() {

		const start = this.#segments[0];

		if (start) {

			// console.debug('START', this.#start);

			if (this.inNode(this.#cursor.x, this.#cursor.y, start.x, start.y)) {

				this.#cursor.set(start.x, start.y);

				// if (!this.#cursor.isLine())
					this.#segments.push(this.#cursor);

				this.close();

				return;
			}

		}

		// console.debug('# Adding point', this.#cursor, this.#segments);

		this.#segments.push(this.#cursor);
		this.#cursor = new Point(this.#cursor.x, this.#cursor.y);

		this.#path = this.getPath();
	}


	#updateSize(X = 0, Y = 0) {
		const b = calculateBoundingBox(this.#segments);

		// console.log('Calculated box:', b);

		this.x = b.x;
		this.y = b.y;
		this.width = b.width;
		this.height = b.height;
	}
}

Path.detectBody = async function(image, threshold=0.7) {

	const img = image.image();

	const mask = await detectBody(img);
	// const mask = isolateSinglePersonMask(segmentation, 0);
	// console.debug(mask);
	// invertMask(mask);

	if (false) {

		const c = offctx.canvas;

		c.width = img.width;
		c.height = img.height;
		
		bodyPix.drawMask(c, img, mask, 0.7, 0, false);

		app.bitmap = await createImageBitmap(c);
	}

	const path = Path.detect(mask, image.x, image.y);
	
	// path.width = img.width;
	// path.height = img.height;
	path.alpha = 0.5;

	image.applyMask(path);

	return path;
}

Path.detect = function(mask, x = 0, y = 0) {

	const points = createMaskPath(mask);
	if (points.length == 0) {
		// not detected
		return null;
	}

	const path = new Path;

	path.x = x;
	path.y = y;

	path.addPoint(points[0][0] + x, points[0][1] + y);

	for (let i = 1; i < points.length - 2; i += 3) {

		path.addCurve3(
			points[i + 2][0] + x, points[i + 2][1] + y, 
			points[i    ][0] + x, points[i    ][1] + y, 
			points[i + 1][0] + x, points[i + 1][1] + y
		);
	}

	// for (let i = 1; i < points.length - 1; i += 2) {

	// 	path.addCurve2(points[i + 2][0], points[i + 2][1], points[i][0], points[i][1]);
	// 	// }
	// }

	path.close();

	return path;
}

Path.toSpline = function(points, tension=0.5) {
	if (points.length < 2) return '';

	//let path = `M${points[0].x},${points[0].y}`;  // Move to first point

	const path = [points[0].clone()];

	const n = points.length;

	for (let i = 0; i < n - 1; i++) {
		const p0 = i > 0 ? points[i - 1] : points[0];       // Previous point
		const p1 = points[i];                               // Current point
		const p2 = points[i + 1];                           // Next point
		const p3 = i < n - 2 ? points[i + 2] : points[n - 1];  // Point after next

		const c = new Curve3(p2.x, p2.y);

		c.cp.set(p1.x + (p2.x - p0.x) * tension / 6, p1.y + (p2.y - p0.y) * tension / 6);
		c.cp2.set(p2.x - (p3.x - p1.x) * tension / 6, p2.y - (p3.y - p1.y) * tension / 6);

		path.push(c);

		// // Calculate control points
		// const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
		// const cp1y = p1.y + (p2.y - p0.y) * tension / 6;
		// const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
		// const cp2y = p2.y - (p3.y - p1.y) * tension / 6;



		// Cubic Bézier curve
		//path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
	}

	return path;
}

Path.getPath = function(segments, closed, x=0, y=0, sx=1, sy=1) {

		// console.debug('Generating path', this.#segments);

	const path = new Path2D;

	let start;

	if (closed) {
		start = segments.last();
	}
	else {
		start = segments[0];
		segments = segments.slice(1);
	}

	path.moveTo(start.x*sx + x*sx, start.y*sy + y*sy);

	for (const i of segments)
		i.draw(path, x, y, sx, sy);

	if (closed)
		path.closePath();

	return path;
}

class Node {

	#p;
	#path;
	#selected = false;
	#node;
	#next;
	#origin = new Point;
	prev;

	get x() { return this.#p.x + this.#origin.x; }
	get y() { return this.#p.y + this.#origin.y; }
	get selected() { return this.#selected; }
	get next() { return this.#next; }
	get segment() { return this.#p; }
	get control() { return true; }

	constructor(path, p, canvas) {

		const [X, Y] = path.center(canvas);

		this.#origin.set(X, Y);
		this.#p = p;
		this.#path = path;

		if (!p.isLine())
			this.#node = new TangentNode(p, path, canvas);
	}

	set next(node) {

		if (this.#node)
			this.#node.add(node.segment);

		this.#next = node;
	}

	move(x, y) {

		const dx = x - this.x
			, dy = y - this.y;

		this.#p.moveNode(dx, dy);

		if (this.#next)
			this.#next.segment.moveTangent(dx, dy);

		this.#selected = true;
		this.#path.updatePath();
	}

	draw(ctx) {

		if (this.#selected) {
			Path.drawNode(ctx, this.x, this.y, '#33f', '#55e');

			if (this.#node)
				this.#node.draw(ctx);
		}
		else {
			Path.drawNode(ctx, this.x, this.y);
		}
	}

	handleSelect(x, y) {

		if (this.#selected) {

			const n = this.#node?.handleSelect(x, y);
			if (n)
				return n;
		}

		if (Path.inNode(x, y, this.x, this.y)) {

			this.#selected = !this.#selected;
			return this;
		}
	}

	sharp() {
		if (this.#p.isLine()) return;

		this.prev.segment.sharp();
		// this.segment.sharp();
	}
}

class TangentNode {

	#p0;
	#p1;
	#p;
	#o;
	#path;
	#curve;

	constructor(curve, path, canvas) {

		console.log('Tangent node for', curve);


		const [X, Y] = path.center(canvas);

		this.#p0 = curve;
		this.#o = new Point(X, Y);
		this.#path = path;
	}

	add(curve) {
		this.#p1 = curve;
	}

	draw(ctx) {

		const p0 = this.#p0.cp2 || this.#p0
			, p1 = this.#p1.cp || this.#p1;

		ctx.save();

		ctx.lineWidth = 2;
		ctx.strokeStyle = '#55e';
		// ctx.strokeStyle = '#888';
		ctx.setLineDash([6, 2]);

		ctx.translate(this.#o.x, this.#o.y);

		ctx.moveTo(p0.x, p0.y);
		ctx.lineTo(p1.x, p1.y);

		ctx.stroke();

		if (p1.isLine())
			this.#drawNode(ctx, p1);

		if (p0.isLine())
			this.#drawNode(ctx, p0);

		ctx.restore();
	}



	handleSelect(x, y) {

		x -= this.#o.x;
		y -= this.#o.y;


		class P {
			constructor(p, p0, p1, o, path) {
				this.p = p;
				this.p0 = p0;
				this.p1 = p1;
				this.o = o;
				this.path = path;
			}

			move(x, y) {

				x -= this.o.x;
				y -= this.o.y;

				this.p0.set(x, y);

				if (this.p1.isLine()) {
					this.p1.set(x, y);
					this.p1.invert(this.p.x, this.p.y);
				}

				this.path.updatePath();
			}
		}

		const p = this.#p0 
			, p0 = this.#p0.cp2 || this.#p0
			, p1 = this.#p1.cp || this.#p1;

		if (p0.isLine() && Path.inNode(x, y, p0.x, p0.y))
			return new P(p, p0, p1, this.#o, this.#path);

		if (p1.isLine() && Path.inNode(x, y, p1.x, p1.y))
			return new P(p, p1, p0, this.#o, this.#path);
	}

	#drawNode(ctx, p) {
		Path.drawNode(ctx, p.x, p.y, '#f44336', '#f44336');
	}
}

function calculateBoundingBox(path) {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

	let p0 = path.last(), p;

	for (let i = 0; i < path.length; i++, p0 = p) {

		p = path[i];

		if (path[i].isLine()) {
		  // Point: [x, y]
			//const p = path[i];
			minX = Math.min(minX, p.x);
			minY = Math.min(minY, p.y);
			maxX = Math.max(maxX, p.x);
			maxY = Math.max(maxY, p.y);
		} else {
			const extremaT = [0, 1, ...p.extrema(p0)];
			extremaT.forEach(t => {
				const point = p.evaluate(p0, t);

				minX = Math.min(minX, point.x);
				minY = Math.min(minY, point.y);
				maxX = Math.max(maxX, point.x);
				maxY = Math.max(maxY, point.y);
			});
		}
	}

	return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

