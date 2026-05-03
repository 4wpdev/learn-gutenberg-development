# Learn Gutenberg Development

Hands-on WordPress **Block Editor (Gutenberg)** learning materials from [**4WP.dev**](https://4wp.dev/). Code follows **WordPress Coding Standards**.

This repository is a **WordPress plugin** you can drop into `wp-content/plugins/` (or symlink) for local experiments and tutorials.

**Site:** [https://4wp.dev/](https://4wp.dev/)

## v0.1.1 — Placeholder Component

- **Install-ready ZIP** (includes compiled `build/` — no `npm install` needed): download **`learn-gutenberg-development-0.1.1.zip`** from [GitHub Releases](https://github.com/4wpdev/learn-gutenberg-development/releases), then in wp-admin go to **Plugins → Add New → Upload Plugin** and activate **Learn Gutenberg Development**.
- **SANDBOX:** try the lesson in the browser — [**SANDBOX**](https://4wp.dev/gutenberg/sandbox) *(URL will be expanded as the playground goes live; swap if you use another host).*

Build the ZIP locally (maintainers):

```bash
npm install
npm run release:zip
```

Produces `learn-gutenberg-development-0.1.1.zip` in this directory (gitignored). Attach it when publishing the GitHub release for this tag.

## Scope

- **Components segment:** [`@wordpress/components`](https://developer.wordpress.org/block-editor/reference-guides/components/) — short lessons, examples, and articles under [4wp.dev/gutenberg/components](https://4wp.dev/gutenberg/components).
- **Broader track:** the same repo grows with blocks, theme-related examples, and course-level content — not limited to components.

## Requirements

- WordPress **6.x**+ (Block Editor enabled)
- **Node.js** and **npm** (for building JavaScript)
- PHP **7.4**+ (align with your host; bump when the project standardizes on a higher minimum)

## Installation

**From a release (recommended for learners):** use the ZIP from [Releases](https://github.com/4wpdev/learn-gutenberg-development/releases) — see **v0.1.1 — Placeholder Component** above.

**From git (developers):**

1. Clone this repo into `wp-content/plugins/learn-gutenberg-development`.
2. Run `npm install` and `npm run build` in this directory (generates `build/`).
3. Activate **Learn Gutenberg Development** in the WordPress admin Plugins screen.

## Repository layout

```text
learn-gutenberg-development/
├── README.md
├── learn-gutenberg-development.php   # Main plugin file
├── package.json                      # @wordpress/scripts
├── includes/                         # PHP (category + block registration)
├── src/blocks/<slug>/                # Block sources + block.json
├── build/blocks/<slug>/              # Compiled assets (generated; gitignored)
└── scripts/build-release-zip.sh      # Maintainer: npm run release:zip
```

## Contributing & license

Maintained by [**4WP.dev**](https://4wp.dev/). License: **GPL-2.0-or-later** (aligned with WordPress).

## Links

- [**4WP.dev**](https://4wp.dev/)
- [Gutenberg components — 4WP.dev hub](https://4wp.dev/gutenberg/components)
- [Component Reference — Block Editor Handbook](https://developer.wordpress.org/block-editor/reference-guides/components/)
- [4WP.dev on LinkedIn](https://www.linkedin.com/company/4wp-dev/)
- [YouTube — @4wpdev](https://www.youtube.com/@4wpdev)
