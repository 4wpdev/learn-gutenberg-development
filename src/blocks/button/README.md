# Button — learning block

## What this is

This is a learning block in the **Learn Gutenberg Development** plugin (4WP.dev):
a practical `@wordpress/components` **Button** example with toolbar icon 
controls and block styles.

## Which block

- **Name:** `learn-gutenberg/button`
- **Role:** a real-world component lesson;
  editable label, style variants, icon choice, icon position, and legacy markup migration.

## What we cover

- `Button` from `@wordpress/components` in `edit`
- `RichText` for inline label editing
- `BlockControls` + `ToolbarGroup` + `Dropdown` for icon selection
- Custom brand icons as `SVG` / `Path` from `@wordpress/primitives` 
in `icons-map.js` (same paths as the SVG sources; Gutenberg toolbars 
need React icon elements, not raw `.svg` imports)
- `useBlockProps` on the actual button element for color/border/radius supports
- Deprecated save versions for backward compatibility (`deprecated` + `migrate`)

Open nearby files (`index.js`, `icons-map.js`, `block.json`, styles, tests)
in the **Lesson IDE** block to inspect the same structure and syntax highlighting.

## Screenshot

Button block with icon picker and style controls in the editor:

![Button block in the block editor](../../../assets/blocks/button/button.png)
