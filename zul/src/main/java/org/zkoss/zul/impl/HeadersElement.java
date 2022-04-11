/* HeadersElement.java

	Purpose:

	Description:

	History:
		Thu Dec  7 09:43:48     2006, Created by tomyeh

Copyright (C) 2006 Potix Corporation. All Rights Reserved.

{{IS_RIGHT
	This program is distributed under LGPL Version 2.1 in the hope that
	it will be useful, but WITHOUT ANY WARRANTY.
}}IS_RIGHT
*/
package org.zkoss.zul.impl;

import java.util.Collections;
import java.util.List;

import org.zkoss.zk.ui.Component;
import org.zkoss.zk.ui.HtmlBasedComponent;
import org.zkoss.zk.ui.event.Events;
import org.zkoss.zul.event.ColSizeEvent;
import org.zkoss.zul.event.ZulEvents;

/**
 * A skeletal implementation for headers, the parent of
 * a group of {@link HeaderElement}.
 *
 * @author tomyeh
 */
public abstract class HeadersElement extends XulElement {

	static {
		addClientEvent(HeadersElement.class, ZulEvents.ON_COL_SIZE, CE_IMPORTANT); //no CE_DUPLICATE_IGNORE (might apply to diff index)
	}

	private boolean _sizable;

	/** Returns whether the width of the child column is sizable.
	 */
	public boolean isSizable() {
		return _sizable;
	}

	/** Sets whether the width of the child column is sizable.
	 * If true, a user can drag the border between two columns (e.g., {@link org.zkoss.zul.Column})
	 * to change the widths of adjacent columns.
	 * <p>Default: false.
	 */
	public void setSizable(boolean sizable) {
		if (_sizable != sizable) {
			_sizable = sizable;
			smartUpdate("sizable", sizable);
		}
	}

	// super
	protected void renderProperties(org.zkoss.zk.ui.sys.ContentRenderer renderer) throws java.io.IOException {
		super.renderProperties(renderer);

		render(renderer, "sizable", _sizable);
	}

	//-- ComponentCtrl --//
	/** Processes an AU request.
	 *
	 * <p>Default: in addition to what are handled by {@link XulElement#service},
	 * it also handles onColSize and onColsSize.
	 * @since 5.0.0
	 */
	public void service(org.zkoss.zk.au.AuRequest request, boolean everError) {
		final String cmd = request.getCommand();
		if (cmd.equals(ZulEvents.ON_COL_SIZE)) {
			disableClientUpdate(true); //ZK-4077
			try {
				((MeshElement) this.getParent()).setSpan(false); //clear span
				((MeshElement) this.getParent()).setSizedByContent(false); //clear sizedByContent
			} finally {
				disableClientUpdate(false);
			}
			//ZK-3332: update single column width if widths was not given
			boolean isMultiple = request.getData().containsKey("widths");
			ColSizeEvent evt = ColSizeEvent.getColSizeEvent(request);
			List<Component> headers = isMultiple ? getChildren() : Collections.singletonList(evt.getColumn());
			for (int i = 0; i < headers.size(); i++) {
				final HeaderElement header = (HeaderElement) headers.get(i);
				final String width = isMultiple ? evt.getWidth(i) : evt.getWidth();
				if (header.isVisible()) { // ZK-3768: Avoid clearing the original width
					header.setWidthByClient(width);
				}
				if (header.getHflex() != null) {
					header.setHflexByClient(null);
				}
			}
			Events.postEvent(evt);
		} else
			super.service(request, everError);
	}

	@Override
	public boolean evalCSSFlex() {
		Component parent = this.getParent(); //mesh
		if (parent != null)
			return ((HtmlBasedComponent) parent).evalCSSFlex();
		return super.evalCSSFlex();
	}
}
