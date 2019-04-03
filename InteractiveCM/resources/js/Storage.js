var InteractiveCM = InteractiveCM || {};

InteractiveCM.Storage = function() {
  "use strict";

  // Storage Variablen
  var that = new EventTarget(),
    config = {
      apiKey: "AIzaSyA77rQt5dihypcN7jplalGKAtNNsfcD8Po",
      authDomain: "interactivecm-fsfs.firebaseapp.com",
      databaseURL: "https://interactivecm-fsfs.firebaseio.com",
      projectId: "interactivecm-fsfs",
      storageBucket: "interactivecm-fsfs.appspot.com",
      messagingSenderId: "738153116397",
    },
    storage,
    promise,
    auth,
    userLoggedIn,
    lastTickedOptions = [];

  function init() {
    initializeStorage();
    checkForUserStateChange();
    auth = firebase.auth();
    auth.signOut();
    return that;
  }

  //Storage wird initialisiert
  function initializeStorage() {
    firebase.initializeApp(config);
    storage = firebase.firestore();
  }

  function createToast(message) {
    M.toast({
      html: message,
      classes: "rounded",
    });
  }

  //Erstellt einen Nutzer mit Email und Passwort und logged in ein
  function createUser(email, pass) {
    //Register
    auth.createUserWithEmailAndPassword(email, pass)
    .then (user => createToast("New User was created. You can now log in safely."))
    .catch (event => createToast(event.message));
  }

  //Loggt einen bereits existierenden Nutzer mit Email und Passwort ein
  function loginUser(email, pass) {
    let event = new Event("onloginsuccessfull");
    //Sign in

    auth.signInWithEmailAndPassword(email, pass)
    .then
     (user => createToast("You have succesfully logged in. Have fun!"),
      that.dispatchEvent(event))
    .catch
     (event => createToast(event.message));
  }

  //Loggt aktuellen User aus
  function logoutUser() {
    //Sign out
    auth.signOut();
    createToast("You have succesfully logged out. See you soon!");
  }

  //Wenn sich Login Status des Users ändert wird Boolean userloggedIn angepasst
  function checkForUserStateChange() {
    firebase.auth().onAuthStateChanged(function(firebaseUser) {
      if (firebaseUser) {
        userLoggedIn = true;
        //Methoden werden hier aufgerufen damit der richtige Zeitpunkt abgepasst werden kann
        getOwnPOIs();
        getFavs();
      } else {
        userLoggedIn = false;
      }
    });
  }

  // POI wird mit übergebenen Daten in die Firebase gepusht und generierte ID wird zurückgegeben
  function pushPOIToDatabase(author, category, title, description, lat, lng, img) {
    let event = new Event("onpoipushed");
    if (userLoggedIn) {
      storage.collection("PointOfInterest").add({
        title: title,
        author: author,
        category: category,
        description: description,
        lat: lat,
        lng: lng,
        icon: "blue",
        comments: [],
        img: img,
      })
      .then(function(docRef) {
        console.log("Document(POI) written with ID: ", docRef.id);
        event.id = docRef.id;
        event.coordinates = [lat, lng];
        event.icon = "black";
        event.category = category;
        event.title = title;
        event.description = description;
        event.comments = [];
        event.img = img;
        that.dispatchEvent(event);
        getFavs();
      })
      .catch(function(error) {
        console.error("Error adding document(POI): ", error);
      });
    } else {
      createToast("Sorry. You have to log in in order to save POI permanently.");
    }
    return null;
  }

  //Holt alle bestehenden POIs aus der Datenbank, jeder wird einzeln per Event verschickt
  function getStandardPOIsFromDatabase() {
    storage.collection("PointOfInterest").get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        let poi = createPOI(doc, "blue"),
          event = new Event("onpoisloaded");
        event.poi = poi;
        that.dispatchEvent(event);
      });
    });
  }

  //Holt alle vom User erstellten POIs aus der Datenbank, jeder wird einzeln per Event verschickt
  function getOwnPOIs() {
    let userID = getLoggedOnUser(),
      poi,
      event = new Event("onownpoisloaded");
    storage.collection("PointOfInterest").get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        if (doc.data().author === userID){
          poi = createPOI(doc, "black");
        event.poi = poi;
        that.dispatchEvent(event);
        }
      });
    });
  }

  //Holt alle vom User favorisierten POIs aus der Datenbank, jeder wird einzeln per Event verschickt
  function getPOIsFromDatabase(poiID, fav) {
    let poi,
      event;
    storage.collection("PointOfInterest").get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        if (doc.id === poiID) {
          if (fav) {
            //poi wird als 
            poi = createPOI(doc, "yellow");
            poi.fav = true;
            event = new Event("onsingleFav");
          } else {
            poi = createPOI(doc, null);
            event = new Event("onsinglePOI");
          }
          event.poi = poi;
          that.dispatchEvent(event);
        }
      });
    });
  }

  //Holt alle vom User herausgefilterten POIs aus der Datenbank, jeder wird einzeln per Event verschickt
  function getFilteredPOIsFromDatabase(tickedOptions) {
    let categoriesToErase = [],
      filterEvent = new Event("onpoisfiltered"),
      newEvent = new Event("filters"),
      currentTickedOptions = tickedOptions;
    storage.collection("PointOfInterest").get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        if(currentTickedOptions.includes(doc.data().category)){
          let poi = createPOI(doc, "red");
          filterEvent.poi = poi;
          that.dispatchEvent(filterEvent);
        }
      });
    });
    //"Differenz" zwischen aktuellen und vorherigen Filtern wird ermittelt
    if (lastTickedOptions.length >= currentTickedOptions.length) {
      lastTickedOptions.forEach(function(element) {
        if (!currentTickedOptions.includes(element)) {
          categoriesToErase.push(element);
        }
      });
    }
    newEvent.categoriesToErase = categoriesToErase;
    that.dispatchEvent(newEvent);
    lastTickedOptions = currentTickedOptions;
  }

  //Holt alle vom User gesuchten POIs aus der Datenbank, jeder wird einzeln per Event verschickt
  function getSearchedPOIsFromDatabase(term) {
    let searchedterm = term,
      newEvent = new Event("onpoisearched"),
      poi;
    if (searchedterm !== "") {
      storage.collection("PointOfInterest").get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
          if (doc.data().title.toLowerCase().indexOf(searchedterm.toLowerCase()) !== -1) {
            poi = createPOI(doc, "green");
            newEvent.poi = poi;
            that.dispatchEvent(newEvent);
          }
        });
      });
    } else {
      //trigger um die gesuchten POIs zu entfärben
      newEvent.trigger = true;
      that.dispatchEvent(newEvent);
    }
  }

  function createPOI(doc, color) {
    let poi = {
          id: doc.id,
          author: doc.data().author,
          category: doc.data().category,
          description: doc.data().description,
          lat: doc.data().lat,
          lng: doc.data().lng,
          title: doc.data().title,
          icon: color,
          comments: doc.data().comments,
          img: doc.data().img,
        };
    return poi;
  }

  //Fügt einen Kommentar dem Entsprechendem POI hinzu
  function pushCommentToDatabase(id, comment) {
    if (id) {
      if (userLoggedIn) {
        storage.collection("PointOfInterest").doc(id).update({
          comments: firebase.firestore.FieldValue.arrayUnion(comment),
        })
        .then(
          console.log("comment written: ", comment),
          createToast("You have commented this POI successfully! Your comment will be shown the next time, the POI is refreshed!"),
          getPOIsFromDatabase(id)
        )
        .catch(function(error) {
          console.error("Error adding comment: ", error);
        });
      } else {
        createToast("Sorry. You have to log in in order to comment a POI");
      }
    }
  }

  //Gibt die ID des aktuell angemeldeten users zurück
  function getLoggedOnUser() {
      return auth.currentUser.uid;
  }

  function deletePOIFromDatabase(poiID) {
    storage.collection("PointOfInterest").get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        if (doc.id === poiID) {
          storage.collection("PointOfInterest").doc(doc.id).delete()
          .then(
            console.log("POI successfully deleted!"),
            createToast("POI successfully deleted!")
          )
          .catch(function(error) {
              console.error("Error removing POI: ", error);
          });
        }
      });
    });
  }

  //Erstellt einen Nutzer dem seine favorisierten POIs zugeordnet werden, zusammen mit dem aktuell zu favorisierenden POI
  function createUserWithPOI (id, poi){

    storage.collection("Users").doc(id).set({
      favorites: [],
    })
    .then(
      console.log("Document written with ID: ", id)
    )
    .catch(function(error) {
      console.error("Error adding document: ", error);
    });
    storage.collection("Users").doc(id).update({
      favorites: firebase.firestore.FieldValue.arrayUnion(poi),
    });
  }

  //Gibt die Favorisierten POIs eines users zurück
  function getFavs() {
    let event = new Event("favsloaded");
    if (userLoggedIn) {
      let userID = getLoggedOnUser();
      storage.collection("Users").doc(userID).get().then(function(querySnapshot) {
        if (querySnapshot.data()) {
          event.favs = querySnapshot.data().favorites;
          that.dispatchEvent(event);
        }
      });
    }
  }

  //fügt einem user einen POI als Favoriten an
  function addFavorite(poi) {
    console.log("addFavorite");
    if (userLoggedIn) {
      console.log("userLoggedIn");
      if (poi) {
        console.log(poi);
        let userID = getLoggedOnUser(),
          collectionRef = storage.collection("Users"),
          docRef = storage.collection("Users").doc(userID);
        docRef.get()
        .then(doc => {
          //Prüft ob der user bereits Favoriten hat
          if (!doc.exists) {
            createUserWithPOI(userID, poi);
          } else {
            console.log("userExists");
            collectionRef.get().then(function() {
              console.log("update");
              collectionRef.doc(userID).update({
                favorites: firebase.firestore.FieldValue.arrayUnion(poi),
              })
              .then(
                //wird hier genutzt um die popups zu updaten
                getFavs(),
                createToast("POI was successfully favored! (Re-)Activate the 'Favorites' filter to see the result!")
              )
              .catch(function(error) {
                console.error("Error adding comment: ", error);
              });
            });
          }
        });
      }
    } else {
      createToast("Sorry. You have to log in in order to favor a POI");
    }
  }

  //Löscht Favoriten vom angemeldeten user
  function deleteFavorite(poi) {
    let collectionRef = storage.collection("Users"),
      userID = getLoggedOnUser();
    collectionRef.get().then(function() {
      collectionRef.doc(userID).update({
        favorites: firebase.firestore.FieldValue.arrayRemove(poi),
      })
      .then(
        //wird hier genutzt um die popups zu updaten
        getFavs(),
        createToast("POI was successfully unfavored! (Re-)Activate the 'Favorites' filter to see the result!")
      );
    });
  }

  //Speichert Änderungen an einem POI, wenn welche vorgenommen werden
  function updatePOI(id, title, description, category, img) {
    console.log(id);
    storage.collection("PointOfInterest").doc(id).update({
      title: title,
      description: description,
      category: category,
      img: img,
    })
    .then(
      createToast("POI was successfully changed! Open it again to see the result!")
    );
  }

  that.init = init;
  that.createUser = createUser;
  that.loginUser = loginUser;
  that.logoutUser = logoutUser;
  that.pushPOIToDatabase = pushPOIToDatabase;
  that.getStandardPOIsFromDatabase = getStandardPOIsFromDatabase;
  that.getPOIsFromDatabase = getPOIsFromDatabase;
  that.getFilteredPOIsFromDatabase = getFilteredPOIsFromDatabase;
  that.getSearchedPOIsFromDatabase = getSearchedPOIsFromDatabase;
  that.getOwnPOIs = getOwnPOIs;
  that.getLoggedOnUser = getLoggedOnUser;
  that.pushCommentToDatabase = pushCommentToDatabase;
  that.deletePOIFromDatabase = deletePOIFromDatabase;
  that.updatePOI = updatePOI;
  that.addFavorite = addFavorite;
  that.deleteFavorite = deleteFavorite;
  that.getFavs = getFavs;
  return that;
};
