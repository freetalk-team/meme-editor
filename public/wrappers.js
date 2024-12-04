export function wrapProperties(container, handler) {

	const props = {

		set(prop, value) {

			const e = this[prop];

			if (e) {

				// if (typeof value == 'number')
				// 	value = Math.floor(value);

				if (e.tagName == 'INPUT' && e.type == 'color') {
					const p = e.previousElementSibling;
					const checked = !!value;

					if (p.tagName == 'INPUT' && p.type == 'checkbox')
						p.checked = checked;

					if (checked) {
						e.value = value;
					}

					e.disabled = !checked;
				}
				else if (e.tagName == 'INPUT' && e.type == 'checkbox') {
					e.checked = !!value;
				}
				else {
					e.value = value;
				}

			}
		},

		assign(data) {
			for (const [k, v] of Object.entries(data)) 
				this.set(k, v);
		}
	};

	const inputs = container.querySelectorAll('input,select,textarea');
	for (const i of inputs) {
		const name = i.id || i.getAttribute('role');

		if (name) {
			const [type, id] = name.split('-');

			if (type == 'object') 
				props[id] = i;
		}
	}

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
			value = target.value;

		if (handler)
			handler.update(id, value);
	}

	container.onclick = e => {

		const target = e.target;

		if (target.name == 'detect') {
			handler.detectHuman();
			return;
		}
	}

	return props;
}

export function wrapObjects(container, handler, template) {
	
	container.classList.add('list', 'list2');

	const list = UX.List.createMixin(container);

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
		console.log('On input', e);

		const target = e.target;
		const item = target.closest('[data-id]');

		if (item) {
			const id = item.dataset.id;
			const value = target.innerText;

			handler.update('id', value, id);

			item.dataset.id = value;
		}

		
	}

	list.add = function(o) {

		const id = o.id;

		let e;

		if (template) {
			e = list.addItemTemplate(template, o);
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

	return list;
}

export function wrapProjects(container, handler, template) {
	container.classList.add('list', 'list2');

	const list = UX.List.createMixin(container);

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

	return list;
}

export function wrapTools(container, handler) {

	container.onclick = (e) => {
		const target = e.target;

		if (target.tagName == 'BUTTON') {

			const name = target.name;

			handler.add(name);
		}
	}
}