const app = require("./app");
const env = require("./config");

const PORT = env.PORT || 3000;

// console.log(env.databaseHost);
app.listen(PORT, () => {
  console.log(`app listening on ${PORT}`);
});
