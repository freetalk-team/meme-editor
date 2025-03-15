export class Point {
	x;
	y;

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	isLine() { return true; }

	controlPoint() { return this; }

	toCurve() {
		return new Curve2(this.x, this.y);
	}

	clone() {
		return new Point(this.x, this.y);
	}

	draw(path) {
		path.lineTo(this.x, this.y);
	}

	move(dx, dy) {
		this.x += dx;
		this.y += dy;
	}

	set(x, y) {
		this.x = x;
		this.y = y;
	}

	invert(x, y) {
		const X = 2*x - this.x
			, Y = 2*y - this.y;

		this.set(X, Y);
	}

	tangent(x, y) {}

	split(start, t=0.5) {
		const m = midpoint(start, this);
		const p = new Point(this.x, this.y);

		this.set(m.x, m.y);

		return p;
	}

	moveTangent() {}
	moveNode(dx, dy) { 
		this.x += dx;
		this.y += dy;
	}

	toArray() { return [this.x, this.y ]; }
	toSVG(X=0, Y=0) { return `L${this.x + X},${this.y + Y}`; }

	static create(x, y) {
		const p = new Point;
		
		p.x = x;
		p.y = y;

		return p;
	}
}

export class Curve2 extends Point {
	cp = new Point;

	constructor(x, y) {
		super(x, y);

		this.cp.set(x, y);
	}

	isLine() { return false; }
	toArray() { return [this.cp.x, this.cp.y, this.x, this.y ]; }
	toSVG(X=0, Y=0) { return `Q${this.cp.x + X},${this.cp.y +Y},${this.x + X},${this.y + Y}`; }

	clone() {
		const p = new Curve2(this.x, this.y);
		p.cp.set(this.cp.x, this.cp.y);

		return p;
	}

	
	controlPoint() {
		return this.cp;
	}

	setControlPoint(x, y) {
		this.cp.set(x, y);
	}

	toCurve(X, Y) {
		const c = new Curve3(this.x, this.y);

		c.cp.set(X + 2/3*(this.cp.x - X), Y + 2/3*(this.cp.y - Y));
		c.cp2.set(this.x + 2/3*(this.cp.x - this.x), this.y + 2/3*(this.cp.y - this.y));

		return c;
	}

	

	draw(path) {
		path.quadraticCurveTo(this.cp.x, this.cp.y, this.x, this.y);
	}

	move(dx, dy) {
		super.move(dx, dy);

		this.cp.x += dx;
		this.cp.y += dy;
	}

	// tangent(x, y) {
	// 	this.cp.x = x;
	// 	this.cp.y = y;
	// }

	// moveNode(dx, dy) {
	// 	this.x += dx;
	// 	this.y += dy;
	// }

	moveTangent(dx, dy) {
		this.cp.x += dx;
		this.cp.y += dy;
	}
	
	tangent(x, y) {
		const X = 2*this.x - x
			, Y = 2*this.y - y;

		this.cp.set(X, Y);

		// console.debug('Setting tangent', x, y);

		// this.cp.set(x, y);
	}

	static draw(ctx, curve) {
	}
}

export class Curve3 extends Curve2 {
	cp2 = new Point;

	toArray() { return [this.cp.x, this.cp.y, this.cp2.x, this.cp2.y, this.x, this.y ]; }
	toSVG(X=0, Y=0) { return `C${this.cp.x + X},${this.cp.y + Y},${this.cp2.x + X},${this.cp2.y + Y},${this.x + X},${this.y + Y}`; }

	clone() {
		const p = new Curve3(this.x, this.y);

		p.cp.set(this.cp.x, this.cp.y);
		p.cp2.set(this.cp2.x, this.cp2.y);

		return p;
	}

	controlPoint() {
		return this.cp2;
	}

	toCurve() {
		return this;
	}

	draw(path) {
		path.bezierCurveTo(this.cp.x, this.cp.y, this.cp2.x, this.cp2.y, this.x, this.y);
	}

	tangent(x, y) {
		const X = 2*this.x - x
			, Y = 2*this.y - y;

		this.cp2.set(X, Y);
	}

	move(dx, dy) {
		super.move(dx, dy);

		this.cp2.x += dx;
		this.cp2.y += dy;
	}

	moveNode(dx, dy) {
		super.moveNode(dx, dy);



		this.cp2.x += dx;
		this.cp2.y += dy;
	}

	split(start, t=0.5) {
		

		const M0 = midpoint(start, this.cp, t);
		const M1 = midpoint(this.cp, this.cp2, t);
		const M2 = midpoint(this.cp2, this, t);

		// Compute midpoints of second level
		const N0 = midpoint(M0, M1, t);
		const N1 = midpoint(M1, M2, t);

		// Compute midpoint of third level (the point on the curve)
		const Q = midpoint(N0, N1, t);

		const c = new Curve3(this.x, this.y);

		c.cp = N1;
		c.cp2 = M2;

		this.cp.set(M0.x, M0.y);
		this.cp2.set(N0.x, N0.y);
		this.set(Q.x, Q.y);

		return c;
	}
}

function midpoint(p1, p2, t) {
	return new Point(
		(1 - t) * p1.x + t * p2.x,
		(1 - t) * p1.y + t * p2.y
	);
}