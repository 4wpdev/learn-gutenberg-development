<?php
/**
 * Register blocks from build/blocks/{component-name}/block.json
 *
 * @package Learn_Gutenberg_Development
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers every block that has a compiled block.json under build/blocks/{component-name}/
 */
function learn_gutenberg_development_register_blocks() {
	$pattern = trailingslashit( LEARN_GUTENBERG_DEVELOPMENT_PLUGIN_DIR ) . 'build/blocks/*/block.json';
	$paths   = glob( $pattern );

	if ( ! is_array( $paths ) || empty( $paths ) ) {
		return;
	}

	foreach ( $paths as $block_json_path ) {
		$block_folder = dirname( $block_json_path );
		if ( is_dir( $block_folder ) ) {
			register_block_type( $block_folder );
		}
	}
}
add_action( 'init', 'learn_gutenberg_development_register_blocks', 20 );
