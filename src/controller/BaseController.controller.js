sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("andrey.filimonov.controller.BaseController", {
    myGetRouter: function () {
      return this.getOwnerComponent().getRouter();
    },
  });
});
