---
name: Civic Horizon
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#525f75'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0e1c2f'
  on-primary-container: '#77849c'
  inverse-primary: '#bac7e1'
  secondary: '#426086'
  on-secondary: '#ffffff'
  secondary-container: '#b3d1fd'
  on-secondary-container: '#3b5a7f'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002019'
  on-tertiary-container: '#1a947d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3fe'
  primary-fixed-dim: '#bac7e1'
  on-primary-fixed: '#0e1c2f'
  on-primary-fixed-variant: '#3a475c'
  secondary-fixed: '#d3e4ff'
  secondary-fixed-dim: '#aac9f4'
  on-secondary-fixed: '#001c38'
  on-secondary-fixed-variant: '#29486d'
  tertiary-fixed: '#8cf6da'
  tertiary-fixed-dim: '#6fd9be'
  on-tertiary-fixed: '#002019'
  on-tertiary-fixed-variant: '#005142'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an institutional yet deeply human civic interface. Designed for public governance, municipal participation, and transparent civic intelligence, the visual narrative balances uncompromising democratic authority with modern digital agility.

The personality balances three key pillars:
- **Constitutional Trust:** Grounded, unshakeable, legible, and compliant with universal public access expectations.
- **Civic Vitality:** Dynamic, community-forward, and participatory—avoiding the bureaucratic stagnation of legacy governmental portals.
- **Clarity & Transparency:** Frictionless data density with high legibility, structured hierarchies, and zero ambiguity.

The aesthetic direction synthesizes **Corporate Modernism** with **Refined Structural Minimalism**. It rejects decorative noise in favor of crisp hairline rules, intentional tonal tiers, balanced informational layouts, and tactical micro-accents of civic emerald and teal that signal active democratic progress.

## Colors

The palette is engineered around high legibility, institutional gravitas, and accessible contrast compliance (meeting WCAG 2.1 AAA for text and AA for structural UI tokens).

### Palette Architecture
- **Primary (`#0B192C` — Civic Navy):** Anchor for core navigational chrome, key interactive triggers, and high-impact structural headers. Projects permanence, security, and institutional integrity.
- **Secondary (`#1E3E62` — Trust Deep Blue):** Modulates supporting hierarchies, active navigation states, interactive highlights, and secondary actions.
- **Tertiary (`#008B74` — Civic Teal / Emerald):** The action engine of the design system. Used strictly for success verification, affirmative civic participation, resolved governance statuses, and live metrics.
- **Neutral (`#64748B` — Slate Matrix):** Built on cool, balanced blue-grays.
  - Background Canvas: `#F8FAFC`
  - Elevated Surface: `#FFFFFF`
  - Hairline Rule / Border: `#E2E8F0`
  - Muted Label / Metadata: `#64748B`
  - High-Contrast Copy: `#0F172A`

### Contrast & State Rules
Interactive elements must always preserve a minimum 4.5:1 contrast against surface backgrounds. The civic teal accent is paired with white (`#FFFFFF`) or civic navy text (`#0B192C`) depending on surface polarity. State changes rely on controlled tinting rather than arbitrary color shifts.

## Typography

Typography pairs **Plus Jakarta Sans** for expressive, modern headings with **Inter** for clean, highly legible body text and data presentation.

### Usage Hierarchy
- **Plus Jakarta Sans (Headlines & Metrics):** Provides geometric precision with rounded terminals, projecting an approachable, forward-looking civic voice without losing structural discipline.
- **Inter (Body, Tables, Controls, Data Displays):** Delivers clean optical kerning, tall x-height, and neutral clarity across dense tables, legal policy prose, and citizen input interfaces.
- **Form Controls & Micro-Metrics:** All interactive controls employ medium or semibold weights in Inter to ensure crisp rendering across sub-pixel rasterizers and varying display hardware.

## Layout & Spacing

The layout is built upon an adaptive 12-column fluid grid governed by an 8pt architectural rhythm, with a supplementary 4pt baseline for atomic component padding.

### Grid & Breakpoints
- **Desktop (1280px+):** 12 columns, `margin: 2.5rem`, `gutter: 1.5rem`. Max page content container constrained to `1340px` for optimal data dashboard scanning.
- **Tablet (768px – 1279px):** 8 columns, `margin: 1.5rem`, `gutter: 1.25rem`. Complex metrics collapse to 2-column or 4-column structures.
- **Mobile (320px – 767px):** 4 columns, `margin: 1rem`, `gutter: 1rem`. Stacks into linear informational flows; data tables default to stacked cards or horizontal swipe viewports.

### Spacing Philosophy
- Use `space-xs` and `space-sm` for inline icon-to-label pairing and compact form groups.
- Use `space-md` for standard card interiors, list items, and form inputs.
- Use `space-lg` for card-to-card gaps, modal padding, and panel sections.
- Use `space-xl` strictly for macro structural spacing between disparate governance content regions.

## Elevation & Depth

This design system avoids theatrical drop shadows in favor of **Tonal Layering**, **Crisp Structural Hairlines**, and **Subtle Glassmorphic Panels**.

