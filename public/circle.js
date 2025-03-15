
import { Base } from './object.js';


export class Circle extends Base {

	get type() { return 'circle'; }

	draw(ctx) {
		this.drawEllipse(ctx);
	}
	
	getPath(x=this.x, y=this.y, sx=1, sy=1) {

		const w = (this.width / 2) * sx
			, h = (this.height / 2) * sy;

		// Calculate the center and radii
		const centerX = x; // Center x-coordinate
		const centerY = y; // Center y-coordinate
		const radiusX = w; // Horizontal radius
		const radiusY = h; // Vertical radius

		const p = new Path2D;
		p.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);

		return p;
	}
}