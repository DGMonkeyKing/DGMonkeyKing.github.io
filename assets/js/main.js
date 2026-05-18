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
					$window.trigger('sectionchange', [sectionId]);
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

					$window.trigger('sectionchange', [sectionId]);
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
					$projectMedia = $projectOverlay.find('.project-overlay__media'),
					$projectCounter = $projectOverlay.find('.project-overlay__counter'),
					$projectTitle = $('#project-overlay-title'),
					$projectDescription = $('#project-overlay-description'),
					$projectCodeLink = $projectOverlay.find('[data-project-overlay-code]'),
					$projectDemoLink = $projectOverlay.find('[data-project-overlay-demo]'),
					projectMediaItems = [],
					projectMediaIndex = 0,
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

				function getProjectMediaType(src, explicitType) {
					var type = (explicitType || '').toLowerCase();

					if (type === 'image' || type === 'video')
						return type;

					if (/\.(mp4|webm)(\?.*)?$/i.test(src))
						return 'video';

					return 'image';
				}

				function renderProjectMedia() {
					if (!projectMediaItems.length)
						return;

					var media = projectMediaItems[projectMediaIndex],
						mediaElement;

					$projectMedia.empty();

					if (media.type === 'video') {
						mediaElement = $('<video />', {
							class: 'project-overlay__media-item',
							src: media.src,
							muted: true,
							loop: true,
							autoplay: true,
							playsinline: true,
							'aria-label': media.alt
						});
						mediaElement.prop('muted', true);
						mediaElement.prop('playsInline', true);
					}
					else {
						mediaElement = $('<img />', {
							class: 'project-overlay__media-item',
							src: media.src,
							alt: media.alt
						});
					}

					$projectMedia.append(mediaElement);
					$projectCounter.text((projectMediaIndex + 1) + ' / ' + projectMediaItems.length);
					$projectOverlay.toggleClass('project-overlay--single-media', projectMediaItems.length < 2);
				}

				function moveProjectCarousel(direction) {
					if (projectMediaItems.length < 2)
						return;

					projectMediaIndex = (projectMediaIndex + direction + projectMediaItems.length) % projectMediaItems.length;
					renderProjectMedia();
				}

				function openProjectOverlay($projectCard) {
					var $metadata = $projectCard.find('.project-metadata'),
						$codeLink = $metadata.find('[data-project-code]'),
						$demoLink = $metadata.find('[data-project-demo]');

					projectMediaItems = [];
					$metadata.find('[data-project-media] li, [data-project-images] li').each(function() {
						var $mediaData = $(this),
							src = $mediaData.data('src');

						if (src)
							projectMediaItems.push({
								type: getProjectMediaType(src, $mediaData.data('type')),
								src: src,
								alt: $mediaData.data('alt') || $metadata.find('[data-project-title]').text()
							});
					});

					if (!projectMediaItems.length) {
						var $fallbackImage = $projectCard.find('img').first(),
							fallbackSrc = $fallbackImage.attr('src');

						projectMediaItems.push({
							type: getProjectMediaType(fallbackSrc),
							src: fallbackSrc,
							alt: $fallbackImage.attr('alt')
						});
					}

					projectMediaIndex = 0;
					$lastProjectTrigger = $projectCard.find('.project-card__thumb');
					$projectTitle.text($metadata.find('[data-project-title]').text());
					$projectDescription.text($metadata.find('[data-project-description]').text());
					setProjectOverlayLink($projectCodeLink, $codeLink);
					setProjectOverlayLink($projectDemoLink, $demoLink);
					renderProjectMedia();

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
					$projectMedia.empty();

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


		// Main Sections: Five.

			// Pinterest-like art gallery with incremental loading and a full-size viewer.
				var $artSection = $('#five'),
					$artGrid = $artSection.find('[data-art-grid]'),
					$artSentinel = $artSection.find('[data-art-sentinel]'),
					$artOverlay = $('#art-overlay'),
					$artDialog = $artOverlay.find('.art-overlay__dialog'),
					$artImage = $artOverlay.find('.art-overlay__image'),
					$artCounter = $artOverlay.find('.art-overlay__counter'),
					artworks = [],
					loadedArtworkCount = 0,
					activeArtworkIndex = 0,
					artBatchSize = 6,
					$lastArtworkTrigger = null,
					artObserver = null;

				$artSection.find('[data-art-source] li').each(function() {
					var $artwork = $(this);

					if ($artwork.data('full'))
						artworks.push({
							full: $artwork.data('full'),
							thumb: $artwork.data('thumb') || $artwork.data('full'),
							alt: $artwork.data('alt') || 'Artwork'
						});
				});

				function renderArtworkBatch() {
					var nextArtworkCount = Math.min(loadedArtworkCount + artBatchSize, artworks.length),
						fragment = document.createDocumentFragment();

					for (var i = loadedArtworkCount; i < nextArtworkCount; i++) {
						var artwork = artworks[i],
							button = document.createElement('button'),
							image = document.createElement('img');

						button.type = 'button';
						button.className = 'art-gallery__item';
						button.setAttribute('data-art-index', i);
						button.setAttribute('aria-label', 'Open artwork: ' + artwork.alt);

						image.src = artwork.thumb;
						image.alt = artwork.alt;
						image.loading = i < artBatchSize ? 'eager' : 'lazy';
						image.decoding = 'async';

						button.appendChild(image);
						fragment.appendChild(button);
					}

					loadedArtworkCount = nextArtworkCount;
					$artGrid[0].appendChild(fragment);
					$artSentinel.toggle(loadedArtworkCount < artworks.length);
				}

				function renderArtworkOverlay() {
					var artwork = artworks[activeArtworkIndex];

					if (!artwork)
						return;

					$artImage
						.attr('src', artwork.full)
						.attr('alt', artwork.alt);
					$artCounter.text((activeArtworkIndex + 1) + ' / ' + artworks.length);
				}

				function moveArtworkOverlay(direction) {
					if (artworks.length < 2)
						return;

					activeArtworkIndex = (activeArtworkIndex + direction + artworks.length) % artworks.length;
					renderArtworkOverlay();
				}

				function openArtworkOverlay(index, trigger) {
					activeArtworkIndex = index;
					$lastArtworkTrigger = $(trigger);
					renderArtworkOverlay();

					$artOverlay
						.addClass('is-visible')
						.attr('aria-hidden', 'false');
					$body.addClass('art-overlay-is-open');
					$artDialog.attr('tabindex', '-1').focus();
				}

				function closeArtworkOverlay() {
					if (!$artOverlay.hasClass('is-visible'))
						return;

					$artOverlay
						.removeClass('is-visible')
						.attr('aria-hidden', 'true');
					$body.removeClass('art-overlay-is-open');

					if ($lastArtworkTrigger && $lastArtworkTrigger.length)
						$lastArtworkTrigger.focus();
				}

				function maybeLoadMoreArt() {
					if (!$artSection.hasClass('is-active') || loadedArtworkCount >= artworks.length)
						return;

					if ($artSentinel.offset().top - $window.scrollTop() < $window.height() + 360)
						renderArtworkBatch();
				}

				if (artworks.length && $artGrid.length) {
					renderArtworkBatch();

					$artGrid.on('click', '.art-gallery__item', function() {
						openArtworkOverlay(parseInt($(this).attr('data-art-index'), 10), this);
					});

					$artOverlay.find('[data-art-close]').on('click', closeArtworkOverlay);
					$artOverlay.find('[data-art-prev]').on('click', function() { moveArtworkOverlay(-1); });
					$artOverlay.find('[data-art-next]').on('click', function() { moveArtworkOverlay(1); });

					if ('IntersectionObserver' in window) {
						artObserver = new IntersectionObserver(function(entries) {
							if (entries[0].isIntersecting && $artSection.hasClass('is-active'))
								renderArtworkBatch();
						}, { rootMargin: '360px 0px' });

						artObserver.observe($artSentinel[0]);
					}

					$window.on('scroll resize', maybeLoadMoreArt);
					$window.on('sectionchange', function(event, sectionId) {
						if (sectionId === 'five')
							maybeLoadMoreArt();
					});
				}

				$window.on('keydown', function(event) {
					if (!$artOverlay.hasClass('is-visible'))
						return;

					if (event.key === 'Escape')
						closeArtworkOverlay();
					else if (event.key === 'ArrowLeft')
						moveArtworkOverlay(-1);
					else if (event.key === 'ArrowRight')
						moveArtworkOverlay(1);
				});


	});

})(jQuery);
