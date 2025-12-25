# ConfCert Yellow Theme System

## Color Palette

### Primary Colors
- **Light Yellow**: `#FEF9C3` (yellow-100)
- **Medium Yellow**: `#FDE047` (yellow-300)
- **Base Yellow**: `#FACC15` (yellow-400)
- **Dark Yellow**: `#EAB308` (yellow-500)
- **Deep Yellow**: `#CA8A04` (yellow-600)

### Accent Colors
- **Amber**: `#F59E0B` (amber-500)
- **Orange**: `#F97316` (orange-500)

### Neutral Colors
- **Background**: `#FEFCE8` (yellow-50)
- **Card Background**: `#FFFFFF` with yellow tint
- **Text Primary**: `#713F12` (yellow-900)
- **Text Secondary**: `#854D0E` (yellow-800)
- **Border**: `#FDE68A` (yellow-200)

## Gradients

### Primary Gradient
```css
background: linear-gradient(135deg, #FEF9C3 0%, #FDE047 50%, #FACC15 100%);
```

### Card Gradient
```css
background: linear-gradient(180deg, #FFFFFF 0%, #FEF9C3 100%);
```

### Button Gradient (Primary)
```css
background: linear-gradient(135deg, #FACC15 0%, #EAB308 100%);
hover: background: linear-gradient(135deg, #EAB308 0%, #CA8A04 100%);
```

### Button Gradient (Secondary)
```css
background: linear-gradient(135deg, #FEF9C3 0%, #FDE047 100%);
```

### Hero Gradient
```css
background: linear-gradient(180deg, #FEFCE8 0%, #FEF9C3 50%, #FDE047 100%);
```

## Component Styles

### Cards
- Background: White with subtle yellow tint or gradient
- Border: 2px solid #FDE68A
- Border Radius: 16px (rounded-2xl)
- Shadow: `0 10px 25px -5px rgba(234, 179, 8, 0.15)`
- Padding: 2rem (p-8)

### Buttons
- Primary: Yellow gradient with white text
- Height: 48px (h-12)
- Padding: 24px horizontal (px-6)
- Border Radius: 12px (rounded-xl)
- Font Weight: 600 (font-semibold)
- Transition: all 0.3s ease

### Inputs
- Background: White
- Border: 2px solid #FDE68A
- Focus Border: #FACC15
- Border Radius: 12px (rounded-xl)
- Height: 48px (h-12)
- Padding: 16px horizontal (px-4)

### Typography
- Headings: Yellow-900 (#713F12)
- Body: Yellow-800 (#854D0E)
- Font Family: System fonts or Geist

## Layout
- Max Width: 1200px
- Container Padding: 2rem
- Spacing Scale: Tailwind default (4px base)

## Animations
- Hover Scale: scale(1.02)
- Transition Duration: 300ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

## Usage Examples

### Card Component
```jsx
<div className="bg-gradient-to-b from-white to-yellow-100 border-2 border-yellow-200 rounded-2xl p-8 shadow-[0_10px_25px_-5px_rgba(234,179,8,0.15)]">
  {/* Content */}
</div>
```

### Primary Button
```jsx
<button className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
  Button Text
</button>
```

### Input Field
```jsx
<input className="w-full h-12 px-4 border-2 border-yellow-200 focus:border-yellow-400 focus:outline-none rounded-xl transition-colors" />
```

### Page Layout
```jsx
<div className="min-h-screen bg-gradient-to-b from-yellow-50 via-yellow-100 to-yellow-200">
  <div className="max-w-6xl mx-auto px-8 py-12">
    {/* Content */}
  </div>
</div>
```
