navigator.serviceWorker.addEventListener("message", function (event) {
  if (event.data.action === "update-list") {
    //$("#reservation-cards").empty();
    renderReservation(event.data.reservation);
  }
});

$(document).ready(function() {
  // Fetch and render user reservations
  populateReservations();

  // Add booking widget functionality
  $("#reservation-form").submit(function(event) { //Событие "submit" отправляется к элементу, когда пользователь пытается отправить форму. 
    event.preventDefault(); //обрывает действие события
    var city = $("#form--city").val();
    var arrivalDate = $("#form--arrival-date").val();
    var arrivalTime = $("#form--arrival-time").val();
    var nights = $("#form--nights").val();
    var guests = $("#form--guests").val();
    var id = Date.now().toString().substring(3, 11);
    if (!city || !arrivalDate || !arrivalTime || !nights || !guests) {
      return false;
    }
    getAuth().then(function(auth) {addReservation(id, auth, arrivalDate, arrivalTime, nights, guests, city);});
    return false;
  });

  // Periodically check for unconfirmed bookings
  setInterval(checkUnconfirmedReservations, 4000); // возможно можно убрать, так как есть PostMessage который кинет ивент когда обновится (не можно)
});

// Fetches reservations from server and renders them to the page
var populateReservations = function() {
  getReservations().then(function(reservations) {
    renderReservations(reservations);
  });
};

// Go over unconfirmed reservations, and verify their status against the server.
var checkUnconfirmedReservations = function() { 
  $(".reservation-card--unconfirmed").each(function() {
    
    fetch("/reservation-details.json?id=" + $(this).data("id")).then(function(data) {
      data.json().then(function(data) {
        updateInObjectStore("reservations", data.id, data);
        console.log("This data " + data);
        updateReservationDisplay(data);
      });
    });
    navigator.serviceWorker.ready.then(function(registration) {
      registration.sync.getTags().then(function(tags) {
        console.log(tags);
      });
    });
  });
};

var urlBase64ToUint8Array = function(base64String) {
  var padding = "=".repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

var subscribeUserToNotifications = function() {
  Notification.requestPermission().then(function(permission){
    if (permission === "granted") {
      var subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          "BKMDPf4ngwXUbx0FjBAX-vpJTGDoI3ZOfVnEPTf74n5nVyYUU3A2wJWmykzgLOgwzIVCFH4CqQyLOs5JYjpNX2g"
        )
      };
      navigator.serviceWorker.ready.then(function(registration) {
        return registration.pushManager.subscribe(subscribeOptions);
      }).then(function(subscription) {
        getAuth().then(function(auth) {
          var subscription_json = subscription.toJSON();
          subscription_json["user"] = auth;
          var fetchOptions = {
            method: "post",
            headers: new Headers({
              "Content-Type": "application/json"
            }),
            body: JSON.stringify(subscription_json)
          };
          return fetch("/add-subscription", fetchOptions);
        });
      });
    }
  });
};

var offerNotification = function() {
  if ("Notification" in window &&
      "PushManager" in window &&
      "serviceWorker" in navigator) {
    if (Notification.permission !== "granted") {
      showNotificationOffer();
    } else {
      subscribeUserToNotifications();
    }
  }
};

var notifyAboutBooking = function() {
  navigator.serviceWorker.ready.then(function(registration) {
    /*
    registration.showNotification("Ваше бронювання отримано", {
      body:
        "Дякуємо за користування нашим сервісом.\n"+
        "Ви отримаєте сповіщення, як тільки бронювання буде оброблене.",
      icon: "/img/event-book.jpg",
      badge: "/img/icon-hotel.png",
      tag: "new-booking"
    });*/
  });
};

// Adds a reservation as pending to the DOM, and try to contact server to book it.
var addReservation = function(id, user, arrivalDate, arrivalTime, nights, guests, city) {
  var reservationDetails = {
    id:           id,
    user:         user,
    city:         city,
    arrivalDate:  arrivalDate,
    arrivalTime:  arrivalTime,
    nights:       nights,
    guests:       guests,
    status:       "Відправлення"
  };
  addToObjectStore("reservations", reservationDetails);
  renderReservation(reservationDetails);
  
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({action: "new-reservation", reservation: reservationDetails});
  }
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then(function(registration) {
      registration.sync.register("sync-reservations");
    });
  } else {
    $.getJSON("/make-reservation", reservationDetails, function(data) {
      updateReservationDisplay(data);
      updateInObjectStore("reservations", data.id, data); 
    });
  }
  offerNotification();
  notifyAboutBooking();
};

