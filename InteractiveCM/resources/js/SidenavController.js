var InteractiveCM = InteractiveCM || {};

InteractiveCM.SidenavController = function() {
	"use strict";

	const ENTER_KEYCODE = 13,
		LOGIN_BUTTON_INNER_HTML = '<i class="material-icons left">account_circle</i>Login / Register',
		LOGOUT_BUTTON_INNER_HTML = '<i class="material-icons left">account_circle</i>Logout';

	var that = new EventTarget(),
		loginLogoutButton,
		filterButton,
		favButton,
		shareButton,
		tutorialButton,
		endButtonTutorial,
		slider,
		sidenav,
		searchbar;

	function init(sidenavEl) {
		sidenav = sidenavEl;
		slider = document.querySelector("#slider");
		slider.hidden = true;
		let elems = document.querySelectorAll('.slider'),
			instances = M.Slider.init(elems);
		loginLogoutButton = sidenav.querySelector("#login_button");
		filterButton = sidenav.querySelector("#filter_button");
		favButton = sidenav.querySelector("#fav_button");
		shareButton = sidenav.querySelector("#share_button");
		searchbar = sidenav.querySelector("#search_input");
		tutorialButton = sidenav.querySelector("#tutorial_button");
		endButtonTutorial = document.querySelector("#end_button_tutorial");
		initButtons();
		initSearchbar();
		return that;
	}

	function initButtons() {
		loginLogoutButton.addEventListener("click", function() {
			let event;
			if (loginLogoutButton.classList.contains("red")) {
				event = new Event("onlogout");
			} else {
				event = new Event("onlogin");
			}

			that.dispatchEvent(event);
		});

		filterButton.addEventListener("click", function() {
			let tickedOptions = tickedFilterOptions(),
				event = new Event("onfilter");
			event.tickedOptions = tickedOptions;
			that.dispatchEvent(event);
		});

		favButton.addEventListener("click", function() {
			let event = new Event("onfavs");
			that.dispatchEvent(event);
		});

		shareButton.addEventListener("click", function() {
			let url = document.getElementById("url");
			url.value = window.location.href;
			url.select();
			document.execCommand("copy");
			M.toast({html: "URL successfully copied to your clipboard!", classes: "rounded"});
		});

		tutorialButton.addEventListener("click", function() {
			slider.hidden = false;
			endButtonTutorial.addEventListener("click", function() {
				slider.hidden = true;
			});
		});

	}

	function initSearchbar() {
		searchbar.addEventListener("keypress", function (e) {
			var key = e.which || e.keyCode;
			if (key === ENTER_KEYCODE){
				let term = e.target.value,
					event = new Event("onsearch");
					event.term = term;
				that.dispatchEvent(event);
			}
		});
	}

	function tickedFilterOptions() {
		let filters = document.getElementsByClassName("filter"),
			tickedFilters = [];
		for(let i = 0; i < filters.length; i++) {
			let checked = filters[i].querySelector("input").checked,
				filtername = filters[i].querySelector("span").innerHTML;
			if(checked) {
				tickedFilters.push(filtername);
			}
		}
		return tickedFilters;
	}

	function switchLoginLogout() {
		if (loginLogoutButton.innerHTML === LOGIN_BUTTON_INNER_HTML) {
			loginLogoutButton.innerHTML = LOGOUT_BUTTON_INNER_HTML;
		} else {
			loginLogoutButton.innerHTML = LOGIN_BUTTON_INNER_HTML;
		}
		loginLogoutButton.classList.toggle("red");
	}

	function toggleFavButton() {
		favButton.classList.toggle("hidden");
	}

	that.init = init;
	that.switchLoginLogout = switchLoginLogout;
	that.toggleFavButton = toggleFavButton;
	return that;
};
