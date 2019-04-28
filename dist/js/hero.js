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
if (typeof define != 'undefined') define([], function () { return Hero });
if (typeof module != 'undefined') module.exports = Hero;
