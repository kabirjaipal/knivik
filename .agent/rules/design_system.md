# Rule: Premium Modern Design System & Aesthetics

Use this rule whenever you are editing, creating, or refactoring user interfaces, styling, or CSS files.

---

## 🎨 1. Core Visual Principles

Our frontend must look premium, modern, and highly engaging. A simple, basic MVP layout is unacceptable. Apply the following aesthetic tokens:

### Curated Color Palettes
**CRITICAL REQUIREMENT:** Always use the established HSL theme colors (or standard Tailwind theme colors mapped to these HSL tokens) for any styling or UI elements. Never hardcode ad-hoc custom colors or random hex codes.
*   **Dark Mode (Default Theme):**
    *   `background`: Deep slate/black (e.g., HSL `224 71% 4%`)
    *   `foreground`: Soft white/silver (e.g., HSL `210 40% 98%`)
    *   `card`: Translucent dark gray (e.g., HSL `224 71% 7%` with `backdrop-filter`)
    *   `primary`: Electric blue/indigo (e.g., HSL `263.4 70% 50.4%`) or vibrant emerald (e.g., HSL `142.1 76.2% 36.3%`)
    *   `border`: Soft charcoal (e.g., HSL `217.2 32.6% 17.5%`)

### Modern Typography & Spacing
*   **Fonts:** Always import and use premium modern Google Fonts like **Outfit**, **Plus Jakarta Sans**, or **Inter** rather than default system sans-serif.
*   **Line-height & Letter-spacing:** Use `tracking-tight` for titles and `leading-relaxed` for prose to enhance legibility.
*   **Spacing:** Maintain consistent, breathing room spacing. Use `gap-6` or `gap-8` for layouts. Avoid cramped dashboards.

---

## 🔮 2. Premium Design Effects

### Glassmorphism & Translucency
For cards, sidebars, and modals, use translucent background overlays:
```css
.glass-panel {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Gradients and Shimmer
*   **Text Gradients:** Use gradients for headings to give them a modern, "AI-first" feel.
    *   *Tailwind:* `bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent`
*   **Glow Effects:** Add soft drop-shadow radial gradients behind key interactive elements or dashboards to simulate AI energy/glowing states.

---

## ⚡ 3. Micro-Animations & Dynamic States

An interactive interface must feel alive. Use transitions on every interactive state:

*   **Transitions:** Always specify transitions explicitly (`transition-all duration-300 ease-in-out`).
*   **Interactive Scales:** Apply small scale transformations on hover (`hover:scale-[1.02] active:scale-[0.98]`).
*   **Hover Glows:** Add border glow effects on hover:
    ```css
    .hover-glow:hover {
      border-color: rgba(99, 102, 241, 0.6);
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.15);
    }
    ```

---

## 📐 4. Responsive Layout Conventions

*   **Grid & Flex:** Leverage responsive grids (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) for dashboard layouts.
*   **Mobile-First Design:** Write styles using mobile-first defaults, layering screen sizes (`sm:`, `md:`, `lg:`) to scale components naturally.
*   **Scrollbars:** Custom-style scrollbars to be thin, dark, and rounded rather than standard thick browser scrollbars.
