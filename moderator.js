let puppeter = require("puppeteer");
let fs = require("fs");

let cfile = process.argv[2];
let usertoAdd = process.argv[3];

(async function () {
  const browser = await puppeter.launch({
    headless: false,
    defaultViewport: null,
    slowMo: 100,
    args: ["--start-maximized", "--disable-notifications"],
  });

  let content = await fs.promises.readFile(cfile);
  let obj = JSON.parse(content);
  let user = obj.un;
  let password = obj.pwd;
  let url = obj.url;

  let pages = await browser.pages();
  let page = pages[0];
  page.goto(url, {
    waitUntil: "networkidle0",
  });
  await page.waitForSelector(".auth-button", {
    visible: true,
  });

  await page.type("#input-1", user);
  await page.type("#input-2", password);
  await page.click(".auth-button");
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  await page.waitForSelector(".profile-menu .ui-icon-chevron-down.down-icon", {
    visible: true,
  });

  await page.click(".profile-menu .ui-icon-chevron-down.down-icon");
  await page.click("a[data-analytics=NavBarProfileDropDownAdministration]");
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  await page.waitForSelector("ul.nav-tabs", {
    visible: true,
  });
  let managetag = await page.$$("ul.nav-tabs li");
  await managetag[1].click();
  await page.waitForSelector("ul.nav-tabs", {
    visible: true,
  });

  let curl = page.url();
  let qidx = 0;
  let questionele = await getQuestionElement(curl, qidx, page);
  while (questionele != undefined) {
    await handleQuestion(questionele, page);
    qidx++;
    questionele = await getQuestionElement(curl, qidx, page);
  }
})();

async function getQuestionElement(curl, qidx, page) {
  await page.goto(curl, { waitUtil: "networkidle0" });
  await page.waitForSelector("ul.nav-tabs", {
    visible: true,
  });

  let pidx = parseInt(qidx / 10);
  qidx = qidx % 10;
  console.log("Reach here");
  let pagingnationbtns = await page.$$(".pagination li");
  let nextpagebtns = await pagingnationbtns[pagingnationbtns.length - 2];
  await page.waitForSelector("ul.nav-tabs", {
    visible: true,
  });

  let classonNextpagebtn = await page.evaluate(function (el) {
    return el.getAttribute("class");
  }, nextpagebtns);

  for (let i = 0; i < pidx; i++) {
    if (classonNextpagebtn !== "disabled") {
      await nextpagebtns.click();

      await page.waitForSelector(".pagination li", {
        visible: true,
      });

      pagingnationbtns = await page.$$(".pagination li");
      nextpagebtns = await pagingnationbtns[pagingnationbtns.length - 2];
      classonNextpagebtn = await page.evaluate(function (el) {
        return el.getAttribute("class");
      }, nextpagebtns);
    } else {
      return undefined;
    }
  }

  let questionElements = await page.$$(".backbone.block-center");

  if (qidx < questionElements.length) {
    let qurl = questionElements[qidx];
    return qurl;
  } else {
    return undefined;
  }
}

async function handleQuestion(questionelement, page) {
  await questionelement.click();

  await page.waitForNavigation({ waitUtil: "networkidle0" });
  await page.waitForSelector("span.tag", {
    visible: true,
  });

  // sleepSync(2000);  // Solution 1

  // Solution 2

  //   let nametext = await browser.findElement(sw.By.css("#name"));
  //   await nametext.sendKeys("kuchbhi");
  //   try {
  //     let dicardbtn = await browser.wait(
  //       sw.until.elementLocated(sw.By.css("#cancelBtn")),
  //       500
  //     );
  //     await dicardbtn.click();
  //   } catch (err) {}

  // Solution 3
  //  waitUntilLoaderDisappers(".tag");
  await page.click("li[data-tab=moderators]");
  await page.waitForSelector("#moderator", {
    visible: true,
  });
  await page.type("#moderator", usertoAdd);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.click(".save-challenge");
}
