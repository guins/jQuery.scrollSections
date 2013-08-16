;(function ($, window, Math, undefined) {
	'use strict';

	/**
	 * The name of this jQuery plugin.
	 *
	 * @type String
	 */
	var pluginName = 'scrollSections';

	/**
	 * The default options of this plugin.
	 *
	 * @type Object
	 */
	var defaults = {
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
		before: null,
		// Function to execute after each scroll.
		after: null,
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
	};

	/**
	 * Catchable exception if something goes wrong.
	 *
	 * @param {String} message
	 *   A message describing what went wrong.
	 * @returns {ScrollSectionsException}
	 */
	function ScrollSectionsException(message) {
		this.name = 'ScrollSectionsException';
		this.message = message;
	}

	/**
	 * Instantiate new instance of the scrollSections plugin.
	 *
	 * @param {jQuery} elements
	 *   The DOM elements that make up our sections.
	 * @param {Object} options
	 *   [Optional] Overwrite default options of the plugin.
	 * @returns {Plugin}
	 */
	var Plugin = function(elements, options) {
		this.elements = elements;
		this.options = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this._$window = $(window);
		this._$htmlBody = $('html, body');
		this._$body = $('body');
		this._sections = elements.length;
		this._$sections = [];
		this._sectionIdentifiers = [];
		this._delayFirstScroll = null;
		this._$previousSection = null;
		this._$currentSection = null;
		this._currentStep = 0;
		this._isFirstSection = true;
		this._isAnimated = false;
		this._wheelDelay = null;
		this._scrollPaused = false;
		this._$nav = null;
		this._ltIE9 = false;

		// Enough properties, start!
		this.init();
	};

	Plugin.prototype = {

		/**
		 * Create navigation.
		 *
		 * @returns {Plugin}
		 */
		createNavigation: function () {
			// Only continue if we are supposed to listen on the navigation (otherwise creating it makes no sense).
			if (this.options.navigation) {
				// Create the navigation DOM element.
				this._$nav = $('<nav>', { id: this.options.prefix + '-navigation' });

				// Add links to each section to the navigation.
				for (var i = 0; i < this._sections; i++) {
					this._$nav.append($('<a>', {
						id: this.options.prefix + '-menuitem-' + i,
						'class': this.options.prefix + '-menuitem',
						href: '#' + this._sectionIdentifiers[i],
						html: 'Section ' + i
					}));
				}

				// Append the newly created navigation to the body of the DOM.
				this._$body.append(this._$nav);
			}

			return this;
		},

		/**
		 * Initialize event listeners for the navigation's menuitems.
		 *
		 * @returns {Plugin}
		 */
		navigation: function () {
			var self = this;

			// If we have no navigation, try to get one.
			if (this._$nav === null) {

				// The user wants us to create it for him, no problem.
				if (this.options.createNavigation) {
					this.createNavigation();
					this.options.createNavigation = false;

					// Add the sections index to each menuitem.
					this._$nav._$menuitems = $('a', this._$nav).each(function (index) {
						var $this = $(this);

						// If this menuitem is the currently active one, add the class so our CSS knows about this as well.
						if (index === self._currentStep) {
							$this.addClass(self.options.active);
						}

						$this.data(self.options.prefix, index);
					});
				}
				// Navigation is already present in the DOM, try to get it.
				else {
					this._$nav = $('#' + this.options.prefix + '-navigation');
					this._$nav._$menuitems = $('a', this._$nav).each(function(){
						var $this = $(this),
							sectionIndex = self._sectionIdentifiers.indexOf($this.attr('href').substr(1));
						if(sectionIndex===self._currentStep){
							$this.addClass(self.options.active);
						}
						// assign section index to menu item
						$this.data(self.options.prefix, sectionIndex);
					});
				}
			}

			// Well, do we have a navigation now?
			if (this._$nav != null && this._$nav.length > 0) {
				this._$nav._$menuitems.click(function (event) {
					var $this = $(this),
						sectionIndex = parseInt($this.data(self.options.prefix), 10);

					event.preventDefault();
					self._$nav._$menuitems.removeClass(self.options.active);
					$this.addClass(self.options.active);
					if(sectionIndex>=0){
						self.customScrollTo(parseInt($this.data(self.options.prefix), 10));
					}
					else if(self.options.exceptions){
						throw new ScrollSectionsException('Section not find for this menu item, make sure the href is the same as the section id');
					}

					return false;
				});
			}

			return this;
		},

		/**
		 * Initialize scrollbar event listener.
		 *
		 * @returns {Plugin}
		 */
		scrollbar: function () {
			var self = this;

			// Check if the jQuery special events are present.
			if (!$.event.special.scrollstop) {
				if (this.options.exceptions) {
					throw new ScrollSectionsException('The jQuery special events scrollstop plugin is missing.');
				} else {
					return this;
				}
			}

			this._$window.bind('scrollstop', function (event) {
				var scrollTop = self._$htmlBody.scrollTop() || self._$window.scrollTop();
				var diff = self._$htmlBody.outerHeight();
				var nextStep;
				var diffTmp;

				self._scrollPaused = false;
				if (scrollTop === 0 && self._currentStep !== 0) {
					nextStep = 0;
				} else if ((scrollTop === (self._sections - 1) * self._$window.height()) && self._currentStep !== (self._sections - 1)) {
					nextStep = self._sections - 1;
				} else {
					for (var i = 0; i < self._sections; i++) {
						diffTmp = Math.abs(scrollTop - self._$sections[i].offset().top);
						if (!diff || diffTmp <= diff) {
							diff = diffTmp;
							nextStep = i;
							// Already scrolled!
							if (diff === 0) {
								return;
							}
						}
					}
				}
				if (nextStep > -1) {
					self.customScrollTo(nextStep);
				}
			});

			return this;
		},

		/**
		 * Initialize touch event listener.
		 *
		 * @returns {Plugin}
		 */
		touch: function () {
			var self = this;

			this._$body.bind('touchstart', function (event) {
				var startEvent = event;

				event.preventDefault();
				self._$body.bind('touchmove', function (event) {
					var diff = { x: startEvent.clientX - event.clientX, y: startEvent.clientY - event.clientY };
					var nextStep;
					event.preventDefault();
					if ((diff.y <= -100 || diff.y >= 100) && Math.abs(diff.y) > Math.abs(diff.x)) {
						nextStep = diff.y < 0 ? self._currentStep - 1 : self._currentStep + 1;
						self.customScrollTo(nextStep);
					}
					return false;
				});

				return false;
			});

			return this;
		},

		/**
		 * Initialize keyboard event listener.
		 *
		 * @returns {Plugin}
		 */
		keyboard: function () {
			var self = this;

			this._$htmlBody.keydown(function (event) {
				var nextStep;
				switch (event.which) {
					case 33: // page up
					case 36: // pos 1
						event.preventDefault();
						self.customScrollTo(0);
						return false;

					case 34: // page down
					case 35: // end
						event.preventDefault();
						self.customScrollTo(self._sections - 1);
						return false;

					case 38: // up
						event.preventDefault();
						nextStep = self._currentStep - 1;
						if (nextStep >= 0) {
							self.customScrollTo(nextStep);
						}
						return false;

					case 40: // down
						event.preventDefault();
						nextStep = self._currentStep + 1;
						if (nextStep < self._sections) {
							self.customScrollTo(nextStep);
						}
						return false;
				}
			});

			return this;
		},

		/**
		 * Call any callbacks that the user defined (before or after)
		 *
		 * @param {Boolean} before
		 *   Set to true if the before callback should be called.
		 * @returns {Plugin}
		 */
		scrollCallback: function (before) {
			this._isAnimated = before || false;

			if (before && this.options.before) {
				this.options.before(this._$previousSection, this._$currentSection);
			} else if (!before && this.options.after) {
				this.options.after(this._$currentSection, this._$previousSection);
			}

			return this;
		},

		/**
		 * Scroll to the section identified by given index.
		 *
		 * @param {Number} index
		 *   The index of the section to which we should scroll.
		 * @param {Boolean} noAnimation
		 *   Set to true if there should be no animation at all.
		 * @returns {Plugin}
		 */
		customScrollTo: function (index, noAnimation) {
			var self = this;
			var yTo;
			var speed;

			if (index != null && index >= 0 && index < this._sections) {
				this._currentStep = index;

				this._$previousSection = this._$currentSection;
				this._$currentSection = this._$sections[index];

				yTo = this._$currentSection.offset().top;
				speed = noAnimation ? 0 : this.options.speed;

				// Mark any link on the page that refers to our active section active.
				if (this._$nav) {
					this._$nav._$menuitems.removeClass(this.options.active);
					$('a[href="#' + this._sectionIdentifiers[index] + '"]', this._$nav).addClass(this.options.active);
				}

				// Call the before callback, stop any ongoing animation and animate to our current new section.
				this.scrollCallback(true);
				// Using deferred object otherwise callback happens twice because we are animating 2 jQuery objects for cross-browser compatibiity
				$.when(
					this._$htmlBody.stop(true, false).animate({ scrollTop: yTo }, speed)
				).done(function(){
					// Call the after callback
					self.scrollCallback();
				});
			}

			return this;
		},

		/**
		 * Helper method for the mousewheel.
		 *
		 * @param {Number} index
		 *   The index of the section to which we should scroll.
		 * @returns {Plugin}
		 */
		mousewheelScrollTo: function (index) {
			this.customScrollTo(index);
			this._wheelDelay = null;
			this._scrollPaused = true;
			return this;
		},

		/**
		 * Initialize mousewheel event listener.
		 *
		 * @returns {Plugin}
		 */
		mousewheel: function () {
			var self = this;

			// No support for broken clients!
			if (this._ltIE9) {
				// Throwing an exception allows the user to catch and do something with it (e.g. display an alert message to the
				// user).
				if (this.options.exceptions) {
					throw new ScrollSectionsException('Cannot bind mousewheel on broken client.');
				}
				// Silently do nothing.
				else {
					return this;
				}
			}

			// Check if the jQuery mousewheel plugin is present.
			if (!$.fn.mousewheel) {
				if (this.options.exceptions) {
					throw new ScrollSectionsException('The jQuery mousewheel plugin is missing.');
				} else {
					return this;
				}
			}

			this._$window.mousewheel(function (event, delta, deltaX, deltaY) {
				var stepDiff = null;
				var nextStep = -1;

				event.preventDefault();

				// Only scroll if we are not animating and scrolling is not paused.
				if (!(self._isAnimated && self._scrollPaused)) {

					deltaY = deltaY>>0; // Because steps numbers are integers

					// Scroll Down
					if (deltaY < 0) {

						// Only allow the user to scroll down the maximum sections as defined in our options.
						if (deltaY < -self.options.scrollMax) {
							deltaY = -self.options.scrollMax;
						}

						if ((!nextStep || !stepDiff || deltaY < stepDiff) && ((self._currentStep - deltaY) < self._sections)) {
							stepDiff = deltaY;
							nextStep = self._currentStep - stepDiff;
						}
					}
					// Scroll Up
					else {

						// Only allow the user to scroll up the maximum sections as defined in our options.
						if (deltaY > self.options.scrollMax) {
							deltaY = self.options.scrollMax;
						}

						if ((!nextStep || !stepDiff || deltaY > stepDiff) && ((self._currentStep - deltaY) > -1)) {
							stepDiff = deltaY;
							nextStep = self._currentStep - stepDiff;
						}
					}

					if (stepDiff && nextStep > -1) {
						if (self._wheelDelay) {
							clearTimeout(self._wheelDelay);
						}

						if (Math.abs(stepDiff) < self.options.scrollMax) {
							self._wheelDelay = setTimeout(function () {
								self.mousewheelScrollTo(nextStep);
							}, 10);
						} else {
							self.mousewheelScrollTo(nextStep);
						}
					}
				}

				return false;
			});

			return this;
		},

		/**
		 * Initialize our plugin.
		 *
		 * @returns {Plugin}
		 */
		init: function () {
			/**
			 * Keep reference to our plugin instance.
			 *
			 * @type {Plugin}
			 */
			var self = this;

			// Only continue if we have any sections to compute.
			if (this._sections > 0) {

				// Loop over all DOM elements with which our plugin was initialized and fill our arrays.
				this.elements.each(function (index) {
					// Cache jQuery Object creation.
					var $section = $(this);
					var windowScrollTop = self._$window.scrollTop();
					var offset;

					self._$sections[index] = $section;
					self._sectionIdentifiers[index] = $section.attr(self.options.attr);

					if (self.options.alwaysStartWithFirstSection === true && index === 0) {
						$section.addClass(self.options.active);
						self._$currentSection = $section;
						self.customScrollTo(0, !self.options.animateScrollToFirstSection);
					} else {
						offset = $section.offset();
						offset.bottom = offset.top + $section.height();

						// Check which section is active and change the current section plus trigger active state.
						if (windowScrollTop >= offset.top && windowScrollTop < offset.bottom) {
							$section.addClass(self.options.active);
							self._currentStep = index;
							self._$currentSection = $section;
							if (windowScrollTop !== offset.top) {
								self.customScrollTo(index);
							}
						}
					}
				});

				// Check if we are working if a broken client.
				if ((new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})')).exec(window.navigator.userAgent) && (parseFloat(RegExp.$1) <= 8.0)) {
					this._ltIE9 = true;
				}

				// Execute each control initializer that was set to true.
				for (var o in this.options) {
					if (this.options[o] === true && typeof this[o] === 'function') {
						this[o]();
					}
				}

				// Bind to resize event and keep the current section always within the viewport.
				this._$window.resize(function () {
					self.customScrollTo(self._currentStep);
				});
			}

			return this;
		}

	};

	/**
	 * Lightweight wrapper around our constructor, prevent multiple instantiation of our plugin.
	 *
	 * @param {Object} options
	 *   [Optional] Overwrite the default options of the scrollSections plugin.
	 * @returns {jQuery}
	 */
	$.fn[pluginName] = function (options) {
		// Only create a new instance if none has been registered so far.
		if (!$.data(this, 'plugin_' + pluginName)) {
			$.data(this, 'plugin_' + pluginName, new Plugin(this, options));
		}

		return this;
	};

})(jQuery, window, Math);