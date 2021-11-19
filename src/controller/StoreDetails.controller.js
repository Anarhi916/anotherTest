sap.ui.define(
  [
    "andrey/filimonov/controller/BaseController.controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
  ],
  function (
    BaseController,
    JSONModel,
    Filter,
    FilterOperator,
    Sorter,
    MessageBox,
    MessageToast
  ) {
    "use strict";
    var sStoreID;

    return BaseController.extend("andrey.filimonov.controller.StoreDetails", {
      onInit: function () {
        this.myGetRouter()
          .getRoute("StoreDetailsRoute")
          .attachPatternMatched(this.onPatternMatched, this);

        var oStoresDeteilsModel = new JSONModel({
          ALL: 0,
          OK: 0,
          STORAGE: 0,
          OUT_OF_STOCK: 0,
          sortType: "SORT_NONE",
          lastSorted: "",
          sortIcon: "sort",
          titleDialog: "",
        });
        this.oStoresDeteilsModel = oStoresDeteilsModel;

        this.getView().setModel(oStoresDeteilsModel, "StoresDeteils");

        this._mFilters = {
          OK: [new Filter("Status", FilterOperator.EQ, "OK")],
          STORAGE: [new Filter("Status", FilterOperator.EQ, "STORAGE")],
          OUT_OF_STOCK: [
            new Filter("Status", FilterOperator.EQ, "OUT_OF_STOCK"),
          ],
          ALL: [],
        };

        var oMessageManager = sap.ui.getCore().getMessageManager();
        this.oMessageManager = oMessageManager;

        oMessageManager.registerObject(this.getView(), true);
      },

      onAfterRendering: function () {
        var oOdataModel = this.getView().getModel("odata");
        var oProductsTable = this.byId("idTableGoods");
        var oCountModel = this.getView().getModel("StoresDeteils");

        oProductsTable.getBinding("items").attachDataReceived(function () {
          var oCtx = oProductsTable.getBindingContext("odata");
          var sStoresPath = oOdataModel.createKey("/Stores", oCtx.getObject());
          var aStatuses = ["ALL", "OK", "STORAGE", "OUT_OF_STOCK"];

          aStatuses.forEach(function (sStatus) {
            var oParams = {
              success: function (sCount) {
                oCountModel.setProperty("/" + sStatus, sCount);
              },
            };
            if (sStatus !== "ALL") {
              oParams.filters = [
                new Filter("Status", FilterOperator.EQ, sStatus),
              ];
            }
            oOdataModel.read(sStoresPath + "/rel_Products/$count", oParams);
          });
        });
      },

      onPatternMatched: function (oEvent) {
        var that = this;
        var mRouteArguments = oEvent.getParameter("arguments");
        sStoreID = mRouteArguments.StoreID;
        var oODataModel = this.getView().getModel("odata");
        oODataModel.metadataLoaded().then(function () {
          var sKey = oODataModel.createKey("/Stores", { id: sStoreID });
          that.getView().bindObject({
            path: sKey,
            model: "odata",
          });
        });
      },

      goToStoreOverview: function () {
        this.myGetRouter().navTo("StoresOverview");
      },

      goToProductDeteils: function (oEvent) {
        var oSelectedListItem = oEvent.getParameter("listItem");
        oSelectedListItem.setSelected(false);
        var oCtx = oSelectedListItem.getBindingContext("odata");
        this.myGetRouter().navTo("ProductDetailsRoute", {
          StoreID: sStoreID,
          ProductID: oCtx.getObject("id"),
        });
      },

      onProductsSearch: function (oEvent) {
        var oTableProducts = this.byId("idTableGoods");

        var oItemsBinding = oTableProducts.getBinding("items");

        var sQuery = oEvent.getParameter("query");

        var oFilter = new Filter({
          filters: [
            new Filter({
              path: "Name",
              operator: FilterOperator.Contains,
              value1: sQuery,
            }),
            new Filter({
              path: "Specs",
              operator: FilterOperator.Contains,
              value1: sQuery,
            }),
            new Filter({
              path: "SupplierInfo",
              operator: FilterOperator.Contains,
              value1: sQuery,
            }),
            new Filter({
              path: "MadeIn",
              operator: FilterOperator.Contains,
              value1: sQuery,
            }),
            new Filter({
              path: "ProductionCompanyName",
              operator: FilterOperator.Contains,
              value1: sQuery,
            }),
          ],
          and: false,
        });
        oItemsBinding.filter(oFilter);
      },

      onSortButtonPress: function (oEvent) {
        var lastSorted = this.oStoresDeteilsModel.getProperty("/lastSorted");
        this.oStoresDeteilsModel.setProperty("/sortIcon", "sort");
        var oItem = oEvent.getSource();
        this.oStoresDeteilsModel.setProperty("/sortIcon", "nonsort");
        var sSortingColumn = oItem.data("sortName");
        if (lastSorted !== sSortingColumn) {
          this.oStoresDeteilsModel.setProperty("/lastSorted", sSortingColumn);
          this.oStoresDeteilsModel.setProperty("/sortType", "SORT_NONE");
        }
        var sSortType = this.oStoresDeteilsModel.getProperty("/sortType");
        switch (sSortType) {
          case "SORT_NONE": {
            sSortType = "SORT_ASC";
            oItem.setIcon("sap-icon://sort-ascending");
            break;
          }
          case "SORT_ASC": {
            sSortType = "SORT_DESC";
            oItem.setIcon("sap-icon://sort-descending");
            break;
          }
          case "SORT_DESC": {
            sSortType = "SORT_NONE";
            break;
          }
        }
        this.oStoresDeteilsModel.setProperty("/sortType", sSortType);
        var oProductsTable = this.byId("idTableGoods");
        var oItemsBinding = oProductsTable.getBinding("items");
        if (sSortType === "SORT_NONE") {
          oItemsBinding.sort([]);
        } else {
          var bSortDesc = sSortType === "SORT_DESC";
          var oSorter = new Sorter(sSortingColumn, bSortDesc);

          oItemsBinding.sort(oSorter);
        }
      },

      sortTypeFormatter: function (sSortType) {
        switch (sSortType) {
          case "sort": {
            return "sort";
          }
          default: {
            return "sort";
          }
        }
      },

      onFilterSelect: function (oEvent) {
        var oTableProducts = this.byId("idTableGoods");
        var oBinding = oTableProducts.getBinding("items"),
          sKey = oEvent.getParameter("selectedKey");
        oBinding.filter(this._mFilters[sKey]);
      },

      onDeleteStore: function () {
        MessageBox.confirm("Do you want to delete current store?", {
          initialFocus: sap.m.MessageBox.Action.CANCEL,
          onClose: function (sButton) {
            if (sButton === MessageBox.Action.OK) {
              var oODataModel = this.getView().getModel("odata");

              var sKey = `/Stores(${sStoreID})`;

              oODataModel.remove(sKey, {
                success: function () {
                  MessageToast.show("Store was successfully removed!");
                  this.goToStoreOverview();
                }.bind(this),
                error: function () {
                  MessageBox.error("Error while removing store!");
                },
              });
            }
          }.bind(this),
        });
      },

      onOpenDialogCreateProduct: function () {
        var oPromiseDialogCreateProduct;
        if (!this.oDialogCreateProduct) {
          oPromiseDialogCreateProduct = this.loadFragment({
            name: "andrey.filimonov.view.fragments.CreateProductDialog",
          }).then(
            function (oDialogCreateProduct) {
              this.oDialogCreateProduct = oDialogCreateProduct;
            }.bind(this)
          );
        } else {
          oPromiseDialogCreateProduct = Promise.resolve();
        }
        oPromiseDialogCreateProduct.then(
          function () {
            var oODataModel = this.getView().getModel("odata");
            var oEntryCtx = oODataModel.createEntry("/Products", {
              properties: {
                StoreId: sStoreID,
              },
            });
            this.oDialogCreateProduct.setBindingContext(oEntryCtx);
            this.oDialogCreateProduct.setModel(oODataModel);
            this.oDialogCreateProduct.open();
          }.bind(this)
        );
      },

      onOpenDialogEditProduct: function (oEvent) {
        var oSelectedListItem = oEvent.getSource();
        var oCtx = oSelectedListItem.getBindingContext("odata");
        var oProductID = oCtx.getObject("id");
        var sKey = `/Products(${oProductID})`;
        var oPromiseDialog;
        if (!this.oDialogEditProduct) {
          oPromiseDialog = this.loadFragment({
            name: "andrey.filimonov.view.fragments.EditProductDialog",
          }).then(
            function (oDialogEditProduct) {
              this.oDialogEditProduct = oDialogEditProduct;
            }.bind(this)
          );
        } else {
          oPromiseDialog = Promise.resolve();
        }
        oPromiseDialog.then(
          function () {
            this.oDialogEditProduct.bindElement({
              path: sKey,
              model: "odata",
            });
            this.oDialogEditProduct.open();
          }.bind(this)
        );
      },

      onCancelPress: function () {
        this.oMessageManager.removeAllMessages();
        var oODataModel = this.getView().getModel("odata");
        var oCtx = this.oDialogCreateProduct.getBindingContext();
        oODataModel.deleteCreatedEntry(oCtx);
        this.oDialogCreateProduct.close();
      },

      onCancelFromEditPress: function () {
        this.oMessageManager.removeAllMessages();
        this.oDialogEditProduct.close();
        var oODataModel = this.getView().getModel("odata");
        oODataModel.resetChanges();
      },

      onCreateProductPress: function () {
        if (this.oMessageManager.getMessageModel().getProperty("/").length) {
          MessageBox.error("Enter valid information!");
        } else {
          var oODataModel = this.getView().getModel("odata");
          oODataModel.submitChanges();
          this.onCancelPress();
          MessageToast.show("Store was successfully created!");
        }
      },

      onEditProductPress: function () {
        var oODataModel = this.getView().getModel("odata");
        oODataModel.submitChanges();
        this.onCancelFromEditPress();
      },

      onDeleteProduct: function (oEvent) {
        var oSelectedListItem = oEvent.getSource();
        var oCtx = oSelectedListItem.getBindingContext("odata");
        var oProductID = oCtx.getObject("id");
        var sKey = `/Products(${oProductID})`;
        MessageBox.confirm("Do you want to delete current product?", {
          initialFocus: sap.m.MessageBox.Action.CANCEL,
          onClose: function (sButton) {
            if (sButton === MessageBox.Action.OK) {
              var oODataModel = this.getView().getModel("odata");
              oODataModel.remove(sKey, {
                success: function () {
                  MessageToast.show("Product was successfully removed!");
                }.bind(this),
                error: function () {
                  MessageBox.error("Error while removing product!");
                },
              });
            }
          }.bind(this),
        });
      },
    });
  }
);
