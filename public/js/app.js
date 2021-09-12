// Service Worker
if ("serviceWorker" in navigator) { // Свойство только-для-чтения Navigator.serviceWorker возвращает объект ServiceWorkerContainer, который предоставляет доступ к регистрации, удалению, обновлению и взаимодействию с объектами ServiceWorker для соответствующего документа.
  navigator.serviceWorker.register("/serviceworker.js")
    .then(function(registration) {
      console.log("Service Worker registered with scope:", registration.scope);
    }).catch(function(err) {
      console.log("Service worker registration failed:", err);
    });
}

navigator.serviceWorker.addEventListener("message", function (event) {
  let data = event.data;
  if (data.action === "nav-to-sign-in") {
    window.location.href = data.url;
  } else if (data.action === "update-reservation") {
    updateReservationDisplay(data.reservation);
  }
});

getAuth().then(function(auth) {
  console.log(auth);
  if (auth == "no_auth") {
    window.location.href = process.env.SERVER_URL + "/login";
  }
});

$("#leave").click(function(event) {
  //deleteAuth();
  indexedDB.deleteDatabase("site-reservations");
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({action: "leave-account"});
  }
});

$(document).ready(function() {
  // Fetch and render upcoming events in the hotel
  $.getJSON("/events.json", renderEvents);
});

// RENDER

let renderEvents = function(data) {
  data.forEach(function(event) {
    $(
      "<div class=\"col-lg-12 col-md-12 col-sm-12 event-container\"><div class=\"event-card\"><div id=\"big-block\">"+
      "<img src=\""+event.img+"\" alt=\""+event.title+"\" class=\"img-responsive img-size\" />"+
      "<div id=\"event-block\"><h4>"+event.title+"</h4>"+
      "<p>"+event.description+"</p>"+
      "<button class=\"details\" id=\"news-"+event.id+"\">Докладніше</button></div></div>"+
      "<div class=\"event-date\">"+event.date+"</div>"+
      "</div></div>"
    ).insertBefore("#events-container div.calendar-link-container");
    $("#news-"+event.id).click(function() {
      window.location.href = "/news/"+event.id;
    });
  });
};


