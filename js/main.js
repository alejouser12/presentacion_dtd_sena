/**
 * DTD_SENA - Control de presentación
 * Navegación fluida, contador automático de slides,
 * eventos táctiles y de teclado, fullscreen.
 */

(function() {
  // Obtener todas las slides (cualquier elemento con clase 'slide')
  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;
  let currentIndex = 0;        // 0-indexed
  let busy = false;

  // Elementos del DOM
  const pbar = document.getElementById('pbar');
  const ctrSpan = document.getElementById('ctr');
  const prevBtn = document.getElementById('bp');
  const nextBtn = document.getElementById('bn');
  const dotsContainer = document.getElementById('dots');

  // Función para actualizar barra de progreso, contador y dots
  function updateUI() {
    const percent = ((currentIndex + 1) / totalSlides) * 100;
    if (pbar) pbar.style.width = `${percent}%`;
    if (ctrSpan) ctrSpan.textContent = `${currentIndex + 1} / ${totalSlides}`;
    
    // Actualizar dots
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.ndot');
      dots.forEach((dot, idx) => {
        if (idx === currentIndex) dot.classList.add('on');
        else dot.classList.remove('on');
      });
    }
    
    // Estado de botones
    if (prevBtn) prevBtn.disabled = (currentIndex === 0);
    if (nextBtn) nextBtn.disabled = (currentIndex === totalSlides - 1);
  }

  // Resetear animaciones .rv de una slide (opcional, para limpieza)
  function resetReveal(slideEl) {
    const rvs = slideEl.querySelectorAll('.rv');
    rvs.forEach(rv => {
      rv.style.opacity = '0';
      rv.style.transform = 'translateY(28px)';
    });
  }

  // Activar animaciones .rv de una slide
  function triggerReveal(slideEl) {
    // Forzar reflow + microtask para que la transición ocurra
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const rvs = slideEl.querySelectorAll('.rv');
        rvs.forEach(rv => {
          rv.style.opacity = '';
          rv.style.transform = '';
        });
      });
    });
  }

  // Función principal de cambio de slide
  function goToSlide(newIndex, forward = true) {
    if (busy) return;
    if (newIndex === currentIndex) return;
    if (newIndex < 0 || newIndex >= totalSlides) return;
    
    busy = true;
    
    const currentSlide = slides[currentIndex];
    const nextSlide = slides[newIndex];
    
    // Aplicar clase out-left (dirección hacia atrás se maneja con la clase)
    currentSlide.classList.add('out-left');
    currentSlide.classList.remove('active');
    
    // Resetear animaciones de la nueva slide y preparar su transformación inicial
    resetReveal(nextSlide);
    // Dirección visual: si avanza, entra desde derecha; si retrocede, desde izquierda
    if (forward) {
      nextSlide.style.transform = 'translateX(80px) scale(0.96)';
    } else {
      nextSlide.style.transform = 'translateX(-80px) scale(0.96)';
    }
    
    // Forzar reflow para que la transform se aplique antes de activar
    void nextSlide.offsetHeight;
    
    // Activar la nueva slide y limpiar transform
    nextSlide.classList.add('active');
    nextSlide.style.transform = '';
    triggerReveal(nextSlide);
    
    // Actualizar índice y UI
    currentIndex = newIndex;
    updateUI();
    resetSlideScroll(nextSlide);

    // Recalcular scroll tras animación y render de contenido
    setTimeout(() => {
      currentSlide.classList.remove('out-left');
      busy = false;
      updateScrollIndicators();
    }, 380); // Coincide con la transición de salida
  }

  // Navegación pública
  function nextSlide() {
    if (currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1, true);
    }
  }
  
  function prevSlide() {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1, false);
    }
  }

  // Generar dots dinámicamente
  function generateDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('div');
      dot.className = 'ndot';
      if (i === currentIndex) dot.classList.add('on');
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(i, i > currentIndex);
      });
      dotsContainer.appendChild(dot);
    }
  }

  // Eventos de teclado
  function handleKeydown(e) {
    const key = e.code;
    if (key === 'ArrowRight' || key === 'Space' || key === 'ArrowDown') {
      e.preventDefault();
      nextSlide();
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      e.preventDefault();
      prevSlide();
    }
  }

  // Scroll en móvil: detectar overflow y ajustar altura mínima
  const MOBILE_BP = 992;

  function isMobileView() {
    return window.innerWidth <= MOBILE_BP;
  }

  function resetSlideScroll(slideEl) {
    if (!slideEl) return;
    slideEl.scrollTop = 0;
    slideEl.scrollLeft = 0;
    slideEl.querySelectorAll('.sbody, .toc-body').forEach((el) => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    });
  }

  function getScrollAreas(slideEl) {
    const areas = [];
    if (slideEl.classList.contains('slide-stack')) {
      slideEl.querySelectorAll('.sbody, .toc-body').forEach((el) => areas.push(el));
    } else if (slideEl.classList.contains('slide-full')) {
      areas.push(slideEl);
    }
    return areas;
  }

  function markScrollAreas() {
    document.querySelectorAll('.mob-scroll').forEach((el) => el.classList.remove('mob-scroll'));
    if (!isMobileView()) return;

    slides.forEach((slide) => {
      getScrollAreas(slide).forEach((area) => {
        area.classList.add('mob-scroll');
        const canScroll = area.scrollHeight > area.clientHeight + 2;
        area.classList.toggle('has-scroll', canScroll);
      });
    });
  }

  function updateScrollIndicators() {
    if (!isMobileView()) {
      document.body.classList.remove('is-mobile');
      slides.forEach((slide) => {
        slide.classList.remove('has-scroll');
        slide.style.minHeight = '';
        slide.querySelectorAll('.sbody, .toc-body').forEach((el) => {
          el.classList.remove('has-scroll', 'mob-scroll');
        });
      });
      return;
    }

    document.body.classList.add('is-mobile');
    slides.forEach((slide) => {
      slide.style.minHeight = '';
      slide.classList.remove('has-scroll');
    });
    markScrollAreas();
  }

  // Click en zonas laterales (solo escritorio; en móvil usa los botones)
  function handleDeckClick(e) {
    if (isMobileView()) return;
    if (e.target.closest('#nav') || e.target.closest('a') || e.target.closest('button')) return;
    const half = window.innerWidth / 2;
    if (e.clientX > half) nextSlide();
    else prevSlide();
  }

  // Fullscreen toggle
  function toggleFullscreen() {
    const fsBtn = document.getElementById('fsbtn');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error al entrar en pantalla completa: ${err.message}`);
      });
      if (fsBtn) fsBtn.innerHTML = '<i class="fa-solid fa-compress"></i> Salir';
    } else {
      document.exitFullscreen();
      if (fsBtn) fsBtn.innerHTML = '<i class="fa-solid fa-expand"></i> Pantalla completa';
    }
  }

  // Escuchar cambio de fullscreen para actualizar texto del botón
  function handleFullscreenChange() {
    const fsBtn = document.getElementById('fsbtn');
    if (fsBtn) {
      if (document.fullscreenElement) {
        fsBtn.innerHTML = '<i class="fa-solid fa-compress"></i> Salir';
      } else {
        fsBtn.innerHTML = '<i class="fa-solid fa-expand"></i> Pantalla completa';
      }
    }
  }

  // Inicializar la presentación
  function init() {
    // Asegurar que la primera slide está activa y las demás ocultas con estilos correctos
    slides.forEach((slide, idx) => {
      if (idx === 0) {
        slide.classList.add('active');
        slide.style.transform = '';
        triggerReveal(slide);
      } else {
        slide.classList.remove('active');
        slide.style.transform = 'translateX(80px) scale(0.96)';
      }
    });
    
    generateDots();
    updateUI();
    updateScrollIndicators();

    // Asignar eventos globales
    document.addEventListener('keydown', handleKeydown);
    const deck = document.getElementById('deck');
    if (deck) deck.addEventListener('click', handleDeckClick);
    
    const prevButton = document.getElementById('bp');
    const nextButton = document.getElementById('bn');
    if (prevButton) prevButton.addEventListener('click', prevSlide);
    if (nextButton) nextButton.addEventListener('click', nextSlide);
    
    const fsButton = document.getElementById('fsbtn');
    if (fsButton) fsButton.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', updateScrollIndicators);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateScrollIndicators, 150);
    });
    window.addEventListener('load', updateScrollIndicators);
  }
  
  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();