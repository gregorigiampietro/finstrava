# Finstrava Design System

## 1. Design Philosophy
**"Clarity, Precision, and Trust."**
The design should feel professional, trustworthy, and modern. We prioritize content legibility, clear hierarchy, and subtle interactions that delight the user without being distracting.

## 2. Typography
**Font Family**: `Inter`, sans-serif.
- **Headings**: Bold (700) or SemiBold (600). Tight tracking (-0.02em).
- **Body**: Regular (400). Normal tracking.
- **Small Text**: Medium (500).

**Scale**:
- `h1`: 30px (1.875rem) / 36px
- `h2`: 24px (1.5rem) / 32px
- `h3`: 20px (1.25rem) / 28px
- `body`: 16px (1rem) / 24px
- `small`: 14px (0.875rem) / 20px

## 3. Color Palette

### Neutrals (Slate)
Used for text, borders, and backgrounds.
- `slate-50`: #F8FAFC (App Background)
- `slate-100`: #F1F5F9 (Subtle Backgrounds)
- `slate-200`: #E2E8F0 (Borders)
- `slate-500`: #64748B (Secondary Text)
- `slate-900`: #0F172A (Primary Text, Strong UI Elements)

### Primary (Indigo)
Used for primary actions, active states, and brand presence.
- `primary`: #4F46E5 (Indigo-600)
- `primary-foreground`: #FFFFFF

### Semantic Colors
- **Success**: #10B981 (Emerald-500)
- **Warning**: #F59E0B (Amber-500)
- **Error**: #EF4444 (Red-500)
- **Info**: #3B82F6 (Blue-500)

## 4. Spacing & Layout
**Base Unit**: 4px (0.25rem).
- `p-4` (16px): Standard padding for cards.
- `gap-4` (16px): Standard gap between elements.
- `max-w-7xl`: Standard container width.

## 5. Components

### Buttons
- **Primary**: Indigo-600 background, White text. Hover: Indigo-700. Shadow-sm.
- **Secondary**: White background, Slate-200 border, Slate-900 text. Hover: Slate-50.
- **Ghost**: Transparent background. Hover: Slate-100.

### Cards
- White background.
- Border: Slate-200 (1px).
- Shadow: `shadow-sm` (subtle).
- Radius: `rounded-xl` (0.75rem) for a modern feel.

### Inputs
- Background: White.
- Border: Slate-200.
- Focus Ring: Indigo-600 (2px, offset).
- Radius: `rounded-md`.

## 6. Dark Mode (Future Proofing)
- Background: Slate-950 (#020617).
- Card: Slate-900 (#0F172A).
- Text: Slate-50.
