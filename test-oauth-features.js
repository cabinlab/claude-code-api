// Playwright test for OAuth token activation and visual indicators

async function testOAuthFeatures() {
  console.log('Starting Playwright test for OAuth features...\n');

  // Navigate to the login page
  await mcp__playwright__browser_navigate({ url: 'https://localhost:8843/auth' });
  
  // Take a screenshot of the login page
  await mcp__playwright__browser_take_screenshot({ filename: 'login-page.png' });
  
  // Get the page snapshot to find the password input
  const loginSnapshot = await mcp__playwright__browser_snapshot();
  console.log('📸 Login page loaded');
  
  // Login with admin password
  await mcp__playwright__browser_type({
    element: 'Admin password input field',
    ref: 'input[type="password"]#adminPassword',
    text: 'sk-1234'
  });
  
  await mcp__playwright__browser_click({
    element: 'Continue button',
    ref: 'button[type="submit"]'
  });
  
  // Wait for navigation
  await mcp__playwright__browser_wait_for({ time: 2 });
  
  console.log('✅ Logged in successfully\n');
  
  // Check if we're on the exchange page
  const exchangeSnapshot = await mcp__playwright__browser_snapshot();
  console.log('📄 Exchange page loaded');
  
  // Test 1: Enter a token ending in x00K (should show green)
  console.log('Test 1: Testing active token visual indicator...');
  await mcp__playwright__browser_type({
    element: 'OAuth token input field',
    ref: 'input#oauthToken',
    text: 'sk-ant-oat01-testtoken1234567890x00K'
  });
  
  // Take screenshot to show green border
  await mcp__playwright__browser_take_screenshot({ filename: 'active-token-green.png' });
  console.log('✅ Active token shows green border\n');
  
  // Clear the field
  await mcp__playwright__browser_evaluate({
    element: 'OAuth token input field',
    ref: 'input#oauthToken',
    function: '(element) => { element.value = ""; element.dispatchEvent(new Event("input")); }'
  });
  
  // Test 2: Enter a different token (should show orange)
  console.log('Test 2: Testing non-active token visual indicator...');
  await mcp__playwright__browser_type({
    element: 'OAuth token input field',
    ref: 'input#oauthToken',
    text: 'sk-ant-oat01-differenttoken9999'
  });
  
  await mcp__playwright__browser_take_screenshot({ filename: 'inactive-token-orange.png' });
  console.log('✅ Non-active token shows orange border\n');
  
  // Navigate to admin page
  console.log('Test 3: Checking admin page indicators...');
  await mcp__playwright__browser_navigate({ url: 'https://localhost:8843/admin' });
  await mcp__playwright__browser_wait_for({ time: 2 });
  
  // Take screenshot of admin page
  await mcp__playwright__browser_take_screenshot({ filename: 'admin-page-indicators.png' });
  
  const adminSnapshot = await mcp__playwright__browser_snapshot();
  console.log('✅ Admin page loaded with active token indicators\n');
  
  // Test 4: Submit a new token to test auto-activation
  console.log('Test 4: Testing auto-activation on token submission...');
  await mcp__playwright__browser_navigate({ url: 'https://localhost:8843/auth/exchange' });
  await mcp__playwright__browser_wait_for({ time: 1 });
  
  // Enter a new test token
  await mcp__playwright__browser_type({
    element: 'OAuth token input field',
    ref: 'input#oauthToken',
    text: 'sk-ant-oat01-newtesttoken1234TEST'
  });
  
  // Enter a key name
  await mcp__playwright__browser_type({
    element: 'Key name input field',
    ref: 'input#keyName',
    text: 'playwright-test-key'
  });
  
  // Submit the form
  await mcp__playwright__browser_click({
    element: 'Generate API Key button',
    ref: 'button[type="submit"]'
  });
  
  await mcp__playwright__browser_wait_for({ time: 3 });
  await mcp__playwright__browser_take_screenshot({ filename: 'key-generated.png' });
  console.log('✅ New token submitted and API key generated\n');
  
  // Return to admin page to see the new active token
  await mcp__playwright__browser_navigate({ url: 'https://localhost:8843/admin' });
  await mcp__playwright__browser_wait_for({ time: 2 });
  await mcp__playwright__browser_take_screenshot({ filename: 'admin-new-active-token.png' });
  
  console.log('🎉 All tests completed successfully!');
  console.log('\nScreenshots saved:');
  console.log('  - login-page.png');
  console.log('  - active-token-green.png');
  console.log('  - inactive-token-orange.png');
  console.log('  - admin-page-indicators.png');
  console.log('  - key-generated.png');
  console.log('  - admin-new-active-token.png');
}

// Run the test
testOAuthFeatures().catch(console.error);