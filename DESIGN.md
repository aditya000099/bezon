---
name: Serene Commerce
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#4d4540'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#7e756f'
  outline-variant: '#cfc4bd'
  surface-tint: '#635d5a'
  primary: '#181512'
  on-primary: '#ffffff'
  primary-container: '#2d2926'
  on-primary-container: '#96908b'
  inverse-primary: '#cdc5c0'
  secondary: '#a9372a'
  on-secondary: '#ffffff'
  secondary-container: '#fc7462'
  on-secondary-container: '#6e0a06'
  tertiary: '#001912'
  on-tertiary: '#ffffff'
  tertiary-container: '#003024'
  on-tertiary-container: '#4b9f85'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9e1dc'
  primary-fixed-dim: '#cdc5c0'
  on-primary-fixed: '#1e1b18'
  on-primary-fixed-variant: '#4b4642'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4a9'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#881f16'
  tertiary-fixed: '#9ef3d6'
  tertiary-fixed-dim: '#82d7ba'
  on-tertiary-fixed: '#002118'
  on-tertiary-fixed-variant: '#00513f'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
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

This design system establishes a dialogue between European minimalist functionalism and the soulful precision of Mandarin aesthetic philosophy. The brand personality is **sophisticated, intuitive, and calm**, targeting a discerning global audience that values curated excellence over excessive choice.

The visual direction prioritizes "Ma" (the beauty of empty space), ensuring the UI feels breathable and high-end. We employ a **Modern Corporate** foundation elevated by **Glassmorphism** for AI-driven elements. This creates a "digital atelier" atmosphere—an environment that feels both technologically advanced and humanistically warm. AI features are integrated as "quiet intelligence," using subtle glows and fluid transitions rather than intrusive overlays, suggesting a platform that anticipates needs without noise.

## Colors

The palette is rooted in warm neutrals to evoke a sense of premium paper and organic materials, contrasted by three culturally significant accents.

- **Primary (Charcoal):** Used for core typography and structural lines, providing a grounded, authoritative weight.
- **Secondary (Cinnabar):** A deep, sophisticated red used sparingly for call-to-actions and critical notifications, representing energy and precision.
- **Tertiary (Imperial Jade):** A muted green reserved for "success" states, sustainability markers, and premium membership indicators.
- **Neutrals (Cream & Soft Grey):** The backbone of the interface. We avoid pure white (#FFFFFF) in favor of #F9F7F2 to reduce eye strain and increase the feeling of luxury.
- **AI Signature:** A soft, ethereal blue-tinted glow (#E0F2FE) is used exclusively for machine-learning-driven suggestions and "smart" interface states.

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
