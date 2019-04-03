var InteractiveCM = InteractiveCM || {};

InteractiveCM.App = function() {
  "use strict";

  var that = {},
    background,
    mapView,
    sidenavController,
    editorController,
    loginController,
    mapController,
    storage,
    searchedPOIs = [],
    filteredPOIsToErase = [],
    filteredPOIs = [],
    ownPOIs = [],
    allPOIs = [],
    favoredPOIs = [],
    favsToFilter = [];

  function init(){
    initBackground();
    initMapView();
    initMapController();
    initSidenavController();
    initFirebase();
    initEditorController();
    initLoginController();
  }

  function initBackground() {
    //background wird benutzt um den Hintergund nicht klickbar zu machen
    background = document.querySelector("#main");
  }

  function initMapView() {
    background.classList.remove("not-clickable");
    mapView = InteractiveCM.MapView().init();
  }

  function initMapController() {
    let map = mapView.createMap(),
      mapEl = document.querySelector("#mapid");
    mapController = InteractiveCM.MapController().init(map, mapEl);
    mapController.addEventListener("onpoiset", showEditor);
    mapController.addEventListener("poisremove", addPoisToRemove);
    mapController.addEventListener("commentsubmit", onSubmitCommentButtonClicked);
    mapController.addEventListener("ondelete", onDelete);
    mapController.addEventListener("onedit", onEdit);
    mapController.addEventListener("onaddfavor", onAddFavor);
    mapController.addEventListener("ondeletefavor", onDeleteFavor);
  }

   function initSidenavController() {
    let sidenavEl = document.querySelector("#slide_out");
    sidenavController = InteractiveCM.SidenavController().init(sidenavEl);
    sidenavController.addEventListener("onlogin", showLogin);
    sidenavController.addEventListener("onlogout", onLogout);
    sidenavController.addEventListener("onfilter", onFilterButtonClicked);
    sidenavController.addEventListener("onfavs", filterFavs);
    sidenavController.addEventListener("onsearch", onSearchEntered);
  }

  function initFirebase() {
    storage = InteractiveCM.Storage().init();
    storage.getStandardPOIsFromDatabase();
    storage.addEventListener("onpoisloaded", updateAndDrawPOI);
    storage.addEventListener("onpoisfiltered", processFiltering);
    storage.addEventListener("filters", processFiltering);
    storage.addEventListener("onpoisearched", processSearch);
    storage.addEventListener("onownpoisloaded", updateAndDrawPOI);
    storage.addEventListener("favsloaded", updateFavs);
    storage.addEventListener("onloginsuccessfull", onLoginSuccessfull);
    storage.addEventListener("onsingleFav", updateAndDrawPOI);
    storage.addEventListener("onsinglePOI", updatePopupForComments);
    storage.addEventListener("onpoipushed", onNewPOIPushed);
  }

  function initEditorController() {
    let editorWindowEl = document.querySelector("#marker_editor");
    editorController = InteractiveCM.EditorController().init(editorWindowEl, background);
    editorController.addEventListener("onconfirm", onInputConfirmed);
  }

  function initLoginController() {
    let loginWindowEl = document.querySelector("#login_window");
    loginController = InteractiveCM.LoginController().init(loginWindowEl, background);
    loginController.addEventListener("onregister", onRegister);
    loginController.addEventListener("onlogin", onLoginButton);
  }

  //Ende der init-Funktionen

  function showEditor(event) {
    let coordinates = event.coordinates;
    editorController.readCoordinates(coordinates);
    editorController.showEditor();
    background.classList.add("not-clickable");
  }

  function showLogin() {
    loginController.showLogin();
    background.classList.add("not-clickable");
  }

  function filterFavs() {
    if (favsToFilter.length !== 0) {
      eraseTopLayer(favsToFilter);
      favsToFilter = [];
    } else {
      favoredPOIs.forEach(function(element) {
        storage.getPOIsFromDatabase(element, true);
      });
    }
  }

  function updatePopupForComments(event) {
    mapController.updatePopup(event.poi.id, event.poi.icon, event.poi.title, event.poi.description, event.poi.category, event.poi.comments, event.poi.img, event.poi.fav);
  }

  function updateAndDrawPOI(event) {
      let poi = event.poi,
        id = poi.id,
        //author = poi.author,
        category = poi.category,
        description = poi.description,
        lat = parseFloat(poi.lat),
        lng = parseFloat(poi.lng),
        title = poi.title,
        coordinates = [lat, lng],
        icon = poi.icon,
        comments = poi.comments,
        fav = poi.fav,
        img = poi.img;
      if (icon === "blue") {
        mapController.drawPOI(id, coordinates, icon, category, title, description, comments, img, true);
      } else {
        mapController.drawPOI(id, coordinates, icon, category, title, description, comments, img, false);
      }
      mapController.updatePopup(id, icon, title, description, category, comments, img, fav);
  }

  function onInputConfirmed(event) {
    let title = event.title,
      description = event.description,
      category = event.category,
      author = event.author,
      lng = event.lng,
      lat = event.lat,
      icon = event.icon,
      id = event.poiID,
      fav = false,
      img = event.img,
      comments = [],
      status = event.status;
    if (status === "create") {
      storage.pushPOIToDatabase(author, category, title, description, lat, lng, img);
    } else {
      storage.updatePOI(id, title, description, category, img);
      mapController.updatePopup(id, icon, title, description, category, comments, img, fav);
    }
  }

  function onNewPOIPushed(event) {
    let id = event.id,
      coordinates = event.coordinates,
      icon = event.icon,
      category = event.category,
      title = event.title,
      description = event.description,
      comments = event.comments,
      img = event.img;
    mapController.drawPOI(id, coordinates, icon, category, title, description, comments, img, false);
    mapController.updatePopup(id, icon, title, description, category, comments, img, false);
  }

  function onRegister(event) {
    let email = event.email,
      pass = event.pass;
    storage.createUser(email, pass);
    storage.getOwnPOIs();
    sidenavController.switchLoginLogout();
  }

  function onLoginButton(event) {
    let email = event.email,
      pass = event.pass;
    storage.loginUser(email, pass);

  }

  function onLoginSuccessfull() {
    sidenavController.toggleFavButton();
    sidenavController.switchLoginLogout();
  }

  function onLogout() {
    storage.logoutUser();
    sidenavController.toggleFavButton();
    sidenavController.switchLoginLogout();
    eraseOwnPOIs();
  }

  function onFilterButtonClicked(event) {
    storage.getFilteredPOIsFromDatabase(event.tickedOptions);
  }

  function onSearchEntered(event) {
      storage.getSearchedPOIsFromDatabase(event.term);
  }

  function onDelete(event) {
    let idToDelete = event.poiID,
      poisToDelete = [];
    storage.deletePOIFromDatabase(event.poiID);
    ownPOIs.forEach(function(element) {
      let id = element.options.id;
      if (id === idToDelete) {
        poisToDelete.push(element);
      }
    });
    allPOIs.forEach(function(element) {
      let id = element.options.id;
      if (id === idToDelete) {
        poisToDelete.push(element);
      }
    });
    eraseTopLayer(poisToDelete);
  }

  function onEdit(event) {

    editorController.showEditor(event);
  }

  function onAddFavor(event) {
    console.log(event.poiID);
    storage.addFavorite(event.poiID);
  }

  function onDeleteFavor(event) {
    storage.deleteFavorite(event.poiID);
  }

  function onSubmitCommentButtonClicked(event){
    let poi = event.poi,
      id = poi.id,
      comment = poi.comment;
    storage.pushCommentToDatabase(id, comment);
  }

  function updateFavs(event) {
    favoredPOIs = Array.prototype.slice.call(event.favs);
    allPOIs.forEach(function(element) {
      updatePopupForFavorite(element);
    });

    ownPOIs.forEach(function(element) {
      updatePopupForFavorite(element);
    });
  }

  function updatePopupForFavorite(element) {

      let id = element.options.id,
        icon = element.options.icon.options.icon,
        title = element.options.title,
        description = element.options.description,
        category = element.options.category,
        comments = element.options.comments,
        img = element.options.img,
        fav = favoredPOIs.includes(id);
      mapController.updatePopup(id, icon, title, description, category, comments, img, fav);

  }

  //Speichert die jeweiligen POIs nach dem Zeichnen in Arrays zwischen, um sie später gezielt löschen zu können
  function addPoisToRemove(event) {
    if (event.icon === "red") {
      filteredPOIs.push(event.poi);
    } else if (event.icon === "green") {
      searchedPOIs.push(event.poi);
    } else if (event.icon === "black") {
      ownPOIs.push(event.poi);
    } else if (event.icon === "blue") {
      allPOIs.push(event.poi);
    } else if (event.icon === "yellow") {
      favsToFilter.push(event.poi);
    }
  }

  function processSearch(event) {
    let trigger = event.trigger;

    if (!trigger) {
      updateAndDrawPOI(event);
    }
    if (trigger) {
      eraseTopLayer(searchedPOIs);
    }
  }

  function processFiltering(event) {
    if (event.type !== "filters") {
      updateAndDrawPOI(event);
    } else {
      filteredPOIsToErase = event.categoriesToErase;
      eraseFilterLayer(filteredPOIs);
    }
  }

  function eraseFilterLayer(pois) {
    let layers = [];
    for (let i = 0; i < pois.length; i++) {
      if (filteredPOIsToErase.includes(pois[i].options.category)) {
        layers.push(pois[i]);
      }
    }
    eraseTopLayer(layers);
  }

  function eraseOwnPOIs() {
    mapController.removeTopLayer(ownPOIs);
  }

  function eraseTopLayer(layers) {
    mapController.removeTopLayer(layers);
  }

  that.init = init;
  return that;

}();

InteractiveCM.App.init();
