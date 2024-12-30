
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
	
						if (p && p.tagName == 'INPUT' && p.type == 'checkbox') {
							// p.checked = checked;
							// p.value = checked;

							e.disabled = !checked;

							if (checked) 
								e.value = value;

							if (checked != p.checked)
								p.checked = checked;
						}
						else if (value) {
							e.value = value;
						}
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
			
			case 'center':
			handler.centerImage();
			break;

			case 'remove':
			handler.remove();
			break;

			case 'export':
			handler.exportObject();
			break;

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

	const e = container.querySelector('.list');
	const list = UX.List.createMixin(e);

	container.onclick = (e) => {

		const target = e.target;

		if (target.tagName == 'BUTTON') {

			

			const e = target.closest('[data-id]');

			if (e) {

				const id = e.dataset.id;

				switch (target.name) {

					case 'rm':
					handler.remove(id);
					list.delete(id);
					break;
					
					case 'up':
					handler.move(id, 1);
					break;

					case 'down':
					handler.move(id, -1);
					break;

					case 'visible':
					handler.update('visible', 'toggle', id);
					break;

					case 'duplicate':
					handler.copy(id);
					break;

					case 'apply':
					handler.applyMask(id);
					break;
				}
			}

			return;
		}

		if (UX.List.isItem(target)) {

			const id = target.dataset.id;

			handler.select(id);
			list.selectItem(id);
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

	list.add = function(o, i) {

		const id = o.id;

		let e;

		if (template) {
			e = list.addItemTemplate(template, o);
			if (typeof i == 'number') {
				const p = list.area.childNodes[i];
				if (p)
					dom.insertAfter(e, p);
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

	list.select = function(id) {
		this.selectItem(id);
	}

	return list;
}

export function wrapProjects(container, handler, template) {

	if (typeof container == 'string')
		container = document.getElementById(container);

	const e = container.querySelector('.list');
	const list = UX.List.createMixin(e);

	container.onclick = (e) => {

		const target = e.target;

		if (target.tagName == 'BUTTON') {

			switch (target.name) {

				case 'rm': {

					const e = target.closest('[data-id]');
					
					if (e) {
						const id = e.dataset.id;

						handler.delete(id);
					}
				}
				break;

				case 'align':
				handler.alignImages();
				break;
			}


			return;
		}

		if (UX.List.isItem(target)) {

			const id = target.dataset.id;
			list.selectItem(id);

			handler.open(id);
		}

	}

	list.add = function(o, top=false) {

		const id = o.id;

		let e;

		if (template) {
			e = list.addItemTemplate(template, o, top);
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

	list.select = function(id) {
		this.selectItem(id);
	}

	return list;
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

	container.onclick = async e => {
		const target = e.target;

		switch (target.tagName) {

			case 'BUTTON':
			switch (target.name) {

				case 'undo':
				editor.undo();
				break;

				case 'redo':
				editor.redo();
				break;

				case 'export':
				editor.export();
				break;

				case 'import':
				editor.import();
				break;

				case 'reset':
				editor.reset();
				break;

				case 'save': {
					const name = target.previousElementSibling.value || 'test';
					target.disabled = true;
					await delayResolve(editor.save(name), 2000);
					target.disabled = false;
				}
				break;

				case 'rmnode':
				editor.removeNode();
				break;

				case 'node':
				editor.insertNode();
				break;

				case 'center':
				editor.centerView();
				break;

			}
			break;

			// case 'INPUT':
			// switch (target.name) {

			// 	case 'zoom':

			// 	break;
			// }
			// break;
		}
	}

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

			case 'fill':
			editor.fill = value;
			break;

			case 'stroke':
			editor.stroke = value;
			break;

			case 'strokeWidth':
			editor.strokeWidth = parseInt(value);
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
