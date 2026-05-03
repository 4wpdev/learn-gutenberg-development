import { resolveIdeFileEntry } from '../ide-resolve-file.js';

describe( 'resolveIdeFileEntry', () => {
	const files = [
		{ name: 'block.json', language: 'json', content: '{}' },
		{ name: 'index.js', language: 'javascript', content: 'x' },
		{ name: 'src/foo.js', language: 'javascript', content: 'y' },
	];

	it( 'matches exact path', () => {
		expect( resolveIdeFileEntry( files, 'src/foo.js' )?.name ).toBe(
			'src/foo.js'
		);
	} );

	it( 'maps long tree segment to flat file name', () => {
		expect(
			resolveIdeFileEntry( files, 'src/blocks/placeholder/index.js' )
				?.name
		).toBe( 'index.js' );
	} );

	it( 'does not fall back to block.json when index exists', () => {
		expect(
			resolveIdeFileEntry( files, 'nope/missing.js' )?.name
		).not.toBe( 'block.json' );
		expect( resolveIdeFileEntry( files, 'nope/missing.js' )?.name ).toBe(
			'index.js'
		);
	} );
} );
