var InteractiveCM = InteractiveCM || {};

InteractiveCM.MapController = function() {
  "use strict";

  //ICON_URL muss Farbe als String und ".png" angehängt werden
  const NO_COMMENTS_STRING = "<span>Keine Kommentare...</span></br><span>Sei der Erste!</span>", 
    ICON_URL = "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-", 
    SHADOW_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    ICON_SIZE = [25, 41],
    ICON_ANCHOR = [12, 41],
    POPUP_ANCHOR = [1, -34],
    SHADOW_SIZE = [41, 41],
    IS_FAVORITE_BUTTON_ICON = '<i class="material-icons left">star</i>',
    IS_NO_FAVORITE_BUTTON_ICON = '<i class="material-icons left">star_border</i>',
    IMAGE_DEFAULT = "media/grey_sea.png";

  var that = new EventTarget(),
    myMap,
    myMapEl,
    pois = [],
    poiTemplate = document.querySelector("#template_poi");

  function init(map, mapEl) {
    myMap = map;
    myMapEl = mapEl;
    initMapListeners();
    return that;
  }

  function initMapListeners() {
    myMap.addEventListener("click", onMapClick);

    //Wenn ein Popup geöffnet wird wird die gesamte map nicht klickbar gemacht und das Popup dann wieder seperat klickbar gemacht
    myMap.on("popupopen", function () {
      myMapEl.classList.add("not-clickable");
      makePopupsClickable(true);
    });
    //Wenn ein Popup geschlossen wird wird die gesamte map wieder klickbar gemacht
    myMap.on("popupclose", function () {
      myMapEl.classList.remove("not-clickable");
      makePopupsClickable(false);
    });
  }

  function makePopupsClickable(bool) {
    let popups = document.querySelectorAll(".leaflet-popup");
    if(bool) {
      popups.forEach(function(element) {
        element.classList.add("clickable");
      });
    } else {
      popups.forEach(function(element) {
        element.classList.remove("clickable");
      });
    }
  }

  //Klicks auf die Karte werden abgefangen und verarbeitet - latlng gibt die angeklickten Koordinaten wieder
  function onMapClick(e) {
    let event = new Event("onpoiset"),
      coordinates = e.latlng;
    //tauschen
    event.coordinates = coordinates;
    that.dispatchEvent(event);
  }

  //Marker wird an den angeklickten Koordinaten gesetzt
  function drawPOI(id, coordinates, icon, category, title, description, comments, img, shadow) {

    let coloredIcon = createColoredIcon(icon, shadow),
      event = new Event("poisremove"),
      poi = L.marker(coordinates, {
        id: id, 
        icon: coloredIcon, 
        category: category,
        title: title,
        description: description,
        comments: comments,
        img: img, 
      }).addTo(myMap);
    pois.push(poi);
    event.poi = poi;
    event.icon = icon;
    that.dispatchEvent(event);
  }

  function createColoredIcon(color, shadow) {
    let icon = new L.Icon({
          iconUrl: ICON_URL + color + ".png",
          iconSize: ICON_SIZE,
          iconAnchor: ICON_ANCHOR,
          popupAnchor: POPUP_ANCHOR,
          icon: color,
        });
    if (shadow) {
      icon.options.shadowUrl = SHADOW_URL;
      icon.options.shadowSize = SHADOW_SIZE;
    }
    return icon;
  }

  //Eingaben aus dem Editor werden hier in ein HTML-Element übersetzt, welches als Popup-Inhalt genutzt wird
  function updatePopup(poiID, icon, title, description, category, comments, img, fav) {

    console.log(fav);

    let container = $("<div />"),
      commentString = "",
      templateString = poiTemplate.innerHTML.trim(),
      currentPoi = getCurrentPOI(poiID);

    container.on("click", "#submit_comment", function() {
      let input = document.querySelector("#input_comment"),
        comment = input.value.replace("<", "&lt;");
      if (comment.trim() === "") {
        M.toast({html: "You have to write a comment first.", classes: "rounded"});
      } else {
        let event = new Event("commentsubmit"),
          poiToComment = {
          id: poiID,
          comment: comment,
            };
        event.poi = poiToComment;
        that.dispatchEvent(event);
        input.value = "";
      }
    });

    if (img) {
      templateString = templateString.replace(IMAGE_DEFAULT, img);
    }

    templateString = templateString.replace("$KATEGORIE", category);
    templateString = templateString.replace("$TITEL", title);
    templateString = templateString.replace("$BESCHREIBUNG", description);
    if (comments) {
      if (comments.length !== 0) {
        comments.forEach(function(element){
            commentString = commentString.concat("<span class='comments col s12'>" + element + "</span>");
          }
        );
        templateString = templateString.replace("$COMMENTS", commentString);
      } else {
        templateString = templateString.replace("$COMMENTS", NO_COMMENTS_STRING);
      }
    }

    if (fav) {
      if (templateString.includes(IS_NO_FAVORITE_BUTTON_ICON)) {
        templateString = templateString.replace(IS_NO_FAVORITE_BUTTON_ICON, IS_FAVORITE_BUTTON_ICON);
      }
    } else {
      if (templateString.includes(IS_FAVORITE_BUTTON_ICON)) {
        templateString = templateString.replace(IS_FAVORITE_BUTTON_ICON, IS_NO_FAVORITE_BUTTON_ICON);
      }
    }

    container.on("click", "#favorite_button", function() {
      let favButton = $("#favorite_button")[0];
      if (favButton.innerHTML === IS_NO_FAVORITE_BUTTON_ICON) {
        dispatchEventWitchId("onaddfavor", poiID);
      } else {
        dispatchEventWitchId("ondeletefavor", poiID);
      }
    });

    container.on("click", "#delete_button", function() {
        dispatchEventWitchId("ondelete", poiID);
    });

    container.on("click", "#edit_button", function() {
      let event = new Event("onedit");
      event.poiID = poiID;
      event.title = title;
      event.description = description;
      event.img = img;
      event.category = category;
      that.dispatchEvent(event);
    });

    if (icon === "black") {
      templateString = templateString.replace("hidden", "");
      templateString = templateString.replace("hidden", "");
    }

    container.html(templateString);
    currentPoi.bindPopup(container[0], {maxWidth : 500});
  }

  function getCurrentPOI(poiID) {
    let poi;
    pois.forEach(function(element) {
      if (element.options.id === poiID) {
        poi = element;
      }
    });
    return poi;
  }

  function dispatchEventWitchId(eventName, id) {
    let event = new Event(eventName);
      event.poiID = id;
      that.dispatchEvent(event);
  }

  function removeTopLayer(layers) {
    layers.forEach(function(element) {
      myMap.removeLayer(element);
      pois.pop();
    });
  }

  that.init = init;
  that.drawPOI = drawPOI;
  // that.changeColor = changeColor;
  that.updatePopup = updatePopup;
  that.removeTopLayer = removeTopLayer;

  return that;

};
