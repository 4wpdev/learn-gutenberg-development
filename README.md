# Learn Gutenberg Development

Hands-on WordPress **Block Editor (Gutenberg)** learning materials from [**4WP.dev**](https://4wp.dev/). Code follows **WordPress Coding Standards**.

This repository is a **WordPress plugin** you can drop into `wp-content/plugins/` (or symlink) for local experiments and tutorials.

**Site:** [https://4wp.dev/](https://4wp.dev/)

## v0.1.2 — Button block refresh + custom SVG icons

- **Install-ready ZIP** (includes compiled `build/` — no `npm install` needed): download **`learn-gutenberg-development-0.1.2.zip`** from [GitHub Releases](https://github.com/4wpdev/learn-gutenberg-development/releases), then in wp-admin go to **Plugins → Add New → Upload Plugin** and activate **Learn Gutenberg Development**.
- **Playground #1 (main branch snapshot):** [**Open in Playground**](https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2F4wpdev%2Flearn-gutenberg-development%2Fmain%2Fplayground-blueprint.json). Blueprint: [`playground-blueprint.json`](playground-blueprint.json).
- **Playground #2 (release ZIP v0.1.2):** [**Open in Playground (v0.1.2 ZIP)**](https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2F4wpdev%2Flearn-gutenberg-development%2Fmain%2Fplayground-blueprint-release-0.1.2.json). Blueprint: [`playground-blueprint-release-0.1.2.json`](playground-blueprint-release-0.1.2.json).

Build the ZIP locally (maintainers):

```bash
npm install
npm run release:zip
```

Produces `learn-gutenberg-development-0.1.2.zip` in this directory (gitignored). Attach it when publishing the GitHub release for this tag.

**Playground notes:**

- `playground-blueprint.json` installs from the **[`main` branch archive](https://github.com/4wpdev/learn-gutenberg-development/archive/refs/heads/main.zip)**.
- `playground-blueprint-release-0.1.2.json` installs from the **release asset URL** for `v0.1.2`.
- Keep `build/` committed so Playground reflects the latest block code.

## Scope

- **Components segment:** [`@wordpress/components`](https://developer.wordpress.org/block-editor/reference-guides/components/) — short lessons, examples, and articles under [4wp.dev/gutenberg/components](https://4wp.dev/gutenberg/components).
- **Broader track:** the same repo grows with blocks, theme-related examples, and course-level content — not limited to components.
- **Lesson IDE (`learn-gutenberg/lesson-ide`):** VS Code–style shell — file tree, CodeMirror editor, and front-end view demo.

## Requirements

- WordPress **6.x**+ (Block Editor enabled)
- **Node.js** and **npm** (for building JavaScript)
- PHP **7.4**+

## Installation

**From a release (recommended for learners):** use the ZIP from [Releases](https://github.com/4wpdev/learn-gutenberg-development/releases) — see **v0.1.2** section above.

**From git (developers):**

1. Clone this repo into `wp-content/plugins/learn-gutenberg-development`.
2. Run `npm install` and `npm run build` in this directory.
3. Activate **Learn Gutenberg Development** in the WordPress admin Plugins screen.

## Repository layout

```text
learn-gutenberg-development/
├── README.md
├── learn-gutenberg-development.php
├── package.json
├── assets/
├── includes/
├── src/blocks/<slug>/
├── build/blocks/<slug>/
├── playground-blueprint.json
├── playground-blueprint-release-0.1.2.json
└── scripts/build-release-zip.sh
```

## Contributing & license

Maintained by [**4WP.dev**](https://4wp.dev/). License: **GPL-2.0-or-later**.

## Links

- [**4WP.dev**](https://4wp.dev/)
- [Gutenberg components — 4WP.dev hub](https://4wp.dev/gutenberg/components)
- [Component Reference — Block Editor Handbook](https://developer.wordpress.org/block-editor/reference-guides/components/)
- [WordPress Playground — Blueprints](https://wordpress.github.io/wordpress-playground/blueprints)
- [4WP.dev on LinkedIn](https://www.linkedin.com/company/4wp-dev/)
- [YouTube — @4wpdev](https://www.youtube.com/@4wpdev)
