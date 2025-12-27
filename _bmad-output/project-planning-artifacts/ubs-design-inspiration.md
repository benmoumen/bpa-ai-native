# UBS Digital Banking Design Inspiration

> Research document for BPA AI-Native platform redesign
> Target: Government service configuration platform with premium banking aesthetics
> Last Updated: December 2024

---

## Executive Summary

This document captures UBS digital banking UI/UX patterns and Swiss fintech design principles to inform the BPA (Business Process Application) platform redesign. The goal is to create a clean, modern, professional interface that brings premium banking aesthetics to a government service configuration tool.

---

## 1. UBS Brand Colors

### Primary Brand Colors

| Color Name | Hex Code | RGB | CMYK | Pantone | Usage |
|------------|----------|-----|------|---------|-------|
| **UBS Red** | `#E60100` | (230, 1, 0) | (0, 100, 100, 10) | 2347 C | Primary accent, CTAs, brand emphasis |
| **UBS Black** | `#000000` | (0, 0, 0) | (0, 0, 0, 100) | Black 6 C | Text, headers, icons |

### Extended Palette for BPA Adaptation

For a government service configuration platform, we recommend extending the UBS palette with professional neutrals:

```
Primary Accent
--------------
UBS Red:        #E60100  (Use sparingly for critical actions)
Softer Red:     #CC1A1A  (Less aggressive for secondary highlights)

Neutral Grays
-------------
Charcoal:       #1A1A1A  (Headers, primary text)
Dark Gray:      #333333  (Secondary text)
Medium Gray:    #666666  (Tertiary text, labels)
Light Gray:     #999999  (Disabled states, hints)
Border Gray:    #E0E0E0  (Dividers, borders)
Background:     #F5F5F5  (Page backgrounds)
Card White:     #FFFFFF  (Cards, panels)

Functional Colors
-----------------
Success Green:  #00875A  (Confirmations, success states)
Warning Amber:  #F5A623  (Warnings, pending states)
Error Red:      #D0021B  (Errors, destructive actions)
Info Blue:      #0066CC  (Information, links)
```

### Color Usage Guidelines

