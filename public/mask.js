import { fitCurve } from "./fit-curve.js";

export function createMaskPath(mask) {
	const { width, height, data } = mask;
	const edgePoints = [];

	// Step 1: Detect edge points by finding boundary pixels
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const i = (y * width + x) * 4;
			const alpha = data[i + 3];

			if (alpha > 0) {
				// Check if the current pixel has any neighboring transparent pixel (indicating an edge)
				if (
					data[((y - 1) * width + x) * 4 + 3] === 0 ||
					data[((y + 1) * width + x) * 4 + 3] === 0 ||
					data[(y * width + (x - 1)) * 4 + 3] === 0 ||
					data[(y * width + (x + 1)) * 4 + 3] === 0
				) {
					edgePoints.push([x, y]);
				}
			}
		}
	}

	// Step 2: Sort the edge points to create a continuous path
	function sortEdgePoints(points) {
		if (points.length === 0) return [];

		const sorted = [points.shift()];

		while (points.length > 0) {
			const lastPoint = sorted[sorted.length - 1];
			let closestIndex = 0;
			let closestDistance = Infinity;

			for (let i = 0; i < points.length; i++) {
				const [x1, y1] = lastPoint;
				const [x2, y2] = points[i];
				const distance = Math.hypot(x2 - x1, y2 - y1);

				if (distance < closestDistance) {
					closestDistance = distance;
					closestIndex = i;
				}
			}

			sorted.push(points.splice(closestIndex, 1)[0]);
		}

		return sorted;
	}

	const sortedPoints = sortEdgePoints(edgePoints);

	// Step 3: Smooth the points using Chaikin's Algorithm
	function smoothPoints(points, iterations = 2) {
		let smoothed = points;

		for (let it = 0; it < iterations; it++) {
			const newPoints = [];
			for (let i = 0; i < smoothed.length - 1; i++) {
				const p0 = smoothed[i];
				const p1 = smoothed[i + 1];

				const q = [(3 * p0[0] + p1[0]) / 4, (3 * p0[1] + p1[1]) / 4];
				const r = [(p0[0] + 3 * p1[0]) / 4, (p0[1] + 3 * p1[1]) / 4];

				newPoints.push(q);
				newPoints.push(r);
			}
			newPoints.push(smoothed[smoothed.length - 1]); // Add the last point
			smoothed = newPoints;
		}

		return smoothed;
	}

	if (true) {

		const curve = fitCurve(sortedPoints, 50);
		// console.log(curve);
		const smoothedPoints = [curve[0][0]];
		for (const i of curve)
			smoothedPoints.push(...i.slice(1));

		return smoothedPoints;
	}

	const smoothedPoints = smoothAndReducePoints(sortedPoints, 100);

	// console.debug(smoothedPoints);

	return smoothedPoints;
}

function reducePoints(points, targetCount) {
	if (points.length <= targetCount) {
		return points; // No need to reduce if there are fewer points than the target
	}

	// Step 1: Calculate cumulative distances along the path
	const distances = [0]; // First point has distance 0
	for (let i = 1; i < points.length; i++) {
		const [x1, y1] = points[i - 1];
		const [x2, y2] = points[i];
		const distance = Math.hypot(x2 - x1, y2 - y1);
		distances.push(distances[i - 1] + distance);
	}

	const totalLength = distances[distances.length - 1];

	// Step 2: Calculate the interval length for resampling
	const interval = totalLength / (targetCount - 1);

	// Step 3: Resample points at regular intervals
	const resampledPoints = [points[0]]; // Start with the first point
	let currentDistance = interval;

	for (let i = 1; i < distances.length; i++) {
		while (currentDistance <= distances[i]) {
			// Linear interpolation between points[i - 1] and points[i]
			const t = (currentDistance - distances[i - 1]) / (distances[i] - distances[i - 1]);
			const [x1, y1] = points[i - 1];
			const [x2, y2] = points[i];
			const interpolatedPoint = [
				x1 + t * (x2 - x1),
				y1 + t * (y2 - y1)
			];

			resampledPoints.push(interpolatedPoint);
			currentDistance += interval;
		}
	}

	// Ensure the last point is included
	resampledPoints.push(points[points.length - 1]);

	return resampledPoints;
}

