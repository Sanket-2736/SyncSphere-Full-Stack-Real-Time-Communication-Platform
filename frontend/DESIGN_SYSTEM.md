# Apple-Inspired Design System

## Overview
This application has been redesigned to follow Apple's design philosophy: minimal, premium, spacious, elegant, and modern.

## Color Palette

### Primary Colors
- **Background**: `#F5F5F7` (Light gray)
- **Surface**: `#FFFFFF` (White)
- **Text**: `#1D1D1F` (Nearly black)
- **Secondary Text**: `#6E6E73` (Gray)

### Accent Colors
- **Primary Accent**: `#0071E3` (Apple Blue)
- **Success**: `#34C759` (Green)
- **Danger**: `#FF3B30` (Red)
- **Border**: `#E5E5E7` (Subtle gray)

## Typography

### Font Family
- Primary: Inter or system fonts (-apple-system, BlinkMacSystemFont, SF Pro Display)
- Monospace: SF Mono, Monaco

### Text Sizes & Weights
- **Headings**: 500-600 weight (not bold)
- **Body**: 400 weight, 16px line height 1.6
- **Captions**: 400 weight, 13px, line height 1.5
- **Large headings**: 48-56px, 600 weight

## Spacing & Layout

### Border Radius
- Buttons & small elements: 8px (btn)
- Cards & medium elements: 12-16px (card)
- Large elements: 20-32px

### Padding/Margins
- Gutters: 2rem (32px)
- Internal spacing: 1.5rem (24px)
- Compact spacing: 0.5-1rem

### Shadow System
- **sm**: 0 1px 3px rgba(0, 0, 0, 0.08)
- **md**: 0 4px 12px rgba(0, 0, 0, 0.08)
- **lg**: 0 12px 28px rgba(0, 0, 0, 0.12)
- **xl**: 0 20px 40px rgba(0, 0, 0, 0.15)

## Component Classes

### Buttons
```html
<!-- Primary -->
<button class="btn btn-primary">Action</button>

<!-- Secondary -->
<button class="btn btn-secondary">Action</button>

<!-- Tertiary -->
<button class="btn btn-tertiary">Action</button>

<!-- Icon Button -->
<button class="btn-icon"></button>

<!-- Icon Button Small -->
<button class="btn-icon-sm"></button>

<!-- Danger Button -->
<button class="btn btn-danger">Delete</button>
```

### Cards
```html
<!-- Basic Card -->
<div class="card"></div>

<!-- Elevated Card -->
<div class="card-elevated"></div>

<!-- Card with Hover Effect -->
<div class="card card-hover"></div>
```

### Inputs
```html
<!-- Standard Input -->
<input class="input" />

<!-- Large Input -->
<input class="input input-lg" />
```

### Badges
```html
<!-- Primary Badge -->
<span class="badge badge-primary"></span>

<!-- Secondary Badge -->
<span class="badge badge-secondary"></span>

<!-- Success Badge -->
<span class="badge badge-success"></span>

<!-- Danger Badge -->
<span class="badge badge-danger"></span>
```

### Status Indicators
```html
<div class="status-dot status-online"></div>
<div class="status-dot status-away"></div>
<div class="status-dot status-dnd"></div>
<div class="status-dot status-offline"></div>
```

### Messages
```html
<!-- Sent Message -->
<div class="message-sent bg-apple-accent text-white"></div>

<!-- Received Message -->
<div class="message-received bg-apple-border/30 text-apple-text"></div>
```

## Animations

### Fade In
```html
<div class="fade-in"></div>
```

### Scale In
```html
<div class="scale-in"></div>
```

### Slide Up
```html
<div class="slide-up"></div>
```

## Responsive Design

- **Desktop**: Full width
- **Tablet**: Sidebar may collapse
- **Mobile**: Single column, adjusted spacing

## Key Principles

1. **White Space**: Generous use of white space for breathing room
2. **Consistency**: Use the defined color, typography, and spacing system
3. **Interactions**: Smooth 200-300ms transitions
4. **Minimalism**: Avoid unnecessary decorations
5. **Hierarchy**: Clear visual hierarchy through size, weight, and color
6. **Accessibility**: Proper contrast, keyboard navigation, focus states

## Implementation Notes

All components have been updated to use the Tailwind config with `apple-*` color prefixes.
Replace all `luxury-*` classes with `apple-*` equivalents when updating components.

### Color Mapping Reference
- `luxury-bg` → `apple-bg`
- `luxury-card` → `apple-surface` or `white`
- `luxury-text` → `apple-text`
- `luxury-muted` → `apple-secondary`
- `luxury-accent` → `apple-accent`
