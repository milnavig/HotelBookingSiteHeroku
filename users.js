let db = require("./db.js");

let get = function() {
  let users = db.get("users").value();
  return users;
};

let getByEmail = function(email) {
  let user = db.get("users")
    .filter({email: email})
    .value();
  
  return user[0] || undefined;
};

let make = function(email, name, phone, password) {
  if (!email || !name || !phone || !password) {
    return false;
  }
  let user = {
    "email": email,
    "name": name,
    "phone": phone,
    "password": password
  };

  db.get("users")
    .push(user)
    .value();

  return user;
};

module.exports = {
  get: get,
  getByEmail: getByEmail,
  make: make
};