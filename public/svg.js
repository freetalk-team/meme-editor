
export class SVG {

	#defs = '';
	#body = '';
	#width = 400;
	#height = 300;

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

		if (shadow) {
			this.#defs += shadowFilter(shadow);
			xml += ` filter="url(#${shadow.id})"`;
		}
		
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

		if (fill) {
			xml += ` fill="${fill.color}"`;

			if (fill.alpha < 1)
				xml += ` fill-opacity="${fill.alpha}"`;
		}

		if (stroke)
			xml += ` stroke="${stroke.color}" stroke-width="${stroke.width}"`;

		if (shadow) {
			this.#defs += shadowFilter(shadow);

			xml += ` filter="url(#${shadow.id})"`;
		}

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

		if (shadow) {
			this.#defs += shadowFilter(shadow);

			xml += ` filter="url(#${shadow.id})"`;
		}
		
		xml += '/>';

		this.#body += xml;
	}

	line(x1, y1, x2, y2, stroke) {
		let xml = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`;

		if (stroke) {
			xml += ` stroke="${stroke.color}" stroke-width="${stroke.width}"`;

			if (stroke.alpha < 1)
				xml += ` stroke-opacity="${stroke.alpha}"`;
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

		if (shadow) {
			this.#defs += shadowFilter(shadow);

			xml += ` filter="url(#${shadow.id})"`;
		}
		
		if (box.angle) {
			const [x, y] = center(box);
			xml += ` transform="rotate(${box.angle},${x},${y})"`;
		}
		
		xml += `>${text.value}</text>`;

		this.#body += xml;
	}

	group(box, fill, stroke) {

		let xml = '<g';

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

	toString() {
		let xml = `<svg width="${this.#width}" height="${this.#height}" xmlns="http://www.w3.org/2000/svg">`;

		if (this.#defs)
			xml += `<defs>${this.#defs}</defs>`;

		xml += this.#body;
		xml += '</svg>';

		return xml;
	}
}

function center(box) {
	return [box.x + box.width/2, box.y + box.height/2];
}

function shadowFilter(shadow) {
	const id = shadow.id
		, dx = shadow.width
		, color = shadow.color
		;

	return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feFlood flood-color="${color}" result="flood"/><feComposite in2="SourceAlpha" operator="in" result="shadow"/><feGaussianBlur in="shadow" stdDeviation="3"/><feOffset dx="${dx}" dy="${dx}" result="offsetblur"/><feMerge><feMergeNode in="offsetblur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}