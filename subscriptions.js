let db = require("./db.js");
let webpush = require("web-push");

let pushKeys = require("./push-keys.js");

let add = function(subscription) {
  // Make sure subscription doesn't already exist
  let existingSubscriptions = db.get("subscriptions")
    .filter({endpoint: subscription.endpoint})
    .value();
  if (existingSubscriptions.length > 0) {
    return;
  }

  // Add the new subscription
  db.get("subscriptions")
    .push(subscription)
    .value();
};

let notify = function(pushPayload) {
  let reservation = pushPayload["reservation"];
  let user = reservation["user"];

  pushPayload = JSON.stringify(pushPayload);
  webpush.setGCMAPIKey(pushKeys.GCMAPIKey);
  webpush.setVapidDetails(
    pushKeys.subject,
    pushKeys.publicKey,
    pushKeys.privateKey
  );

  let subscriptions = db.get("subscriptions").filter({ user: user }).value();
  subscriptions.forEach(function(subscription) {
    delete subscription["user"];
    webpush
      .sendNotification(subscription, pushPayload)
      .then(function() {
        console.log("Notification sent");
      })
      .catch(function() {
        console.log("Notification failed");
      });
  });
};

module.exports = {
  add: add,
  notify: notify
};
