// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = {
  whatsappNumber: '13033068798',
  whatsappBaseUrl: 'https://wa.me',
  animationDuration: 300,
  scrollThreshold: 100
};

// ===== UTILIDADES =====
const Utils = {
  // Debounce function para optimizar eventos
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function para scroll events
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  },

  // Detectar si el elemento está visible en viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Smooth scroll to element
  scrollToElement(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  },

  // Generar URL de WhatsApp
  generateWhatsAppUrl(message = 'NECESITO AYUDA') {
    const encodedMessage = encodeURIComponent(message);
    return `${CONFIG.whatsappBaseUrl}/${CONFIG.whatsappNumber}?text=${encodedMessage}`;
  }
};

// ===== DETECCIÓN DE RENDIMIENTO =====
class PerformanceOptimizer {
  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.applyOptimizations();
  }

  detectDeviceCapabilities() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowMemory = navigator.deviceMemory ? navigator.deviceMemory < 4 : false;
    const isLowCPU = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
    
    let performanceLevel = 'high';
    
    if (isMobile && (isLowMemory || isLowCPU)) {
      performanceLevel = 'low';
    } else if (isMobile || isLowMemory || isLowCPU) {
      performanceLevel = 'medium';
    }

    return {
      isMobile,
      isLowMemory,
      isLowCPU,
      performanceLevel
    };
  }

  applyOptimizations() {
    document.body.classList.add(`perf-${this.deviceCapabilities.performanceLevel}`);
    
    if (this.deviceCapabilities.performanceLevel === 'low') {
      this.disableHeavyAnimations();
      this.optimizeImages();
    }
  }

  disableHeavyAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      .perf-low * {
        animation-duration: 0.3s !important;
        transition-duration: 0.2s !important;
      }
      .perf-low .heavy-animation {
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  optimizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });
  }
}

// ===== GENERADOR DE PALABRAS ALEATORIAS =====
class WordGenerator {
  constructor() {
    this.words = [
      'los mejores brujos', 'brujos de verdad', 'brujos cerca de mi',
      'brujos y hechiceros', 'brujos gratis en linea', 'brujeria negra',
      'hechizos efectivos', 'tarot brujo', 'brujos en estados unidos',
      'vudu brujeria', 'brujos consulta gratis', 'bruja', 'hechiceria',
      'hechizo de amor', 'amarres de amor', 'hechizos efectivos',
      'conjuro de amor', 'un amarre', 'amarres de amor brujeria',
      'amarres efectivos para el amor', 'amarre a una persona',
      'amarre amor', 'hechizo de endulzamiento', 'endulzamiento de amor',
      'amarre de brujeria', 'espiritismo y santeria', 'espiritismo',
      'centro espiritista', 'centro espiritista cerca de mi',
      'brujo amarres', 'magia negra para el amor', 'hechizo para que regrese',
      'como hacer un amarre de amor', 'un amarre de amor',
      'hechizos para recuperar a tu pareja', 'brujo para amarres',
      'que tan efectivo es un amarre de amor', 'amarres de amor near me',
      'necesito un amarre de amor urgente', 'necesito un amarre de amor',
      'los amarres son verdaderos', 'amarre de amor cerca de mi',
      'brujeria', 'brujos', 'endulzamiento de pareja', 'brujeria brujeria',
      'espiritista near me', 'brujos amarres', 'amarres de amor',
      'brujeria para el amor', 'como hacer un amarre', 'poderoso amarre de amor'
    ];
    this.usedWords = new Set();
  }

  getRandomWords(count = 8) {
    const availableWords = this.words.filter(word => !this.usedWords.has(word));
    
    if (availableWords.length < count) {
      this.usedWords.clear();
      return this.getRandomWords(count);
    }

    const selectedWords = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      const word = availableWords.splice(randomIndex, 1)[0];
      selectedWords.push(word);
      this.usedWords.add(word);
    }

    return selectedWords;
  }

  populateContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const words = this.getRandomWords();
    
    words.forEach((word, index) => {
      const wordElement = document.createElement('strong');
      wordElement.textContent = word;
      wordElement.style.animationDelay = `${index * 0.1}s`;
      container.appendChild(wordElement);
    });
  }
}

// ===== ANIMACIONES Y EFECTOS =====
class AnimationController {
  constructor() {
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    this.setupIntersectionObserver();
    this.setupScrollAnimations();
  }

  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          this.observer.unobserve(entry.target);
        }
      });
    }, this.observerOptions);

    // Observar elementos que necesitan animación
    const elementsToAnimate = document.querySelectorAll(
      '.description, .mystic-card, .testimonial, .testimonial2, .masonry-grid-item'
    );
    
    elementsToAnimate.forEach(el => {
      this.observer.observe(el);
    });
  }

  setupScrollAnimations() {
    const handleScroll = Utils.throttle(() => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.parallax-element');
      
      parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    }, 16);

    window.addEventListener('scroll', handleScroll);
  }

  addFloatingEffect(element) {
    element.classList.add('float-effect');
  }

  addGlowEffect(element) {
    element.classList.add('glow-effect');
  }
}

// ===== FORMULARIO DE WHATSAPP =====
class WhatsAppForm {
  constructor() {
    this.setupFormHandlers();
  }

  setupFormHandlers() {
    // Formulario principal
    const sendButton = document.getElementById('sendMessage');
    if (sendButton) {
      sendButton.addEventListener('click', this.handleFormSubmit.bind(this));
    }

    // Botones de WhatsApp
    const whatsappButtons = document.querySelectorAll('.whatsapp-button, .mystic-button[href*="whatsapp"], .boton-magico[href*="whatsapp"]');
    whatsappButtons.forEach(button => {
      button.addEventListener('click', this.handleWhatsAppClick.bind(this));
    });

    // Contenedor de WhatsApp flotante
    const whatsappContainer = document.getElementById('whatsapp-container');
    if (whatsappContainer) {
      whatsappContainer.addEventListener('click', () => {
        window.open(Utils.generateWhatsAppUrl(), '_blank');
      });
    }
  }

