require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require('cookie-parser')
const connection = require("./db");
const bodyParser = require('body-parser');

// database connection
connection();


//Middle wares
app.use(cookieParser());
app.use(bodyParser.urlencoded({limit:'30mb', extended: true}));
app.use(
  cors({
    origin: ["http://localhost:3000", 'https://mern-stack-email-verification-login-app.onrender.com'],
    credentials: true,
  })
);
app.use(express.json());


// routes
app.use("/api/users", require('./routes/userRoutes'));

const port = process.env.PORT || 3500;
app.listen(port, console.log(`Listening on port ${port}...`));
