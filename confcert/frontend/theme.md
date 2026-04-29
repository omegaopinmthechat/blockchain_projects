# Theme and Animation System

This document outlines the detailed design decisions, color palettes (for both Light and Dark modes), and animation implementations used across the frontend application.

## 1. Color Palette System

The application utilizes CSS variables (`globals.css`) mapped to custom Tailwind classes for seamless theming. The core color system is built around slate and cool gray tones, combined with dark purple/black accents to create a modern, sleek web3 aesthetic.

### Dark Theme (`:root` / Default)
The dark theme provides a deep, immersive experience. It avoids pure black to reduce eye strain, opting instead for very dark purple/blue-tinted shades.

*   **`--bg-main` (`#0B0A0F`)**: The primary background color. A very dark, almost black shade with subtle purple undertones that sets a premium, moody foundation.
*   **`--bg-card` (`#111018`)**: Used for project cards and elevated surfaces. It is slightly lighter than the main background, providing depth and separating foreground elements from the background.
*   **`--bg-input` (`rgba(15, 23, 42, 0.7)`)**: A semi-transparent dark slate used for input fields and informational banners, allowing some background bleed-through for a glass-like effect.
*   **`--bg-input-solid` (`#0f172a`)**: A solid fallback for inputs and dropdowns (`<select>`) where transparency would cause legibility issues.
*   **`--border-main` (`rgba(30, 41, 59, 0.4)`)**: A subtle, semi-transparent slate border used to outline cards, inputs, and sections without being visually overwhelming.
*   **`--text-main` (`#e2e8f0`)**: The primary text color. A light slate (off-white) that provides high contrast against the dark background while being softer on the eyes than pure white.
*   **`--text-muted` (`#94a3b8`)**: A mid-tone slate gray used for secondary text, descriptions, and tags, establishing visual hierarchy.
*   **`--purple-glow` (`rgba(139, 92, 246, 0.3)`)**: An accent color used for hover effects and borders, providing a subtle "web3" neon purple glow.
*   **`--sidebar-bg` (`#0B0A0F`)**: Matches the main background to keep the navigation cohesive.

### Light Theme (`.light`)
The light theme completely inverts the experience into a clean, crisp, and highly readable interface, utilizing light slate colors.

*   **`--bg-main` (`#f1f5f9`)**: A soft light slate gray background, providing a clean canvas that isn't blindingly white.
*   **`--bg-card` (`#f8fafc`)**: A very light, almost white shade for cards, making them pop slightly off the light gray background.
*   **`--bg-input` (`#e2e8f0`) & `--bg-input-solid` (`#e2e8f0`)**: A light slate gray for input backgrounds, giving them a distinct interactive area.
*   **`--border-main` (`rgba(203, 213, 225, 0.8)`)**: A defined, slightly transparent gray border to structure the cards and elements cleanly.
*   **`--text-main` (`#0f172a`)**: A very dark slate gray for primary text, ensuring excellent readability and contrast.
*   **`--text-muted` (`#475569`)**: A medium-dark gray for secondary text, maintaining hierarchy without losing legibility.
*   **`--purple-glow` (`rgba(139, 92, 246, 0.15)`)**: The purple accent remains but at a lower opacity to ensure it looks subtle against the bright background.
*   **`--sidebar-bg` (`#f8fafc`)**: Matches the card background for a unified light navigation structure.

---

## 2. Animation System

The application uses a combination of **Framer Motion** for complex, scroll-triggered animations and **Tailwind CSS** for responsive hover transitions.

### Scroll-Triggered Card Reveal (Framer Motion)
In `page.js`, the project cards use `framer-motion` to create a cascading reveal effect as the user scrolls down the page.

*   **How it works:**
    ```jsx
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
    ```
*   **`initial={{ opacity: 0, y: 20 }}`**: Before the card is in view, it is completely transparent and pushed down by 20 pixels.
*   **`whileInView={{ opacity: 1, y: 0 }}`**: As soon as the card enters the viewport, it animates to full opacity (`1`) and its natural vertical position (`0`).
*   **`viewport={{ once: true }}`**: Ensures the animation only plays the first time the user scrolls to it, preventing repetitive flashing if the user scrolls up and down.
*   **`transition={{ duration: 0.5, delay: X }}`**: Each card takes exactly 0.5 seconds to fade/slide in. By incrementally increasing the `delay` for each card (e.g., `0`, `0.1`, `0.2`, `0.3`, `0.4`, `0.5`, `0.6`), it creates a satisfying staggered "waterfall" effect, drawing the user's eye across the grid.

### Interactive Hover States (Tailwind CSS)
Tailwind utility classes handle micro-interactions to make the interface feel responsive and tactile.

*   **Card Hover Effects:**
    ```css
    className="... border-border-main hover:border-purple-500/50 transition-all duration-300 ..."
    ```
    *   By default, cards have the subtle `--border-main` color.
    *   On hover (`hover:border-purple-500/50`), the border smoothly transitions to a semi-transparent bright purple.
    *   `transition-all duration-300` ensures this change happens smoothly over 300 milliseconds rather than snapping instantly, providing a premium feel.

*   **Button Hover Effects:**
    ```css
    className="... bg-[#8B5CF6] hover:bg-[#7C3AED] transition-all duration-300 ..."
    ```
    *   Buttons darken slightly when hovered to indicate clickability.
    *   The 300ms transition softens the interaction.

### Global Theme Transition
In `globals.css`, the `body` tag is styled to ensure smooth theme switching:
*   **`transition: background-color 0.3s ease, color 0.3s ease;`**
    *   When the user toggles between Dark and Light mode, the entire page background and text colors crossfade smoothly over 300ms. This prevents a harsh, sudden flash of light or dark that can be jarring to the user.

### Scrollbar Customization
*   Custom webkit scrollbars are implemented in `globals.css` using yellow accents (`--yellow-100`, `--yellow-400`, `--yellow-500`) to add a unique, branded touch even in the native browser UI elements.
