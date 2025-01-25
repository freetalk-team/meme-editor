Object.isClass = function(obj) {
	// Check if obj has a constructor and prototype
	return obj && typeof obj === 'object' && obj.constructor !== Object;
}

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

Object.getProperties = function(i) {

	let setters = {};
	let getters = {};
	let proto = Object.getPrototypeOf(i);

	while (proto && proto !== Object.prototype) {
		const descriptors = Object.getOwnPropertyDescriptors(proto);

		for (const [key, descriptor] of Object.entries(descriptors)) {
			if (typeof descriptor.get === 'function' && !(key in getters)) {
				getters[key] = descriptor.get; // Store the getter function
			}

			if (typeof descriptor.set === 'function' && !(key in setters)) {
				setters[key] = descriptor.set; // Store the getter function
			}
		}
		
		proto = Object.getPrototypeOf(proto); // Move up the prototype chain
	}

	return { setters, getters };
}

Object.getGetter = function(i, name) {
	const setters = Object.getGetters(i);
	return setters[name];
}

Object.getSetter = function(i, name) {
	const setters = Object.getSetters(i);
	return setters[name];
}

Object.getProperty = function(i, name) {
	const { setters, getters } = Object.getProperties(i);
	return { setter: setters[name], getter: getters[name] };
}

Object.fromInstance = function(i, o={}, ...ignore) {

	const getters = Object.getGetters(i);

	let v, a;

	for (const [name, get] of Object.entries(getters)) {
		if (ignore.includes(name))
			continue;

		v = get.call(i);

		if (Array.isArray(v)) 
			v = v.map(i => Object.isClass(i) ? Object.fromInstance(i) : i);
		else if (Object.isClass(v)) 
			v = Object.fromInstance(v);

		o[name] = v;
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


Object.hashHex = function(o) {
	return Object.hash(o).toString(16);
}

Array.repeat = function(n, v=0) {
	return new Array(n).fill(0);
}

Array.prototype.last = function() {
	return this[this.length - 1];
}

String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}