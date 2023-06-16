sap.ui.define([
    "sap/ui/core/MessageType",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/dm/dme/podfoundation/controller/PluginViewController",
    "sap/dm/dme/podfoundation/model/PodType",
    "sap/dm/dme/podfoundation/util/PodUtility"
], function(MessageType, JSONModel, MessageBox, PluginViewController, PodType, PodUtility) {
    "use strict";

    var oPluginViewController = PluginViewController.extend("sap.example.plugins.extensionViewPlugin.controller.PluginView", {
        metadata : {
            properties: {
            }
        },

        onInit: function() {
            if (PluginViewController.prototype.onInit) {
                PluginViewController.prototype.onInit.apply(this, arguments);
            }
        },

        /**
         * @see PluginViewController.onBeforeRenderingPlugin()
         */
        onBeforeRenderingPlugin: function() {
            this.subscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.subscribe("OperationListSelectEvent", this.onOperationChangeEvent, this);
            this.subscribe("phaseSelectionEvent", this.onOperationChangeEvent, this);
            this.subscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
        },

        onExit: function() {
            if (PluginViewController.prototype.onExit) {
                PluginViewController.prototype.onExit.apply(this, arguments);
            }
            this.unsubscribe("PodSelectionChangeEvent", this.onPodSelectionChangeEvent, this);
            this.unsubscribe("OperationListSelectEvent", this.onOperationChangeEvent, this);
            this.unsubscribe("phaseSelectionEvent", this.onOperationChangeEvent, this);
            this.unsubscribe("WorklistSelectEvent", this.onWorkListSelectEvent, this);
        },

        onBeforeRendering: function() {
            this._loadModel();
        },

        onPodSelectionChangeEvent : function (sChannelId, sEventId, oData) {
            // don't process if same object firing event
            if (this.isEventFiredByThisPlugin(oData)) {
                return;
            }

            this._loadModel();
        },

        onOperationChangeEvent : function (sChannelId, sEventId, oData) {
            // don't process if same object firing event
            if (this.isEventFiredByThisPlugin(oData)) {
                return;
            }

            this._loadModel();
        },

        onWorkListSelectEvent : function (sChannelId, sEventId, oData) {
            // don't process if same object firing event
            if (this.isEventFiredByThisPlugin(oData)) {
                return;
            }

            this._loadModel();
        },

        _loadModel: function() {
            var oView = this.getView();

            var oConfiguration = this.getConfiguration();
            var bNotificationsEnabled = true;
            if (oConfiguration && typeof oConfiguration.notificationsEnabled !== "undefined") {
                bNotificationsEnabled = oConfiguration.notificationsEnabled;
            }

            var oPodSelectionModel = this.getPodSelectionModel();
            if (!oPodSelectionModel) {
                oView.setModel(new JSONModel());
                return;
            }
            var sPodType = oPodSelectionModel.getPodType();
            var sResource;
            var oResourceData = oPodSelectionModel.getResource();
            if (oResourceData) {
                sResource = this.getStringValue(oResourceData);
                if (!sResource && oResourceData.getResource) {
                    sResource = oResourceData.getResource();
                }
            }
            var iSelectionCount = 0;
            var aInputs = [];
            var sInput, sSfc, sSfcData, sItem, sProcessLot, sShopOrder;
            var oSfc, oItem, oProcessLot, oShopOrder;
            var aSelections = oPodSelectionModel.getSelections();
            if (aSelections && aSelections.length > 0) {
                for (const oSelection of aSelections) {
                    sInput = oSelection.getInput();
                    if (sInput && sInput !== "") {
                        oSfc = oSelection.getSfc();
                        oItem = oSelection.getItem();
                        oProcessLot = oSelection.getProcessLot();
                        oShopOrder = oSelection.getShopOrder();
                        if (oSfc) {
                            sSfc = this.getStringValue(oSfc);
                            if (!sSfc && oSfc.getSfc) {
                                sSfc = oSfc.getSfc();
                            }
                        }
                        if (oItem) {
                            sItem = this.getStringValue(oItem);
                            if (!sItem && oItem.getItem) {
                                sItem = oItem.getItem();
                            }
                        }
                        if (oProcessLot) {
                            sProcessLot = this.getStringValue(oProcessLot);
                            if (!sProcessLot && oProcessLot.getProcessLot) {
                                sProcessLot = oProcessLot.getProcessLot();
                            }
                        }
                        if (oShopOrder) {
                            sShopOrder = this.getStringValue(oShopOrder);
                            if (!sShopOrder && oShopOrder.getShopOrder) {
                                sShopOrder = oShopOrder.getShopOrder();
                            }
                        }
                        if (oSelection.getSfcData()) {
                            sSfcData = JSON.stringify(oSelection.getSfcData(), undefined, 4);
                        }
                        aInputs[aInputs.length] = {
                            input: sInput,
                            sfc: sSfc,
                            item: sItem,
                            processLot: sProcessLot,
                            shopOrder: sShopOrder,
                            sfcData: sSfcData
                        };
                    }
                }
                iSelectionCount = aInputs.length;
            }

            var iOperationCount = 0;
            var aOperations = [];
            var sOperation, sOperationData;
            var oOperations = oPodSelectionModel.getOperations();
            if (oOperations && oOperations.length > 0) {
                for (const oOper of oOperations) {
                    sOperation = this.getStringValue(oOper.operation);
                    if (!sOperation && oOper.getOperation) {
                        sOperation = oResourceData.getOperation();
                    }
                    if (sOperation && sOperation !== "") {
                        sOperationData = JSON.stringify(oOper, undefined, 4);
                        aOperations[aOperations.length] = {
                            operation: sOperation,
                            version: oOper.version,
                            operData: sOperationData
                        };
                    }
                }
                iOperationCount = aOperations.length;
            }

            sOperation = "";
            if (sPodType === PodType.Operation || sPodType === PodType.NC) {
                if (iOperationCount > 0) {
                    sOperation = aOperations[0].operation;
                }
            }

            var iRoutingStepsCount = 0;
            var aRoutingSteps = [];
            var aSteps = oPodSelectionModel.getSelectedRoutingSteps();
            if (aSteps && aSteps.length > 0) {
                for (const oStep of aSteps) {
                    aRoutingSteps[aRoutingSteps.length] = {
                        stepId: oStep.getStepId(),
                        routing: oStep.getRouting(),
                        routingVersion: oStep.getRoutingVersion(),
                        routingType: oStep.getRoutingType()
                    };
                }
                iRoutingStepsCount = aRoutingSteps.length;
            }

            var iComponentCount = 0;
            var aComponents = [];
            var sComponent, sComponentData;
            var oComponents = oPodSelectionModel.getComponents();
            if ( oComponents &&  oComponents.length > 0) {
                for (const oComp of oComponents) {
                    sComponent =  oComp.componentNameAndVersion;
                    if (sComponent && sComponent !== "") {
                        sComponentData = JSON.stringify(oComp, undefined, 4);
                        aComponents[aComponents.length] = {
                            componentNameAndVersion: sComponent,
                            componentDescription: oComp.componentDescription,
                            componentData: sComponentData
                        };
                    }
                }
                iComponentCount = aComponents.length;
            }

            var oModelData = {
                podType: sPodType,
                inputType: oPodSelectionModel.getInputType(),
                workCenter: oPodSelectionModel.getWorkCenter(),
                operation: sOperation,
                quantity: oPodSelectionModel.getQuantity(),
                resource: sResource,
                selectionCount: iSelectionCount,
                operationCount: iOperationCount,
                routingStepsCount: iRoutingStepsCount,
                componentCount: iComponentCount,
                Selections: aInputs,
                Operations: aOperations,
                RoutingSteps: aRoutingSteps,
                Components: aComponents,
                notificationsEnabled: bNotificationsEnabled,
                notificationMessage: ""
            };

            if (sPodType === PodType.Operation && aOperations.length === 1) {
                oModelData.operation = aOperations[0].operation;
            }

            var oModel = new JSONModel(oModelData);

            oView.setModel(oModel);
        },

        getStringValue: function(vValue) {
            if (typeof vValue === "string") {
                return vValue;
            }
            return null;
        },

        /*
         * This enables receiving Notification messages in the plugin
         * @override
         */
        isSubscribingToNotifications: function() {
            var oConfiguration = this.getConfiguration();
            var bNotificationsEnabled = true;
            if (oConfiguration && typeof oConfiguration.notificationsEnabled !== "undefined") {
                bNotificationsEnabled = oConfiguration.notificationsEnabled;
            }
            return bNotificationsEnabled;
        },

        /*
         * Return the event name (i.e.; CUSTOM.USER_MESSAGE)
         * being subscribed to by this plugin
         * @override
         */
        getExampleNotificationEvents: function(sTopic) {
            return ["USER_MESSAGE"];
        },

        /*
         * Return the function to be called when a CUSTOM.USER_MESSAGE
         * notification message is received
         * @override
         */
        getNotificationMessageHandler: function(sTopic) {
            if (sTopic === "USER_MESSAGE") {
                return this._handleNotificationMessage;
            }
            return null;
        },

        _handleNotificationMessage: function(oMsg) {
            var sMessage = "Message not found in payload 'message' property";
            if (oMsg && oMsg.parameters && oMsg.parameters.length > 0) {
                for (var i = 0; i < oMsg.parameters.length; i++) {
                    if (oMsg.parameters[i].name === "message") {
                        sMessage = oMsg.parameters[i].value;
                        break;
                    }
                }
            }
            var oModel = this.getView().getModel();
            var oData = oModel.getData();
            oData.notificationMessage = sMessage;
            oModel.refresh();
        },

        onSfcDataPressed: function(oEvent) {
            var oButton = oEvent.getSource();
            var sSfcData = oButton.data("sfcData");
            if (PodUtility.isNotEmpty(sSfcData)) {
                this.showData(sSfcData, "SFC Data");
            } else {
                this.showErrorMessage("SFC data not loaded in model", true, false, MessageType.INFORMATION)
            }
        },

        onOperationDataPressed: function(oEvent) {
            var oButton = oEvent.getSource();
            var sOperData = oButton.data("operData");
            if (PodUtility.isNotEmpty(sOperData)) {
                this.showData(sOperData, "Operation Data");
            } else {
                this.showErrorMessage("Operation data not loaded in model", true, false, MessageType.INFORMATION)
            }
        },

        onComponentDataPressed: function(oEvent) {
            var oButton = oEvent.getSource();
            var sComponentData = oButton.data("componentData");
            if (PodUtility.isNotEmpty(sComponentData)) {
                this.showData(sComponentData, "Component Data");
            } else {
                this.showErrorMessage("Component data not loaded in model", true, false, MessageType.INFORMATION)
            }
        },

        showData: function (sData, sTitle) {
            var bCompact = this._isViewCompactSize();
            MessageBox.show (sData, {
                icon: MessageBox.Icon.INFORMATION,
                title: sTitle,
                actions: [MessageBox.Action.CLOSE],
                styleClass: bCompact ? "sapUiSizeCompact" : "",
                onClose: function (sAction) {
                }
            });
        },
        
        _isViewCompactSize: function () {
            return !!this.getView().$().closest(".sapUiSizeCompact").length;
        }
    });

    return oPluginViewController;
});
