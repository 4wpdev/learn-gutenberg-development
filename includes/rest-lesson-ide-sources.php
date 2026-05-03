<?php
/**
 * REST API: Lesson IDE reads real sources from src/blocks/{block-folder}/.
 *
 * @package Learn_Gutenberg_Development
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Max bytes read per file (avoid loading huge assets).
 */
define( 'LEARN_GUTENBERG_IDE_MAX_FILE_BYTES', 524288 );

/**
 * Registers REST routes for IDE virtual files.
 */
function learn_gutenberg_development_register_ide_sources_rest() {
	register_rest_route(
		'learn-gutenberg/v1',
		'/ide-sources',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => '__return_true',
			'args'                => array(
				'block' => array(
					'required'          => true,
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
			'callback'            => 'learn_gutenberg_development_rest_get_ide_sources',
		)
	);
}
add_action( 'rest_api_init', 'learn_gutenberg_development_register_ide_sources_rest' );

/**
 * Maps block.json name -> validated filesystem path under src/blocks/.
 *
 * @param string $block_name e.g. learn-gutenberg/placeholder.
 * @return string|null Absolute path or null.
 */
function learn_gutenberg_development_ide_src_root_for_block( $block_name ) {
	if ( ! is_string( $block_name ) || '' === $block_name ) {
		return null;
	}
	if ( ! preg_match( '#^learn-gutenberg/[a-z0-9\-]+$#', $block_name ) ) {
		return null;
	}
	if ( 'learn-gutenberg/lesson-ide' === $block_name ) {
		return null;
	}

	$parts = explode( '/', $block_name, 2 );
	$slug  = $parts[1];

	$blocks_root = trailingslashit( LEARN_GUTENBERG_DEVELOPMENT_PLUGIN_DIR ) . 'src/blocks/';
	$real_root   = realpath( $blocks_root );
	if ( false === $real_root ) {
		return null;
	}

	$requested = realpath( $blocks_root . $slug );
	if ( false === $requested || 0 !== strpos( $requested, $real_root ) ) {
		return null;
	}

	$expected_json = $requested . '/block.json';
	if ( ! is_readable( $expected_json ) ) {
		return null;
	}

	$meta = json_decode( (string) file_get_contents( $expected_json ), true );
	if ( ! is_array( $meta ) || empty( $meta['name'] ) || $meta['name'] !== $block_name ) {
		return null;
	}

	return $requested;
}

/**
 * Maps file extension to Lesson IDE language id (hljs / editor).
 *
 * @param string $ext Lowercase extension without dot.
 * @return string
 */
function learn_gutenberg_development_ide_language_for_ext( $ext ) {
	$map = array(
		'js'   => 'javascript',
		'jsx'  => 'javascript',
		'mjs'  => 'javascript',
		'cjs'  => 'javascript',
		'ts'   => 'javascript',
		'tsx'  => 'javascript',
		'json' => 'json',
		'md'   => 'markdown',
		'scss' => 'scss',
		'css'  => 'css',
		'php'  => 'php',
	);
	return isset( $map[ $ext ] ) ? $map[ $ext ] : 'javascript';
}

/**
 * Directories to skip when scanning sources.
 *
 * @return string[]
 */
function learn_gutenberg_development_ide_skip_dir_names() {
	return array( 'node_modules', 'build', 'vendor', '.git', '.svn', '.hg', '__snapshots__' );
}

/**
 * Allowed source file extensions (lowercase, no dot).
 *
 * @return string[]
 */
function learn_gutenberg_development_ide_allowed_extensions() {
	return array( 'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'json', 'md', 'scss', 'css', 'php' );
}

/**
 * Builds tree + flat files array from a block directory.
 *
 * @param string $abs_root Absolute path to src/blocks/{folder}.
 * @param string $slug     Folder slug (e.g. placeholder).
 * @return array{tree: array<string, mixed>, files: array<int, array<string, string>>, breadcrumb: string, slug: string}|WP_Error
 */
function learn_gutenberg_development_scan_block_directory( $abs_root, $slug ) {
	$abs_root = realpath( $abs_root );
	if ( false === $abs_root ) {
		return new WP_Error(
			'forwp_ide_path',
			__( 'Block source path is not readable.', 'learn-gutenberg-development' ),
			array( 'status' => 500 )
		);
	}

	$skip_dirs = array_flip( learn_gutenberg_development_ide_skip_dir_names() );
	$allowed   = array_flip( learn_gutenberg_development_ide_allowed_extensions() );

	/**
	 * Recursive scanner.
	 *
	 * @param string $dir Absolute directory.
	 * @param string $rel Relative path from block root (posix).
	 * @return array{type: string, name: string, children?: array<int, mixed>}
	 */
	$scan_dir = function ( $dir, $rel ) use ( &$scan_dir, $skip_dirs, $allowed, $abs_root ) {
		$nodes      = array();
		$list       = scandir( $dir, SCANDIR_SORT_ASCENDING );
		$child_dirs = array();
		$child_files = array();

		if ( ! is_array( $list ) ) {
			return $nodes;
		}

		foreach ( $list as $name ) {
			if ( '.' === $name || '..' === $name ) {
				continue;
			}
			$path = $dir . '/' . $name;
			if ( is_dir( $path ) ) {
				if ( isset( $skip_dirs[ $name ] ) ) {
					continue;
				}
				$child_dirs[] = $name;
				continue;
			}
			if ( ! is_file( $path ) || ! is_readable( $path ) ) {
				continue;
			}
			$ext = strtolower( pathinfo( $name, PATHINFO_EXTENSION ) );
			if ( ! isset( $allowed[ $ext ] ) ) {
				continue;
			}
			$child_files[] = $name;
		}

		sort( $child_dirs, SORT_NATURAL | SORT_FLAG_CASE );
		sort( $child_files, SORT_NATURAL | SORT_FLAG_CASE );

		foreach ( $child_dirs as $name ) {
			$path        = $dir . '/' . $name;
			$child_rel   = '' === $rel ? $name : $rel . '/' . $name;
			$grandchildren = $scan_dir( $path, $child_rel );
			$nodes[]     = array(
				'type'     => 'dir',
				'name'     => $name,
				'children' => $grandchildren,
			);
		}

		foreach ( $child_files as $name ) {
			$nodes[] = array(
				'type' => 'file',
				'name' => $name,
			);
		}

		return $nodes;
	};

	$children = $scan_dir( $abs_root, '' );

	$tree = array(
		'type'     => 'dir',
		'name'     => $slug,
		'children' => $children,
	);

	$files = array();

	/**
	 * Collect file contents (relative paths use /).
	 *
	 * @param array<int, array<string, mixed>> $nodes Children nodes.
	 * @param string                           $prefix Relative prefix.
	 */
	$collect_files = function ( $nodes, $prefix ) use ( &$collect_files, &$files, $abs_root, $allowed ) {
		foreach ( $nodes as $node ) {
			if ( ! is_array( $node ) || empty( $node['type'] ) ) {
				continue;
			}
			if ( 'dir' === $node['type'] && ! empty( $node['children'] ) && ! empty( $node['name'] ) ) {
				$next_prefix = '' === $prefix ? $node['name'] : $prefix . '/' . $node['name'];
				$collect_files( $node['children'], $next_prefix );
				continue;
			}
			if ( 'file' !== $node['type'] || empty( $node['name'] ) ) {
				continue;
			}
			$rel_name = '' === $prefix ? $node['name'] : $prefix . '/' . $node['name'];
			$full = $abs_root . '/' . str_replace( '/', DIRECTORY_SEPARATOR, $rel_name );
			$real = realpath( $full );
			if ( false === $real || 0 !== strpos( $real, $abs_root ) ) {
				continue;
			}
			$ext = strtolower( pathinfo( $real, PATHINFO_EXTENSION ) );
			if ( ! isset( $allowed[ $ext ] ) ) {
				continue;
			}
			$size = filesize( $real );
			if ( false === $size || $size > LEARN_GUTENBERG_IDE_MAX_FILE_BYTES ) {
				$content = '';
			} else {
				$content = (string) file_get_contents( $real );
			}
			$files[] = array(
				'name'     => str_replace( DIRECTORY_SEPARATOR, '/', $rel_name ),
				'language' => learn_gutenberg_development_ide_language_for_ext( $ext ),
				'content'  => $content,
			);
		}
	};

	$collect_files( $children, '' );

	usort(
		$files,
		function ( $a, $b ) {
			return strnatcasecmp( $a['name'], $b['name'] );
		}
	);

	$block_json_name = '';
	$bj              = $abs_root . '/block.json';
	if ( is_readable( $bj ) ) {
		$bj_data = json_decode( (string) file_get_contents( $bj ), true );
		if ( is_array( $bj_data ) && ! empty( $bj_data['name'] ) ) {
			$block_json_name = $bj_data['name'];
		}
	}

	return array(
		'slug'       => $block_json_name ? $block_json_name : 'learn-gutenberg/' . $slug,
		'breadcrumb' => 'src › blocks › ' . $slug,
		'tree'       => $tree,
		'files'      => $files,
	);
}

/**
 * REST callback: GET ide-sources?block=learn-gutenberg/placeholder
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function learn_gutenberg_development_rest_get_ide_sources( WP_REST_Request $request ) {
	$block = $request->get_param( 'block' );
	$root  = learn_gutenberg_development_ide_src_root_for_block( $block );
	if ( null === $root ) {
		return new WP_Error(
			'forwp_ide_invalid_block',
			__( 'Unknown or unsupported block for IDE sources.', 'learn-gutenberg-development' ),
			array( 'status' => 404 )
		);
	}

	$slug = basename( $root );
	$data = learn_gutenberg_development_scan_block_directory( $root, $slug );
	if ( is_wp_error( $data ) ) {
		return $data;
	}

	return rest_ensure_response( $data );
}

/**
 * Exposes the IDE REST endpoint URL for the frontend view script (avoids brittle script-handle localize).
 */
function learn_gutenberg_development_print_ide_rest_config() {
	if ( ! has_block( 'learn-gutenberg/lesson-ide' ) ) {
		return;
	}
	$config = wp_json_encode(
		array(
			'restUrl' => esc_url_raw( rest_url( 'learn-gutenberg/v1/ide-sources' ) ),
		),
		JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
	);
	echo '<script>window.learnGutenbergIdeSources=' . $config . ';</script>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}
add_action( 'wp_footer', 'learn_gutenberg_development_print_ide_rest_config', 5 );
