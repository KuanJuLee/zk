/* B95_ZK_4632Test.java

	Purpose:
		
	Description:
		
	History:
		Wed Aug 12 16:09:45 CST 2020, Created by rudyhuang

Copyright (C) 2020 Potix Corporation. All Rights Reserved.
*/
package org.zkoss.zephyr.webdriver.test2;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import org.zkoss.zephyr.webdriver.ClientBindTestCase;

/**
 * @author rudyhuang
 */
public class B95_ZK_4632Test extends ClientBindTestCase {
	@Test
	public void test() {
		connect();

		click(jq("@button"));
		waitResponse();

		Assertions.assertFalse(hasError());
		assertNoJSError();
	}
}
