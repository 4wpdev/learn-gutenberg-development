/**
 * Shared CodeMirror 6 setup: JSX-aware JS, JSON, folding gutter, tab size 2.
 */
import {
	defaultKeymap,
	history,
	historyKeymap,
	indentWithTab,
} from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import {
	foldGutter,
	foldKeymap,
	indentOnInput,
	indentUnit,
	syntaxHighlighting,
} from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';

/** Match VS Code “sticky scroll” slack when following typing at EOF. */
export const IDE_EDITOR_NEAR_BOTTOM_SLACK_PX = 80;

/** Tab stops / indent width (spaces). */
export const IDE_TAB_DISPLAY = 2;

/**
 * Scroll only the CodeMirror scroller to EOF (no Selection scrollIntoView / page jump).
 *
 * @param {EditorView}           view
 * @param {{ current: boolean }} stickToBottomRef
 */
export function scrollIdeViewStickToBottom( view, stickToBottomRef ) {
	if ( ! stickToBottomRef?.current ) {
		return;
	}
	window.requestAnimationFrame( () => {
		const el = view.scrollDOM;
		el.scrollTop = Math.max( 0, el.scrollHeight - el.clientHeight );
	} );
}

export const ideCodeMirrorTheme = EditorView.theme(
	{
		'&': {
			height: '100%',
			maxHeight: '100%',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden',
			outline: 'none',
			backgroundColor: '#1e1e1e',
			color: '#d4d4d4',
			fontSize: '12px',
		},
		'.cm-scroller': {
			flex: '1 1 auto',
			minHeight: 0,
			overflowX: 'auto',
			overflowY: 'auto',
			overscrollBehavior: 'contain',
			touchAction: 'pan-x pan-y',
			WebkitOverflowScrolling: 'touch',
			fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
			lineHeight: '1.5',
		},
		'.cm-content': {
			padding: '12px',
			caretColor: '#d4d4d4',
		},
		'.cm-gutters': {
			backgroundColor: '#1e1e1e',
			color: '#858585',
			borderRight: '1px solid #3c3c3c',
		},
		'.cm-activeLineGutter': {
			backgroundColor: '#252526',
		},
		'.cm-activeLine': {
			backgroundColor: 'rgba(255, 255, 255, 0.05)',
		},
		'.cm-foldGutter .cm-gutterElement': {
			cursor: 'pointer',
			color: '#c5c5c5',
			padding: '0 2px',
		},
		'.cm-lineNumbers .cm-gutterElement': {
			padding: '0 6px 0 8px',
			minWidth: '2.5ch',
			textAlign: 'right',
		},
	},
	{ dark: true }
);

export function getIdeCodeMirrorLanguage( lang ) {
	if ( lang === 'json' ) {
		return json();
	}
	return javascript( { jsx: true, typescript: true } );
}

/**
 * @param {Object}             opts
 * @param {boolean}            opts.readOnly
 * @param {string}             opts.language         Source file language id (e.g. javascript, json).
 * @param {{current: boolean}} opts.stickToBottomRef Updated on scroll; used when typing.
 */
export function buildIdeCodeMirrorExtensions( {
	readOnly,
	language,
	stickToBottomRef,
} ) {
	const slack = IDE_EDITOR_NEAR_BOTTOM_SLACK_PX;
	return [
		history(),
		indentOnInput(),
		indentUnit.of( '  ' ),
		EditorState.tabSize.of( IDE_TAB_DISPLAY ),
		lineNumbers(),
		foldGutter(),
		keymap.of( [
			indentWithTab,
			...defaultKeymap,
			...historyKeymap,
			...foldKeymap,
		] ),
		getIdeCodeMirrorLanguage( language ),
		syntaxHighlighting( oneDarkHighlightStyle ),
		ideCodeMirrorTheme,
		EditorView.editable.of( ! readOnly ),
		...( readOnly
			? [
					EditorView.editorAttributes.of( { tabindex: '-1' } ),
					EditorView.contentAttributes.of( { tabindex: '-1' } ),
			  ]
			: [] ),
		EditorView.domEventHandlers( {
			scroll( _evt, view ) {
				const el = view.scrollDOM;
				stickToBottomRef.current =
					el.scrollHeight - el.scrollTop - el.clientHeight <= slack;
			},
		} ),
	];
}
