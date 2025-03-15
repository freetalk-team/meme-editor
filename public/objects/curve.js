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

	draw(path, x=0, y=0, sx=1, sy=1) {
		path.lineTo(this.x * sx + x*sx, this.y * sy + y*sy);
	}

	move(dx, dy) {
		this.x += dx;
		this.y += dy;
	}

	set(x, y) {

		if (x instanceof Point) {
			this.x = x.x;
			this.y = x.y;
		}
		else {
			this.x = x;
			this.y = y;
		}
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

	scale(sx, sy, X=0, Y=0) {
		Point.scale(this, sx, sy, X, Y);
		return this;
	} 

	sharp() {}

	static create(x, y) {
		const p = new Point;
		
		p.x = x;
		p.y = y;

		return p;
	}

	static scale(p, sx, sy, X=0, Y=0) {
		const x = (p.x - X) * sx
			, y = (p.y - Y) * sy;

		p.set(x, y);
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

	

	draw(path, x=0, y=0, sx=1, sy=1) {
		x *= sx;
		y *= sy;

		path.quadraticCurveTo(
			this.cp.x * sx + x, this.cp.y * sy + y, 
			this.x * sx + x, this.y * sy + y);
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

	extrema(p0) {
		const p1 = this.cp
			, p2 = this;

		// Find extrema t values for a quadratic Bézier curve
		function solveLinear(a, b) {
			if (a === 0) return []; // No solution or constant
			return [-b / a].filter(t => t >= 0 && t <= 1); // Valid t values in range
		}
	
		const extrema = [];
		for (const [i0, i1, i2] of [[p0.x, p1.x, p2.x], [p0.y, p1.y, p2.y]]) {
			const a = i0 - 2 * i1 + i2;
			const b = -2 * (i0 - i1);
			extrema.push(...solveLinear(a, b));
		}
		return extrema;
	}

	evaluate(p0, t) {
		const p1 = this.cp
			, p2 = this;

		const u = 1 - t;
		return new Point(
			u ** 2 * p0.x + 2 * u * t * p1.x + t ** 2 * p2.x,
		  	u ** 2 * p0.y + 2 * u * t * p1.y + t ** 2 * p2.y
		);
	}

	scale(sx, sy, X=0, Y=0) {
		super.scale(sx, sy, X, Y);
		this.cp.scale(sx, sy, X, Y);

		return this;
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

	draw(path, x=0, y=0, sx=1, sy=1) {
		x *= sx;
		y *= sy;

		path.bezierCurveTo(
			this.cp.x * sx + x, this.cp.y * sy + y, 
			this.cp2.x * sx + x, this.cp2.y * sy + y, 
			this.x * sx + x, this.y * sy + y);
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

	extrema(p0) {

		const p1 = this.cp
			, p2 = this.cp2
			, p3 = this;

		// Find the t values where the derivative is 0 for each dimension
		function solveQuadratic(a, b, c) {
			const discriminant = b * b - 4 * a * c;
			if (discriminant < 0) return []; // No real roots
			if (discriminant === 0) return [-b / (2 * a)];
			const sqrtD = Math.sqrt(discriminant);
			return [(-b + sqrtD) / (2 * a), (-b - sqrtD) / (2 * a)];
		}
		
		const extrema = [];
		for (const [i0, i1, i2, i3] of [[p0.x, p1.x, p2.x, p3.x], [p0.y, p1.y, p2.y, p3.y]]) {
			const a = -3 * i0 + 9 * i1 - 9 * i2 + 3 * i3;
			const b = 6 * i0 - 12 * i1 + 6 * i2;
			const c = -3 * i0 + 3 * i1;
			extrema.push(...solveQuadratic(a, b, c).filter(t => t >= 0 && t <= 1));
		}
		return extrema;
	}

	evaluate(p0, t) {

		const p1 = this.cp
			, p2 = this.cp2
			, p3 = this;

		const u = 1 - t;
		return new Point(
			u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
			u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y
		);
	}

	scale(sx, sy, X=0, Y=0) {
		super.scale(sx, sy, X, Y);
		this.cp2.scale(sx, sy, X, Y);

		return this;
	} 

	sharp(end) {

		if (end) 
			this.cp.set(this.cp2);
		
		delete this.cp2;

		Object.setPrototypeOf(this, Curve2.prototype);
	}
}

function midpoint(p1, p2, t) {
	return new Point(
		(1 - t) * p1.x + t * p2.x,
		(1 - t) * p1.y + t * p2.y
	);
}