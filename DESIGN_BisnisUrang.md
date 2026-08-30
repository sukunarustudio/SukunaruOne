# DESIGN.md — BisnisUrang Design System

> Official design system for **BisnisUrang** — a mobile-first business operations app for small shops, UMKM, printing businesses, and workshops.

---

## 01. Design Philosophy

BisnisUrang should feel:

- Simple
- Fast
- Clear
- Professional
- Friendly
- Reliable
- Mobile-first

### Core Principle

> **Clarity first. Action second. Decoration last.**

BisnisUrang is an operational business application, not a generic SaaS dashboard.

The Home screen must prioritize:
1. Business summary
2. Financial snapshot
3. Quick actions
4. Operational information

The application must keep direct access to all important modules through a **Quick Actions grid**, similar in usability to a modern digital-wallet home screen.

---

# 02. Color System

BisnisUrang uses a deliberately small five-color core palette.

## Official Brand Palette

| Token | Hex | Usage |
|---|---|---|
| `white` | `#FFFFFF` | Main surfaces, cards, inputs |
| `mist` | `#EAEFEF` | App background, subtle surfaces |
| `blue-gray` | `#BFC9D1` | Borders, dividers, inactive structure |
| `navy` | `#25343F` | Primary text, strong surfaces, navigation |
| `primary-orange` | `#FF9B51` | Primary brand color, CTA, active state, accent |

### Core Tokens

```yaml
colors:
  primary: "#FF9B51"
  background: "#EAEFEF"
  surface: "#FFFFFF"
  dark: "#25343F"
  border: "#BFC9D1"
```

### Primary Color

**`#FF9B51` is the official primary color of BisnisUrang.**

Use it for:
- Primary buttons
- Main CTA
- Active navigation
- Selected states
- Important actions
- Brand accents
- Focus states
- Important highlights

Do NOT replace the primary orange with purple, indigo, blue, green, or another arbitrary brand color.

### Color Balance

Target approximate visual ratio:

```text
White / EAEFEF       70–80%
Navy / Blue Gray     15–25%
Orange                5–10%
```

Orange should be visually recognizable and energetic without covering the entire interface.

### Extended Orange Tints

These are derived from the official primary and may be used when a lighter orange surface is necessary:

```yaml
primary:
  500: "#FF9B51"
  400: "#FFB27D"
  300: "#FFCCA8"
  200: "#FFE6D6"
  100: "#FFF3E8"
```

Do not create unrelated accent palettes.

---

# 03. Typography

BisnisUrang uses exactly two primary typefaces.

## Interface Typeface — Funnel Sans

**Funnel Sans** is the default interface font.

Use Funnel Sans for:

- Page titles
- Section headings
- Navigation
- Menu labels
- Buttons
- Forms
- Labels
- Body text
- Captions
- Tabs
- Dialogs
- Empty states
- Error messages
- Status labels

```yaml
typography:
  interface:
    fontFamily: "Funnel Sans"
```

### Interface Type Scale

| Style | Font | Weight | Size | Line Height |
|---|---|---:|---:|---:|
| Title 1 | Funnel Sans | 600 | 24px | 32px |
| Title 2 | Funnel Sans | 600 | 20px | 28px |
| Title 3 | Funnel Sans | 600 | 16px | 24px |
| Body 1 | Funnel Sans | 400 | 14px | 20px |
| Body 2 | Funnel Sans | 500 | 13px | 18px |
| Caption | Funnel Sans | 500 | 12px | 16px |
| Overline | Funnel Sans | 600 | 10px | 14px |

Use font weight intentionally. Avoid making every label bold.

---

## Numerical Typeface — Roboto Sans

**Roboto Sans** is used for numerical and data-heavy content.

Use Roboto Sans for:

- Rupiah
- Prices
- Omzet
- Profit
- Expenses
- Cash balance
- Quantity
- Stock count
- SKU
- Invoice numbers
- Transaction numbers
- Percentages
- Financial tables
- Statistical values

```yaml
typography:
  numeric:
    fontFamily: "Roboto Sans"
    fontVariantNumeric: "tabular-nums"
```

### Numeric Large

```yaml
numeric-large:
  fontFamily: "Roboto Sans"
  fontSize: "24px"
  fontWeight: 700
  lineHeight: "29px"
  fontVariantNumeric: "tabular-nums"
```

### Numeric Medium

