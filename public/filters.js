class Filter {

	#img;
	#bitmap;

	constructor(img) {
		this.#img = img;;
	}

	get name() { return 'none'; }

	glfx() { return this.#img.glfx(); }
	image() { return this.#img.image(); }

	getBitmap() { return this.#bitmap; }
	setBitmap(v=this.apply()) {
		this.release();
		this.#bitmap = v; 
	}

	release() {
		if (this.#bitmap) {
			this.#bitmap.close();
			this.#bitmap = null;
		}
	}

	apply() {}

}

class RadiusFilter extends Filter {

	#radius = 5;

	get radius() { return this.#radius; }

	set radius(n) {
		this.#radius = n;
		if (n > 0) 
		 	this.setBitmap();
	}

}

class AmountFilter extends Filter {

	#amount = 0.5;

	get amount() { return this.#amount; }

	set amount(n) {
		this.#amount = n;

		if (n > 0) 
		 	this.setBitmap();

	}
}

class RadiusPosFilter extends RadiusFilter {

	#x;
	#y;

	get x() { return this.#x; }
	get y() { return this.#y; }

	constructor(img) {
		super(img);

		this.#x = img.width / 2;
		this.#y = img.height / 2;
	}

	apply() {}
}

export class StrengthFilter extends Filter {

	#strength = 0.3;

	get name() { return 'zoomBlur'; }
	get strength() { return this.#strength; }

	set strength(n) {
		this.#strength = n;

		if (n > 0) 
		 	this.setBitmap();

	}
}

class RadiusStrengthFilter extends RadiusFilter {

	#strength = 0.3;

	get strength() { return this.#strength; }

	set strength(n) {
		this.#strength = n;

		if (n > 0) 
		 	this.setBitmap();
	}
}

export class TriangleBlur extends RadiusFilter {

	get name() { return 'triangleBlur'; }

	apply() {
		return this.glfx().triangleBlur(this.image(), this.radius);
	}
}

export class LensBlur extends RadiusFilter {

	#brightness = 0.75;
	#angle = 0;

	get name() { return 'lensBlur'; }
	get brightness() { return this.#brightness; }
	get angle() { return this.#angle; }

	set brightness(n) {
		this.#brightness = n;

		if (n > 0) 
			this.setBitmap();
	}

	set angle(n) {
		this.#angle = n;

		if (n > 0) 
			this.setBitmap();
	}

	apply() {
		return this.glfx().lensBlur(this.image(), this.radius, this.#brightness, this.#angle)
	}
}

export class ZoomBlur extends StrengthFilter {

	get name() { return 'zoomBlur'; }

	apply() {
		return this.glfx().zoomBlur(this.image(), this.strength);
	}
}

export class Ink extends StrengthFilter {

	get name() { return 'ink'; }

	apply() {
		return this.glfx().ink(this.image(), this.strength)
	}
}

export class BrightnessContrast extends Filter {

	#brightness = 0;
	#contrast = 0;

	get name() { return 'contrast'; }
	get brightness() { return this.#brightness; }
	get contrast() { return this.#contrast; }


	set brightness(n) {
		if (n > 0) 
		 	this.setBitmap(this.glfx().brightnessContrast(this.image(), n, this.#contrast));

		this.#brightness = n;
	}

	set contrast(n) {
		if (n > 0) 
		 	this.setBitmap(this.glfx().brightnessContrast(this.image(), this.#brightness, n));

		this.#contrast = n;
	}
}

export class HueSaturation extends Filter {

	#hue = 0;
	#saturation = 0;

	get name() { return 'hueSaturation'; }
	get brightness() { return this.#hue; }
	get contrast() { return this.#saturation; }


	set hue(n) {
		if (n > 0) 
		 	this.setBitmap(this.glfx().hueSaturation(this.image(), n, this.#saturation));

		this.#hue = n;
	}

	set saturation(n) {
		if (n > 0) 
		 	this.setBitmap(this.glfx().hueSaturation(this.image(), this.#hue, n));

		this.#saturation = n;
	}
}

export class Swirl extends RadiusPosFilter {

	#angle = 0;

	get name() { return 'swirl'; }
	get angle() { return this.#angle; }

	set angle(n) {
		this.#angle = n;

		if (n > 0) 
		 	this.setBitmap();
	}

	apply() {
		return this.glfx().swirl(this.image(), this.radius, this.#angle, this.x, this.y)
	}
}

export class BulgePinch extends RadiusPosFilter {

	#strength = 0.25;

	get name() { return 'bulgePinch'; }
	get strength() { return this.#strength; }

	set strength(n) {
		this.#strength = n;

		if (n > 0) 
		 	this.setBitmap();
	}

	apply() {
		return this.glfx().bulgePinch(this.image(), this.radius, this.#strength, this.x, this.y);
	}
	
}

export class Denoise extends Filter {

	#exponent = 20;

	get name() { return 'denoise'; }
	get exponent() { return this.#exponent; }

	set exponent(n) {
		this.#exponent = n;

		this.setBitmap(this.glfx().denoise(this.image(), this.#exponent));
	}
}

export class UnsharpMask extends RadiusStrengthFilter {
	get name() { return 'unsharpMask'; }

	apply() {
		return this.glfx().unsharpMask(this.image(), this.radius, this.strength);
	}
}

export class Noise extends AmountFilter {
	get name() { return 'noise'; }

	apply() {
		return this.glfx().noise(this.image(), this.amount);
	}
}

export class Sepia extends AmountFilter {
	get name() { return 'sepia'; }

	apply() {
		return this.glfx().sepia(this.image(), this.amount);
	}
}

export class Vignette extends AmountFilter {

	#size = 0.5;

	get name() { return 'vignette'; }
	get size() { return this.#size; }

	set size(n) {
		this.#size = n;
		this.setBitmap();
	}

	apply() {
		return this.glfx().vignette(this.image(), this.#size, this.amount);
	}
}

export class Vibrance extends AmountFilter {
	get name() { return 'vibrance'; }

	apply() {
		return this.glfx().vibrance(this.image(), this.amount);
	}
}