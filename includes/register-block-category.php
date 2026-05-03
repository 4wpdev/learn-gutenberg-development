<?php
/**
 * Registers the custom block category for 4WP.dev Gutenberg component lessons.
 *
 * @package Learn_Gutenberg_Development
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Prepends the plugin block category so it appears first in the inserter.
 *
 * @param array                         $categories       Registered block categories.
 * @param \WP_Block_Editor_Context|null $editor_context Current editor context (unused; reserved for future filters).
 * @return array Modified categories list.
 */
function learn_gutenberg_development_register_block_categories( $categories, $editor_context ) {
	return array_merge(
		array(
			array(
				'slug'  => 'forwp-gutenberg-components',
				'title' => __( '4WP.dev Gutenberg Components', 'learn-gutenberg-development' ),
				'icon'  => 'layout',
			),
		),
		$categories
	);
}
add_filter( 'block_categories_all', 'learn_gutenberg_development_register_block_categories', 10, 2 );
