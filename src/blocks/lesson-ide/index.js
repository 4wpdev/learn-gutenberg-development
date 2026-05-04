import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import {
	Notice,
	PanelBody,
	RangeControl,
	SelectControl,
	Spinner,
} from '@wordpress/components';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import CodeMirror from '@uiw/react-codemirror';
import metadata from './block.json';
import {
	buildIdeCodeMirrorExtensions,
	scrollIdeViewStickToBottom,
} from './codemirror-ide.js';
import { BUILD_LINES, DEFAULT_FILES, DEFAULT_TREE } from './constants.js';
import { resolveIdeFileEntry } from './ide-resolve-file.js';
import {
	canSelectIdeBlockSlug,
	formatIdeBlockCatalogOptions,
} from './plugin-block-demos.js';
import './style.scss';
import './editor.scss';

const TYPING_CHUNK_DEFAULT = metadata.attributes.typingChunkChars?.default ?? 2;
const TYPING_MS_DEFAULT = metadata.attributes.typingIntervalMs?.default ?? 42;

function resolveTypingChunkChars( value ) {
	const n = Number( value );
	if ( ! Number.isFinite( n ) || n < 1 ) {
		return TYPING_CHUNK_DEFAULT;
	}
	return Math.max( 1, Math.min( 24, Math.round( n ) ) );
}

function resolveTypingIntervalMs( value ) {
	const n = Number( value );
	if ( ! Number.isFinite( n ) || n < 8 ) {
		return TYPING_MS_DEFAULT;
	}
	return Math.max( 8, Math.min( 200, Math.round( n ) ) );
}

function normalizeStructureTree( raw ) {
	if ( raw === null || typeof raw !== 'object' || Array.isArray( raw ) ) {
		return DEFAULT_TREE;
	}
	const children = Array.isArray( raw.children ) ? raw.children : [];
	const name =
		typeof raw.name === 'string' && raw.name.length > 0
			? raw.name
			: DEFAULT_TREE.name;
	return {
		...raw,
		type: raw.type || 'dir',
		name,
		children,
	};
}

function resolveTree( structureJson, fetchedTree, structureUrl ) {
	const trimmed = structureJson?.trim?.() ?? '';
	let candidate = null;
	if ( trimmed ) {
		try {
			candidate = JSON.parse( trimmed );
		} catch {
			candidate = null;
		}
	}
	if (
		candidate === null &&
		structureUrl &&
		fetchedTree !== undefined &&
		fetchedTree !== null
	) {
		candidate = fetchedTree;
	}
	if ( candidate === null ) {
		return DEFAULT_TREE;
	}
	return normalizeStructureTree( candidate );
}

function resolveDisplayedTree( attributes, fetchedTree ) {
	return resolveTree(
		attributes.structureJson,
		fetchedTree,
		attributes.structureUrl?.trim()
	);
}

