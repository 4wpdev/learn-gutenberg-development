import { registerBlockType } from '@wordpress/blocks';
import {
	BlockControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	Dropdown,
	Icon,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { alignLeft, alignRight, cancelCircleFilled } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';
import {
	ICONS_MAP,
	getIconForButton,
	getIconForToolbar,
} from './icons-map.js';
import './editor.scss';
import './style.scss';

const ICON_KEYS = [ 'none', 'star', 'heart', 'arrowRight', 'wordpress', 'github', 'youtube', 'linkedin' ];

function isRichTextKeyEvent( event ) {
	const el = event.target;
	if ( ! el || typeof el.closest !== 'function' ) {
		return false;
	}
	return (
		el.closest( '[contenteditable="true"]' ) != null ||
		el.isContentEditable === true
	);
}

function saveButtonInner( attributes ) {
	const { label, icon, iconPosition } = attributes;

	const resolvedLabel =
		label && String( label ).trim() !== ''
			? label
			: __( 'Learn Gutenberg', 'learn-gutenberg-development' );

	const iconDef = getIconForButton( icon );

	const labelSpan = (
		<span className="forwp-cbtn__label">{ resolvedLabel }</span>
	);

	if ( iconDef ) {
		return iconPosition === 'right' ? (
			<>
				{ labelSpan }
				<Icon icon={ iconDef } />
			</>
		) : (
			<>
				<Icon icon={ iconDef } />
				{ labelSpan }
			</>
		);
	}

	return labelSpan;
}

function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( {
		className: 'forwp-cbtn-editor-target forwp-cbtn',
	} );
	const { label, icon, iconPosition } = attributes;

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<Dropdown
						popoverProps={ { placement: 'bottom-start' } }
						renderToggle={ ( { isOpen, onToggle } ) => (
							<ToolbarButton
								icon={ getIconForToolbar( icon ) }
								label={ __(
									'Icon',
									'learn-gutenberg-development'
								) }
								onClick={ onToggle }
								aria-expanded={ isOpen }
							/>
						) }
						renderContent={ ( { onClose } ) => (
							<div
								className="forwp-cbtn-icon-picker"
								role="presentation"
							>
								{ ICON_KEYS.map( ( key ) => (
									<ToolbarButton
										key={ key }
										icon={
											key === 'none'
												? cancelCircleFilled
												: ICONS_MAP[ key ]
										}
										label={
											key === 'none'
												? __(
														'None',
														'learn-gutenberg-development'
												  )
												: key
										}
										showTooltip
										isPressed={ icon === key }
										onClick={ () => {
											setAttributes( { icon: key } );
											onClose();
										} }
									/>
								) ) }
							</div>
						) }
					/>
				</ToolbarGroup>
				{ icon !== 'none' && (
					<ToolbarGroup>
						<ToolbarButton
							icon={ alignLeft }
							label={ __(
								'Icon left',
								'learn-gutenberg-development'
							) }
							isPressed={ iconPosition === 'left' }
							onClick={ () =>
								setAttributes( { iconPosition: 'left' } )
							}
						/>
						<ToolbarButton
							icon={ alignRight }
							label={ __(
								'Icon right',
								'learn-gutenberg-development'
							) }
							isPressed={ iconPosition === 'right' }
							onClick={ () =>
								setAttributes( { iconPosition: 'right' } )
							}
						/>
					</ToolbarGroup>
				) }
			</BlockControls>

			<Button
				{ ...blockProps }
				variant="secondary"
				icon={ getIconForButton( icon ) }
				iconPosition={ iconPosition }
				__next40pxDefaultSize
				onClick={ ( event ) => {
					event.preventDefault();
					event.stopPropagation();
				} }
				onKeyDown={ ( event ) => {
					if ( isRichTextKeyEvent( event ) ) {
						return;
					}
					if (
						event.key === 'Enter' ||
						event.key === ' '
					) {
						event.preventDefault();
						event.stopPropagation();
					}
				} }
			>
				<RichText
					tagName="span"
					className="forwp-cbtn__label"
					value={ label }
					onChange={ ( value ) =>
						setAttributes( { label: value ?? '' } )
					}
					placeholder={ __(
						'Button text…',
						'learn-gutenberg-development'
					) }
					allowedFormats={ [] }
					withoutInteractiveFormatting
				/>
			</Button>
		</>
	);
}

