const kNodeRadius = 5;

export class Base {

	static ID = 1;

	#id;
	#name;
	#width = 0;
	#height = 0;

	#x = 50;
	#y = 50;
	#angle = 0;
	
	#stroke = '#000000';
	#strokeWidth = 1;
	#fill = '#eeeeee';
	#alpha = 'ff';
	#shadow;
	#shadowColor = '#444444';
	#shadowWidth = 2;

	#selected = false;
	#visible = true;

	constructor(id) {
		this.#id = id || Date.now().toString(16);
		this.#name = this.type + ' ' + Base.ID++;
	}

	get id() { return this.#id; }
	get name() { return this.#name; }

	get x() { return this.#x; }
	get y() { return  this.#y; }
	get width() { return this.#width; }
	get height() { return this.#height; }
	get angle() { return this.#angle; }
	get stroke() { return this.#stroke; }
	get strokeWidth() { return this.#strokeWidth; }
	get fill() { return this.#fill; }
	get alpha() { return parseInt(this.#alpha, 16) / 255; }
	get shadow() { return this.#shadow; }
	get shadowWidth() { return this.#shadowWidth; }
	get shadowColor() { return this.#shadowColor; }
	get visible() { return this.#visible; }

	set id(v) {
		this.#id = v;
	}

	set name(v) {
		this.#name = v;
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

	set stroke(v) {
		this.#stroke = v;
	}

	set strokeWidth(n) {
		if (typeof n == 'string') n = parseInt(n);
		this.#strokeWidth = n;
	}

	set fill(v) {
		this.#fill = v;
	}

	set alpha(n) {
		if (typeof n == 'string') n = parseFloat(n);

		const v = Math.round(n * 255);
		this.#alpha = (v < 16 ? '0' : '') + v.toString(16);
	}

	set shadow(v) {
		this.#shadow = v;
	}

	set shadowWidth(n) {
		if (typeof n == 'string') n = parseInt(n);
		this.#shadowWidth = n;
	}

	set shadowColor(v) {
		this.#shadowColor = v;
	}

	set selected(b) {
		this.#selected = b;
	}

	set visible(b) {
		if (b == 'toggle') this.toggleVisible();
		else this.#visible = b;
	}

	set angle(n) {
		if (typeof n == 'string') n = parseFloat(n);

		const pi = Math.PI;
		const snap = [0,  pi/4, pi/2, pi * 3/4, pi, pi * 5/4, pi * 3/2, pi * 7/4];
		const R = 0.1;

		for (const i of snap) {
			if (n > i - R && n < i + R) {
				n = i;
				break;
			}
		}

		// console.debug('Setting angle', n);

		this.#angle = n;
	}

	set properties(obj) {
		obj.assign(Object.fromInstance(this));
	}

	fillColor() {
		return this.#fill + this.#alpha;
	}
	
	alphaHex() { 
		return this.#alpha; 
	}

	isSelected() {
		return this.#selected;
	}

	toggleVisible() {
		this.#visible = !this.#visible;
	}

	center() {
		return [ this.#x + this.#width / 2, this.y + this.#height / 2];
	}

	box() {
		return {
			x: this.#x,
			y: this.#y,
			width: this.#width,
			height: this.#height,
			angle: this.angle * (180 / Math.PI),
			center() {
				return [ this.x + this.width / 2, this.y + this.height / 2 ];
			}
		}
	}

	draw() {}
	drawSVG() {}

	drawSelection(ctx, mode) {

		ctx.save();

		const { x, y } = this.setGeometry(ctx, false);

		ctx.lineWidth = 1;

		this.drawNode(ctx, 0, 0);
		this.drawNode(ctx, -x, -y);
		
		ctx.restore();
	}

	drawLine(ctx, x, y, X=this.#x, Y=this.#y, shadow=this.#shadow) {
		

		if (shadow && this.#shadowWidth > 0) {
			
			ctx.save();

			this.addShadow(ctx);

			ctx.beginPath();
			ctx.moveTo(X, Y);
			ctx.lineTo(x, y);
			ctx.stroke();

			ctx.restore();
		}

		Base.drawLine(ctx, X, Y, x, y, this.#stroke, this.#strokeWidth);
	}

	drawLineShadow(ctx, x, y, X=this.#x, Y=this.#y) {
		if (!this.#shadow) return;

		ctx.save();

		ctx.strokeStyle = this.#stroke;
		ctx.lineWidth = this.#strokeWidth;

		this.addShadow(ctx);

		ctx.beginPath();
		ctx.moveTo(X, Y);
		ctx.lineTo(x, y);
		ctx.stroke();

		ctx.restore();
	}

	drawPath(ctx, path, geometry=true, angle=this.#angle) {


		ctx.save();

		if (geometry)
			this.setGeometry(ctx, angle);
		
		//ctx.globalAlpha = 0.4;

		ctx.fillStyle = this.fillColor();

		if (this.#shadowWidth > 0) {
			
			ctx.save();

			this.addShadow(ctx);

			if (this.#shadow == 'fill')
				ctx.fill(path);
			else if (this.#shadow == 'stroke')
				ctx.stroke(path);

			ctx.restore();
		}

		if (this.#fill) 
			ctx.fill(path);

		this.strokePath(ctx, path);

		ctx.restore();
		
	}

	fillPath(ctx, path, geometry=true, angle=this.#angle) {

		ctx.save();

		if (geometry)
			this.setGeometry(ctx, angle);
		
		//ctx.globalAlpha = 0.4;

		ctx.fillStyle = this.fillColor();

		if (this.#shadow && this.#shadowWidth > 0) {
			
			ctx.save();

			this.addShadow(ctx);

			ctx.fill(path);
			ctx.restore();
		}

		ctx.fill(path);
		ctx.restore();
	}

	strokePath(ctx, path, geometry=false, angle=this.#angle) {
		if (this.#stroke && this.#strokeWidth > 0) {
			ctx.save();

			if (geometry)
				this.setGeometry(ctx, angle);

			ctx.strokeStyle = this.#stroke;
			ctx.lineWidth = this.#strokeWidth;
			ctx.lineCap = 'round'; // Smooth rounded ends
			ctx.lineJoin = 'round'; // Smooth joints

			ctx.stroke(path);

			ctx.restore();
		}
	}

	drawRectangle(ctx) {

		ctx.save();

		const { x, y } = this.setGeometry(ctx);

		if (this.#shadowWidth > 0) {
			
			ctx.save();

			this.addShadow(ctx);

			ctx.fillStyle = this.fillColor();
			ctx.strokeStyle = this.#stroke;

			if (this.#shadow == 'fill')
				ctx.fillRect(x, y, this.#width, this.#height);
			else if (this.#shadow == 'stroke')
				ctx.strokeRect(x, y, this.#width, this.#height);

			ctx.restore();
		}

		if (this.#fill) {

			ctx.save();

			ctx.fillStyle = this.fillColor();
			ctx.fillRect(x, y, this.#width, this.#height);

			ctx.restore();
		}

		if (this.#stroke && this.#strokeWidth > 0) {
			ctx.save();

			ctx.strokeStyle = this.#stroke;
			ctx.lineWidth = this.#strokeWidth;

			ctx.strokeRect(x, y, this.#width, this.#height);

			ctx.restore();
		}


		ctx.restore();
	}

	drawRoundRectangle(ctx, radius=5) {

		ctx.save();

		const { x, y } = this.setGeometry(ctx);

		if (this.#shadowWidth > 0) {
			
			ctx.save();

			this.addShadow(ctx);

			ctx.fillStyle = this.fillColor();
			ctx.strokeStyle = this.#stroke;

			ctx.beginPath();
			ctx.roundRect(x, y, this.#width, this.#height, radius);

			if (this.#shadow == 'fill')
				ctx.fill();
			else if (this.#shadow == 'stroke')
				ctx.stroke();

			ctx.restore();
		}

		if (this.#fill) {

			ctx.save();

			ctx.fillStyle = this.fillColor();
			ctx.beginPath();
			ctx.roundRect(x, y, this.#width, this.#height, radius);
			ctx.fill();

			ctx.restore();
		}

		if (this.#stroke && this.#strokeWidth > 0) {
			ctx.save();

			ctx.strokeStyle = this.#stroke;
			ctx.lineWidth = this.#strokeWidth;

			ctx.beginPath();
			ctx.roundRect(x, y, this.#width, this.#height, radius);
			ctx.stroke();

			ctx.restore();
		}


		ctx.restore();
	}

	drawText(ctx, text, opt={ size: 30, font: 'Airal' }) {
		text = text.split('\n').map(i => i.trim());

		ctx.save();

		let { x, y } = this.setGeometry(ctx);

		ctx.textBaseline = opt.baseline || "top";
		// ctx.textBaseline = "middle";
		ctx.textAlign = opt.align || "left";
		ctx.font = (opt.bold ? 'bold ' : '') + 
			(opt.italic ? 'italic ' : '') + 
			`${opt.size}px` + ' ' + opt.font;
		
		ctx.fillStyle = this.#fill;
		ctx.strokeStyle = this.#stroke;
		ctx.lineWidth = this.#strokeWidth;

		const lineHeight = ctx.measureText("M").width * 1.2;
		
		for (const t of text) {

			if (this.#shadow && this.#shadowWidth > 0) {

				this.addShadow(ctx);

				if (this.shadow == 'fill') 
					ctx.fillText(t, x, y);
				else if (this.shadow == 'stroke' && this.strokeWidth > 0)
					ctx.strokeText(t, x, y);
			}

			// ctx.translate(x, y);
			if (this.#fill) 
				ctx.fillText(t, x, y);
			

			if (this.strokeWidth > 0) 
				ctx.strokeText(t, x, y);
			
			y += lineHeight;
		}

		ctx.restore();
	}

	setGeometry(ctx, angle=this.#angle) {

		const [X, Y] = this.center();

		ctx.translate(X, Y);

		if (angle)
			ctx.rotate(angle);

		return { 
			x: -this.#width / 2,
			y: -this.#height / 2
		}
	}

	addShadow(ctx) {
		ctx.shadowColor = this.#shadowColor; // color
		ctx.shadowBlur = 5; // blur level
		ctx.shadowOffsetX = this.#shadowWidth; // horizontal offset
		ctx.shadowOffsetY = this.#shadowWidth; // vertical offset
	}

	drawBorder(ctx, strokeWidth=1, color='#000', margin=0, dashed=false) {

		if (typeof margin == 'number')
			margin = [margin, margin];

		ctx.save();

		let { x, y } = this.setGeometry(ctx, false);

		const width = this.#width - 2*margin[0]
			, height = this.#height - 2*margin[1]
			;

		x += margin[0];
		y += margin[1];

		if (dashed)
			ctx.setLineDash([10, 5]);

		ctx.strokeStyle = color;
		ctx.lineWidth = strokeWidth;
		ctx.strokeRect(x, y, width, height);

		ctx.restore();
	}

	drawNode(...args) {
		Base.drawNode(...args);
	}

	release() {}
	getNodes() { return []; }

	toSVG() { return ''; }
	toSVGFilter() {

		if (!this.#shadow) return '';

		const id = this.#id + '-shadow'
			, dx = this.#shadowWidth
			, color = this.#shadowColor
			;

		return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feFlood flood-color="${color}" result="flood"/><feComposite in2="SourceAlpha" operator="in" result="shadow"/><feGaussianBlur in="shadow" stdDeviation="3"/><feOffset dx="${dx}" dy="${dx}" result="offsetblur"/><feMerge><feMergeNode in="offsetblur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
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

	inNode(...args) {
		return Base.inNode(...args);
	}

	updatePos(x, y) {
		this.x = Math.round(x - this.width / 2);
		this.y = Math.round(y - this.height / 2);
	}

	updateSize(x, y) {
		this.width = Math.round(x - this.#x);
		this.height = Math.round(y - this.#y);

	}

	snap(x, y) {

		const [X, Y] = this.center();

		const x1 = this.#x + this.#width
			, y1 = this.#y + this.#height
			;


		const points = [
			[X, Y],
			[ this.#x, this.#y ],
			[ this.#x, Y ],
			[ this.#x, y1 ],
			[ X, this.#y ],
			[ X, y1 ],
			[ x1, this.#y ],
			[ x1, Y ],
			[ x1, y1 ],
			[ x, this.#y],
			[ this.#x, y],
			[ x, y1],
			[ x1, y]
		];

		for (const i of points)
			if (this.inNode(x, y, i[0], i[1]))
				return [i[0], i[1]];

		
	}

	static drawLine(ctx, x1, y1, x2, y2, stroke='#111111', strokeWidth=1) {
		ctx.save();

		ctx.strokeStyle = stroke;
		ctx.lineWidth = strokeWidth;

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();

		ctx.restore();
	}

	static drawNode(ctx, x, y, color='#00f', fill=false, r=kNodeRadius) {
		 
		// console.debug('NODE:', x, y);

		ctx.save();

		ctx.strokeStyle = color;
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.closePath();

		if (fill) {
			ctx.fillStyle = typeof fill == 'boolean' ? color : fill;
			ctx.fill();
		}

		ctx.stroke();

		ctx.restore();
	}

	static inNode(x, y, X, Y) {
		const R = kNodeRadius;

		return (x > X - R &&
			x < X + R &&
			y > Y - R &&
			y < Y + R);
	}
	
}
