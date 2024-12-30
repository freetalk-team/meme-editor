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

	toSVG(x=this.x, y=this.y) {
		const fill = this.fill
			, stroke = this.stroke
			, alpha = this.alpha
			, shadow = this.shadow
			, angle = this.angle * (180 / Math.PI)
			;

		let xml = '';
		
		xml += `<text x="${x}" y="${y}" font-size="${this.#size}" font-family="${this.#font}" dy="${this.#size}"`;

		if (this.#bold)
			xml += ' font-weight="bold"';

		if (this.#italic)
			xml += ' font-style="italic"';

		if (fill) {
			xml += ` fill="${fill}"`;

			if (alpha < 1)
				xml += ` fill-opacity="${alpha}"`;
		}

		if (stroke)
			xml += ` stroke="${stroke}" stroke-width="${this.strokeWidth}"`;

		if (shadow) 
			xml += ` filter="url(#${this.id + '-shadow'})"`;

		if (angle) {
			const [x, y] = this.center();
			xml += ` transform="rotate(${angle},${x},${y})"`;
		}

		
		xml += `>${this.#text}</text>`;

		return xml;
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
