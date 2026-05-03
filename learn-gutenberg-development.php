<?php
/**
 * Plugin Name:       Learn Gutenberg Development
 * Plugin URI:        https://4wp.dev/
 * Description:       Hands-on Block Editor learning materials from 4WP.dev — components segment and broader Gutenberg topics.
 * Version:           0.1.1
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            4WP.dev
 * Author URI:        https://4wp.dev/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       learn-gutenberg-development
 *
 * @package Learn_Gutenberg_Development
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'LEARN_GUTENBERG_DEVELOPMENT_VERSION', '0.1.1' );
define( 'LEARN_GUTENBERG_DEVELOPMENT_PLUGIN_FILE', __FILE__ );
define( 'LEARN_GUTENBERG_DEVELOPMENT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LEARN_GUTENBERG_DEVELOPMENT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once LEARN_GUTENBERG_DEVELOPMENT_PLUGIN_DIR . 'includes/register-block-category.php';
require_once LEARN_GUTENBERG_DEVELOPMENT_PLUGIN_DIR . 'includes/register-blocks.php';

/**
 * Loads translations and runs lightweight init tasks.
 *
 * Block category is registered in includes/register-block-category.php.
 * Block types are registered on init from includes/register-blocks.php.
 */
function learn_gutenberg_development_init() {
	load_plugin_textdomain(
		'learn-gutenberg-development',
		false,
		dirname( plugin_basename( LEARN_GUTENBERG_DEVELOPMENT_PLUGIN_FILE ) ) . '/languages'
	);
}
add_action( 'init', 'learn_gutenberg_development_init' );
