# hero.js: Slideshow Banner

A simple responsive slideshow for graphical banners with touch controls.

Try the <a href="http://www.woollymittens.nl/default.php?url=useful-hero">demo</a>.

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

Or import into an MVC framework.

```js
var Gestures = require('lib/gestures.js');
var Hero = require('js/imagefallback.js');
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

## How to build the script

This project uses node.js from http://nodejs.org/

This project uses gulp.js from http://gulpjs.com/

The following commands are available for development:
+ `npm install` - Installs the prerequisites.
+ `gulp import` - Re-imports libraries from supporting projects to `./src/libs/` if available under the same folder tree.
+ `gulp dev` - Builds the project for development purposes.
+ `gulp dist` - Builds the project for deployment purposes.
+ `gulp watch` - Continuously recompiles updated files during development sessions.
+ `gulp serve` - Serves the project on a temporary web server at http://localhost:8500/.
+ `gulp php` - Serves the project on a temporary php server at http://localhost:8500/.

## License

This work is licensed under a [MIT License](https://opensource.org/licenses/MIT). The latest version of this and other scripts by the same author can be found on [Github](https://github.com/WoollyMittens) and at [WoollyMittens.nl](https://www.woollymittens.nl/).
