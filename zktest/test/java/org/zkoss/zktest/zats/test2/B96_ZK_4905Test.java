/* B96_ZK_4905Test.java

	Purpose:
		
	Description:
		
	History:
		Fri May 21 17:40:07 CST 2021, Created by rudyhuang

Copyright (C) 2021 Potix Corporation. All Rights Reserved.
*/
package org.zkoss.zktest.zats.test2;

import org.junit.Assert;
import org.junit.Test;
import org.openqa.selenium.support.ui.Select;

import org.zkoss.zktest.zats.WebDriverTestCase;
import org.zkoss.zktest.zats.ztl.JQuery;

/**
 * @author rudyhuang
 */
public class B96_ZK_4905Test extends WebDriverTestCase {
	@Test
	public void test() {
		connect();

		final JQuery sel = jq("@select");
		new Select(toElement(sel)).selectByIndex(1);
		waitResponse();
		Assert.assertEquals(2, sel.children().length());
	}
}
