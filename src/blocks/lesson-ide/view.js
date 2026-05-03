/**
 * Frontend: CodeMirror (JSX-aware + folding), file tree/tabs, terminal run.
 */
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
	buildIdeCodeMirrorExtensions,
	scrollIdeViewStickToBottom,
} from './codemirror-ide.js';
import { BUILD_LINES } from './constants.js';
import { resolveIdeFileEntry } from './ide-resolve-file.js';

let lessonIdeFullscreenDelegationInstalled = false;

function syncLessonIdeFullscreenButtons() {
	document
		.querySelectorAll(
			'.wp-block-learn-gutenberg-lesson-ide.forwp-lesson-ide .forwp-lesson-ide__fullscreen'
		)
		.forEach( ( btn ) => {
			const shell = btn.closest(
				'.wp-block-learn-gutenberg-lesson-ide.forwp-lesson-ide'
			);
			const doc = document;
			const fsEl =
				doc.fullscreenElement || doc.webkitFullscreenElement || null;
			const on = shell && fsEl === shell;
			btn.setAttribute( 'aria-pressed', on ? 'true' : 'false' );
		} );
}

function installLessonIdeFullscreenDelegation() {
	if ( lessonIdeFullscreenDelegationInstalled ) {
		return;
	}
	lessonIdeFullscreenDelegationInstalled = true;

	document.body.addEventListener( 'click', ( e ) => {
		const btn = e.target.closest(
			'.wp-block-learn-gutenberg-lesson-ide.forwp-lesson-ide .forwp-lesson-ide__fullscreen'
		);
		if ( ! btn ) {
			return;
		}
		const shell = btn.closest(
			'.wp-block-learn-gutenberg-lesson-ide.forwp-lesson-ide'
		);
		if ( ! shell ) {
			return;
		}
		e.preventDefault();

		const doc = document;
		const fsEl =
			doc.fullscreenElement || doc.webkitFullscreenElement || null;

		if ( fsEl === shell ) {
			const exit =
				doc.exitFullscreen?.bind( doc ) ||
				doc.webkitExitFullscreen?.bind( doc );
			void Promise.resolve( exit?.() ).catch( () => {} );
			return;
		}

		const req =
			shell.requestFullscreen?.bind( shell ) ||
			shell.webkitRequestFullscreen?.bind( shell );
		void Promise.resolve( req?.() ).catch( () => {} );
	} );

	document.addEventListener(
		'fullscreenchange',
		syncLessonIdeFullscreenButtons
	);
	document.addEventListener(
		'webkitfullscreenchange',
		syncLessonIdeFullscreenButtons
	);
}

function clampChunk( n ) {
	const x = Number( n );
	if ( ! Number.isFinite( x ) || x < 1 ) {
		return 2;
	}
	return Math.max( 1, Math.min( 24, Math.round( x ) ) );
}

function clampMs( n ) {
	const x = Number( n );
	if ( ! Number.isFinite( x ) || x < 8 ) {
		return 42;
	}
	return Math.max( 8, Math.min( 200, Math.round( x ) ) );
}

function escapeHtml( text ) {
	const d = document.createElement( 'div' );
	d.textContent = text;
	return d.innerHTML;
}

