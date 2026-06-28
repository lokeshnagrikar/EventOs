# EventOS Frontend Coding & Animation Standards

This document establishes the guidelines, coding conventions, and architectural boundaries for the frontend codebase of EventOS. All new pages, components, and interactive user flows must adhere to these rules.

---

## 1. Design System Tokens & Styling

- **Core Framework**: Tailwind CSS using custom CSS Variables defined in `globals.css` (e.g. `var(--primary)`, `var(--background)`).
- **Styling Method**: Enforce Vanilla CSS values/classes mapped through Tailwind utilities. Do not use random ad-hoc colors; use standard semantic color groups:
  - `primary` for action triggers, selections, and primary branding.
  - `secondary` for secondary buttons, card headers, and borders.
  - `muted` for secondary labels, inactive tabs, and placeholders.
  - `destructive` for delete actions, error messages, and warnings.
  - `border` for visual separators.
- **Dark Mode**: Support `.dark` class toggles. Use background utilities (`bg-background`, `bg-card`, `bg-popover`) to handle auto-theming dynamically.

---

## 2. Centralized Icon Registry

To prevent visual drift and optimize build sizes, EventOS utilizes **Iconify** exclusively.

### Iconify Rules:
1. **Never** import icons from `lucide-react`, `react-icons`, `heroicons`, or `font-awesome`.
2. All icons must be registered in [icons.ts](file:///d:/EventOs/web/src/lib/icons.ts).
3. Use the typed `<Icon name="key" />` component from [icon.tsx](file:///d:/EventOs/web/src/components/ui/icon.tsx) in all React elements.

### How to add and use an icon:
1. Open [icons.ts](file:///d:/EventOs/web/src/lib/icons.ts).
2. Append the new icon mapping under `ICONS`:
   ```typescript
   export const ICONS = {
     // ...
     calendar: "lucide:calendar",
     myNewIcon: "lucide:bell", // maps key 'myNewIcon' to Lucide's 'bell' icon
   } as const;
   ```
3. Import and use the UI component:
   ```tsx
   import { Icon } from "@/components/ui/icon";

   export const BellButton = () => (
     <button aria-label="Notifications">
       <Icon name="myNewIcon" size={20} className="text-primary" />
     </button>
   );
   ```

---

## 3. Animation Guidelines & Duration Capping

Animations must feel snappy, premium, and professional. Over-animating degrades the productivity feel of the dashboard command center.

### Performance Capping:
- **Authenticated Dashboard Pages**:
  - Keep transition durations strictly between **150ms and 300ms**.
  - Use **Framer Motion** exclusively.
  - Capped spring properties: `stiffness: 280`, `damping: 26`.
- **Public Landing & Marketing Pages**:
  - Durations can extend up to **600ms** to create dynamic storytelling flows.
  - GSAP is permitted for high-performance scroll triggers, homepage hero effects, and SVG timelines.

### Framework Selection Matrix:

| Feature / Page Area | Allowed Library | Restriction / Standard |
| :--- | :--- | :--- |
| Dashboard Pages (`/portal`, `/invoices`, etc.) | Framer Motion | Capped durations (150ms-300ms) |
| Landing / Marketing Home Page (`/`) | GSAP & Magic UI | Lazy-loaded libraries |
| Core Modals / Drawers / Bottom Sheets | Framer Motion | Use `<ModalTransition>` / `<DrawerTransition>` |
| Page-level routing transitions | Framer Motion | Wrap in `<PageTransition>` |

*Warning: GSAP is completely banned inside authenticated dashboard directories (`/portal`, `/invoices`, `/gallery`, `/crm`, etc.) to preserve CPU/memory overhead.*

---

## 4. Accessibility & Motion Sensitivity (WCAG 2.2 AA)

We enforce strict motion safety to prevent users with vestibular disorders from experiencing motion sickness.

### Motion Safety Checks:
- **prefers-reduced-motion**:
  - All reusable animation wrappers (`FadeIn`, `SlideUp`, `ScaleIn`, `PageTransition`, `DrawerTransition`, `ModalTransition`) must consume the `useReducedMotion()` hook.
  - If motion reduction is enabled by the operating system, translation distances (e.g. `y: 20`, `x: 100%`) and scaling parameters (e.g. `scale: 0.95`) must be disabled (`0` or `1` respectively) and replaced with simple, low-contrast opacity transitions.

### Keyboard & Screen Reader Access:
- **Interactive Triggers**: Buttons opening modals/drawers must support `Space` and `Enter` key presses.
- **Focus Trapping**: When a modal or drawer is active, keyboard focus must be trapped within the overlay. Use `tabIndex={-1}` and helper wrapper controls.
- **Esc Dismissal**: Pressing the `Escape` key must trigger `onClose` immediately to close active overlays.
- **ARIA Labeling**: Specify `role="dialog"`, `aria-modal="true"`, and describe visual items with `aria-label` or `aria-labelledby`.

---

## 5. Lazy-Loading & Performance Optimization

To guarantee a Lighthouse performance score of **90+**, do not load heavy asset loaders on initial load.

### Lazy Loading Practices:
1. Dynamic page components (such as heavy charts, file upload libraries, or Magic UI landing effects) must be lazy-loaded using Next.js `dynamic`:
   ```tsx
   import dynamic from 'next/dynamic';

   const MagicLandingComponent = dynamic(
     () => import('@/components/marketing/HeavyHero'),
     { ssr: false, loading: () => <p>Loading section...</p> }
   );
   ```
2. Iconify icons are fetch-on-demand via the `<Icon />` wrapper. Avoid compiling massive icon libraries into the main JS bundle.
