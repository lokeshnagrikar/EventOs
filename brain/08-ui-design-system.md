# EventOS — UI & Design System

## Design Language

**FACT:**
- **Framework:** Tailwind CSS 3.4 with CSS custom properties (shadcn/ui pattern)
- **Component library:** shadcn/ui (Radix UI primitives) + extensive custom components
- **Dark mode:** Supported via `darkMode: ["class"]` in Tailwind config
- **Theme:** CSS custom properties mapped to Tailwind tokens (background, foreground, primary, secondary, muted, accent, destructive, card, popover, border, input, ring)

## Design Tokens

**FACT (from `tailwind.config.ts` and `globals.css`):**

### Colors (CSS Variable-based)
| Token | Variable | Purpose |
|---|---|---|
| background | `--background` | Page background |
| foreground | `--foreground` | Default text |
| primary | `--primary` | Brand primary (purple: `#9333ea` default) |
| secondary | `--secondary` | Secondary actions |
| accent | `--accent` | Accent highlights (pink: `#db2777` default) |
| muted | `--muted` | Subdued elements |
| destructive | `--destructive` | Error/danger states |
| card | `--card` | Card backgrounds |
| popover | `--popover` | Popover backgrounds |
| border | `--border` | Border color |
| input | `--input` | Input border |
| ring | `--ring` | Focus ring |

### Company Branding Defaults
**FACT (from Company entity `@PrePersist`):**
- Primary color: `#9333ea` (purple)
- Secondary color: `#18181b` (near-black)
- Accent color: `#db2777` (pink)
- Gradient preset: `purple-pink`
- Font: `Inter`

### Typography
| Token | Variable | Fallback |
|---|---|---|
| font-sans | `--font-sans` | sans-serif |
| font-heading | `--font-heading` | sans-serif |
| font-mono | `--font-mono` | monospace |

### Border Radius
| Token | Value |
|---|---|
| `--radius` | Base radius variable |
| lg | `var(--radius)` |
| md | `calc(var(--radius) - 2px)` |
| sm | `calc(var(--radius) - 4px)` |

### Custom Easing
| Name | Value | Purpose |
|---|---|---|
| spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy interactions |
| smooth | `cubic-bezier(0.16, 1, 0.3, 1)` | Smooth transitions |

Source: `web/tailwind.config.ts`

## Animation System

**FACT:**

### Framer Motion (primary animation library)
- Page transitions: `AnimatePresence` with `popLayout` mode in providers
- Default page transition: `opacity: 0→1, y: 8→0` (0.15s, smooth easing)
- Used extensively in landing page components and dashboard

### GSAP (secondary)
- Used for complex scroll-driven animations
- Landing page sections (Hero, Features, Product Showcase)

### Lenis (smooth scroll)
- Enabled on public marketing pages only
- Disabled on dashboard/portal/settings (nested scroll containers)
- Configuration: duration 0.9, wheelMultiplier 1.15, touchMultiplier 1.8

### Custom Tailwind Animations
| Animation | Purpose |
|---|---|
| marquee | Horizontal infinite scroll |
| marquee-vertical | Vertical infinite scroll |
| orbit | Circular orbital motion |
| border-beam | Moving border effect |
| shine | Rotating shine effect |

### Lottie Animations
- `@lottiefiles/dotlottie-react` for micro-animations

Source: `web/src/app/providers.tsx`, `web/tailwind.config.ts`

## UI Component Library

**FACT (from `web/src/components/ui/`):**

### Primitives (shadcn/ui based)
| Component | File | Description |
|---|---|---|
| Button | `button.tsx` | CVA-based button variants |
| Card | `card.tsx` | Card with header, content, footer |
| Badge | `badge.tsx` | Status badges |
| Avatar | `avatar.tsx` | User avatars (Radix) |
| Tabs | `tabs.tsx` | Tab navigation |
| Accordion | `accordion.tsx` | Collapsible sections |
| Separator | `separator.tsx` | Visual dividers |
| Icon | `icon.tsx` | Icon wrapper |

