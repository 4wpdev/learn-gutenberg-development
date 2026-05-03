import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Content', 'learn-gutenberg-development' ) }
				>
					<TextControl
						label={ __( 'Message', 'learn-gutenberg-development' ) }
						value={ attributes.message }
						onChange={ ( value ) =>
							setAttributes( { message: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<Placeholder
					icon="admin-generic"
					label={ __( 'Placeholder', 'learn-gutenberg-development' ) }
					instructions={ attributes.message }
				/>
			</div>
		</>
	);
}

function Save( { attributes } ) {
	const blockProps = useBlockProps.save();
	return (
		<div { ...blockProps }>
			<p className="forwp-placeholder-message">{ attributes.message }</p>
		</div>
	);
}

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	save: Save,
} );
