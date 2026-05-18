(function($) {

	var settings = {

		// Parallax background effect?
			parallax: false,

		// Parallax factor (lower = more intense, higher = less intense).
			parallaxFactor: 20

	};

	skel.breakpoints({
		xlarge: '(max-width: 1800px)',
		large: '(max-width: 1280px)',
		medium: '(max-width: 980px)',
		small: '(max-width: 736px)',
		xsmall: '(max-width: 480px)'
	});

	$(function() {

		var $window = $(window),
			$body = $('body'),
			$header = $('#header');

		// Disable animations/transitions until the page has loaded.
			$body.addClass('is-loading');

			$window.on('load', function() {
				$body.removeClass('is-loading');
			});

		// Touch?
			if (skel.vars.mobile) {

				// Turn on touch mode.
					$body.addClass('is-touch');

				// Height fix (mostly for iOS).
					window.setTimeout(function() {
						$window.scrollTop($window.scrollTop() + 1);
					}, 0);

			}

		// Fix: Placeholder polyfill.
			$('form').placeholder();

		// Prioritize "important" elements on medium.
			skel.on('+medium -medium', function() {
				$.prioritize(
					'.important\\28 medium\\29',
					skel.breakpoint('medium').active
				);
			});

		// Header.

			// Parallax background.

				// Disable parallax on IE (smooth scrolling is jerky), and on mobile platforms (= better performance).
					if (skel.vars.browser == 'ie'
					||	skel.vars.mobile)
						settings.parallax = false;

				if (settings.parallax) {

					skel.on('change', function() {

						if (skel.breakpoint('medium').active) {

							$window.off('scroll.strata_parallax');
							$header.css('background-position', 'top left, center center');

						}
						else {

							$header.css('background-position', 'left 0px');

							$window.on('scroll.strata_parallax', function() {
								$header.css('background-position', 'left ' + (-1 * (parseInt($window.scrollTop()) / settings.parallaxFactor)) + 'px');
							});

						}

					});

				}

		// Persistent section navigation.
			var $sectionMenu = $('.section-menu'),
				$sectionButtons = $sectionMenu.find('.section-menu__button'),
				$sections = $('#main > .content-section'),
				sectionTransitionDuration = 220,
				sectionTransitionTimer;

			function activateSection(sectionId, updateHash) {
				var $targetSection = $('#' + sectionId),
					$currentSection = $sections.filter('.is-active');

				if (!$currentSection.length)
					$currentSection = $sections.filter('.is-exiting');

				if (!$targetSection.length || $targetSection.is($currentSection))
					return;

				window.clearTimeout(sectionTransitionTimer);
				$sections.not($currentSection).removeClass('is-active is-exiting').attr('aria-hidden', 'true');

				$sectionButtons
					.removeClass('is-active')
					.attr('aria-selected', 'false');

				$sectionButtons
					.filter('[data-section="' + sectionId + '"]')
					.addClass('is-active')
					.attr('aria-selected', 'true');

				if (!$currentSection.length) {
					$targetSection
						.addClass('is-active')
						.attr('aria-hidden', 'false');
					return;
				}

				$currentSection
					.removeClass('is-active')
					.addClass('is-exiting')
					.attr('aria-hidden', 'true');

				sectionTransitionTimer = window.setTimeout(function() {
					$currentSection.removeClass('is-exiting');
					$targetSection
						.removeClass('is-exiting')
						.addClass('is-active')
						.attr('aria-hidden', 'false');

					if (updateHash && window.history && window.history.replaceState)
						window.history.replaceState(null, '', '#' + sectionId);

					if ($sectionMenu.length)
						$('html, body').animate({ scrollTop: Math.max(0, $sectionMenu.offset().top - 16) }, 250);
				}, sectionTransitionDuration);
			}

			$sectionButtons.on('click', function() {
				activateSection($(this).data('section'), true);
			});

			if (window.location.hash) {
				var initialSection = window.location.hash.substring(1);

				if ($sections.filter('#' + initialSection).length)
					activateSection(initialSection, false);
			}

		// Main Sections: Two.

			// Lightbox gallery.
				$window.on('load', function() {

					$('#galaga-game').poptrox({
						caption: function($a) { return $a.next('h3').text(); },
						overlayColor: '#2c2c2c',
						overlayOpacity: 0.85,
						popupCloserText: '',
						popupLoaderText: '',
						selector: 'a.image',
						usePopupCaption: true,
						usePopupDefaultStyling: false,
						usePopupEasyClose: false,
						usePopupNav: true,
						windowMargin: (skel.breakpoint('small').active ? 0 : 50)
					});
					
					$('#memory-game').poptrox({
						caption: function($a) { return $a.next('h3').text(); },
						overlayColor: '#2c2c2c',
						overlayOpacity: 0.85,
						popupCloserText: '',
						popupLoaderText: '',
						selector: 'a.image',
						usePopupCaption: true,
						usePopupDefaultStyling: false,
						usePopupEasyClose: false,
						usePopupNav: true,
						windowMargin: (skel.breakpoint('small').active ? 0 : 50)
					});
					
					$('#super-mario').poptrox({
						caption: function($a) { return $a.next('h3').text(); },
						overlayColor: '#2c2c2c',
						overlayOpacity: 0.85,
						popupCloserText: '',
						popupLoaderText: '',
						selector: 'a.image',
						usePopupCaption: true,
						usePopupDefaultStyling: false,
						usePopupEasyClose: false,
						usePopupNav: true,
						windowMargin: (skel.breakpoint('small').active ? 0 : 50)
					});
					
					$('#frogger').poptrox({
						caption: function($a) { return $a.next('h3').text(); },
						overlayColor: '#2c2c2c',
						overlayOpacity: 0.85,
						popupCloserText: '',
						popupLoaderText: '',
						selector: 'a.image',
						usePopupCaption: true,
						usePopupDefaultStyling: false,
						usePopupEasyClose: false,
						usePopupNav: true,
						windowMargin: (skel.breakpoint('small').active ? 0 : 50)
					});

					$('#spatial-sandbox').poptrox({
						caption: function($a) { return $a.next('h3').text(); },
						overlayColor: '#2c2c2c',
						overlayOpacity: 0.85,
						popupCloserText: '',
						popupLoaderText: '',
						selector: 'a.image',
						usePopupCaption: true,
						usePopupDefaultStyling: false,
						usePopupEasyClose: false,
						usePopupNav: true,
						windowMargin: (skel.breakpoint('small').active ? 0 : 50)
					});
					
					$('#acbtg').poptrox({
						caption: function($a) { return $a.next('h3').text(); },
						overlayColor: '#2c2c2c',
						overlayOpacity: 0.85,
						popupCloserText: '',
						popupLoaderText: '',
						selector: 'a.image',
						usePopupCaption: true,
						usePopupDefaultStyling: false,
						usePopupEasyClose: false,
						usePopupNav: true,
						windowMargin: (skel.breakpoint('small').active ? 0 : 50)
					});
				});

	});

})(jQuery);