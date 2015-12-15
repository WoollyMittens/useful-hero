# useful.hero.js: Slideshow Banner

A simple responsive slideshow for graphical banners with touch controls.

Try the <a href="http://www.woollymittens.nl/useful/default.php?url=useful-hero">demo</a>.

## How to include the script

The stylesheet is best included in the header of the document.

```html
<link rel="stylesheet" href="./css/useful-hero.css"/>
```

This include can be added to the header or placed inline before the script is invoked.

```html
<script src="./js/useful-hero.js"></script>
```

To enable the use of HTML5 tags in Internet Explorer 8 and lower, include *html5.js*.

```html
<!--[if lte IE 9]>
	<script src="//html5shiv.googlecode.com/svn/trunk/html5.js"></script>
<![endif]-->
```

## How to start the script

```javascript
var hero = new useful.Hero().init({
	'element' : document.getElementById('heroExample'),
	'imageslice' : 'php/imageslice.php?src=../{src}&width={width}',
	'maxHeight' : 360,
	'overscan' : 1,
	'interval' : 8000,
	'slides' : [
		{'src' : './img/photo_0a.jpg', 'url' : 'http://www.google.com/', 'event' : function (evt) { console.log('[hero] slide 1'); evt.preventDefault(); }},
		{'src' : './img/photo_2a.jpg', 'url' : 'http://www.bing.com/', 'event' : function (evt) { console.log('[hero] slide 3'); evt.preventDefault(); }},
		{'src' : './img/photo_9a.jpg', 'url' : 'http://www.yahoo.com/', 'event' : function (evt) { console.log('[hero] slide 5'); evt.preventDefault(); }}
	]
});
```

**imageslice : {url}** - A web-service able to resize images while preserving the aspect ratio.

**maxHeight : {integer}** - The maximum amount of vertical space the slideshow may occupy.

**overscan : {float}** - The fraction of the image that can safely stick outside the edge of the screen.

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
+ `gulp prod` - Builds the project for deployment purposes.
+ `gulp watch` - Continuously recompiles updated files during development sessions.
+ `gulp serve` - Serves the project on a temporary web server at http://localhost:8000/ .

## License

This work is licensed under a Creative Commons Attribution 3.0 Unported License. The latest version of this and other scripts by the same author can be found at http://www.woollymittens.nl/
