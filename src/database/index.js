import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
  database: "pokedex-bd",
  host: "localhost",
  username: "postgres",
  password: "postgres",
  dialect: "postgres",
});

try {
  await sequelize.authenticate();
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

export default sequelize;
