$("#button").click(function(event) {
  event.preventDefault();
  //console.log($("#email").val());
  $.getJSON("/users.json", {email: $("#email").val()}, function(data) {
    if (data !== undefined) {
      console.log(data);
      console.log('Hi');
      //document.cookie = "user=" + encodeURIComponent(data.email);
      addToObjectStore("auth", {status: "loggined", email: data.email}).then(function(auth) {window.location.href = process.env.SERVER_URL;});
      
    } else {
        // variant
    }
    //console.log(document.cookie);
  });
});

$("#button-reg").click(function(event) {
  event.preventDefault();
  //console.log($("#email").val());
  if ($("#email").val() && $("#name").val() && $("#phone").val() && $("#password").val()) {
    $.getJSON("/registration.json", {email: $("#email").val(), name: $("#name").val(), phone: $("#phone").val(), password: $("#password").val()}, function(data) {
      if (data !== null) {
        window.location.href = process.env.SERVER_URL + "/login";
      } else {
        // variant
      }
    });
  }
});

function getCookie(name) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

//console.log(getCookie("user"));