# hero.js: Slideshow Banner

*DEPRICATION WARNING: the functionality in this script has been superceeded / trivialised by updated web standards.*

A simple responsive slideshow for graphical banners with touch controls.

## How to include the script

The stylesheet is best included in the header of the document.

```html
<link rel="stylesheet" href="css/hero.css"/>
```

This include can be added to the header or placed inline before the script is invoked.

```html
<script src="lib/gestures.js"></script>
<script src="js/hero.js"></script>
```

Or use [Require.js](https://requirejs.org/).

```js
requirejs([
	'lib/gestures.js',
	'js/hero.js'
], function(Gestures, Hero) {
	...
});
```

Or use imported as a component in existing projects.

```js
@import {Gestures = require('lib/gestures.js";
@import {Hero} from "js/imagefallback.js";
```

## How to start the script

```javascript
var hero = new Hero({
	'element' : document.getElementById('heroExample'),
	'imageslice' : 'php/imageslice.php?src={src}&width={width}',
	'interval' : 8000,
	'slides' : [
		{'src' : './img/photo_0a.jpg', 'url' : 'http://www.google.com/', 'event' : function (evt) { console.log('[hero] slide 1'); evt.preventDefault(); }},
		{'src' : './img/photo_2a.jpg', 'url' : 'http://www.bing.com/', 'event' : function (evt) { console.log('[hero] slide 3'); evt.preventDefault(); }},
		{'src' : './img/photo_9a.jpg', 'url' : 'http://www.yahoo.com/', 'event' : function (evt) { console.log('[hero] slide 5'); evt.preventDefault(); }}
	]
});
```

**imageslice : {url}** - A web-service able to resize images while preserving the aspect ratio (example provided).

**interval : {integer}** - Amount of milliseconds between slides.

**slides : {array}** - Collection of slides.
+ **src : {string}** - Source of the image.
+ **url : {string}** - Destination of the link.
+ **event : {function}** - Click handler of the link.

## License

This work is licensed under a [MIT License](https://opensource.org/licenses/MIT). The latest version of this and other scripts by the same author can be found on [Github](https://github.com/WoollyMittens).
