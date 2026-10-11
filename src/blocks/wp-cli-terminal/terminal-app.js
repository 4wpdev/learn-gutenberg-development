/**
 * WP-CLI terminal UI — shared by editor preview and frontend view.
 */

import { findCommand } from './find-command.js';

const DEFAULT_REST =
	'/wp-json/learn-gutenberg/v1/wp-cli/commands';

function escapeHtml( text ) {
	return String( text )
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );
}

/**
 * @param {string} restUrl REST endpoint URL.
 * @return {Promise<object>}
 */
export async function fetchCommandsData( restUrl ) {
	const url = restUrl || DEFAULT_REST;
	const res = await fetch( url, {
		credentials: 'same-origin',
		headers: { Accept: 'application/json' },
	} );
	if ( ! res.ok ) {
		throw new Error( `Failed to load commands (${ res.status })` );
	}
	return res.json();
}

function scrollOutputToBottom( outputEl ) {
	if ( outputEl ) {
		outputEl.scrollTop = outputEl.scrollHeight;
	}
}

function appendLine( outputEl, className, html ) {
	const line = document.createElement( 'div' );
	line.className = `forwp-wp-cli-terminal__line ${ className }`;
	line.innerHTML = html;
	outputEl.appendChild( line );
	scrollOutputToBottom( outputEl );
}

function docHref( slug ) {
	return `/command/${ encodeURIComponent( slug || 'help' ) }`;
}

/**
 * @param {HTMLElement} root Block root.
 * @param {object}      data Commands JSON (categories + commands).
 * @param {string}      welcomeMessage
 */
export function initWpCliTerminal( root, data, welcomeMessage ) {
	if ( ! root || root.dataset.forwpCliReady === '1' ) {
		return;
	}

	const outputEl = root.querySelector( '.forwp-wp-cli-terminal__output' );
	const inputEl = root.querySelector( '.forwp-wp-cli-terminal__input' );
	const formEl = root.querySelector( '.forwp-wp-cli-terminal__form' );
	const sidebarEl = root.querySelector( '.forwp-wp-cli-terminal__sidebar-list' );

	if ( ! outputEl || ! inputEl || ! formEl || ! sidebarEl ) {
		return;
	}

	const commands = data?.commands || [];
	const categories = data?.categories || [];
	let isBusy = false;

	root.dataset.forwpCliReady = '1';
	root.classList.remove( 'forwp-wp-cli-terminal--booting' );

	appendLine(
		outputEl,
		'forwp-wp-cli-terminal__line--system',
		escapeHtml(
			welcomeMessage ||
				'WP-CLI Interactive Terminal — type "help" for available commands'
		)
	);

	// Sidebar categories
	let sidebarHtml = '';
	categories.forEach( ( cat, catIndex ) => {
		const color = cat.color || '#569cd6';
		sidebarHtml += `<details class="forwp-wp-cli-terminal__cat"${
			catIndex === 0 ? ' open' : ''
		}>`;
		sidebarHtml += `<summary class="forwp-wp-cli-terminal__cat-head" style="--forwp-cli-cat-color:${ escapeHtml(
			color
		) }">`;
		sidebarHtml += `<span class="forwp-wp-cli-terminal__cat-dot"></span>`;
		sidebarHtml += `<span class="forwp-wp-cli-terminal__cat-name">${ escapeHtml(
			cat.name || cat.id
		) }</span>`;
		sidebarHtml += `</summary>`;
		sidebarHtml += `<div class="forwp-wp-cli-terminal__cat-body">`;
		( cat.commands || [] ).forEach( ( item ) => {
			sidebarHtml += `<button type="button" class="forwp-wp-cli-terminal__cmd" data-forwp-cmd="${ escapeHtml(
				item.cmd
			) }">`;
			sidebarHtml += `<code class="forwp-wp-cli-terminal__cmd-text">${ escapeHtml(
				item.cmd
			) }</code>`;
			if ( item.desc ) {
				sidebarHtml += `<span class="forwp-wp-cli-terminal__cmd-desc">${ escapeHtml(
					item.desc
				) }</span>`;
			}
			sidebarHtml += `</button>`;
		} );
		sidebarHtml += `</div></details>`;
	} );
	sidebarEl.innerHTML = sidebarHtml;

	function runCommand( rawCommand ) {
		const cmd = String( rawCommand || '' ).trim();
		if ( ! cmd || isBusy ) {
			return;
		}

		isBusy = true;
		inputEl.disabled = true;

		appendLine(
			outputEl,
			'forwp-wp-cli-terminal__line--command',
			`<span class="forwp-wp-cli-terminal__prompt">$</span> <span class="forwp-wp-cli-terminal__cmd-echo">${ escapeHtml(
				cmd
			) }</span>`
		);

		const result = findCommand( cmd, commands );

		appendLine(
			outputEl,
			'forwp-wp-cli-terminal__line--response',
			`<pre class="forwp-wp-cli-terminal__pre">${ escapeHtml(
				result.output
			) }</pre>`
		);

		if ( result.tip ) {
			appendLine(
				outputEl,
				'forwp-wp-cli-terminal__line--tip',
				`<div class="forwp-wp-cli-terminal__tip"><strong>TIP:</strong> ${ escapeHtml(
					result.tip
				) } <a href="${ docHref(
					result.slug
				) }" class="forwp-wp-cli-terminal__doc-link">Documentation</a></div>`
			);
		}

		isBusy = false;
		inputEl.disabled = false;
		inputEl.focus();
		scrollOutputToBottom( outputEl );
	}

	formEl.addEventListener( 'submit', ( e ) => {
		e.preventDefault();
		const value = inputEl.value;
		inputEl.value = '';
		runCommand( value );
	} );

	sidebarEl.addEventListener( 'click', ( e ) => {
		const btn = e.target.closest( '[data-forwp-cmd]' );
		if ( ! btn ) {
			return;
		}
		e.preventDefault();
		const cmd = btn.getAttribute( 'data-forwp-cmd' );
		runCommand( cmd );
	} );

	inputEl.focus();
}
