# Domain Glossary (CONTEXT.md)

This file documents the core concepts and design seams in the portfolio codebase.

## Concepts

### HeroParallaxEngine
The module responsible for binding scroll offsets and mouse/pointer movement to animate the homepage hero sections. It orchestrates coordinate physics, updates the Three.js laptop model emerge/portal state, and directly manipulates the positioning of the background, foreground, and occluder image layers.
* **Interface**: `createEddieLaptopScene(options: CreateEddieLaptopSceneOptions)`
* **Seam**: Between the React layout (`Hero.tsx`) and vanilla WebGL/DOM styling loops.

### SpiralShowcaseEngine
A WebGL-based Cylindrical Helix (spiral) project presentation module. It handles 3D card geometry instantiations, texture loaders, custom shader materials, gesture-driven drag calculations, and window resizing, translating scroll progress into orbital positions.
* **Interface**: `SpiralShowcaseEngine` class
* **Seam**: Between the scroll-pinned section component (`SpiralShowcase.tsx`) and the Three.js scene graph.

### CursorInteractionManager
A declarative hover-state seam that maps pointer targets to the custom custom cursor's text annotation (such as "view", "open", "home", or "click").
* **Interface**: `data-cursor` HTML attributes read globally via delegated pointer listeners.
* **Seam**: Between interactive DOM elements and the cursor renderer bubble (`Cursor.tsx`).
