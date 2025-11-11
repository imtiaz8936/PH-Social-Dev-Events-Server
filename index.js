const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

app.listen(port, () => {
  console.log("social DB is running on port:", port);
});
