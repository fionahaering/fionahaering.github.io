var InteractiveCM = InteractiveCM || {};

InteractiveCM.MapView = function() {
  "use strict";

  const UR_LAT = 48.995912,
    UR_LNG = 12.095406,
    ZOOM_LVL = 17;

  var mymap,
      that = new EventTarget(),
      bounds = new L.LatLngBounds(new L.LatLng(48.991728, 12.096711), new L.LatLng(49.007750, 12.095804));

  function init() {
    return that;
  }

  //Map wird erstellt und zentriert auf die UR angezeigt --Leaflet Code--
  function createMap() {
    var osm = L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors",
    }),
      satellit = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    }),
      baseLayers = {
      "OSM": osm,
      "Satellit": satellit,
    };

    mymap = L.map("mapid",{
      layers: osm,
      minZoom: 17, maxZoom: 18,
    }).setView([UR_LAT, UR_LNG], ZOOM_LVL);
    mymap.setMaxBounds(bounds);

    L.control.layers(baseLayers).addTo(mymap);
    return mymap;
  }

  that.init = init;
  that.createMap = createMap;
  return that;
};
