/**
 * Placeholder block — metadata-only tests (no editor mocks yet).
 *
 * Why metadata tests first:
 * - `index.js` calls `registerBlockType()` at import time, which needs many WP mocks.
 * - Testing `block.json` validates naming, attributes, and category without loading React.
 */
import metadata from '../block.json';

describe( 'Placeholder block metadata', () => {
	it( 'uses the expected block name', () => {
		expect( metadata.name ).toBe( 'learn-gutenberg/placeholder' );
	} );

	it( 'registers under the ForWP lesson category', () => {
		expect( metadata.category ).toBe( 'forwp-gutenberg-components' );
	} );

	it( 'defines a string attribute message', () => {
		expect( metadata.attributes ).toHaveProperty( 'message' );
		expect( metadata.attributes.message.type ).toBe( 'string' );
		expect( metadata.attributes.message.default ).toBeTruthy();
	} );

	it( 'targets apiVersion 3', () => {
		expect( metadata.apiVersion ).toBe( 3 );
	} );
} );
