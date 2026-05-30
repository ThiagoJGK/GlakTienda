# 🌿 ESPECIFICACIÓN DEL SISTEMA DE DISEÑO — GLAK TIENDA
## Concepto Rector: "Naturaleza Sofisticada — lo orgánico viste con intención"

Este documento contiene la especificación formal y el manual de implementación técnica del Sistema de Diseño de **GLak Tienda**. Está diseñado bajo una filosofía que combina texturas orgánicas e identidades botánicas con maquetados de moda editorial de alta costura.

El enfoque técnico es estrictamente **Mobile-first** y **Performance-first**, minimizando el uso de JavaScript en favor de características nativas del navegador (CSS moderno, aceleración por GPU, y scroll-driven animations).

---

## 🎨 1. TOKENS DE DISEÑO (DESIGN TOKENS)

Todos los tokens de diseño están definidos como propiedades personalizadas de CSS (variables CSS) en el `:root` de [globals.css](file:///c:/Users/thiag/Desktop/Files/Projects/Glak%20Tienda/GLak%20Tienda%20Web/glak-tienda/src/app/globals.css). Esto permite una inyección instantánea en módulos CSS y componentes de React.

### A. Paleta de Colores (Avocado + Lemon Chiffon)

La identidad de marca de GLak Tienda gira en torno a tonos tierra y cítricos suaves, utilizando variaciones de opacidad (tints) para crear jerarquías fluidas.

| Variable CSS | Tipo | Valor Hex / RGBA | Propósito de Uso |
| :--- | :--- | :--- | :--- |
| `--bg-primary` | Fondo | `#FDFBF5` | Base Warm Cream / Ivory para todo el body |
| `--bg-secondary` | Fondo | `#FFF8B9` | Soft Lemon Chiffon para secciones destacadas |
| `--bg-surface` | Fondo | `#FFFFFF` | Blanco puro para tarjetas, inputs y contenedores |
| `--bg-subtle` | Fondo | `#F5F0E6` | Base neutra cálida para elementos secundarios |
| `--bg-overlay` | Fondo | `rgba(0, 0, 0, 0.4)` | Fondo para modales, filtros móviles y cajones |
| `--accent-primary` | Acento | `#568203` | Verde Aguacate profundo (Deep Avocado Green) |
| `--accent-hover` | Acento | `#456A02` | Variación más oscura para estados `:hover` |
| `--accent-pressed`| Acento | `#375501` | Verde profundo para clics activos |
| `--accent-light` | Acento | `rgba(86, 130, 3, 0.08)`| Superficies suaves tintadas con verde aguacate |
| `--accent-glass` | Acento | `rgba(86, 130, 3, 0.05)`| Base para elementos con desenfoque translúcido |
| `--text-primary` | Texto | `#1A1A17` | Gris carbón orgánico de alta legibilidad |
| `--text-secondary`| Texto | `#5C5C52` | Gris tierra medio para subtítulos y descripciones |
| `--text-tertiary` | Texto | `#8A8A7A` | Gris piedra para placeholders e iconos |
| `--text-on-accent`| Texto | `#FFFFFF` | Contraste de texto sobre botones principales |
| `--border-subtle` | Borde | `rgba(86, 130, 3, 0.12)`| Bordes finos de tablas y tarjetas |
| `--border-strong` | Borde | `rgba(86, 130, 3, 0.25)`| Bordes de inputs inactivos y botones secundarios |

---

### B. Sombras Orgánicas con Tinte Botánico (Soft Depth Shadows)

En lugar de utilizar sombras grises neutras o negras estériles, el sistema de GLak Tienda difumina sombras tintadas con el color de acento `--accent-primary` (`rgba(86, 130, 3, ...)`). Esto emula la luz natural filtrada a través del follaje, aportando una profundidad tridimensional premium y orgánica.

*   `--shadow-xs`: `0 2px 4px rgba(86, 130, 3, 0.03)`
*   `--shadow-sm`: `0 4px 12px rgba(86, 130, 3, 0.05)`
*   `--shadow-md`: `0 8px 24px rgba(86, 130, 3, 0.06)`
*   `--shadow-lg`: `0 16px 40px rgba(86, 130, 3, 0.08)`
*   `--shadow-xl`: `0 24px 60px rgba(0, 0, 0, 0.08)` (Reservada para modales suspendidos)

---

### C. Dinámica de Esquinas (High Radius Soft UI)

El diseño adopta esquinas redondeadas sumamente suaves y fluidas para reforzar la sensación de amabilidad orgánica.

*   `--radius-sm`: `12px` (Elementos de interfaz pequeños, chips de talles/colores)
*   `--radius-md`: `16px` (Inputs, tarjetas de productos, cajones de carrito)
*   `--radius-lg`: `24px` (Botones de llamado a la acción principales, popovers flotantes)
*   `--radius-xl`: `32px` (Modales flotantes grandes y banners de colecciones)
*   `--radius-pill`: `9999px` (Cápsula perfecta para badges e iconos interactivos)

---

### D. Escala de Espaciado (Spacing Scale)

Basada en múltiplos de `4px` representados en unidades `rem`, garantizando consistencia geométrica a lo largo de todas las vistas.

| Token | Equivalente | Uso Recomendado |
| :--- | :--- | :--- |
| `--space-1` | `0.25rem` (`4px`) | Micro-ajustes de padding e iconos |
| `--space-2` | `0.5rem` (`8px`) | Espaciado entre chips, etiquetas e inputs |
| `--space-3` | `0.75rem` (`12px`) | Padding interno de inputs y tarjetas móviles |
| `--space-4` | `1rem` (`16px`) | Padding base de grillas y contenedores móviles |
| `--space-5` | `1.25rem` (`20px`) | Márgenes de títulos de sección |
| `--space-6` | `1.5rem` (`24px`) | Padding intermedio y separación de layouts |
| `--space-8` | `2rem` (`32px`) | Padding de cabeceras y márgenes en tablet |
| `--space-10` | `2.5rem` (`40px`) | Separación vertical de bloques en layouts |
| `--space-12` | `3rem` (`48px`) | Padding de secciones de landing móviles |
| `--space-16` | `4rem` (`64px`) | Padding de secciones en tablet |
| `--space-20` | `5rem` (`80px`) | Padding de secciones en desktop |
| `--space-24` | `6rem` (`96px`) | Límites extremos de secciones editoriales |

---

## 📐 2. PAUTAS DE TIPOGRAFÍA FLUIDA (FLUID TYPOGRAPHY)

El sistema de GLak Tienda no utiliza saltos tipográficos abruptos basados en media queries estáticos. En su lugar, emplea ecuaciones `clamp()` de CSS para escalar dinámicamente el tamaño de la tipografía entre pantallas de teléfonos móviles (`320px`) y monitores de escritorio (`1280px`+).

### A. Ecuaciones Clamp del Sistema

*   **Extra Small (`--text-xs`)**: `clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem)`
    *   *Uso*: Notas al pie, etiquetas secundarias de tallas y badges de stock.
*   **Small (`--text-sm`)**: `clamp(0.8125rem, 0.775rem + 0.2vw, 0.875rem)`
    *   *Uso*: Texto de inputs, botones secundarios, y precios tachados.
*   **Base / Body (`--text-base`)**: `clamp(0.875rem, 0.825rem + 0.25vw, 1rem)`
    *   *Uso*: Párrafos descriptivos, descripciones de producto y flujo de lectura estándar.
*   **Large (`--text-lg`)**: `clamp(1rem, 0.925rem + 0.4vw, 1.125rem)`
    *   *Uso*: Nombres de productos en listas y subtítulos intermedios.
*   **Extra Large (`--text-xl`)**: `clamp(1.125rem, 1rem + 0.6vw, 1.25rem)`
    *   *Uso*: Precios destacados de productos y títulos de tarjetas.
*   **2XL (`--text-2xl`)**: `clamp(1.25rem, 1.1rem + 0.8vw, 1.5rem)`
    *   *Uso*: Subtítulos de sección y cabeceras de cajones laterales.
*   **3XL (`--text-3xl`)**: `clamp(1.5rem, 1.25rem + 1.2vw, 1.875rem)`
    *   *Uso*: Títulos de tarjetas destacadas en Bento Grid.
*   **4XL (`--text-4xl`)**: `clamp(1.875rem, 1.5rem + 1.8vw, 2.25rem)`
    *   *Uso*: Títulos secundarios de secciones en landings.
*   **5XL (`--text-5xl`)**: `clamp(2.25rem, 1.75rem + 2.5vw, 3rem)`
    *   *Uso*: Títulos principales de Hero en el escaparate y páginas de colecciones.

---

### B. Distribución de Familias Tipográficas

El sistema combina tres familias tipográficas cargadas a través de Next.js Fonts:

1.  **`Outfit` (`--font-outfit`)**: Tipografía geométrica y moderna con gran presencia estructural. Se utiliza exclusivamente para elementos de interfaz interactivos y encabezados (`h1` a `h6`, `.font-heading`, `.btn`).
2.  **`Inter` (`--font-inter`)**: Tipografía sans-serif de excelente legibilidad en pantallas de alta densidad. Se utiliza en todo el cuerpo del texto (`body`), descripciones de productos y flujos de lectura prolongados.
3.  **`Playfair Display` (`.font-editorial`)**: Serif editorial clásico e italiano. Se utiliza en su variante itálica (`italic`) para palabras destacadas dentro de títulos y banners, añadiendo un sello sofisticado de alta costura a la marca.

---

## 🎨 3. SISTEMA DE DISEÑO CSS MODULES

Para evitar colisiones de selectores y mantener una arquitectura desacoplada, el proyecto utiliza **CSS Modules** (`.module.css`). Esto encapsula los estilos a nivel de componente mientras consumen los tokens globales.

### A. Clases y Utilidades Universales

Cualquier componente modular puede heredar clases estructuradas definidas en el archivo global:

*   **`.container`**: Contenedor principal responsive con límites fluidos (`--container-max`) y paddings laterales adaptativos (`--container-padding`).
*   **`.section`**: Aplica paddings verticales fluidos adaptados a mobile, tablet y desktop (`--space-12`, `--space-16`, `--space-20` respectivamente).
*   **Ayudantes de Flexbox & Grilla**: Clases atómicas como `.flex`, `.flex-col`, `.items-center`, `.justify-between` y `.grid-cols-2` mapeadas con `gap-1` hasta `gap-8` basados en la escala de espaciado.
*   **Ocultación Adaptativa**:
    *   `.hide-mobile`: Oculta elementos en vistas móviles (menores a `768px`).
    *   `.hide-desktop`: Oculta elementos en vistas de escritorio (mayores a `768px`).
    *   `.sr-only`: Oculta elementos visualmente pero los mantiene legibles para lectores de pantalla, garantizando el cumplimiento de accesibilidad (A11y).

---

### B. Estilos Base de Componentes Estándar

El sistema provee interfaces para los bloques interactivos más recurrentes:

#### 1. Botones (`.btn`)
Provistos con un tamaño mínimo táctil de **`44px x 44px`** para cumplir con las directrices de accesibilidad en móviles:
```css
/* Botón Primario */
.btnPrimary {
  background-color: var(--accent-primary);
  color: var(--text-on-accent);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}
.btnPrimary:hover {
  background-color: var(--accent-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.btnPrimary:active {
  background-color: var(--accent-pressed);
  transform: translateY(0);
}
```

#### 2. Tarjetas (`.card`)
Incorporan transformaciones de elevación por hardware y micro-zooms en la imagen al hacer foco o hover:
```css
.card {
  background-color: var(--bg-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow var(--transition-base), transform var(--transition-base);
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}
.cardImage img {
  transition: transform var(--transition-slow);
}
.card:hover .cardImage img {
  transform: scale(1.06);
}
```

---

## 📱 4. DISEÑO DE BOTONERA MÓVIL (MOBILE BOTTOM-NAV)

El cajón de navegación inferior móvil ([BottomNav.tsx](file:///c:/Users/thiag/Desktop/Files/Projects/Glak%20Tienda/GLak%20Tienda%20Web/glak-tienda/src/components/layout/BottomNav.tsx)) es uno de los elementos interactivos más sofisticados de la aplicación. Su diseño está optimizado para su uso a una sola mano (Thumb Zone).

### A. La Técnica del Corte de Notcha (Notch Cutout Mask)

Para permitir que el botón central de la tienda sobresalga visualmente del contenedor flotante translúcido sin romper la difuminación del fondo (`backdrop-filter`), se utiliza una máscara de gradiente radial nativa en CSS.

Esto reemplaza implementaciones pesadas con SVG y evita el uso de propiedades como `filter: drop-shadow` o `transform` directamente sobre el contenedor, las cuales inutilizan la aceleración por hardware de `backdrop-filter` en navegadores basados en Chromium y Safari.

```css
.bottomNavBackground {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-pill);
  /* Máscara radial que recorta un semicírculo transparente en el borde superior central */
  -webkit-mask-image: radial-gradient(circle at 50% 4px, transparent 36px, black 37px);
  mask-image: radial-gradient(circle at 50% 4px, transparent 36px, black 37px);
}
```

### B. Evitar Conflictos de Filtros y Posicionamiento

*   **Sombra Separada**: Dado que el contenedor utiliza `backdrop-filter` y una máscara de recorte, las sombras estándares se anularían. El sistema lo resuelve inyectando la sombra en un pseudo-elemento `::before` de forma independiente, libre de máscaras:
    ```css
    .bottomNavContainer::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius-pill);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
      z-index: -1;
    }
    ```
*   **Posicionamiento Anti-Teclado y Safe Areas**: La barra flotante se posiciona utilizando variables del entorno del sistema para evitar solapar barras nativas de iOS o Android:
    ```css
    bottom: calc(var(--space-6) + env(safe-area-inset-bottom, 0px));
    ```

### C. Comportamiento en Scroll (Scroll Hiding Logic)

El menú móvil incorpora una lógica reactiva al scroll que lo oculta cuando el usuario navega hacia abajo (priorizando la lectura de productos) y lo revela inmediatamente al hacer un leve scroll hacia arriba.
*   **Evento Pasivo**: El detector de scroll utiliza el flag `{ passive: true }` para asegurar que no bloquee el hilo principal de renderizado de la pantalla.
*   **Transición Suave**: Al ocultarse, se desliza hacia abajo mediante una transformación física optimizada:
    ```css
    .hidden {
      transform: translateY(160px);
    }
    ```

---

## ⚡ 5. ANIMACIONES BASADAS EN SCROLL SIN JAVASCRIPT (ZERO-JS SCROLL-DRIVEN)

Para ofrecer una experiencia inmersiva y de alto rendimiento que no afecte las métricas de Core Web Vitals (INP y LCP), GLak Tienda utiliza **Scroll-Driven Animations** nativas del navegador. Las animaciones se ejecutan directamente en el hilo del compositor de la GPU, consumiendo cero ciclos de procesamiento de JavaScript.

### A. Especificaciones de Animación y Keyframes

El sistema implementa tres efectos principales de revelado y un efecto de paralaje:

#### 1. Revelación Vertical (`.reveal-up`)
Desplaza y desvanece sutilmente los elementos de abajo hacia arriba a medida que entran en la zona visible:
```css
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reveal-up {
  animation: fadeSlideUp ease-out both;
  animation-timeline: view();
  animation-range: entry 0% entry 35%;
}
```

#### 2. Revelación Lateral (`.reveal-left`)
Adecuada para galerías y transiciones de banners horizontales:
```css
@keyframes fadeSlideLeft {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.reveal-left {
  animation: fadeSlideLeft ease-out both;
  animation-timeline: view();
  animation-range: entry 0% entry 35%;
}
```

#### 3. Zoom de Escala (`.reveal-scale`)
Ideal para imágenes Bento de categorías y cuadrículas destacadas:
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.reveal-scale {
  animation: scaleIn ease-out both;
  animation-timeline: view();
  animation-range: entry 0% entry 35%;
}
```

#### 4. Paralaje Físico (`.parallax`)
Utilizado en el fondo de secciones Hero para dar sensación de profundidad:
```css
@keyframes parallaxShift {
  from { transform: translateY(0); }
  to { transform: translateY(-80px); }
}

.parallax {
  animation: parallaxShift linear both;
  animation-timeline: scroll();
  animation-range: 0% 60%;
}
```

---

### B. Escalonamiento de Hijos (Staggered Entrance)

Para listas de tarjetas de productos, se puede aplicar la clase `.stagger-children` sobre el contenedor de la grilla. Esto introduce retardos progresivos nativos basados en el índice del elemento hijo (`nth-child`):
```css
.stagger-children > * {
  animation: fadeSlideUp ease-out both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 80ms; }
.stagger-children > *:nth-child(3) { animation-delay: 160ms; }
.stagger-children > *:nth-child(4) { animation-delay: 240ms; }
.stagger-children > *:nth-child(5) { animation-delay: 320ms; }
.stagger-children > *:nth-child(6) { animation-delay: 400ms; }
```

---

### C. Compatibilidad de Navegadores y Accesibilidad

1.  **Resguardo para Navegadores sin Soporte (Graceful Fallback)**:
    Dado que las líneas de tiempo de scroll (`animation-timeline`) son una característica moderna, el sistema inyecta una regla `@supports not` para desactivar las animaciones en navegadores antiguos (como versiones antiguas de Safari o Firefox), asegurando que los elementos se mantengan completamente visibles de forma estática en lugar de quedarse con opacidad cero.
    ```css
    @supports not (animation-timeline: view()) {
      .reveal-up,
      .reveal-left,
      .reveal-scale,
      .stagger-children > *,
      .parallax {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }
    ```

2.  **Pauta de Accesibilidad de Movimiento (A11y - Reduced Motion)**:
    Para respetar las preferencias del sistema de los usuarios con trastornos vestibulares o sensibilidad al movimiento, el sistema anula inmediatamente cualquier tipo de animación y transición si se detecta la bandera `prefers-reduced-motion`:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    ```

---

## 🔮 6. SISTEMA DE VIDRIO LÍQUIDO (LIQUID GLASS SYSTEM)

Para dotar al escaparate de una estética premium translúcida de alta costura, GLak Tienda emplea filtros de desenfoque de fondo optimizados. Esta propiedad está restringida **únicamente** a elementos con posición fija o absoluta (`fixed` / `absolute`) para evitar recálculos masivos de layout (repaints) durante el scroll del usuario.

*   **Barra de Navegación (`.glass-navbar`)**:
    ```css
    background: rgba(253, 251, 245, 0.72);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(86, 130, 3, 0.12);
    ```
*   **Fondo de Botonera Móvil (`.glass-float`)**:
    ```css
    background: rgba(255, 255, 255, 0.72);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(86, 130, 3, 0.12);
    ```
*   **Cajón del Carrito y Menú Lateral (`.glass-drawer`)**:
    ```css
    background: rgba(253, 251, 245, 0.9);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    ```

---

## 📋 7. MEJORES PRÁCTICAS PARA FUTUROS COMPONENTES

Al agregar nuevos elementos a la interfaz de GLak Tienda, sigue estas pautas para conservar la integridad del sistema:

1.  **Prioriza variables CSS**: Nunca hardcodees un color hexadecimal, espaciado o tamaño tipográfico. Haz referencia directa a las variables CSS (ej. `color: var(--accent-primary)`).
2.  **Usa selectores de CSS Modules**: Escribe estilos en archivos `.module.css` dedicados para cada componente React y usa la vinculación de clases estructurada (ej. `className={styles.title}`).
3.  **Evita el bloat de JS**: Si deseas lograr una transición o animación basada en el scroll, no uses librerías pesadas como Framer Motion o GSAP para simples desvanecimientos. Emplea la sintaxis `.reveal-up` o `.reveal-scale` provista en [globals.css](file:///c:/Users/thiag/Desktop/Files/Projects/Glak%20Tienda/GLak%20Tienda%20Web/glak-tienda/src/app/globals.css).
4.  **Respeta las Safe Areas**: En cualquier vista flotante inferior, añade siempre `env(safe-area-inset-bottom)` al padding o margen inferior para asegurar la compatibilidad total con dispositivos móviles modernos.
