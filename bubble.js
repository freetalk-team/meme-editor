export class Bubble {
	#editor;
	#width = 200;
	#height = 150;
	#stroke = '#000000';
	#fill = '#888888';
	#beak = 'left';
	#text = '';

	#x;
	#y;

	#radius = 10;

	#pX;
	#pY;

	#nr = 5; // node radius

	#tX = 10;
	#tY = 10;
	#tSize = Math.floor(this.#width / 10);
	#tFont = 'Arial'; 
	#tFill = '#eeeeee';
	#tStroke;

	#selected = false;

	constructor(editor) {
		this.#editor = editor;

		this.#x = 50 + Math.random() * (editor.canvas.width - this.#width - 50);
		this.#y = 10 + Math.random() * (editor.canvas.height - this.#height - 10);

		this.#pX = this.#x - 30;
		this.#pY = this.#y + 50;
	}

	set selected(obj) {

		this.#selected = !!obj;

		if (!obj) return;

		obj.x.value = this.#x;
		obj.y.value = this.#y;
		obj.width.value = this.#width;
		obj.height.value = this.#height;
		obj.radius.value = this.#radius;

		obj.fill.value = this.#fill;
		obj.stroke.value = this.#stroke;

		obj.beak.value = this.#beak;

		obj.textOffsetX.value = this.#tX;
		obj.textOffsetY.value = this.#tY;
		obj.textSize.value = this.#tSize;
		obj.text.value = this.#text;

		if (this.#tFill) {
			obj.textFill.value = this.#tFill;
			obj.textFill.disabled = false;
			obj.textFill.previousElementSibling.checked = true;
		}
		else {
			obj.textFill.disabled = true;
			obj.textFill.previousElementSibling.checked = false;
		}

		if (this.#tStroke) {
			obj.textStroke.value = this.#tStroke;
			obj.textStroke.disabled = false;
			obj.textStroke.previousElementSibling.checked = true;
		}
		else {
			obj.textStroke.disabled = true;
			obj.textStroke.previousElementSibling.checked = false;
		}
			
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
		if (typeof n == 'string') n = parseInt(n);
		if (n < 10) n = 10;

		this.#width = n;
	}

	set height(n) {
		if (typeof n == 'string') n = parseInt(n);
		if (n < 10) n = 10;

		this.#height = n;
	}

	set radius(n) {
		if (typeof n == 'string') n = parseInt(n);
		//if (n < 10) n = 10;

		this.#radius = n;
	}

	set stroke(v) {
		// console.log('Setting stroke value', v);
		this.#stroke = v;

	}

	set fill(v) {
		// console.log('Setting stroke value', v);
		this.#fill = v;

	}

	set beak(v) {

		const d = this.#beak == 'left' ? this.#x - this.#pX : this.#pX - this.#x - this.#width;

		this.#pX = v == 'left' ? this.#x - d : this.#x + this.#width + d;
		this.#beak = v;
	}

	set textOffsetX(n) {
		if (typeof n == 'string') n = parseInt(n);
		if (n < 2) n = 2;

		this.#tX = n;
	}

	set textOffsetY(n) {
		if (typeof n == 'string') n = parseInt(n);
		if (n < 2) n = 2;

		this.#tY = n;
	}

	set textSize(n) {
		if (typeof n == 'string') n = parseInt(n);
		if (n < 8) n = 8;

		this.#tSize = n;
	}

	set textFont(n) {
		this.#tFont = n;
	}

	set textFill(v) {
		// console.log('Setting stroke value', v);
		this.#tFill = v;

	}

	set textStroke(v) {
		// console.log('Setting stroke value', v);
		this.#tStroke = v;

	}

	set text(s) {
		console.debug('Setting text:', s);
		this.#text = s.split('\n');

	}

	get ctx() {
		return this.#editor.context;
	}
	
	draw() {

		const ctx = this.ctx;

		ctx.save();

		// ctx.fillStyle = this.#fill;
		// ctx.fillRect(this.#x, this.#y, this.#width, this.#height);

		// ctx.strokeStyle = this.#stroke;
		// ctx.strokeRect(this.#x, this.#y, this.#width, this.#height);

		// ctx.lineWidth = 3;

		this.#drawBubble();
		this.#drawText();
		this.#drawSelection();

		ctx.restore();
	}

	handleSelect(x, y) {
		const px0 = this.#x
			, px1 = px0 + this.#width
			, py0 = this.#y
			, py1 = py0 + this.#height
			;

		if (x > px0 && x < px1 && y > py0 && y < py1) {
			return true;
		}

		this.#selected = false;
	}

	handleClick(x, y) {

		if (!this.#selected) return;

		let X = this.#pX
			, Y = this.#pY
			, R = this.#nr
			;

		if (x > X - R &&
			x < X + R &&
			y > Y - R &&
			y < Y + R)
			return {

				move: (x, y) => {
					this.#pX = x;
					this.#pY = y;
				}

			};

		X = this.#x + this.#width / 2;
		Y = this.#y + this.#height / 2;

		if (x > X - R &&
			x < X + R &&
			y > Y - R &&
			y < Y + R)
			return {

				move: (x, y) => {

					const X = this.#x
						, Y = this.#y
						;

					this.#x = x - this.#width / 2;
					this.#y = y - this.#height / 2;

					this.#pX -= X - this.#x;
					this.#pY -= Y - this.#y;
				}

			};

		return null;
	}

	#drawText(text=this.#text) {

		if (!text) return;
		if (!Array.isArray(text)) text = [text];

		const ctx = this.ctx;

		ctx.save();
		//ctx.translate(btn.x, btn.y);
		//ctx.rotate(angle);

		let x = this.#x + this.#tX
			, y = this.#y + this.#tY
			;

		ctx.fillStyle = this.#tFill;
		ctx.strokeStyle = this.#tStroke;
		// ctx.textBaseline = "middle";
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.font = "bold " + `${this.#tSize}px` + ' ' + this.#tFont;

		const lineHeight = ctx.measureText("M").width * 1.2;
		
		for (const t of text) {

			// ctx.translate(x, y);
			if (this.#tFill)
				ctx.fillText(t, x, y);

			if (this.#tStroke)
				ctx.strokeText(t, x, y);

			y += lineHeight;

		}

		ctx.restore();
	}

	#drawSelection() {

		if (!this.#selected) return;

		const ctx = this.ctx;

		ctx.strokeStyle = '#00f';

		ctx.beginPath();
		ctx.arc(this.#pX, this.#pY, this.#nr, 0, Math.PI * 2);
		ctx.stroke();
		ctx.closePath();

		let X = this.#x + this.#width / 2
			, Y = this.#y + this.#height / 2

		ctx.beginPath();
		ctx.arc(X, Y, this.#nr, 0, Math.PI * 2);
		ctx.stroke();
		ctx.closePath();
	}

	#drawBubble() {

		const ctx = this.ctx;

		const x = this.#x
			, y = this.#y
			, width = this.#width
			, height = this.#height
			, fill = this.#fill
			, stroke = this.#stroke
			;

		let radius = this.#radius;
		
		if (typeof radius === 'number') {
		radius = {
			tl: radius,
			tr: radius,
			br: radius,
			bl: radius
		};
		} else {
		var defaultRadius = {
			tl: 0,
			tr: 0,
			br: 0,
			bl: 0
		};
		for (var side in defaultRadius) {
			radius[side] = radius[side] || defaultRadius[side];
		}
		}
		ctx.beginPath();
		ctx.moveTo(x + radius.tl, y);
		ctx.lineTo(x + width - radius.tr, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		if (this.#beak == 'right') {
			ctx.lineTo(x + width, y + radius.tl);
			ctx.lineTo(this.#pX, this.#pY);
			ctx.lineTo(x + width, y + radius.tl + 20);
		}
		ctx.lineTo(x + width, y + height - radius.br);
	
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		ctx.lineTo(x + radius.bl, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);

		if (this.#beak == 'left') {
			ctx.lineTo(x, y + radius.tl + 20);
			ctx.lineTo(this.#pX, this.#pY);
		}
		
		ctx.lineTo(x, y + radius.tl);
		
		ctx.quadraticCurveTo(x, y, x + radius.tl, y);
		ctx.closePath();
		if (fill) {
			ctx.fillStyle = fill;
			ctx.fill();
		}
		if (stroke) {
			ctx.strokeStyle = stroke;
			ctx.stroke();
		}
	}
}