- **Red (#E60100)**: Reserve for primary CTAs, critical notifications, and brand moments
- **Black/Charcoal**: Headlines, navigation items, important labels
- **Grays**: Body text, secondary information, borders
- **White**: Cards, panels, input backgrounds
- **Functional colors**: System feedback only

---

## 2. Typography Recommendations

### UBS Typography Heritage

UBS uses a sophisticated serif-based wordmark (similar to Walbaum SB-Roman) paired with Frutiger for body text. This creates a balance between traditional banking authority and modern readability.

### Recommended Font Stack for BPA

```css
/* Primary Headings - Professional Sans-Serif */
--font-heading: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;

/* Body Text - Clean, Readable */
--font-body: 'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace - Code, Data */
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
```

### Type Scale

```
Display:     48px / 56px line-height / -0.02em tracking / 700 weight
H1:          32px / 40px line-height / -0.01em tracking / 600 weight
H2:          24px / 32px line-height / normal tracking / 600 weight
H3:          20px / 28px line-height / normal tracking / 600 weight
H4:          16px / 24px line-height / normal tracking / 600 weight
Body Large:  16px / 24px line-height / normal tracking / 400 weight
Body:        14px / 20px line-height / normal tracking / 400 weight
Body Small:  13px / 18px line-height / normal tracking / 400 weight
Caption:     12px / 16px line-height / 0.01em tracking / 400 weight
Overline:    11px / 16px line-height / 0.08em tracking / 600 weight / UPPERCASE
```

### Typography Principles

1. **Limited font variations**: Maximum 2-3 weights per typeface
2. **Strong hierarchy**: Clear visual distinction between heading levels
3. **Generous line height**: 1.4-1.6 for body text (banking apps favor readability)
4. **Conservative letter-spacing**: Tight for headlines, normal for body

---

## 3. Navigation Patterns

### UBS Mobile App Navigation

UBS's redesigned mobile app features:
- **Tab bar navigation**: Primary sections accessible via bottom tab bar
- **User-centric home screen**: Financial health overview as the landing page
- **Unified payment flows**: Consistent interaction patterns across transaction types
- **Progressive disclosure**: Complex information revealed as needed

### BPA Navigation Recommendations

#### Primary Navigation Structure

```
[Sidebar Navigation - Persistent]
├── Dashboard (Home)
├── Services
│   ├── All Services
│   ├── Active
│   └── Draft
├── Forms
│   ├── Form Builder
│   └── Templates
├── Workflows
├── Users & Roles
├── Reports
└── Settings
```

#### Navigation Component Patterns

1. **Left Sidebar (Desktop)**
   - Fixed position, 240px width
   - Collapsible to 64px icon-only mode
   - Grouped sections with visual separators
   - Active state: Red left border accent (#E60100)

2. **Tab Navigation (Within Pages)**
   - Underline style with red indicator
   - For switching between related views (e.g., "All | Active | Draft")

3. **Breadcrumbs**
   - Always visible for deep navigation
   - Shows full path: Home > Services > [Service Name] > Settings

4. **Command Palette (AI Feature)**
   - Keyboard shortcut: Cmd/Ctrl + K
   - Quick navigation to any section
   - AI-powered search and actions

---

## 4. Card & Panel Layouts

### Swiss Banking Card Design Principles

- **Generous padding**: 24-32px internal spacing
- **Subtle shadows**: Soft elevation, no harsh drop shadows
- **Border radius**: 8-12px (modern but professional)
- **Clear headers**: Distinct header section with title and actions

### Card Component Specifications

```css
/* Base Card */
.card {
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E0E0E0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  padding: 24px;
}

/* Card with Header */
.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid #E0E0E0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Elevated Card (for modals, popovers) */
.card-elevated {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
```

### Panel Types for BPA

| Panel Type | Use Case | Visual Style |
|------------|----------|--------------|
| **Dashboard Widget** | Metrics, quick stats | White card, subtle shadow, large number display |
| **Form Section** | Grouped form fields | Light gray background, no border |
| **Configuration Panel** | Settings, options | White card with header |
| **Preview Panel** | Form preview, output | Light border, scrollable content |
| **AI Response** | Chat responses | Slight tint, conversation style |

---

## 5. Form Design Patterns

### Banking-Grade Form Design

Financial applications demand the highest form UX standards:
- **Inline validation**: Immediate feedback on input
- **Clear error states**: Specific, actionable error messages
- **Smart defaults**: Reduce cognitive load
- **Progressive disclosure**: Show fields when relevant

### Form Component Specifications

#### Text Input

```css
.input {
  height: 44px;
  padding: 0 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  border-color: #E60100;
  box-shadow: 0 0 0 3px rgba(230, 1, 0, 0.1);
  outline: none;
}

.input:invalid {
  border-color: #D0021B;
}
```

#### Form Layout Guidelines

- **Label position**: Above input (not inline)
- **Field spacing**: 24px between field groups
- **Required indicator**: Red asterisk after label
- **Help text**: Below input, gray, 12px
- **Error text**: Below input, red, 12px, with icon

### Multi-Step Form Pattern

For complex configurations (like service setup):

```
[Step Indicator Bar]
1. Basic Info ──── 2. Form Fields ──── 3. Workflow ──── 4. Review

[Form Content Area]
Progressive sections revealed step-by-step

[Action Bar]
[ Back ]                              [ Save Draft ] [ Continue ]
```

---

## 6. Dashboard Layouts

### UBS Dashboard Philosophy

UBS's redesigned home screen provides:
- Financial health overview at a glance
- Personalized insights and recommendations
- Quick access to frequent actions
- Data-driven product suggestions

### BPA Dashboard Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Platform Name + Search + User Menu + Notifications    │
├───────────────┬─────────────────────────────────────────────────┤
│               │  WELCOME SECTION                                │
│               │  [Good morning, Name] + Quick Actions           │
│   SIDEBAR     ├─────────────────────────────────────────────────┤
│   NAVIGATION  │  METRICS ROW                                    │
│               │  [Services] [Forms] [Pending] [Active Users]    │
│               ├─────────────────────────────────────────────────┤
│               │  MAIN CONTENT                                   │
│               │  ┌─────────────────┐ ┌─────────────────────────┐│
│               │  │ Recent Activity │ │ AI Assistant            ││
│               │  │                 │ │ Quick questions & help  ││
│               │  │                 │ │                         ││
│               │  └─────────────────┘ └─────────────────────────┘│
│               │  ┌─────────────────────────────────────────────┐│
│               │  │ Services Overview Table                     ││
│               │  │ Quick view of all configured services       ││
│               │  └─────────────────────────────────────────────┘│
└───────────────┴─────────────────────────────────────────────────┘
```

### Widget Design

```css
/* Metric Widget */
.metric-widget {
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.metric-value {
  font-size: 32px;
  font-weight: 600;
  color: #1A1A1A;
}

.metric-label {
  font-size: 13px;
  color: #666666;
  margin-top: 4px;
}

.metric-trend {
  font-size: 12px;
  margin-top: 8px;
}

.metric-trend.positive { color: #00875A; }
.metric-trend.negative { color: #D0021B; }
```

---

## 7. Data Table Presentations

### Banking Data Table Principles

- **Scannable**: Key information in leftmost columns
- **Sortable**: Click column headers to sort
- **Filterable**: Search and filter options
- **Actionable**: Row actions clearly visible
- **Responsive**: Horizontal scroll on smaller screens

### Table Component Specifications

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #E0E0E0;
  background: #FAFAFA;
}

.table td {
  padding: 16px;
  border-bottom: 1px solid #E0E0E0;
  font-size: 14px;
}

.table tr:hover {
  background: #F8F8F8;
}
```

### Table Features for BPA

| Feature | Implementation |
|---------|---------------|
| **Search** | Global search bar above table |
| **Filters** | Dropdown filters for status, type, date |
| **Bulk Actions** | Checkbox selection + action bar |
| **Pagination** | Bottom pagination with page size selector |
| **Row Actions** | Hover-reveal action icons or kebab menu |
| **Status Badges** | Colored pills (Active: green, Draft: gray, etc.) |

---

## 8. Action Button Styles

### Button Hierarchy

```css
/* Primary Button - Main CTA */
.btn-primary {
  background: #E60100;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #CC0000;
}

/* Secondary Button */
.btn-secondary {
  background: white;
  color: #1A1A1A;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  border: 1px solid #E0E0E0;
}

.btn-secondary:hover {
  background: #F5F5F5;
  border-color: #CCCCCC;
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: #E60100;
  padding: 12px 24px;
  border: none;
  font-weight: 500;
}

/* Destructive Button */
.btn-destructive {
  background: #D0021B;
  color: white;
  /* Same sizing as primary */
}

/* Icon Button */
.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
```

### Button Placement Guidelines

- **Primary action**: Right-aligned in forms and modals
- **Cancel/Back**: Left side, secondary style
- **Destructive actions**: Require confirmation modal
- **Icon buttons**: For compact actions (edit, delete, more)

---

## 9. White Space Usage

### Swiss Design Principles

Swiss and UBS design emphasizes generous whitespace for:
- Calm, focused user experience
- Clear visual hierarchy
- Reduced cognitive load
- Premium, professional feel

### Spacing Scale

```css
:root {
  --space-1: 4px;   /* Compact internal spacing */
  --space-2: 8px;   /* Icon margins, small gaps */
  --space-3: 12px;  /* Compact component padding */
  --space-4: 16px;  /* Default component padding */
  --space-5: 20px;  /* Card internal padding */
  --space-6: 24px;  /* Section padding */
  --space-8: 32px;  /* Large section gaps */
  --space-10: 40px; /* Page section separators */
  --space-12: 48px; /* Major layout divisions */
  --space-16: 64px; /* Page top/bottom margins */
}
```

### Layout Density

| Context | Padding | Gap Between Items |
|---------|---------|-------------------|
| **Cards** | 24px | 16px |
| **Forms** | 24px | 24px between groups |
| **Tables** | 16px cells | 0 (row borders) |
| **Sidebars** | 16px | 8px between items |
| **Dashboard Widgets** | 20px | 16px grid gap |
| **Modal Content** | 32px | 24px sections |

---

## 10. Mobile-First Patterns

### UBS Mobile-First Philosophy

UBS is "very strongly focused on building products with a mobile-first approach." Key principles:

1. **Touch-friendly targets**: Minimum 44px tap targets
2. **Thumb-zone awareness**: Primary actions in comfortable reach
3. **Progressive enhancement**: Core features work on mobile, enhanced on desktop
4. **Consistent experience**: Same design language across devices

### Responsive Breakpoints

```css
/* Mobile First Approach */
/* Default: Mobile (0-639px) */

/* Tablet */
@media (min-width: 640px) { ... }

/* Small Desktop */
@media (min-width: 1024px) { ... }

/* Desktop */
@media (min-width: 1280px) { ... }

/* Large Desktop */
@media (min-width: 1536px) { ... }
```

### Mobile Adaptations for BPA

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Navigation | Left sidebar | Bottom tab bar or hamburger |
| Tables | Full table | Card list view |
| Forms | Side-by-side fields | Stacked fields |
| Modals | Centered overlay | Full-screen sheet |
| Actions | Button row | Floating action button |

---

## 11. Applying Banking UI to Government Service Builder

### Adaptation Strategy

| Banking Pattern | Government Service Adaptation |
|-----------------|-------------------------------|
| Account dashboard | Service overview dashboard |
| Transaction history | Activity log / audit trail |
| Payment flows | Multi-step service configuration |
| Portfolio view | Service catalog management |
| Security features | Role-based access controls |
| Financial insights | Service analytics and reports |

### Trust-Building Elements

Government platforms require the same trust signals as banking:

1. **Professional typography**: Clean, authoritative fonts
2. **Restrained color use**: Avoid visual noise
3. **Clear status indicators**: Users always know system state
4. **Confirmation patterns**: Verify before destructive actions
5. **Consistent interface**: Same patterns everywhere
6. **Accessible design**: WCAG 2.1 AA compliance minimum

### AI Integration Design

For AI-native features, blend banking professionalism with conversational UI:

```
┌─────────────────────────────────────────────┐
│  AI Assistant                           [×] │
├─────────────────────────────────────────────┤
│                                             │
│  How can I help you configure your          │
│  service today?                             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Create a new permit service         │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ Add fields to existing form         │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ Generate workflow from description  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Type a message...               [→] │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 12. Component Summary

### Essential Components for BPA

| Component | Priority | UBS Inspiration |
|-----------|----------|-----------------|
| Button (Primary, Secondary, Ghost) | High | Red accent, clean styling |
| Input (Text, Select, Checkbox) | High | Focused states, inline validation |
| Card | High | Generous padding, subtle shadow |
| Table | High | Professional, sortable, actionable |
| Modal/Dialog | High | Clean header, clear actions |
| Navigation (Sidebar, Tabs) | High | Organized, persistent |
| Badge/Status | Medium | Color-coded pills |
| Avatar | Medium | User identification |
| Tooltip | Medium | Helpful context |
| Dropdown | Medium | Clean, searchable options |
| Toast/Notification | Medium | Non-intrusive feedback |
| Progress Indicator | Medium | Step-by-step flows |
| Data Visualization | Low | Charts for analytics |

---

## 13. Design Token Reference

### Complete Token Set

```css
:root {
  /* Colors - Brand */
  --color-primary: #E60100;
  --color-primary-hover: #CC0000;
  --color-primary-light: rgba(230, 1, 0, 0.1);

  /* Colors - Neutral */
  --color-black: #000000;
  --color-charcoal: #1A1A1A;
  --color-gray-900: #333333;
  --color-gray-700: #666666;
  --color-gray-500: #999999;
  --color-gray-300: #CCCCCC;
  --color-gray-200: #E0E0E0;
  --color-gray-100: #F5F5F5;
  --color-white: #FFFFFF;

  /* Colors - Semantic */
  --color-success: #00875A;
  --color-warning: #F5A623;
  --color-error: #D0021B;
  --color-info: #0066CC;

  /* Typography */
  --font-sans: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.8125rem;
  --text-base: 0.875rem;
  --text-lg: 1rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.08);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

## Sources & References

### UBS Design Research
- [Netguru - UBS Mobile Banking Redesign Case Study](https://www.netguru.com/clients/ubs-mobile-banking)
- [Netguru - UBS Unified Design Language](https://www.netguru.com/clients/unified-design-language)
- [Frog Design - UBS Mobile Banking](https://www.frog.co/work/ubs-mobile-banking)
- [UBS Brand Colors - SchemeColor](https://www.schemecolor.com/ubs-logo-colors.php)
- [UBS Brand Guidelines - BrandColorCode](https://www.brandcolorcode.com/ubs)
- [UBS Our Brand Page](https://www.ubs.com/global/en/our-firm/what-we-do/our-brand.html)

### Fintech & Banking Design Patterns
- [Phenomenon Studio - Fintech Design Patterns](https://phenomenonstudio.com/article/fintech-design-breakdown-the-most-common-design-patterns/)
- [Eleken - Fintech Design Guide](https://www.eleken.co/blog-posts/modern-fintech-design-guide)
- [Merge Rocks - Banking App UX Strategies](https://merge.rocks/blog/10-best-strategies-for-banking-app-ux-fintech-design-studio-guide)

### Enterprise & Government Design Systems
- [UXPin - Enterprise UI Components](https://www.uxpin.com/studio/blog/enterprise-ui-app/)
- [Door3 - Enterprise Design Systems](https://www.door3.com/blog/enterprise-design-system-all-the-basics-you-need-to-know)
- [Supernova - Government Design Systems](https://www.supernova.io/blog/top-10-government-design-systems-enhancing-digital-public-services)
- [GOV.UK Design System](https://design-system.service.gov.uk/)
- [U.S. Web Design System (USWDS)](https://designsystem.digital.gov/)

---

*This document serves as a design reference for the BPA AI-Native platform. Implementation should adapt these patterns to specific user needs validated through testing.*
