import { Base } from "./base.js";

class Text extends Base {

	#text = '';

	#size = 30;
	#bold = false;
	#italic = false;
	#font = 'Arial';

	#parent = false;

	get type() { return 'text'; }

	constructor(parent) {
		super();

		this.fill = '#111111';
		this.strokeWidth = 0;
		this.stroke = null;
		this.shadow = null;

		this.#parent = !!parent;
	}

	get size() { return this.#size; }
	get bold() { return this.#bold; }
	get italic() { return this.#italic; }
	get font() { return this.#font; }
	get value() { return this.#text; }

	set size(n) {
		if (typeof n == 'string') n = parseInt(n);
		if (n < 8) n = 8;

		this.#size = n;

		this.#recalcBorder();
	}

	set bold(b) {
		this.#bold = b;
	}

	set italic(b) {
		this.#italic = b;
	}

	set font(n) {
		this.#font = n;
	}

	set value(s) {
		console.debug('Setting text:', s);
		this.#text = s;

		if (!this.#parent)
			this.#recalcBorder();
	}

	set text(v) {
		this.value = v;
	}

	

	draw(ctx) {
		if (!this.#text) return;

		this.drawText(ctx, this.#text, {
			size: this.#size,
			font: this.#font,
			bold: this.#bold,
			italic: this.#italic
		});

		// if (this.selected)
		// super.drawBorder(ctx, 1, '#888');
	}

	drawSelection(ctx) {

		this.drawBorder(ctx, 1, '#888', 5, true);

		super.drawSelection(ctx);
	}

	drawSVG(svg, x=this.x, y=this.y, group=false) {
		const fill = this.fill ? { color: this.fill, alpha: this.alpha } : null
			, stroke = this.stroke ? { color: this.stroke, width: this.strokeWidth } : null
			, shadow = this.shadow ? { id: this.id, color: this.shadowColor, width: this.shadowWidth } : null
			, box = this.box()
			, text = { 
				value: this.#text,
				font: this.#font,
				size: this.#size,
				bold: this.#bold,
				italic: this.#italic
			 }
			;

		box.x = x;
		box.y = y;

		if (group)
			 box.angle = 0;

		svg.text(box, text, fill, stroke, shadow);
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
