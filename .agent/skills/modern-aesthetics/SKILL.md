---
name: modern-aesthetics
description: Ensures any created or edited UI component meets elite modern visual aesthetics, glassmorphism, responsive grids, and micro-animations. Use this skill when the user requests to create landing pages, dashboards, settings pages, forms, or any client-side frontend feature.
version: 1.0.0
author: Antigravity Team
tags:
  - frontend
  - tailwind
  - ui
  - animations
  - glassmorphism
---

# Skill: Elite Modern Aesthetics & Styling Playbook

This skill equips the agent with direct playbooks, patterns, and CSS recipes to construct beautiful, immersive, high-end interfaces that "wow" the user.

---

## 🚀 When to Activate

Trigger this skill automatically whenever you are:
1. Creating a new React/Next.js page or component.
2. Styling forms, tables, card grids, modals, or sidebars.
3. Enhancing user feedback loops (loading state skeletons, hover behaviors, click response effects).

---

## 🎨 Immersive Color Schemes

Our theme is **Midnight Premium** (deep, neon-accented dark mode). Avoid flat whites or basic grays. Use these exact background/foreground combos:

| Tier | Background | Border | Primary Use |
| :--- | :--- | :--- | :--- |
| **Workspace Base** | `bg-[#030712]` (Slate-950) | *None* | Core body background |
| **Glass Card** | `bg-white/[0.03] backdrop-blur-md` | `border-white/[0.08]` | Lead listings, feature blocks |
| **Hover Card** | `bg-white/[0.06] backdrop-blur-md` | `border-indigo-500/20` | Cards ready for user interaction |
| **Sidebar / Nav** | `bg-[#090d16]/80 backdrop-blur-xl` | `border-white/[0.05]` | Navigation containers |

---

## 💎 Dynamic Styling Patterns

### 1. The Ultra-Premium Glow Card
Use this structure for dashboards, features, or lead listings:
```tsx
import React from 'react';

export const PremiumCard = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="relative group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:scale-[1.01]">
      {/* Background radial highlight */}
      <div className="absolute -inset-px bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
      
      <div className="relative z-10">
        <h3 className="text-lg font-semibold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
          {title}
        </h3>
        <div className="mt-4 text-slate-400 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
```

### 2. High-Tech Shimmer Buttons
Never use basic button styles. Add a sleek, interactive state:
```tsx
export const ShimmerButton = ({ text, onClick }: { text: string; onClick?: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95"
    >
      <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {text}
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
      </span>
    </button>
  );
};
```

---

## ⚡ Interactive Feedback Loop Checklist

Whenever you implement UI logic, check these three states:
- [ ] **Interactive Hover:** Add light border shifts and subtle translations (scale 1.01).
- [ ] **Active Click:** Drop element scaling to 0.97 for physical tactile feedback.
- [ ] **Smooth Transition:** Always use `transition-all duration-200 ease-out` on buttons, inputs, and list items.
- [ ] **Loading skeletons:** Rather than displaying a basic "Loading..." string, write a beautiful animated skeleton loading card.