```yaml
numeric-medium:
  fontFamily: "Roboto Sans"
  fontSize: "16px"
  fontWeight: 500
  lineHeight: "21px"
  fontVariantNumeric: "tabular-nums"
```

### Numeric Small

```yaml
numeric-small:
  fontFamily: "Roboto Sans"
  fontSize: "13px"
  fontWeight: 500
  lineHeight: "18px"
  fontVariantNumeric: "tabular-nums"
```

Example:

```text
OMZET
Rp 3.513.000

PENGELUARAN
Rp 840.000

PROFIT
Rp 2.673.000

STOK
124 pcs

INVOICE
INV-2026-0012
```

Labels use Funnel Sans.

Values use Roboto Sans.

### Typography Rules

DO:
- Use Funnel Sans as the default UI font.
- Use Roboto Sans for numeric/data values.
- Use tabular numerals when values need alignment.
- Keep typography compact and readable on mobile.

DO NOT:
- Use Poppins.
- Use DM Sans.
- Use JetBrains Mono.
- Introduce additional fonts without explicit approval.

---

# 04. Spacing

Use a 4px base grid.

```yaml
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
```

Preferred spacing:

```text
Icon → label:       8px
Component padding:  12–16px
Section gap:        16–24px
Screen padding:     16px
```

Avoid arbitrary spacing values.

---

# 05. Border Radius

Use controlled rounded corners.

```yaml
radius:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  full: 999px
```

Recommended:

```text
Button: 8px
Input:  8px
Card:   12px
Modal:  16px
Badge:  999px
```

Do not make every component pill-shaped.

---

# 06. Elevation

BisnisUrang uses subtle elevation.

Default:

```css
box-shadow: 0 2px 8px rgba(37, 52, 63, 0.06);
```

Floating:

```css
box-shadow: 0 4px 12px rgba(37, 52, 63, 0.08);
```

Modal:

```css
box-shadow: 0 8px 24px rgba(37, 52, 63, 0.10);
```

Prefer borders and surface contrast over heavy shadows.

---

# 07. Buttons

## Primary Button

```yaml
button-primary:
  background: "#FF9B51"
  color: "#25343F"
  radius: "8px"
  minHeight: "44px"
  padding: "0 16px"
  fontFamily: "Funnel Sans"
  fontWeight: 600
```

Examples:

```text
+ Tambah Pesanan
Simpan
Bayar
Tambah Produk
Aktivasi
```

## Secondary Button

```yaml
button-secondary:
  background: "#25343F"
  color: "#FFFFFF"
  radius: "8px"
  minHeight: "44px"
  padding: "0 16px"
  fontFamily: "Funnel Sans"
  fontWeight: 600
```

## Outline Button

```yaml
button-outline:
  background: "#FFFFFF"
  color: "#25343F"
  border: "1px solid #BFC9D1"
  radius: "8px"
  minHeight: "44px"
```

## Disabled

```text
background: #EAEFEF
text:       #898989
```

Do not use orange for disabled actions.

---

# 08. Input Fields

```yaml
input:
  height: "44px"
  background: "#FFFFFF"
  border: "1px solid #BFC9D1"
  radius: "8px"
  textColor: "#25343F"
  fontFamily: "Funnel Sans"
```

Focus:

```css
border-color: #FF9B51;
box-shadow: 0 0 0 3px #FFE6D6;
```

Labels must remain visible. Do not rely only on placeholders.

---

# 09. Cards

Cards are used to group meaningful information.

```yaml
card:
  background: "#FFFFFF"
  border: "1px solid #E0E0E0"
  radius: "12px"
  padding: "12px"
```

Do not turn every small element into an individual card.

Use cards for:
- Financial summaries
- Business information
- Important details
- Distinct content groups

Prefer lists when the user needs to scan many records.

---

# 10. Iconography

Use one consistent icon family.

Characteristics:
- Simple
- Clean
- Geometric
- Outline-first
- Consistent stroke
- Easy to recognize at small sizes

```yaml
icon:
  small: 16px
  default: 20px
  large: 24px
  strokeWidth: 1.8
```

Default:

```text
#25343F
```

Active:

```text
#FF9B51
```

Do not use emoji as production UI icons.

Do not give every menu icon a different color.

---

# 11. Home Screen

The Home screen is the primary command center of BisnisUrang.

It should NOT look like a generic analytics dashboard.

## Home Structure

