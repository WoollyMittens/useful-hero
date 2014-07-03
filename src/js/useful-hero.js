/*
	Source:
	van Creij, Maurice (2013). "useful.hero.js: Slideshow Banner", version 20130814, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

(function (useful) {

	"use strict";

	useful.Hero = function (obj, cfg) {
		// properties
		this.obj = obj;
		this.cfg = cfg;
		// methods
		this.start = function () {
			var _this = this;
			// default values
			this.cfg.imageslice = this.cfg.imageslice || '{src}';
			this.cfg.index = 0;
			this.cfg.revealTimeout = null;
			// build the html
			this.addSlides();
			this.addControls();
			// wait for a redraw and start the banner
			setTimeout(function () { _this.loadPage(0); }, 0);
			// if an automatic loop is called for
			if (this.cfg.interval > 0) {
				// increment the slides at an interval
				setInterval(function () { _this.loopPage(); }, this.cfg.interval);
			}
			// in case the window is resized
			window.addEventListener('resize', this.onWindowResized());
			// disable the start function so it can't be started twice
			this.start = function () {};
		};
		this.addSlides = function () {
			// working vars
			var hero = this.obj,
				cfg = this.cfg,
				width = this.obj.offsetWidth,
				wrapper, figure, slide, link, image, slice, position;
			// hide the parent while its under constuction
			this.obj.style.visibility = 'hidden';
			// build a wrapper for the slides
			wrapper = document.createElement('div');
			wrapper.setAttribute('class', 'hero-wrapper');
			// use the optional image slicer is available
			slice = (cfg.imageslice) ? cfg.imageslice : '{src}';
			// add the individual slides
			for (var a = 0, b = cfg.slides.length; a < b; a += 1) {
				// determine the starting position of the slide
				position = (a === 0) ? 'hero-slide hero-centre': 'hero-slide hero-right';
				// create the link
				link = document.createElement('a');
				link.setAttribute('href', cfg.slides[a].url || '#');
				link.setAttribute('target', '_blank');
				link.setAttribute('class', position);
				link.style.zIndex = cfg.slides.length - a;
				// slice/size the image
				slice = this.cfg.imageslice
					.replace('{src}', cfg.slides[a].src)
					.replace('{width}', width);
				// create the image
				image = document.createElement('img');
				image.setAttribute('alt', '');
				image.style.width = cfg.overscan * 100 + '%';
				image.style.marginLeft = (1 - cfg.overscan) / 2 * 100 + '%';
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
				cfg.slides[a].link = link;
				cfg.slides[a].image = image;
			}
			// replace the old banner
			this.obj.style.maxHeight = (this.cfg.maxHeight) ? this.cfg.maxHeight + 'px' : '100%';
			this.obj.innerHTML = '';
			this.obj.appendChild(wrapper);
		};
		this.addControls = function () {
			var button, slides = this.cfg.slides;
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
			this.obj.appendChild(menu);
		};
		this.fixWidth = function (image) {
			// if there is a max height
			if (this.cfg.maxHeight) {
				// calculate the aspect ratio of the image
				var aspect = image.offsetWidth / image.offsetHeight;
				// calculate the max-width of the image according to its ratio
				image.style.maxWidth = (this.cfg.maxHeight * aspect) + 'px';
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
			_this.obj.style.visibility = 'visible';
		};
		this.adjustHeight = function () {
			var image, height = 0, slides = this.cfg.slides;
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
			this.obj.style.height = height + 'px';
		};
		this.loopPage = function () {
			var slides = this.cfg.slides, max = slides.length - 1, min = 0;
			// increment current index
			var index = this.cfg.index + 1;
			// adjust the index if it's out of bounds
			index = (index > max) ? 0 : index;
			index = (index < min) ? max : index;
			// call the page
			this.loadPage(index);
		};
		this.incrementPage = function (increment) {
			// add the increment to the index
			this.loadPage(this.cfg.index + increment);
		};
		this.loadPage = function (index) {
			var slides = this.cfg.slides, image = slides[index].image;
			// load the image if needed
			if (!image.src) { image.src = image.getAttribute('data-src'); }
			// show it
			this.showPage(index);
		};
		this.showPage = function (index) {
			var _this = this,
				link, button, slides = this.cfg.slides,
				min = 0, max = slides.length - 1,
				states = new RegExp('hero-passive|hero-active', 'g'),
				positions = new RegExp('hero-left|hero-centre|hero-right', 'g');
			// stop clicks while the slides are changing
			this.cfg.inert = true;
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
			this.cfg.index = index;
			// allow clicks after all this is done
			clearTimeout(this.cfg.inertTimeout);
			this.cfg.inertTimeout = setTimeout( function () { _this.cfg.inert = false; }, 300 );
		};
		// events
		this.onHandleGestures = function (slide, index) {
			var _this = this;
			// add mouse/touch events
			this.handleGestures = new useful.Gestures( slide, {
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
			var _this = this, slide = this.cfg.slides[index];
			return function (event) {
				// if the slide was not busy cancel the click
				if (_this.cfg.inert) { event.preventDefault(); }
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
		// go
		this.start();
	};

}(window.useful = window.useful || {}));