### Depth Tiers
1. **Base Surface (0dp):** Canvas `#F8FAFC`. Unbroken, distraction-free neutral backdrop.
2. **Structural Panels (1dp):** `#FFFFFF` surfaced cards bound by a crisp 1px border (`#E2E8F0`). Shadow is muted: `0 1px 3px 0 rgba(11, 25, 44, 0.04), 0 1px 2px -1px rgba(11, 25, 44, 0.02)`.
3. **Interactive & Hover (2dp):** Slightly elevated cards and dropdown menus. 1px border (`#CBD5E1`), shadow: `0 4px 6px -1px rgba(11, 25, 44, 0.07), 0 2px 4px -2px rgba(11, 25, 44, 0.04)`.
4. **Modals & Overlays (3dp):** Elevated citizen confirmation sheets, drawers, and dialogue windows: `0 20px 25px -5px rgba(11, 25, 44, 0.12), 0 8px 10px -6px rgba(11, 25, 44, 0.06)`. Backdrops use a soft dimming veil: `rgba(11, 25, 44, 0.45)` with `backdrop-filter: blur(4px)`.
5. **Glassmorphic Civic Strips:** Sticky headers, live voting tickers, and contextual action bars use `#FFFFFF` at 85% opacity, paired with `backdrop-filter: blur(12px)` and a bottom border in `rgba(226, 232, 240, 0.8)`.

## Shapes

The shape system adopts a **Soft (Level 1)** geometric standard. This delivers crisp, architectonic corners that communicate institutional discipline and modern precision, steering clear of toy-like circular radii.

### Radius Assignments
- **Core Elements (0.25rem / 4px):** Form controls, inputs, buttons, checkboxes, table cell selectors, and toast notifications.
- **Containers & Cards (`rounded-lg`, 0.5rem / 8px):** Civic activity cards, dashboard widgets, modal panels, search dialogs.
- **Hero & Feature Areas (`rounded-xl`, 0.75rem / 12px):** Civic initiative hero callouts, town hall announcements, high-level infographic framing.
- **Pills (Full Radius):** Reserved exclusively for dynamic status chips, voting tally tags, and badge counters to distinguish operational status from interactive rectangular inputs.

## Components

### Buttons
- **Primary:** Solid Civic Navy (`#0B192C`) with white label (`#FFFFFF`). Hover shifts to `#1E3E62`. Active shifts to `#060E18`. Radius: 4px (`rounded-sm`). Focus-visible: 2px ring of Civic Teal (`#008B74`) with 2px offset.
- **Action / Affirmative:** Civic Teal (`#008B74`) background with white label. Reserved for bill passing, citizen vote submission, and proposal confirmations.
- **Secondary:** Transparent fill, 1px border (`#CBD5E1`), text `#0B192C`. Hover fills with `#F1F5F9`.
- **Ghost:** Text `#1E3E62`, no border. Hover applies `#F8FAFC`.

### Chips & Badges
- **Status Pills:** Pill-shaped (`rounded-full`), 24px height, font `label-sm`.
  - *Active / Passed:* Light emerald wash (`#ECFDF5`), border `rgba(0, 139, 116, 0.2)`, text `#008B74`.
  - *Under Review / In Progress:* Soft amber wash (`#FFFBEB`), border `rgba(217, 119, 6, 0.2)`, text `#B45309`.
  - *Archived / Neutral:* Slate tint (`#F1F5F9`), border `#E2E8F0`, text `#475569`.

### Input Fields
- Flat white surface, 1px border (`#CBD5E1`), 4px border-radius, font `body-md`.
- Height: 40px for desktop data entry, 44px on mobile devices.
- Focused state: Border changes to `#1E3E62` with a 2px glow ring in `rgba(30, 62, 98, 0.15)`.
- Error state: 1px border (`#DC2626`), inline icon, red assistive caption text.

### Cards & Governance Panes
- Pure white ground (`#FFFFFF`), 1px outline (`#E2E8F0`), 8px border-radius (`rounded-lg`).
- Optional header accent: 3px structural top border in Civic Navy or Civic Teal for highlighted policy proposals.
- Internal padding follows `space-md` (16px) or `space-lg` (24px) depending on density setting.

### Checkboxes & Radios
- Checkboxes use 4px rounded corners; radio options use clean circular enclosures.
- 18px size, 1.5px border (`#94A3B8`). Selected state transitions to solid Civic Teal (`#008B74`) with white iconography.

### Additional Civic Components
- **Legislative Timeline:** Vertical spine (`#E2E8F0`) with 10px circular status nodes indicating bill progress (Drafted, Committee Hearing, Public Comment, Enacted).
- **Public Comment Feed Item:** Card variant featuring citizen anonymity flags, verified district resident badge, and collapsible official council response drawer.
- **Civic Metric Gauge:** High-contrast numeric display (Plus Jakarta Sans `headline-xl`) atop a thin dual-color progress track comparing community targets against actual public budgets.