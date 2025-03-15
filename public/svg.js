
export class SVG {

	#defs = '';
	#body = '';
	#width = 400;
	#height = 300;

	#filters = new Set;

	set width(n) { this.#width = n; }
	set height(n) { this.#height = n; }

	constructor(w, h) {
		this.#width = w || this.#width;
		this.#height = h || this.#height;
	}

	rect(box, radius, fill, stroke, shadow) {

		let xml = '';
		
		xml += `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"`;

		if (radius > 0)
			xml += ` rx="${radius}" ry="${radius}"`;


		if (fill) {
			xml += ` fill="${fill.color}"`;

			if (fill.alpha < 1)
				xml += ` fill-opacity="${fill.alpha}"`;
		}

		if (stroke)
			xml += ` stroke="${stroke.color}" stroke-width="${stroke.width}"`;

		if (shadow)
			xml += ` filter="url(#${this.#addShadow(shadow)})"`;
		
		if (box.angle) {
			const [x, y] = box.center();
			xml += ` transform="rotate(${box.angle},${x},${y})"`;
		}
		
		xml += '/>';

		this.#body += xml;
	}

	path(box, { segments, closed }, fill, stroke, shadow) {

		const start = closed ? segments.last() : segments[0];
		const [ X, Y ] = box.center();

		let xml = '<path d="';


		// Move to the starting point of the first segment
		xml += `M${start.x + X},${start.y + Y}`;

		for (const i of segments) 
			xml += i.toSVG(X, Y);

		if (closed)
			xml += 'Z';

		xml += '"';

		if (closed && fill) {
			xml += ` fill="${fill.color}"`;

			if (fill.alpha < 1)
				xml += ` fill-opacity="${fill.alpha}"`;
		}
		else {
			xml += ` fill="none"`;
		}

		if (stroke) {
			xml += ` stroke="${stroke.color}" stroke-width="${stroke.width}"`;
			
			/*
				stroke-linecap:
				butt (default): Flat ends at the exact path endpoint.
				round: Rounded ends extending slightly beyond the path endpoint.
				square: Square ends extending beyond the endpoint by half the stroke width.
			*/
			if (stroke.linecap) 
				xml += ` stroke-linecap="${stroke.linecap}"`;
			
		}

		if (shadow) 
			xml += ` filter="url(#${this.#addShadow(shadow)})"`;

		if (box.angle) 
			xml += ` transform="rotate(${box.angle},${X},${Y})"`;

		xml += '/>';
		
		this.#body += xml;

		// Arc
		// const [rx, ry, xAxisRotation, largeArcFlag, sweepFlag] = arcParams;
		// path += `A ${rx} ${ry} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${p2[0]} ${p2[1]} `;
	}

	circle(x, y, r, fill, stroke, shadow) {

		let xml = `<circle cx="${x}" cy="${y}" r="${r}"`;

		if (fill) {
			xml += ` fill="${fill.color}"`;

			// todo: alpha
		}

		if (stroke)
			xml += ` stroke="${stroke.color}" stroke-width="${stroke.width}"`;

		if (shadow)
			xml += ` filter="url(#${this.#addShadow(shadow)})"`;
		
		xml += '/>';

		this.#body += xml;
	}

	line(x1, y1, x2, y2, stroke) {
		let xml = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`;

		if (stroke) {
			xml += ` stroke="${stroke.color}" stroke-width="${stroke.width}"`;

			if (stroke.alpha < 1)
				xml += ` stroke-opacity="${stroke.alpha}"`;

			if (stroke.linecap) 
				xml += ` stroke-linecap="${stroke.linecap}"`;
		}

		xml += '/>';

		this.#body += xml;
	}

	text(box, text, fill, stroke, shadow) {
		
		let xml = '';
		
		// xml += `<text x="${box.x}" y="${box.y}" font-size="${text.size}" font-family="${text.font || 'Arial'}" dy="${text.size}"`;
		xml += `<text x="${box.x}" y="${box.y}" font-size="${text.size}" font-family="${text.font || 'Arial'}"`;

		if (text.bold)
			xml += ' font-weight="bold"';

		if (text.italic)
			xml += ' font-style="italic"';

		switch (text.align) {

			case 'right':
			xml += ' text-anchor="end"';
			break;

			case 'center':
			xml += ' dominant-baseline="hanging"';
			case 'middle':
			xml += ' text-anchor="middle"';
			break;
		}

		if (text.baseline)
			xml += ` dominant-baseline="${text.baseline}"`;
		else
			xml += ` dy="${text.size}"`;
		
		if (fill) {
			xml += ` fill="${fill.color}"`;

			if (fill.alpha < 1)
				xml += ` fill-opacity="${fill.alpha}"`;
		}

		if (stroke)
			xml += ` stroke="${stroke.color}" stroke-width="${stroke.width}"`;

		if (shadow) 
			xml += ` filter="url(#${this.#addShadow(shadow)})"`;
		
		if (box.angle) {
			const [x, y] = center(box);
			xml += ` transform="rotate(${box.angle},${x},${y})"`;
		}
		
		xml += `>${text.value}</text>`;

		this.#body += xml;
	}

	group(id, box, fill, stroke) {

		let xml = '<g';

		if (id) {
			// if (id.id) xml += ` id="${id.id}"`;
			if (id.name) xml += ` id="${id.name}"`;
		}

		if (fill) {
			xml += ` fill="${fill.color}"`;
			// todo: alpha
		}

		if (stroke) 
			xml += ` stroke="${stroke.color}" stroke-width="${stroke.width}"`;
		
		if (box.angle) {
			const [x, y] = center(box);
			xml += ` transform="rotate(${box.angle},${x},${y})"`;
		}

		// not supported by Inkscape, Chrome, Firefox
		// if (shadow) 
		// 	xml += ` filter="url(#${this.id + '-shadow'})"`;

		xml += '>';

		this.#body += xml;
	}

	groupEnd() {
		this.#body += '</g>';
	}

	toString(x=0, y=0) {

		const w = this.#width
			, h = this.#height;

		let xml = `<svg width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;

		if (this.#defs)
			xml += `<defs>${this.#defs}</defs>`;

		xml += this.#body;
		xml += '</svg>';

		return xml;
	}

	#addShadow(shadow) {

		const id = Object.hashHex(shadow);

		if (!this.#filters.has(id)) {
			this.#filters.add(id);
			this.#defs += shadowFilter(id, shadow);
		}

		return id;
	}
}

function center(box) {
	return [box.x + box.width/2, box.y + box.height/2];
}

function shadowFilter(id, shadow) {
	const color = shadow.color
		, dx = shadow.x
		, dy = shadow.y;

	return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feFlood flood-color="${color}" result="flood"/><feComposite in2="SourceAlpha" operator="in" result="shadow"/><feGaussianBlur in="shadow" stdDeviation="3"/><feOffset dx="${dx}" dy="${dy}" result="offsetblur"/><feMerge><feMergeNode in="offsetblur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}