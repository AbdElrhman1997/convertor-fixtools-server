const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 8080;
const allRoutes = require("./Routes/allRoutes");

const app = express();
app.use(express.json());

app.use(cors());
app.options("*", cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json"
  );
  next();
});

app.use("/api", allRoutes);
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));

//ERR_DIR_CLOSED
app.listen(port, () =>
  console.log(
    `Server is running in ${process.env.APP_ENV} mode on port ${port}`
  )
);
