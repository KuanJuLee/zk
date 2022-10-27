/* F80_ZK_2584Test.java

	Purpose:
		
	Description:
		
	History:
		10:17 AM 12/18/15, Created by jumperchen

Copyright (C) 2015 Potix Corporation. All Rights Reserved.
*/
package org.zkoss.zephyr.webdriver.test2;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import org.zkoss.zephyr.webdriver.ClientBindTestCase;
import org.zkoss.test.webdriver.ztl.JQuery;

/**
 * @author jumperchen
 */
public class F80_ZK_2584Test extends ClientBindTestCase {
	@Test
	public void test() {
		connect();
		JQuery button = jq("button");

		click(button.eq(0));
		waitResponse();
		assertEquals("Foo0 Bar0", getZKLog());
		closeZKLog();

		click(button.eq(1));
		waitResponse();
		assertEquals("Foo0 Bar0\nFoo0 Bar0", getZKLog());
		closeZKLog();

		click(button.eq(2));
		waitResponse();
		assertEquals("Foo2 Bar2", getZKLog());
	}
}
