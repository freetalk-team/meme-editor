
function wrap(container, props={}) {

	Object.assign(props, {
		set(prop, value, id) {

			const e = this[prop];

			if (e) {

				switch (e.tagName) {

					case 'INPUT':
					if (e.type == 'checkbox') {
						e.checked = !!value;
					}
					else {

						if (id) e.dataset.id = id;

						const p = e.previousElementSibling;
						const checked = !!value;

						let d;
	
						if (p && p.tagName == 'INPUT' && p.type == 'checkbox') {
							// p.checked = checked;
							// p.value = checked;

							e.disabled = !checked;

							if (checked) 
								e.value = value;

							if (checked != p.checked) {
								p.checked = checked;
								d = p;
							}
						}
						else if (typeof value == 'number') {
							e.value = isNaN(value) ? 0 : value;
							d = e;
						}
						else {
							if (e.type == 'color' && !value)
								value = e.value;
							// else if (e.type == 'range')
							// 	d = e;

							e.value = value || '';
						}

						if (d) d.dispatchEvent(new Event('change', { 'bubbles': true }));
					}
					break;

					case 'SELECT': {
						const p = e.previousElementSibling;
						const checked = !!value;
	
						if (p && p.tagName == 'INPUT' && p.type == 'checkbox') {
							// p.checked = checked;
							// p.value = checked;

							e.disabled = !checked;

							if (checked) 
								e.value = value;
							else {
								e.value = e.children[0].value;
							}

							if (checked != p.checked) {
								// p.click();
								p.checked = checked;
								p.dispatchEvent(new Event('change', { 'bubbles': true }));
							}
						}
						else {
							e.value = value;
						}
					}
					break;

					default:
					e.value = value;
					break;
				}

			}

			return e;
		},

		assign(data) {
			for (const [k, v] of Object.entries(data)) 
				this.set(k, v);
		}
	});

	const inputs = container.querySelectorAll('input,select,textarea');
	for (const i of inputs) {
		const name = i.id || i.getAttribute('role');

		if (name) {
			const [type, id] = name.split('-');

			if (type == 'object') 
				props[id] = i;
		}
	}

	return props;
}

function wrapList(container, template) {
	const e = container.querySelector('.list');
	const list = UX.List.createMixin(e);

	list.add = function(o, after, check=false) {

		const id = o.id || o.name;

		if (check && this.getItem(id)) return

		let e;

		if (template) {
			e = list.addItemTemplate(template, o, true);

			if (after) {

				if (typeof after == 'string')
					after = list.getElement(after);

				dom.insertAfter(e, after);

			}
		}
		else {
			e = document.createElement('span');
			e.innerText = id;
			e.dataset.id = id;
			e.classList.add('item');

			container.appendChild(e);
		}

		return e;
	}

	list.select = function(id, add) {
		this.selectItem(id, add);
	}

	list.enable = function(name, b) {
		const button = container.querySelector(`button[name="${name}"]`);
		if (button)
			button.disabled = !b;
	}

	list.swap = function(a, b) {

		const e1 = this.getElement(a)
			, e2 = this.getElement(b)
			;

		dom.swap(e1, e2);
	}

	list.rm = function(id) {
		this.delete(id);
	}

	return list;
}

export function wrapProperties(container, handler) {

	if (typeof container == 'string')
		container = document.getElementById(container);

	const props = wrap(container, {

		mode(m) {

			if (m) 
				container.setAttribute('mode', m);
			else
				container.removeAttribute('mode');
		}
	});

	// props.set_ = props.set;
	// props.set = function(prop, value, id) {

	// 	const e = this.set_(prop, value, id);

	// 	if (e.tagName == 'INPUT' && e.type == 'range')
	// 		e.dispatchEvent(new Event('change', { 'bubbles': true }));
	// }

	container.oninput = (e) => {

		let target = e.target;
		// if (!target.value) return;

		let type, id, value;

		
		if (target.type == 'checkbox') {
			value = target.checked;

			const a = target.getAttribute('for');

			if (a) {

				target = target.nextElementSibling;

				if (value) 
					value = target.value;
				else 
					value = '';
			}
		}
	
		const name = target.id || target.getAttribute('role');
		if (!name) return;

		[type, id] = name.split('-');

		if (value == null)
			value = target.dataset.id || target.value;

		if (handler)
			handler.update(id, value);
	}

	container.onclick = async e => {

		const target = e.target;

		switch (target.name) {
			
			case 'detect': {
				const e = target.previousElementSibling;
				const threshold = parseFloat(e.value);

				target.disabled = true;
				await delayResolve(handler.detectBody(threshold), 2000);
				target.disabled = false;
			}
			break;
		}
	}

	return props;
}

export function wrapObjects(container, handler, template) {
	
	if (typeof container == 'string')
		container = document.getElementById(container);

	container.onclick = (e) => {

		const target = e.target;

		if (UX.List.isItem(target)) {

			const id = target.dataset.id;
			const add = e.ctrlKey;

			handler.select(id, add);
		}

	}

	container.oninput = e => {

		const target = e.target;
		const item = target.closest('[data-id]');

		if (item) {
			const id = item.dataset.id;
			const value = target.innerText;

			handler.update('name', value, id);
		}
		
	}

	return wrapList(container, template);
}

export function wrapProjects(container, handler, template) {

	if (typeof container == 'string')
		container = document.getElementById(container);

	return wrapList(container, template);
}

