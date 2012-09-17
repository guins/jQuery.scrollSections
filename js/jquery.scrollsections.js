/* ------------------------------------------------------------------------------------------------------
| jQuery Scrollsections Plugin
| -------------------------------------------------------------------------------------------------------
| 
| A plugin that allow you to define (full page) sections and scroll between them with mousewheel,keyboard,scrollbar and touchmouves
|
| /!\ REQUIRES : MouseWheel jQuery Plugin, https://github.com/brandonaaron/jquery-mousewheel 
| /!\ REQUIRES : jQuery Special Events scrollstart & scrollstop, http://james.padolsey.com/demos/scrollevents/ 
|
| Version : 0.2
| author : Stéphane Guigné (http://stephaneguigne.com)
|
*/
;(function($) 
{
    $.fn.scrollsections = function(options) {
        var defaults = {
        		attr                  : 'id',     // selected attribute to get a unique id for each section (for exemple : data-role)
                bindKeyboard            : true,     // Unable keybord to control navigation
                bindMousewheel          : true,     // Unable mousewheel to control navigation
                bindTouchMoves          : true,     // Unable touchmouves to control navigation
                bindScrollBar           : true,     // Unable scroolbar to control navigation
                animateSpeed            : 500,      // Animation speed in ms
                scrollStepMax           : 1,        // Maximum number of sections to scroll by within mousewheel interaction 
                beforeScrollCallback    : null,     // A function to call before each scroll
                afterScrollCallback     : null,     // A function to call after each scroll
                prefixName              : 'scrollsections', // Prefix name for class and id for dom elements handling by the plugin
                initOnChosenSection     : null,     // Scrool to a custom section on init (Number or Id of the first section)
                initAnimation           : false,    // Scroll to the initial section whitout animation
                initOnFirstSection      : true,     // Scroll to the first section on init
                createNavigation        : true,     // Create a navigation
                navigationPosition      : "r",      // Position of the navigation to fix appearance (null if you don't want to)
                debugMode               : false
        	},
        	s,
        	_window				= $(window),
            _bodyHtml           = $('body, html'),
        	_body          		= $('body'),
        	_nbSections 		= 0,
        	_sectionsArray 		= [],
        	_sectionsIdsArray 	= [],
        	_delayFirstScroll 	= null,
        	_currentSection 	= null,
        	_currentStep 		= 0,
        	_isFirstSection   	= true,
            _isAnimated         = false,
            _wheelDelay         = null,
            _scroolPaused       = null,
            _nav                = null,
            _isIE8orLater       = false;
        
        s = $.extend(defaults,options);

        this.each(function() {
            var $section = $(this);

            if(_isFirstSection) {
            	_isFirstSection = false;
            	$section.addClass( s.currentClassName );
        		_currentSection = $section;
        	}

            _nbSections++;
            _sectionsArray.push( $section );
            _sectionsIdsArray.push( $section.attr(s.attr) );
        });

        if(_nbSections>0)
        	_init();

        /*
        | Initialisation of the plugin
        | 
        */
        function _init()
        {
            var reg = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if ( (reg.exec(window.navigator.userAgent) != null) && (parseFloat( RegExp.$1)<=8.0) )
                _isIE8orLater = true;

        	_controls_initAll();

            if(s.createNavigation)
                _navigation_create();

            if(s.initOnFirstSection && !s.initOnChosenSection)
        	   _scroll_initDefault();
        	else if(s.initOnChosenSection)
        		_scroll_initCustom(s.initOnChosenSection);

            _window.bind("resize.scrollsections", function()
            {
                _scroll_doScroll(_currentStep);
            });
        }

        /* ---------------------------------------------------------------------------------
        |   NAVIGATION
        | ----------------------------------------------------------------------------------
        |
        |   On demand navigation
        |
        */

        /*
        | Navigation : Create the navigation menu
        | 
        */
        function _navigation_create()
        {
            _nav = $('<nav>')
                        .attr('id',s.prefixName+'-navigation');

            for(var i=0; i<_nbSections; i++)
            {
                $link = $('<a>')
                            .attr('id',s.prefixName+'-link-'+i)
                            .addClass(s.prefixName+'-link')
                            .data(s.prefixName,{
                                sectionPosition : i
                            })
                            .html('Section '+i);


                _nav.append($link);
            }

            _body.append(_nav);

            if(s.navigationPosition)
                _navigation_fixAppearance(s.navigationPosition);

            _navigation_manageEvents(true);
        }

        /*
        | Navigation : Fix appearance of the navigation menu
        |
        | Optional function to apply some css properties on navigation
        |
        | 
        */
        function _navigation_fixAppearance(position)
        {
            var props = {};

            switch(position)
            {
                case "r" || "right" : 
                    props = { marginTop : -_nav.outerHeight()/2 +"px" };
                    break;
            }
            _nav.css(props);
        }

        /*
        | Navigation : Manage links events
        |
        | Manage click event and current class
        |
        | 
        */
        function _navigation_manageEvents(isInit)
        {
            var $links = $('.'+s.prefixName+'-link', _nav),
                currentClassName = s.prefixName+'-link-current';

            if(isInit)
            {
                $links
                    .bind("click", function(event)
                    {
                        event.preventDefault(s.prefixName);

                        var $clicked = $(this),
                            data = $clicked.data(),
                            nextStep = data[s.prefixName]["sectionPosition"];

                        _scroll_doScroll(nextStep);
                    });
            }

            $links.removeClass(currentClassName);

            $links.each(function()
            {
                var $link = $(this),
                    data = $link.data(),
                    linkedStep = data[s.prefixName]["sectionPosition"];

                if(_currentStep==linkedStep)
                {   
                    $link.addClass(currentClassName);
                    return false;
                }
            });


        }

        /* ---------------------------------------------------------------------------------
        |	CONTROLS
        | ----------------------------------------------------------------------------------
        |
        |	Init all scroll controls, including mousewheel, keyboard and touchmoves
		|
        */
        function _controls_initAll()
        {
            if(s.bindScrollBar) _controls_initScrollBar();
        	if(s.bindMousewheel && !_isIE8orLater) _controls_initWheel();
        	if(s.bindKeyboard) _controls_initKeyboard();
        	if(s.bindTouchMoves) _controls_initTouch();
        }

        /*
        | Controls : Init ScrollBar events
        |
        | Unable scrollbar to control the scroll
        |
        | 
        */
        function _controls_initScrollBar()
        {
            _window.bind("scrollstop.scrollsections", function(event)
            {
                var scrollTop = _bodyHtml.scrollTop() || _window.scrollTop(),
                    diff = _bodyHtml.outerHeight(),
                    nextStep;

                if(scrollTop==0 && _currentStep!=0)
                {
                    nextStep = 0;
                }
                else if( (scrollTop==(_nbSections-1)*_window.height()) && _currentStep!=_nbSections-1)
                {
                    nextStep = _nbSections-1;
                }
                else
                {
                     for(var i=0; i<_nbSections; i++)
                    {
                        var section = _sectionsArray[i],
                            posY = section.offset().top,
                            diffTmp = Math.abs(scrollTop-posY);

                        if(!diff || diffTmp<=diff) 
                        {
                            diff = diffTmp;
                            nextStep = i;
                            
                            if(diff==0) // already scrolled
                                return;
                        }
                    }
                }

                if(nextStep>-1)
                    _scroll_doScroll(nextStep);
            });
        }

        /*
        | Controls : Init MouseWheel events
        |
        | Unable mousewheel to control the scroll
        |
        | 
        */
        function _controls_initWheel()
        {
            var stepDiff,
                nextStep = -1;

             _window.bind("scrollstop.scrollsections", function(event)
            {
                _scroolPaused=null;
            });

        	_window.bind("mousewheel", function(event, delta, deltaX, deltaY) {
                
                event.preventDefault();

                var stepDiffTemp = deltaY>>0;

                if(!_isAnimated && !_scroolPaused)
                {
                   if(deltaY < 0)
                    {
                        if(stepDiffTemp < -s.scrollStepMax)
                            stepDiffTemp = -s.scrollStepMax;
                        if(!nextStep || !stepDiff || stepDiffTemp<stepDiff)
                        {
                            if((_currentStep - stepDiffTemp) < _nbSections)
                            {
                                stepDiff = stepDiffTemp;
                                nextStep = _currentStep - stepDiff;
                            }
                                
                        }
                    }
                    else
                    {
                        if(stepDiffTemp > s.scrollStepMax)
                            stepDiffTemp = s.scrollStepMax;
                        if(!nextStep || !stepDiff || stepDiffTemp>stepDiff)
                        {
                            if(_currentStep - stepDiffTemp > -1)
                            {
                                stepDiff = stepDiffTemp;
                                nextStep = _currentStep - stepDiff;
                            }       
                        }
                    } 

                    if(stepDiff && nextStep>-1)
                    {
                        if(_wheelDelay)
                            clearTimeout(_wheelDelay);

                        if(Math.abs(stepDiff)<s.scrollStepMax)
                        {
                            _wheelDelay = setTimeout(function()
                            {
                                _scroll_doScroll(nextStep);
                                nextStep = null;
                                stepDiff = null;
                                _wheelDelay = null;
                                _scroolPaused = true;
                            },10);
                        }
                        else
                        {
                            _scroll_doScroll(nextStep);
                            nextStep = null;
                            stepDiff = null;
                            _wheelDelay = null;
                            _scroolPaused = true;
                        }
                    }
                }

                return false;
            });
        }

        /*
        | Controls : Init keyboard events
        |
        | Unable keyboard to control the scroll
        |
        | 
        */
        function _controls_initKeyboard()
        {
            _bodyHtml.bind("keydown.scrollsections", function(event)
            {
                var _getActiveIndex;
                switch(event.which) {
                    case 38: // up
                        var nextStep = _currentStep-1;
                        if(nextStep>=0)
                            _scroll_doScroll(nextStep);
                        event.preventDefault();
                        return false;
                    break;
                    case 40: // down
                        var nextStep = _currentStep+1;
                        if(nextStep<_nbSections)
                            _scroll_doScroll(nextStep);
                        event.preventDefault();
                        return false;
                    break;
                } 
            });
        }

        /*
        | Controls : Init touch events
        |
        | Unable touch events to control the scroll
        |
        | 
        */
       	function _controls_initTouch()
        {
            _body
                .unbind('touchstart.scrollsections')
                .bind('touchstart.scrollsections', function(event)
                {
                    event.preventDefault();

                    var start = { x : event.clientX, y : event.clientY },
                        stop = { x : event.clientX, y : event.clientY },
                        diffY, 
                        diffX, 
                        direction;
                    
                    _body.bind('touchmove.scrollsections', function(event)
                    {
                        event.preventDefault();

                        stop.x = event.clientX;
                        stop.y = event.clientY;
                        diffX = start.x-stop.x;
                        diffY = start.y-stop.y;

                        if( (diffY<=-100 || diffY>=100) && Math.abs(diffY)>Math.abs(diffX) )
                        {
                            _body.unbind('touchmove.LRSlider');

                            var nextStep = diffY<0 ? _currentStep-1 : _currentStep+1;
                            _scroll_doScroll(nextStep);
                        }
                    });
                })
                .unbind('touchend.scrollsections')
                .bind('touchend.scrollsections', function()
                {
                    _body.unbind('touchmove.LRSlider');
                });
        }

        /* ---------------------------------------------------------------------------------
        |	SCROLL
        | ----------------------------------------------------------------------------------
        |
        |	Manage all scroll activity : init, before, during, after
		|
        */
        
        /*
        | Scroll : Default initialisation of the scroll
        |
        | It will scroll to the first section if the initOnFirstSection options is set to true
        |
        | 
        */
        function _scroll_initDefault()
        {
        	_delayFirstScroll = setTimeout(function()
        	{
        		_scroll_doScroll(0,!s.initAnimation);
        	}, 50);
        }

        /*
        | Scroll : Custom initialisation of the scroll
        |
        | It will scroll to the chosen section if the initOnChosenSection options is a valid id or number of section
        |
        | 
        | @chosenSection (String) - the id of one of the sections
        | OR
        | @chosenSection (Number) - the section position
        |
        */
        function _scroll_initCustom(chosenSection)
        {
        	var nextStep;
        	
        	if( !isNaN(chosenSection) && chosenSection>=0 && chosenSection<_nbSections )
        	{
        		nextStep = chosenSection;
        	}
        	else if ( isNaN(chosenSection) && (_sectionsIdsArray.join(',').indexOf(chosenSection)>-1) ) {
        		for (var i = 0; i < _sectionsIdsArray.length; i++) {
        			if(chosenSection == _sectionsIdsArray[i])
        				nextStep = i;
        		};
        	}
        	else {
        		//throw 'The initial section is incorrect, by default it will be the first section';
                return false;
        	}

            if(nextStep)
            {
                if(_delayFirstScroll)
                    clearTimeout(_delayFirstScroll);

                _scroll_doScroll(nextStep,!s.initAnimation);   
            }
        }

        /*
        | Scroll : Before the scroll
        |
        | All actions + optionnal callback to do before the scroll
        |
        |
        */
        function _scroll_beforeScroll()
        {
            _isAnimated = true;

        	if(s.beforeScrollCallback)
        		s.beforeScrollCallback();
        }

        /*
        | Scroll : THE SCROLL
        |
        | Scroll to the next section
        |
        | 
        | @nextStep (Number) - position of the next section
        | @withoutAnimation (Boolean) - prevent animation if set to true
        |
        */
        function _scroll_doScroll(nextStep,withoutAnimation)
        {
            if(nextStep!=null && nextStep>=0 && nextStep<_nbSections)
            {
                _currentStep = nextStep;
                _currentSection = _sectionsArray[nextStep];

                var yTo = _currentSection.offset().top,
                    speed = withoutAnimation ? 0 : s.animateSpeed;

                _scroll_beforeScroll();
                _navigation_manageEvents();

                _bodyHtml.stop(true,false).animate({ scrollTop : yTo }, speed, function() { _scroll_afterScroll(); });
            }
        }

        /*
        | Scroll : After the scroll
        |
        | All actions + optionnal callback (afterScrollCallback) to do when the scroll end
        |
        |
        */
        function _scroll_afterScroll()
        {
            _isAnimated = false;

        	if(s.afterScrollCallback)
        		s.afterScrollCallback();
        }

        // Preserve jQuery chainability
    	return this;
    };

})(jQuery);