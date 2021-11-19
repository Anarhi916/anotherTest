sap.ui.define(
  [
    "andrey/filimonov/controller/BaseController.controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
  ],
  function (
    BaseController,
    JSONModel,
    Filter,
    FilterOperator,
    MessageBox,
    MessageToast
  ) {
    "use strict";
    var sStoreID;
    var sProductID;

    return BaseController.extend("andrey.filimonov.controller.ProductDetails", {
      onInit: function () {
        this.myGetRouter()
          .getRoute("ProductDetailsRoute")
          .attachPatternMatched(this.onPatternMatched, this);

        var oProductDeteilsModel = new JSONModel({
          ProductID: "",
          inputsValue: {
            Author: "",
            Rating: "",
            Message: "",
          },
        });
        // var oProductDeteilsModel = new JSONModel({
        //   inputsValue: {
        //     Author: "",
        //     Rating: "",
        //     Message: "",
        //     Posted: "",
        //     ProductId: "",
        //   },
        // });
        this.oProductDeteilsModel = oProductDeteilsModel;

        this.getView().setModel(oProductDeteilsModel, "ProductDeteils");
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
          that.oProductDeteilsModel.setProperty("/ProductId", sProductID);

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

      onPostComment: function () {
        var sDate = new Date();
        // this.oProductDeteilsModel.setProperty(
        //   "/inputsValue/ProductId",
        //   sProductID
        // );
        // this.oProductDeteilsModel.setProperty("/inputsValue/Posted", sDate);
        var oODataModel = this.getView().getModel("odata");
        // var oComments = this.oProductDeteilsModel.getProperty("/inputsValue");
        var Author = this.oProductDeteilsModel.getProperty(
          "/inputsValue/Author"
        );
        var Rating = this.oProductDeteilsModel.getProperty(
          "/inputsValue/Rating"
        );
        var Message = this.oProductDeteilsModel.getProperty(
          "/inputsValue/Message"
        );
        var oComments = {
          Author: Author,
          Rating: Rating,
          Message: Message,
          Posted: sDate,
          ProductId: sProductID,
        };
        oODataModel.create("/ProductComments", oComments, {
          success: function () {
            MessageToast.show("Comment was successfully created!");
          }.bind(this),
          error: function () {
            MessageBox.error("Error while creating comment!");
          },
        });
      },
    });
  }
);

// items="{ path: 'odata>/ProductComments',
// 				filters: [{ path: 'ProductId', operator: 'EQ', value1: '220'}]}"
