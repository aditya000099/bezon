---
name: Serene Commerce
colors:
  surface: '#ffffff'
  surface-dim: '#f5f5f5'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fafafa'
  surface-container: '#f5f5f5'
  surface-container-high: '#e5e5e5'
  surface-container-highest: '#d4d4d4'
  on-surface: '#000000'
  on-surface-variant: '#525252'
  inverse-surface: '#171717'
  inverse-on-surface: '#f5f5f5'
  outline: '#737373'
  outline-variant: '#e5e5e5'
  surface-tint: '#404040'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#262626'
  on-primary-container: '#a3a3a3'
  inverse-primary: '#d4d4d4'
  secondary: '#171717'
  on-secondary: '#ffffff'
  secondary-container: '#404040'
  on-secondary-container: '#d4d4d4'
  tertiary: '#262626'
  on-tertiary: '#ffffff'
  tertiary-container: '#525252'
  on-tertiary-container: '#e5e5e5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e5e5'
  primary-fixed-dim: '#d4d4d4'
  on-primary-fixed: '#000000'
  on-primary-fixed-variant: '#262626'
  secondary-fixed: '#f5f5f5'
  secondary-fixed-dim: '#e5e5e5'
  on-secondary-fixed: '#000000'
  on-secondary-fixed-variant: '#404040'
  tertiary-fixed: '#fafafa'
  tertiary-fixed-dim: '#f5f5f5'
  on-tertiary-fixed: '#000000'
  on-tertiary-fixed-variant: '#525252'
  background: '#ffffff'
  on-background: '#000000'
  surface-variant: '#e5e5e5'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  ai-card-gap: 32px
---
## Brand & Style

This design system embraces modern minimalism with a strict monochrome palette. The brand personality is **sophisticated, intuitive, and stark**, targeting a discerning global audience that values clarity and high contrast.

The visual direction prioritizes "Ma" (the beauty of empty space), ensuring the UI feels breathable and high-end. We employ a **Monochrome Corporate** foundation elevated by **Glassmorphism** for AI-driven elements. This creates a digital environment that feels technologically advanced but extremely clean.

## Colors

The palette is strictly black, white, and shades of gray, prioritizing high contrast and readability.

- **Primary (Black):** Used for core typography, buttons, and structural lines, providing a grounded, authoritative weight.
- **Secondary (Dark Grays):** Used for secondary text, borders, and subtle backgrounds.
- **Neutrals (White & Light Grays):** The backbone of the interface. White (#FFFFFF) provides maximum contrast against black elements.
- **AI Signature:** A soft, ethereal blur/glassmorphism layer is used exclusively for machine-learning-driven suggestions and "smart" interface states. No distinct colors, just elevated depth.

## Typography

The typography system relies on a dual-sans-serif approach to maximize clarity and modernity. **Manrope** provides a geometric yet warm structure for headlines, while **Hanken Grotesk** offers a sharp, professional character for body text and functional data.

Hierarchy is achieved through intentional weight shifts and ample line height. All caps labels with tracking (+8%) are used for category tags and technical metadata to differentiate from editorial content. On mobile, we reduce scale by approximately 15% for primary headers to maintain the "breathable" layout without excessive scrolling.

## Layout & Spacing

This design system utilizes a **Fixed Grid** model for desktop to ensure a curated, gallery-like experience, transitioning to a fluid model for mobile devices.

- **Desktop:** 12-column grid with a wide 64px outer margin. Gutters are kept at 24px to allow individual product cards to stand out as distinct objects.
- **Tablet:** 8-column grid with 40px margins.
- **Mobile:** 4-column grid with 20px margins.

We employ a "Density of Intent." Content-heavy areas like checkout or filters use tighter 8px increments, while "Inspiration" and "Discovery" sections (AI-powered) increase padding to 32px or 48px to encourage a slower, more luxurious browsing pace.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** and **Subtle Glassmorphism**.

1. **Base (Level 0):** Background in `Neutral Cream`.
2. **Surface (Level 1):** Flat cards with a 1px border in a slightly darker neutral (#EAE4DC). No shadows.
3. **Raised (Level 2):** Soft, high-diffusion shadows (Blur: 20px, Opacity: 4%) used only for hover states or active selection.
4. **AI Intelligence (Level 3):** Semi-transparent surfaces using `Backdrop Blur` (12px) and a subtle inner glow. This layer "floats" above the content, reserved for smart search, AI assistants, and contextual recommendations.

This approach mimics a physical desk where items are placed cleanly, and "smart" tools appear as translucent overlays.

## Shapes

The shape language is **Rounded (0.5rem / 8px)**. This choice strikes a balance between the precision of European minimalism and the approachability of modern app design.

- **Standard Elements:** 8px radius (Buttons, Input fields, Small cards).
- **Large Containers:** 16px radius (Product showcases, Hero sections).
- **Interactive Pills:** Full radius (Category chips, Filter tags).

Avoid sharp corners to maintain the "soft" brand personality, but also avoid excessive roundness (Pill-shaped) for structural components to keep the layout feeling architectural and organized.

## Components

### Buttons

- **Primary:** Solid Cinnabar Red or Charcoal with white text. Minimal padding (12px 24px).
- **Ghost:** 1px border with the color of the text. No background.
- **AI Action:** A button with a subtle gradient and a small "spark" icon in the trailing position.

### Cards

Product cards should have a fixed aspect ratio (preferably 4:5 for fashion/home). Images are centered on a light neutral background within the card. Titles are bolded, while prices use a medium weight.

### Input Fields

Underlined or subtly boxed with no heavy borders. The "active" state uses a Jade Green indicator for success or a 2px Charcoal underline for focus.

### AI Integration Elements

- **Smart Suggestion Chips:** Translucent background with a micro-thin border.
- **Predictive Data Vis:** Minimalist line charts using Jade Green or Cinnabar, avoiding heavy axes or gridlines.
- **The "Pulse":** When AI is "thinking" or processing a recommendation, use a slow-pulsing background glow in `ai_glow` instead of a traditional spinner.

### Lists & Navigation

Navigation uses the `label-caps` typography style. Hover states are indicated by a simple dot or a refined horizontal line below the text, rather than a background change.