// Goes over an array of reservations, and renders each of them
var renderReservations = function(reservations) {
  $("div#reservation-loading").hide();
  reservations.forEach(function(reservation) {
    renderReservation(reservation);
  });
};

// Renders a reservation card and adds it to the DOM.
var renderReservation = function(reservation) {
  var newReservation = $(
    "<div class=\"reservation-card\" id=\"reservation-"+reservation["id"]+"\" data-id=\""+reservation["id"]+"\">"+
      "<img src=\"/img/event-book.jpg\" alt=\"BookHotel\" class=\"reserved-hotel-image\">"+
      "<div class=\"reservation-details\">"+
        "<div class=\"reserved-hotel-details\">"+
          "<strong>Book Hotel</strong>"+
          "<p>вул. Гарматна, 56, м. Київ</p>"+
          "<p class=\"arrivalDate\">Реєстрація: <span>"+reservation["arrivalDate"]+" "+reservation["arrivalTime"]+"</span>.</p>"+
          "<p>"+reservation["nights"]+" ночей. "+reservation["guests"]+" гостей.</p>"+
        "</div>"+
        "<div class=\"reservation-price\">"+
          "<p>Сумарна ціна</p>"+
          "<p><strong>"+(reservation["price"] ? reservation["price"]+".99"+" ₴" : "?")+"</strong></p>"+
        "</div>"+
      "</div>"+
      "<div class=\"reservation-actions\">"+
        "<a href=\"#\">Скасувати</a>"+
        "<div class=\"reservation-status\">"+reservation["status"]+"</div>"+
      "</div>"+
      "<div class=\"reservation-meta-data\">"+
        "<strong>Номер бронювання:</strong> <span>"+reservation["id"]+"</span>"+
        "<strong>Дата замовлення:</strong> <span class=\"reservation-bookedOn\">"+(reservation["bookedOn"] ? reservation["bookedOn"] : "n/a")+"</span>"+
      "</div>"+
    "</div>"
  );
  $("#reservation-cards").prepend(newReservation); //Insert content, specified by the parameter, to the beginning of each element in the set of matched elements.
  if (reservation["status"] !== "Підтверджено") {
    newReservation.addClass("reservation-card--unconfirmed");
  }

  // Adds an event listener to the modify reservation button.
  $("#reservation-"+reservation["id"]+" a").click(function() { 
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      $("#reservation-"+reservation["id"]).remove();
      navigator.serviceWorker.ready.then(function(registration) {
        registration.sync.register("deletion-"+reservation["id"]);
      });
    } else {
      var bookID = {id: reservation["id"]};
      $.getJSON("/remove-bookings", bookID, function (res) {
        deleteBooking(reservation["id"]);
        $("#reservation-"+reservation["id"]).remove();
      });
    }
  });
};

var updateReservationDisplay = function(reservation) {
  var reservationNode = $("#reservation-" + reservation.id);
  $(".reservation-bookedOn", reservationNode).text(reservation.bookedOn);
  $(".reservation-price strong", reservationNode).text(reservation.price+".99" + " ₴");
  $(".reservation-status", reservationNode).text(reservation.status);
  $(".arrivalDate span", reservationNode).text(reservation.arrivalDate);
  if (reservation["status"] !== "Підтверджено") {
    reservationNode.addClass("reservation-card--unconfirmed");
  } else {
    reservationNode.removeClass("reservation-card--unconfirmed");
  }
};

var showNotificationOffer = function() {
  $("#offer-notification").removeClass("modal--hide");
};

var hideNotificationOffer = function() {
  $("#offer-notification").addClass("modal--hide");
};

$("#offer-notification a").click(function(event) {
  event.preventDefault();
  hideNotificationOffer();
  subscribeUserToNotifications();
});

$(document).ready(function() {
  // Prepopulate reservation form from querystring and create reservation
  var url = new URL(window.location); //The window.location object can be used to get the current page address (URL)
  var params = url.searchParams; //https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
  if (
    params.has("form--city") &&
    params.has("form--arrival-date") &&
    params.has("form--arrival-time") &&
    params.has("form--nights") &&
    params.has("form--guests")
  ) {
    $("#form--city").val(params.get("form--city"));
    $("#form--arrival-date").val(params.get("form--arrival-date"));
    $("#form--arrival-time").val(params.get("form--arrival-time"));
    $("#form--nights").val(params.get("form--nights"));
    $("#form--guests").val(params.get("form--guests"));
    $("form#reservation-form").submit();
    window.history.replaceState(null, "", url.origin + url.pathname); //???
  }
});
