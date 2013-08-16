# jQuery Scroll Sections Plugin (Version 0.4.3)

A plugin that allows you to define (full page) sections and scroll between them with mousewheel, keyboard, scrollbar and/or touch moves.

Here is a very simple [demo](http://lab.stephaneguigne.com/js/jquery-scrollsections/example/callbacks.html)


## Requirement (for a full support)

The following jQuery plugins are required for this plugin to work properly:
- [scrollstart and scrollstop custom events](http://james.padolsey.com/demos/scrollevents/scroll-startstop.events.jquery.js) by [James Padolsey](http://james.padolsey.com)
- [mousewhell jQuery Plugin](https://github.com/brandonaaron/jquery-mousewheel) by [Brandon Aaron](http://brandonaaron.net/)


## Examples

Here is a basic example

	$('.my_sections').scrollSections();

Here is a example with custom navigation (full implementation in ./example/customNavigation.html)

	$('.my_sections').scrollSections({
		createNavigation: false,
		navigation: true
	});	

Here is a full options example

	$('.my_sections').scrollSections(
	{
        // Attribute from which we retrieve the unique identifier for each section.
		attr: 'id',
		// The class that should be applied to the current navigation item.
		active: 'active-scrollsection',
		// Enable keyboard controls.
		keyboard: true,
		// Enable mousehweel controls.
		mousewheel: true,
		// Enable touch controls.
		touch: true,
		// Enable scrollbar controls.
		scrollbar: true,
		// Enable navigation controls, also see createNavigation option.
		navigation: true,
		// Maximum sections to scroll within mousewheel interaction.
		scrollMax: 1,
		// Function to execute before each scroll.
		// $currentSection [jQuery object] - the current visible section
		// $nextSection [jQuery object] - the futur selected section
		before: function($currentSection, $nextSection){},
		// Function to execute after each scroll.
		// $currentSection [jQuery object] - the current visible section
		// $previousSection [jQuery object] - the previous section
		after: function($currentSection, $previousSection){},
		// Prefix for classes and ids of DOM elements.
		prefix: 'scrollsections',
		// Scroll to first section on initialization, instead of the section that is visible. Also have a look at the option
		// animateScrollToFirstSection.
		alwaysStartWithFirstSection: false,
		// Scroll to initial section without animation.
		animateScrollToFirstSection: false,
		// Create navigation? If the option navigation is set to false, this will have no effect!
		createNavigation: true,
		// The animation speed.
		speed: 500,
		// Throw execption if something goes wrong.
		exceptions: false
	});


## Cross-browser Compatibility

Modern browsers: Chrome, Firefox, Safari, Opera and IE8+


## License

Under [MIT license](http://opensource.org/licenses/MIT)


Copyright(c) 2011-2013 [Stéphane Guigné](http://stephaneguigne.com)


## Logs

v0.4.3 - send back arguments to callback functions 