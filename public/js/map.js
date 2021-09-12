/* eslint-disable */
var map = new OpenLayers.Map("mapdiv");
map.addLayer(new OpenLayers.Layer.OSM());

var lonLat = new OpenLayers.LonLat( 30.5141, 50.4455 )
    .transform(
        new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
        map.getProjectionObject() // to Spherical Mercator Projection
    );     
    
var zoom=14;

var markers = new OpenLayers.Layer.Markers( "Markers" );
map.addLayer(markers);
var size = new OpenLayers.Size(21,25);
var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
var icon = new OpenLayers.Icon("./img/icon-50x50.png", size, offset);
    
markers.addMarker(new OpenLayers.Marker(lonLat, icon));
    
    
map.setCenter (lonLat, zoom);
      
var user_pos_lat;  
var user_pos_lng;  
      
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
    user_pos_lat = position.coords.latitude;
    user_pos_lng = position.coords.longitude;
              
    var user_lonLat = new OpenLayers.LonLat(user_pos_lng, user_pos_lat  )
        .transform(
            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
            map.getProjectionObject() // to Spherical Mercator Projection
            );
            
    markers.addMarker(new OpenLayers.Marker(user_lonLat));
    //console.log(user_pos_lat + " " + user_pos_lng);        
    }, function() {
        console.log(user_pos_lat + " " + user_pos_lng);
    });
} else {
        // Browser doesn't support Geolocation
        console.log("Map Error");
}