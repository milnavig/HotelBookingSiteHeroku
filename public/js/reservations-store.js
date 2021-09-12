var DB_VERSION = 3;
var DB_NAME = "site-reservations";

if (navigator.storage && navigator.storage.persist) { // что-бы никогда не удаляло БД
  navigator.storage.persist().then(function(granted) {
    if (granted) {
      console.log("Data will not be deleted automatically");
    }
  });
}

let openDatabase = function() {
  return new Promise(function(resolve, reject) {
    // Make sure IndexedDB is supported before attempting to use it
    if (!self.indexedDB) {
      reject("IndexedDB not supported");
    }
    let request = self.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = function(event) {
      reject("Database error: " + event.target.error);
    };

    request.onupgradeneeded = function(event) {
      let db = event.target.result;
      let upgradeTransaction = event.target.transaction;
      let reservationsStore;
      let reservationsStore_Auth;
      if (!db.objectStoreNames.contains("reservations")) {
        reservationsStore = db.createObjectStore("reservations",
          { keyPath: "id" }
        );
      } else {
        reservationsStore = upgradeTransaction.objectStore("reservations");
      }
        
      if (!db.objectStoreNames.contains("auth")) { // !!!!!!!!!
        reservationsStore_Auth = db.createObjectStore("auth",
          { keyPath: "email" }
        );
      } else {
        reservationsStore_Auth = upgradeTransaction.objectStore("auth");
      }

      if (!reservationsStore.indexNames.contains("idx_status")) {
        reservationsStore.createIndex("idx_status", "status", { unique: false });
      }
        
      if (!reservationsStore_Auth.indexNames.contains("idx_status")) { // !!!
        reservationsStore_Auth.createIndex("idx_status", "status", { unique: false });
      }
    };

    request.onsuccess = function(event) {
      resolve(event.target.result);
    };
  });
};

let openObjectStore = function(db, storeName, transactionMode) {
  return db
    .transaction(storeName, transactionMode)
    .objectStore(storeName);
};

let addToObjectStore = function(storeName, object) {
  return new Promise(function(resolve, reject) {
    
    openDatabase().then(function(db) {
      
      openObjectStore(db, storeName, "readwrite")
        .add(object).onsuccess = resolve;
    }).catch(function(errorMessage) {
      reject(errorMessage);
    });
  });
};

let updateInObjectStore = function(storeName, id, object) {
  return new Promise(function(resolve, reject) {
    openDatabase().then(function(db) {
      openObjectStore(db, storeName, "readwrite")
        .openCursor().onsuccess = function(event) {
          var cursor = event.target.result;
          if (!cursor) {
            reject("Reservation not found in object store");
          }
          if (cursor.value.id === id) {
            cursor.update(object).onsuccess = resolve;
            return;
          }
          cursor.continue();
        };
    }).catch(function(errorMessage) {
      reject(errorMessage);
    });
  });
};

/*
function getCookie(name) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}*/

let getReservations = function(indexName, indexValue) {
  let now = new Date();
  let time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + ":" + now.getMilliseconds();
  //console.log("Початок отримання з БД: " + time);
  //$("#battery-info").prepend("<p>Початок отримання з БД: "+ time +" </p>");
  return new Promise(function(resolve) {
    openDatabase().then(function(db) {
      let objectStore = openObjectStore(db, "reservations");
      let reservations = [];
      let cursor;
      if (indexName && indexValue) {
        cursor = objectStore.index(indexName).openCursor(indexValue);
      } else {
        cursor = objectStore.openCursor();
      }
      cursor.onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          reservations.push(cursor.value);
          cursor.continue();
        } else {
          let now = new Date();
          let time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + ":" + now.getMilliseconds();
          //console.log("Кінець отримання з БД: " + time);
          //$("#battery-info").prepend("<p>Кінець отримання з БД: "+ time +" </p>");
          //console.log(reservations.length);
          if (reservations.length > 0) {
            resolve(reservations);
          } else {
            getReservationsFromServer().then(function(reservations) {
              let now = new Date();
              let time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + ":" + now.getMilliseconds();
              //console.log("Початок запису у БД: " + time);
              //$("#battery-info").prepend("<p>Початок запису у БД: "+ time +" </p>");
              openDatabase().then(function(db) {
                let objectStore = openObjectStore(db, "reservations", "readwrite");
                for (var i = 0; i < reservations.length; i++) {
                  objectStore.add(reservations[i]);
                }
                let now = new Date();
                let time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + ":" + now.getMilliseconds();
                //console.log("Кінець запису у БД: " + time);
                //$("#battery-info").prepend("<p>Кінець запису у БД: "+ time +" </p>");
                resolve(reservations);
              });
              caches.open("site-cache-v1").then(function(cache) {
                cache.put("/reservations.json", new Response(reservations));
              });
            });
          }
        }
      };
    }).catch(function() {
      getReservationsFromServer().then(function(reservations) {
        resolve(reservations);
      });
    });
  });
};

let getReservationsFromServer = function() {
  return new Promise(function(resolve) {
    if (self.$) {
      //$.getJSON("/reservations.json", resolve);
      getAuth().then(function(auth) {$.getJSON("/reservations.json", {user: auth}, resolve);});
      
    } else if (self.fetch) {
      getAuth().then(function(auth) {
        fetch("/reservations.json", {user: "alex@gmail.com"}).then(function(response) { // не уверен что можно добавлять второй аргумент fetch("/reservations.json", {user: getCookie("user")})
          return response.json();
        }).then(function(reservations) {
          resolve(reservations);
        });
      });
      
    }
  });
};

let getAuth = function() { 
  return new Promise(function(resolve) {
    openDatabase().then(function(db) {
      let objectStore = openObjectStore(db, "auth");
      let auths = [];
      let cursor;
      
      cursor = objectStore.index("idx_status").openCursor("loggined");
      cursor = objectStore.openCursor();
      
      cursor.onsuccess = function(event) {
        let cursor = event.target.result;
        if (cursor) {
          auths.push(cursor.value.email);
          cursor.continue();
        } else {
          if (auths.length > 0) {
            resolve(auths[0]);
          } else {
            resolve("no_auth");
          }
        }
      };
    }).catch(function() {
      console.log("Auth Error");
    });
  });
};

let deleteAuth = function() { 
  return new Promise(function(resolve) {
    openDatabase().then(function(db) {
      db.transaction("auth", "readwrite")
        .objectStore("auth")
        .clear()
        .onsuccess = function(event) {
          console.log("Object store cleared");
        };
      
    }).catch(function() {
      console.log("Delete Auth Error");
    });
  });
};

let deleteBooking = function(id) { 
  return new Promise(function(resolve, reject) {
    openDatabase().then(function(db) {
      db.transaction("reservations", "readwrite")
        .objectStore("reservations")
        .openCursor().onsuccess = function(event) {
          let cursor = event.target.result;
          if (!cursor) {
            reject("Reservation not found in object store");
          }
          if (cursor.value.id === id) {
            cursor.delete().onsuccess = resolve;
            return;
          }
          cursor.continue();
        };
    }).catch(function(errorMessage) {
      reject(errorMessage);
    });
  });
};
