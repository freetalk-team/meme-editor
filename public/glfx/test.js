

function wrap(func) {
	return function() {
		// Make sure that we're using the correct global WebGL context
		let gl = {
			draw() {
				console.log('Draw');
			}
		}

		// Now that the context has been switched, we can call the wrapped function
		return func.apply(this, arguments);
	};
}

function wrap2(func) {
	return func.bind({ 
		gl:  {
			draw() {
				console.log('Draw');
			}
		} 
	});
}
	

function foo() {

	this.gl.draw();
}

wrap2(foo)();