
import { Text } from "./text.js";

export class Icon extends Text {

	get type() { return 'icon'; }

	constructor(value) {
		super();

		this.value = value;
		this.font = 'FontAwesome';
		this.size = 70;
	}

	calculateBorderSize() {
		this.width = this.size;
		this.height = this.size;
	}
}
