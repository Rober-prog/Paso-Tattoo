/**
 * ========================================
 * PASO TATTOO STUDIO - JavaScript
 * Interactivitat avançada i efectes
 * ========================================
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURACIÓ
    // ========================================
    
    const CONFIG = {
        scrollOffset: 90,
        animationThreshold: 0.1,
        sliderMomentum: 0.92,
        sliderSnapThreshold: 100,
        touchThreshold: 50
    };

    // ========================================
    // UTILITATS
    // ========================================
    
    const prefersReducedMotion = () => 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const debounce = (func, wait) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    const lerp = (start, end, factor) => start + (end - start) * factor;

    // ========================================
    // HEADER
    // ========================================
    
    function initHeader() {
        const header = document.getElementById('header');
        const menuToggle = document.getElementById('menuToggle');
        const mainNav = document.getElementById('mainNav');
        const navLinks = document.querySelectorAll('.header__nav-link');

        if (!header || !menuToggle || !mainNav) return;

        // Scroll effect
        let lastScroll = 0;
        
        const handleScroll = () => {
            const currentScroll = window.scrollY;
            
            if (currentScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        // Mobile menu
        menuToggle.addEventListener('click', () => {
            const isActive = menuToggle.classList.toggle('active');
            mainNav.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isActive);
            document.body.classList.toggle('no-scroll', isActive);
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('no-scroll');
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mainNav.classList.contains('active')) {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    }

    // ========================================
    // SMOOTH SCROLL
    // ========================================
    
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    
                    const offsetTop = targetElement.offsetTop - CONFIG.scrollOffset;
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
                    });
                }
            });
        });
    }

    // ========================================
    // SCROLL SPY
    // ========================================
    
    function initScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.header__nav-link');

        if (!sections.length || !navLinks.length) return;

        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -80% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const activeId = entry.target.getAttribute('id');
                    
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${activeId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);
        
        sections.forEach(section => observer.observe(section));
    }

    // ========================================
    // SCROLL ANIMATIONS
    // ========================================
    
    function initScrollAnimations() {
        if (prefersReducedMotion()) {
            document.querySelectorAll('.animate-on-scroll').forEach(el => {
                el.classList.add('is-visible');
            });
            return;
        }

        const animatedElements = document.querySelectorAll('.animate-on-scroll');

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -80px 0px',
            threshold: CONFIG.animationThreshold
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        animatedElements.forEach(element => observer.observe(element));
    }

    // ========================================
    // SLIDER AVANÇAT AMB DRAG
    // ========================================
    
    function initSlider() {
        const slider = document.getElementById('worksSlider');
        const track = document.getElementById('sliderTrack');
        const prevBtn = document.querySelector('.slider__btn--prev');
        const nextBtn = document.querySelector('.slider__btn--next');
        const counterCurrent = document.querySelector('.slider__counter-current');
        const counterTotal = document.querySelector('.slider__counter-total');
        
        if (!slider || !track) return;

        const slides = track.querySelectorAll('.slider__slide');
        if (!slides.length) return;

        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        let translateX = 0;
        let velocity = 0;
        let lastX = 0;
        let lastTime = 0;
        let animationId = null;
        let currentIndex = 0;

        // Actualitzar comptador
        if (counterTotal) {
            counterTotal.textContent = String(slides.length).padStart(2, '0');
        }

        function updateCounter() {
            if (counterCurrent) {
                counterCurrent.textContent = String(currentIndex + 1).padStart(2, '0');
            }
        }

        function getSlideWidth() {
            const slide = slides[0];
            const gap = 16; // Fixed gap value matching CSS
            return slide.offsetWidth + gap;
        }

        function getVisibleSlides() {
            const sliderWidth = slider.offsetWidth;
            const slideWidth = slides[0].offsetWidth;
            return Math.floor(sliderWidth / slideWidth) || 1;
        }

        function getMaxTranslate() {
            const slideWidth = getSlideWidth();
            const visibleSlides = getVisibleSlides();
            const maxIndex = Math.max(0, slides.length - visibleSlides);
            return -maxIndex * slideWidth;
        }

        function clampTranslate(value) {
            return Math.max(getMaxTranslate(), Math.min(0, value));
        }

        function setTranslate(value, smooth = false) {
            translateX = clampTranslate(value);
            
            if (smooth) {
                track.classList.add('snapping');
                track.classList.remove('dragging');
            } else {
                track.classList.add('dragging');
                track.classList.remove('snapping');
            }
            
            track.style.transform = `translateX(${translateX}px)`;
            
            // Calcular índex actual
            const slideWidth = getSlideWidth();
            currentIndex = Math.round(Math.abs(translateX) / slideWidth);
            currentIndex = Math.max(0, Math.min(currentIndex, slides.length - 1));
            updateCounter();
        }

        function snapToSlide() {
            const slideWidth = getSlideWidth();
            const targetIndex = Math.round(Math.abs(translateX) / slideWidth);
            const targetTranslate = -targetIndex * slideWidth;
            
            setTranslate(targetTranslate, true);
            
            setTimeout(() => {
                track.classList.remove('snapping');
            }, 800);
        }

        function momentumScroll() {
            if (Math.abs(velocity) < 0.5) {
                cancelAnimationFrame(animationId);
                snapToSlide();
                return;
            }

            translateX += velocity;
            translateX = clampTranslate(translateX);
            velocity *= CONFIG.sliderMomentum;
            
            track.style.transform = `translateX(${translateX}px)`;
            
            animationId = requestAnimationFrame(momentumScroll);
        }

        function handleStart(e) {
            isDragging = true;
            startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            currentX = startX;
            lastX = startX;
            lastTime = Date.now();
            velocity = 0;
            
            cancelAnimationFrame(animationId);
            track.classList.add('dragging');
            track.classList.remove('snapping');
        }

        function handleMove(e) {
            if (!isDragging) return;
            
            const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const delta = x - currentX;
            currentX = x;
            
            // Calcular velocitat
            const now = Date.now();
            const dt = now - lastTime;
            if (dt > 0) {
                velocity = (x - lastX) / dt * 16;
            }
            lastX = x;
            lastTime = now;
            
            setTranslate(translateX + delta);
        }

        function handleEnd() {
            if (!isDragging) return;
            isDragging = false;
            
            track.classList.remove('dragging');
            
            // Si hi ha velocitat significativa, aplicar momentum
            if (Math.abs(velocity) > 2) {
                momentumScroll();
            } else {
                snapToSlide();
            }
        }

        // Events
        slider.addEventListener('mousedown', handleStart);
        slider.addEventListener('mousemove', handleMove);
        slider.addEventListener('mouseup', handleEnd);
        slider.addEventListener('mouseleave', handleEnd);
        
        slider.addEventListener('touchstart', handleStart, { passive: true });
        slider.addEventListener('touchmove', handleMove, { passive: true });
        slider.addEventListener('touchend', handleEnd);

        // Botons
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const slideWidth = getSlideWidth();
                setTranslate(translateX + slideWidth, true);
                setTimeout(() => track.classList.remove('snapping'), 800);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const slideWidth = getSlideWidth();
                setTranslate(translateX - slideWidth, true);
                setTimeout(() => track.classList.remove('snapping'), 800);
            });
        }

        // Click en slides per obrir lightbox
        slides.forEach((slide, index) => {
            slide.addEventListener('click', (e) => {
                if (Math.abs(currentX - startX) < 5) {
                    // Recollir imatges dels treballs
                    const worksImages = Array.from(document.querySelectorAll('.slider__slide img')).map(img => ({
                        src: img.src,
                        alt: img.alt
                    }));
                    
                    lightboxImages = worksImages;
                    currentGalleryType = 'works';
                    openLightbox(index);
                }
            });
        });

        // Resize
        window.addEventListener('resize', debounce(() => {
            snapToSlide();
        }, 200));

        updateCounter();
    }

    // ========================================
    // LIGHTBOX
    // ========================================
    
    let lightboxCurrentIndex = 0;
    let lightboxImages = [];
    let currentGalleryType = 'works'; // 'works' o 'local'

    function initLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox) return;

        const closeBtn = lightbox.querySelector('.lightbox__close');
        const prevBtn = lightbox.querySelector('.lightbox__nav--prev');
        const nextBtn = lightbox.querySelector('.lightbox__nav--next');
        const overlay = lightbox.querySelector('.lightbox__overlay');

        // Events
        closeBtn?.addEventListener('click', closeLightbox);
        overlay?.addEventListener('click', closeLightbox);
        prevBtn?.addEventListener('click', showPrevImage);
        nextBtn?.addEventListener('click', showNextImage);

        // Teclat
        document.addEventListener('keydown', handleLightboxKeyboard);

        // Touch swipe
        let touchStartX = 0;
        let touchEndX = 0;

        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        lightbox.addEventListener('touchmove', (e) => {
            touchEndX = e.touches[0].clientX;
        }, { passive: true });

        lightbox.addEventListener('touchend', () => {
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > CONFIG.touchThreshold) {
                diff > 0 ? showNextImage() : showPrevImage();
            }
        });
    }

    function openLightbox(index) {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox || !lightboxImages.length) return;

        lightboxCurrentIndex = index;
        updateLightboxImage();
        
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
    }

    function closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox) return;

        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
    }

    function showPrevImage() {
        lightboxCurrentIndex = lightboxCurrentIndex <= 0 
            ? lightboxImages.length - 1 
            : lightboxCurrentIndex - 1;
        updateLightboxImage();
    }

    function showNextImage() {
        lightboxCurrentIndex = lightboxCurrentIndex >= lightboxImages.length - 1 
            ? 0 
            : lightboxCurrentIndex + 1;
        updateLightboxImage();
    }

    function updateLightboxImage() {
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxCounter = document.getElementById('lightboxCounter');
        
        if (!lightboxImage || !lightboxImages[lightboxCurrentIndex]) return;

        const image = lightboxImages[lightboxCurrentIndex];
        
        // Animació
        lightboxImage.style.opacity = '0';
        lightboxImage.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            lightboxImage.src = image.src;
            lightboxImage.alt = image.alt;
            lightboxImage.style.opacity = '1';
            lightboxImage.style.transform = 'scale(1)';
        }, 150);
        
        if (lightboxCounter) {
            const current = String(lightboxCurrentIndex + 1).padStart(2, '0');
            const total = String(lightboxImages.length).padStart(2, '0');
            lightboxCounter.textContent = `${current} / ${total}`;
        }
    }

    function handleLightboxKeyboard(e) {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox?.classList.contains('active')) return;

        switch (e.key) {
            case 'Escape': closeLightbox(); break;
            case 'ArrowLeft': showPrevImage(); break;
            case 'ArrowRight': showNextImage(); break;
        }
    }

    // Exposar globalment
    window.openLightbox = openLightbox;

    // ========================================
    // GALERIA LOCAL LIGHTBOX
    // ========================================
    
    function initGaleriaLightbox() {
        const galeriaItems = document.querySelectorAll('.galeria__item');
        
        galeriaItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                // Recollir imatges de la galeria del local
                const localImages = Array.from(document.querySelectorAll('.galeria__item img')).map(img => ({
                    src: img.src,
                    alt: img.alt
                }));
                
                lightboxImages = localImages;
                currentGalleryType = 'local';
                openLightbox(index);
            });
        });
    }

    // ========================================
    // FAQ ACCORDION
    // ========================================
    
    function initFAQ() {
        const faqItems = document.querySelectorAll('.faq__item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq__question');
            const answer = item.querySelector('.faq__answer');
            
            if (!question || !answer) return;

            question.addEventListener('click', () => {
                const isOpen = answer.classList.contains('open');
                
                // Tancar tots
                faqItems.forEach(otherItem => {
                    const otherQuestion = otherItem.querySelector('.faq__question');
                    const otherAnswer = otherItem.querySelector('.faq__answer');
                    
                    if (otherItem !== item && otherAnswer) {
                        otherAnswer.classList.remove('open');
                        otherQuestion?.setAttribute('aria-expanded', 'false');
                    }
                });
                
                // Toggle actual
                answer.classList.toggle('open');
                question.setAttribute('aria-expanded', !isOpen);
            });
        });
    }

    // ========================================
    // MARQUEE PAUSE ON HOVER (ja en CSS però afegim classe)
    // ========================================
    
    function initMarquee() {
        const marquee = document.querySelector('.marquee');
        if (!marquee) return;

        // El hover ja està gestionat en CSS amb animation-play-state
    }

    // ========================================
    // PARALLAX SUAU (opcional)
    // ========================================
    
    function initParallax() {
        if (prefersReducedMotion()) return;

        const hero = document.querySelector('.hero');
        if (!hero) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrolled = window.scrollY;
                    const heroHeight = hero.offsetHeight;
                    
                    if (scrolled < heroHeight) {
                        const opacity = 1 - (scrolled / heroHeight) * 0.5;
                        const content = hero.querySelector('.hero__content');
                        if (content) {
                            content.style.opacity = Math.max(0, opacity);
                            content.style.transform = `translateY(${scrolled * 0.3}px)`;
                        }
                    }
                    
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ========================================
    // CURSOR CUSTOM (opcional per desktop)
    // ========================================
    
    function initCustomCursor() {
        if (prefersReducedMotion() || 'ontouchstart' in window) return;
        
        // Opcional: implementar cursor personalitzat
    }

    // ========================================
    // PRELOADER (opcional)
    // ========================================
    
    function hidePreloader() {
        document.body.classList.add('loaded');
    }

    // ========================================
    // MODAL HORARI
    // ========================================
    
    function initHorariModal() {
        const openBtn = document.getElementById('openHorariBtn');
        const closeBtn = document.getElementById('closeHorariBtn');
        const modal = document.getElementById('horariModal');
        
        if (!openBtn || !closeBtn || !modal) return;
        
        const overlay = modal.querySelector('.modal__overlay');
        
        function openModal() {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('no-scroll');
        }
        
        function closeModal() {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('no-scroll');
        }
        
        openBtn.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        overlay?.addEventListener('click', closeModal);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // ========================================
    // INIT
    // ========================================
    
    function init() {
        initHeader();
        initSmoothScroll();
        initScrollSpy();
        initScrollAnimations();
        initSlider();
        initLightbox();
        initGaleriaLightbox();
        initFAQ();
        initMarquee();
        initParallax();
        initCustomCursor();
        initHorariModal();
        
        // Hide preloader after a short delay
        setTimeout(hidePreloader, 100);

        console.log('✓ Paso Tattoo Studio - Web inicialitzada');
    }

    // Run
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