function pickDefaultActiveFile( files, previous ) {
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

async function fetchIdeSourcesFromServer( blockSlug ) {
	return apiFetch( {
		path: `/learn-gutenberg/v1/ide-sources?block=${ encodeURIComponent(
			blockSlug
		) }`,
	} );
}

function normalizeFiles( files ) {
	return Array.isArray( files ) && files.length > 0 ? files : DEFAULT_FILES;
}

/**
 * Recognises dir vs file from JSON (`dir`, `folder`, `directory`, or implicit `children`).
 * @param {Object} node Tree node from JSON.
 */
function nodeKind( node ) {
	if ( ! node || typeof node !== 'object' ) {
		return 'unknown';
	}
	const t = String( node.type || '' ).toLowerCase();
	if ( t === 'file' ) {
		return 'file';
	}
	if ( t === 'dir' || t === 'directory' || t === 'folder' ) {
		return 'dir';
	}
	if ( Array.isArray( node.children ) ) {
		return 'dir';
	}
	return 'file';
}

function collectDirPathsFromTree( tree ) {
	const paths = [];
	function walk( node, parentPath ) {
		if ( nodeKind( node ) !== 'dir' ) {
			return;
		}
		const segmentPath = parentPath
			? `${ parentPath }/${ node.name }`
			: node.name;
		paths.push( segmentPath );
		for ( const ch of node.children || [] ) {
			if ( ch !== undefined && ch !== null && typeof ch === 'object' ) {
				walk( ch, segmentPath );
			}
		}
	}
	for ( const ch of tree.children || [] ) {
		if ( ch !== undefined && ch !== null && typeof ch === 'object' ) {
			walk( ch, '' );
		}
	}
	return paths;
}

function TreeBranch( {
	node,
	parentPath,
	activeFile,
	files,
	onPickFile,
	expandedDirs,
	toggleDir,
	forceExpanded,
} ) {
	if ( node === undefined || node === null || typeof node !== 'object' ) {
		return null;
	}

	const kind = nodeKind( node );
	const segmentPath = parentPath
		? `${ parentPath }/${ node.name }`
		: node.name;

	if ( kind === 'file' ) {
		const resolved = resolveIdeFileEntry( files, segmentPath );
		const active = resolved?.name === activeFile;
		const clickable = typeof onPickFile === 'function';
		const activate = () => {
			if ( clickable && resolved?.name ) {
				onPickFile( resolved.name );
			}
		};
		const onKeyDownFile = ( e ) => {
			if ( e.key !== 'Enter' && e.key !== ' ' ) {
				return;
			}
			e.preventDefault();
			if ( clickable && resolved?.name ) {
				onPickFile( resolved.name );
			} else {
				e.currentTarget.click();
			}
		};
		return (
			<li className="forwp-lesson-ide__tree-node forwp-lesson-ide__tree-node--file">
				<div
					className={
						'forwp-lesson-ide__tree-row forwp-lesson-ide__tree-row--file forwp-lesson-ide__tree-item forwp-lesson-ide__tree-item--file' +
						( active ? ' forwp-lesson-ide__tree-item--active' : '' )
					}
					data-forwp-file={ segmentPath }
					onClick={ clickable ? activate : undefined }
					onKeyDown={ onKeyDownFile }
					role="button"
					tabIndex={ 0 }
				>
					<span
						className="forwp-lesson-ide__tree-chevron forwp-lesson-ide__tree-chevron--spacer"
						aria-hidden
					/>
					<span className="forwp-lesson-ide__tree-label">
						{ node.name }
					</span>
				</div>
			</li>
		);
	}

	const children = ( node.children || [] ).filter(
		( child ) =>
			child !== undefined && child !== null && typeof child === 'object'
	);
	const hasKids = children.length > 0;
	const isOpen =
		forceExpanded || ( hasKids && expandedDirs.has( segmentPath ) );

	const onToggleDir = () => {
		if ( forceExpanded || ! hasKids ) {
			return;
		}
		toggleDir( segmentPath );
	};

	let chevronGlyph = '·';
	if ( hasKids ) {
		chevronGlyph = isOpen ? '▼' : '▶';
	}

	return (
		<li className="forwp-lesson-ide__tree-node forwp-lesson-ide__tree-node--dir">
			<div
				className="forwp-lesson-ide__tree-row forwp-lesson-ide__tree-row--dir forwp-lesson-ide__tree-item forwp-lesson-ide__tree-item--dir"
				role={ hasKids ? 'button' : undefined }
				tabIndex={ hasKids ? 0 : undefined }
				aria-expanded={ hasKids ? isOpen : undefined }
				onClick={ onToggleDir }
				onKeyDown={
					hasKids
						? ( e ) => {
								if ( e.key === 'Enter' || e.key === ' ' ) {
									e.preventDefault();
									onToggleDir();
								}
						  }
						: undefined
				}
			>
				<span className="forwp-lesson-ide__tree-chevron" aria-hidden>
					{ chevronGlyph }
				</span>
				<span className="forwp-lesson-ide__tree-label">
					{ node.name }
				</span>
			</div>
			{ hasKids && isOpen && (
				<ul className="forwp-lesson-ide__tree forwp-lesson-ide__tree--nested">
					{ children.map( ( child, i ) => (
						<TreeBranch
							key={ `${ segmentPath }/${ child.name }-${ i }` }
							node={ child }
							parentPath={ segmentPath }
							activeFile={ activeFile }
							files={ files }
							onPickFile={ onPickFile }
							expandedDirs={ expandedDirs }
							toggleDir={ toggleDir }
							forceExpanded={ forceExpanded }
						/>
					) ) }
				</ul>
			) }
		</li>
	);
}

function FileTree( { tree, activeFile, files, onPickFile, forceExpanded } ) {
	const [ expandedDirs, setExpandedDirs ] = useState(
		() => new Set( collectDirPathsFromTree( tree ) )
	);

	useEffect( () => {
		setExpandedDirs( new Set( collectDirPathsFromTree( tree ) ) );
	}, [ tree ] );

	const toggleDir = useCallback(
		( path ) => {
			if ( forceExpanded ) {
				return;
			}
			setExpandedDirs( ( prev ) => {
				const next = new Set( prev );
				if ( next.has( path ) ) {
					next.delete( path );
				} else {
					next.add( path );
				}
				return next;
			} );
		},
		[ forceExpanded ]
	);

	return (
		<>
			<div className="forwp-lesson-ide__sidebar-title">{ tree.name }</div>
			<ul className="forwp-lesson-ide__tree forwp-lesson-ide__tree--root">
				{ Array.isArray( tree.children ) &&
					tree.children
						.filter(
							( child ) =>
								child !== undefined &&
								child !== null &&
								typeof child === 'object'
						)
						.map( ( child, i ) => (
							<TreeBranch
								key={ `${ tree.name }-${
									child?.name ?? i
								}-${ i }` }
								node={ child }
								parentPath=""
								activeFile={ activeFile }
								files={ files }
								onPickFile={ onPickFile }
								expandedDirs={ expandedDirs }
								toggleDir={ toggleDir }
								forceExpanded={ forceExpanded }
							/>
						) ) }
			</ul>
		</>
	);
}

/** Used by FileTreeStatic so folders render expanded without React state (safe inside `save()`). */
const FILE_TREE_NOOP_TOGGLE = () => {};
const FILE_TREE_EXPANDED_PLACEHOLDER = new Set();

function FileTreeStatic( { tree, activeFile, files, onPickFile } ) {
	return (
		<>
			<div className="forwp-lesson-ide__sidebar-title">{ tree.name }</div>
			<ul className="forwp-lesson-ide__tree forwp-lesson-ide__tree--root">
				{ Array.isArray( tree.children ) &&
					tree.children
						.filter(
							( child ) =>
								child !== undefined &&
								child !== null &&
								typeof child === 'object'
						)
						.map( ( child, i ) => (
							<TreeBranch
								key={ `${ tree.name }-${
									child?.name ?? i
								}-${ i }` }
								node={ child }
								parentPath=""
								activeFile={ activeFile }
								files={ files }
								onPickFile={ onPickFile }
								expandedDirs={ FILE_TREE_EXPANDED_PLACEHOLDER }
								toggleDir={ FILE_TREE_NOOP_TOGGLE }
								forceExpanded={ true }
							/>
						) ) }
			</ul>
		</>
	);
}

function IdeCodeMirrorEditor( {
	value,
	language,
	onChangeCode,
	editorScrollResetKey,
} ) {
	const cmRef = useRef( null );
	const stickToBottomRef = useRef( true );

	useEffect( () => {
		stickToBottomRef.current = true;
	}, [ editorScrollResetKey ] );

	const extensions = useMemo(
		() =>
			buildIdeCodeMirrorExtensions( {
				readOnly: false,
				language,
				stickToBottomRef,
			} ),
		[ language ]
	);

	useEffect( () => {
		const v = cmRef.current?.view;
		if ( ! v || ! stickToBottomRef.current ) {
			return;
		}
		window.requestAnimationFrame( () => {
			scrollIdeViewStickToBottom( v, stickToBottomRef );
		} );
	}, [ value, editorScrollResetKey ] );

	return (
		<div className="forwp-lesson-ide__codemirror-wrap">
			<CodeMirror
				ref={ cmRef }
				value={ value }
				height="100%"
				theme="none"
				extensions={ extensions }
				onChange={ onChangeCode }
				basicSetup={ false }
			/>
		</div>
	);
}

function LessonIdeShell( {
	tree,
	attributes,
	setAttributes,
	isEditor,
	fullscreenRef,
	activeContent,
	activeLanguage,
	breadcrumbTrail = 'src',
	onChangeCode,
	onRunBuild,
	terminalPreview,
	editorScrollResetKey,
} ) {
	const files = normalizeFiles( attributes.files );

	const fullscreenToggle = () => {
		const el = fullscreenRef?.current;
		if ( ! el ) {
			return;
		}
		if ( ! document.fullscreenElement ) {
			el.requestFullscreen?.();
		} else {
			document.exitFullscreen?.();
		}
	};

	const pickFile = setAttributes
		? ( name ) => setAttributes( { activeFile: name } )
		: undefined;

	return (
		<>
			<header className="forwp-lesson-ide__header">
				<button
					type="button"
					className="forwp-lesson-ide__fullscreen"
					onClick={ fullscreenToggle }
					title={ __( 'Fullscreen', 'learn-gutenberg-development' ) }
					aria-label={ __(
						'Fullscreen',
						'learn-gutenberg-development'
					) }
					aria-pressed="false"
				>
					⛶
				</button>
			</header>
			<div className="forwp-lesson-ide__body">
				<aside
					className="forwp-lesson-ide__sidebar"
					aria-label={ __( 'Files', 'learn-gutenberg-development' ) }
				>
					{ isEditor ? (
						<FileTree
							tree={ tree }
							activeFile={ attributes.activeFile }
							files={ files }
							onPickFile={ pickFile }
							forceExpanded={ false }
						/>
					) : (
						<FileTreeStatic
							tree={ tree }
							activeFile={ attributes.activeFile }
							files={ files }
							onPickFile={ pickFile }
						/>
					) }
				</aside>
				<section
					className="forwp-lesson-ide__main"
					aria-label={ __( 'Editor', 'learn-gutenberg-development' ) }
				>
					<div className="forwp-lesson-ide__tabs" role="tablist">
						{ files.map( ( f ) => (
							<button
								key={ f.name }
								type="button"
								className={
									'forwp-lesson-ide__tab' +
									( f.name === attributes.activeFile
										? ' forwp-lesson-ide__tab--active'
										: '' )
								}
								data-forwp-tab={ f.name }
								onClick={
									setAttributes
										? () =>
												setAttributes( {
													activeFile: f.name,
												} )
										: undefined
								}
								role="tab"
								aria-selected={
									f.name === attributes.activeFile
								}
							>
								{ f.name }
							</button>
						) ) }
					</div>
					<div className="forwp-lesson-ide__breadcrumbs">
						{ breadcrumbTrail } › { attributes.activeFile }
					</div>
					<div
						className={
							'forwp-lesson-ide__editor-wrap' +
							( isEditor
								? ' forwp-lesson-ide__editor-wrap--editor'
								: '' )
						}
					>
						{ isEditor ? (
							<IdeCodeMirrorEditor
								value={ activeContent }
								language={ activeLanguage }
								onChangeCode={ onChangeCode }
								editorScrollResetKey={ editorScrollResetKey }
							/>
						) : (
							<pre className="forwp-lesson-ide__highlight">
								<code
									className={ `forwp-lesson-ide__code language-${ activeLanguage }` }
								>
									{ activeContent }
								</code>
							</pre>
						) }
					</div>
				</section>
				<section
					className="forwp-lesson-ide__terminal"
					aria-label={ __(
						'Terminal',
						'learn-gutenberg-development'
					) }
				>
					<div className="forwp-lesson-ide__terminal-bar">
						<span className="forwp-lesson-ide__terminal-bar-label">
							{ __( 'Terminal', 'learn-gutenberg-development' ) }
						</span>
						{ ( isEditor && typeof onRunBuild === 'function' ) ||
						! isEditor ? (
							<button
								type="button"
								className="forwp-lesson-ide__terminal-run"
								onClick={ isEditor ? onRunBuild : undefined }
								title={ __(
									'Run npm run build',
									'learn-gutenberg-development'
								) }
								aria-label={ __(
									'Run npm run build',
									'learn-gutenberg-development'
								) }
							>
								<svg
									className="forwp-lesson-ide__terminal-run-icon"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									aria-hidden="true"
									focusable="false"
								>
									<path
										fill="currentColor"
										d="M8 5v14l11-7L8 5z"
									/>
								</svg>
							</button>
						) : null }
					</div>
					<pre className="forwp-lesson-ide__terminal-body">
						{ String( terminalPreview ?? '' ).trim()
							? terminalPreview
							: __(
									'(Press run in the terminal bar to emulate output)',
									'learn-gutenberg-development'
							  ) }
					</pre>
				</section>
			</div>
		</>
	);
}

function Edit( { attributes, setAttributes } ) {
	const fullscreenRef = useRef( null );
	const blockProps = useBlockProps( { className: 'forwp-lesson-ide' } );
	const [ fetchedTree ] = useState( null );
	const [ terminalLive, setTerminalLive ] = useState(
		attributes.terminalSnapshot || ''
	);
	const [ sourcesLoading, setSourcesLoading ] = useState( false );
	const [ sourcesError, setSourcesError ] = useState( null );
	const [ blockCatalog, setBlockCatalog ] = useState( [] );
	const [ catalogError, setCatalogError ] = useState( null );
	const typingIntervalRef = useRef( null );
	const filesListRef = useRef( [] );
	const attributesRef = useRef( attributes );
	attributesRef.current = attributes;

	const demoSlug =
		typeof attributes.demoBlockSlug === 'string' &&
		attributes.demoBlockSlug.length > 0
			? attributes.demoBlockSlug
			: 'learn-gutenberg/placeholder';

	useEffect( () => {
		let cancelled = false;
		setCatalogError( null );
		apiFetch( { path: '/learn-gutenberg/v1/ide-block-catalog' } )
			.then( ( data ) => {
				if ( cancelled ) {
					return;
				}
				if ( data && Array.isArray( data.blocks ) ) {
					setBlockCatalog( data.blocks );
				} else {
					setBlockCatalog( [] );
				}
			} )
			.catch( ( err ) => {
				if ( ! cancelled ) {
					setBlockCatalog( [] );
					setCatalogError(
						err?.message ||
							__(
								'Could not load the block list for this picker.',
								'learn-gutenberg-development'
							)
					);
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [] );

	useEffect( () => {
		let cancelled = false;
		setSourcesLoading( true );
		setSourcesError( null );
		fetchIdeSourcesFromServer( demoSlug )
			.then( ( data ) => {
				if ( cancelled ) {
					return;
				}
				const nextFiles = Array.isArray( data.files ) ? data.files : [];
				const prevActive = attributesRef.current.activeFile;
				const nextActive = pickDefaultActiveFile(
					nextFiles,
					prevActive
				);
				setAttributes( {
					files: nextFiles,
					structureJson: JSON.stringify(
						data.tree && typeof data.tree === 'object'
							? data.tree
							: {}
					),
					ideBreadcrumb:
						typeof data.breadcrumb === 'string'
							? data.breadcrumb
							: '',
					demoBlockSlug:
						typeof data.slug === 'string' ? data.slug : demoSlug,
					activeFile: nextActive,
					structureUrl: '',
				} );
			} )
			.catch( ( err ) => {
				if ( ! cancelled ) {
					setSourcesError(
						err?.message ||
							__(
								'Could not load block sources from the plugin.',
								'learn-gutenberg-development'
							)
					);
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setSourcesLoading( false );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ demoSlug, setAttributes ] );

	const tree = resolveDisplayedTree( attributes, fetchedTree );

	const filesList = normalizeFiles( attributes.files );
	filesListRef.current = filesList;

	const activeFileMeta =
		resolveIdeFileEntry( filesList, attributes.activeFile ) ||
		filesList[ 0 ];
	const activeLanguage = activeFileMeta?.language || 'javascript';

	const breadcrumbTrail = attributes.ideBreadcrumb?.trim?.() || 'src';

	const demoFilesSignature = filesList
		.map( ( f ) => f.name )
		.join( '\u0001' );

	const editorScrollResetKey = `${
		activeFileMeta?.name ?? attributes.activeFile
	}\u0001${ demoSlug }\u0001${ demoFilesSignature }`;

	const [ shownContent, setShownContent ] = useState( '' );

	useEffect( () => {
		const canonical = resolveIdeFileEntry(
			filesListRef.current,
			attributesRef.current.activeFile
		)?.name;
		if ( canonical && canonical !== attributesRef.current.activeFile ) {
			setAttributes( { activeFile: canonical } );
		}
	}, [ demoFilesSignature, setAttributes ] );

	useEffect( () => {
		if ( typingIntervalRef.current ) {
			clearInterval( typingIntervalRef.current );
			typingIntervalRef.current = null;
		}
		const target =
			resolveIdeFileEntry(
				filesListRef.current,
				attributesRef.current.activeFile
			)?.content ?? '';
		setShownContent( '' );
		if ( target.length === 0 ) {
			return;
		}
		let i = 0;
		const chunk = resolveTypingChunkChars( attributes.typingChunkChars );
		const ms = resolveTypingIntervalMs( attributes.typingIntervalMs );
		typingIntervalRef.current = setInterval( () => {
			i += chunk;
			if ( i >= target.length ) {
				setShownContent( target );
				clearInterval( typingIntervalRef.current );
				typingIntervalRef.current = null;
				return;
			}
			setShownContent( target.slice( 0, i ) );
		}, ms );
		return () => {
			if ( typingIntervalRef.current ) {
				clearInterval( typingIntervalRef.current );
				typingIntervalRef.current = null;
			}
		};
	}, [
		attributes.activeFile,
		attributes.demoBlockSlug,
		attributes.typingChunkChars,
		attributes.typingIntervalMs,
		demoFilesSignature,
	] );

	const updateActiveCode = ( value ) => {
		if ( typingIntervalRef.current ) {
			clearInterval( typingIntervalRef.current );
			typingIntervalRef.current = null;
		}
		setShownContent( value );
		const key = activeFileMeta?.name ?? attributes.activeFile;
		const next = filesList.map( ( f ) =>
			f.name === key ? { ...f, content: value } : f
		);
		setAttributes( { files: next } );
	};

	const ideSelectOptions = useMemo( () => {
		const fromApi = formatIdeBlockCatalogOptions( blockCatalog );
		if ( fromApi.length > 0 ) {
			return fromApi;
		}
		return [ { label: demoSlug, value: demoSlug } ];
	}, [ blockCatalog, demoSlug ] );

	const onSelectDemoBlock = ( slug ) => {
		if ( ! canSelectIdeBlockSlug( slug, blockCatalog ) ) {
			return;
		}
		setAttributes( { demoBlockSlug: slug } );
	};

	const runBuildEmulation = () => {
		setTerminalLive( '' );
		let i = 0;
		const id = setInterval( () => {
			if ( i >= BUILD_LINES.length ) {
				clearInterval( id );
				setAttributes( { terminalSnapshot: BUILD_LINES.join( '\n' ) } );
				return;
			}
			const line = BUILD_LINES[ i ];
			i += 1;
			setTerminalLive( ( prev ) =>
				prev ? `${ prev }\n${ line }` : line
			);
		}, 320 );
	};

	return (
		<>
			<InspectorControls>
				{ catalogError && (
					<Notice status="warning" isDismissible={ false }>
						{ catalogError }
					</Notice>
				) }
				<PanelBody
					title={ __(
						'Plugin blocks',
						'learn-gutenberg-development'
					) }
					initialOpen={ true }
				>
					<SelectControl
						label={ __(
							'Show sources for block',
							'learn-gutenberg-development'
						) }
						value={ demoSlug }
						options={ ideSelectOptions }
						onChange={ onSelectDemoBlock }
						help={ __(
							'Lesson IDE is omitted. Other blocks under src/blocks are listed from disk via REST.',
							'learn-gutenberg-development'
						) }
					/>
				</PanelBody>
				<PanelBody
					title={ __(
						'Typing animation',
						'learn-gutenberg-development'
					) }
					initialOpen={ false }
				>
					<RangeControl
						label={ __(
							'Characters per step',
							'learn-gutenberg-development'
						) }
						value={ resolveTypingChunkChars(
							attributes.typingChunkChars
						) }
						onChange={ ( v ) =>
							setAttributes( { typingChunkChars: v } )
						}
						min={ 1 }
						max={ 12 }
					/>
					<RangeControl
						label={ __(
							'Pause between steps (ms)',
							'learn-gutenberg-development'
						) }
						value={ resolveTypingIntervalMs(
							attributes.typingIntervalMs
						) }
						onChange={ ( v ) =>
							setAttributes( { typingIntervalMs: v } )
						}
						min={ 12 }
						max={ 120 }
						step={ 2 }
					/>
				</PanelBody>
			</InspectorControls>
			{ sourcesLoading && (
				<p className="forwp-lesson-ide-sources-loading">
					<Spinner />{ ' ' }
					{ __( 'Loading sources…', 'learn-gutenberg-development' ) }
				</p>
			) }
			{ sourcesError && (
				<Notice status="error" isDismissible={ false }>
					{ sourcesError }
				</Notice>
			) }
			<div { ...blockProps } ref={ fullscreenRef }>
				<LessonIdeShell
					tree={ tree }
					attributes={ attributes }
					setAttributes={ setAttributes }
					isEditor={ true }
					fullscreenRef={ fullscreenRef }
					activeContent={ shownContent }
					activeLanguage={ activeLanguage }
					breadcrumbTrail={ breadcrumbTrail }
					onChangeCode={ updateActiveCode }
					onRunBuild={ runBuildEmulation }
					editorScrollResetKey={ editorScrollResetKey }
					terminalPreview={
						terminalLive || attributes.terminalSnapshot || ''
					}
				/>
			</div>
		</>
	);
}

function Save( { attributes } ) {
	const tree = resolveDisplayedTree( attributes, null );

	const filesList = normalizeFiles( attributes.files );

	const activeFileMeta =
		resolveIdeFileEntry( filesList, attributes.activeFile ) ||
		filesList[ 0 ];
	const activeContent = activeFileMeta?.content ?? '';
	const activeLanguage = activeFileMeta?.language || 'javascript';

	const demoSlugSave =
		typeof attributes.demoBlockSlug === 'string' &&
		attributes.demoBlockSlug.length > 0
			? attributes.demoBlockSlug
			: 'learn-gutenberg/placeholder';
	const breadcrumbTrailSave = attributes.ideBreadcrumb?.trim?.() || 'src';

	const terminalText =
		attributes.terminalSnapshot?.trim() ||
		__(
			'(Run the build in the editor to show output here)',
			'learn-gutenberg-development'
		);

	const frontendIdeConfig = {
		files: filesList,
		activeFile: attributes.activeFile,
		breadcrumb: breadcrumbTrailSave,
		tree,
		sourceBlockSlug: demoSlugSave,
		terminalSnapshot: attributes.terminalSnapshot || '',
		typingChunkChars: resolveTypingChunkChars(
			attributes.typingChunkChars
		),
		typingIntervalMs: resolveTypingIntervalMs(
			attributes.typingIntervalMs
		),
	};

	const blockProps = useBlockProps.save( {
		className: 'forwp-lesson-ide',
		'data-forwp-config': JSON.stringify( frontendIdeConfig ),
	} );

	return (
		<div { ...blockProps }>
			<LessonIdeShell
				tree={ tree }
				attributes={ attributes }
				isEditor={ false }
				activeContent={ activeContent }
				activeLanguage={ activeLanguage }
				breadcrumbTrail={ breadcrumbTrailSave }
				terminalPreview={ terminalText }
			/>
		</div>
	);
}

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	save: Save,
} );
