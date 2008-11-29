/* ZIndexEvent.java

{{IS_NOTE
	Purpose:
		
	Description:
		
	History:
		Sat Dec 24 23:04:41     2005, Created by tomyeh
}}IS_NOTE

Copyright (C) 2004 Potix Corporation. All Rights Reserved.

{{IS_RIGHT
	This program is distributed under GPL Version 2.0 in the hope that
	it will be useful, but WITHOUT ANY WARRANTY.
}}IS_RIGHT
*/
package org.zkoss.zk.ui.event;

import org.zkoss.lang.Objects;

import org.zkoss.zk.mesg.MZk;
import org.zkoss.zk.ui.Component;
import org.zkoss.zk.ui.UiException;
import org.zkoss.zk.au.AuRequest;
import org.zkoss.zk.au.AuRequests;

/**
 * Represents an event caused by a component whose z-index is modified
 * by the client.
 *
 * @author tomyeh
 */
public class ZIndexEvent  extends Event {
	private final int _zIndex;

	/** Converts an AU request to a z-index event.
	 * @since 5.0.0
	 */
	public static final ZIndexEvent getZIndexEvent(AuRequest request) {
		final Component comp = request.getComponent();
		if (comp == null)
			throw new UiException(MZk.ILLEGAL_REQUEST_COMPONENT_REQUIRED, request);
		final String[] data = request.getData();
		if (data == null || data.length != 1)
			throw new UiException(MZk.ILLEGAL_REQUEST_WRONG_DATA,
				new Object[] {Objects.toString(data), request});

		return new ZIndexEvent(request.getName(), comp, Integer.parseInt(data[0]));
	}
	/** Constructs a mouse relevant event.
	 */
	public ZIndexEvent(String name, Component target, int zIndex) {
		super(name, target);
		_zIndex = zIndex;
	}
	/** Returns the z-index of the component after moved.
	 */
	public final int getZIndex() {
		return _zIndex;
	}
}
