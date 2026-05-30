---
name: Code Construction
description: Guidelines for strict TypeScript compilation, robust Zustand state management, secure cookie-aware Supabase SSR integration, clear JSDoc typing standards, and rigorous refactoring rules at GLak Tienda.
---

# 💻 Code Construction: Structural Typing, State Splitting, & Edge Operations

This skill outlines the strict coding standards, compiler safety configurations, local state management rules, cookie-aware database integrations, and code maintenance workflows for the GLak Tienda codebase.

---

## 🛠️ 1. Strict TypeScript Compiler Enforcement

To ensure high reliability on Cloudflare's edge workers, all TypeScript code must pass compilation without exceptions.

### Disabling Compile Error Bypasses
*   **Build Strictness**: The compiler settings in `next.config.ts` must never bypass type errors. The suppression setting `ignoreBuildErrors: true` must be set to `false`:
    ```typescript
    // next.config.ts must be strictly configured:
    const nextConfig = {
      typescript: {
        ignoreBuildErrors: false,
      },
      // ...
    };
    ```
*   **Edge Safety**: Bypassing type checking hides bugs that can crash Cloudflare edge workers at runtime. Every build must be verified locally before it is pushed to production.

---

## 📦 2. Zustand State Management & Persistence Patterns

All global state configurations (e.g. shopping carts, drawers, active customer filters) must be structured following modular Zustand practices.

### Ephemeral vs. Persistent State Segregation
To keep the local storage footprint small, avoid saving UI flags (like whether a drawer is open or closed). Use the Zustand `persist` middleware with the `partialize` configuration to save only persistent data:

```typescript
import { create } from 'zustand';
import { persist, partialize } from 'zustand/middleware';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedColor: string;
  selectedSize: string;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean; // Ephemeral state, should not be persisted
  addToCart: (item: CartItem) => void;
  toggleCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addToCart: (item) => set((state) => ({ items: [...state.items, item] })),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'glak-cart-v2', // LocalStorage key
      // Filter out ephemeral properties (like 'isOpen') from saving:
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

### Business Logic Integration
Always centralize complex business computations (e.g., total items count, total price calculations, and Argentinian peso thresholds for free shipping benefits) inside Zustand selectors. Avoid writing duplicate calculations across multiple frontend components.

---

## 🔒 3. Secure Supabase SSR & Edge Cookie Operations

We use cookie-aware SSR clients from `@supabase/ssr` to securely bridge client and server operations at the Cloudflare edge.

### Choosing the Correct Client Factory
Ensure that database operations use the proper client factory based on the execution context:
1.  **Client-Side Queries (Browsers)**: Use `createBrowserClient` from `@supabase/ssr` inside standard interactive React files (e.g., `src/lib/supabase/client.ts`).
2.  **Server-Side Operations (Server Components & Actions)**: Use `createServerClient` from `@supabase/ssr` inside asynchronous Next.js layouts, page renders, or server actions (e.g., `src/lib/supabase/server.ts`).
    *   *Rule*: Always inject browser `cookies()` from `next/headers` into the server client. This keeps user login tokens and authorization permissions synchronized securely across Cloudflare edge servers.

### Resolving Hydration Mismatches
*   When rendering database or localStorage state (like Zustand cart totals) in Server Components, wrapping client-side rendering logic is necessary to prevent HTML hydration mismatches. Use custom client wrappers or React `useEffect` hooks to safely defer cart rendering until client hydration is complete.

---

## ✍️ 4. Clear JSDoc Documentation Standards

All developers must write clear JSDoc comments to document API definitions, server actions, and complex variations.

### Complex Product Variations (JSONB Inventory Matrix)
The database stores stock variations inside a dynamic `jsonb` column on the products table. Any function handling inventory variations must be documented using descriptive typing:

```typescript
/**
 * Represents a specific size variation inside a color variant.
 * @typedef {Object} SizeVariation
 * @property {string} name - The size name (e.g., "S", "M", "L", "38").
 * @property {number} stock - Current inventory count.
 */

/**
 * Defines a detailed color variation group in the product JSONB inventory.
 * @typedef {Object} ColorVariation
 * @property {string} colorId - Reference key to the global colors database table.
 * @property {string} name - Color descriptor (e.g., "Verde Palta").
 * @property {string} hex - Organic color hex code.
 * @property {SizeVariation[]} sizes - Array detailing the inventory mapping per size.
 */

/**
 * Server Action to update the complex database inventory matrix.
 * @param {string} productId - Unique database UUID of the target product.
 * @param {ColorVariation[]} variations - Completed array of colors and size variations.
 * @returns {Promise<{ success: boolean; error?: string }>} Response status of the write transaction.
 */
export async function updateProductVariations(productId: string, variations: ColorVariation[]) {
  // Safe Server Action logic
}
```

---

## 🔄 5. Refactoring Standards & Maintenance Guidelines

When updating existing codebase modules, developers must adhere to these refactoring rules:

### A. Next.js Routing
*   **Rule**: Find and replace all standard `<a>` HTML anchors with proper Next.js `<Link>` elements.
*   **Impact**: Preserves client-side Single Page Application states, prevents unnecessary full-page refreshes, and avoids redundant database queries.

### B. Dynamic Metadata Filters
*   **Rule**: Do not hardcode lists (such as product categories in sidebars or dropdowns).
*   **Solution**: Query categories dynamically from the Supabase database using server components, and pass the data down to the filters component (e.g. `TiendaFilters.tsx`). This ensures that dynamic changes in the administrative panel reflect instantly on public filters pages.

### C. Database Migration Integrity
*   **Rule**: Always keep the SQL schemas fully documented.
*   **Solution**: Ensure that setup scripts (`supabase_products_schema.sql`) contain not only the main products table, but also definitions for all related tables (like `collections`, `colors`, and `product_collections` junction schemas), along with their respective indexes and secure RLS policies.
