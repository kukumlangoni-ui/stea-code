/* Quick headless verification of the steacode chatbot widget. */
import puppeteer from "puppeteer";

const BASE = "http://127.0.0.1:4173";
const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${extra ? ` (${extra})` : ""}`);
};

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1400,900"],
  defaultViewport: { width: 1400, height: 900 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", String(e).slice(0, 200)));

try {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".sc-chat-bubble", { timeout: 15000 });
  check("floating bubble renders", true);

  // Teaser appears after ~4.2s
  await new Promise((r) => setTimeout(r, 5000));
  const teaser = await page.$(".sc-chat-teaser");
  check("teaser bubble shows", Boolean(teaser));

  // Wander: position changes within ~12s without interaction
  const pos1 = await page.$eval(".sc-chat-bubble", (el) => ({ x: el.style.left, y: el.style.top }));
  await new Promise((r) => setTimeout(r, 12000));
  const pos2 = await page.$eval(".sc-chat-bubble", (el) => ({ x: el.style.left, y: el.style.top }));
  check("bubble wanders around", pos1.x !== pos2.x || pos1.y !== pos2.y, `${pos1.x},${pos1.y} -> ${pos2.x},${pos2.y}`);

  // Click opens the panel + welcome message
  await page.click(".sc-chat-bubble");
  await page.waitForSelector(".sc-chat-panel", { timeout: 5000 });
  check("panel opens on click", true);
  await page.waitForFunction(
    () => document.querySelectorAll(".sc-chat-msg").length >= 1,
    { timeout: 5000 }
  );
  const welcome = await page.$eval(".sc-chat-msg-bot .sc-chat-msg-text", (el) => el.textContent);
  check("welcome message from bot", /Stea|steacode/i.test(welcome), welcome.slice(0, 60));

  // Ask a question — wait until the bot finishes typing its reply.
  const askAndAwait = async (question, minCount) => {
    const before = await page.evaluate(() => document.querySelectorAll(".sc-chat-msg").length);
    await page.type(".sc-chat-input", question);
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      (n) => {
        const typing = Boolean(document.querySelector(".sc-chat-typing"));
        const count = document.querySelectorAll(".sc-chat-msg").length;
        const msgs = document.querySelectorAll(".sc-chat-msg-bot");
        const last = msgs[msgs.length - 1];
        return !typing && count >= n && last;
      },
      { timeout: 10000 },
      Math.max(minCount, before + 2)
    );
    return page.evaluate(() => {
      const msgs = document.querySelectorAll(".sc-chat-msg-bot .sc-chat-msg-text");
      return msgs[msgs.length - 1].textContent;
    });
  };

  const reply = await askAndAwait("How do I get code?", 3);
  check("answers 'how do I get code'", /Get Code|sign in|email/i.test(reply), reply.slice(0, 80));

  const zhReply = await askAndAwait("怎么获取代码？", 5);
  check("answers in Chinese", /获取代码|邮箱|登录/.test(zhReply), zhReply.slice(0, 60));

  // Action button navigates
  const actionBtn = await page.$(".sc-chat-action-btn");
  if (actionBtn) {
    await actionBtn.click();
    await new Promise((r) => setTimeout(r, 800));
    const url = page.url();
    check("action button navigates", url.includes("tab=") || url.includes("view="), url);
  } else {
    check("action button present", false, "none rendered");
  }

  // Drag test
  const bubble = await page.$(".sc-chat-bubble");
  const box = await bubble.boundingBox();
  await page.mouse.move(box.x + 30, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x - 200, box.y - 150, { steps: 8 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 400));
  const pos3 = await page.$eval(".sc-chat-bubble", (el) => ({ x: el.style.left, y: el.style.top }));
  check("bubble is draggable", parseInt(pos3.x) < 500, `${pos3.x},${pos3.y}`);
} catch (err) {
  check("unexpected failure", false, String(err).slice(0, 300));
} finally {
  await browser.close();
}

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
