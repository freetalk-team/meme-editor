import { Base } from "./base.js";

class Text extends Base {

	#text = '';

	#size = 30;
	#font = 'Arial'; 
	#fill = '#111111';
	#stroke = '#111111';
	#strokeWidth = 0;

	#shadow = 'none';
	#shadowColor = '#444444';
	#shadowWidth = 2;

	get type() { return 'text'; }

	get size() { return this.#size; }
	get font() { return this.#font; }
	get stroke() { return this.#stroke; }
	get strokeWidth() { return this.#strokeWidth; }
	get fill() { return this.#fill; }
	get value() { return this.#text; }
	get shadow() { return this.#shadow; }
	get shadowWidth() { return this.#shadowWidth; }
	get shadowColor() { return this.#shadowColor; }

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

	set size(n) {
		if (typeof n == 'string') n = parseInt(n);
		if (n < 8) n = 8;

		this.#size = n;

		this.#recalcBorder();
	}

	set font(n) {
		this.#font = n;
	}

	set fill(v) {
		// console.log('Setting stroke value', v);
		this.#fill = v;
	}

	set stroke(v) {
		// console.log('Setting stroke value', v);
		this.#stroke = v;
	}

	set strokeWidth(v) {
		if (typeof n == 'string') n = parseInt(n);
		this.#strokeWidth = v;
	}

	set value(s) {
		console.debug('Setting text:', s);
		this.#text = s;

		this.#recalcBorder();
	}

	set text(v) {
		this.value = v;
	}

	// set properties(obj) {

	// 	super.properties = obj;

	// 	obj.assign(Object.fromInstance(this));
		
	// }

	draw(ctx) {
		if (!this.#text) return;

		const text = this.#text.split('\n').map(i => i.trim());

		ctx.save();
		//ctx.translate(btn.x, btn.y);
		//ctx.rotate(angle);

		let x = this.x 
			, y = this.y
			;


		ctx.fillStyle = this.#fill;
		ctx.strokeStyle = this.#stroke;
		ctx.lineWidth = this.#strokeWidth;
		// ctx.textBaseline = "middle";
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.font = "bold " + `${this.#size}px` + ' ' + this.#font;

		const lineHeight = ctx.measureText("M").width * 1.2;
		
		for (const t of text) {

			// ctx.translate(x, y);
			if (this.#fill) {

				if (this.#shadow == 'fill') 
					this.#addShadow(ctx);

				ctx.fillText(t, x, y);
			}

			if (this.#strokeWidth > 0) {
				if (this.#shadow == 'stroke') 
					this.#addShadow(ctx);
	
				ctx.strokeText(t, x, y);
			}

			y += lineHeight;

		}

		ctx.restore();

		super.draw(ctx);

		if (this.selected)
			super.drawBorder(ctx, 1, '#888', 5, true);
	}

	#addShadow(ctx) {
		ctx.shadowColor = this.#shadowColor; // color
		ctx.shadowBlur = 5; // blur level
		ctx.shadowOffsetX = this.#shadowWidth; // horizontal offset
		ctx.shadowOffsetY = this.#shadowWidth; // vertical offset
	}

	#recalcBorder() {
		if (this.#text) {
			const lines = this.#text.trim().split('\n');

			lines.sort((a, b) => b.length - a.length);

			this.width = lines[0].length * this.#size;
			this.height = lines.length * this.#size * 1.1;
		}
		else {
			this.width = this.width;
			this.height = this.height;
		}
	}
}

export { 
	Base,
	Text	
}