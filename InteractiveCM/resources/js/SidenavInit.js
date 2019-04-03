//Materialize-Skript zum triggern der Sidebar

document.addEventListener("DOMContentLoaded", function() {
    "use strict";
      var elems = document.querySelectorAll(".sidenav"),
        instances = M.Sidenav.init(elems, {});
      });

      document.addEventListener("DOMContentLoaded", function() {
        "use strict";
        var elems = document.querySelectorAll("select"),
          instances = M.FormSelect.init(elems, {});
      });

      document.addEventListener("DOMContentLoaded", function() {
        "use strict";
        var elems = document.querySelectorAll(".collapsible"),
          instances = M.Collapsible.init(elems, {});
      });