function smoothAndReducePoints(points, targetCount) {
	if (points.length < 3) {
		return points; // Not enough points to smooth
	}

	// Step 1: Smooth the points using a simple Catmull-Rom spline
	function catmullRomSpline(points, numSegments = 10, tension=0.5) {
		const smoothedPoints = [];
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[Math.max(i - 1, 0)];
			const p1 = points[i];
			const p2 = points[i + 1];
			const p3 = points[Math.min(i + 2, points.length - 1)];

			for (let t = 0; t <= 1; t += 1 / numSegments) {
				const t2 = t * t;
				const t3 = t2 * t;

				const x = 0.5 * (
					(2 * p1[0]) +
					(-p0[0] + p2[0]) * t +
					(2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
					(-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
				);

				const y = 0.5 * (
					(2 * p1[1]) +
					(-p0[1] + p2[1]) * t +
					(2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
					(-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
				);

				smoothedPoints.push([x, y]);
			}
		}
		smoothedPoints.push(points[points.length - 1]); // Add the last point
		return smoothedPoints;
	}

	// Step 2: Reduce the points by resampling to the target count
	function resamplePoints(points, targetCount) {
		const distances = [0];
		for (let i = 1; i < points.length; i++) {
			const [x1, y1] = points[i - 1];
			const [x2, y2] = points[i];
			distances.push(distances[i - 1] + Math.hypot(x2 - x1, y2 - y1));
		}

		const totalLength = distances[distances.length - 1];
		const interval = totalLength / (targetCount - 1);

		const resampledPoints = [points[0]];
		let currentDistance = interval;

		for (let i = 1; i < distances.length; i++) {
			while (currentDistance <= distances[i]) {
				const t = (currentDistance - distances[i - 1]) / (distances[i] - distances[i - 1]);
				const [x1, y1] = points[i - 1];
				const [x2, y2] = points[i];
				resampledPoints.push([
					x1 + t * (x2 - x1),
					y1 + t * (y2 - y1)
				]);
				currentDistance += interval;
			}
		}

		resampledPoints.push(points[points.length - 1]);
		return resampledPoints;
	}

	// Step 3: Remove collinear points
	function removeCollinearPoints(points) {
		if (points.length <= 2) {
			return points;
		}

		const reducedPoints = [points[0]];

		for (let i = 1; i < points.length - 1; i++) {
			const [x1, y1] = reducedPoints[reducedPoints.length - 1];
			const [x2, y2] = points[i];
			const [x3, y3] = points[i + 1];

			if ((x2 - x1) * (y3 - y1) !== (y2 - y1) * (x3 - x1)) {
				reducedPoints.push(points[i]);
			}
		}

		reducedPoints.push(points[points.length - 1]);
		return reducedPoints;
	}

	// Perform smoothing, resampling, and reduction
	const smoothedPoints = catmullRomSpline(points);
	const resampledPoints = resamplePoints(smoothedPoints, targetCount);
	// const resampledPoints = smoothedPoints;

	return resampledPoints;
}

function resamplePoints2(allPoints, numPoints = 100) {

	

	// let allPoints = [];
	// for (const segment of segments) {
	// 	allPoints = allPoints.concat(sampleBezier(segment));
	// }

	const simplifiedPoints = simplifyPoints(allPoints, 2.0); // Adjust epsilon as needed
	const simplifiedBezierSegments = fitBezierCurves(simplifiedPoints, 5.0); // Adjust maxError as needed

	const path = simplifiedBezierSegments.map(i => i.slice(1).flat());
	path.unshift(simplifiedBezierSegments[0][0]);

	return path;

	function sampleBezier(bezier, numPoints = 10) {
		const points = [];
		for (let i = 0; i <= numPoints; i++) {
			const t = i / numPoints;
			points.push(bezierPoint(bezier, t));
		}

		return points;
	}

	function bezierPoint(bezier, t) {
		const [p0, p1, p2, p3] = bezier;
		const u = 1 - t;
		return [
			u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
			u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
		];
	}

	function simplifyPoints(points, epsilon) {
		if (points.length <= 2) return points;
	
		let maxDistance = 0;
		let index = 0;
	
		for (let i = 1; i < points.length - 1; i++) {
			const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
			if (distance > maxDistance) {
				maxDistance = distance;
				index = i;
			}
		}
	
		if (maxDistance > epsilon) {
			const left = simplifyPoints(points.slice(0, index + 1), epsilon);
			const right = simplifyPoints(points.slice(index), epsilon);
			return left.slice(0, -1).concat(right);
		} else {
			return [points[0], points[points.length - 1]];
		}
	}
	
	function perpendicularDistance(point, lineStart, lineEnd) {
		const numerator = Math.abs(
			(lineEnd[1] - lineStart[1]) * point[0] -
			(lineEnd[0] - lineStart[0]) * point[1] +
			lineEnd[0] * lineStart[1] -
			lineEnd[1] * lineStart[0]
		);
		const denominator = Math.sqrt(
			Math.pow(lineEnd[1] - lineStart[1], 2) + Math.pow(lineEnd[0] - lineStart[0], 2)
		);
		return numerator / denominator;
	}
	
	function fitBezierCurves(points, maxError) {
		const curves = [];
		let left = 0;
	
		while (left < points.length - 1) {
			let right = points.length - 1;
			let bezier = fitSingleBezier(points.slice(left, right + 1));
	
			while (calculateError(points.slice(left, right + 1), bezier) > maxError) {
				right--;
				bezier = fitSingleBezier(points.slice(left, right + 1));
			}
	
			curves.push(bezier);
			left = right;
		}
	
		return curves;
	}
	
	function fitSingleBezier(points) {
		// Fit a single Bézier curve to the points
		// This is a simplified implementation; consider using a library for better results
		const p0 = points[0];
		const p3 = points[points.length - 1];
		const p1 = [ (p0[0] + p3[0]) / 2, (p0[1] + p3[1]) / 2 ]; // Placeholder for control points
		const p2 = [ (p0[0] + p3[0]) / 2, (p0[1] + p3[1]) / 2 ]; // Placeholder for control points
		return [p0, p1, p2, p3];
	}
	
	function calculateError(points, bezier) {
		let error = 0;
		for (const point of points) {
			const t = findClosestT(bezier, point);
			const curvePoint = bezierPoint(bezier, t);
			error += Math.pow(point[0] - curvePoint[0], 2) + Math.pow(point[1] - curvePoint[1], 2);
		}
		return Math.sqrt(error);


	}

	function findClosestT(bezier, point, tolerance = 0.0001) {
		let t = 0.5; // Start with the midpoint
		let step = 0.25; // Initial step size
	
		// Perform a binary search to find the closest t
		for (let i = 0; i < 100; i++) { // Limit iterations to avoid infinite loops
			const distance1 = distanceSquared(point, bezierPoint(bezier, t - step));
			const distance2 = distanceSquared(point, bezierPoint(bezier, t));
			const distance3 = distanceSquared(point, bezierPoint(bezier, t + step));
	
			if (distance1 < distance2) {
				t -= step;
			} else if (distance3 < distance2) {
				t += step;
			} else {
				step /= 2; // Reduce step size for finer precision
			}
	
			if (step < tolerance) break; // Stop when the step size is small enough
		}
	
		return t;
	}

	function distanceSquared(p1, p2) {
		return Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2);
	}
}