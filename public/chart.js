
import { Base } from "./base.js";

const Colors = {
	red: '#f44336',
	blue: '#2196F3',
	green: '#4CAF50',
	orange: '#ff9800',
	teal: '#009688'
};

const colors = Object.values(Colors);
const M = 20;

export class Chart extends Base {

	#size = 16;
	#font = 'Arial';
	#type = 'bar'; // pie, scatter, line, spline
	#labels = [];
	#datasets;
	#numericalData;
	#scale = { min: 0, max: 100, step: 10 };

	get type() { return 'chart'; }

	set data(v) {
		let numericalData;
		
	}

	get height() { return super.height; }
	set height(n) {
		super.height = n;

		if (this.#numericalData)
			this.#scale = calculateYAxisScale(this.#numericalData, super.height);
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


	draw(ctx) {

		ctx.save();

		let { x, y } = this.setGeometry(ctx);

		let width = this.width - M
			, height = this.height - M
			, m = this.strokeWidth / 2;


		this.#drawAxis(ctx, x + M, y, width, height);

		if (this.#labels.length > 0) {

			const top = this.#datasets[0].label ? 20 : 0;

			this.#drawLabels(ctx, x, y, M);

			x += M + m;
			// y += top;
			width -= m;
			// height -= m + top;
			height -= m;

			switch (this.#type) {

				case 'bar':
				this.#drawBarChart(ctx, x, y, width, height);
				break;

				case 'line':
				this.#drawLineChart(ctx, x, y, width, height);
				break;
			}

		} 

		ctx.restore();
	}

	drawSVG(svg, canvas) {


		const x = this.x - canvas.x
			, y = this.y - canvas.y
			, width = this.width
			, height = this.height
			, size = this.size || 16
			, stroke = { color: this.stroke, width: this.strokeWidth }
			, box = this.box()
			, count = Math.ceil(this.#scale.max / this.#scale.step)
			, d = 5 + this.strokeWidth / 2
			;
			;

		let X = x + M, Y = y, w = width - M, h = height - M
			, my = size + 8;

		const fill = { };
		const text = { font: this.font, size };

		svg.group(box);

		box.angle = 0;

		// legend
		const legend = this.#datasets.filter(i => !!i.label);
		if (legend.length > 0) {
			const total = legend.map(i => i.width).sum();
			const box = { x: X + (width > total ? (width - total) / 2 : 0)
				, y: Y - my, width: 20, height: my - 8 };

			for (let i = 0; i < legend.length; ++i) {

				fill.color = colors[i % colors.length];

				box.y += 4;
				svg.rect(box, 0, fill, stroke);

				box.x += 25;
				box.y -= 4;

				text.value = legend[i].label;

				svg.text(box, text, fill);

				box.x += legend[i].width + 5;
			}
		}

		

		Y += h;

		text.align = 'right';
		text.baseline = 'middle';
		text.size = size - 2;
		box.x = x;


		let dy = h / count;

		for (let i = 0, l = 0; i < count + 1; ++i, Y -= dy, l += this.#scale.step) {

			stroke.alpha = 0.5;

			if (i > 0)
				svg.line(X - d , Y, X + w, Y, stroke);

			box.y = Y;
			text.value = l.toString();
			stroke.alpha = 1;

			svg.text(box, text, stroke);
		}

		delete text.baseline;
		text.size = size;

		if (this.#labels.length > 0) {

			const dx = w / this.#labels.length;

			box.x = X + dx / 2;
			box.y = y + h + d + 5;

			text.align = 'middle';

			for (let i = 0; i < this.#labels.length; ++i, box.x += dx) {

				text.value = this.#labels[i];

				svg.line(box.x, box.y - 5, box.x, box.y - d - 5, stroke);
				svg.text(box, text, stroke);
			}

			

		}

		const n = this.#datasets[0].data.length
			, dx = w / n
			, m = w*0.02
			, dw = (dx - m) / this.#datasets.length;

		Y = y;

		box.x = X + m/2 + 2;
		box.width = dw - 4;

		let r;

		fill.alpha = this.alpha;

		for (let i = 0; i < n; ++i) {
			for (let j = 0; j < this.#datasets.length; ++j) {

				stroke.color = fill.color = colors[j % colors.length];
				r = (this.#scale.max - this.#datasets[j].data[i]) / this.#scale.max;
				dy = h * r;

				box.y = Y + dy;
				box.height = h - dy;
				
				svg.rect(box, 0, fill, stroke);


				box.x += dw;
			}

			box.x += m;
		}

		delete stroke.alpha;

		stroke.color = this.stroke;
		stroke.width = this.strokeWidth;

		// axis
		svg.line(X, Y, X, Y + h, stroke);
		svg.line(X, Y + h, X + w, Y + h, stroke);

		svg.groupEnd();

	}

	setData(data) {
		[this.#type, this.#labels, this.#datasets, this.#numericalData] = processData(data);

		this.#scale = calculateYAxisScale(this.#numericalData, super.height);
		//this.#data = data;
	}

	#drawBarChart(ctx, x, y, width, height) {

		

		const n = this.#datasets[0].data.length
			, dx = width / n
			, m = width*0.02
			, dw = (dx - m) / this.#datasets.length;

		x += m/2;

		let dy, r, c;

		ctx.save();

		for (let i = 0; i < n; ++i) {
			for (let j = 0; j < this.#datasets.length; ++j) {

				c = colors[j % colors.length];
				r = (this.#scale.max - this.#datasets[j].data[i]) / this.#scale.max;
				dy = height * r;


				ctx.strokeStyle = c;
				ctx.fillStyle = c + this.alphaHex();
				ctx.fillRect(x, y + dy, dw, height - dy);
				ctx.strokeRect(x, y + dy, dw, height - dy);

				x += dw;
			}

			x += m;
		}

		ctx.restore();
	}

	#drawLineChart(ctx, x, y, width, height) {
		const n = this.#datasets[0].data.length 
			, dx = width / n
			;

		console.debug('Draw line chart:', width, dx);

		x += dx / 2;

		ctx.save();

		for (let i = 0, X, Y, c, data, r; i < this.#datasets.length; ++i) {

			data = this.#datasets[i].data;

			X = x;
			Y = data.map(i => {
				r = (this.#scale.max - i) / this.#scale.max;
				return  height * r;
			});

			c = colors[i % colors.length];
			ctx.strokeStyle = c;

			ctx.beginPath();
			ctx.moveTo(X, y + Y[0]);

			X += dx;

			for (let j = 1; j < data.length; ++j, X += dx) 
				ctx.lineTo(X, y + Y[j]);

			ctx.stroke();

			X = x;
			for (let j = 0; j < data.length; ++j, X += dx) 
				Chart.drawNode(ctx, X, y + Y[j], c, true);
		}

		ctx.restore();
	}

	#drawAxis(ctx, x, y, width, height) {

		let X = x, Y = y;

		const count = Math.ceil(this.#scale.max / this.#scale.step)
			, dy = height / count
			, d = 5 + this.strokeWidth / 2
			;

		ctx.save();

		ctx.lineWidth = this.strokeWidth;
		ctx.strokeStyle = this.stroke + this.alphaHex();
		ctx.lineCap = 'round'; // Smooth rounded ends
		ctx.lineJoin = 'round'; // Smooth joints

		ctx.beginPath();
		ctx.moveTo(X, Y);

		Y += height;
		ctx.lineTo(X, Y);
		ctx.lineTo(X + width, Y);

		ctx.stroke();

		ctx.lineWidth = 1;
		ctx.strokeStyle = this.stroke + '55';

		for (let i = 0; i < count + 1; ++i, Y -= dy) {
			ctx.moveTo(X - d , Y);
			ctx.lineTo(X + width, Y);
		}

		if (this.#labels.length > 0) {

			const dx = width / this.#labels.length;

			X += dx / 2;
			Y = y + height;


			for (let i = 0; i < this.#labels.length; ++i, X += dx) {
				ctx.moveTo(X, Y + d);
				ctx.lineTo(X, Y);
			}

		}

		ctx.stroke();
		
		ctx.restore();

	}

	#drawLabels(ctx, x, y, m) {

		let width = this.width - m 
			, height = this.height - m
			, X = x
			, Y = y + this.height - m
			, count = Math.ceil(this.#scale.max / this.#scale.step)
			, dy = height / count
			;

		ctx.save();

		ctx.font = `${this.#size - 2}px ${this.#font}`;
		ctx.fillStyle = this.stroke;
		ctx.textBaseline = 'top';

		const legend = this.#datasets.filter(i => !!i.label).map(i => {
			i.width = ctx.measureText(i.label).width + 30;
			return i;
		});

		if (legend.length > 0) {

			ctx.save();

			const total = legend.map(i => i.width).sum();

			const dx = width / legend.length;

			let x = X + (width > total ? (width - total) / 2 : 0);

			for (let i = 0; i < legend.length; ++i) {

				ctx.fillStyle = colors[i % colors.length];
				ctx.fillRect(x, y - this.#size, 20, this.#size - 4);

				x += 25;
				ctx.fillText(legend[i].label, x, y - this.#size);

				x += legend[i].width + 5;
			}

			ctx.restore();

		}
		

		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';
		// ctx.font = '16px "Calibri,Optima,Candara,Verdana,Geneva,sans-serif"';

		for (let i = 0, l = 0; i < count + 1; ++i, Y -= dy, l+= this.#scale.step)
			ctx.fillText(l.toString(), X, Y);

		if (this.#labels.length > 0) {

			const dx = width / this.#labels.length;

			console.debug('Draw labels:', width, dx);

			X = x + m + dx / 2;
			Y = y + this.height;

			// ctx.textBaseline = 'top';
			ctx.textAlign = 'center';
			ctx.font = `${this.#size}px ${this.#font}`;

			for (let i = 0; i < this.#labels.length; ++i, X += dx) 
				ctx.fillText(this.#labels[i].toString(), X, Y);

		}

		ctx.restore();
	}

	

}

// Process Data (Same as before)
function processData(data) {
	// Remove empty rows
	let filteredData = data.filter(row => row.some(cell => cell.trim() !== ""));
	
	if (filteredData.length < 2) {
		alert("Not enough data to visualize.");
		return;
	}

	let headerDetected = isHeader(filteredData);
	const columns = headerDetected ? filteredData[0] : Array.from({ length: filteredData[0].length }, (_, i) => `Column ${i + 1}`);
	const body = headerDetected ? filteredData.slice(1) : filteredData;

	let inferredTypes = inferDataTypes(body, columns);
	return visualizeData(body, columns, inferredTypes);
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

// Visualization (Same as before)
function visualizeData(data, columns, inferredTypes) {
	const firstColumn = columns[0];
	const labelColumn = inferredTypes[firstColumn] === 'categorical' ||  inferredTypes[firstColumn] === 'datetime' ? firstColumn : null;
	const numericalColumns = columns.filter(col => inferredTypes[col] === 'numerical');
	const numericalData = data.map(row => numericalColumns.map(col => parseFloat(row[columns.indexOf(col)]) || 0));
	//const scale = calculateYAxisScale(numericalData);

	console.debug('Data:', data);
	console.debug('Label:', labelColumn);
	console.debug('Num:', numericalColumns);

	let datasets, type, labels;

	if (numericalColumns.length > 0) {

		datasets = numericalColumns.map(col => ({
				label: col,
				data: data.map(row => parseFloat(row[columns.indexOf(col)]) || 0),
			}));

		if (labelColumn) {
			type = 'bar';
			labels = data.map(row => row[columns.indexOf(labelColumn)]);

			if (inferredTypes[labelColumn] == 'datetime') {
				type = 'line';

				labels = labels.map(i => new Date(i).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', day: 'numeric' }));
			}
		}
		else {
			type = 'line';
			labels = data.map((_, i) => i + 1);
		}


	}

	return [ type, labels, datasets, numericalData ];

	// if (numericalColumns.length > 0) {
	// 	const ctx = document.getElementById('myChart').getContext('2d');

	// 	const datasets = numericalColumns.map(col => ({
	// 		label: col,
	// 		data: data.map(row => parseFloat(row[columns.indexOf(col)]) || 0),
	// 		borderWidth: 2
	// 	}));

	// 	new Chart(ctx, {
	// 		type: labelColumn ? 'bar' : 'line',
	// 		data: {
	// 			labels: labelColumn ? data.map(row => row[columns.indexOf(labelColumn)]) : data.map((_, i) => i + 1),
	// 			datasets: datasets
	// 		},
	// 		options: { scales: { y: { beginAtZero: true } } }
	// 	});
	// } else {
	// 	alert("No numerical columns detected for visualization.");
	// }
}

// Dynamic Y-Axis Scale Calculation with Nice Scaling and Height Adjustment
// function calculateYAxisScale(data, chartHeight, margin = 0.1) {
//     const flattenedData = data.flat();

//     if (flattenedData.length === 0) return { min: 0, max: 100, step: 10 };

//     let min = Math.min(...flattenedData);
//     let max = Math.max(...flattenedData);

//     // Check if the range is zero (all values are identical)
//     if (min === max) {
//         // If all values are the same, expand the range slightly to avoid division by zero
//         max += 1;  // Add a small value to max
//         min -= 1;  // Subtract a small value from min
//     }

//     // Expand the range by a percentage (margin) for padding
//     const range = max - min;
//     min -= margin * range;  // Extend min by margin
//     max += margin * range;  // Extend max by margin

//     // Ensure the new min and max are within a reasonable range
//     min = niceNumber(min, false);
//     max = niceNumber(max, true);

//     // Calculate step size based on range and available height
//     const step = calculatestep(min, max, chartHeight);

//     return {
//         min: min,
//         max: max,
//         step: step
//     };
// }

// // Calculate the step size dynamically based on the available range and chart height
// function calculatestep(min, max, chartHeight) {
//     const range = max - min;

//     // List of nice step sizes
//     const niceSteps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

//     // Calculate the number of steps based on available height and the range
//     const numberOfSteps = Math.floor(chartHeight / 50);  // Assume 50px per step, adjust as needed

//     // Calculate the initial step size by dividing the range by the number of steps
//     let step = range / numberOfSteps;

//     // If step is 0, ensure that it gets a reasonable value
//     if (step === 0) {
//         step = niceSteps[0];
//     }

//     // Find the closest nice step size that fits the calculated step size
//     for (let i = 0; i < niceSteps.length; i++) {
//         if (step <= niceSteps[i]) {
//             step = niceSteps[i];
//             break;
//         }
//     }

//     return step;
// }

// // Find the "nice" number for min/max
// function niceNumber(value, roundUp) {
//     if (value === 0) return 0;  // Handle the case where the value is 0

//     const exp = Math.floor(Math.log10(Math.abs(value)));  // Exponent for the logarithm of the absolute value
//     const base = value / Math.pow(10, exp);  // Normalize the value to its base (between 1 and 10)
    
//     // Define a list of "nice" base numbers
//     const niceBaseNumbers = [1, 2, 5, 10]; 
    
//     let niceBase;

//     // Round to the nearest "nice base number" smaller or equal to the value (round down)
//     for (let i = 0; i < niceBaseNumbers.length; i++) {
//         if (base <= niceBaseNumbers[i]) {
//             niceBase = niceBaseNumbers[i];
//             break;
//         }
//     }

//     // If we want to round up, we select the next nice base
//     if (roundUp) {
//         niceBase = niceBaseNumbers.filter(number => number > base)[0] || niceBaseNumbers[niceBaseNumbers.length - 1];
//     }

//     // Re-adjust by the magnitude and return the "nice" number
//     return niceBase * Math.pow(10, exp);
// }


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

