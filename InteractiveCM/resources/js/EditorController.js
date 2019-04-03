var InteractiveCM = InteractiveCM || {};

InteractiveCM.EditorController = function() {
	"use strict";

	const EDITOR_CREATE_BUTTON_TEXT = "<i class='material-icons right'>send</i>erstellen",
		EDITOR_CREATE_TITLE = "Neuen POI erstellen",
		EDITOR_CHANGE_BUTTON_TEXT = "<i class='material-icons right'>edit</i>Aktualisieren",
		EDITOR_CHANGE_TITLE = "POI verändern";

	var that = new EventTarget(),
		background,
		editorWindow,
		editorTitle,
		editorCloseButton,
		editorConfirmButton,
		category,
		categories = ["Kategorien", "Kunstwerke", "Essen / Trinken", "Hörsäle", "Toiletten", "Parkplätze", "Büros", "Dozenten", "Information", "Geschäfte"],
		poiToChange,
		// useless? auth = firebase.auth(),
		titleEl,
		titleLabel,
		descriptionEl,
		descriptionLabel,
		imageEl,
		categoryEl,
		lat,
		lng,
		img;

	function init(editorWindowEl, backgroundEl) {
		background = backgroundEl;
		editorWindow = editorWindowEl;
		editorTitle = editorWindowEl.querySelector("#editor_title");
		initInput();
		initButtons();
		initSelect();
		return that;
	}

	function initInput() {
		titleEl = editorWindow.querySelector("#titel_poi");
		descriptionEl = editorWindow.querySelector("#input_desc");
		imageEl = editorWindow.querySelector("#image_upload");
		titleLabel = editorWindow.querySelector("#editor_input_title");
		descriptionLabel = editorWindow.querySelector("#editor_input_desc");
	}

	function initButtons() {
		editorCloseButton = editorWindow.querySelector(".close");
		editorConfirmButton = editorWindow.querySelector("#create_button");
		editorCloseButton.addEventListener("click", onCloseButtonClicked);
		editorConfirmButton.addEventListener("click", onConfirmButtonClicked);
		imageEl.addEventListener("change", fileUpload);

	}

	function initSelect() {
		categoryEl = editorWindow.querySelector("#category_select");
		categoryEl.addEventListener("change", onSelect);
	}

	function onSelect(e) {
		category = categories[e.target.value];
	}

	function showEditor(event) {
		if (event) {
			editorTitle.innerHTML = EDITOR_CHANGE_TITLE;
			editorConfirmButton.innerHTML = EDITOR_CHANGE_BUTTON_TEXT;
			titleLabel.classList.add("active");
			titleEl.value = event.title;
			descriptionLabel.classList.add("active");
			descriptionEl.value = event.description;
			categoryEl.value = event.category;
			poiToChange = event.poiID;
		} else {
			editorTitle.innerHTML = EDITOR_CREATE_TITLE;
			editorConfirmButton.innerHTML = EDITOR_CREATE_BUTTON_TEXT;
		}
		editorWindow.classList.remove("hidden");
	}

	function fileUpload(event) {
		let input = event.target,
			reader = new FileReader();
		reader.onload = function() {
			let dataURL = reader.result;
			img = dataURL;
		};
		reader.readAsDataURL(input.files[0]);
	}

	function onCloseButtonClicked() {
		editorWindow.classList.add("hidden");
		emptyTextValues();
		background.classList.remove("not-clickable");
	}

	function onConfirmButtonClicked() {
		let title = titleEl.value.replace("<", "&lt;"),
			description = descriptionEl.value.replace("<", "&lt;"),
			author = getLoggedOnUser(),
			event = new Event("onconfirm");
		event.title = title;
		event.author = author;
		event.description = description;
		event.lat = lat;
		event.lng = lng;
		event.icon = "black";
		if (img) {
			event.img = img;
		} else {
			event.img = "media/ur.png";
		}
		
		if (editorTitle.innerHTML === EDITOR_CHANGE_TITLE) {
			event.status = "change";
			event.poiID = poiToChange;
		} else {
			event.status = "create";
		}
		if (category) {
			event.category = category;
			that.dispatchEvent(event);
			emptyTextValues();
			background.classList.remove("not-clickable");
			editorWindow.classList.add("hidden");
			background.classList.remove("not-clickable");
		} else {
			M.toast({html: "please select a category", classes: "rounded"});
		}
	}

	function readCoordinates(coordinates) {
		lat = coordinates.lat;
		lng = coordinates.lng;
	}

	// Liefert ID des aktuell eingeloggten Benutzers zurück
	function getLoggedOnUser() {
		if (firebase.auth().currentUser !== null) {
			return firebase.auth().currentUser.uid;
		}
		return null;
	}

	//leert Textfelder im Editor
	function emptyTextValues() {
		titleEl.value = "";
		descriptionEl.value = "";
		imageEl.value = "";
	}

	that.init = init;
	that.showEditor = showEditor;
	that.readCoordinates = readCoordinates;
	return that;
};
