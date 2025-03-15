
import { Rect as Base } from "./rect.js";
import { Point } from "./curve.js";
import { Path } from './path.js';

const Colors = {
	blue: '#2196F3',
	red: '#f44336',
	green: '#4CAF50',
	orange: '#ff9800',
	teal: '#009688'
};

const colors = Object.values(Colors);
const M = 10;

export class Chart extends Base {

	#size = 16;
	#font = 'Arial';
	#type = 'bar'; // pie, scatter, line, spline
	#labels = true;
	#legend = true;
	#axis = true;

	#file;
	#data = { labels: [], sets: [] };

	#scale = { min: 0, max: 100, step: 20 };
	#margin = { top: 10, bottom: 10, left: 10, right: 10 };
	#textWidth = { x: 0, y: 0 };

	get type() { return 'chart'; }

	get file() { return this.#file; }
	set file(v) {
		this.#file = v;
	}

	get height() { return super.height; }
	set height(n) {
		super.height = n;

		if (this.#data.sets)
			this.#updateScale();
	}

	get size() { return this.#size; }
	set size(n) {
		if (typeof n == 'string') n = parseInt(n);
		if (n < 8) n = 8;
		this.#size = n;
	}

	get font() { return this.#font; }
	set font(n) {
		this.#font = n;
	}

	get kind() { return this.#type; }
	set kind(v) {
		this.#type = v;
	}

	get labels() { return this.#labels; }
	set labels(v) {
		this.#labels = v;
	}

	get legend() { return this.#legend; }
	set legend(v) {
		this.#legend = v;
	}

	get axis() { return this.#axis; }
	set axis(v) {
		this.#axis = v;
	}

	clone() {
		const o = super.clone();

		o.#scale = this.#scale;
		o.#margin = this.#margin;
		o.#data = this.#data;
		o.#data.refs++;

		return o;
	}

	release() {
		this.#data.refs--;
	}

	setData(data) {
		data.refs++;

		this.#type = data.type;
		this.#data = data;
		this.#updateScale();
	}

	getData() {
		return this.#data;
	}

	draw(ctx) {

		super.draw(ctx);

		const datasets = this.#data.sets
			, labels = this.#data.labels
			, labelType = this.#data.labelColumn ? this.#data.inferredTypes[this.#data.labelColumn] : 'categorical'
			, scale = this.#scale
			, stroke = this.stroke
			, strokeWidth = this.strokeWidth
			, shadow = !!this.shadow
			, shadowColor = this.fillShadowColor()
			, shadowWidth = this.shadowWidth
			, alpha = this.alphaHex()
			, size = this.#size
			, font = this.#font
			, textWidth = this.#textWidth
			, d = 5 + strokeWidth / 2
			;

		ctx.save();

		let { x, y } = this.setGeometry(ctx);

		const box = { 
				x: x + M, 
				y: y + M, 
				width: this.width - 2*M,
				height: this.height - 2*M
			}
			;

		ctx.font = `${this.#size}px ${this.#font}`;
		ctx.fillStyle = this.stroke;
		ctx.textBaseline = 'top';

		let b = box;

		if (this.#legend)
			drawLegend(box);

		if (this.#labels)
			b = drawLabels(box);

		if (this.#axis) 
			drawAxis(box);
		

		if (labels.length > 0) {


			switch (this.#type) {

				case 'bar':
				// this.#drawBarChart(ctx, x, y, width, height);
				if (labels.length < 10)
					drawBarChart(box);
				else
					drawChart(b, 'scatter');
				break;

				case 'line':
				case 'spline':
				case 'scatter':
				drawChart(b, this.#type);
				break;
			}

		} 

		ctx.restore();

		function drawAxis(box) {

			let x = box.x, y = box.y;
	
			const count = Math.ceil(scale.max /scale.step)
				, dy = box.height / count
				;
	
			ctx.save();
	
			ctx.lineWidth = strokeWidth;
			ctx.strokeStyle = stroke /*+ this.alphaHex()*/;
			ctx.lineCap = 'round'; // Smooth rounded ends
			ctx.lineJoin = 'round'; // Smooth joints
	
			ctx.beginPath();
			ctx.moveTo(x, y);
	
			y += box.height;
			ctx.lineTo(x, y);
			ctx.lineTo(x + box.width, y);
	
			ctx.stroke();
	
			ctx.lineWidth = 1;
			ctx.strokeStyle = stroke + '55';

			y -= dy
	
			for (let i = 0; i < count; ++i, y -= dy) {
				ctx.moveTo(x - d , y);
				ctx.lineTo(x + box.width, y);
			}
	
			ctx.stroke();
			ctx.restore();
		}

		function drawLegend(box) {

			const legend = datasets.filter(i => !!i.label).map(i => {
				i.width = ctx.measureText(i.label).width + 30;
				return i;
			});

			if (legend.length > 0) {

				// this.#margin.top = this.#size + 10;

				ctx.save();

				const total = legend.map(i => i.width).sum();
				const width = box.width
					y = box.y
					;

				const dx = width / legend.length;

				let x = box.x + (width > total ? (width - total) / 2 : 0);

				for (let i = 0; i < legend.length; ++i) {

					ctx.fillStyle = colors[i % colors.length];
					ctx.fillRect(x, y, 20, size - 4);

					x += 25;
					ctx.fillText(legend[i].label, x, y);

					x += legend[i].width + 5;
				}

				ctx.restore();

				const m = size + 10;

				box.y += m;
				box.height -= m;
			}
		}

		function drawLabels(box) {
		
			const m = size + 20
				, height = box.height - m
				, count = Math.ceil(scale.max / scale.step)
				, dy = height / count
				;

			ctx.save();
		
			ctx.font = `${size - 2}px ${font}`;
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';

			const w = ctx.measureText(scale.max.toString()).width;

			textWidth.y = w;

			box.x += w;
			box.width -= w;

			for (let i = 0, l = 0, x = box.x, y = box.y + height; i < count + 1; ++i, y -= dy, l+= scale.step)
				ctx.fillText(l.toString(), x, y);

			ctx.restore();

			box.x += 20;
			box.width -= 20;

			if (labels.length > 0) {

				ctx.save();

				ctx.textBaseline = 'bottom';
				ctx.textAlign = 'center';


				let X = labels;

				if (labelType != 'categorical') {
					const labelWidth = ctx.measureText(labels.last()).width + 60;
					const maxLabels = Math.ceil(box.width / labelWidth);

					textWidth.x = labelWidth;

					if (labels.length > maxLabels) {
						const step = Math.floor(labels.length / maxLabels);

						X = labels.filter((v, i) => i % step == 0);
					}
				}

				// this.#margin.bottom = this.#size + 15;

				const dx = box.width / X.length
					, y = box.y + box.height
					, b = Object.assign({}, box);
					;

				// console.debug('Draw labels:', width, dx);

				b.x += dx / 2;
				b.width -= dx;

				const p = new Path2D;

				for (let i = 0, x = b.x; i < X.length; ++i, x += dx) {
					p.moveTo(x, y - m);
					p.lineTo(x, y - m + d);

					ctx.fillText(X[i].toString(), x, y);
				}

				ctx.stroke(p);
				ctx.restore();

				box.height -= m;
				b.height -= m;

				return b;
			}

			return box;
		}

		function drawChart(box, mode='spline') {

			const n = datasets[0].data.length - 1
				, dx = box.width / n
				, height = box.height
				, y = box.y
				, x = box.x;

			let points, spline, path, R = strokeWidth * 0.8;

			if (R < 3) R = 3;

			ctx.save();

			ctx.strokeStyle = stroke;
			ctx.lineWidth = strokeWidth;
			ctx.lineCap = 'round'; // Smooth rounded ends
			ctx.lineJoin = 'round'; // Smooth joints

			for (let i = 0, X, Y, c, data, r; i < datasets.length; ++i) {

				data = datasets[i].data;
	
				X = x;
				Y = data.map(i => {
					r = (scale.max - i) / scale.max;
					return y + height * r;
				});
	
				c = colors[i % colors.length];

				ctx.strokeStyle = c;

				points = [];
				path = null;

				for (let j = 0; j < data.length; ++j, X += dx) 
					points.push(new Point(X, Y[j]));

				switch (mode) {

					case 'spline':
					spline = Path.toSpline(points, 1);
					path = Path.getPath(spline);
					break;

					case 'line':
					path = Path.getPath(points);
					break;
				}

				if (path)
					ctx.stroke(path);

				for (const i of points)
					Chart.drawNode(ctx, i.x, i.y, c, true, R);
			}

			ctx.restore();
		}

		function drawBarChart(box) {

			const n = datasets[0].data.length
				, dx = box.width / n
				, m = box.width * 0.02
				, dw = (dx - m) / datasets.length
				, y = box.y
				, height = box.height;
	
			let x = box.x + m/2;
	
			let dy, r, c;
	
			ctx.save();
	
			for (let i = 0; i < n; ++i) {
				for (let j = 0; j < datasets.length; ++j) {
	
					c = colors[j % colors.length];
					r = (scale.max - datasets[j].data[i]) / scale.max;
					dy = height * r;
	
					ctx.strokeStyle = c;
					ctx.fillStyle = c + alpha;
	
					if (shadow) {
						ctx.save();

						ctx.shadowColor = shadowColor; // color
						ctx.shadowBlur = 5; // blur level
						ctx.shadowOffsetX = shadowWidth; // horizontal offset
						ctx.shadowOffsetY = shadowWidth; // vertical offset
	
						ctx.fillRect(x, y + dy, dw, height - dy);
	
						ctx.restore();
					}
					
					ctx.fillRect(x, y + dy, dw, height - dy);
					ctx.strokeRect(x, y + dy, dw, height - dy);
	
					x += dw;
				}
	
				x += m;
			}
	
			ctx.restore();
		}
	}

	drawSVG(svg, canvas) {
		const box = this.box(20, canvas) 
			, size = this.#size
			, stroke = this.getStroke({ linecap: 'round' })
			, shadow = this.getShadow()
			, count = Math.ceil(this.#scale.max / this.#scale.step)
			, d = 5 + this.strokeWidth / 2
			, datasets = this.#data.sets
			, labels = this.#data.labels
			, labelType = this.#data.labelColumn ? this.#data.inferredTypes[this.#data.labelColumn] : 'categorical'
			, margin = this.#margin
			, alpha = this.alpha
			, scale = this.#scale
			, textWidth = this.#textWidth
			;
	
		const fill = { };
		const text = { font: this.font, size };

		svg.group({ name: this.name}, box);

		box.angle = 0;

		let b = box;

		// legend
		if (this.#legend)
			drawLegend(box);

		if (this.#labels) {
			drawYAxis(box);
			b = drawXAxis(box);
		} 

		if (this.#axis)
			drawAxis(box);

		switch (this.#type) {

			case 'bar':
			if (labels.length < 10)
				drawBarChart(box);
			else
				drawChart(b, 'scatter');
			break;

			case 'line':
			case 'spline':
			case 'scatter':
			drawChart(b, this.#type);
			break;
		}
		
		svg.groupEnd();

		function drawLegend(box) {

			console.debug('SVG legned:', box);

			svg.group({ name: 'legend' }, box);

			const legend = datasets.filter(i => !!i.label)
				, m = size + 10
				, w = box.width
				;

			if (legend.length > 0) {
				const total = legend.map(i => i.width).sum();
				const rb = { x: box.x + (w > total ? (w - total) / 2 : 0)
					, y: box.y + 4, width: 20, height: size - 2 };
				const b = { x: rb.x + 25, y: box.y };

				for (let i = 0, w; i < legend.length; ++i) {

					fill.color = colors[i % colors.length];
					text.value = legend[i].label;

					svg.rect(rb, 0, fill, stroke);
					svg.text(b, text, fill);

					w = legend[i].width + 25;

					b.x += w;
					rb.x += w;
				}

				box.y += m;
				box.height -= m;
			}

			svg.groupEnd();
		}

		function drawYAxis(box) {

			console.debug('SVG y axis:', box);

			const s = Object.assign({ alpha: 0.5 }, stroke, { width: 1})
				, m = size + 20;

			text.align = 'right';
			text.baseline = 'middle';
			text.size = size - 2;

			box.x += textWidth.y;
			box.width -= textWidth.y;

			svg.group({ name: 'Y' }, box);

			const x = box.x - 10
				, h = box.height - m;
	
			let dy = h / count
				, y = box.y + h;

	
			for (let i = 0, l = 0; i < count + 1; ++i, y -= dy, l += scale.step) {
	
				if (i > 0)
					svg.line(box.x - 5, y, box.x + box.width + 5, y, s);
	
				text.value = l.toString();
	
				svg.text({ x, y }, text, stroke);
			}
	
			delete text.baseline;
			text.size = size;

			svg.groupEnd();
		}

		function drawXAxis(box) {

			console.debug('SVG y axis:', box);

			const w = box.width;

			let b = box;

			if (labels.length > 0) {

				b = Object.assign({}, box);

				let X = labels;

				if (labelType != 'categorical') {
					const maxLabels = Math.ceil(box.width / textWidth.x);

					if (labels.length > maxLabels) {
						const step = Math.floor(labels.length / maxLabels);

						X = labels.filter((v, i) => i % step == 0);
					}
				}

				svg.group({ name: 'X'}, box);

				const dx = w / X.length 
					, y = box.y + box.height
					, m = size + 20
					;


				// console.debug('Draw labels:', width, dx);

	
				text.align = 'middle';
				text.baseline = 'text-after-edge';

				b.x += dx / 2;
				b.width -= dx; 
	
				for (let i = 0, x = b.x; i < X.length; ++i, x += dx) {
	
					text.value = X[i];
	
					stroke.alpha = 0.5;
					svg.line(x, y - m, x, y - m + 5, stroke);

					stroke.alpha = 1;
					svg.text({ x, y }, text, stroke);
				}

				svg.groupEnd();

				box.height -= m;
				b.height -= m;
			}

			return b;
		}

		function drawAxis(box) {

			console.debug('SVG axis:', box);

			svg.group({ name: 'axis' }, box, null, stroke);

			const y = box.y + box.height;

			// axis
			svg.line(box.x, box.y, box.x, y);
			svg.line(box.x, y, box.x + box.width, y);

			svg.groupEnd();
		}

		function drawBarChart(box) {
			const n = datasets[0].data.length
				, w = box.width
				, y = box.y
				, dx = w / n
				, m = w*0.02
				, dw = (dx - m) / datasets.length
				, h = box.height
				, s = Object.assign({}, stroke)
				, f = Object.assign({ alpha }, fill)
				, b = { x: box.x + m/2 + 2, width: dw - 4 }
				;

			svg.group({ name: 'bar' }, box);

			for (let i = 0, r, dy; i < n; ++i) {
				for (let j = 0; j < datasets.length; ++j) {

					s.color = f.color = colors[j % colors.length];
					r = (scale.max - datasets[j].data[i]) / scale.max;
					dy = h * r;

					b.y = y + dy;
					b.height = h - dy;
					
					svg.rect(b, 0, f, s, shadow);

					b.x += dw;
				}

				b.x += m;
			}

			svg.groupEnd();

			delete stroke.alpha;
		}

		function drawChart(box, mode) {

			svg.group({ name: mode }, box);
			
			const n = datasets[0].data.length - 1
				, dx = box.width / n
				, x = box.x
				, h = box.height
				, s = Object.assign({}, stroke)
				, b = { center() { return [0, 0]; }};

			let segments;

			for (let i = 0, X, Y, c, data, r; i < datasets.length; ++i) {

				X = x;

				data = datasets[i].data;

				Y = data.map(i => {
					r = (scale.max - i) / scale.max;
					return box.y + h * r;
				});

				c = colors[i % colors.length];
				s.color = c;

				svg.group(null, box, s, s);

				if (mode != 'scatter') {

					segments = [];

					for (let j = 0; j < Y.length; ++j, X += dx)
						segments.push(new Point(X, Y[j]));

					if (mode == 'spline') 
						segments = Path.toSpline(segments);
					
					svg.path(b, { segments });
				}

				svg.group(null, box);

				for (let j = 0, X = x; j < Y.length; ++j, X += dx) 
					svg.circle(X, Y[j], 3);

				svg.groupEnd();
				svg.groupEnd();
			}

			svg.groupEnd();
		}
	}

	

	#updateScale() {
		const numericalData = this.#data.sets.map(i => i.data);
		this.#scale = calculateYAxisScale(numericalData, super.height);
	}

	static processData = processData;
}

// Process Data (Same as before)
function processData(data) {
	// Remove empty rows
	let filteredData = data.filter(row => row.some(cell => cell.trim() !== ""));
	
	if (filteredData.length < 2) {
		console.error("Not enough data to visualize.");
		return;
	}

	let headerDetected = isHeader(filteredData);
	const columns = headerDetected ? filteredData[0] : Array.from({ length: filteredData[0].length }, (_, i) => `Column ${i + 1}`);
	const body = headerDetected ? filteredData.slice(1) : filteredData;

	const inferredTypes = inferDataTypes(body, columns);
	const firstColumn = columns[0];
	const labelColumn = inferredTypes[firstColumn] === 'categorical' ||  inferredTypes[firstColumn] === 'datetime' ? firstColumn : null;
	const numericalColumns = columns.filter(col => inferredTypes[col] === 'numerical');
	const numericalData = data.map(row => numericalColumns.map(col => parseFloat(row[columns.indexOf(col)]) || 0));

	let sets = [], type = 'bar', labels = [];

	if (numericalColumns.length > 0) {

		sets = numericalColumns.map(col => ({
				label: col,
				data: body.map(row => parseFloat(row[columns.indexOf(col)]) || 0),
			}));

		if (labelColumn) {
			type = 'bar';
			labels = body.map(row => row[columns.indexOf(labelColumn)]);

			if (inferredTypes[labelColumn] == 'datetime') {
				type = 'line';

				const opt = { month: 'short', day: 'numeric' };
				const dates = labels.map(i => new Date(i));

				if (dates[0].getYear() != dates.last().getYear())
					opt.year = '2-digit';

				labels = dates.map(i => i.toLocaleDateString('en-GB', opt));
			}
		}
		else {
			type = 'line';
			labels = body.map((_, i) => i + 1);
		}
	}

	return { type, labels, sets, inferredTypes, labelColumn };

}

// Header Detection (Same as before)
function isHeader(data) {
	const firstRow = data[0];
	const secondRow = data[1];

	let numericCount = secondRow.filter(cell => !isNaN(parseFloat(cell))).length;
	let nonNumericCount = firstRow.filter(cell => isNaN(parseFloat(cell))).length;

	return nonNumericCount > firstRow.length / 2 && numericCount > secondRow.length / 2;
}

// Infer Data Types (Same as before)
function inferDataTypes(data, columns) {
	let types = {};

	columns.forEach((col, index) => {
		let columnData = data.map(row => row[index]).filter(val => val !== "");
		let sample = columnData.slice(0, 10);

		let isDate = sample.every(val => isDateFormat(val));
		let isNumeric = sample.every(val => {
			let parsed = parseFloat(val);
			return !isNaN(parsed) && isFinite(parsed);
		});

		if (isDate) {
			types[col] = 'datetime';
		} else if (isNumeric) {
			types[col] = 'numerical';
		} else if (new Set(columnData).size < 20) {
			types[col] = 'categorical';
		} else {
			types[col] = 'text';
		}
	});

	console.log("Inferred Types:", types);
	return types;
}

// Date Format Checker (Same as before)
function isDateFormat(value) {
	const datePatterns = [
		/^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
		/^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
		/^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
		/^\d{2}-\d{2}-\d{4}$/    // DD-MM-YYYY
	];
	return datePatterns.some(pattern => pattern.test(value));
}


// Dynamic Y-Axis Scale Calculation with Nice Scaling and Height Adjustment
function calculateYAxisScale(data, chartHeight, margin = 0.1) {
	const flattenedData = data.flat();

	if (flattenedData.length === 0) return { min: 0, max: 100, step: 10 };

	let min = Math.min(...flattenedData);
	let m = Math.max(...flattenedData), max = m;

	// Check if the range is zero (all values are identical)
	if (min === max) {
		// If all values are the same, expand the range slightly to avoid division by zero
		max += 1;  // Add a small value to max
		min -= 1;  // Subtract a small value from min
	}

	// if (min > 0) min = 0;

	// Expand the range by a percentage (margin) for padding, but keep a reasonable distance
	const range = max - min;
	min -= margin * range;  // Extend min by margin
	max += margin * range;  // Extend max by margin

	// Ensure the new min and max are within a reasonable range
	min = /*niceNumber(min, false)*/0;
	max = niceNumber(max, true);

	// Calculate step size based on range and available height
	const step = calculatestep(min, max, chartHeight);

	while (max - step > m) max -= step;

	return {
		min,
		max,
		step 
	};
}

// Calculate the step size dynamically based on the available range and chart height
function calculatestep(min, max, chartHeight) {
	const range = max - min;

	// List of nice step sizes
	const niceSteps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000, 2000000, 5000000, 10000000];

	// Calculate the number of steps based on available height and the range
	const numberOfSteps = Math.floor(chartHeight / 40);  // Assume 50px per step, adjust as needed

	// Calculate the initial step size by dividing the range by the number of steps
	let step = range / numberOfSteps;

	// If step is 0, ensure that it gets a reasonable value
	if (step === 0) {
		step = niceSteps[0];
	}

	// Find the closest nice step size that fits the calculated step size
	for (let i = 0; i < niceSteps.length; i++) {
		if (step <= niceSteps[i]) {
			step = niceSteps[i];
			break;
		}
	}

	return Math.round(step);
}

// Find the "nice" number for min/max
function niceNumber(value, roundUp) {
	if (value === 0) return 0;  // Handle the case where the value is 0

	const exp = Math.floor(Math.log10(Math.abs(value)));  // Exponent for the logarithm of the absolute value
	const base = value / Math.pow(10, exp);  // Normalize the value to its base (between 1 and 10)
	
	// Define a list of "nice" base numbers
	const niceBaseNumbers = [1, 2, 5, 10]; 
	
	let niceBase;

	// Round to the nearest "nice base number" smaller or equal to the value (round down)
	for (let i = 0; i < niceBaseNumbers.length; i++) {
		if (base <= niceBaseNumbers[i]) {
			niceBase = niceBaseNumbers[i];
			break;
		}
	}

	// If we want to round up, we select the next nice base
	if (roundUp) {
		niceBase = niceBaseNumbers.filter(number => number > base)[0] || niceBaseNumbers[niceBaseNumbers.length - 1];
	}

	// Re-adjust by the magnitude and return the "nice" number
	return niceBase * Math.pow(10, exp);
}

