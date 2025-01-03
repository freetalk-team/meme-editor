
import { Base } from "./base.js";
import { Point, Curve2, Curve3 } from './curve.js';


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

	getNodes() {

		const nodes = this.#segments.map(i => new Node(this, i));

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

	getPath() {
		return this.#path;
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
			super.drawSelection(ctx, mode);

			this.drawBorder(ctx, 1, '#888', 8, true);
		}
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

		console.debug('PATH down:', x, y);

		if (!this.#cursor)
			this.#cursor = new Point(x, y);

		this.#click = new Point(x, y);
		this.#tangent = false;

		this.#addPoint();


	}

	mouseUp(x, y, vkeys) {
		console.debug('PATH up:', x, y, this.#click);

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

	
	getPath(closed=this.#closed) {

		// console.debug('Generating path', this.#segments);

		const path = new Path2D;
		
		let start, segments;

		if (closed) {
			start = this.#segments.last();
			segments = this.#segments;
		}
		else {
			start = this.#segments[0];
			segments = this.#segments.slice(1);
		}
		
		path.moveTo(start.x, start.y);

		for (const i of segments)
			i.draw(path);

		if (closed)
			path.closePath();

		return path;
	}

	updatePath() {
		// const [x, y] = this.center();
		// this.#updateSize(x, y);

		this.#path = this.getPath();
	}

	drawSVG(svg) {

		const fill = this.fill ? { color: this.fill, alpha: this.alpha } : null
			, stroke = this.stroke ? { color: this.stroke, width: this.strokeWidth } : null
			, shadow = this.shadow ? { id: this.id, color: this.shadowColor, width: this.shadowWidth } : null
			, path = { segments: this.#segments, closed: this.#closed }
			, box = this.box();

		svg.path(box, path, fill, stroke, shadow);
	}

	close(updateSize=true) {
		// todo: remove first point
		// start point should be the last point

		console.debug('PATH close:', this.#segments[0]);

		let first = this.#segments[0];
		let last = this.#segments.last();

		if (first.isLine()) {
			this.#segments.shift();
			first = this.#segments[0];
		}
		
		if (!last.isLine() && !first.isLine()) {

			console.debug('First:', first);
			console.debug('Last:', last);

			first = first.toCurve(last.x, last.y);
			last = last.toCurve(last.x, last.y);

			first.cp.set(2*last.x - last.cp2.x, 2*last.y - last.cp2.y);
			first.cp.set(last.cp2.x, last.cp2.y);
			first.cp.invert(last.x, last.y);

			// // last.cp2.set(first.cp.x, first.cp.y);
			// // last.cp2.invert(first.x, first.y);

			console.debug('First:', first);
			console.debug('Last:', last);

			this.#segments[0] = first;
			this.#segments[this.#segments.length - 1] = last;

		}

		console.debug('PATH close reduce:', this.#segments);

		this.#closed = true;
		this.end(updateSize);
	}

	end(updateSize=true) {

		if (updateSize) 
			this.#updateSize();

		this.#cursor = null;
		this.move(0, 0);
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
	
					next.cp.set(x, y);
					next.cp2.set(segment.cp2.x, segment.cp2.y);
					
					prev.tangent(x, y);
				}

			}
		}

		this.#segments.splice(i, 1);
		this.updatePath();

		return true;
	}

	split(i) {


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

		this.#segments.splice(i + 1, 0, s);
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

	// #last() {
	// 	return this.#segments[this.#last ?? 0];
	// }

	#toCurve() {
		// this.#cursor = this.#cursor.toCurve();

		if (this.#segments.length < 2) return;

		const start = this.#segments[this.#segments.length - 2];
		const last = this.#segments.last().toCurve(start.x, start.y);

		console.log(last);

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

		console.debug('# Adding point', this.#cursor, this.#segments);

		this.#segments.push(this.#cursor);
		this.#cursor = new Point(this.#cursor.x, this.#cursor.y);

		this.#path = this.getPath();
	}


	#updateSize(X = 0, Y = 0) {
		const start = this.#segments[0];

		let minX = start.x
			, maxX = minX
			, minY = start.y 
			, maxY = minY
			;

		for (const i of this.#segments) {

			if (i.x < minX) minX = i.x;
			else if (i.x > maxX) maxX = i.x;
			
			if (i.y < minY) minY = i.y;
			else if (i.y > maxY) maxY = i.y;

		}

		minX = Math.round(minX);
		minY = Math.round(minY);
		maxX = Math.round(maxX);
		maxY = Math.round(maxY);

		this.x = minX;
		this.y = minY;
		this.width = Math.abs(maxX - minX);
		this.height = Math.abs(maxY - minY);
	}
}

Path.detectBody = async function(image, threshold=0.7) {
	await loadTensorflow();

	const img = image.image();

	const segmentation = await net.segmentPerson(img, {
		flipHorizontal: false,
		// internalResolution: 'medium',
		internalResolution: 0.75,
		segmentationThreshold: threshold
		// segmentationThreshold: 0.2
	});

	// this.#mask = bodyPix.toMask(segmentation);
	// invertMask(this.#mask);
	// this.#mask = bodyPix.toMaskImageData(segmentation, true);
	// console.debug(mask);

	const mask = bodyPix.toMask(segmentation);
	// console.debug(mask);
	// invertMask(mask);

	const points = createMaskPath(mask);
	const path = new Path;

	path.x = 0;
	path.y = 0;
	path.width = image.width;
	path.height = image.height;

	path.addPoint(points[0][0], points[0][1]);

	for (let i = 1; i < points.length - 2; i += 3) {

		path.addCurve3(points[i + 2][0], points[i + 2][1], points[i][0], points[i][1], points[i + 2][0], points[i + 2][1]);
	}

	// for (let i = 1; i < points.length - 1; i += 2) {

	// 	path.addCurve2(points[i + 2][0], points[i + 2][1], points[i][0], points[i][1]);
	// 	// }
	// }

	path.close(false);
	// path.move(0, 0);

	path.x = image.x;
	path.y = image.y;
	path.alpha = 0.5;

	image.setMask(path);

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

	constructor(path, p) {

		const [X, Y] = path.center();

		this.#origin.set(X, Y);
		this.#p = p;
		this.#path = path;

		if (!p.isLine())
			this.#node = new TangentNode(p, path);
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
}

class TangentNode {

	#p0;
	#p1;
	#p;
	#o;
	#path;

	constructor(curve, path) {
		this.#p0 = curve.cp2 || curve;
		this.#p = this.#p1 = curve;

		const [X, Y] = path.center();

		this.#o = new Point(X, Y);
		this.#path = path;
	}

	add(curve) {
		this.#p1 = curve.cp || curve;
	}

	draw(ctx) {

		ctx.save();

		ctx.lineWidth = 2;
		ctx.strokeStyle = '#55e';
		// ctx.strokeStyle = '#888';
		ctx.setLineDash([6, 2]);

		ctx.translate(this.#o.x, this.#o.y);

		ctx.moveTo(this.#p0.x, this.#p0.y);
		ctx.lineTo(this.#p1.x, this.#p1.y);

		ctx.stroke();

		if (this.#p1.isLine())
			this.#drawNode(ctx, this.#p1);

		if (this.#p0.isLine())
			this.#drawNode(ctx, this.#p0);

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
		

		if (Path.inNode(x, y, this.#p0.x, this.#p0.y))
			return new P(this.#p, this.#p0, this.#p1, this.#o, this.#path);

		
		if (this.#p1.isLine() && Path.inNode(x, y, this.#p1.x, this.#p1.y))
			return new P(this.#p, this.#p1, this.#p0, this.#o, this.#path);
	}

	#drawNode(ctx, p) {
		Path.drawNode(ctx, p.x, p.y, '#f44336', '#f44336');
	}
}

let net;

async function loadTensorflow() {
	if (!net) {
		net = await bodyPix.load({
			//architecture: 'MobileNetV1',
			architecture: 'ResNet50',
			outputStride: 16,
			// multiplier: 0.75,
			multiplier: 1, // For resnet50
			quantBytes: 2
		});

		// maskCanvas = document.createElement('canvas');
		// maskCtx = maskCanvas.getContext('2d');
	}
}

function createMaskPath(mask) {
	const { width, height, data } = mask;
	const edgePoints = [];

	// Step 1: Detect edge points by finding boundary pixels
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const i = (y * width + x) * 4;
			const alpha = data[i + 3];

			if (alpha > 0) {
				// Check if the current pixel has any neighboring transparent pixel (indicating an edge)
				if (
					data[((y - 1) * width + x) * 4 + 3] === 0 ||
					data[((y + 1) * width + x) * 4 + 3] === 0 ||
					data[(y * width + (x - 1)) * 4 + 3] === 0 ||
					data[(y * width + (x + 1)) * 4 + 3] === 0
				) {
					edgePoints.push([x, y]);
				}
			}
		}
	}

	// Step 2: Sort the edge points to create a continuous path
	function sortEdgePoints(points) {
		if (points.length === 0) return [];

		const sorted = [points.shift()];
		
		while (points.length > 0) {
			const lastPoint = sorted[sorted.length - 1];
			let closestIndex = 0;
			let closestDistance = Infinity;

			for (let i = 0; i < points.length; i++) {
				const [x1, y1] = lastPoint;
				const [x2, y2] = points[i];
				const distance = Math.hypot(x2 - x1, y2 - y1);

				if (distance < closestDistance) {
					closestDistance = distance;
					closestIndex = i;
				}
			}

			sorted.push(points.splice(closestIndex, 1)[0]);
		}

		return sorted;
	}

	const sortedPoints = sortEdgePoints(edgePoints);

	// Step 3: Smooth the points using Chaikin's Algorithm
	function smoothPoints(points, iterations = 2) {
		let smoothed = points;

		for (let it = 0; it < iterations; it++) {
			const newPoints = [];
			for (let i = 0; i < smoothed.length - 1; i++) {
				const p0 = smoothed[i];
				const p1 = smoothed[i + 1];

				const q = [(3 * p0[0] + p1[0]) / 4, (3 * p0[1] + p1[1]) / 4];
				const r = [(p0[0] + 3 * p1[0]) / 4, (p0[1] + 3 * p1[1]) / 4];

				newPoints.push(q);
				newPoints.push(r);
			}
			newPoints.push(smoothed[smoothed.length - 1]); // Add the last point
			smoothed = newPoints;
		}

		return smoothed;
	}

	// const smoothedPoints = smoothPoints(sortedPoints);
	// const smoothedPoints = reducePoints(smoothPoints(sortedPoints), 60);
	const smoothedPoints = smoothAndReducePoints(sortedPoints, 91);

	// console.debug(smoothedPoints);

	// const path = pathFromPoints(smoothedPoints);

	return smoothedPoints;
}

function reducePoints(points, targetCount) {
	if (points.length <= targetCount) {
		return points; // No need to reduce if there are fewer points than the target
	}

	// Step 1: Calculate cumulative distances along the path
	const distances = [0]; // First point has distance 0
	for (let i = 1; i < points.length; i++) {
		const [x1, y1] = points[i - 1];
		const [x2, y2] = points[i];
		const distance = Math.hypot(x2 - x1, y2 - y1);
		distances.push(distances[i - 1] + distance);
	}

	const totalLength = distances[distances.length - 1];

	// Step 2: Calculate the interval length for resampling
	const interval = totalLength / (targetCount - 1);

	// Step 3: Resample points at regular intervals
	const resampledPoints = [points[0]]; // Start with the first point
	let currentDistance = interval;
	
	for (let i = 1; i < distances.length; i++) {
		while (currentDistance <= distances[i]) {
			// Linear interpolation between points[i - 1] and points[i]
			const t = (currentDistance - distances[i - 1]) / (distances[i] - distances[i - 1]);
			const [x1, y1] = points[i - 1];
			const [x2, y2] = points[i];
			const interpolatedPoint = [
				x1 + t * (x2 - x1),
				y1 + t * (y2 - y1)
			];

			resampledPoints.push(interpolatedPoint);
			currentDistance += interval;
		}
	}

	// Ensure the last point is included
	resampledPoints.push(points[points.length - 1]);

	return resampledPoints;
}

function smoothAndReducePoints(points, targetCount) {
	if (points.length < 3) {
		return points; // Not enough points to smooth
	}

	// Step 1: Smooth the points using a simple Catmull-Rom spline
	function catmullRomSpline(points, numSegments = 10) {
		const smoothedPoints = [];
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[Math.max(i - 1, 0)];
			const p1 = points[i];
			const p2 = points[i + 1];
			const p3 = points[Math.min(i + 2, points.length - 1)];

			for (let t = 0; t <= 1; t += 1 / numSegments) {
				const t2 = t * t;
				const t3 = t2 * t;

				const x = 0.5 * (
					(2 * p1[0]) +
					(-p0[0] + p2[0]) * t +
					(2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
					(-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
				);

				const y = 0.5 * (
					(2 * p1[1]) +
					(-p0[1] + p2[1]) * t +
					(2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
					(-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
				);

				smoothedPoints.push([x, y]);
			}
		}
		smoothedPoints.push(points[points.length - 1]); // Add the last point
		return smoothedPoints;
	}

	// Step 2: Reduce the points by resampling to the target count
	function resamplePoints(points, targetCount) {
		const distances = [0];
		for (let i = 1; i < points.length; i++) {
			const [x1, y1] = points[i - 1];
			const [x2, y2] = points[i];
			distances.push(distances[i - 1] + Math.hypot(x2 - x1, y2 - y1));
		}

		const totalLength = distances[distances.length - 1];
		const interval = totalLength / (targetCount - 1);

		const resampledPoints = [points[0]];
		let currentDistance = interval;

		for (let i = 1; i < distances.length; i++) {
			while (currentDistance <= distances[i]) {
				const t = (currentDistance - distances[i - 1]) / (distances[i] - distances[i - 1]);
				const [x1, y1] = points[i - 1];
				const [x2, y2] = points[i];
				resampledPoints.push([
					x1 + t * (x2 - x1),
					y1 + t * (y2 - y1)
				]);
				currentDistance += interval;
			}
		}

		resampledPoints.push(points[points.length - 1]);
		return resampledPoints;
	}

	// Step 3: Remove collinear points
	function removeCollinearPoints(points) {
		if (points.length <= 2) {
			return points;
		}

		const reducedPoints = [points[0]];

		for (let i = 1; i < points.length - 1; i++) {
			const [x1, y1] = reducedPoints[reducedPoints.length - 1];
			const [x2, y2] = points[i];
			const [x3, y3] = points[i + 1];

			if ((x2 - x1) * (y3 - y1) !== (y2 - y1) * (x3 - x1)) {
				reducedPoints.push(points[i]);
			}
		}

		reducedPoints.push(points[points.length - 1]);
		return reducedPoints;
	}

	// Perform smoothing, resampling, and reduction
	const smoothedPoints = catmullRomSpline(points);
	const resampledPoints = resamplePoints(smoothedPoints, targetCount);
	return removeCollinearPoints(resampledPoints);
}
