const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/user-characters");

  const textContent = await page.textContent("p");
  if (textContent === "User is not logged in.") {
    console.log("Test Passed: Non-logged in user message is displayed.");
  } else {
    console.log("Test Failed: Non-logged in user message is not displayed.");
  }

  await browser.close();
})();

// add
