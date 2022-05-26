import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function saveFile(abilities) {
  try {
    const pathToSave = resolve(
      __dirname,
      "..",
      "resources",
      "abilities-db.json"
    );
    await writeFile(pathToSave, abilities, { encoding: "utf-8" });
  } catch (error) {
    console.log(error);
  }
}
async function getHtmlSourceFrom(url) {
  try {
    const response = await fetch(url);
    const htmlPageSource = await response.text();
    return htmlPageSource;
  } catch (error) {
    console.error(`error get page from ${url}`, error.message);
  }
}
async function getABilities() {
  const BASE_URL = "https://pokemondb.net/ability";
  const html = await getHtmlSourceFrom(BASE_URL);
  const $ = cheerio.load(html);

  const tbody = $("#abilities > tbody");
  const trs = tbody.find("tr");
  const abilities = [];
  trs.each((i, el) => {
    const ability = $(el).find("a").first().text();
    const description = $(el).find(".cell-med-text").first().text();
    abilities.push({ ability, description });
  });
  return abilities;
}
async function run() {
  const abilities = await getABilities();
  await saveFile(JSON.stringify(abilities));
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