```text
Business Summary
        ↓
Financial Snapshot
        ↓
Quick Actions
        ↓
Operational Information
```

---

## Quick Actions

All important modules must remain directly accessible from Home.

Default modules:

```text
Pesanan
Pelanggan
Produk
HPP
Bahan Baku
Arus Kas
Laporan
Pengaturan
```

Use a compact 4-column grid on mobile.

```text
┌────────┬──────────┬────────┬────────────┐
│  icon  │   icon   │  icon  │    icon    │
│ Pesanan│Pelanggan │ Produk │     HPP    │
├────────┼──────────┼────────┼────────────┤
│  icon  │   icon   │  icon  │    icon    │
│  Bahan │ Arus Kas │Laporan │ Pengaturan │
└────────┴──────────┴────────┴────────────┘
```

The grid is one navigation module, not eight floating cards.

### Quick Action Rules

```text
Icon:             20–24px
Label:            11–12px
Touch target:     minimum 44px
Surface:          #FFFFFF / #EAEFEF
Active accent:    #FF9B51
```

Notification badges should be compact and not overpower the icon.

### NEVER Remove Quick Actions

Quick Actions are a core part of the BisnisUrang Home experience.

Do not remove them simply to create more whitespace.

---

# 12. Business Summary

Use Navy as the strong visual anchor and Orange as the accent.

Example:

```text
┌──────────────────────────────────┐
│ SALDO KAS                        │
│                                  │
│ Rp 3.513.000              [Kas]  │
│                                  │
│ Arus Kas                         │
└──────────────────────────────────┘
```

```yaml
background: "#25343F"
text: "#FFFFFF"
accent: "#FF9B51"
```

Navy provides stability.

Orange provides emphasis.

Do not use this dark surface for every card.

---

# 13. Financial Information

Financial values have high visual priority.

Rules:
- Use Roboto Sans.
- Use tabular numerals.
- Make values larger than labels.
- Keep labels quieter than values.
- Align related numbers consistently.
- Avoid decorative charts that do not provide useful information.

Example:

```text
OMZET
Rp 3.513.000

PENGELUARAN
Rp 840.000

PROFIT
Rp 2.673.000
```

---

# 14. Status System

Color must never be the only way to communicate status.

Always include explicit text.

Examples:

```text
LUNAS
DP
BELUM LUNAS
DIPROSES
SELESAI
BATAL
STOK MENIPIS
```

Orange can be used for:

```text
DP
DIPROSES
STOK MENIPIS
```

Navy and neutral treatments can represent normal/completed states.

If a true error/danger state requires stronger differentiation, use a restrained semantic treatment without changing the brand primary color.

---

# 15. Navigation

If bottom navigation is used:

```text
Beranda
Pesanan
Produk
Kas
Lainnya
```

Inactive:

```text
#898989
```

Active:

```text
#FF9B51
```

Do not assign a different accent color to every navigation item.

---

# 16. Lists

Lists are preferred for record-heavy screens.

Use lists for:
- Pesanan
- Pelanggan
- Produk
- Transaksi
- Bahan Baku

Each row should prioritize:

```text
Primary information
Secondary information
Status
Amount / Action
```

Avoid unnecessary decorative containers.

---

# 17. Responsive Design

BisnisUrang is mobile-first.

Never simply shrink a desktop layout to mobile.

## Mobile

Prioritize:
- Quick Actions
- Thumb-friendly controls
- Compact information
- Vertical layouts
- Clear hierarchy
- Minimal horizontal scrolling

## Desktop

May use:
- Multi-column layouts
- Wider tables
- Side navigation
- More simultaneous information

The visual language must remain consistent across breakpoints.

---

# 18. Touch Targets

Minimum effective touch target:

```text
44 × 44px
```

Icons can be 20–24px, but their interactive area must remain comfortable.

---

# 19. Motion

Motion is functional only.

Default duration:

```text
150–220ms
```

Use motion for:
- Navigation
- Modal / sheet
- Button feedback
- Loading
- State transitions

Avoid:
- Excessive bounce
- Long animations
- Decorative animation
- Constant movement

---

# 20. Empty States

Keep empty states compact and actionable.

Example:

```text
Belum ada pesanan

Pesanan baru akan muncul di sini.

[ + Tambah Pesanan ]
```

Avoid oversized illustrations.

---

# 21. Loading States

