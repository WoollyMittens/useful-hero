/*
	Source:
	van Creij, Maurice (2018). "gestures.js: A library of useful functions to ease working with touch and gestures.", http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

// extend the constructor
var Gestures = function (config) {

	// PROPERTIES

	// METHODS

	this.only = function (config) {
		// start an instance of the script
		return new this.Main(config, this);
	};

	this.each = function (config) {
		var _config, _context = this, instances = [];
		// for all element
		for (var a = 0, b = config.elements.length; a < b; a += 1) {
			// clone the configuration
			_config = Object.create(config);
			// insert the current element
			_config.element = config.elements[a];
			// delete the list of elements from the clone
			delete _config.elements;
			// start a new instance of the object
			instances[a] = new this.Main(_config, _context);
		}
		// return the instances
		return instances;
	};

	// START

	return (config.elements) ? this.each(config) : this.only(config);

};

// return as a require.js module
if (typeof module !== 'undefined') {
	exports = module.exports = Gestures;
}

// extend the class
Gestures.prototype.Main = function (config, context) {

	// PROPERTIES

	this.config = config;
	this.context = context;
	this.element = config.element;
	this.paused = false;

	// METHODS

	this.init = function () {
		// check the configuration properties
		this.config = this.checkConfig(config);
		// add the single touch events
		if (config.allowSingle) { this.single = new this.context.Single(this); }
		// add the multi touch events
		if (config.allowMulti) { this.multi = new this.context.Multi(this); }
	};

	this.checkConfig = function (config) {
		// add default values for missing ones
		config.threshold = config.threshold || 50;
		config.increment = config.increment || 0.1;
		// cancel all events by default
		if (config.cancelTouch === undefined || config.cancelTouch === null) { config.cancelTouch = true; }
		if (config.cancelGesture === undefined || config.cancelGesture === null) { config.cancelGesture = true; }
		// add dummy event handlers for missing ones
		if (config.swipeUp || config.swipeLeft || config.swipeRight || config.swipeDown || config.drag || config.doubleTap) {
			config.allowSingle = true;
			config.swipeUp = config.swipeUp || function () {};
			config.swipeLeft = config.swipeLeft || function () {};
			config.swipeRight = config.swipeRight || function () {};
			config.swipeDown = config.swipeDown || function () {};
			config.drag = config.drag || function () {};
			config.doubleTap = config.doubleTap || function () {};
		}
		// if there's pinch there's also twist
		if (config.pinch || config.twist) {
			config.allowMulti = true;
			config.pinch = config.pinch || function () {};
			config.twist = config.twist || function () {};
		}
		// return the fixed config
		return config;
	};

	this.readEvent = function (event) {
		var coords = {}, offsets;
		// try all likely methods of storing coordinates in an event
		if (event.touches && event.touches[0]) {
			coords.x = event.touches[0].pageX;
			coords.y = event.touches[0].pageY;
		} else if (event.pageX !== undefined) {
			coords.x = event.pageX;
			coords.y = event.pageY;
		} else {
			coords.x = event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft);
			coords.y = event.clientY + (document.documentElement.scrollTop || document.body.scrollTop);
		}
		return coords;
	};

	this.correctOffset = function (element) {
		var offsetX = 0, offsetY = 0;
		// if there is an offset
		if (element.offsetParent) {
			// follow the offsets back to the right parent element
			while (element !== this.element) {
				offsetX += element.offsetLeft;
				offsetY += element.offsetTop;
				element = element.offsetParent;
			}
		}
		// return the offsets
		return { 'x' : offsetX, 'y' : offsetY };
	};

	// EXTERNAL

	this.enableDefaultTouch = function () {
		this.config.cancelTouch = false;
	};

	this.disableDefaultTouch = function () {
		this.config.cancelTouch = true;
	};

	this.enableDefaultGesture = function () {
		this.config.cancelGesture = false;
	};

	this.disableDefaultGesture = function () {
		this.config.cancelGesture = true;
	};

	// EVENTS

	this.init();

};

// extend the class
Gestures.prototype.Multi = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.element = parent.config.element;
	this.gestureOrigin = null;
	this.gestureProgression = null;

	// METHODS

	this.init = function () {
		// set the required events for mouse
		this.element.addEventListener('mousewheel', this.onChangeWheel());
		if (navigator.userAgent.match(/firefox/gi)) { this.element.addEventListener('DOMMouseScroll', this.onChangeWheel()); }
		// set the required events for gestures
		if ('ongesturestart' in window) {
			this.element.addEventListener('gesturestart', this.onStartGesture());
			this.element.addEventListener('gesturechange', this.onChangeGesture());
			this.element.addEventListener('gestureend', this.onEndGesture());
		} else if ('msgesturestart' in window) {
			this.element.addEventListener('msgesturestart', this.onStartGesture());
			this.element.addEventListener('msgesturechange', this.onChangeGesture());
			this.element.addEventListener('msgestureend', this.onEndGesture());
		} else {
			this.element.addEventListener('touchstart', this.onStartFallback());
			this.element.addEventListener('touchmove', this.onChangeFallback());
			this.element.addEventListener('touchend', this.onEndFallback());
		}
	};

	this.cancelGesture = function (event) {
		if (this.config.cancelGesture) {
			event = event || window.event;
			event.preventDefault();
		}
	};

	this.startGesture = function (event) {
		// if the functionality wasn't paused
		if (!this.parent.paused) {
			// note the start position
			this.gestureOrigin = {
				'scale' : event.scale,
				'rotation' : event.rotation,
				'target' : event.target || event.srcElement
			};
			this.gestureProgression = {
				'scale' : this.gestureOrigin.scale,
				'rotation' : this.gestureOrigin.rotation
			};
		}
	};

	this.changeGesture = function (event) {
		// if there is an origin
		if (this.gestureOrigin) {
			// get the distances from the event
			var scale = event.scale,
				rotation = event.rotation;
			// get the coordinates from the event
			var coords = this.parent.readEvent(event);
			// get the gesture parameters
			this.config.pinch({
				'x' : coords.x,
				'y' : coords.y,
				'scale' : scale - this.gestureProgression.scale,
				'event' : event,
				'target' : this.gestureOrigin.target
			});
			this.config.twist({
				'x' : coords.x,
				'y' : coords.y,
				'rotation' : rotation - this.gestureProgression.rotation,
				'event' : event,
				'target' : this.gestureOrigin.target
			});
			// update the current position
			this.gestureProgression = {
				'scale' : event.scale,
				'rotation' : event.rotation
			};
		}
	};

	this.endGesture = function () {
		// note the start position
		this.gestureOrigin = null;
	};

	// FALLBACK

	this.startFallback = function (event) {
		// if the functionality wasn't paused
		if (!this.parent.paused && event.touches.length === 2) {
			// note the start position
			this.gestureOrigin = {
				'touches' : [
					{ 'pageX' : event.touches[0].pageX, 'pageY' : event.touches[0].pageY },
					{ 'pageX' : event.touches[1].pageX, 'pageY' : event.touches[1].pageY }
				],
				'target' : event.target || event.srcElement
			};
			this.gestureProgression = {
				'touches' : this.gestureOrigin.touches
			};
		}
	};

	this.changeFallback = function (event) {
		// if there is an origin
		if (this.gestureOrigin && event.touches.length === 2) {
			// get the coordinates from the event
			var coords = this.parent.readEvent(event);
			// calculate the scale factor
			var scale = 0, progression = this.gestureProgression;
			scale += (event.touches[0].pageX - event.touches[1].pageX) / (progression.touches[0].pageX - progression.touches[1].pageX);
			scale += (event.touches[0].pageY - event.touches[1].pageY) / (progression.touches[0].pageY - progression.touches[1].pageY);
			scale = scale - 2;
			// get the gesture parameters
			this.config.pinch({
				'x' : coords.x,
				'y' : coords.y,
				'scale' : scale,
				'event' : event,
				'target' : this.gestureOrigin.target
			});
			// update the current position
			this.gestureProgression = {
				'touches' : [
					{ 'pageX' : event.touches[0].pageX, 'pageY' : event.touches[0].pageY },
					{ 'pageX' : event.touches[1].pageX, 'pageY' : event.touches[1].pageY }
				]
			};
		}
	};

	this.endFallback = function () {
		// note the start position
		this.gestureOrigin = null;
	};

	this.changeWheel = function (event) {
		// measure the wheel distance
		var scale = 1, distance = ((window.event) ? window.event.wheelDelta / 120 : -event.detail / 3);
		// get the coordinates from the event
		var coords = this.parent.readEvent(event);
		// equate wheeling up / down to zooming in / out
		scale = (distance > 0) ? +this.config.increment : scale = -this.config.increment;
		// report the zoom
		this.config.pinch({
			'x' : coords.x,
			'y' : coords.y,
			'scale' : scale,
			'event' : event,
			'source' : event.target || event.srcElement
		});
	};

	// GESTURE EVENTS

	this.onStartGesture = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// optionally cancel the default behaviour
			_this.cancelGesture(event);
			// handle the event
			_this.startGesture(event);
			_this.changeGesture(event);
		};
	};

	this.onChangeGesture = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// optionally cancel the default behaviour
			_this.cancelGesture(event);
			// handle the event
			_this.changeGesture(event);
		};
	};

	this.onEndGesture = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// handle the event
			_this.endGesture(event);
		};
	};

	// FALLBACK EVENTS

	this.onStartFallback = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// optionally cancel the default behaviour
			//_this.cancelGesture(event);
			// handle the event
			_this.startFallback(event);
			_this.changeFallback(event);
		};
	};

	this.onChangeFallback = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// optionally cancel the default behaviour
			_this.cancelGesture(event);
			// handle the event
			_this.changeFallback(event);
		};
	};

	this.onEndFallback = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// handle the event
			_this.endGesture(event);
		};
	};

	// MOUSE EVENTS

	this.onChangeWheel = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// get event elementect
			event = event || window.event;
			// optionally cancel the default behaviour
			_this.cancelGesture(event);
			// handle the event
			_this.changeWheel(event);
		};
	};

	// EVENTS

	this.init();

};

// extend the class
Gestures.prototype.Single = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.element = parent.config.element;
	this.lastTouch = null;
	this.touchOrigin = null;
	this.touchProgression = null;

	// METHODS

	this.init = function () {
		// set the required events for mouse
		this.element.addEventListener('mousedown', this.onStartTouch());
		this.element.addEventListener('mousemove', this.onChangeTouch());
		document.body.addEventListener('mouseup', this.onEndTouch());
		// set the required events for touch
		this.element.addEventListener('touchstart', this.onStartTouch());
		this.element.addEventListener('touchmove', this.onChangeTouch());
		document.body.addEventListener('touchend', this.onEndTouch());
		this.element.addEventListener('mspointerdown', this.onStartTouch());
		this.element.addEventListener('mspointermove', this.onChangeTouch());
		document.body.addEventListener('mspointerup', this.onEndTouch());
	};

	this.cancelTouch = function (event) {
		if (this.config.cancelTouch) {
			event = event || window.event;
			event.preventDefault();
		}
	};

	this.startTouch = function (event) {
		// if the functionality wasn't paused
		if (!this.parent.paused) {
			// get the coordinates from the event
			var coords = this.parent.readEvent(event);
			// note the start position
			this.touchOrigin = {
				'x' : coords.x,
				'y' : coords.y,
				'target' : event.target || event.srcElement
			};
			this.touchProgression = {
				'x' : this.touchOrigin.x,
				'y' : this.touchOrigin.y
			};
		}
	};

	this.changeTouch = function (event) {
		// if there is an origin
		if (this.touchOrigin) {
			// get the coordinates from the event
			var coords = this.parent.readEvent(event);
			// get the gesture parameters
			this.config.drag({
				'x' : this.touchOrigin.x,
				'y' : this.touchOrigin.y,
				'horizontal' : coords.x - this.touchProgression.x,
				'vertical' : coords.y - this.touchProgression.y,
				'event' : event,
				'source' : this.touchOrigin.target
			});
			// update the current position
			this.touchProgression = {
				'x' : coords.x,
				'y' : coords.y
			};
		}
	};

	this.endTouch = function (event) {
		// if the numbers are valid
		if (this.touchOrigin && this.touchProgression) {
			// calculate the motion
			var distance = {
				'x' : this.touchProgression.x - this.touchOrigin.x,
				'y' : this.touchProgression.y - this.touchOrigin.y
			};
			// if there was very little movement, but this is the second touch in quick successionif (
			if (
				this.lastTouch &&
				Math.abs(this.touchOrigin.x - this.lastTouch.x) < 10 &&
				Math.abs(this.touchOrigin.y - this.lastTouch.y) < 10 &&
				new Date().getTime() - this.lastTouch.time < 500 &&
				new Date().getTime() - this.lastTouch.time > 100
			) {
				// treat this as a double tap
				this.config.doubleTap({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'event' : event, 'source' : this.touchOrigin.target});
			// if the horizontal motion was the largest
			} else if (Math.abs(distance.x) > Math.abs(distance.y)) {
				// if there was a right swipe
				if (distance.x > this.config.threshold) {
					// report the associated swipe
					this.config.swipeRight({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : distance.x, 'event' : event, 'source' : this.touchOrigin.target});
				// else if there was a left swipe
				} else if (distance.x < -this.config.threshold) {
					// report the associated swipe
					this.config.swipeLeft({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : -distance.x, 'event' : event, 'source' : this.touchOrigin.target});
				}
			// else
			} else {
				// if there was a down swipe
				if (distance.y > this.config.threshold) {
					// report the associated swipe
					this.config.swipeDown({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : distance.y, 'event' : event, 'source' : this.touchOrigin.target});
				// else if there was an up swipe
				} else if (distance.y < -this.config.threshold) {
					// report the associated swipe
					this.config.swipeUp({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : -distance.y, 'event' : event, 'source' : this.touchOrigin.target});
				}
			}
			// store the history of this touch
			this.lastTouch = {
				'x' : this.touchOrigin.x,
				'y' : this.touchOrigin.y,
				'time' : new Date().getTime()
			};
		}
		// clear the input
		this.touchProgression = null;
		this.touchOrigin = null;
	};

	// TOUCH EVENTS

	this.onStartTouch = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// get event elementect
			event = event || window.event;
			// handle the event
			_this.startTouch(event);
			_this.changeTouch(event);
		};
	};

	this.onChangeTouch = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// get event elementect
			event = event || window.event;
			// optionally cancel the default behaviour
			_this.cancelTouch(event);
			// handle the event
			_this.changeTouch(event);
		};
	};

	this.onEndTouch = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// get event elementect
			event = event || window.event;
			// handle the event
			_this.endTouch(event);
		};
	};

	// EVENTS

	this.init();

};

/*
	Source:
	van Creij, Maurice (2018). "hero.js: Slideshow Banner", http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

// establish the class
var Hero = function (config) {

	// PROPERTIES

	// METHODS

	this.init = function (config) {
		var _this = this;
		// store the config
		this.config = config;
		this.element = config.element;
		// default values
		this.config.imageslice = this.config.imageslice || '{src}';
		this.config.index = 0;
		this.config.revealTimeout = null;
		// build the html
		this.addSlides();
		this.addControls();
		// wait for a redraw and start the banner
		window.requestAnimationFrame(this.loadPage.bind(this, 0));
		// in case the window is resized
		window.addEventListener('resize', this.onWindowResized.bind(this));
		// return the object
		return this;
	};

	this.addSlides = function () {
		// working vars
		var hero = this.element,
			config = this.config,
			width = this.element.offsetWidth,
			wrapper, figure, slide, link, image, slice, position;
		// hide the parent while its under constuction
		this.element.style.visibility = 'hidden';
		// build a wrapper for the slides
		wrapper = document.createElement('div');
		wrapper.setAttribute('class', 'hero-wrapper');
		// use the optional image slicer is available
		slice = (config.imageslice) ? config.imageslice : '{src}';
		// add the individual slides
		for (var a = 0, b = config.slides.length; a < b; a += 1) {
			// determine the starting position of the slide
			position = (a === 0) ? 'hero-slide hero-centre': 'hero-slide hero-right';
			// create the link
			link = document.createElement('a');
			link.setAttribute('href', config.slides[a].url || '#');
			link.setAttribute('target', '_blank');
			link.setAttribute('class', position);
			link.style.zIndex = config.slides.length - a;
			// slice/size the image
			slice = this.config.imageslice
				.replace('{src}', config.slides[a].src)
				.replace('{width}', width);
			// create the image
			image = document.createElement('img');
			image.setAttribute('alt', '');
			image.style.visibility = 'hidden';
			image.addEventListener('load', this.onImageLoaded.bind(this, image));
			image.setAttribute('data-src', slice);
			// insert the slide
			link.appendChild(image);
			wrapper.appendChild(link);
			// add touch controls
			this.onHandleGestures(link, a);
			// store a pointer
			config.slides[a].link = link;
			config.slides[a].image = image;
		}
		// replace the old banner
		this.element.innerHTML = '';
		this.element.appendChild(wrapper);
	};

	this.addControls = function () {
		var button, slides = this.config.slides;
		// add the menu
		var menu = document.createElement('menu');
		// for every figure
		for (var a = 0, b = slides.length; a < b; a += 1) {
			// add a button
			button = document.createElement('a');
			button.innerHTML = a;
			button.setAttribute('class', 'hero-passive');
			button.setAttribute('href', '#' + a);
			button.addEventListener('click', this.onShowPage.bind(this, a));
			// add the button to the menu
			menu.appendChild(button);
			// store a pointer to the button
			slides[a].button = button;
		}
		// hide the menu if there's only one slide
		if (slides.length < 2) { menu.style.visibility = 'hidden'; }
		// add the menu to the  component
		this.element.appendChild(menu);
	};

	this.prepareImage = function (image) {
		// reveal the image
		image.style.visibility = 'visible';
		// reveal the parent
		this.element.style.visibility = 'visible';
	};

	this.loopPage = function () {
		var slides = this.config.slides, max = slides.length - 1, min = 0;
		// increment current index
		var index = this.config.index + 1;
		// adjust the index if it's out of bounds
		index = (index > max) ? 0 : index;
		index = (index < min) ? max : index;
		// call the page
		this.loadPage(index);
	};

	this.incrementPage = function (increment) {
		// add the increment to the index
		this.loadPage(this.config.index + increment);
	};

	this.loadPage = function (index) {
		var slides = this.config.slides;
		// if the index is within bounds
		if (index >= 0 && index < slides.length) {
			var image = slides[index].image;
			// load the image if needed
			if (!image.src) { image.src = image.getAttribute('data-src'); }
			// show it
			this.showPage(index);
		}
	};

	this.showPage = function (index) {
		var _this = this,
			link, button, slides = this.config.slides,
			min = 0, max = slides.length - 1,
			states = new RegExp('hero-passive|hero-active', 'g'),
			positions = new RegExp('hero-left|hero-centre|hero-right', 'g');
		// stop clicks while the slides are changing
		this.config.inert = true;
		// adjust the index if it's out of bounds
		index = (index > max) ? max : index;
		index = (index < min) ? min : index;
		// for all pages
		for (var a = 0, b = slides.length; a < b; a += 1) {
			link = slides[a].link;
			button = slides[a].button;
			// make sure the slide is visible
			link.style.visibility = 'visible';
			// if the page is lower than the index
			if (a < index) {
				// move it left
				link.className = link.className.replace(positions, 'hero-left');
				// reset its button
				button.className = button.className.replace(states, 'hero-passive');
			// else if the page is higher than the index
			} else if (a > index) {
				// move it right
				link.className = link.className.replace(positions, 'hero-right');
				// reset its button
				button.className = button.className.replace(states, 'hero-passive');
			// else
			} else {
				// centre it
				link.className = link.className.replace(positions, 'hero-centre');
				// highlight its button
				button.className = button.className.replace(states, 'hero-active');
			}
		}
		// store the index
		this.config.index = index;
		// allow clicks after all this is done
		clearTimeout(this.config.inertTimeout);
		this.config.inertTimeout = setTimeout( function () { _this.config.inert = false; }, 300 );
		// allow the interval slides afterwards
		clearTimeout(this.config.autoTimeout);
		this.config.autoTimeout = (this.config.interval > 0) ? setTimeout(function () { _this.loopPage(); }, this.config.interval) : null;
	};

	// EVENTS

	this.onHandleGestures = function (slide, index) {
		var _this = this;
		// add mouse/touch events
		this.handleGestures = new Gestures({
			'element' : slide,
			'threshold' : 100,
			'increment' : 0.1,
			'cancelTouch' : true,
			'cancelGesture' : true,
			'swipeLeft' : this.incrementPage.bind(this, 1),
			'swipeRight' : this.incrementPage.bind(this, -1)
		});
		// add click event
		slide.addEventListener('click', this.onLinkClicked.bind(this, index));
	};

	this.onLinkClicked = function (index, evt) {
		var slide = this.config.slides[index];
		// if the slide was not busy cancel the click
		if (this.config.inert) { evt.preventDefault(); }
		// else if available call the event handler
		else if (slide.event) { slide.event(evt); }
	};

	this.onImageLoaded = function (image, evt) {
		this.prepareImage(image);
	};

	this.onWindowResized = function (evt) {
		this.adjustHeight();
	};

	this.onShowPage = function (index, evt) {
		// cancel the click event
		evt.preventDefault();
		// show the relevant page number
		this.loadPage(index);
	};

	this.init(config);

};

// return as a require.js module
if (typeof module !== 'undefined') {
	exports = module.exports = Hero;
}
