import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pokemonsFile = require("../src/resources/pokemon-db.json");

pokemonsFile
  .sort(function (pokemon, pokemon2) {
    if (pokemon.sequential_number < pokemon2.sequential_number) {
      return -1;
    }
    if (pokemon.sequential_number > pokemon2.sequential_number) {
      return 1;
    }
    // a deve ser igual a b
    return 0;
  })
  .forEach((pokemon) => console.log(pokemon.sequential_number));
