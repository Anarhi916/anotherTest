sap.ui.define(
  [
    "andrey/filimonov/controller/BaseController.controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
  ],
  function (BaseController, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("andrey.filimonov.controller.StoresOverview", {
      onInit: function () {
        var oMessageManager = sap.ui.getCore().getMessageManager();
        this.oMessageManager = oMessageManager;
        oMessageManager.registerObject(this.getView(), true);
      },

      onStoreItemSelect: function (oEvent) {
        var oSource = oEvent.getSource();
        var oCtx = oSource.getBindingContext("odata");
        this.myGetRouter().navTo("StoreDetailsRoute", {
          StoreID: oCtx.getObject("id"),
        });
      },

      onStoresSearch: function (oEvent) {
        var oListStores = this.byId("idListStores");

        var oItemsBinding = oListStores.getBinding("items");

        var sQuery = oEvent.getParameter("query");

        var oFilter = new Filter({
          filters: [
            new Filter({
              path: "Name",
              operator: FilterOperator.Contains,
              value1: sQuery,
            }),
            new Filter({
              path: "Address",
              operator: FilterOperator.Contains,
              value1: sQuery,
            }),
          ],
          and: false,
        });
        oItemsBinding.filter(oFilter);
      },

      openDialogCreateStore: function () {
        var oPromiseDialog;
        if (!this.oDialog) {
          oPromiseDialog = this.loadFragment({
            name: "andrey.filimonov.view.fragments.CreateStoreDialog",
          }).then(
            function (oDialog) {
              this.oDialog = oDialog;
            }.bind(this)
          );
        } else {
          oPromiseDialog = Promise.resolve();
        }
        oPromiseDialog.then(
          function () {
            var oODataModel = this.getView().getModel("odata");
            var oEntryCtx = oODataModel.createEntry("/Stores", {});
            this.oDialog.setBindingContext(oEntryCtx);
            this.oDialog.setModel(oODataModel);
            this.oDialog.open();
          }.bind(this)
        );
      },

      onCancelPress: function () {
        this.oMessageManager.removeAllMessages();
        var oODataModel = this.getView().getModel("odata");
        var oCtx = this.oDialog.getBindingContext();
        oODataModel.deleteCreatedEntry(oCtx);
        this.oDialog.close();
      },

      onCreateStorePress: function () {
        if (this.oMessageManager.getMessageModel().getProperty("/").length) {
          MessageBox.error("Enter valid information!");
        } else {
          var oODataModel = this.getView().getModel("odata");
          oODataModel.submitChanges();
          this.onCancelPress();
          MessageToast.show("Store was successfully created!");
        }
      },
    });
  }
);
