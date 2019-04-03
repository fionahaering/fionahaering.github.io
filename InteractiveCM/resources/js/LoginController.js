var InteractiveCM = InteractiveCM || {};

InteractiveCM.LoginController = function() {
	"use strict";

	var that = new EventTarget(),
        background,
		loginWindow,
		loginCloseButton,
        //Variablen für Buttons und Inputfelder
        txtemail,
        txtpassword,
        btnregister,
        btnlogin,
        email,
        pass;

	function init(loginWindowEl, backgroundEl) {
        background = backgroundEl;
		loginWindow = loginWindowEl;
		loginCloseButton = loginWindow.querySelector(".close");
		initButtons();
		return that;
	}

    // Buttons werden initialisiert und Eventlistener werden angelegt
	function initButtons() {
		loginCloseButton.addEventListener("click", function() {
			loginWindow.classList.add("hidden");
            background.classList.remove("not-clickable");
		});
        txtemail = document.getElementById("txtemail");
        txtpassword = document.getElementById("txtpassword");
        btnregister = document.getElementById("btnregister");
        btnlogin = document.getElementById("btnlogin");
        btnregister.addEventListener("click", onRegisterButtonClicked);
        btnlogin.addEventListener("click", onLoginButtonClicked);
	}

    // Event, wenn RegisterButton geklickt wird
    function onRegisterButtonClicked() {
        //Get email and Password
        email = txtemail.value;
        pass = txtpassword.value;

        let registerevent = new Event("onregister");
        registerevent.email = email;
        registerevent.pass = pass;
        that.dispatchEvent(registerevent);
        background.classList.remove("not-clickable");
    }

    // Event, wenn LoginButton geklickt wird
    function onLoginButtonClicked() {
        //Get email and Password
        email = txtemail.value;
        pass = txtpassword.value;

        let loginevent = new Event("onlogin");
        loginevent.email = email;
        loginevent.pass = pass;
        that.dispatchEvent(loginevent);
        background.classList.remove("not-clickable");
        loginWindow.classList.add("hidden");
        emptyTextValues();
    }

    function emptyTextValues() {
        txtemail.value = "";
        txtpassword.value = "";
    }

	function showLogin() {
		loginWindow.classList.remove("hidden");
	}

	that.init = init;
	that.showLogin = showLogin;
	return that;
};