export function wrapImages(container, handler, template) {
	
	if (typeof container == 'string')
		container = document.getElementById(container);

	container.onclick = (e) => {

		const target = e.target;

		if (UX.List.isItem(target)) {
			const id = target.dataset.id;

			handler.add('image', id);
		}
	}

	return wrapList(container, template);
}

export function wrapTools(container, handler) {
	if (typeof container == 'string')
		container = document.getElementById(container);

	container.onclick = (e) => {
		const target = e.target;

		if (target.tagName == 'BUTTON') {

			const name = target.name;
			
			if (target.hasAttribute('selectable')) {

				const all = target.parentElement.querySelectorAll('[selectable]');
				for (const i of all)
					i.disabled = false;

				target.disabled = true;
			}

			switch (name) {

				case 'select':
				case 'draw':
				case 'edit':
				handler.mode = name;
				break;

				default:
				handler.add(name);
				break;
			}

		}
	}

	const props = {

		mode(mode) {

			const selectable = container.querySelectorAll('[selectable]');

			for (const i of selectable)
				i.disabled = i.name == mode;
		}
	};

	return props;
}

export function wrapCanvas(container, handler) {
	if (typeof container == 'string')
		container = document.getElementById(container);

	const props = wrap(container);

	container.oninput = (e) => {

		let target = e.target;
		// if (!target.value) return;

		let type, id, value;

		const name = target.id || target.getAttribute('role');
		if (!name) return;

		[type, id] = name.split('-');

		if (value == null)
			value = target.value;

		if (handler)
			handler.update(id, value, 'canvas');
	}

	// container.onclick = (e) => {

	// 	const target = e.target;
	// }

	return props;
}

export function wrapStatus(container) {

	const props = {};

	if (typeof container == 'string')
		container = document.getElementById(container);

	const outputs = container.querySelectorAll('[name]');

	for (const i of outputs) {
		const name = i.name;

		props[name] = i;
	}

	Object.assign(props, {
		set(prop, value) {

			if (this[prop])
				this[prop].value = value;
		},

		assign(values) {

			for (const [name, value] of Object.entries(values))
				this.set(name, value);
		}

	});

	return props;
}

export function wrapActions(container, editor) {
	if (typeof container == 'string')
		container = document.getElementById(container);

	const save = container.querySelector('button[name="save"]');
	const project = save.previousElementSibling;

	const zoomInput = container.querySelector('input[name="zoom"]');
	const zoomDropdown = zoomInput.nextElementSibling;
	const dropdownOptions = zoomDropdown.querySelectorAll('.dropdown-option');

	// Show the dropdown when the input is focused
	zoomInput.addEventListener('focus', () => {
		zoomDropdown.style.display = 'block';
	  });

	// Hide the dropdown when clicking outside of the input or dropdown
	document.addEventListener('click', (e) => {
		if (!zoomDropdown.contains(e.target) && e.target !== zoomInput) {
		  zoomDropdown.style.display = 'none';
		}
	});
	
	// Set the input value when a dropdown option is clicked
	dropdownOptions.forEach(option => {
		option.addEventListener('click', () => {
		  zoomInput.value = option.textContent;
		  zoomDropdown.style.display = 'none';

		  // Manually trigger the 'input' event
		  //zoomInput.dispatchEvent(new Event('input', { bubbles: true }));
		  zoomInput.dispatchEvent(new Event('change', { bubbles: true }));
		});
	});
	
	// Always show all options, regardless of input value
	zoomInput.addEventListener('input', () => {
		// Ensure all options are visible
		dropdownOptions.forEach(option => {
		  option.style.display = 'block';
		});
	});

	let zoomInputTimeout;

	const actions = {

		current: 'select',

		mode(m) {

			container.setAttribute('mode', m);

			// const buttons = container.querySelectorAll('button');

			// if (this.current == 'edit') {
			// 	for (const i of buttons)
			// 		i.disabled = true;
			// }

			// if (m == 'edit') {
			// 	for (const i of buttons)
			// 		i.disabled = false;
			// }

			// this.current = m;

		},

		assign(values) {

			for (const [name, value] of Object.entries(values))
				this.set(name, value);
		},

		set(prop, value) {

			switch (prop) {
				case 'zoom':
				zoomInput.value = parseInt(value * 100) + '%';
				break;

				default: {
					const e = container.querySelector(`[name="${prop}"]`);
					if (e)
						e.value = value;
				}
				
			}
		}
	};

	container.onchange = e => {

		const target = e.target;
		const value = target.value;

		switch (target.name) {

			case 'height':
			editor.height = parseInt(value);
			break;

			case 'width':
			editor.width = parseInt(value);
			break;

			case 'zoom':
			editor.zoom = parseInt(value) / 100;
			break;
		}

	}

	container.oninput = e => {

		const target = e.target;
		const value = target.value;

		switch (target.name) {

			case 'zoom': {
				if (!zoomInputTimeout)
					zoomInputTimeout = setTimeout(() => {
						zoomInputTimeout = null;
						
						const value = parseInt(zoomInput.value);
						console.log('Zoom change', value);
						
						editor.zoom = value / 100;

					}, 1200);
			}
			break;

		}

		//console.debug('INPUT');
	}

	editor.on('open', e => project.value = e.detail);

	return actions;
}

export function wrapNotifications(container, template) {

	if (typeof container == 'string')
		container = document.getElementById(container);

	const list = UX.List.createMixin(container);

	list.add = function(md, status) {

		const styles = {
			success: 'w3-green',
			error: 'w3-red'
		};
		
		const e = this.addItemTemplate(template, md);
		e.classList.add(styles[status]);

		setTimeout(() => dom.removeElement(e), 3000);
	}

	return list;
}