sap.ui.define(
  [
    "andrey/filimonov/controller/BaseController.controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
  ],
  function (BaseController, Filter, FilterOperator, MessageBox, MessageToast) {
    "use strict";
    var sStoreID;
    var sProductID;

    return BaseController.extend("andrey.filimonov.controller.ProductDetails", {
      onInit: function () {
        this.myGetRouter()
          .getRoute("ProductDetailsRoute")
          .attachPatternMatched(this.onPatternMatched, this);
      },

      onPatternMatched: function (oEvent) {
        var that = this;
        var oCommentsList = this.byId("idListComments");
        var mRouteArguments = oEvent.getParameter("arguments");
        sStoreID = mRouteArguments.StoreID;
        sProductID = mRouteArguments.ProductID;
        var oODataModel = this.getView().getModel("odata");
        oODataModel.metadataLoaded().then(function () {
          var sKey = oODataModel.createKey("/Products", { id: sProductID });
          that.getView().bindObject({
            path: sKey,
            model: "odata",
          });

          var oItemsBinding = oCommentsList.getBinding("items");
          var oFilter = new Filter("ProductId", FilterOperator.EQ, sProductID);
          oItemsBinding.filter(oFilter);
        });
      },

      goToStoreOverview: function () {
        this.myGetRouter().navTo("StoresOverview");
      },

      goToStoreDeteils: function () {
        this.myGetRouter().navTo("StoreDetailsRoute", {
          StoreID: sStoreID,
        });
      },

      statusIndicator: function (sStatus) {
        switch (sStatus) {
          case "OK":
            return "Success";
          case "STORAGE":
            return "Warning";
          case "OUT_OF_STOCK":
            return "Error";
        }
      },

      statusTransleteble: function (sStatus) {
        switch (sStatus) {
          case "OK":
            return this.getView()
              .getModel("i18n")
              .getResourceBundle()
              .getText("FilterOK");
          case "STORAGE":
            return this.getView()
              .getModel("i18n")
              .getResourceBundle()
              .getText("FilterStorage");
          case "OUT_OF_STOCK":
            return this.getView()
              .getModel("i18n")
              .getResourceBundle()
              .getText("FilterOutOfStock");
        }
      },

      onPostComment: function () {
        var sDate = new Date();
        var oODataModel = this.getView().getModel("odata");
        var Author = this.getView().byId("idAuthor").getValue();
        var Rating = this.getView().byId("idRating").getValue();
        var Message = this.getView().byId("idMessage").getValue();
        if (Author === "") {
          let sMessage = this.getView()
            .getModel("i18n")
            .getResourceBundle()
            .getText("MessageValidAuthor");
          MessageBox.error(sMessage);
        } else {
          var oODataModel = this.getView().getModel("odata");
          var oEntryCtx = oODataModel.createEntry("/ProductComments", {
            properties: {
              ProductId: sProductID,
              Author: Author,
              Rating: Rating,
              Message: Message,
              Posted: sDate,
            },
          });
          oODataModel.submitChanges(oEntryCtx);
          oODataModel.deleteCreatedEntry(oEntryCtx);
          this.getView().byId("idAuthor").setValue("");
          this.getView().byId("idRating").setValue("");
          let sMessage = this.getView()
            .getModel("i18n")
            .getResourceBundle()
            .getText("MessageSuccessfulCreateComment");
          MessageToast.show(sMessage);
        }
      },
    });
  }
);