function escapeAttr( text ) {
	return String( text )
		.replace( /&/g, '&amp;' )
		.replace( /"/g, '&quot;' )
		.replace( /</g, '&lt;' );
}

function pickDefaultActiveFileView( files, previous ) {
	if ( ! Array.isArray( files ) || files.length === 0 ) {
		return 'index.js';
	}
	if ( previous && files.some( ( f ) => f.name === previous ) ) {
		return previous;
	}
	const preferred = files.find( ( f ) => f.name === 'index.js' );
	if ( preferred ) {
		return preferred.name;
	}
	return files[ 0 ].name;
}

function renderTreeNodesHtml( nodes, parentPath, activeFile, files ) {
	if ( ! Array.isArray( nodes ) ) {
		return '';
	}
	let html = '';
	for ( const node of nodes ) {
		if ( ! node || typeof node !== 'object' || ! node.name ) {
			continue;
		}
		const isFile = node.type === 'file';
		const isDir =
			! isFile &&
			( node.type === 'dir' ||
				node.type === 'directory' ||
				node.type === 'folder' ||
				( Array.isArray( node.children ) &&
					node.children.length > 0 ) );
		const segmentPath = parentPath
			? `${ parentPath }/${ node.name }`
			: node.name;

		if ( isDir ) {
			const children = Array.isArray( node.children )
				? node.children
				: [];
			html +=
				'<li class="forwp-lesson-ide__tree-node forwp-lesson-ide__tree-node--dir">';
			html +=
				'<div class="forwp-lesson-ide__tree-row forwp-lesson-ide__tree-row--dir forwp-lesson-ide__tree-item forwp-lesson-ide__tree-item--dir" role="button" tabindex="0" aria-expanded="true">';
			html +=
				'<span class="forwp-lesson-ide__tree-chevron" aria-hidden="true">▼</span>';
			html += `<span class="forwp-lesson-ide__tree-label">${ escapeHtml(
				node.name
			) }</span>`;
			html += '</div>';
			html +=
				'<ul class="forwp-lesson-ide__tree forwp-lesson-ide__tree--nested">';
			html += renderTreeNodesHtml(
				children,
				segmentPath,
				activeFile,
				files
			);
			html += '</ul></li>';
		} else {
			const resolved = resolveIdeFileEntry( files, segmentPath );
			const active = resolved?.name === activeFile;
			html +=
				'<li class="forwp-lesson-ide__tree-node forwp-lesson-ide__tree-node--file">';
			html += `<div class="forwp-lesson-ide__tree-row forwp-lesson-ide__tree-row--file forwp-lesson-ide__tree-item forwp-lesson-ide__tree-item--file${
				active ? ' forwp-lesson-ide__tree-item--active' : ''
			}" data-forwp-file="${ escapeAttr(
				segmentPath
			) }" role="button" tabindex="0">`;
			html +=
				'<span class="forwp-lesson-ide__tree-chevron forwp-lesson-ide__tree-chevron--spacer" aria-hidden="true"></span>';
			html += `<span class="forwp-lesson-ide__tree-label">${ escapeHtml(
				node.name
			) }</span>`;
			html += '</div></li>';
		}
	}
	return html;
}

function hydrateAside( root, tree, activeFile, files ) {
	const aside = root.querySelector( '.forwp-lesson-ide__sidebar' );
	if ( ! aside || ! tree || typeof tree !== 'object' ) {
		return;
	}
	const title = escapeHtml( tree.name || '' );
	const inner = renderTreeNodesHtml(
		tree.children || [],
		'',
		activeFile,
		files
	);
	aside.innerHTML = `<div class="forwp-lesson-ide__sidebar-title">${ title }</div><ul class="forwp-lesson-ide__tree forwp-lesson-ide__tree--root">${ inner }</ul>`;
}

function hydrateTabs( root, files, activeFile ) {
	const tablist = root.querySelector( '.forwp-lesson-ide__tabs' );
	if ( ! tablist || ! Array.isArray( files ) ) {
		return;
	}
	tablist.innerHTML = files
		.map( ( f ) => {
			const on = f.name === activeFile;
			return `<button type="button" class="forwp-lesson-ide__tab${
				on ? ' forwp-lesson-ide__tab--active' : ''
			}" data-forwp-tab="${ escapeAttr(
				f.name
			) }" role="tab" aria-selected="${
				on ? 'true' : 'false'
			}">${ escapeHtml( f.name ) }</button>`;
		} )
		.join( '' );
}

/**
 * Toggle folder open/closed (matches interactive FileTree in the block editor).
 * @param {Element} dirRow `.forwp-lesson-ide__tree-row--dir`
 * @return {boolean} True if this row was a collapsible directory.
 */
function toggleTreeDirectoryRow( dirRow ) {
	const nested = dirRow.nextElementSibling;
	if (
		! nested ||
		typeof nested.matches !== 'function' ||
		! nested.matches( 'ul.forwp-lesson-ide__tree--nested' )
	) {
		return false;
	}
	const expanded = dirRow.getAttribute( 'aria-expanded' ) !== 'false';
	const nextExpanded = ! expanded;
	dirRow.setAttribute( 'aria-expanded', nextExpanded ? 'true' : 'false' );
	nested.hidden = ! nextExpanded;
	const chev = dirRow.querySelector(
		'.forwp-lesson-ide__tree-chevron:not(.forwp-lesson-ide__tree-chevron--spacer)'
	);
	if ( chev ) {
		chev.textContent = nextExpanded ? '▼' : '▶';
	}
	return true;
}

async function fetchRemoteSources( slug, restUrl ) {
	const url = `${ restUrl }?block=${ encodeURIComponent( slug ) }`;
	const res = await fetch( url, { credentials: 'same-origin' } );
	if ( ! res.ok ) {
		return null;
	}
	return res.json();
}

async function initLessonIde( root ) {
	if ( root.dataset.forwpIdeReady === '1' ) {
		return;
	}

	const raw = root.dataset.forwpConfig;
	if ( ! raw ) {
		return;
	}

	let config;
	try {
		config = JSON.parse( raw );
	} catch {
		return;
	}

	let files = Array.isArray( config.files ) ? config.files : [];
	let tree = config.tree;
	let breadcrumbBase =
		typeof config.breadcrumb === 'string' ? config.breadcrumb : 'src';

	const restUrl = window.learnGutenbergIdeSources?.restUrl;
	const slug = config.sourceBlockSlug;
	if ( slug && restUrl ) {
		try {
			const remote = await fetchRemoteSources( slug, restUrl );
			if (
				remote &&
				Array.isArray( remote.files ) &&
				remote.files.length > 0
			) {
				files = remote.files;
			}
			if ( remote && remote.tree && typeof remote.tree === 'object' ) {
				tree = remote.tree;
			}
			if (
				remote &&
				typeof remote.breadcrumb === 'string' &&
				remote.breadcrumb.length > 0
			) {
				breadcrumbBase = remote.breadcrumb;
			}
		} catch {
			/* keep embedded snapshot */
		}
	}

	if ( ! files.length ) {
		return;
	}

	const wrap = root.querySelector( '.forwp-lesson-ide__editor-wrap' );
	const breadcrumbsEl = root.querySelector(
		'.forwp-lesson-ide__breadcrumbs'
	);

	if ( ! wrap || ! breadcrumbsEl ) {
		return;
	}

	while ( wrap.firstChild ) {
		wrap.removeChild( wrap.firstChild );
	}
	const host = document.createElement( 'div' );
	host.className = 'forwp-lesson-ide__codemirror-wrap';
	wrap.appendChild( host );

	const terminalEl = root.querySelector( '.forwp-lesson-ide__terminal-body' );

	root.dataset.forwpIdeReady = '1';

	let activeFile = pickDefaultActiveFileView(
		files,
		typeof config.activeFile === 'string' ? config.activeFile : ''
	);

	hydrateAside( root, tree, activeFile, files );
	hydrateTabs( root, files, activeFile );

	let typingTimer = null;
	let buildTimer = null;

	const chunk = clampChunk( config.typingChunkChars );
	const ms = clampMs( config.typingIntervalMs );

	let cmView = null;
	let cmLang = '';
	const stickToBottomRef = { current: true };

	function ensureCm( lang ) {
		const L = lang || 'javascript';
		if ( cmView && cmLang === L ) {
			return;
		}
		if ( cmView ) {
			cmView.destroy();
			cmView = null;
		}
		cmLang = L;
		cmView = new EditorView( {
			parent: host,
			state: EditorState.create( {
				doc: '',
				extensions: buildIdeCodeMirrorExtensions( {
					readOnly: true,
					language: cmLang,
					stickToBottomRef,
				} ),
			} ),
		} );
	}

	function fileMeta( name ) {
		return resolveIdeFileEntry( files, name );
	}

	function syncTabStyles() {
		root.querySelectorAll( '[data-forwp-tab]' ).forEach( ( btn ) => {
			const tabName = btn.getAttribute( 'data-forwp-tab' );
			const on = tabName === activeFile;
			btn.classList.toggle( 'forwp-lesson-ide__tab--active', on );
			btn.setAttribute( 'aria-selected', on ? 'true' : 'false' );
		} );
	}

	function syncTreeStyles() {
		root.querySelectorAll( '[data-forwp-file]' ).forEach( ( row ) => {
			const seg = row.getAttribute( 'data-forwp-file' ) || '';
			const resolved = resolveIdeFileEntry( files, seg );
			const on = resolved?.name === activeFile;
			row.classList.toggle( 'forwp-lesson-ide__tree-item--active', on );
		} );
	}

	function syncBreadcrumb() {
		breadcrumbsEl.textContent = `${ breadcrumbBase } › ${ activeFile }`;
	}

	function stopTyping() {
		if ( typingTimer ) {
			clearInterval( typingTimer );
			typingTimer = null;
		}
	}

	function startTyping() {
		stopTyping();
		stickToBottomRef.current = true;

		const meta = fileMeta( activeFile );
		const target = meta?.content || '';

		ensureCm( meta?.language || 'javascript' );

		syncTabStyles();
		syncTreeStyles();
		syncBreadcrumb();

		cmView.dispatch( {
			changes: {
				from: 0,
				to: cmView.state.doc.length,
				insert: '',
			},
		} );

		if ( target.length === 0 ) {
			return;
		}

		let i = 0;
		typingTimer = setInterval( () => {
			i += chunk;
			const slice = target.slice( 0, Math.min( i, target.length ) );
			cmView.dispatch( {
				changes: {
					from: 0,
					to: cmView.state.doc.length,
					insert: slice,
				},
			} );
			scrollIdeViewStickToBottom( cmView, stickToBottomRef );
			if ( i >= target.length ) {
				stopTyping();
				scrollIdeViewStickToBottom( cmView, stickToBottomRef );
			}
		}, ms );
	}

	function runBuild() {
		if ( buildTimer ) {
			clearInterval( buildTimer );
			buildTimer = null;
		}
		if ( ! terminalEl ) {
			return;
		}
		let i = 0;
		terminalEl.textContent = '';
		buildTimer = setInterval( () => {
			if ( i >= BUILD_LINES.length ) {
				clearInterval( buildTimer );
				buildTimer = null;
				return;
			}
			const line = BUILD_LINES[ i ];
			i += 1;
			terminalEl.textContent = terminalEl.textContent
				? `${ terminalEl.textContent }\n${ line }`
				: line;
			terminalEl.scrollTop = terminalEl.scrollHeight;
		}, 320 );
	}

	root.addEventListener( 'click', ( e ) => {
		const dirRow = e.target.closest( '.forwp-lesson-ide__tree-row--dir' );
		if ( dirRow && toggleTreeDirectoryRow( dirRow ) ) {
			return;
		}

		const tab = e.target.closest( '[data-forwp-tab]' );
		if ( tab ) {
			const tabKey = tab.getAttribute( 'data-forwp-tab' );
			const canon = resolveIdeFileEntry( files, tabKey || '' )?.name;
			if ( canon && canon !== activeFile ) {
				activeFile = canon;
				startTyping();
			}
			return;
		}

		const row = e.target.closest( '[data-forwp-file]' );
		if ( row ) {
			const seg = row.getAttribute( 'data-forwp-file' ) || '';
			const canon = resolveIdeFileEntry( files, seg )?.name;
			if ( canon && canon !== activeFile ) {
				activeFile = canon;
				startTyping();
			}
			return;
		}

		if ( e.target.closest( '.forwp-lesson-ide__terminal-run' ) ) {
			runBuild();
		}
	} );

	root.addEventListener( 'keydown', ( e ) => {
		if ( e.key !== 'Enter' && e.key !== ' ' ) {
			return;
		}
		const dirRow = e.target.closest( '.forwp-lesson-ide__tree-row--dir' );
		if ( dirRow && toggleTreeDirectoryRow( dirRow ) ) {
			e.preventDefault();
			return;
		}
		const fileRow = e.target.closest( '[data-forwp-file]' );
		if ( fileRow ) {
			const seg = fileRow.getAttribute( 'data-forwp-file' ) || '';
			const canon = resolveIdeFileEntry( files, seg )?.name;
			if ( canon && canon !== activeFile ) {
				activeFile = canon;
				startTyping();
			}
			e.preventDefault();
		}
	} );

	startTyping();
}

export function bootLessonIdeView() {
	installLessonIdeFullscreenDelegation();
	document
		.querySelectorAll( '.wp-block-learn-gutenberg-lesson-ide' )
		.forEach( ( root ) => {
			root.classList.add( 'forwp-lesson-ide--booting' );
			void initLessonIde( root ).finally( () => {
				root.classList.remove( 'forwp-lesson-ide--booting' );
			} );
		} );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', bootLessonIdeView );
} else {
	bootLessonIdeView();
}
