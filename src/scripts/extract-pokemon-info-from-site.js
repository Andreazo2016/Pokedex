import * as cheerio from "cheerio";
import fetch from "node-fetch";
import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getImageURl(page, xpath) {
  const [element] = await page.$x(xpath);
  const result = await element.evaluate((e) => e.src);
  return result;
}

async function getSingleValue(page, xpath) {
  const [element] = await page.$x(xpath);
  const result = await element.evaluate((e) => e.textContent);
  return result;
}

async function getNestedValueWithAncor(page, xpath) {
  const [element] = await page.$x(xpath);
  const result = await element.evaluate((e) => {
    const values = [];
    e.querySelectorAll("a").forEach((n) => {
      const value = n.textContent;
      if (value) {
        values.push(value);
      }
    });
    return values;
  });
  return result;
}

async function createPokemon(page, position) {
  const xPathName = `//*[@id="main"]/h1`;
  const xPathImage = `//*[@id="tab-basic-${position}"]/div[1]/div[1]/p[1]/a/img`;
  const xPathsequentialNumber = `//*[@id="tab-basic-${position}"]/div[1]/div[2]/table/tbody/tr[1]/td/strong`;
  const xPathTypes = `//*[@id="tab-basic-${position}"]/div[1]/div[2]/table/tbody/tr[2]/td`;
  const XPathSpecie = `//*[@id="tab-basic-${position}"]/div[1]/div[2]/table/tbody/tr[3]/td`;
  const XPathHeight = `//*[@id="tab-basic-${position}"]/div[1]/div[2]/table/tbody/tr[4]/td`;
  const XPathWeight = `//*[@id="tab-basic-${position}"]/div[1]/div[2]/table/tbody/tr[5]/td`;
  const XPathTypeDefenses01 = `//*[@id="tab-basic-${position}"]/div[2]/div[2]/div/table[1]`;
  const XPathTypeDefenses02 = `//*[@id="tab-basic-${position}"]/div[2]/div[2]/div/table[2]`;
  const XPathAbilities = `//*[@id="tab-basic-${position}"]/div[1]/div[2]/table/tbody/tr[6]/td`;
  const [
    name,
    url_image,
    sequential_number,
    types,
    specie,
    height,
    weight,
    type_defenses_01,
    type_defenses_02,
    abilities,
  ] = await Promise.all([
    getSingleValue(page, xPathName), //name
    getImageURl(page, xPathImage), //url_image
    getSingleValue(page, xPathsequentialNumber), //sequential_number
    getNestedValueWithAncor(page, xPathTypes), //types
    getSingleValue(page, XPathSpecie), //specie
    getSingleValue(page, XPathHeight), //height
    getSingleValue(page, XPathWeight), //weight
    getNestedValueWithAncor(page, XPathTypeDefenses01), //type_defenses_01
    getNestedValueWithAncor(page, XPathTypeDefenses02), //type_defenses_02
    getNestedValueWithAncor(page, XPathAbilities), //abilities
  ]);
  return {
    name,
    sequential_number,
    types,
    url_image,
    specie,
    height,
    weight,
    type_defenses: [...type_defenses_01, ...type_defenses_02],
    abilities,
  };
}

async function saveFile(pokemons) {
  try {
    const pathToSave = resolve(__dirname, "..", "resources", "pokemon-db.json");
    await writeFile(pathToSave, pokemons, { encoding: "utf-8" });
  } catch (error) {
    console.log(error);
  }
}

async function getPokemonInfo(links) {
  const datas = [];
  const browser = await puppeteer.launch();
  for (const link of links) {
    for (const pokemon of link.pokemons) {
      const page = await browser.newPage();
      await page.goto(pokemon.url, {
        waitUntil: "networkidle2",
      });

      const pokemonCreated = await createPokemon(page, pokemon.position);
      datas.push({ ...pokemonCreated, url_site: pokemon.url });
    }
  }
  await browser.close();
  await saveFile(JSON.stringify(datas));
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

function getPokemonLinks(htmlPage) {
  const $ = cheerio.load(htmlPage);
  const links = [];
  $(".infocard-list.infocard-list-pkmn-lg").each((i, div) => {
    const hrefs = [];
    div.childNodes.forEach((element) => {
      const link = $(element).find("a").attr("href");
      let position = $(element).find("small").first().text();
      if (link && position) {
        position = position.replace("#", "");
        hrefs.push({ url: link, position });
      }
    });
    links.push(hrefs);
  });
  return links.map((link, index) => ({
    generation: index + 1,
    pokemons: link.map((pokemon) => ({
      url: `https://pokemondb.net${pokemon.url}`,
      position: pokemon.position,
    })),
  }));
}

async function run() {
  // const BASE_URL = "https://pokemondb.net/pokedex/national";
  // const html = await getHtmlSourceFrom(BASE_URL);
  // const data = getPokemonLinks(html);
  // console.log(data);

  await getPokemonInfo([
    {
      pokemons: [
        { url: "https://pokemondb.net/pokedex/bulbasaur", position: 1 },
      ],
    },
  ]);
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
