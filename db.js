const low = require("lowdb"); // Small JSON database for Node, Electron and the browser.
const db = low("./db.json");

// Populate database with data from fixtures
db
  .defaults({
    reservations: require("./fixtures/reservations.js"),
    events: require("./fixtures/events.js"),
    subscriptions: [],
    users: [{
      "id": 0,
      "email": "alex@gmail.com",
      "name": "alex",
      "password": "12345"
    },
    {
      "id": 1,
      "email": "alex2@gmail.com",
      "name": "alex2",
      "password": "12345"
    }]
  })
  .value();

module.exports = db;
