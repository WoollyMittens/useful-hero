/*
	Source:
	van Creij, Maurice (2014). "useful.hero.js: Slideshow Banner", version 20141127, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

// create the global object if needed
var useful = useful || {};

// extend the global object
useful.Hero = function () {

	// PROPERTIES

	"use strict";

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
		setTimeout(function () { _this.loadPage(0); }, 0);
		// in case the window is resized
		window.addEventListener('resize', this.onWindowResized());
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
			image.style.width = config.overscan * 100 + '%';
			image.style.marginLeft = (1 - config.overscan) / 2 * 100 + '%';
			image.style.marginRight = image.style.marginLeft;
			image.style.height = 'auto';
			image.style.visibility = 'hidden';
			image.addEventListener('load', this.onImageLoaded(image));
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
		this.element.style.maxHeight = (this.config.maxHeight) ? this.config.maxHeight + 'px' : '100%';
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
			button.addEventListener('click', this.onShowPage(a));
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

	this.fixWidth = function (image) {
		// if there is a max height
		if (this.config.maxHeight) {
			// calculate the aspect ratio of the image
			var aspect = image.offsetWidth / image.offsetHeight;
			// calculate the max-width of the image according to its ratio
			image.style.maxWidth = (this.config.maxHeight * aspect) + 'px';
		}
	};

	this.prepareImage = function (image) {
		var _this = this;
		// if there is a max height, fix the max width to the same ratio
		this.fixWidth(image);
		// fit the image in its container
		this.adjustHeight();
		// reveal the image
		image.style.visibility = 'visible';
		// reveal the parent
		_this.element.style.visibility = 'visible';
	};

	this.adjustHeight = function () {
		var image, height = 0, slides = this.config.slides;
		// re-fit the images
		for (var a = 0, b = slides.length; a < b; a += 1) {
			// get the image that goes with this slide
			image = slides[a].image;
			// remember if it is taller
			height = (image.offsetHeight > height) ? image.offsetHeight : height;
			// centre the image in its container
			image.style.top = '50%';
			image.style.marginTop = -(image.offsetHeight / 2) + 'px';
		}
		// implement the new height
		this.element.style.height = height + 'px';
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
		this.handleGestures = new useful.Gestures().init({
			'element' : slide,
			'threshold' : 100,
			'increment' : 0.1,
			'cancelTouch' : true,
			'cancelGesture' : true,
			'swipeLeft' : function () { _this.incrementPage(1); },
			'swipeRight' : function () { _this.incrementPage(-1); }
		});
		// add click event
		slide.addEventListener('click', this.onLinkClicked(index));
	};

	this.onLinkClicked = function (index) {
		var _this = this, slide = this.config.slides[index];
		return function (event) {
			// if the slide was not busy cancel the click
			if (_this.config.inert) { event.preventDefault(); }
			// else if available call the event handler
			else if (slide.event) { slide.event(event); }
		};
	};

	this.onImageLoaded = function (image) {
		var _this = this;
		return function () {
			// centre the image
			_this.prepareImage(image);
		};
	};

	this.onWindowResized = function () {
		var _this = this;
		return function () {
			// resize the container
			_this.adjustHeight();
		};
	};

	this.onShowPage = function (index) {
		var _this = this;
		return function (evt) {
			// cancel the click event
			evt = evt || window.event;
			evt.preventDefault();
			// show the relevant page number
			_this.loadPage(index);
		};
	};
	
};

// return as a require.js module
if (typeof module !== 'undefined') {
	exports = module.exports = useful.Hero;
}