function Save( { attributes } ) {
	const blockProps = useBlockProps.save( {
		className: 'forwp-cbtn',
	} );
	const { label, icon, iconPosition } = attributes;

	const iconDef = getIconForButton( icon );

	const labelEl = (
		<RichText.Content
			tagName="span"
			className="forwp-cbtn__label"
			value={ label ?? '' }
		/>
	);

	let inner;
	if ( iconDef ) {
		inner =
			iconPosition === 'right' ? (
				<>
					{ labelEl }
					<Icon icon={ iconDef } />
				</>
			) : (
				<>
					<Icon icon={ iconDef } />
					{ labelEl }
				</>
			);
	} else {
		inner = labelEl;
	}

	return (
		<button type="button" { ...blockProps }>
			{ inner }
		</button>
	);
}

/**
 * Legacy Save: div wrapper + BEM classes on inner button.
 */
function deprecatedSaveButtonClassNames( attrs ) {
	const variantStyle =
		attrs?.variantStyle === 'outline' ? 'outline' : 'filled';
	const shape = attrs?.shape === 'square' ? 'square' : 'rectangular';
	const classes = [ 'forwp-cbtn' ];
	classes.push(
		shape === 'square' ? 'forwp-cbtn--square' : 'forwp-cbtn--rect'
	);
	classes.push(
		variantStyle === 'outline'
			? 'forwp-cbtn--outline'
			: 'forwp-cbtn--filled'
	);
	return classes.join( ' ' );
}

function deprecatedSanitizeDashiconSlug( raw ) {
	return String( raw || '' )
		.toLowerCase()
		.replace( /[^a-z0-9-]/g, '' );
}

function DeprecatedSave( { attributes } ) {
	const blockProps = useBlockProps.save();
	const { label, iconPosition } = attributes;

	const slug = deprecatedSanitizeDashiconSlug( attributes.iconName );
	const btnClass = deprecatedSaveButtonClassNames( attributes );

	const resolvedLabel =
		label && String( label ).trim() !== ''
			? label
			: __( 'Learn Gutenberg', 'learn-gutenberg-development' );

	const iconSpan =
		slug !== '' ? (
			<span
				className={ `dashicons dashicons-${ slug }` }
				aria-hidden="true"
			/>
		) : null;

	const labelSpan = (
		<span className="forwp-cbtn__label">{ resolvedLabel }</span>
	);

	let inner;
	if ( iconSpan ) {
		inner =
			iconPosition === 'right' ? (
				<>
					{ labelSpan }
					{ iconSpan }
				</>
			) : (
				<>
					{ iconSpan }
					{ labelSpan }
				</>
			);
	} else {
		inner = labelSpan;
	}

	return (
		<div { ...blockProps }>
			<button type="button" className={ btnClass }>
				{ inner }
			</button>
		</div>
	);
}

/** Posts saved after SVG refactor but before button-as-root (div > button, no BEM). */
function DeprecatedDivWrappedSave( { attributes } ) {
	const blockProps = useBlockProps.save();
	return (
		<div { ...blockProps }>
			<button type="button" className="forwp-cbtn">
				{ saveButtonInner( attributes ) }
			</button>
		</div>
	);
}

const deprecatedLegacyMarkup = {
	attributes: {
		...metadata.attributes,
		variantStyle: {
			type: 'string',
			enum: [ 'filled', 'outline' ],
			default: 'filled',
		},
		shape: {
			type: 'string',
			enum: [ 'rectangular', 'square' ],
			default: 'rectangular',
		},
		iconName: {
			type: 'string',
			default: '',
		},
	},
	isEligible( attributes, innerBlocks, innerHTML ) {
		return (
			typeof innerHTML === 'string' &&
			/\bforwp-cbtn--(rect|square|filled|outline)\b/.test(
				innerHTML
			)
		);
	},
	migrate( attributes ) {
		const next = { ...attributes };
		delete next.variantStyle;
		delete next.shape;
		delete next.iconName;
		if ( next.icon === undefined || next.icon === null ) {
			next.icon = 'none';
		}
		if ( ! next.iconPosition ) {
			next.iconPosition = 'left';
		}
		return next;
	},
	save: DeprecatedSave,
};

const deprecatedDivWrapped = {
	attributes: metadata.attributes,
	isEligible( attributes, innerBlocks, innerHTML ) {
		if ( typeof innerHTML !== 'string' ) {
			return false;
		}
		if (
			/\bforwp-cbtn--(rect|square|filled|outline)\b/.test(
				innerHTML
			)
		) {
			return false;
		}
		return (
			/<div\b[^>]*\bwp-block-learn-gutenberg-button\b[\s\S]*<\/div>\s*$/i.test(
				innerHTML.trim()
			) && /<button\b[^>]*\bforwp-cbtn\b/.test( innerHTML )
		);
	},
	migrate( attributes ) {
		return attributes;
	},
	save: DeprecatedDivWrappedSave,
};

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	save: Save,
	deprecated: [ deprecatedLegacyMarkup, deprecatedDivWrapped ],
} );
