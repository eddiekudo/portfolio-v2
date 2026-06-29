# AGENT.md

## Project Context

You are working on a portfolio website.

This is a modern 3D portfolio focused on:

* Scroll-driven experiences
* High quality UI/UX
* Interactive 3D sections
* Smooth animations
* Responsive layouts
* Performance-focused rendering

Tech Stack:

* Next.js App Router
* Tailwind CSS v4
* Three.js
* GSAP

---

# Rule 1: Always Use Project Skills

Before generating code, editing files, creating components, animations, layouts, or interactions:

Scan the project directory for available skills and use relevant ones.

Current project skills:

* 3d-web-experience
* gsap
* nextjs-app-router-patterns
* tailwind-4-docs
* tailwindcss-advanced-layouts
* threejs-animation
* ui-ux-pro-max
* web-design-guidelines

Rules:

* Use relevant skills before implementation
* Do not ignore applicable skills
* Multiple skills may be combined
* Skills override generic assumptions

---

# Rule 2: Always Use Design.md For Visual Decisions

For anything related to:

* Layout
* Components
* UI
* Colors
* Typography
* Animations
* Interactions
* Spacing
* Visual hierarchy
* Motion

Read and follow:

Design.md

Rules:

* Maintain visual consistency
* Follow existing design language
* Avoid introducing conflicting styles
* Use Design.md as the design source of truth

---

# Working Principles

Prefer:

* Production-ready code
* Responsive-first development
* Maintainable structure
* Smooth but controlled animations

Avoid:

* Overengineering
* Unnecessary dependencies
* Animation clutter
* Heavy rendering costs
* Automatically committing git changes (always leave changes in the working directory for manual review)

---

# 3D + Animation Rules

When using Three.js or GSAP:

* Prioritize smoothness over complexity
* Keep animations intentional
* Optimize rendering performance
* Respect mobile limitations
* Handle resize properly
* Avoid excessive scroll animation
* Maintain stable camera behavior

---


# Output Rule

Before implementation, briefly state:

Using:
[skills used]
[Design.md if applicable]

Example:

Using:

* threejs-animation
* gsap
* ui-ux-pro-max
* Design.md

Then proceed with implementation.