Prefer:
- Skeleton
- Inline loading
- Button loading
- Small progress indicator

Avoid unnecessary full-screen loading.

---

# 22. Error States

Explain:

1. What happened
2. What the user can do
3. How to recover

Example:

```text
Data belum dapat dimuat

Coba lagi beberapa saat.

[ Coba Lagi ]
```

Never expose raw technical errors to users.

---

# 23. Accessibility

Required:
- Clear text contrast
- Visible focus state
- Accessible icon labels
- Color is never the only status indicator
- Minimum 44px touch target
- Keyboard navigation on desktop
- Readable typography
- No clipped text

---

# 24. Anti-Generic UI Rules

## NEVER

- Use a generic SaaS dashboard template.
- Give every menu icon a different pastel color.
- Use gradients by default.
- Put every section inside a floating card.
- Use heavy shadows.
- Make every component pill-shaped.
- Use huge headings that waste mobile space.
- Add charts only because dashboards normally have charts.
- Replace the orange primary with another brand color.
- Remove the Home Quick Actions.
- Mix multiple unrelated icon families.
- Add random purple, indigo, cyan, emerald, or neon accents.

## ALWAYS

- Use `#FF9B51` as the primary brand/action color.
- Use `#25343F` as the main dark neutral.
- Use `#FFFFFF` and `#EAEFEF` as dominant surfaces.
- Use `#BFC9D1` for structural borders.
- Keep all major modules accessible from Home.
- Use Funnel Sans for interface text.
- Use Roboto Sans for numeric/data content.
- Prioritize mobile usability.
- Keep information dense but comfortable.
- Use color to establish hierarchy, not decoration.

---

# 25. AI Coding Agent Rules

Before modifying any UI:

1. Read `DESIGN.md`.
2. Inspect the existing project structure.
3. Inspect existing components.
4. Reuse existing components whenever possible.
5. Reuse existing design tokens.
6. Do not introduce arbitrary colors.
7. Do not introduce another font.
8. Do not replace `#FF9B51` as the primary color.
9. Do not remove Home Quick Actions.
10. Do not redesign unrelated screens.
11. Do not change the global design system to solve a local UI problem.
12. Check mobile layout first.
13. Check loading state.
14. Check empty state.
15. Check error state.
16. Check disabled state.
17. Check active state.
18. Check focus state.
19. Preserve existing business logic.
20. Do not rewrite working architecture without a strong reason.

If the user explicitly requests a design change that conflicts with this document, follow the user's explicit request for that task without silently changing the entire global design system.

---

# 26. Complete Design Tokens

```yaml
brand:
  primary: "#FF9B51"
  dark: "#25343F"

surface:
  background: "#EAEFEF"
  surface: "#FFFFFF"

neutral:
  dark: "#25343F"
  blueGray: "#BFC9D1"
  gray700: "#434343"
  gray600: "#898989"
  gray300: "#CACACA"
  gray200: "#E0E0E0"
  white: "#FFFFFF"

typography:
  interface:
    fontFamily: "Funnel Sans"

  numeric:
    fontFamily: "Roboto Sans"
    fontVariantNumeric: "tabular-nums"

  title1:
    fontFamily: "Funnel Sans"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"

  title2:
    fontFamily: "Funnel Sans"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"

  title3:
    fontFamily: "Funnel Sans"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "24px"

  body:
    fontFamily: "Funnel Sans"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"

  body-medium:
    fontFamily: "Funnel Sans"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"

  caption:
    fontFamily: "Funnel Sans"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"

  numeric-large:
    fontFamily: "Roboto Sans"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "29px"
    fontVariantNumeric: "tabular-nums"

  numeric-medium:
    fontFamily: "Roboto Sans"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "21px"
    fontVariantNumeric: "tabular-nums"

  numeric-small:
    fontFamily: "Roboto Sans"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
    fontVariantNumeric: "tabular-nums"

radius:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "999px"

spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"

interaction:
  minTouchTarget: "44px"
  transition: "150–220ms"
```

---

# 27. Final Principle

BisnisUrang should feel:

> **Simple enough for daily use.**
>
> **Fast enough for a busy shop.**
>
> **Clear enough for business data.**
>
> **Distinct enough to be BisnisUrang.**

Every UI element should have a reason.

If an element does not:
- clarify information,
- speed up an action,
- improve navigation,
- or strengthen the BisnisUrang identity,

it probably does not need to exist.
