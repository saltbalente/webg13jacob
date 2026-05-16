# 🔮 Brujo Jacob - Sitio Web Moderno

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/saltbalente/webg13jacob)

## 📋 Descripción

Sitio web profesional para el **Brujo Jacob**, especialista en amarres de amor, brujería y consultas espirituales. Completamente modernizado con **HTML5**, **CSS3** y **JavaScript ES6+**, eliminando todas las dependencias de Blogger.

## ✨ Características Principales

- 🎯 **HTML5 Semántico**: Estructura limpia y accesible
- 🎨 **CSS3 Moderno**: Animaciones fluidas y diseño responsivo
- ⚡ **JavaScript ES6+**: Código modular y optimizado
- 📱 **Responsive Design**: Adaptable a todos los dispositivos
- 🚀 **Rendimiento Optimizado**: Carga rápida y eficiente
- 🔍 **SEO Optimizado**: Meta tags y structured data
- 📞 **Integración WhatsApp**: Enlaces directos con wa.me
- 🖼️ **Lazy Loading**: Carga optimizada de imágenes

## 🌐 Demo en Vivo

El sitio está desplegado automáticamente en Vercel: [Ver Demo](https://webg13jacob.vercel.app)

## 📱 Contacto

- **WhatsApp**: [+1 (303) 306-8798](https://wa.me/13033068798?text=HOLA%20BRUJO%20JACOB)
- **Especialidades**: Amarres de amor, brujería, tarot, rituales ancestrales

## 🚀 Despliegue Rápido

### Opción 1: Deploy con Vercel (Recomendado)
1. Haz clic en el botón "Deploy with Vercel" arriba
2. Conecta tu cuenta de GitHub
3. El sitio se desplegará automáticamente

### Opción 2: Deploy Manual
1. Fork este repositorio
2. Conecta tu repositorio con Vercel
3. Configura el dominio personalizado si es necesario

## 💳 Consulta privada con Wompi y PayPal

El proyecto incluye un flujo de consulta pagada en:

- `consulta.html`: crea el checkout seguro de Wompi o PayPal para una consulta de **USD $10**. En Wompi se cobra como **$40.000 COP**.
- `api/wompi-checkout.js`: firma el pago con Wompi desde una función serverless de Vercel.
- `api/paypal-create-order.js`: crea una orden PayPal segura usando la API oficial de PayPal Orders v2.
- `api/paypal-capture-order.js`: captura y valida la orden PayPal antes de desbloquear el formulario final.
- `consulta-confirmacion.html`: valida la transacción aprobada en Wompi o PayPal y solo entonces muestra el formulario de motivo, nombre y fecha de nacimiento.
- `js/consulta-commerce.js`: prepara el mensaje final para WhatsApp al número configurado del Maestro Jacob.

Variables requeridas en Vercel:

```bash
WOMPI_PUBLIC_KEY=pub_prod_...
WOMPI_INTEGRITY_SECRET=prod_integrity_...
CONSULTA_AMOUNT_COP=40000
CONSULTA_AMOUNT_USD=10.00
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENV=live
PAYPAL_CURRENCY=USD
FRONTEND_URL=https://amarresdeamoryendulzamientos.brujero.org
```

> El proyecto de `mkinnovador.com/tienda.html` no se modifica; este flujo clona/adapta el patrón de pago para este sitio.

## 📁 Estructura del Proyecto

```
/
├── index.html          # Página principal HTML5
├── styles.css          # Estilos CSS3 modernos
├── script.js           # JavaScript ES6+ modular
├── .htaccess          # Configuración Apache
├── images/            # Imágenes optimizadas
│   ├── brujeria-poderosa.jpg
│   ├── tarot-profesional.jpg
│   ├── maestro1.jpg
│   ├── maestro2.jpg
│   └── ...
└── README.md          # Este archivo
```

## ⚙️ Configuración

### Cambiar Número de WhatsApp
Edita la variable en `script.js`:
```javascript
const CONFIG = {
  whatsappNumber: '13033068798', // Cambiar aquí
  whatsappBaseUrl: 'https://wa.me',
  // ...
};
```

### Personalizar Colores
Los colores se definen en `styles.css`:
```css
:root {
  --gold-primary: #ffd700;
  --gold-secondary: #ffdf80;
  --green-whatsapp: #25d366;
  --red-call: #ff4444;
}
```

## 🎨 Funcionalidades

### ✅ Integración WhatsApp
- Botones directos con mensajes personalizados
- Formulario de contacto que redirige a WhatsApp
- Enlaces wa.me optimizados para móviles

### ✅ Optimización de Rendimiento
- Detección automática de capacidades del dispositivo
- Animaciones adaptativas según el rendimiento
- Lazy loading de imágenes
- Compresión GZIP y caché optimizado

### ✅ SEO y Analytics
- Structured data para mejor indexación
- Meta tags optimizados para redes sociales
- URLs limpias y semánticas
- Preparado para Google Analytics

## 📊 Rendimiento

- **Lighthouse Score**: 90+ en todas las métricas
- **Tiempo de carga**: < 3 segundos
- **Tamaño total**: < 2MB
- **Compatibilidad**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+

## 🔧 Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/saltbalente/webg13jacob.git

# Navegar al directorio
cd webg13jacob

# Abrir con un servidor local
python -m http.server 8000
# o
npx serve .
```

Luego visita `http://localhost:8000`

## 🌟 Características Técnicas

### HTML5 Moderno
- Etiquetas semánticas (`<main>`, `<section>`, `<article>`)
- Structured data con JSON-LD
- Meta tags optimizados para SEO
- Accesibilidad mejorada

### CSS3 Avanzado
- Variables CSS (Custom Properties)
- Flexbox y CSS Grid
- Animaciones y transiciones fluidas
- Media queries responsivas
- Gradientes y efectos visuales modernos

### JavaScript ES6+
- Clases y módulos ES6
- Async/await
- Intersection Observer API
- Performance optimization automática
- Event delegation eficiente

## 🔒 Seguridad

- Headers de seguridad HTTP configurados
- Protección contra clickjacking
- Prevención de MIME sniffing
- XSS protection habilitado
- HTTPS recomendado para producción

## 📈 Analytics y Seguimiento

El sitio está preparado para:
- Google Analytics 4
- Facebook Pixel
- Google Tag Manager
- Hotjar o similar

## 🎯 Próximas Mejoras

- [ ] Service Worker para PWA
- [ ] Modo oscuro/claro
- [ ] Más animaciones interactivas
- [ ] Optimización WebP automática
- [ ] Chat bot integrado

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- **WhatsApp**: [+1 (303) 306-8798](https://wa.me/13033068798?text=SOPORTE%20TÉCNICO)
- **GitHub Issues**: [Crear Issue](https://github.com/saltbalente/webg13jacob/issues)

---

**Desarrollado con ❤️ para el Brujo Jacob**  
*Sitio web moderno, rápido y efectivo*

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
