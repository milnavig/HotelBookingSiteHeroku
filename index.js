require('dotenv').config();
let express = require("express");
let reservations = require("./reservations.js");
let subscriptions = require("./subscriptions.js");
let events = require("./events.js");
let users = require("./users.js");
let app = express(); // создаем объект приложения
let port = process.env.PORT || 8443;
let favicon = require("serve-favicon");
const path = require("path");


app.use(express.json()); // support parsing of application/json type post data

// Define routes
app.use(express.static("public"));

app.use(favicon(path.join(__dirname,"./public/img/logo-48x48.ico")));

app.get("/", function(req, res) {
  res.sendFile("index.html", {root: "public"});
});

app.get("/login", function(req, res) {
  res.sendFile("login.html", {root: "public"});
});

app.get("/registration", function(req, res) {
  res.sendFile("registration.html", {root: "public"});
});

app.get("/bookings", function(req, res) {
  res.sendFile("bookings.html", {root: "public"});
});

app.get("/contacts", function(req, res) {
  res.sendFile("contacts.html", {root: "public"});
});

app.get("/news/:newsID", function(req, res) {
  res.sendFile("news.html", {root: "public"});
});

app.get("/get-news", function(req, res) {
  //console.log(events.getByID(req.query.id));
  res.json(events.getByID(req.query.id));
});

app.get("/reservations.json", function(req, res) {
  //res.json(reservations.get());
  res.json(reservations.getByUser(req.query["user"]));
});

app.get("/reservation-details.json", function(req, res) {
  //var reservation = reservations.getById(req.query["id"]);
  let reservation = reservations.getById(req.query.id);
  res.json(reservations.formatResponseObject(reservation));
});

app.get("/events.json", function(req, res) {
  res.json(events.get());
});

app.get("/users.json", function(req, res) {
  let user = users.getByEmail(req.query["email"]);
  res.json(user);
});

app.get("/registration.json", function(req, res) {
  let email = req.query["email"];
  let name = req.query["name"];
  let phone = req.query["phone"];
  let password = req.query["password"];
  let user = users.make(email, name, phone, password);
  res.json(user);
});

app.get("/make-reservation", function(req, res) {
  let id = req.query["id"] || Date.now().toString().substring(3, 11);
  let user = req.query["user"];
  let city = req.query["city"] || req.query["form--city"];
  let arrivalDate = req.query["arrivalDate"] || req.query["form--arrival-date"];
  let arrivalTime = req.query["arrivalTime"] || req.query["form--arrival-time"];
  let nights = req.query["nights"] || req.query["form--nights"];
  let guests = req.query["guests"] || req.query["form--guests"];
  let reservationStatus = reservations.make(id, user, arrivalDate, arrivalTime, nights, guests, city);
  console.log("Making a reservation!!!");

  // reservations are automatically confirmed 5 seconds after booking time
  this.setTimeout(function() {
    reservations.confirm(String(id));
  }, 5000);

  res.json(reservationStatus);
});

app.get("/remove-bookings", function(req, res) {
  var id = req.query["id"];
  var resDel = reservations.deleteBooking(id);

  res.json(resDel);
});

app.post("/add-subscription", function(req, res) {
  subscriptions.add(req.body);
  res.json();
});

// Start the server
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});