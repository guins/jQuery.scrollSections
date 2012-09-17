# jQuery Scroll Sections Plugin (Version 0.2)

A plugin that allow you to define (full page) sections and scroll between them with mousewheel,keyboard,scrollbar and touchmouves

Here is a very simple [demo](http://lab.stephaneguigne.com/js/jquery-scrollsections/)


## Requirement (for a full support)

This plugin requires 2 other scripts, if you don't already have them in your project : 
- [scrollstart and scrollstop custom events](http://james.padolsey.com/demos/scrollevents/scroll-startstop.events.jquery.js) by [James Padolsey](http://james.padolsey.com)
- [mousewhell jQuery Plugin](http://james.padolsey.com/demos/scrollevents/scroll-startstop.events.jquery.js) by [Brandon Aaron](http://brandonaaron.net/)


## Examples

Here is a basic exemple

	// minimum
	$('.my_sections').scrollsections();

Here is a full options exemple

	// full options
	$('.my_sections').scrollsections(
	{
		attr 					: 'id',     // selected attribute to get a unique id for each section (for exemple : data-role)
        bindKeyboard            : true,     // Unable keybord to control navigation
        bindMousewheel          : true,     // Unable mousewheel to control navigation
        bindTouchMoves          : true,     // Unable touchmouves to control navigation
        bindScrollBar           : true,     // Unable scroolbar to control navigation
        animateSpeed            : 500,      // Animation speed in ms
		scrollStepMax 			: 1,        // Maximum number of sections to scroll by within mousewheel interaction 
		beforeScrollCallback 	: null,     // A function to call before each scroll
		afterScrollCallback 	: null,     // A function to call after each scroll
        prefixName              : 'scrollsections', // Prefix name for class and id for dom elements handling by the plugin
		initOnChosenSection 	: null,     // Scrool to a custom section on init (Number or Id of the first section)
        initAnimation           : false,    // Scroll to the initial section whitout animation
        initOnFirstSection      : true,     // Scroll to the first section on init
        createNavigation        : true,     // Create a navigation
        navigationPosition      : "r",      // Position of the navigation to fix appearance (null if you don't want to)
        debugMode               : false
	});


## Cross-browser Compatibility

Chrome/Firefox/Safari and IE7+


## License

Feel free to use it, just leave my copyright.

Copyright (c) 2011 [Stéphane Guigné](http://stephaneguigne.com)
