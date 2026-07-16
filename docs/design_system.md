# EventOS Enterprise Design System

This document serves as the master design system reference guide for the EventOS platform. It defines tokens, patterns, principles, and guidelines to ensure unified, high-end visual design matching the benchmarks of Linear, Stripe, Notion, Vercel, and Figma.

---

## 1. Core Design Principles

### 1.1 Clarity & Intentionality
Every element must serve a purpose. Avoid unnecessary decorations, borders, or animations. Minimize visual noise to elevate the content.

### 1.2 Unified Spacing Hierarchy
Adhere to a strict **8px spacing grid**. All margins, paddings, gap offsets, and card sizes must align with this scale to establish a rhythm.

### 1.3 Tactile Surface Depth
Use subtle gradients, borders, and backdrop blurs (`backdrop-blur`) to create logical layers of depth. Surfaces closer to the user are lighter and cast soft shadows.

### 1.4 Accessibility by Default
Support dark and light mode color parity with contrast ratios meeting **WCAG 2.2 AA** readability standards. Implement visible keyboard focus rings across all active controls.

---

## 2. Global Design Tokens

### 2.1 Color System
All colors are modeled in CSS variables inside [globals.css](file:///d:/EventOs/web/src/app/globals.css) using OKLCH and HEX representations:

| Token | Dark Value (OKLCH) | Light Value (OKLCH) | HEX Reference (Dark) | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.13 0.005 286.07)` | `oklch(1 0 0)` | `#09090B` | Primary page base background |
| `--foreground` | `oklch(0.985 0 0)` | `oklch(0.145 0 0)` | `#FAFAFA` | Primary text content |
| `--card` | `oklch(0.16 0.006 286.37)` | `oklch(1 0 0)` | `#111113` | Card surfaces |
| `--primary` | `oklch(0.58 0.23 293.42)` | `oklch(0.205 0 0)` | `#8B5CF6` | Primary CTAs & active borders |
| `--secondary` | `oklch(0.19 0.006 286.37)` | `oklch(0.97 0 0)` | `#18181B` | Secondary buttons / components |
| `--border` | `oklch(0.27 0.006 286.37)` | `oklch(0.922 0 0)` | `#27272A` | Divides and standard borders |
| `--destructive`| `oklch(0.704 0.191 22.216)`| `oklch(0.577 0.245 27.325)`| `#EF4444` | Errors and risk dialog states |
| `--success` | `oklch(0.72 0.21 144.0)` | `oklch(0.62 0.19 144.0)` | `#22C55E` | Safe state metrics & badges |

---

### 2.2 Typography Scale
Primary Font Family: `Inter` (sans-serif)
Secondary Font Family: `Outfit` (display / headings)

| Title | Font Size (rem/px) | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `H1` | `2.25rem` (36px) | `2.5rem` | Bold (`700`) | Main Hero sections |
| `H2` | `1.5rem` (24px) | `2.0rem` | Extrabold (`800`) | Main page headers |
| `H3` | `1.25rem` (20px) | `1.75rem` | Bold (`700`) | Card titles, section headers |
| `H4` | `1.0rem` (16px) | `1.5rem` | Bold (`700`) | Dialog headers, small labels |
| `Body` | `0.875rem` (14px) | `1.25rem` | Medium (`500`) | General text description |
| `Caption` | `0.75rem` (12px) | `1.0rem` | Medium (`500`) | Supplementary metrics & helper text |
| `Label` | `0.625rem` (10px) | `0.875rem` | Bold (`700`) | Input fields and badge names |

---

### 2.3 Spacing Scale (8px Grid)
Use Tailwind spacing classes directly to align all elements:

- `space-1` / `0.25rem` (4px): Micro adjustments (e.g. icon-to-label gaps)
- `space-2` / `0.5rem` (8px): Gaps in small fields, input-to-label vertical padding
- `space-3` / `0.75rem` (12px): Standard button/input horizontal padding, secondary spacing
- `space-4` / `1.0rem` (16px): Content list spacing, small card padding
- `space-6` / `1.5rem` (24px): Standard card padding, bento-grid gaps, main section headers
- `space-8` / `2.0rem` (32px): Page outer boundary padding, workspace divisions

---

## 3. Component Design Patterns

### 3.1 Button Specifications
All buttons must follow standardized sizes and active feedback patterns:
- **Focus Indicator**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500`
- **Scale micro-animations**: `active:scale-[0.97]` on click
- **Height Scale**:
  - `Default`: `h-8 px-3 text-xs`
  - `Small (sm)`: `h-7 px-2.5 text-[11px]`
  - `Large (lg)`: `h-9 px-4 text-sm`

### 3.2 Card Layouts
Cards should follow consistent styling:
- **Border Radius**: `rounded-2xl`
- **Border style**: `border border-white/[0.08]` (dark mode) / `border-zinc-200` (light mode)
- **Background style**: `bg-zinc-900/40 backdrop-blur-md` (dark mode) / `bg-white/80` (light mode)
- **Inner Padding**: `p-5 md:p-6`

### 3.3 Form Inputs
- **Inputs & Textareas**: `bg-white/[0.03] border border-white/[0.08] text-white rounded-xl placeholder-zinc-500`
- **Focus state**: `focus:ring-2 focus:ring-purple-650/30 focus:border-[#8B5CF6] focus:bg-[#09090b]/30`
- **Paddings**: `px-3 py-2 text-xs`

### 3.4 Motion & Transitions
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (Vercel/Linear curve)
- **Duration**: `200ms` for hover transitions, `250ms` for entry transitions, `150ms` for exit animations.

---

## 4. Reusable Code Snippets

### Standard Premium Button
```tsx
<button
  type="button"
  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
>
  Submit Proposal
</button>
```

### Standard Premium Card
```tsx
<div className="p-5 rounded-2xl border border-white/[0.08] bg-zinc-900/40 backdrop-blur-md hover:border-purple-500/20 transition-all duration-300 shadow-xl shadow-black/20 relative overflow-hidden group">
  <div className="space-y-2">
    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-purple-400 transition-colors">Card Title</h3>
    <p className="text-[11px] text-zinc-450 leading-relaxed">Description content goes here.</p>
  </div>
</div>
```
