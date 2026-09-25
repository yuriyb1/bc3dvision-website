  // Cursor
  const cursor = document.getElementById('cursor');
  const dot = cursor.querySelector('.dot');
  const ring = cursor.querySelector('.ring');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });

  function animRing() {
    rx += (mx - rx) * 1;
    ry += (my - ry) * 1;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();

  document.querySelectorAll('a, button, .gallery-item, .video-item, .gallery-dot').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
  });

  // Nav scroll
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  reveals.forEach(el => io.observe(el));

  function createCarousel({ root, track, slides, prevBtn, nextBtn, dotsWrap, label, ignoreDragSelector, playActiveVideo = false, infinite = false }) {
    if (!root || !track || !slides.length || !prevBtn || !nextBtn || !dotsWrap) return null;

    const originalSlides = slides;
    const originalCount = originalSlides.length;
    let allSlides = originalSlides;
    let currentSlide = infinite ? originalCount : 0;
    let startX = 0;
    let dragX = 0;
    let isDragging = false;

    if (infinite && originalCount > 1) {
      const beforeClones = originalSlides.map(slide => slide.cloneNode(true));
      const afterClones = originalSlides.map(slide => slide.cloneNode(true));
      beforeClones.reverse().forEach(slide => track.prepend(slide));
      afterClones.forEach(slide => track.append(slide));
      allSlides = Array.from(track.children);
    }

    function getVisibleSlides() {
      const slideWidth = allSlides[0].getBoundingClientRect().width;
      if (!slideWidth) return 1;
      return Math.max(1, Math.round(root.clientWidth / slideWidth));
    }

    function getMaxSlide() {
      if (infinite) return originalCount - 1;
      return Math.max(0, originalCount - getVisibleSlides());
    }

    function getRealSlide() {
      if (!infinite) return currentSlide;
      return (currentSlide - originalCount + originalCount) % originalCount;
    }

    function setTrackPosition(animate = true) {
      track.style.transition = animate ? '' : 'none';
      track.style.transform = `translateX(-${allSlides[currentSlide].offsetLeft}px)`;
    }

    let dots = [];

    function renderDots() {
      const dotCount = infinite ? originalCount : getMaxSlide() + 1;
      if (dots.length === dotCount) return;

      dotsWrap.replaceChildren();
      for (let index = 0; index < dotCount; index++) {
        const dot = document.createElement('button');
        dot.className = 'gallery-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show ${label} ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(infinite ? originalCount + index : index));
        dot.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
        dot.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
        dotsWrap.appendChild(dot);
      }
      dots = Array.from(dotsWrap.querySelectorAll('.gallery-dot'));
    }

    function updateCarousel() {
      renderDots();
      if (!infinite) currentSlide = Math.min(currentSlide, getMaxSlide());
      const realSlide = getRealSlide();
      setTrackPosition();
      dots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === realSlide);
        dot.setAttribute('aria-current', index === realSlide ? 'true' : 'false');
      });
      allSlides.forEach((slide, index) => {
        slide.querySelectorAll('video').forEach(video => {
          const isVisible = index >= currentSlide && index < currentSlide + getVisibleSlides();
          if (isVisible && playActiveVideo) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      });
    }

    function goToSlide(index) {
      if (infinite) {
        currentSlide = index;
      } else {
        const maxSlide = getMaxSlide();
        currentSlide = index < 0 ? maxSlide : index > maxSlide ? 0 : index;
      }
      updateCarousel();
    }

    prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

    root.addEventListener('pointerdown', e => {
      if (e.target.closest('.gallery-controls') || (ignoreDragSelector && e.target.closest(ignoreDragSelector))) return;
      isDragging = true;
      startX = e.clientX;
      dragX = 0;
      track.style.transition = 'none';
      root.setPointerCapture(e.pointerId);
    });

    root.addEventListener('pointermove', e => {
      if (!isDragging) return;
      dragX = e.clientX - startX;
      track.style.transform = `translateX(${dragX - allSlides[currentSlide].offsetLeft}px)`;
    });

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      track.style.transition = '';

      if (Math.abs(dragX) > 70) {
        goToSlide(currentSlide + (dragX < 0 ? 1 : -1));
        return;
      }

      updateCarousel();
    }

    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);
    root.addEventListener('pointerleave', endDrag);
    window.addEventListener('resize', updateCarousel);
    track.addEventListener('transitionend', () => {
      if (!infinite) return;
      let didLoop = false;

      if (currentSlide >= originalCount * 2) {
        currentSlide -= originalCount;
        setTrackPosition(false);
        didLoop = true;
      }

      if (currentSlide < originalCount) {
        currentSlide += originalCount;
        setTrackPosition(false);
        didLoop = true;
      }

      if (didLoop) updateCarousel();
    });

    renderDots();
    setTrackPosition(false);
    updateCarousel();

    return { root, goToSlide, getCurrentSlide: () => currentSlide };
  }

  const galleryCarousel = createCarousel({
    root: document.querySelector('.gallery-carousel'),
    track: document.querySelector('.gallery-track'),
    slides: Array.from(document.querySelectorAll('.gallery-item')),
    prevBtn: document.querySelector('.gallery-prev'),
    nextBtn: document.querySelector('.gallery-next'),
    dotsWrap: document.querySelector('.gallery-dots'),
    label: 'render',
    infinite: true
  });

  createCarousel({
    root: document.querySelector('.video-carousel'),
    track: document.querySelector('.video-track'),
    slides: Array.from(document.querySelectorAll('.video-item')),
    prevBtn: document.querySelector('.video-prev'),
    nextBtn: document.querySelector('.video-next'),
    dotsWrap: document.querySelector('.video-dots'),
    label: 'video',
    playActiveVideo: true,
    infinite: true
  });

  document.addEventListener('keydown', e => {
    if (!galleryCarousel) return;
    if (e.key === 'ArrowLeft') galleryCarousel.goToSlide(galleryCarousel.getCurrentSlide() - 1);
    if (e.key === 'ArrowRight') galleryCarousel.goToSlide(galleryCarousel.getCurrentSlide() + 1);
  });

  // Skill bars
  const barIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.skill-bar').forEach(bar => {
          bar.style.width = bar.dataset.w + '%';
        });
        barIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.skills-list').forEach(el => barIO.observe(el));
