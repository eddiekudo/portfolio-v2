# Aditya Rawat — Modern 3D Portfolio

A premium, modern 3D portfolio website focused on scroll-driven interactive experiences, high-fidelity UI/UX, and optimal performance.

## 🚀 Technology Stack

* **Core:** [Next.js 16](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
* **Animations:** [GSAP (GreenSock)](https://gsap.com/) (ScrollTrigger, Custom Ease)
* **3D Rendering:** [Three.js](https://threejs.org/) (WebGL2 interactive projects spiral)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (PostCSS-first compilation, CSS variables configuration)

## 📦 Key Features

* **3D Projects Spiral:** An interactive, mouse-controlled, scroll-driven Three.js spiral showcasing featured projects with smooth parallax card depth.
* **Eddie Parallax Hero:** A high-performance, immersive hero scene combining dynamic layered parallax images with a fully 3D interactive Macbook model that hinges open and closed on scroll.
* **Custom Kinetic Cursor:** A responsive custom cursor that interacts with links, buttons, and media elements across the site.
* **Aesthetic Preloader:** Custom numerical preloader matching the sleek, stark laboratory theme of the design.
* **Fully Responsive:** Robust mobile-first layouts with smooth drawer menus and fallback states for WebGL-disabled devices.
* **Optimized Assets:** High-performance WebP assets compressed from unoptimized media to keep initial bundle and load weights below ~1.5 MB.

## 🛠️ Development

First, install dependencies:

```bash
npm install
```

Then, run the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the portfolio.

## 🏗️ Production Build

To compile a highly optimized production bundle:

```bash
npm run build
```

The build output will be compiled into the `.next` directory, ready to deploy to Vercel, Netlify, or any other hosting provider.
