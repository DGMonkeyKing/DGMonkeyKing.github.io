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

			// Reusable project overlay.
				var $projectOverlay = $('#project-overlay'),
					$projectDialog = $projectOverlay.find('.project-overlay__dialog'),
					$projectImage = $projectOverlay.find('.project-overlay__image'),
					$projectCounter = $projectOverlay.find('.project-overlay__counter'),
					$projectTitle = $('#project-overlay-title'),
					$projectDescription = $('#project-overlay-description'),
					$projectCodeLink = $projectOverlay.find('[data-project-overlay-code]'),
					$projectDemoLink = $projectOverlay.find('[data-project-overlay-demo]'),
					projectImages = [],
					projectImageIndex = 0,
					$lastProjectTrigger = null;

				function setProjectOverlayLink($targetLink, $sourceLink) {
					$targetLink
						.attr('href', $sourceLink.attr('href'))
						.text($sourceLink.text());

					if ($sourceLink.attr('target'))
						$targetLink.attr('target', $sourceLink.attr('target'));
					else
						$targetLink.removeAttr('target');

					if ($sourceLink.attr('rel'))
						$targetLink.attr('rel', $sourceLink.attr('rel'));
					else
						$targetLink.removeAttr('rel');
				}

				function renderProjectImage() {
					if (!projectImages.length)
						return;

					var image = projectImages[projectImageIndex];

					$projectImage
						.attr('src', image.src)
						.attr('alt', image.alt);

					$projectCounter.text((projectImageIndex + 1) + ' / ' + projectImages.length);
					$projectOverlay.toggleClass('project-overlay--single-image', projectImages.length < 2);
				}

				function moveProjectCarousel(direction) {
					if (projectImages.length < 2)
						return;

					projectImageIndex = (projectImageIndex + direction + projectImages.length) % projectImages.length;
					renderProjectImage();
				}

				function openProjectOverlay($projectCard) {
					var $metadata = $projectCard.find('.project-metadata'),
						$codeLink = $metadata.find('[data-project-code]'),
						$demoLink = $metadata.find('[data-project-demo]');

					projectImages = [];
					$metadata.find('[data-project-images] li').each(function() {
						var $imageData = $(this),
							src = $imageData.data('src');

						if (src)
							projectImages.push({
								src: src,
								alt: $imageData.data('alt') || $metadata.find('[data-project-title]').text()
							});
					});

					if (!projectImages.length) {
						var $fallbackImage = $projectCard.find('img').first();
						projectImages.push({
							src: $fallbackImage.attr('src'),
							alt: $fallbackImage.attr('alt')
						});
					}

					projectImageIndex = 0;
					$lastProjectTrigger = $projectCard.find('.project-card__thumb');
					$projectTitle.text($metadata.find('[data-project-title]').text());
					$projectDescription.text($metadata.find('[data-project-description]').text());
					setProjectOverlayLink($projectCodeLink, $codeLink);
					setProjectOverlayLink($projectDemoLink, $demoLink);
					renderProjectImage();

					$projectOverlay
						.addClass('is-visible')
						.attr('aria-hidden', 'false');
					$body.addClass('project-overlay-is-open');
					$projectDialog.attr('tabindex', '-1').focus();
				}

				function closeProjectOverlay() {
					if (!$projectOverlay.hasClass('is-visible'))
						return;

					$projectOverlay
						.removeClass('is-visible')
						.attr('aria-hidden', 'true');
					$body.removeClass('project-overlay-is-open');

					if ($lastProjectTrigger && $lastProjectTrigger.length)
						$lastProjectTrigger.focus();
				}

				$('.project-card__thumb').on('click', function() {
					openProjectOverlay($(this).closest('.project-card'));
				});

				$projectOverlay.find('[data-project-close]').on('click', closeProjectOverlay);
				$projectOverlay.find('[data-project-prev]').on('click', function() { moveProjectCarousel(-1); });
				$projectOverlay.find('[data-project-next]').on('click', function() { moveProjectCarousel(1); });

				$window.on('keydown', function(event) {
					if (!$projectOverlay.hasClass('is-visible'))
						return;

					if (event.key === 'Escape')
						closeProjectOverlay();
					else if (event.key === 'ArrowLeft')
						moveProjectCarousel(-1);
					else if (event.key === 'ArrowRight')
						moveProjectCarousel(1);
				});

	});

})(jQuery);