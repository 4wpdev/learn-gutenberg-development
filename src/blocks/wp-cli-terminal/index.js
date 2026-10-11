/**
 * WP-CLI Terminal block — editor registration + live preview.
 */

import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import metadata from './block.json';
import {
	fetchCommandsData,
	initWpCliTerminal,
} from './terminal-app.js';
import './style.scss';
import './editor.scss';

const REST_PATH = '/learn-gutenberg/v1/wp-cli/commands';

function getTerminalShellMarkup( welcomeMessage, restUrl ) {
	const config = JSON.stringify( { restUrl } );
	const welcome = welcomeMessage || metadata.attributes.welcomeMessage.default;

	return (
		<div
			className="forwp-wp-cli-terminal forwp-wp-cli-terminal--booting"
			data-forwp-config={ config }
			data-welcome={ welcome }
		>
			<div className="forwp-wp-cli-terminal__shell">
				<div className="forwp-wp-cli-terminal__header">
					<span className="forwp-wp-cli-terminal__dot forwp-wp-cli-terminal__dot--red" />
					<span className="forwp-wp-cli-terminal__dot forwp-wp-cli-terminal__dot--yellow" />
					<span className="forwp-wp-cli-terminal__dot forwp-wp-cli-terminal__dot--green" />
					<span className="forwp-wp-cli-terminal__title">
						wp-cli — bash
					</span>
				</div>
				<div className="forwp-wp-cli-terminal__body">
					<div className="forwp-wp-cli-terminal__main">
						<div
							className="forwp-wp-cli-terminal__output"
							aria-live="polite"
						/>
						<form className="forwp-wp-cli-terminal__form">
							<label className="forwp-wp-cli-terminal__input-row">
								<span className="forwp-wp-cli-terminal__prompt">
									$
								</span>
								<input
									type="text"
									className="forwp-wp-cli-terminal__input"
									spellCheck="false"
									autoComplete="off"
									autoCorrect="off"
									autoCapitalize="off"
									aria-label={ __(
										'WP-CLI command',
										'learn-gutenberg-development'
									) }
								/>
							</label>
						</form>
					</div>
					<aside className="forwp-wp-cli-terminal__sidebar">
						<h3 className="forwp-wp-cli-terminal__sidebar-title">
							{ __(
								'Command Categories',
								'learn-gutenberg-development'
							) }
						</h3>
						<div className="forwp-wp-cli-terminal__sidebar-list" />
					</aside>
				</div>
			</div>
		</div>
	);
}

function Edit( { attributes, setAttributes } ) {
	const { welcomeMessage } = attributes;
	const terminalRef = useRef( null );
	const blockProps = useBlockProps( {
		className: 'forwp-wp-cli-terminal-block',
	} );

	useEffect( () => {
		const root = terminalRef.current;
		if ( ! root ) {
			return;
		}

		root.dataset.forwpCliReady = '';
		root.classList.add( 'forwp-wp-cli-terminal--booting' );
		const output = root.querySelector( '.forwp-wp-cli-terminal__output' );
		const sidebar = root.querySelector(
			'.forwp-wp-cli-terminal__sidebar-list'
		);
		if ( output ) {
			output.innerHTML = '';
		}
		if ( sidebar ) {
			sidebar.innerHTML = '';
		}

		const restUrl =
			window.wpApiSettings?.root != null
				? `${ window.wpApiSettings.root }${ REST_PATH.replace( /^\//, '' ) }`
				: `/wp-json${ REST_PATH }`;

		const load = apiFetch
			? apiFetch( { path: REST_PATH } ).catch( () =>
					fetchCommandsData( restUrl )
			  )
			: fetchCommandsData( restUrl );

		load
			.then( ( data ) => {
				initWpCliTerminal( root, data, welcomeMessage );
			} )
			.catch( () => {
				root.classList.remove( 'forwp-wp-cli-terminal--booting' );
			} );
	}, [ welcomeMessage ] );

	const restUrl =
		typeof window !== 'undefined' && window.wpApiSettings?.root
			? `${ window.wpApiSettings.root }${ REST_PATH.replace( /^\//, '' ) }`
			: `/wp-json${ REST_PATH }`;

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __(
						'Terminal settings',
						'learn-gutenberg-development'
					) }
				>
					<TextControl
						label={ __(
							'Welcome message',
							'learn-gutenberg-development'
						) }
						value={ welcomeMessage }
						onChange={ ( value ) =>
							setAttributes( { welcomeMessage: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div ref={ terminalRef }>
					{ getTerminalShellMarkup( welcomeMessage, restUrl ) }
				</div>
			</div>
		</>
	);
}

function save( { attributes } ) {
	const { welcomeMessage } = attributes;
	const restUrl = `/wp-json${ REST_PATH }`;
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			{ getTerminalShellMarkup( welcomeMessage, restUrl ) }
		</div>
	);
}

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	save,
} );
