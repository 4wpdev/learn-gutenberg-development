/**
 * Component Button — metadata-only tests (avoid loading registerBlockType).
 */
import metadata from '../block.json';

describe( 'Component Button block metadata', () => {
	it( 'uses the expected block name', () => {
		expect( metadata.name ).toBe( 'learn-gutenberg/button' );
	} );

	it( 'registers under the ForWP lesson category', () => {
		expect( metadata.category ).toBe( 'forwp-gutenberg-components' );
	} );

	it( 'does not use PHP render in block.json', () => {
		expect( metadata ).not.toHaveProperty( 'render' );
	} );

	it( 'defines control attributes', () => {
		expect( metadata.attributes ).toHaveProperty( 'label' );
		expect( metadata.attributes ).toHaveProperty( 'icon' );
		expect( metadata.attributes ).toHaveProperty( 'iconPosition' );
	} );

	it( 'targets apiVersion 3', () => {
		expect( metadata.apiVersion ).toBe( 3 );
	} );

	it( 'exposes fill and outline block styles', () => {
		const names = ( metadata.styles || [] ).map( ( s ) => s.name ).sort();
		expect( names ).toEqual( [ 'fill', 'outline' ] );
	} );
} );