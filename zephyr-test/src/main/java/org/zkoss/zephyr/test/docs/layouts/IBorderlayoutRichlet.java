/* IBorderlayoutRichlet.java

	Purpose:

	Description:

	History:
		Tue Apr 12 10:34:37 CST 2022, Created by katherine

Copyright (C) 2022 Potix Corporation. All Rights Reserved.
*/
package org.zkoss.zephyr.test.docs.layouts;

import org.zkoss.stateless.annotation.RichletMapping;
import org.zkoss.stateless.ui.StatelessRichlet;
import org.zkoss.stateless.zpr.IBorderlayout;
import org.zkoss.stateless.zpr.ICenter;
import org.zkoss.stateless.zpr.IComponent;
import org.zkoss.stateless.zpr.IEast;
import org.zkoss.stateless.zpr.INorth;
import org.zkoss.stateless.zpr.ISouth;
import org.zkoss.stateless.zpr.IWest;

/**
 * A set of example for {@link IBorderlayout} Java Docs.
 * And also refers to something else on <a href="https://www.zkoss.org/wiki/ZK_Component_Reference/Layouts/Borderlayout">IBorderlayout</a>,
 * if any.
 *
 * @author katherine
 * @see IBorderlayout
 */
@RichletMapping("/layouts/iBorderlayout")
public class IBorderlayoutRichlet implements StatelessRichlet {
	@RichletMapping("/children")
	public IComponent children() {
		return IBorderlayout.of(
					INorth.DEFAULT.withSize("10%").withTitle("North"),
					IWest.DEFAULT.withSize("25%").withTitle("West").withMaxsize(300)
							.withCollapsible(true).withSplittable(true),
					ICenter.DEFAULT.withTitle("Center"),
					IEast.DEFAULT.withSize("25%").withTitle("East"),
					ISouth.DEFAULT.withSize("100px").withTitle("South")
			).withWidth("800px");
	}
}