  handleFormSubmit(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('name');
    const messageInput = document.getElementById('message');
    
    if (!nameInput || !messageInput) return;
    
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!name || !message) {
      this.showNotification('Por favor, completa todos los campos', 'error');
      return;
    }
    
    const fullMessage = `Hola, soy ${name}. ${message}`;
    const whatsappUrl = Utils.generateWhatsAppUrl(fullMessage);
    
    window.open(whatsappUrl, '_blank');
    
    // Limpiar formulario
    nameInput.value = '';
    messageInput.value = '';
    
    this.showNotification('Redirigiendo a WhatsApp...', 'success');
  }

  handleWhatsAppClick(event) {
    event.preventDefault();
    const message = event.target.dataset.message || 'NECESITO AYUDA';
    const whatsappUrl = Utils.generateWhatsAppUrl(message);
    window.open(whatsappUrl, '_blank');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 2rem;
      background: ${type === 'error' ? '#ff4444' : '#25d366'};
      color: white;
      border-radius: 10px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// ===== EFECTOS VISUALES =====
class VisualEffects {
  constructor() {
    this.setupHoverEffects();
    this.setupClickEffects();
    this.setupParallaxEffects();
  }

  setupHoverEffects() {
    // Efecto hover para imágenes
    const images = document.querySelectorAll('.mystic-image, .masonry-grid-item img');
    images.forEach(img => {
      img.addEventListener('mouseenter', () => {
        img.style.transform = 'scale(1.05)';
        img.style.filter = 'brightness(1.1)';
      });
      
      img.addEventListener('mouseleave', () => {
        img.style.transform = 'scale(1)';
        img.style.filter = 'brightness(0.8)';
      });
    });

    // Efecto hover para botones
    const buttons = document.querySelectorAll('.mystic-button, .button, .whatsapp-button');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05) translateY(-2px)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1) translateY(0)';
      });
    });
  }

  setupClickEffects() {
    // Efecto ripple para botones
    const buttons = document.querySelectorAll('.mystic-button, .button, .whatsapp-button, .boton-magico');
    buttons.forEach(button => {
      button.addEventListener('click', this.createRippleEffect.bind(this));
    });
  }

  createRippleEffect(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  setupParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.arcane-emblem, .mystic-particles');
    parallaxElements.forEach(element => {
      element.classList.add('parallax-element');
      element.dataset.speed = '0.3';
    });
  }
}

// ===== OPTIMIZACIÓN DE IMÁGENES =====
class ImageOptimizer {
  constructor() {
    this.setupLazyLoading();
    this.optimizeImagePaths();
  }

  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }

  optimizeImagePaths() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Corregir rutas de imágenes de Blogger
      if (img.src.includes('blogger.googleusercontent.com')) {
        const newSrc = img.src.replace('../blogger.googleusercontent.com/img/', './images/');
        img.src = newSrc;
      }
      
      // Añadir atributos de optimización
      if (!img.loading) {
        img.loading = 'lazy';
      }
      if (!img.decoding) {
        img.decoding = 'async';
      }
    });
  }
}

// ===== INICIALIZACIÓN =====
class App {
  constructor() {
    this.performanceOptimizer = new PerformanceOptimizer();
    this.wordGenerator = new WordGenerator();
    this.animationController = new AnimationController();
    this.whatsappForm = new WhatsAppForm();
    this.visualEffects = new VisualEffects();
    this.imageOptimizer = new ImageOptimizer();
    
    this.init();
  }

  init() {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.onDOMReady.bind(this));
    } else {
      this.onDOMReady();
    }
  }

  onDOMReady() {
    console.log('🔮 Brujo Jacob - Sitio web cargado correctamente');
    
    // Generar palabras aleatorias
    this.wordGenerator.populateContainer('wordsContainer');
    
    // Configurar enlaces telefónicos
    this.setupPhoneLinks();
    
    // Configurar smooth scroll
    this.setupSmoothScroll();
    
    // Añadir efectos CSS adicionales
    this.addCSSAnimations();
    
    // Configurar eventos de ventana
    this.setupWindowEvents();
  }

  setupPhoneLinks() {
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
      link.addEventListener('click', () => {
        console.log('📞 Llamada iniciada');
      });
    });
  }

  setupSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    scrollLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          Utils.scrollToElement(targetElement, 80);
        }
      });
    });
  }

  addCSSAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
      }
      
      .notification {
        animation: slideIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
  }

  setupWindowEvents() {
    // Evento de redimensionamiento
    window.addEventListener('resize', Utils.debounce(() => {
      console.log('🔄 Ventana redimensionada');
      // Reajustar elementos si es necesario
    }, 250));

    // Evento de scroll para efectos adicionales
    window.addEventListener('scroll', Utils.throttle(() => {
      const scrolled = window.pageYOffset;
      
      // Mostrar/ocultar botones flotantes basado en scroll
      const floatingButtons = document.querySelector('.contenedor-botones-misticos');
      if (floatingButtons) {
        if (scrolled > CONFIG.scrollThreshold) {
          floatingButtons.style.opacity = '1';
          floatingButtons.style.transform = 'translateY(0)';
        } else {
          floatingButtons.style.opacity = '0.8';
          floatingButtons.style.transform = 'translateY(10px)';
        }
      }
    }, 16));

    // Evento de visibilidad de página
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('👁️ Página oculta');
      } else {
        console.log('👁️ Página visible');
      }
    });
  }
}

// ===== INICIALIZAR APLICACIÓN =====
new App();
