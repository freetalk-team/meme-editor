Object.clone = function(o) {
	var newObj = (o instanceof Array) ? [] : {};
	for (let i in o) {
		if (o[i] && typeof o[i] == "object") {

			newObj[i] = ArrayBuffer.isView(o[i]) 
				? new o[i].constructor(o[i]) 
				: Object.clone(o[i]);

			
		} else { 
			newObj[i] = o[i]
		}

	} 
	
	return newObj;
}

Object.getGetters = function(i) {

	let getters = {};
	let proto = Object.getPrototypeOf(i);

	while (proto && proto !== Object.prototype) {
		const descriptors = Object.getOwnPropertyDescriptors(proto);

		for (const [key, descriptor] of Object.entries(descriptors)) {
			if (typeof descriptor.get === 'function' && !(key in getters)) {
				getters[key] = descriptor.get; // Store the getter function
			}
		}
		
		proto = Object.getPrototypeOf(proto); // Move up the prototype chain
	}

	return getters;
}

Object.getSetters = function(i) {

	let setters = {};
	let proto = Object.getPrototypeOf(i);

	while (proto && proto !== Object.prototype) {
		const descriptors = Object.getOwnPropertyDescriptors(proto);

		for (const [key, descriptor] of Object.entries(descriptors)) {
			if (typeof descriptor.set === 'function' && !(key in setters)) {
				setters[key] = descriptor.set; // Store the getter function
			}
		}
		
		proto = Object.getPrototypeOf(proto); // Move up the prototype chain
	}

	return setters;
}

Object.getGetter = function(i, name) {
	const setters = Object.getGetters(i);
	return setters[name];
}

Object.getSetter = function(i, name) {
	const setters = Object.getSetters(i);
	return setters[name];
}

Object.fromInstance = function(i, o={}, ...ignore) {

	const getters = Object.getGetters(i);

	for (const [name, get] of Object.entries(getters)) {
		if (ignore.includes(name))
			continue;

		o[name] = get.call(i);
	}
		
	return o;
}

Object.instanceFrom = function(i, o) {

	const setters = Object.getSetters(i);

	for (const [name, set] of Object.entries(setters))
		if (name in o)
			set.call(i, o[name]);

	return i;
}


Array.repeat = function(n, v=0) {
	return new Array(n).fill(0);
}

String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}