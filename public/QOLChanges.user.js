// ==UserScript==
// @name         QOL changes
// @namespace    http://tampermonkey.net/
// @version      2.0.2
// @description
// @updateURL    https://github.com/fxwyex/mobtest-scripts/raw/refs/heads/main/public/QOLChanges.user.js
// @downloadURL  https://github.com/fxwyex/mobtest-scripts/raw/refs/heads/main/public/QOLChanges.user.js
// @include      /^https:\/\/*r*.*a*.*tech\/?/
// @grant        GM_addStyle
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';
    const host = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    let settings;
    const FILTER_CLASS = "rsm-qol-hidden-success";
    GM_addStyle(`.${FILTER_CLASS} { display: none !important; }`);

    function waitForManager(callback) {
        if (host.RSM) return callback(host.RSM);
        host.addEventListener("rsm-ready", (event) => callback(event.detail), { once: true });
    }

    function autoMapStorage() {
        if (!settings.get("autofillStorage")) {
            return;
        }

        const source = document.querySelector("app-device-diagnostic-data");
        const input = document.querySelector("#name");
        const diskRow = Array.from(source?.querySelectorAll("app-list-row") || []).find((item) => item.textContent.includes("Disks"));
        if (!input || !diskRow) {
            return;
        }

        const value = diskRow.textContent.replace("Disks", "").trim();
        if (input.value !== value) {
            input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.focus();
        }
    };
    function prestockPO_add() {
        const input = document.querySelector("app-search-with-filters input");
        if (!input?.parentElement) {
            return;
        }
        const existing = document.querySelector("#prestock-po-id");
        if (existing) {
            if (input.parentElement.nextElementSibling === existing) {
                return;
            }
            existing.remove();
        }

        const btn = host.RSM.dom.insertHTML(input.parentElement, `<button id="prestock-po-id" class="btn btn-primary" type="button" style="width:150px;height:48px" title="">Prestock PO</button>`, "afterend");
        btn.onclick = function () {
            const currentInput = document.querySelector("app-search-with-filters input");
            if (currentInput) {
                currentInput.value = "3634";
                currentInput.dispatchEvent(new Event("input", { bubbles: true }));
            }
        };
    };

    function applyCDWFilter(showFailedOnly) {
        const container = document.querySelector("app-device-diagnostic-data");
        if (!container) {
            return;
        }
        const successfulRows = new Set();
        if (showFailedOnly) {
            container.querySelectorAll(".text-success-emphasis").forEach((item) => {
                const row = item.parentElement?.parentElement;
                if (row && row !== container && container.contains(row)) {
                    successfulRows.add(row);
                }
            });
        }
        container.querySelectorAll(`.${FILTER_CLASS}`).forEach((row) => {
            if (!successfulRows.has(row)) {
                row.classList.remove(FILTER_CLASS);
            }
        });
        successfulRows.forEach((row) => row.classList.add(FILTER_CLASS));
    };

    function CDWShowFailed() {
        applyCDWFilter(settings.get("CDWShowFailedOnly"));
    }

    function prestockPO_remove() {
        document.querySelector("#prestock-po-id")?.remove();
    };

    function onPrestockInputRemoved() {
        if (!document.querySelector("app-search-with-filters input")) {
            prestockPO_remove();
        }
    };

    function onPrestockChange() {
        if (settings.get("showPrestockButton")) {
            prestockPO_add();
        } else {
            prestockPO_remove();
        }
    };
    function autoScrollRetailToView() {
        if (settings.get("scrollRetailView")) {
            document.querySelector("app-gradingform")?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        }
    }
    function autoScrollDimsToView() {
        if (settings.get("scrollDimensionView")) {
            document.querySelector("app-device-info-and-checks")?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        }
    }
    function register(manager) {
        manager.registerFeature({
            id: "ruby-testing-qol-tweaks-changes",
            name: "Ruby Tweaks And Changes",
            version: "1.0.0",
            description: "Small tweaks and quality of life changes.",

            settings: {
                showPrestockButton: { type: "toggle", default: true, bindingId: "prestock-po-button", onChange: onPrestockChange },
                scrollDimensionView: { type: "toggle", default: true, bindingId: "scroll-to-view-dimensions", onChange: autoScrollDimsToView },
                scrollRetailView: { type: "toggle", default: true, bindingId: "scroll-to-view-gradingform", onChange: autoScrollRetailToView },
                autofillStorage: { type: "toggle", default: false, bindingId: "auto-fill-storage", onChange: autoMapStorage },
                CDWShowFailedOnly: { type: "toggle", default: false, bindingId: "cdw-show-failed", onChange: CDWShowFailed },
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

            onInit(settingsApi) {
                settings = settingsApi;
            },

            onStop() {
                prestockPO_remove();
                applyCDWFilter(false);
            },

            bindings: [
                {
                    id: "bind-prestock-po-button",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: () => location.pathname.includes("/testing")
                    },
                    selector: "app-search-with-filters input",
                    events: ["create"],
                    onCreate: onPrestockChange,
                    onRemove: onPrestockInputRemoved,
                },
                {
                    id: "bind-scroll-to-view-gradingform",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: () => location.pathname.includes("/testing")
                    },
                    selector: "app-gradingform",
                    events: ["create"],
                    onCreate: autoScrollRetailToView,
                },
                {
                    id: "bind-scroll-to-view-dimensions",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: () => location.pathname.includes("/testing")
                    },
                    selector: "app-test-plan-form > form > app-footer > div > button",
                    events: ["create"],
                    onCreate: autoScrollDimsToView,
                },
                {
                    id: "bind-auto-fill-storage",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: () => location.pathname.includes("/testing")
                    },
                    selector: "app-provider-data > app-generic-provider > div > app-label-row",
                    events: ["create"],
                    suppressSelfRetrigger: true,
                    onCreate: autoMapStorage,
                },
                {
                    id: "bind-cdw-show-failed",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: () => location.pathname.includes("/testing")
                    },
                    selector: "app-device-diagnostic-data",
                    events: ["create"],
                    suppressSelfRetrigger: true,
                    onCreate: CDWShowFailed,
                }
            ]
        });
    }

    waitForManager(register);
})();
