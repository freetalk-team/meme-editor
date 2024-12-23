export const Texture = (function() {


	Texture.fromElement = function(gl, element) {
		var texture = new Texture(gl, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE);
		texture.loadContentsOf(element);
		return texture;
	};

	function Texture(gl, width, height, format, type) {
		this.gl = gl;
		this.id = gl.createTexture();
		this.width = width;
		this.height = height;
		this.format = format;
		this.type = type;

		gl.bindTexture(gl.TEXTURE_2D, this.id);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		if (width && height) gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, null);
	}

	Texture.prototype.loadContentsOf = function(element) {
		this.width = element.width || element.videoWidth;
		this.height = element.height || element.videoHeight;
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.format, this.format, this.type, element);
	};

	Texture.prototype.initFromBytes = function(width, height, data) {
		this.width = width;
		this.height = height;
		this.format = this.gl.RGBA;
		this.type = this.gl.UNSIGNED_BYTE;
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.type, new Uint8Array(data));
	};

	Texture.prototype.destroy = function() {
		this.gl.deleteTexture(this.id);
		this.id = null;
	};

	Texture.prototype.use = function(unit) {
		this.gl.activeTexture(this.gl.TEXTURE0 + (unit || 0));
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
	};

	Texture.prototype.unuse = function(unit) {
		this.gl.activeTexture(this.gl.TEXTURE0 + (unit || 0));
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
	};

	Texture.prototype.ensureFormat = function(width, height, format, type) {
		// allow passing an existing texture instead of individual arguments
		if (arguments.length == 1) {
			var texture = arguments[0];
			width = texture.width;
			height = texture.height;
			format = texture.format;
			type = texture.type;
		}

		// change the format only if required
		if (width != this.width || height != this.height || format != this.format || type != this.type) {
			this.width = width;
			this.height = height;
			this.format = format;
			this.type = type;
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, null);
		}
	};

	Texture.prototype.drawTo = function(callback) {
		// start rendering to this texture
		this.gl.framebuffer = this.gl.framebuffer || this.gl.createFramebuffer();
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gl.framebuffer);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.id, 0);
		if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
			throw new Error('incomplete framebuffer');
		}
		this.gl.viewport(0, 0, this.width, this.height);

		// do the drawing
		callback();

		// stop rendering to this texture
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	};

	var canvas = null;

	function getCanvas(texture) {
		if (canvas == null) canvas = document.createElement('canvas');
		canvas.width = texture.width;
		canvas.height = texture.height;
		var c = canvas.getContext('2d');
		c.clearRect(0, 0, canvas.width, canvas.height);
		return c;
	}

	Texture.prototype.fillUsingCanvas = function(callback) {
		callback(getCanvas(this));
		this.format = this.gl.RGBA;
		this.type = this.gl.UNSIGNED_BYTE;
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
		return this;
	};

	Texture.prototype.toImage = function(image) {
		this.use();
		Shader.getDefaultShader().drawRect();
		var size = this.width * this.height * 4;
		var pixels = new Uint8Array(size);
		var c = getCanvas(this);
		var data = c.createImageData(this.width, this.height);
		this.gl.readPixels(0, 0, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
		for (var i = 0; i < size; i++) {
			data.data[i] = pixels[i];
		}
		c.putImageData(data, 0, 0);
		image.src = canvas.toDataURL();
	};

	Texture.prototype.swapWith = function(other) {
		var temp;
		temp = other.id; other.id = this.id; this.id = temp;
		temp = other.width; other.width = this.width; this.width = temp;
		temp = other.height; other.height = this.height; this.height = temp;
		temp = other.format; other.format = this.format; this.format = temp;
	};

	return Texture;
})();
