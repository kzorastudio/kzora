# Design System Specification: The Curated Tactile Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Tactile Gallery."** Unlike standard e-commerce platforms that rely on rigid grids and heavy borders, this system treats the digital screen as a physical composition of premium materials—matte paper, fine linen, and honed stone.

The goal is to move beyond the "template" look by utilizing intentional asymmetry, expansive negative space, and a sophisticated RTL (Right-to-Left) flow that feels native and effortless. We prioritize a high-contrast typography scale and tonal layering to guide the user’s eye, creating an experience that feels more like a luxury fashion editorial than a standard storefront.

---

## 2. Colors & Surface Philosophy
We avoid the sterile nature of pure white (#FFFFFF) and pure black (#000000). Every color in this system is warm-toned to evoke a sense of organic luxury and comfort.

### Color Palette Reference
*   **Primary Surface:** `#FAF8F5` (Warm Off-White) – The base "paper" layer.
*   **Secondary Surface:** `#F2EDE8` (Soft Cream) – For secondary sections.
*   **Accent (CTA):** `#B8860B` (Rich Bronze-Gold) – Reserved for high-intent actions.
*   **Primary Text:** `#1A1A1A` (Deep Charcoal) – Softer than black, ensuring premium legibility.
*   **Secondary Text:** `#6B6560` (Warm Gray) – For metadata and supportive descriptions.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be established through:
1.  **Tonal Shifts:** Placing a `surface-container-low` component on a `surface` background.
2.  **Generous Whitespace:** Using the spacing scale (e.g., `spacing-16` or `spacing-20`) to separate distinct content blocks.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked physical materials. 
*   **Layer 0 (Base):** `surface` (#FAF8F5).
*   **Layer 1 (Cards/Sections):** `surface-container-low` (#F5F3F0).
*   **Layer 2 (Interactive/Focus):** `surface-container-highest` (#E4E2DF).

### The "Glass & Gradient" Rule
For floating navigation bars or premium product overlays, use **Glassmorphism**. Apply a semi-transparent version of the `surface` color with a `backdrop-blur` of 12px-20px. When using the Bronze-Gold CTA, apply a subtle linear gradient from `primary` (#785600) to `primary-container` (#986D00) at a 135-degree angle to provide a "metallic sheen" that flat colors lack.

---

## 3. Typography
The typographic voice is a dialogue between the poetic flow of Arabic calligraphy and the clinical precision of Swiss-style numerals.

*   **Logo & Branding:** **Tajawal 700**. This font provides the structural authority required for a luxury brand.
*   **Editorial Headlines (Arabic):** **Noto Sans Arabic**. Use `display-lg` (3.5rem) for hero statements with a "tight" line-height (1.1) to create a high-fashion, compressed aesthetic.
*   **Utility & Pricing:** **Inter**. All numbers, prices, and technical specs must use Inter. This creates a functional contrast against the more organic Arabic script.
*   **Hierarchy Note:** Use `headline-sm` for product titles and `label-md` (uppercase for English/Inter elements) for micro-copy like "EXCLUSIVE" or "LIMITED EDITION."

---

## 4. Elevation & Depth
Depth in this design system is achieved through **Tonal Layering** rather than traditional drop shadows.

### The Layering Principle
Avoid "floating" everything. A card should feel like it is resting on a surface. Achieve this by using one step higher in the `surface-container` scale.
*   *Example:* A product card in `surface-container-lowest` (#ffffff) sitting on a `surface-container-low` (#f5f3f0) background.

### Ambient Shadows
When a physical "lift" is required (e.g., a modal or a floating action button):
*   **Color:** Use a tinted shadow: `rgba(27, 28, 26, 0.08)`.
*   **Blur:** High diffusion (20px to 40px) with low Y-offset (4px to 8px) to mimic natural, soft gallery lighting.

### The "Ghost Border" Fallback
If a border is strictly required for accessibility (e.g., input focus states), use the **Ghost Border**: `outline-variant` (#D3C4AF) at **20% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons
*   **Primary:** Background: Bronze Gradient; Text: `on-primary` (#ffffff); Radius: `6px`.
*   **Secondary:** Background: `surface-container-high`; Text: `primary`; Radius: `6px`.
*   **Interaction:** On hover, the primary button should slightly increase in saturation, never darken.

### Cards & Lists
*   **Constraint:** No divider lines between list items. Use `spacing-4` (1.4rem) of vertical space or a alternating `surface-container-lowest` background to distinguish items.
*   **Radius:** Standardized at `8px` to maintain a "soft-stone" look.

### Input Fields
*   **Styling:** Minimalist. No bounding box. Use a `surface-container-low` background with a `2px` bottom-only stroke in `outline-variant` (#D3C4AF).
*   **Focus State:** The bottom stroke transitions to `primary` (Bronze-Gold).

### Product Grids
*   **Editorial Layout:** Avoid the standard 2x2 grid. Use an asymmetrical layout where the first featured item spans 2 columns, while subsequent items follow a 1-column rhythm. This breaks the "template" feel.

---

## 6. Do's and Don'ts

### Do
*   **Do** flip all icons for RTL: Arrows and directional cues must point left for "forward" progress.
*   **Do** use `inter` for all prices: "١٢٠٠ ر.س" is harder to scan than "1,200 SAR" in a premium retail context.
*   **Do** embrace negative space: If a section feels crowded, double the padding using the `spacing-12` or `spacing-16` tokens.

### Don't
*   **Don't** use pure black for text: It creates too much "vibration" against the warm cream background. Stick to `primary-text` (#1A1A1A).
*   **Don't** use standard "box-shadow" presets: They look "web-kit" and cheap. Always use the warm-tinted ambient shadow spec.
*   **Don't** use 1px dividers: Use a change in background color or a wider gap to separate content blocks.

---

## 7. Iconography
*   **Style:** 1.5px stroke, Outlined.
*   **Library:** Lucide or Phosphor (Thin/Light weight).
*   **Intent:** Icons are supportive, not decorative. They should be sized consistently at 20px or 24px and rendered in `secondary-text` (#6B6560).
