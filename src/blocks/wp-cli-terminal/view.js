/**
 * Frontend: hydrate WP-CLI terminal blocks.
 * Styles load via block.json `style` (style-index.css from index.js build).
 */

import {
	fetchCommandsData,
	initWpCliTerminal,
} from './terminal-app.js';

function getRestUrl( root ) {
	try {
		const config = JSON.parse( root.dataset.forwpConfig || '{}' );
		if ( config.restUrl ) {
			return config.restUrl;
		}
	} catch {
		// ignore
	}
	if ( window.learnGutenbergWpCli?.restUrl ) {
		return window.learnGutenbergWpCli.restUrl;
	}
	return '/wp-json/learn-gutenberg/v1/wp-cli/commands';
}

function bootBlock( root ) {
	const welcome =
		root.dataset.welcome ||
		'WP-CLI Interactive Terminal — type "help" for available commands';

	fetchCommandsData( getRestUrl( root ) )
		.then( ( data ) => {
			initWpCliTerminal( root, data, welcome );
		} )
		.catch( () => {
			root.classList.remove( 'forwp-wp-cli-terminal--booting' );
			const output = root.querySelector(
				'.forwp-wp-cli-terminal__output'
			);
			if ( output ) {
				output.innerHTML =
					'<div class="forwp-wp-cli-terminal__line forwp-wp-cli-terminal__line--error">Could not load WP-CLI commands. Please refresh the page.</div>';
			}
		} );
}

function bootAll() {
	document
		.querySelectorAll( '.forwp-wp-cli-terminal' )
		.forEach( bootBlock );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', bootAll );
} else {
	bootAll();
}
