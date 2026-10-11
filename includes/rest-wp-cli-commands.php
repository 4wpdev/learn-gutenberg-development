<?php
/**
 * REST API: WP-CLI terminal command data (JSON).
 *
 * @package Learn_Gutenberg_Development
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers REST route for WP-CLI commands JSON.
 */
function learn_gutenberg_development_register_wp_cli_rest() {
	register_rest_route(
		'learn-gutenberg/v1',
		'/wp-cli/commands',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => '__return_true',
			'callback'            => 'learn_gutenberg_development_rest_get_wp_cli_commands',
		)
	);
}
add_action( 'rest_api_init', 'learn_gutenberg_development_register_wp_cli_rest' );

/**
 * Returns decoded wp-cli-commands.json.
 *
 * @return WP_REST_Response|WP_Error
 */
function learn_gutenberg_development_rest_get_wp_cli_commands() {
	$path = trailingslashit( LEARN_GUTENBERG_DEVELOPMENT_PLUGIN_DIR ) . 'assets/data/wp-cli-commands.json';

	if ( ! is_readable( $path ) ) {
		return new WP_Error(
			'learn_gutenberg_wp_cli_missing',
			__( 'WP-CLI commands data file not found.', 'learn-gutenberg-development' ),
			array( 'status' => 404 )
		);
	}

	$raw  = file_get_contents( $path );
	$data = json_decode( $raw, true );

	if ( ! is_array( $data ) ) {
		return new WP_Error(
			'learn_gutenberg_wp_cli_invalid',
			__( 'WP-CLI commands data is invalid JSON.', 'learn-gutenberg-development' ),
			array( 'status' => 500 )
		);
	}

	return rest_ensure_response( $data );
}

/**
 * Exposes REST URL to the WP-CLI terminal view script.
 */
function learn_gutenberg_development_enqueue_wp_cli_terminal_config() {
	if ( ! has_block( 'learn-gutenberg/wp-cli-terminal' ) ) {
		return;
	}

	wp_localize_script(
		'learn-gutenberg-wp-cli-terminal-view-script',
		'learnGutenbergWpCli',
		array(
			'restUrl' => rest_url( 'learn-gutenberg/v1/wp-cli/commands' ),
		)
	);
}
add_action( 'wp_enqueue_scripts', 'learn_gutenberg_development_enqueue_wp_cli_terminal_config', 20 );
