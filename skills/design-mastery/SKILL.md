---
name: Design Mastery
description: Standards for HSL styling tokens, liquid glass components, fluid editorial typography, mobile-first BottomNav headers, gesture-controlled galleries, and scroll-driven CSS animations at GLak Tienda.
---

# 🎨 Design Mastery: High-Fashion Aesthetics & Liquid Interactions

This skill defines the visual identity, token architecture, mobile ergonomics, and transition patterns that make GLak Tienda look premium, bespoke, and state-of-the-art. Every screen, module, or component must align strictly with these visual principles.

---

## 🌿 1. Brand Identity & HSL-Centric Design Tokens

GLak Tienda's aesthetic is built around organic textures, editorial space, and a curated **Avocado Green & Lemon Chiffon** brand identity. All components must leverage the pre-defined CSS variables configured in `src/app/globals.css`:

### Color Palette Strategy
```css
:root {
  /* Editorial Base Backgrounds */
  --bg-primary: #FDFBF5;       /* Warm Cream / Ivory base */
  --bg-secondary: #FFF8B9;     /* Soft Lemon Chiffon accents */
  --bg-surface: #FFFFFF;       /* Pure white card backgrounds */

  /* Curated Organic Brand Accents */
  --accent-primary: #568203;   /* Rich Avocado Green */
  --accent-hover: #456A02;     /* Darker Avocado for interactive hover states */
  --accent-pressed: #375501;   /* Deeper Avocado for active press actions */
  --accent-light: rgba(86, 130, 3, 0.08); /* Sophisticated pastel green overlays */

  /* Micro-Grid Borders */
  --border-subtle: rgba(86, 130, 3, 0.12); /* Extremely subtle border tint */

  /* Radius Foundations - Soft & Organic */
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
}
```

### Depth & Organic Shadows
Avoid generic, muddy black shadows. All elevations must be soft and tinted with the Avocado brand tone to feel organic and premium:
*   `--shadow-sm`: `0 2px 8px rgba(86, 130, 3, 0.03)`
*   `--shadow-md`: `0 8px 24px rgba(86, 130, 3, 0.05)`
*   `--shadow-lg`: `0 16px 48px rgba(86, 130, 3, 0.08)`

---

## ✍️ 2. Fluid Editorial Typography System

GLak Tienda uses fluid typography scaling via CSS `clamp` formulas to maintain proportional legibility without brittle break points.

### Typography Sizing Tokens
*   `--text-xs`: `clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem)` (Small tags/captions)
*   `--text-base`: `clamp(0.875rem, 0.825rem + 0.25vw, 1rem)` (Highly readable body text)
*   `--text-5xl`: `clamp(2.25rem, 1.75rem + 2.5vw, 3rem)` (Hero editorial titles)

### Font Families
Ensure correct typography application based on semantic roles:
1.  **Outfit** (`var(--font-outfit)`): Modern geometric typography. Enforces structural readability on layout details, buttons, metadata labels, and primary navigation UI.
2.  **Inter** (`var(--font-inter)`): Premium body typeface. Deliver maximum legibility across product descriptions, tables, and long-form checkout modules.
3.  **Playfair Display** (`var(--font-playfair)`): Editorial italicized serif accents (`.font-editorial`). Reserved for high-fashion headings, seasonal collection claims, and banners.

---

## 📱 3. Mobile Ergonomics: BottomNav & Gesture Controls

GLak Tienda follows a strict mobile-first design, placing essential controls within direct reach of the user's thumb.

### BottomNav Layout Standards
*   **Public Storefront (`BottomNav`)**: Sticky, translucent bottom drawer for easy access to `Inicio`, `Tienda`, `Favoritos`, `Mi Cuenta`, and the sliding `CartDrawer` button.
*   **Administrative Interface (`AdminBottomNav`)**: Customized sticky bar providing single-tap access to primary CRUD features (inventory lists, mass-upload creation, settings) for admins managing the store on the go.
*   **Liquid Glass Backgrounds**: Implement performant, hardware-accelerated translucent filters to make fixed bars look premium without causing main-thread lag:
    ```css
    backdrop-filter: blur(16px);
    background: rgba(253, 251, 245, 0.8);
    border-top: 1px solid var(--border-subtle);
    ```

### Touch Gestures for Product Galleries (e.g., `ProductOptions.tsx`)
Incorporate smooth native touch listeners for gallery navigation on mobile touch screens:
*   Listen for `onTouchStart` and `onTouchEnd` events.
*   Calculate delta-x swipe directions to smoothly navigate slide highlights.
*   Fallback gracefully on desktops to standard cursor interactions and clear swipe arrows.

---

## 🖼️ 4. Responsive & Optimized Cloudinary Images

Large, unoptimized media files are the main cause of poor web performance. Deliver maximum image optimization using a lightweight custom Cloudinary utility:

### Lightweight URL Generation (without bulky SDK footprints)
Use lightweight utils (`src/lib/cloudinary/utils.ts`) to programmatically inject auto-formatting (`f_auto`) and quality optimization (`q_auto`) arguments:
```typescript
// Example optimized URL builder output:
// https://res.cloudinary.com/dpm4judv4/image/upload/f_auto,q_auto,w_800/v1/GlakTienda/product_name
```

### Modern Rendering Rules
1.  **Avif & WebP Formatting**: Next.js configurations (`next.config.ts`) must specify image output formats to output AVIF and WebP based on browser support.
2.  **Responsive SrcSet**: Always configure custom responsive structures that serve smaller file sizes for mobile displays and load high-resolution files only for desktop grids.
3.  **Blur-up Lazy Loading**: Render low-resolution Base64 placeholder strings (`cloudinaryBlurPlaceholder`) on initial load to keep Core Web Vitals (CLS/LCP) outstanding.

---

## 🎬 5. Zero-JS Scroll-Driven CSS Animations

To keep pages highly performant and free of heavy runtime animation libraries, reveal layouts natively using CSS scroll timelines:

### Native Timeline Keyframe Architecture
```css
/* Performant entrance animations triggered by browser scrolling */
.reveal-up {
  animation: fadeSlideUp ease-out both;
  animation-timeline: view();
  animation-range: entry 0% entry 35%;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(32px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Critical Resiliency & Accessibility
*   **Fallback Handling**: Check if the browser supports scroll timelines. Provide standard static layouts for legacy browsers that do not support it:
    ```css
    @supports not (animation-timeline: view()) {
      .reveal-up {
        opacity: 1;
        transform: none;
      }
    }
    ```
*   **Reduced Motion**: Respect system accessibility preferences by completely resetting animation timelines and durations for users with motion sensitivities:
    ```css
    @media (prefers-reduced-motion: reduce) {
      .reveal-up {
        animation: none !important;
        transition: none !important;
        opacity: 1;
        transform: none !important;
      }
    }
    ```

---

## 🪟 6. Semantic UI & Liquid Glass Panels
*   **Accordion Components**: Use native HTML disclosure tags (`<details>` and `<summary>`) to build lightweight accordions for shipping details, size guides, and care instructions. This ensures perfect accessibility and semantic markup without extra JavaScript dependencies (as seen in `ProductOptions.tsx`).
*   **Persistent Glass Drawers**: The sliding `CartDrawer` and mobile menus must utilize smooth side transforms (`transform: translateX(100%)` to `0`), leveraging hardware-accelerated CSS rendering to prevent visual stuttering on mobile processors.
