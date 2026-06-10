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
  }

  function fixAbsoluteSlideHeight(slideEl) {
    if (!slideEl || !isMobileView()) return;

    slideEl.style.minHeight = '';

    /* Slides con layout flex en móvil no necesitan cálculo extra */
    if (slideEl.id === 's1' || slideEl.classList.contains('sdiv') || slideEl.id === 's-thx') return;

    const positioned = slideEl.querySelectorAll('.s1-left, .s1-right, .s1-footer, .div-body, .thx-body');
    if (!positioned.length) return;

    let maxBottom = window.innerHeight;
    const slideTop = slideEl.getBoundingClientRect().top;

    positioned.forEach((el) => {
      const rect = el.getBoundingClientRect();
      maxBottom = Math.max(maxBottom, rect.bottom - slideTop);
    });

    slideEl.style.minHeight = `${Math.ceil(maxBottom + 110)}px`;
  }

  function updateScrollIndicators() {
    if (!isMobileView()) {
      document.body.classList.remove('is-mobile');
      slides.forEach((slide) => {
        slide.classList.remove('has-scroll');
        slide.style.minHeight = '';
      });
      return;
    }

    document.body.classList.add('is-mobile');

    slides.forEach((slide) => {
      fixAbsoluteSlideHeight(slide);
      const canScrollY = slide.scrollHeight > slide.clientHeight + 2;
      slide.classList.toggle('has-scroll', canScrollY);
    });
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
  }
  
  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();