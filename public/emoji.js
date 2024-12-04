
import { Text } from "./text.js";

export class Emoji extends Text {

	get type() { return 'emoji'; }

	constructor(value) {
		super();

		this.value = value;
		this.font = 'emoji';
	}
}