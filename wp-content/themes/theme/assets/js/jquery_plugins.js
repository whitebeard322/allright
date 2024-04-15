(function ($) {

    var $document = $(document);

    var ONE_MINUTE = 60;
    var ONE_HOUR = ONE_MINUTE * 60;
    var ONE_DAY = ONE_HOUR * 24;

    // private utils

    function nowTimestamp() {
        return Math.floor((new Date()).valueOf() / 1000);
    }

    function getSeconds(endTimestamp) {
        return Math.max(0, endTimestamp - nowTimestamp());
    }

    function getScrollTop() {
        return document.documentElement.scrollTop || document.body.scrollTop;
    }


    var COUNTDOWN_DEFAULTS = {
        removeDelay: 3,
        seconds: 0,
        endTimestamp: 0,
    };

    $.fn.jq_countdown = function (options) {
        var $this = $(this);

        if ($this.length > 1) {
            $this.each(function () {
                $(this).jq_countdown(options);
            });
            return this;
        }

        options = $.extend({}, COUNTDOWN_DEFAULTS, options);

        var endTimestamp = 0 + $this.data('timestamp');
        if (endTimestamp) {
            options.endTimestamp = endTimestamp;
        }

        endTimestamp = options.endTimestamp || (nowTimestamp() + options.seconds);

        if (!endTimestamp) {
            console.error('init countdownTimer error', this);
            return;
        }

        var template = options.template || $this.data('template');
        var removeDelay = options.removeDelay;

        var timer = null;
        var tick = function () {
            if (!$this) {
                timer && clearInterval(timer);
                timer = null;
                return;
            }
            var seconds = getSeconds(endTimestamp);
            var s = seconds;

            // days
            var d = 0;
            if (template.indexOf('{d}') !== -1) {
                d = Math.floor(s / ONE_DAY);
                s -= d * ONE_DAY;
                if (d < 10) {
                    d = '0' + d;
                }
            }

            // hours
            var h = Math.floor(s / ONE_HOUR);
            s -= h * ONE_HOUR;
            if (h < 10) {
                h = '0' + h;
            }

            // minutes
            var m = Math.floor(s / ONE_MINUTE);
            s -= m * ONE_MINUTE;
            if (m < 10) {
                m = '0' + m;
            }

            // seconds
            if (s < 10) {
                s = '0' + s;
            }

            var html = template.replace('{d}', d)
                .replace('{h}', h)
                .replace('{m}', m)
                .replace('{s}', s);

            $this.html(html);

            if (seconds <= 0) {
                $this.trigger('countdown:end');
                timer && clearInterval(timer);
                timer = null;
                $this = null;
            } else if (!$this.is(':visible') && !$this.is('[data-no-remove]')) {
                removeDelay--;
                if (removeDelay < 0) {
                    timer && clearInterval(timer);
                    timer = null;
                    $this = null;
                }
            }
        };
        // start
        if (getSeconds(endTimestamp) > 0) {
            timer = setInterval(tick, 1000);
        }
        tick();

        return this;
    };


    $.fn.scroll_top_button = function (animationTime) {

        var $this = $(this);
        if ($this.length === 0) {
            return this;
        }

        $(window).scroll(function () {
            if ($(this).scrollTop() > 0) {
                $this.addClass('active');
            } else {
                $this.removeClass('active');
            }
        });

        $this.on('click', function (event) {
            event.preventDefault();
            $('html, body').animate({
                scrollTop: 0,
            }, animationTime || 200);
        });
    };


    var DROPDOWN_DEFAULTS = {
        animationType: 'slide',
        animationTime: 200,
    };
    $.fn.jq_dropdown = function (options) {
        var $this = $(this);

        if ($this.length > 1) {
            $this.each(function () {
                $(this).jq_dropdown(options);
            });
            return this;
        }

        options = $.extend({}, DROPDOWN_DEFAULTS, options);

        function show($menu) {
            switch (options.animationType) {
                case 'slide':
                    $menu.slideDown(options.animationTime);
                    break;
                case 'fade':
                    $menu.fadeIn(options.animationTime);
                    break;
                default:
                    $menu.show();
                    break;
            }
        }

        function hide($menu) {
            switch (options.animationType) {
                case 'slide':
                    $menu.slideUp(options.animationTime);
                    break;
                case 'fade':
                    $menu.fadeOut(options.animationTime);
                    break;
                default:
                    $menu.hide();
                    break;
            }
        }

        function open() {
            var $menu = $this.find('.dd__menu');
            show($menu);
            $this.addClass('open');

            setTimeout(function () {
                $document.one('click', function (event) {
                    close();
                });
            }, 1);
        }

        function close() {
            var $menu = $this.find('.dd__menu');

            $this.removeClass('open');
            hide($menu);
        }

        function isOpen() {
            return $this.hasClass('open');
        }

        $this.on('click', '.pll-parent-menu-item', function () {
            isOpen() ? close() : open();
        });

        $this.on('click', '.sub-menu', function () {
            close();
        });
    };


    var BUTTON_UP_DEFAULTS = {
        scrollTime: 400,
    };
    $.fn.jq_button_up = function (options) {
        var $this = $(this);

        options = $.extend({}, BUTTON_UP_DEFAULTS, options);

        $([document, document.documentElement, document.body]).on('scroll', function () {
            var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            if (scrollTop > 0) {
                $this.fadeIn();
            } else {
                $this.fadeOut();
            }
        });

        $this.click(function (event) {
            event.preventDefault();

            $([document.documentElement, document.body]).animate({
                scrollTop: 0,
            }, options.scrollTime);
        });
    };


    var GAMES_AJAX_DEFAULTS = {
        form: '#filter_term',
        links: null,
        searchDelay: 300,
        searchOnInput: true,
        updateContainers: ['#games_list'],
        clearGridBeforeUpdate: true,
        loaderInGrid: true,

        beforeUpdate: $.noop,
        afterUpdate: $.noop,
        onSubmit: $.noop,
        onLink: $.noop,
        resolveUrl: null,

        pushState: true,
    };
    $.fn.games_ajax = function (options) {
        var $this = $(this);

        if ($this.length > 1) {
            $this.each(function () {
                $(this).games_ajax(options);
            });
            return this;
        }

        options = $.extend({}, GAMES_AJAX_DEFAULTS, options);

        var $grid = $this;
        var $form = $(options.form);

        if (!$grid.length) throw new Error('games_ajax: $grid not found');
        if (!$form.length) throw new Error('games_ajax: $form not found');

        var $term_input = $form.find('input:visible');
        var request = null;

        $form.on('submit', function (event) {
            event.preventDefault();
            var $this = $(this);
            var url = $this.attr('action');
            if (options.resolveUrl) {
                var params = $this.serializeArray();
                url = options.resolveUrl(url, params);
            } else {
                var params = $this.serializeArray().filter(function (item) {
                    return !!item.value;
                }).map(function (item) {
                    return encodeURIComponent(item.name) + '=' + encodeURIComponent(item.value);
                });
                if (params.length) {
                    url += (url.indexOf('?') === -1 ? '?' : '&') + params.join('&');
                }
            }
            update(url, false);
            options.onSubmit.call(this);
        });

        if (options.searchOnInput) {
            $term_input.on('input', search);
            $form.find('select').on('change', search);
        }

        $form.find('input:radio').on('change', search);
        $form.find('input:checkbox').on('change', search);

        if (options.links) {
            $document.on('click', options.links, function (event) {
                event.preventDefault();
                var url = $(this).attr('href');
                update(url, true);
                options.onLink.call(this);
            });
        }

        var search_timer = null;

        function search() {
            if (options.searchDelay) {
                search_timer && clearTimeout(search_timer);
                search_timer = setTimeout(function () {
                    $form.submit();
                }, options.searchDelay);
            } else {
                $form.submit();
            }
        }

        function abort() {
            request && request.abort();
            request = null;
        }

        function complete() {
            $grid.removeLoader();
            request = null;

            options.afterUpdate();
        }

        function update(url, resetTerm) {
            abort();

            options.beforeUpdate();

            // fix "%20" => "+"
            url = url.replace(/\%20/g, '+');

            request = $.ajax({
                url: url,
                method: 'get',
                success: function (html) {
                    options.loaderInGrid && $grid.removeLoader();

                    // build page
                    var $page = $('<div>' + html + '</div>');

                    // update containers
                    var $old, $new, selector;
                    for (var i = 0; i < options.updateContainers.length; i++) {
                        selector = options.updateContainers[i];

                        $old = $document.find(selector);
                        $new = $page.find(selector);

                        if ($old.length && $new.length) {
                            $old.html($new.html());
                        }
                    }

                    // update form
                    $old = $form;
                    $new = $page.find(options.form);
                    if ($old.length && $new.length) {
                        $old.attr('action', $new.attr('action'));
                    }

                    // clear?
                    $old = null;
                    $new = null;

                    if (resetTerm) {
                        $term_input.val('');
                    }

                    // update url
                    if (options.pushState) {
                        history.pushState({}, '', url);
                    }

                    // afterUpdate
                    window.dispatchEvent(new Event('resize'));
                    window.dispatchEvent(new Event('scroll'));
                    options.afterUpdate();

                    // clear?
                    $page.remove();
                    $page = null;
                },
                error: function (err) {
                },
                complete: complete,
            });

            options.clearGridBeforeUpdate && $grid.empty();
            options.loaderInGrid && $grid.addLoader();
        }

    };

    var GAMES_SEARCH_DEFAULTS = {
        url: null,
        data: null,
        showCount: 3,
        showItemTemplate: '<div class="item">{id} / {title}</div>',
        emptyText: '<div class="empty">empty</div>',
        input: 'input',
        content: '.dd__content',
        searchInFields: ['fullGameName'],
    };
    $.fn.games_search = function (options) {
        var $this = $(this);

        if ($this.length > 1) {
            $this.each(function () {
                $(this).games_search(options);
            });
            return this;
        }

        options = $.extend({}, GAMES_SEARCH_DEFAULTS, options);

        var $input = $this.find(options.input);
        var $content = $this.find(options.content);
        var loading = false;

        function open() {
            $this.addClass('open');
            setTimeout(function () {
                $document.on('click', checkClose);
            }, 100);
        }

        function checkClose(event) {
            if ($input.parent().has(event.target).length === 0) {
                close();
            }
        }

        function close() {
            $this.removeClass('open');
            $document.off('click', checkClose);
        }

        function focus(event) {
            // make ajax request, cache games
            if (options.data === null && options.url) {
                options.data = [];
                $.ajax({
                    url: options.url,
                    method: 'get',
                    success: function (data) {
                        options.data = data;
                    },
                    complete: function () {
                        $content.removeLoader();
                        loading = false;
                        search();
                    },
                });
                $content.addLoader();
                loading = true;
            }

            search();
        }

        function change(event) {
            search();
        }

        function search() {
            var searchText = $input.val().toLowerCase();
            if (searchText) {
                open();
            } else {
                close();
                return;
            }

            if (loading) {
                // dont show results
                return;
            }

            var results = [];
            for (var i = 0; i < options.data.length; i++) {
                var found = false;
                var item = options.data[i];
                for (var j = 0; j < options.searchInFields.length; j++) {
                    var fieldName = options.searchInFields[j];
                    if (typeof item[fieldName] === 'string') {
                        if (item[fieldName].toLowerCase().indexOf(searchText) >= 0) {
                            found = true;
                            break;
                        }
                    }
                }
                if (found) {
                    results.push(item);
                    if (results.length >= options.showCount) {
                        break;
                    }
                }
            }


            showResults(results);
        }

        function renderItem(item) {
            var template = options.showItemTemplate;
            var html = template.replace(/\{([\w\d\_]+)\}/gm, function (matchText, fieldName) {
                if (fieldName === 'name') {
                    fieldName = 'fullGameName';
                }
                if (item[fieldName] !== undefined) {
                    return item[fieldName];
                }
                return matchText;
            });
            return $(html);
        }

        function showResults(items) {
            if (items.length) {
                var $scroll = $('<div class="dd__scroll"></div>');
                $scroll.append(items.map(renderItem));
                $content.empty().append($scroll);
            } else {
                $content.empty().append($(options.emptyText));
            }
        }

        $input.on('focus', focus);
        $input.on('input', change);
    };


    var TREE_MENU_DEFAULTS = {
        submenuSelector: '.menu.sub',
        itemSelector: '.item',
        activeClass: 'hovered',
        activateActiveDelay: 300,
        animationTime: 300,
    };
    $.fn.tree_menu = function (options) {
        var $this = $(this);

        if ($this.length > 1) {
            $this.each(function () {
                $(this).tree_menu(options);
            });
            return this;
        }

        options = $.extend({}, TREE_MENU_DEFAULTS, options);

        var $submenu = $this.next();
        var activateActiveTimer = null;
        var $prevmenu = null;
        var showSub = true;

        function resetTimer() {
            activateActiveTimer && clearTimeout(activateActiveTimer);
            activateActiveTimer = null;
        }

        function activate($item) {
            resetTimer();
            $this.find(options.itemSelector + '.' + options.activeClass).not($item).removeClass(options.activeClass);
            $item.addClass(options.activeClass);

            var $menu = $item.find(options.submenuSelector).eq(0);
            if ($menu.length) {
                // show it
                var $tmp = $menu.clone();
                $submenu.append($tmp);
                if ($prevmenu) {
                    $prevmenu.remove();
                } else {
                    $tmp.hide().slideDown(options.animationTime);
                }
                $prevmenu = $tmp;
            } else {
                if ($prevmenu) {
                    $prevmenu.slideUp(options.animationTime, function () {
                        $(this).remove();
                    });
                    $prevmenu = null;
                }
            }
        }

        function activateDefault() {
            var $item = $this.find(options.itemSelector + '.active');
            if ($item && $item.length) {
                activate($item);
            }
        }

        function activateDefaultDelayed() {
            resetTimer();
            activateActiveTimer = setTimeout(activateDefault, options.activateActiveDelay);
        }

        $this
            .on('tap', options.itemSelector, function (event) {
                var url = $(event.target).attr('href');
                if (url) {
                    location.replace(url);
                    showSub = false
                }
            })
            .on('mouseover', options.itemSelector, function (event) {
                if (showSub == true){
                    activate($(this));
                }
            })
            .on('mouseleave', options.itemSelector, activateDefaultDelayed)
        $submenu
            .on('mouseover', resetTimer)
            .on('mouseleave', activateDefaultDelayed);

        activateDefault();
    };


    var TABULAR_MENU_DEFAULTS = {
        menuItem: 'item',
        activeClass: 'active',
        initializedClass: 'initialized',
        tabStretch: false,
        autoplay: 0,
    };
    $.fn.tabular_menu = function (options) {
        var $this = $(this);

        if ($this.length > 1) {
            $this.each(function () {
                $(this).tree_menu(options);
            });
            return this;
        }

        options = $.extend({}, TABULAR_MENU_DEFAULTS, options);

        var $items = $this.find('.' + options.menuItem);

        function activate($item) {
            $items.not($item).removeClass(options.activeClass).each(function () {
                var content = $(this).attr('href');
                $(content).hide();
            });
            $item.addClass(options.activeClass);
            var content = $item.attr('href');
            $(content).fadeIn();
        }

        // find active
        var $active = null;
        $items.each(function () {
            if ($active === null && $(this).hasClass(options.activeClass)) {
                $active = $(this);
            }
        });
        if ($active === null) {
            $active = $items.eq(0);
        }

        activate($active);

        // init
        (function () {
            var $tabs = $items.map(function () {
                return $($(this).attr('href'));
            });

            var maxHeight = 0;
            $tabs.each(function () {
                this.addClass(options.initializedClass);
                maxHeight = Math.max(maxHeight, this.outerHeight());
            });
            if (options.tabStretch) {
                $tabs.each(function () {
                    this.css('min-height', maxHeight + 'px');
                });
            }
            $tabs = null;
        })();

        $this.on('click', '.' + options.menuItem, function (event) {
            event.preventDefault();
            activate($(this));
        });

        function autoplayNext() {
            var nextIndex = $items.index($items.filter('.active').get(0)) + 1;
            if (nextIndex >= $items.length) {
                nextIndex = nextIndex % $items.length;
            }
            $items.eq(nextIndex).click();
        }

        if (options.autoplay) {
            var autoplayTimer = setInterval(autoplayNext, options.autoplay);
        }
    };

    // .drag-slider-wrap > .drag-slider
    var DRAG_SLIDER_DEFAULTS = {
    };
    $.fn.drag_slider = function (options) {
        var $this = $(this);

        if ($this.length > 1) {
            $this.each(function () {
                $(this).drag_slider(options);
            });
            return this;
        }

        options = $.extend({}, DRAG_SLIDER_DEFAULTS, options);

        var $container = $this;
        var isDown, isScroll, startX, scrollLeft;
        var $slider = $container.find('.drag-slider');

        function stopClick(e){
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }

        $slider.on('mousedown', function (e) {
            isDown = true;
            isScroll = false;
            startX = e.clientX;
            scrollLeft = e.currentTarget.scrollLeft;
            stopClick(e);
        });
        $slider.on('mouseleave', function () {
            isDown = false;
            isScroll = false;
        });
        $slider.on('mouseup', function (e) {
            if (isScroll === true) {
                $slider.one('click', stopClick, false);
            }
            isDown = false;
            isScroll = false;
        });
        $slider.on('mousemove', function (e) {
            if (isDown) {
                var x = e.clientX;
                var walk = x - startX;
                e.currentTarget.scrollLeft = scrollLeft - walk;
                if (walk) {
                    isScroll = true;
                }
            }
        });

        function prev () {
            var $item = $slider.children()
            var scrollLeft = $slider.scrollLeft()

            var left;
            var scroledSlidesNum = scrollLeft / Math.floor($item.outerWidth());

            left = Math.floor(scroledSlidesNum) * $item.outerWidth()
            if (scroledSlidesNum - Math.floor(scroledSlidesNum) <= 0.3) {
                left = Math.floor(scroledSlidesNum - 1) * $item.outerWidth()
            }
            $slider.animate({scrollLeft: left}, 200)
        }

        function next () {
            var $item = $slider.children()
            var scrollLeft = $slider.scrollLeft()

            var left;
            var scroledSlidesNum = scrollLeft / Math.floor($item.outerWidth());

            left = Math.floor(scroledSlidesNum + 1) * $item.outerWidth()
            if (scroledSlidesNum - Math.floor(scroledSlidesNum) >= 0.8) {
                left = Math.ceil(scroledSlidesNum + 1) * $item.outerWidth();
            }
            $slider.animate({scrollLeft: left}, 200)
        }

        $container.on('click', '.prev', function (event) {
            event.preventDefault();
            prev();
        });

        $container.on('click', '.next', function (event) {
            event.preventDefault();
            next();
        });
    };
})(jQuery);
