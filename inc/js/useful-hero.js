/*
	Source:
	van Creij, Maurice (2012). "useful.gestures.js: A library of useful functions to ease working with touch and gestures.", version 20121126, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

// public object
var useful = useful || {};

(function(){

	// invoke strict mode
	"use strict";

	// object
	useful.Gestures = function (obj, cfg) {
		// properties
		this.obj = obj;
		this.cfg = cfg;
		this.lastTouch = null;
		this.touchOrigin = null;
		this.touchProgression = null;
		this.gestureOrigin = null;
		this.gestureProgression = null;
		this.paused = false;
		// methods
		this.start = function () {
			// check the configuration properties
			this.checkConfig(this.cfg);
			// set the required events for mouse
			this.obj.addEventListener('mousedown', this.onStartTouch());
			this.obj.addEventListener('mousemove', this.onChangeTouch());
			document.body.addEventListener('mouseup', this.onEndTouch());
			this.obj.addEventListener('mousewheel', this.onChangeWheel());
			if (navigator.userAgent.match(/firefox/gi)) { this.obj.addEventListener('DOMMouseScroll', this.onChangeWheel()); }
			// set the required events for touch
			this.obj.addEventListener('touchstart', this.onStartTouch());
			this.obj.addEventListener('touchmove', this.onChangeTouch());
			document.body.addEventListener('touchend', this.onEndTouch());
			this.obj.addEventListener('mspointerdown', this.onStartTouch());
			this.obj.addEventListener('mspointermove', this.onChangeTouch());
			document.body.addEventListener('mspointerup', this.onEndTouch());
			// set the required events for gestures
			if ('ongesturestart' in window) {
				this.obj.addEventListener('gesturestart', this.onStartGesture());
				this.obj.addEventListener('gesturechange', this.onChangeGesture());
				this.obj.addEventListener('gestureend', this.onEndGesture());
			} else if ('msgesturestart' in window) {
				this.obj.addEventListener('msgesturestart', this.onStartGesture());
				this.obj.addEventListener('msgesturechange', this.onChangeGesture());
				this.obj.addEventListener('msgestureend', this.onEndGesture());
			} else {
				this.obj.addEventListener('touchstart', this.onStartFallback());
				this.obj.addEventListener('touchmove', this.onChangeFallback());
				this.obj.addEventListener('touchend', this.onEndFallback());
			}
			// disable the start function so it can't be started twice
			this.start = function () {};
		};
		this.checkConfig = function (config) {
			// add default values for missing ones
			config.threshold = config.threshold || 50;
			config.increment = config.increment || 0.1;
			// cancel all events by default
			if (config.cancelTouch === undefined || config.cancelTouch === null) { config.cancelTouch = true; }
			if (config.cancelGesture === undefined || config.cancelGesture === null) { config.cancelGesture = true; }
			// add dummy event handlers for missing ones
			config.swipeUp = config.swipeUp || function () {};
			config.swipeLeft = config.swipeLeft || function () {};
			config.swipeRight = config.swipeRight || function () {};
			config.swipeDown = config.swipeDown || function () {};
			config.drag = config.drag || function () {};
			config.pinch = config.pinch || function () {};
			config.twist = config.twist || function () {};
			config.doubleTap = config.doubleTap || function () {};
		};
		this.readEvent = function (event) {
			var coords = {}, offsets;
			// try all likely methods of storing coordinates in an event
			if (event.pageX !== undefined) {
				coords.x = event.pageX;
				coords.y = event.pageY;
			} else if (event.touches && event.touches[0]) {
				coords.x = event.touches[0].pageX;
				coords.y = event.touches[0].pageY;
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
				while (element !== this.obj) {
					offsetX += element.offsetLeft;
					offsetY += element.offsetTop;
					element = element.offsetParent;
				}
			}
			// return the offsets
			return { 'x' : offsetX, 'y' : offsetY };
		};
		this.cancelTouch = function (event) {
			if (this.cfg.cancelTouch) {
				event = event || window.event;
				event.preventDefault();
			}
		};
		this.startTouch = function (event) {
			// if the functionality wasn't paused
			if (!this.paused) {
				// get the coordinates from the event
				var coords = this.readEvent(event);
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
				var coords = this.readEvent(event);
				// get the gesture parameters
				this.cfg.drag({
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
					this.cfg.doubleTap({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'event' : event, 'source' : this.touchOrigin.target});
				// if the horizontal motion was the largest
				} else if (Math.abs(distance.x) > Math.abs(distance.y)) {
					// if there was a right swipe
					if (distance.x > this.cfg.threshold) {
						// report the associated swipe
						this.cfg.swipeRight({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : distance.x, 'event' : event, 'source' : this.touchOrigin.target});
					// else if there was a left swipe
					} else if (distance.x < -this.cfg.threshold) {
						// report the associated swipe
						this.cfg.swipeLeft({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : -distance.x, 'event' : event, 'source' : this.touchOrigin.target});
					}
				// else
				} else {
					// if there was a down swipe
					if (distance.y > this.cfg.threshold) {
						// report the associated swipe
						this.cfg.swipeDown({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : distance.y, 'event' : event, 'source' : this.touchOrigin.target});
					// else if there was an up swipe
					} else if (distance.y < -this.cfg.threshold) {
						// report the associated swipe
						this.cfg.swipeUp({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : -distance.y, 'event' : event, 'source' : this.touchOrigin.target});
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
		this.changeWheel = function (event) {
			// measure the wheel distance
			var scale = 1, distance = ((window.event) ? window.event.wheelDelta / 120 : -event.detail / 3);
			// get the coordinates from the event
			var coords = this.readEvent(event);
			// equate wheeling up / down to zooming in / out
			scale = (distance > 0) ? +this.cfg.increment : scale = -this.cfg.increment;
			// report the zoom
			this.cfg.pinch({
				'x' : coords.x,
				'y' : coords.y,
				'scale' : scale,
				'event' : event,
				'source' : event.target || event.srcElement
			});
		};
		this.cancelGesture = function (event) {
			if (this.cfg.cancelGesture) {
				event = event || window.event;
				event.preventDefault();
			}
		};
		this.startGesture = function (event) {
			// if the functionality wasn't paused
			if (!this.paused) {
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
				var coords = this.readEvent(event);
				// get the gesture parameters
				this.cfg.pinch({
					'x' : coords.x,
					'y' : coords.y,
					'scale' : scale - this.gestureProgression.scale,
					'event' : event,
					'target' : this.gestureOrigin.target
				});
				this.cfg.twist({
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
		// fallback functionality
		this.startFallback = function (event) {
			// if the functionality wasn't paused
			if (!this.paused && event.touches.length === 2) {
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
				var coords = this.readEvent(event);
				// calculate the scale factor
				var scale = 0, progression = this.gestureProgression;
				scale += (event.touches[0].pageX - event.touches[1].pageX) / (progression.touches[0].pageX - progression.touches[1].pageX);
				scale += (event.touches[0].pageY - event.touches[1].pageY) / (progression.touches[0].pageY - progression.touches[1].pageY);
				scale = scale - 2;
				// get the gesture parameters
				this.cfg.pinch({
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
		// touch events
		this.onStartTouch = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// get event object
				event = event || window.event;
				// handle the event
				context.startTouch(event);
				context.changeTouch(event);
			};
		};
		this.onChangeTouch = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// get event object
				event = event || window.event;
				// optionally cancel the default behaviour
				context.cancelTouch(event);
				// handle the event
				context.changeTouch(event);
			};
		};
		this.onEndTouch = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// get event object
				event = event || window.event;
				// handle the event
				context.endTouch(event);
			};
		};
		// mouse wheel events
		this.onChangeWheel = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// get event object
				event = event || window.event;
				// optionally cancel the default behaviour
				context.cancelGesture(event);
				// handle the event
				context.changeWheel(event);
			};
		};
		// gesture events
		this.onStartGesture = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// optionally cancel the default behaviour
				context.cancelGesture(event);
				// handle the event
				context.startGesture(event);
				context.changeGesture(event);
			};
		};
		this.onChangeGesture = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// optionally cancel the default behaviour
				context.cancelGesture(event);
				// handle the event
				context.changeGesture(event);
			};
		};
		this.onEndGesture = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// handle the event
				context.endGesture(event);
			};
		};
		// gesture events
		this.onStartFallback = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// optionally cancel the default behaviour
				//context.cancelGesture(event);
				// handle the event
				context.startFallback(event);
				context.changeFallback(event);
			};
		};
		this.onChangeFallback = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// optionally cancel the default behaviour
				context.cancelGesture(event);
				// handle the event
				context.changeFallback(event);
			};
		};
		this.onEndFallback = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// handle the event
				context.endGesture(event);
			};
		};
		// external API
		this.enableDefaultTouch = function () {
			this.cfg.cancelTouch = false;
		};
		this.disableDefaultTouch = function () {
			this.cfg.cancelTouch = true;
		};
		this.enableDefaultGesture = function () {
			this.cfg.cancelGesture = false;
		};
		this.disableDefaultGesture = function () {
			this.cfg.cancelGesture = true;
		};
		// go
		this.start();
	};

	// return as a require.js module
	if (typeof module !== 'undefined') {
		exports = module.exports = useful.Gestures;
	}

})();

/*
	Source:
	van Creij, Maurice (2012). "useful.polyfills.js: A library of useful polyfills to ease working with HTML5 in legacy environments.", version 20121126, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

// public object
var useful = useful || {};

(function(){

	// Invoke strict mode
	"use strict";

	// Create a private object for this library
	useful.polyfills = {

		// enabled the use of HTML5 elements in Internet Explorer
		html5 : function () {
			var a, b, elementsList;
			elementsList = ['section', 'nav', 'article', 'aside', 'hgroup', 'header', 'footer', 'dialog', 'mark', 'dfn', 'time', 'progress', 'meter', 'ruby', 'rt', 'rp', 'ins', 'del', 'figure', 'figcaption', 'video', 'audio', 'source', 'canvas', 'datalist', 'keygen', 'output', 'details', 'datagrid', 'command', 'bb', 'menu', 'legend'];
			if (navigator.userAgent.match(/msie/gi)) {
				for (a = 0 , b = elementsList.length; a < b; a += 1) {
					document.createElement(elementsList[a]);
				}
			}
		},

		// allow array.indexOf in older browsers
		arrayIndexOf : function () {
			if (!Array.prototype.indexOf) {
				Array.prototype.indexOf = function (obj, start) {
					for (var i = (start || 0), j = this.length; i < j; i += 1) {
						if (this[i] === obj) { return i; }
					}
					return -1;
				};
			}
		},

		// allow document.querySelectorAll (https://gist.github.com/connrs/2724353)
		querySelectorAll : function () {
			if (!document.querySelectorAll) {
				document.querySelectorAll = function (a) {
					var b = document, c = b.documentElement.firstChild, d = b.createElement("STYLE");
					return c.appendChild(d), b.__qsaels = [], d.styleSheet.cssText = a + "{x:expression(document.__qsaels.push(this))}", window.scrollBy(0, 0), b.__qsaels;
				};
			}
		},

		// allow addEventListener (https://gist.github.com/jonathantneal/3748027)
		addEventListener : function () {
			!window.addEventListener && (function (WindowPrototype, DocumentPrototype, ElementPrototype, addEventListener, removeEventListener, dispatchEvent, registry) {
				WindowPrototype[addEventListener] = DocumentPrototype[addEventListener] = ElementPrototype[addEventListener] = function (type, listener) {
					var target = this;
					registry.unshift([target, type, listener, function (event) {
						event.currentTarget = target;
						event.preventDefault = function () { event.returnValue = false; };
						event.stopPropagation = function () { event.cancelBubble = true; };
						event.target = event.srcElement || target;
						listener.call(target, event);
					}]);
					this.attachEvent("on" + type, registry[0][3]);
				};
				WindowPrototype[removeEventListener] = DocumentPrototype[removeEventListener] = ElementPrototype[removeEventListener] = function (type, listener) {
					for (var index = 0, register; register = registry[index]; ++index) {
						if (register[0] == this && register[1] == type && register[2] == listener) {
							return this.detachEvent("on" + type, registry.splice(index, 1)[0][3]);
						}
					}
				};
				WindowPrototype[dispatchEvent] = DocumentPrototype[dispatchEvent] = ElementPrototype[dispatchEvent] = function (eventObject) {
					return this.fireEvent("on" + eventObject.type, eventObject);
				};
			})(Window.prototype, HTMLDocument.prototype, Element.prototype, "addEventListener", "removeEventListener", "dispatchEvent", []);
		},

		// allow console.log
		consoleLog : function () {
			var overrideTest = new RegExp('console-log', 'i');
			if (!window.console || overrideTest.test(document.querySelectorAll('html')[0].className)) {
				window.console = {};
				window.console.log = function () {
					// if the reporting panel doesn't exist
					var a, b, messages = '', reportPanel = document.getElementById('reportPanel');
					if (!reportPanel) {
						// create the panel
						reportPanel = document.createElement('DIV');
						reportPanel.id = 'reportPanel';
						reportPanel.style.background = '#fff none';
						reportPanel.style.border = 'solid 1px #000';
						reportPanel.style.color = '#000';
						reportPanel.style.fontSize = '12px';
						reportPanel.style.padding = '10px';
						reportPanel.style.position = (navigator.userAgent.indexOf('MSIE 6') > -1) ? 'absolute' : 'fixed';
						reportPanel.style.right = '10px';
						reportPanel.style.bottom = '10px';
						reportPanel.style.width = '180px';
						reportPanel.style.height = '320px';
						reportPanel.style.overflow = 'auto';
						reportPanel.style.zIndex = '100000';
						reportPanel.innerHTML = '&nbsp;';
						// store a copy of this node in the move buffer
						document.body.appendChild(reportPanel);
					}
					// truncate the queue
					var reportString = (reportPanel.innerHTML.length < 1000) ? reportPanel.innerHTML : reportPanel.innerHTML.substring(0, 800);
					// process the arguments
					for (a = 0, b = arguments.length; a < b; a += 1) {
						messages += arguments[a] + '<br/>';
					}
					// add a break after the message
					messages += '<hr/>';
					// output the queue to the panel
					reportPanel.innerHTML = messages + reportString;
				};
			}
		},

		// allows Object.create (https://gist.github.com/rxgx/1597825)
		objectCreate : function () {
			if (typeof Object.create !== "function") {
				Object.create = function (original) {
					function Clone() {}
					Clone.prototype = original;
					return new Clone();
				};
			}
		},

		// allows String.trim (https://gist.github.com/eliperelman/1035982)
		stringTrim : function () {
			if (!String.prototype.trim) {
				String.prototype.trim = function () { return this.replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, ''); };
			}
			if (!String.prototype.ltrim) {
				String.prototype.ltrim = function () { return this.replace(/^\s+/, ''); };
			}
			if (!String.prototype.rtrim) {
				String.prototype.rtrim = function () { return this.replace(/\s+$/, ''); };
			}
			if (!String.prototype.fulltrim) {
				String.prototype.fulltrim = function () { return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' '); };
			}
		},

		// allows localStorage support
		localStorage : function () {
			if (!window.localStorage) {
				if (/MSIE 8|MSIE 7|MSIE 6/i.test(navigator.userAgent)){
					window.localStorage = {
						getItem: function(sKey) {
							if (!sKey || !this.hasOwnProperty(sKey)) {
								return null;
							}
							return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
						},
						key: function(nKeyId) {
							return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
						},
						setItem: function(sKey, sValue) {
							if (!sKey) {
								return;
							}
							document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
							this.length = document.cookie.match(/\=/g).length;
						},
						length: 0,
						removeItem: function(sKey) {
							if (!sKey || !this.hasOwnProperty(sKey)) {
								return;
							}
							document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
							this.length--;
						},
						hasOwnProperty: function(sKey) {
							return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
						}
					};
					window.localStorage.length = (document.cookie.match(/\=/g) || window.localStorage).length;
				} else {
				    Object.defineProperty(window, "localStorage", new(function() {
				        var aKeys = [],
				            oStorage = {};
				        Object.defineProperty(oStorage, "getItem", {
				            value: function(sKey) {
				                return sKey ? this[sKey] : null;
				            },
				            writable: false,
				            configurable: false,
				            enumerable: false
				        });
				        Object.defineProperty(oStorage, "key", {
				            value: function(nKeyId) {
				                return aKeys[nKeyId];
				            },
				            writable: false,
				            configurable: false,
				            enumerable: false
				        });
				        Object.defineProperty(oStorage, "setItem", {
				            value: function(sKey, sValue) {
				                if (!sKey) {
				                    return;
				                }
				                document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
				            },
				            writable: false,
				            configurable: false,
				            enumerable: false
				        });
				        Object.defineProperty(oStorage, "length", {
				            get: function() {
				                return aKeys.length;
				            },
				            configurable: false,
				            enumerable: false
				        });
				        Object.defineProperty(oStorage, "removeItem", {
				            value: function(sKey) {
				                if (!sKey) {
				                    return;
				                }
				                document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
				            },
				            writable: false,
				            configurable: false,
				            enumerable: false
				        });
				        this.get = function() {
				            var iThisIndx;
				            for (var sKey in oStorage) {
				                iThisIndx = aKeys.indexOf(sKey);
				                if (iThisIndx === -1) {
				                    oStorage.setItem(sKey, oStorage[sKey]);
				                } else {
				                    aKeys.splice(iThisIndx, 1);
				                }
				                delete oStorage[sKey];
				            }
				            for (aKeys; aKeys.length > 0; aKeys.splice(0, 1)) {
				                oStorage.removeItem(aKeys[0]);
				            }
				            for (var aCouple, iKey, nIdx = 0, aCouples = document.cookie.split(/\s*;\s*/); nIdx < aCouples.length; nIdx++) {
				                aCouple = aCouples[nIdx].split(/\s*=\s*/);
				                if (aCouple.length > 1) {
				                    oStorage[iKey = unescape(aCouple[0])] = unescape(aCouple[1]);
				                    aKeys.push(iKey);
				                }
				            }
				            return oStorage;
				        };
				        this.configurable = false;
				        this.enumerable = true;
				    })());
				}
			}
		}

	};

	// startup
	useful.polyfills.html5();
	useful.polyfills.arrayIndexOf();
	useful.polyfills.querySelectorAll();
	useful.polyfills.addEventListener();
	useful.polyfills.consoleLog();
	useful.polyfills.objectCreate();
	useful.polyfills.stringTrim();
	useful.polyfills.localStorage();

	// return as a require.js module
	if (typeof module !== 'undefined') {
		exports = module.exports = useful.polyfills;
	}

})();

/*
	Source:
	van Creij, Maurice (2013). "useful.hero.js: Slideshow Banner", version 20130814, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

// public object
var useful = useful || {};

(function(){

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
			var slides = this.cfg.slides;
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
			// allow the interval slides afterwards
			clearTimeout(this.cfg.autoTimeout);
			this.cfg.autoTimeout = (this.cfg.interval > 0) ? setTimeout(function () { _this.loopPage(); }, this.cfg.interval) : null;
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

	// return as a require.js module
	if (typeof module !== 'undefined') {
		exports = module.exports = useful.Hero;
	}

})();
