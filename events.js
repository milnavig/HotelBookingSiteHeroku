var db = require("./db.js");

var get = function() {
  return db.get("events").value();
};

var getByID = function(id) {
  var res = db.get("events").filter({id: id}).value();
  return res[0];
};

module.exports = {
  get: get,
  getByID: getByID
};
