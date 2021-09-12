let db = require("./db.js");
let subscriptions = require("./subscriptions.js");
let moment = require("moment");
let _ = require("lodash");

let formatResponseObject = function(reservation) {
  moment.locale("uk");
  if (reservation) {
    reservation = _.clone(reservation);
    reservation.bookedOn = moment(reservation.bookedOn).format("Do MMMM YYYY");
  }
  return reservation;
};

let get = function() {
  let reservations = db.get("reservations").value();
  return reservations.map(formatResponseObject);
};

let getById = function(id) {
  let reservation = db.get("reservations")
    .filter({id: id})
    .value();
  return reservation[0] || undefined;
};

let getByUser = function(email) {
  let reservations = db.get("reservations")
    .filter({user: email})
    .value();
  return reservations.map(formatResponseObject) || undefined;
};

let make = function(id, user, arrivalDate, arrivalTime, nights, guests, city) {
  moment.locale("uk");
  if (guests > 5 || !user || !arrivalDate || !arrivalTime || !nights || !guests || !city) {
    return false;
  }
  let reservation = {
    "id": id.toString(),
    "user": user,
    "city": city,
    "arrivalDate": moment(new Date(arrivalDate)).format("Do MMMM YYYY"),
    "arrivalTime": arrivalTime,
    "nights": nights,
    "guests": guests,
    "status": "Очікує підтвердження",
    "bookedOn": moment().format(),
    "price": nights * _.random(200, 249)
  };

  db.get("reservations")
    .push(reservation)
    .value();

  return formatResponseObject(reservation);
};

let deleteBooking = function(id) {
  return db.get("reservations").remove({id: id}).value();
};

var confirm = function(id) {
  let reservation = getById(id);
  reservation.status = "Підтверджено";

  subscriptions.notify({
    type: "reservation-confirmation",
    reservation: reservation
  });

  console.log('Updating order');
};

module.exports = {
  get: get,
  getById: getById,
  getByUser: getByUser,
  make: make,
  deleteBooking: deleteBooking,
  formatResponseObject: formatResponseObject,
  confirm: confirm
};

