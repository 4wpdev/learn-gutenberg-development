/**
 * Map tree segment paths (and tab keys) to the canonical `files[].name` entry.
 * REST uses posix paths like `index.js` or `foo/bar.js`; embedded/demo trees may
 * use longer pseudo-paths — avoid falling back to `files[0]` (often `block.json`).
 *
 * @param {Array<{name?: string}> | undefined} files       IDE virtual files.
 * @param {string}                             segmentPath Tree row path or active key.
 * @return {{name?: string, language?: string, content?: string}|undefined} Best matching file, or undefined when `files` is empty.
 */
export function resolveIdeFileEntry( files, segmentPath ) {
	if ( ! Array.isArray( files ) || files.length === 0 ) {
		return undefined;
	}
	const raw = typeof segmentPath === 'string' ? segmentPath.trim() : '';
	const norm = raw.replace( /\\/g, '/' );
	if ( norm === '' ) {
		return (
			files.find( ( f ) => f?.name === 'index.js' ) ||
			files.find(
				( f ) =>
					typeof f?.name === 'string' &&
					f.name.endsWith( '/index.js' )
			) ||
			files[ 0 ]
		);
	}

	const exact = files.find( ( f ) => f?.name === norm );
	if ( exact ) {
		return exact;
	}

	const tail = norm.includes( '/' )
		? norm.slice( norm.lastIndexOf( '/' ) + 1 )
		: norm;

	let candidates = files.filter(
		( f ) =>
			typeof f?.name === 'string' &&
			( f.name === tail ||
				f.name.endsWith( '/' + tail ) ||
				norm.endsWith( '/' + f.name ) ||
				norm.endsWith( f.name ) )
	);

	if ( candidates.length > 1 ) {
		candidates = [ ...candidates ].sort(
			( a, b ) => String( b.name ).length - String( a.name ).length
		);
		const bySuffix = candidates.find( ( f ) => norm.endsWith( f.name ) );
		if ( bySuffix ) {
			return bySuffix;
		}
	}

	if ( candidates.length === 1 ) {
		return candidates[ 0 ];
	}

	return (
		files.find( ( f ) => f?.name === 'index.js' ) ||
		files.find(
			( f ) =>
				typeof f?.name === 'string' && f.name.endsWith( '/index.js' )
		) ||
		files[ 0 ]
	);
}
