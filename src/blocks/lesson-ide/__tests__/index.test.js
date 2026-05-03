/**
 * Lesson IDE block — metadata-only tests (avoid loading registerBlockType).
 */
import metadata from '../block.json';

describe( 'Lesson IDE block metadata', () => {
	it( 'uses the expected block name', () => {
		expect( metadata.name ).toBe( 'learn-gutenberg/lesson-ide' );
	} );

	it( 'registers under the ForWP lesson category', () => {
		expect( metadata.category ).toBe( 'forwp-gutenberg-components' );
	} );

	it( 'defines files and structure attributes', () => {
		expect( metadata.attributes ).toHaveProperty( 'files' );
		expect( metadata.attributes.files.type ).toBe( 'array' );
		expect( metadata.attributes ).toHaveProperty( 'structureUrl' );
		expect( metadata.attributes ).toHaveProperty( 'structureJson' );
		expect( metadata.attributes ).toHaveProperty( 'demoBlockSlug' );
		expect( metadata.attributes.demoBlockSlug.type ).toBe( 'string' );
		expect( metadata.attributes ).toHaveProperty( 'typingChunkChars' );
		expect( metadata.attributes ).toHaveProperty( 'typingIntervalMs' );
		expect( metadata.attributes.typingChunkChars.type ).toBe( 'number' );
		expect( metadata.attributes.typingIntervalMs.type ).toBe( 'number' );
		expect( metadata.attributes ).toHaveProperty( 'ideBreadcrumb' );
		expect( metadata.attributes.ideBreadcrumb.type ).toBe( 'string' );
	} );

	it( 'loads frontend view script', () => {
		expect( metadata.viewScript ).toBe( 'file:./view.js' );
		expect( metadata ).not.toHaveProperty( 'viewStyle' );
	} );
} );