### Custom UI Components
| Component | File | Description |
|---|---|---|
| PageShell | `PageShell.tsx` (8KB) | Standard page layout wrapper |
| EmptyState | `EmptyState.tsx` (11KB) | Empty state with illustrations |
| ErrorState | `ErrorState.tsx` | Error display |
| ConfirmDialog | `ConfirmDialog.tsx` (7KB) | Confirmation modals |
| ProcessingLoader | `ProcessingLoader.tsx` | Loading spinner |
| LimitExceededModal | `LimitExceededModal.tsx` | Plan limit modal |
| OfflineBanner | `OfflineBanner.tsx` | Offline notification |
| EventOsLogo | `EventOsLogo.tsx` (7KB) | Animated logo |
| Skeletons | `skeletons.tsx` (19KB) | Loading skeletons |

### Visual Effects Components
| Component | File | Description |
|---|---|---|
| AnimatedMeshGradient | `AnimatedMeshGradient.tsx` | Mesh gradient background |
| AuroraBackground | `aurora-background.tsx` | Aurora light effect |
| AuroraText | `aurora-text.tsx` | Text with aurora effect |
| AmbientCursorGlow | `AmbientCursorGlow.tsx` | Cursor glow effect |
| CustomCursor | `custom-cursor.tsx` | Custom cursor |
| AnimatedBeam | `animated-beam.tsx` | Animated beam connectors |
| AnimatedGridPattern | `animated-grid-pattern.tsx` | Animated grid |
| BorderBeam | `border-beam.tsx` | Moving border |
| ShineBorder | `shine-border.tsx` | Shining border |
| BlurFade | `blur-fade.tsx` | Blur + fade transition |
| NumberTicker | `number-ticker.tsx` | Animated counter |
| WordRotate | `word-rotate.tsx` | Rotating text |
| Marquee | `marquee.tsx` | Infinite scroll marquee |
| OrbitingCircles | `orbiting-circles.tsx` | Orbital animation |
| SpotlightCard | `spotlight-card.tsx` | Spotlight hover effect |
| Sparkles | `sparkles.tsx` (12KB) | Particle effects |
| WebGLShader | `web-gl-shader.tsx` | WebGL shader effects |
| GlassTestimonialSwiper | `glass-testimonial-swiper.tsx` | Glassmorphism swiper |
| LiquidGlassButton | `liquid-glass-button.tsx` (15KB) | Liquid glass effect button |
| BentoGrid | `bento-grid.tsx` | Bento grid layout |

### Global Components
| Component | File | Description |
|---|---|---|
| AiAssistant | `AiAssistant.tsx` (44KB) | Floating AI chat panel |
| SmartSearch | `SmartSearch.tsx` (14KB) | Cmd+K global search |
| CommandPalette | `CommandPalette.tsx` (6KB) | Command palette |
| ToastContainer | `ToastContainer.tsx` | Toast notifications |
| PWAProvider | `PWAProvider.tsx` | PWA service worker |

## Landing Page Components

**FACT (from `web/src/components/landing/`):**
26 dedicated components including Hero, Features, Pricing, Testimonials, FAQ, Workflow, Product Showcase (44KB), Quote Simulator (29KB), Run-of-Show Simulator (24KB), ROI Calculator (21KB), Client Portal Preview (35KB), Founder Section, Competitor Comparison, Multi-Tenant showcase, Contact form, Footer, Floating Dock navigation.

## Responsive Design

**FACT:**
- Tailwind responsive breakpoints (default: sm, md, lg, xl, 2xl)
- Mobile-first approach
- Touch multiplier configured in Lenis (1.8)
- PWA support via `PWAProvider`

## Key Keyboard Shortcuts

**FACT (from `providers.tsx`):**
- `Ctrl/Cmd + K` — Toggle global search
- `Alt + D` — Navigate to Dashboard
- `Alt + E` — Navigate to Events
- `Alt + S` — Navigate to Settings
- `Alt + A` — Navigate to Automation

Source: `web/src/components/ui/`, `web/src/components/landing/`, `web/src/app/providers.tsx`
