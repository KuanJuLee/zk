/* LabelImageWidget.ts

	Purpose:

	Description:

	History:
		Sun Nov 16 14:59:07     2008, Created by tomyeh

Copyright (C) 2008 Potix Corporation. All Rights Reserved.

This program is distributed under LGPL Version 2.1 in the hope that
it will be useful, but WITHOUT ANY WARRANTY.
*/
/**
 * A skeletal implementation for ZUL widgets that support both label and image.
 */
export abstract class LabelImageWidget extends zul.Widget {
	private _label = '';
	private _iconSclass?: string;
	private _image?: string;
	private _hoverImage?: string;
	private _eimg?: HTMLImageElement | null;
	private _preloadImage?: boolean;

	public abstract _autodisable?: string;
	public abstract _disabled?: boolean;
	public abstract setDisabled(disabled: boolean, opts?: Record<string, boolean>): this;
	public abstract isDisabled(): boolean | undefined;
	/** Sets the label.
	 * <p>If label is changed, the whole component is invalidate.
	 * Thus, you want to smart-update, you have to override {@link #updateDomContent_}.
	 * @param String label
	 */
	public setLabel(label: string, opts?: Record<string, boolean>): this {
		const o = this._label;
		this._label = label;

		if (o !== label || (opts && opts.force)) {
			if (this.desktop)
				this.updateDomContent_();
		}

		return this;
	}

	/** Returns the label (never null).
	 * <p>Default: "".
	 * @return String
	 */
	public getLabel(): string {
		return this._label;
	}

	/**
	 * Sets the icon font
	 * @param String iconSclass a CSS class name for the icon font
	 * @since 7.0.0
	 */
	public setIconSclass(iconSclass: string, opts?: Record<string, boolean>): this {
		const o = this._iconSclass;
		this._iconSclass = iconSclass;

		if (o !== iconSclass || (opts && opts.force)) {
			if (this.desktop)
				this.updateDomContent_();
		}

		return this;
	}

	/**
	 * Returns the icon font
	 * @return String iconSclass a CSS class name for the icon font
	 * @since 7.0.0
	 */
	public getIconSclass(): string | undefined {
		return this._iconSclass;
	}

	/** Sets the image URI. The image would hide if src == null </p>
	 * @param String image the URI of the image
	 */
	public setImage(v: string, opts?: Record<string, boolean>): this {
		const o = this._image;
		this._image = v;

		if (o !== v || (opts && opts.force)) {
			if (v && this._preloadImage) zUtl.loadImage(v);
			var n = this.getImageNode(),
				jqn = jq(n!);
			if (n) {
				var img = v || '';
				if (jq.nodeName(n, 'img')) // ZK-1100
					n.src = img;
				else
					jqn.css('background-image', 'url(' + img + ')');
				jqn[!img ? 'hide' : 'show']();
			} else if (this.desktop) //<IMG> might not be generated (Bug 3007738)
				this.updateDomContent_();
		}

		return this;
	}

	/** Returns the image URI.
	 * <p>Default: null.
	 * @return String
	 */
	public getImage(): string | undefined {
		return this._image;
	}

	/** Sets the image URI.
	 * The hover image is used when the mouse is moving over this component.
	 * @param String src
	 */
	public setHoverImage(src: string): this {
		this._hoverImage = src;
		return this;
	}

	/** Returns the URI of the hover image.
	 * The hover image is used when the mouse is moving over this component.
	 * <p>Default: null.
	 * @return String
	 */
	public getHoverImage(): string | undefined {
		return this._hoverImage;
	}

	/**
	 * Updates the DOM tree for the modified label and image. It is called by
	 * {@link #setLabel} and {@link #setImage} to update the new content of the
	 * label and/or image to the DOM tree.
	 * Default: invoke {@link zk.Widget#rerender} to redraw and re-bind.
	 */
	protected updateDomContent_(): void {
		this.rerender();
	}

	/**
	 * Returns the HTML image content.
	 * @return String
	 */
	protected domImage_(): string {
		var img = this._image;
		return img ? '<img src="' + img + '" align="absmiddle" alt="" aria-hidden="true">' : '';
	}

	/**
	 * Returns the icon font class name with HTML content.
	 * @return String
	 * @since 7.0.0
	 */
	protected domIcon_(): string {
		var icon = this.getIconSclass(), // use getIconSclass() to allow overriding
			result = '';
		//ZK-3636: Added simple support for stacked font awesome icons
		if (icon) {
			var icons = icon.split(','),
				length = icons.length;
			if (length > 1) {
				var arr = ['<span class="z-icon-stack" aria-hidden="true">'];
				for (var i = 0; i < length; i++) {
					var ic = icons[i];
					if (ic)
						arr.push('<i class="' + ic + '"></i>');
				}
				arr.push('</span>');
				result = arr.join('');
			} else {
				result = '<i class="' + icon + '" aria-hidden="true"></i>';
			}
		}
		return result;
	}

	/**
	 * Returns the encoded label.
	 * @return String
	 * @see zUtl#encodeXML
	 */
	protected domLabel_(): string {
		return zUtl.encodeXML(this.getLabel());
	}

	/**
	 * Returns the HTML content of the label and image.
	 * It is a fragment of HTML that you can use in the mold.
	 * @return String
	 * @see #domImage_
	 * @see #domLabel_
	 */
	protected domContent_(): string {
		var label = this.domLabel_(),
			icon = this.domIcon_(),
			img = this.domImage_();

		if (img) {
			if (icon) {
				return img + ' ' + icon + (label ? ' ' + label : '');
			} else {
				return label ? img + ' ' + label : img;
			}
		} else {
			return icon ? label ? icon + ' ' + label : icon : label;
		}
	}

	protected override doMouseOver_(evt: zk.Event): void {
		this._updateHoverImage(true);
		super.doMouseOver_(evt);
	}

	protected override doMouseOut_(evt: zk.Event): void {
		this._updateHoverImage();
		super.doMouseOut_(evt);
	}

	/**
	 * Returns the image node if any.
	 * @return DOMElement
	 */
	public getImageNode(): HTMLImageElement | null | undefined {
		if (!this._eimg && this._image) {
			var n = this.$n();
			if (n) this._eimg = jq(n).find('img:first')[0] as HTMLImageElement;
		}
		return this._eimg;
	}

	private _updateHoverImage(inHover?: boolean): void {
		var n = this.getImageNode(),
			img = inHover ? this._hoverImage : this._image;
		if (n && this._hoverImage) {
			if (jq.nodeName(n, 'img'))
				n.src = img!;
			else
				jq(n).css('background-image', 'url(' + img + ')');
		}
	}

	//@Override
	public override clearCache(): void {
		this._eimg = null;
		super.clearCache();
	}
}
zul.LabelImageWidget = LabelImageWidget;