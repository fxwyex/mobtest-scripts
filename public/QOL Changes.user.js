// ==UserScript==
// @name         QOL changes
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description
// @include      /^https:\/\/*r*.*a*.*tech\/?/
// ==/UserScript==

(function() {
    'use strict';
    const host = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    let settings;

    function waitForManager(callback) {
        if (host.RSM) return callback(host.RSM);
        host.addEventListener("rsm-ready", (event) => callback(event.detail), { once: true });
    }

    const autoMapStorage = () => {
        if (settings.get("autofillStorage")) {
            setTimeout(() => {
                document.querySelector("app-device-diagnostic-data")?.querySelectorAll("app-list-row")?.forEach(item => {
                    if (item.textContent.includes("Disks")) {
                        let input = document.querySelector("#name")
                        if (input) {
                            input.value = item.textContent.replace("Disks","")
                            input.dispatchEvent(new Event("input"));
                            input.focus()
                        }
                        return;
                    }
                })
            }, 0);

        }
    }
    const prestockPO_add = () => {
        if (document.querySelector("#ruby-prestock-po-id")) return;
        let input = document.querySelector("app-search-with-filters input")

        if (!input) return;

        let btn = host.RSM.dom.insertHTML(input.parentElement,`<button id="ruby-prestock-po-id" class="btn btn-primary" type="button" style="width:150px;height:48px" title="">Prestock PO</button>`,"afterend");
        btn.onclick = function() {
            if (input) {
                input.value = "3634"
                input.dispatchEvent(new Event("input"));
            }
        }
    }
    const CDWShowFailed = () => {
        if (settings.get("CDWShowFailedOnly")){
            document.querySelector("app-device-diagnostic-data")?.querySelectorAll(".text-success-emphasis")?.forEach(item => {
                item.parentElement.parentElement.remove()
            })
        }
    }
    const prestockPO_remove = () => {
        document.querySelector("#ruby-prestock-po-id")?.remove()
    }

    const onPrestockChange = () => {
        settings.get("showPrestockButton") ? prestockPO_add() : prestockPO_remove()
    }
    const autoScrollRetailToView = () => {
        if (settings.get("scrollRetailView")) {
            document.querySelector("app-gradingform")?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        }
    }
    const autoScrollDimsToView = () => {
        if (settings.get("scrollDimensionView")) {
            document.querySelector("app-device-info-and-checks")?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        }
    }
    function register(manager) {
        const feature = manager.registerFeature({
            id: "ruby-testing-qol-tweaks-changes",
            name: "Ruby Tweaks And Changes",
            version: "1.0.0",
            description: "Small tweaks and quality of life changes.",

            settings: {
                showPrestockButton: { type: "toggle", default: true, onChange: onPrestockChange },
                scrollDimensionView: { type: "toggle", default: true, onChange: autoScrollDimsToView },
                scrollRetailView: { type: "toggle", default: true, onChange: autoScrollRetailToView },
            },

            settingsUI: {
                type: "panel",
                label: "General Settings",
                collapsible: true,
                children: [
                    { setting: "showPrestockButton", control: "toggleButton", label: "Show Prestock PO Button", onLabel: "Enabled", offLabel: "Disabled" },
                    { setting: "scrollDimensionView", control: "toggleButton", label: "Scroll Dimension Panel to View", onLabel: "Enabled", offLabel: "Disabled" },
                    { setting: "scrollRetailView", control: "toggleButton", label: "Scroll Retail Form Panel to View", onLabel: "Enabled", offLabel: "Disabled" },
                    { setting: "autofillStorage", control: "toggleButton", label: "Autofill Storage From CDW", onLabel: "Enabled", offLabel: "Disabled" },
                    { setting: "CDWShowFailedOnly", control: "toggleButton", label: "CDW Show Failed Only", onLabel: "Enabled", offLabel: "Disabled" },
                ]
            },

            onStart(context) {
                settings = context.settings;
                onPrestockChange();
                autoScrollDimsToView();
                autoScrollRetailToView();
            },

            onStop(context) {
                settings = context.settings;
                prestockPO_remove()
            },

            bindings: [
                {
                    id: "ruby-prestock-po-button",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"]
                    },
                    check: () => location.pathname.includes("/testing"),
                    selector: "app-search-with-filters input",
                    events: ["create"],
                    onCreate: onPrestockChange,
                },
                {
                    id: "ruby-scroll-to-view-gradingform",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"]
                    },
                    check: () => location.pathname.includes("/testing"),
                    selector: "app-gradingform",
                    events: ["create"],
                    onCreate: autoScrollRetailToView,
                },
                {
                    id: "ruby-scroll-to-view-dimensions",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"]
                    },
                    check: () => location.pathname.includes("/testing"),
                    selector: "app-test-plan-form > form > app-footer > div > button",
                    events: ["create"],
                    onCreate: autoScrollDimsToView,
                },
                {
                    id: "ruby-auto-fill-storage",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"]
                    },
                    check: () => location.pathname.includes("/testing"),
                    selector: "app-provider-data > app-generic-provider > div > app-label-row",
                    events: ["create"],
                    onCreate: autoMapStorage,
                },
                {
                    id: "ruby-cdw-show-failed",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"]
                    },
                    check: () => location.pathname.includes("/testing"),
                    selector: "app-device-diagnostic-data",
                    events: ["create"],
                    onCreate: CDWShowFailed,
                }
            ]
        });
    }

    waitForManager(register);
})();




