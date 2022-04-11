/* SlideEvent.java

	Purpose:

	Description:

	History:
		Wed Apr 19 17:00:03     2016, Created by wenninghsu

Copyright (C) 2016 Potix Corporation. All Rights Reserved.

{{IS_RIGHT
	This program is distributed under LGPL Version 2.1 in the hope that
	it will be useful, but WITHOUT ANY WARRANTY.
}}IS_RIGHT
*/
package org.zkoss.zk.ui.event;

import java.util.Map;

import org.zkoss.zk.au.AuRequest;
import org.zkoss.zk.au.AuRequests;
import org.zkoss.zk.ui.Component;

/**
 * Represents an event cause by user's slidedown or slideup
 * something at the client.
 *
 * <p>Note: When using with LayoutRegion component, we couldn't guarantee the triggered
 * order of onClick event and onSlide event when clicking out of the region but
 * on elements that is listened to the onClick event.
 *
 * @author wenninghsu
 * @since 8.0.2
 */
public class SlideEvent extends Event {

    private final boolean _slide;

    /** Converts an AU request to an slide event.
     */
    public static final SlideEvent getSlideEvent(AuRequest request) {
        final Map<String, Object> data = request.getData();
        return new SlideEvent(request.getCommand(), request.getComponent(), AuRequests.getBoolean(data, "slide"));
    }

    /** Constructs an onOpen event.
     * @param slide whether the new status is slide
     */
    public SlideEvent(String name, Component target, boolean slide) {
        super(name, target);
        _slide = slide;
    }

    /** Returns whether it is slide out.
     */
    public boolean isSlide() {
        return _slide;
    }

}
