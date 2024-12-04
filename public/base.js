
export class Base {

	static ID = 1;

	#id;
	#width = 0;
	#height = 0;

	#x = 50;
	#y = 50;
	#r = 5; // node radius

	selected = false;

	constructor(id) {
		if (!id)
			id = this.type + ' ' + Base.ID++;

		this.#id = id;
	}

	get id() { return this.#id; }
	get x() { return Math.round(this.#x); }
	get y() { return  Math.round(this.#y); }
	get width() { return Math.round(this.#width); }
	get height() { return Math.round(this.#height); }

	set id(v) {
		this.#id = v;
	}

	set x(n) {
		if (typeof n == 'string') n = parseInt(n);
		//if (n < 10) n = 10;

		this.#x = n;
	}

	set y(n) {
		if (typeof n == 'string') n = parseInt(n);
		//if (n < 10) n = 10;

		this.#y = n;
	}

	set width(n) {
		if (typeof n == 'string') {
			n = parseInt(n);
			if (n < 10) 
				n = 10;
		}

		this.#width = n;
	}

	set height(n) {
		if (typeof n == 'string') {
			n = parseInt(n);
			if (n < 10) n = 10;
		}

		this.#height = n;
	}

	set properties(obj) {
		obj.assign(Object.fromInstance(this));
	}

	draw(ctx) {
		this.drawSelection(ctx);
	}

	drawBorder(ctx, width=1, color='#000', margin=0, dashed=false) {

		// console.debug('Border', this.#x, this.#y, this.#width, this.#height);

		ctx.save()

		if (dashed)
			ctx.setLineDash([10, 5]);

		ctx.strokeStyle = color;
		ctx.lineWidth = width;
		ctx.strokeRect(this.#x - margin, this.#y - margin, this.#width + 2*margin, this.#height + 2*margin);

		ctx.restore();
	}

	drawSelection(ctx) {
		if (!this.selected) return;

		ctx.lineWidth = 1;

		let X = this.x + this.width / 2
			, Y = this.y + this.height / 2

		this.drawNode(ctx, X, Y);

		X = this.x + this.width;
		Y = this.y + this.height;

		this.drawNode(ctx, X, Y);
	}

	release() {

	}

	handleClick(x, y) {
		let X = this.x + this.width / 2
			, Y = this.y + this.height / 2
			;

		if (this.inNode(x, y, X, Y))
			return {
				move: (x, y) => this.updatePos(x, y)
			};

		X = this.x + this.width;
		Y = this.y + this.height;

		if (this.inNode(x, y, X, Y))
			return {
				move: (x, y) => this.updateSize(x, y)
			};

		return null;
	}

	handleSelect(x, y) {
		const px0 = this.x
			, px1 = px0 + this.width
			, py0 = this.y
			, py1 = py0 + this.height
			;

		return this.selected = (x > px0 && x < px1 && y > py0 && y < py1);
	}

	inNode(x, y, X, Y) {
		const R = this.#r;

		return (x > X - R &&
			x < X + R &&
			y > Y - R &&
			y < Y + R);
	}

	updatePos(x, y) {
		this.x = x - this.width / 2;
		this.y = y - this.height / 2;
	}

	updateSize(x, y) {
		this.#width = x - this.#x;
		this.#height = y - this.#y;

	}

	drawNode(ctx, x, y) {

		ctx.strokeStyle = '#00f';

		ctx.beginPath();
		ctx.arc(x, y, this.#r, 0, Math.PI * 2);
		ctx.stroke();
		ctx.closePath();
	}
	
}