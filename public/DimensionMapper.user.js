// ==UserScript==
// @name         Dimension Mapper (RSM)
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Dimension presets, CDW comment mapping, and staged scan autofill.
// @include      /^https:\/\/r.*a.*tech\/?/
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    "use strict";

    const host = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    const FEATURE_ID = "feature-dimension-mapping";

    const FAULT_OPTIONS = {
        "Color": [
            "",
            "Aura Blue",
            "Beige",
            "Black",
            "Blue",
            "Bronze",
            "Brown",
            "Copper",
            "Gold",
            "Green",
            "Grey",
            "Ice Blue",
            "Icelandic Illusion",
            "Jet Black",
            "Lime",
            "Mint",
            "Orange",
            "Pink",
            "Purple",
            "Red",
            "Rose Gold",
            "Silver",
            "Special",
            "Speckled Green",
            "Teal",
            "Transparent",
            "Twilight",
            "White",
            "Yellow"
        ],
        "Fault Description": [
            "",
            "0 value device",
            "Broken box seal",
            "Completely exposed LCD",
            "Dirt under screen(loose/changed LCD)",
            "Extreme LCD fault",
            "Extreme LCD Fault (black/dull screen)",
            "Extreme LCD Fault (Lines)",
            "Extreme LCD Fault (screenburn)",
            "Extreme LCD Fault (spots)",
            "Extremely heavy wear",
            "Extremely swollen battery",
            "Faulty battery (removable)",
            "Faulty buttons",
            "Faulty camera (Back)",
            "Faulty Camera (Front)",
            "Faulty charging socket (built-in battery)",
            "Faulty charging socket (No Data Connection)",
            "Faulty charging socket (removable battery)",
            "Faulty FaceID",
            "Faulty fingerprint scanner",
            "Faulty Home button",
            "Faulty microphone",
            "Faulty proximity sensor",
            "Faulty SIM reader",
            "Faulty software",
            "Faulty speaker/loudspeaker",
            "Faulty touchscreen",
            "Faulty vibration",
            "Faulty Wi-Fi",
            "Heavy Cosmetic Wear",
            "Heavy Cosmetic Wear (frame)",
            "Heavy cosmetic wear (screen)",
            "Heavy damage to device structure",
            "Knox Warranty Void",
            "Loose parts",
            "Loose parts (backcover)",
            "Loose parts (internal)",
            "Loose parts (screen)",
            "Minor Camera Fault",
            "Minor Camera Fault (Back)",
            "Minor Camera Fault (Front)",
            "Minor Functional Damage",
            "Minor Functional Damage (True Tone Not Available)",
            "Minor LCD fault",
            "Minor LCD Fault (discoloration)",
            "Minor LCD Fault (Lines)",
            "Minor LCD Fault (screenburn)",
            "Minor LCD Fault (spots)",
            "Minor physical damage",
            "Minor physical damage (bent frame)",
            "Minor physical damage (cosmetic details)",
            "Minor physical damage (cracked button)",
            "Minor physical damage (cracked/broken backcover)",
            "Minor physical damage (cracked/broken camera)",
            "Minor physical damage (cracked/broken front glass)",
            "Minor physical damage (cracked/damaged frame)",
            "Minor physical damage (engraving removed)",
            "Missing Home Button",
            "Missing LCD",
            "Missing Parts",
            "Missing parts (backcover)",
            "Missing parts (battery)",
            "Missing parts (battery+backcover)",
            "Missing parts (cosmetic details)",
            "Missing parts (SIM tray)",
            "Missing parts (socket portcover)",
            "Missing parts (stylus)",
            "Network connection problems",
            "Not charging (built-in battery)",
            "Not charging (removable battery)",
            "Not EU Region",
            "Not Original Parts",
            "Not turning on",
            "Physical damage (bent frame)",
            "Physical damage (broken port cover)",
            "Physical damage (cosmetic details)",
            "Physical damage (cracked/broken backcover)",
            "Physical damage (cracked/broken camera)",
            "Physical damage (cracked/broken front glass)",
            "Physical damage (cracked/damaged frame)",
            "Physical damage (front glass+ backcover)",
            "Physically broken/damaged motherboard",
            "Redeploy",
            "Reduced battery performance",
            "Restore/boot error (not turning on)",
            "Severe LCD Fault",
            "Severe LCD Fault (discoloration)",
            "Severe LCD Fault (Lines)",
            "Severe LCD Fault (screenburn)",
            "Severe LCD Fault (spots)",
            "Slightly loose parts",
            "Slightly Loose Parts (Backcover)",
            "Slightly loose parts (cosmetic details)",
            "Slightly loose parts (screen)",
            "Slightly swollen battery (Plasma)",
            "Water indicators activated"
        ],
        "Additional Fault": [
            "",
            "Drilled PCB",
            "Faulty FaceID",
            "Faulty fingerprint scanner",
            "Minor LCD Fault",
            "Missing Home Button",
            "Missing port cover",
            "True tone not available",
            "Water indicators activated",
        ],
        "Additional Info": [
            "",
            "Chip/Crack",
            "Discoloration",
            "Broken seal",
            "Other",
            "Engraving",
            "Demo product",
            "Scratched on purpose",
            "Operator stock",
            "Knox warranty void",
            "Protective Case Included",
            "Heavy cosmetic wear",
            "Engraving Removed",
            "New Box",
            "Reduced Battery Performance",
            "AS-IS",
            "With Dock",
            "True Tone Missing",
            "Brand New Battery",
            "NewLine Approved",
            "TeqCycle Approved",
            "Premium Refurbished"
        ],
        "Functionality": [
            "",
            "Working",
            "Incomplete Working",
            "Minor Fault",
            "Grade D",
            "Grade E",
            "No Power",
            "Scrap"
        ],
        "Appearance": [
            "",
            "Brand New",
            "Swap",
            "AS-IS",
            "Grade A+",
            "Grade A",
            "Grade B",
            "Grade C+",
            "Grade C",
            "Scrap",
            "Motherboard only",
            "Grade AB",
            "Grade BC"
        ],
        "Boxed": [
            "",
            "Unboxed",
            "With Pen",
            "Premium Unboxed",
            "Original Box",
            "Incomplete Box",
            "Damaged Box",
            "UK Original Box",
            "Aftermarket Box",
            "Aftermarket UK box",
        ],
        "Network Lock": [
            "",
            "Unlocked",
            "Not known network",
        ],
        "Cloud Lock": [
            "",
            "CloudOFF",
            "Cloud Locked",
            "MDM Lock",
            "Knox Lock"
        ],
        "Battery status": [
            "",
            "Excellent",
            "Brand New",
            "Above 85%",
            "95% and above",
            "90%-94%",
            "85%-89%",
            "80%-84%",
            "70% - 79%",
            "Below 70%",
            "Untested"

        ],
        "Software": [
            "",
            "Demo Soft",
            "Passcode",
            "Passcode+Demo Soft",
            "Branding app",
            "Custom Soft",
            "Demo Soft+Branding app",
            "Blacklisted",
            "Welcome Logo",
            "Demo+Welcome logo",
            "Not genuine apple error",
            "Teqcycle Failed",
        ],
        "Customized": [
            "",
            "Branding",
            "Engraving",
            "Facetime Missing",
            "JP Spec",
            "Newline Failed",
            "Newline Visual Failed",
            "No CE markings",
            "Non-OEM battery",
            "Non-OEM parts",
            "Not EU region",
            "Samsung Failed",
            "Security Sticker marks",
            "Sensitive engraving",
            "US Spec"
        ],
        "Band Type": [
            "",
            "Missing",
            "Standard",
            "Sport Band",
            "Leather Band",
            "Nylon Band",
            "Stainless Steel Band",
            "Rubber Band",
            "Metal Band",
            "Stainless Steel Mesh Band",
            "Alpine Loop",
            "Trail Loop",
            "Ocean Loop",
        ],
        "Color Case": [
            "",
            "Beige",
            "Black",
            "Blue",
            "Bronze",
            "Brown",
            "Copper",
            "Gold",
            "Green",
            "Grey",
            "Jet Black",
            "Lime",
            "Orange",
            "Pink",
            "Purple",
            "Red",
            "Rose Gold",
            "Silver",
            "Special",
            "Transparent",
            "White",
            "Yellow"
        ],
        "Manual Datawipe": [
            "",
            "Manually Data Cleared",
            "Manually Data Not Possible to Clear",
            "Prewiped(Brand New)"
        ]
    }

    const FIELD_NAMES = ["", "Fault Description", "Additional Fault", "Additional Info", "Functionality",
        "Appearance", "Boxed", "Network Lock", "Cloud Lock", "Battery status", "Software",
        "Customized", "Color", "Band Type", "Color Case", "Manual Datawipe"];
    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const INLINE_LAYOUT_ID = "rsm-dimension-mapper-autofill";

    function waitForManager(callback) {
        if (host.RSM) {
            callback(host.RSM);
        } else {
            host.addEventListener("rsm-ready", (event) => callback(event.detail), { once: true });
        }
    }

    function optionsFor(field, placeholder = "Choose an option") {
        return [{ value: "", label: placeholder }, ...(FAULT_OPTIONS[field] || []).filter(Boolean).map((value) => ({ value, label: value }))];
    }

    function nextFrame() {
        return new Promise((resolve) => requestAnimationFrame(resolve));
    }

    function setPageInput(input, value) {
        if (!input || input.value === value) {
            return;
        }
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    let feature = null;
    let settings = null;
    let loadingProfile = false;
    let currentFedId = null;
    const mappedFieldInstances = new WeakSet();
    const scanSessions = new WeakMap();

    function fieldLabel(element) {
        return element.querySelector(".form-field-label label")?.textContent.replace(/\s*\*\s*$/, "").trim() || "";
    }

    function findField(selector, name) {
        return Array.from(document.querySelectorAll(selector)).find((element) => fieldLabel(element) === name);
    }

    function chooseRadio(name, value, overwrite) {
        const field = findField("app-radio-buttons-field", name);
        if (!field) {
            return false;
        }
        const labels = Array.from(field.querySelectorAll("label"));
        const desired = labels.find((label) => label.textContent.trim() === value);
        if (!desired) {
            return false;
        }
        if (desired.querySelector("input")?.checked) {
            return true;
        }
        if (!overwrite && labels.some((label) => label.querySelector("input")?.checked)) {
            return false;
        }
        desired.click();
        return true;
    }

    async function chooseField(name, value, overwrite = false) {
        if (!value || value === "0") {
            return false;
        }
        if (name === "Color" || name === "Manual Datawipe") {
            return chooseRadio(name, value, overwrite);
        }
        const field = findField("app-searchable-dropdown-field", name);
        const select = field?.querySelector("ng-select");
        const input = select?.querySelector("input");
        if (!select || !input || select.classList.contains("ng-select-disabled")) {
            return false;
        }
        const selected = select.querySelector(".ng-value-label")?.textContent.trim();
        if (selected === value) {
            return true;
        }
        if (selected && !overwrite) {
            return false;
        }
        setPageInput(input, value);
        await nextFrame();
        if (!field.isConnected) {
            return false;
        }
        const list = field.querySelector(".scrollable-content");
        const option = Array.from(list?.children || []).find((item) => (item.innerText || item.textContent).trim() === value);
        if (!option) {
            setPageInput(input, "");
            return false;
        }
        option.dispatchEvent(new Event("click", { bubbles: true }));
        return true;
    }

    function diagnosticComments() {
        const panel = document.querySelector("app-device-diagnostic-data");
        if (!panel) {
            return "";
        }
        const comments = [];
        const provider = panel.querySelector("app-provider-data app-generic-provider > div");
        const rows = provider?.children || panel.querySelectorAll("app-label-row, app-list-row");
        for (const item of rows) {
            const columns = item.querySelector(".row")?.children;
            if (columns?.length >= 2 && /^comments?\b/i.test(columns[0].textContent.trim())) {
                comments.push(columns[1].textContent.trim());
            }
        }
        return comments.join(" ");
    }

    function commentText() {
        let queued = "";
        if (settings.get("autofillStartStop") && settings.get("autofillShowComments")) {
            queued = settings.collection("autofill").getAt(0)?.comment || "";
        }
        return `${diagnosticComments()} ${queued}`.trim().toLowerCase();
    }

    function matchingCommentMappings() {
        if (!settings.get("phcEnabled")) {
            return [];
        }
        const tokens = new Set(commentText().split(/[\s,;]+/).map((part) => part.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")).filter(Boolean));
        return settings.collection("mappings").list().filter((row) => row.enabled && row.field && row.fault && row.matchId.split(",").some((alias) => tokens.has(alias.trim().toLowerCase()))).sort((a, b) => Number(b.priority) - Number(a.priority));
    }

    async function applyMappings() {
        const matches = matchingCommentMappings();
        const filledFields = new Set();

        for (const row of settings.collection("dimCollection").list()) {
            if (row.dimField && row.dimDropdown) {
                await chooseField(row.dimField, row.dimDropdown, row.dimToggle);
            }
        }
        for (const row of matches) {
            if (!filledFields.has(row.field) && await chooseField(row.field, row.fault, row.overwrite)) {
                filledFields.add(row.field);
            }
        }
    }

    function onDimensionFieldCreate(field) {
        if (!field || !feature.isEnabled() || mappedFieldInstances.has(field)) {
            return;
        }
        mappedFieldInstances.add(field);
        applyMappings().catch((error) => console.error("[Dimension Mapper] Field mapping failed", error));
    }

    function queueRows() {
        return settings.collection("autofill");
    }

    // Swap saved collection rows rather than changing IDs or mapping values.
    function moveMappingRow(id, direction) {
        const rows = settings.collection("mappings").list();
        const index = rows.findIndex((row) => row.id === id);
        const destination = index + direction;
        if (index < 0 || destination < 0 || destination >= rows.length) {
            return false;
        }
        [rows[index], rows[destination]] = [rows[destination], rows[index]];
        settings.set("mappings", rows);
        return true;
    }

    function queueActive() {
        return settings.get("autofillStartStop") === true;
    }

    function adjustRowCount(delta) {
        const current = Number(settings.get("autofillAddCount"));
        const next = Number.isFinite(current) ? Math.max(1, Math.trunc(current) + delta) : 1;
        settings.set("autofillAddCount", String(next));
    }

    function addRows() {
        const count = Number(settings.get("autofillAddCount"));
        if (!Number.isSafeInteger(count) || count <= 0) {
            return;
        }
        queueRows().addMultiple(Array.from({ length: count }, (_, index) => ({ rowNum: index + 1 })));
    }

    function onActiveChange(active) {
        if (!active) {
            currentFedId = null;
            return;
        }
        if (!feature.isEnabled()) {
            return;
        }
        currentFedId = null;
        const rows = queueRows().list();
        const kept = rows.filter((row) => row.rubyId.trim() || row.identifier.trim() || row.comment.trim());
        if (kept.length !== rows.length) {
            settings.set("autofill", kept);
        }
        if (!kept.length || !UUID_PATTERN.test(kept[0].rubyId.trim())) {
            console.warn("[Dimension Mapper] The first autofill row needs a valid UUID.");
            settings.set("autofillStartStop", false);
            return;
        }
        feedAfterQueueChange();
    }

    function fillUuid(inputObject) {
        const input = inputObject ?? document.querySelector("app-search-with-filters input")
        if (!queueActive() || !input || document.querySelector("app-device-info-card")) {
            return;
        }
        const first = queueRows().getAt(0);
        if (first && UUID_PATTERN.test(first.rubyId.trim())) {
            setPageInput(input, first.rubyId.trim());
            currentFedId = first.id;
        }
    }

    function fillIdentifier(inputObject) {
        const input = inputObject ?? document.querySelector("#itemIdentifier")
        const first = queueRows().getAt(0);
        if (!queueActive() || currentFedId !== first?.id) {
            return;
        }
        const identifier = first.identifier.trim();
        if (identifier) {
            setPageInput(input, identifier);
        }
    }

    function savedDeviceFromRequest(body) {
        if (typeof body === "string") {
            try {
                return JSON.parse(body);
            } catch (_) {
                return null;
            }
        }
        if (body && typeof body.get === "function") {
            return {
                inventoryItemUid: body.get("inventoryItemUid")
            }
        }
        return body && typeof body === "object" ? body : null;
    }

    function onSave(context) {
        if (!location.pathname.startsWith("/testing/") || !context.success) {
            return;
        }
        const searchAllRows = settings.get("autofillRemoveReceivedAnywhere") === true;
        if (!queueActive() && !searchAllRows) {
            return;
        }
        const saved = savedDeviceFromRequest(context.requestBody);
        const uuid = String(saved?.inventoryItemUid || "").trim().toLowerCase();
        if (!uuid) {
            return;
        }
        const rows = queueRows();
        let matchingIndex = -1;
        if (searchAllRows) {
            matchingIndex = rows.list().findIndex((row) => row.rubyId.trim().toLowerCase() === uuid);
        } else if (rows.getAt(0)?.rubyId.trim().toLowerCase() === uuid) {
            matchingIndex = 0;
        }
        if (matchingIndex < 0) {
            return;
        }
        rows.removeAt(matchingIndex);
        if (matchingIndex === 0) {
            currentFedId = null;
        }
        if (queueActive() && !rows.getAt(0)) {
            settings.set("autofillStartStop", false);
        }
    }

    function feedAfterQueueChange() {
        currentFedId = null;
        const clearButton = document.querySelector("app-order-label button");
        if (clearButton) {
            clearButton.click();
        } else {
            fillUuid();
        }
    }

    function skipRow(id) {
        const rows = queueRows().list();
        const index = rows.findIndex((row) => row.id === id);
        if (index < 0 || rows.length < 2) {
            return;
        }
        const [skipped] = rows.splice(index, 1);
        rows.push(skipped);
        settings.set("autofill", rows);
        if (index === 0 && queueActive()) {
            feedAfterQueueChange();
        }
    }

    function removeRow(id) {
        const rows = queueRows();
        const wasFirst = rows.getAt(0)?.id === id;
        if (!rows.remove(id)) {
            return;
        }
        if (!rows.getAt(0)) {
            settings.set("autofillStartStop", false);
            currentFedId = null;
        } else if (wasFirst && queueActive()) {
            feedAfterQueueChange();
        }
    }

    function focusNextScanInput(input) {
        let row = input.closest(".rsm-v2-repeater-item");
        while (row) {
            const inputs = Array.from(row.querySelectorAll('input[type="text"]')).slice(0, 2);
            const next = inputs.slice(inputs.indexOf(input) + 1).find((candidate) => !candidate.disabled);
            if (next) {
                next.focus();
                return;
            }
            row = row.nextElementSibling?.classList.contains("rsm-v2-repeater-item")
                ? row.nextElementSibling : null;
            input = null;
        }
    }

    function onScan({ input, value, setting, itemId, collection }) {
        const now = Date.now();
        const state = scanSessions.get(input) || {
            lastAt: 0, lastLength: 0, totalGap: 0, gapCount: 0, timer: null
        };
        clearTimeout(state.timer);
        const gap = now - state.lastAt;
        if (state.lastAt && gap <= 75 && value.length === state.lastLength + 1) {
            state.totalGap += gap;
            state.gapCount += 1;
        } else {
            state.totalGap = 0;
            state.gapCount = 0;
        }
        state.lastAt = now;
        state.lastLength = value.length;
        scanSessions.set(input, state);
        const uuidComplete = setting === "rubyId" && UUID_PATTERN.test(value);
        const identifierComplete = setting === "identifier" && value.length >= 5 && state.gapCount >= 4 && state.totalGap / state.gapCount < 15;
        if (!uuidComplete && !identifierComplete) {
            return;
        }
        state.timer = setTimeout(() => {
            state.timer = null;
            if (!input.isConnected || input.value !== value || collection.indexOf(itemId) < 0 ||
                (document.activeElement && document.activeElement !== input)) {
                return;
            }
            collection.set(itemId, setting, value);
            focusNextScanInput(input);
        }, 100);
    }
    const stopMiddlePreview = () => {
        host?.RSM?.getFeature("dynamic-mapping-rows-demo")?.ui.mountsById.get("rsm-dimension-mapper-autofill")?.controller.refreshVisibility()
    }
    const inlineSettingsLayout = {
        id: INLINE_LAYOUT_ID, type: "panel", label: "Autofill", collapsible: true,
        children: [
            {
                type: "horizontalGroup", children: [
                    { setting: "autofillAddCount", control: "textInput", alignText: "center", size: "75px" },
                    { type: "button", label: "−", size: "45px", onClick() { adjustRowCount(-1); } },
                    { type: "button", label: "+", size: "45px", onClick() { adjustRowCount(1); } },
                    { type: "button", label: "Add rows", onClick: addRows },
                    { type: "space", width: "100%" },
                    {
                        setting: "autofillStartStop", control: "toggleButton",
                        onLabel: "Active: On", offLabel: "Active: Off", size: "200px"
                    },
                    { setting: "autofillShowAdditionalSettings", control: "toggleButton", onLabel: "Show Settings: On", offLabel: "Show Settings: Off", size: "200px" },
                ]
            },
            { type: "divider", visibleWhen: { setting: "autofillShowAdditionalSettings", equals: true } },
            { setting: "autofillRemoveReceivedAnywhere", control: "toggleButton", onLabel: "Remove received from any row: On", offLabel: "Remove received from any row: Off", size: "350px", visibleWhen: { setting: "autofillShowAdditionalSettings", equals: true } },
            { setting: "autofillShowComments", control: "toggleButton", onLabel: "Show Comments: On", offLabel: "Show Comments: Off", size: "350px", visibleWhen: { setting: "autofillShowAdditionalSettings", equals: true } },
            { setting: "hideRemoveButtonWhenActive", control: "toggleButton", onLabel: "Hide remove button when active: On", offLabel: "Hide remove button when active: Off", size: "350px", visibleWhen: { setting: "autofillShowAdditionalSettings", equals: true } },
            { type: "divider" },
            {
                type: "repeater", setting: "autofill", children: [
                    {
                        type: "horizontalGroup", children: [
                            { setting: "rowNum", type: "dynamicLabel", alignText: "center", size: "36px" },
                            { setting: "rubyId", control: "textInput", placeholder: "UUID", size: "100%", validationFeedback: { regex: UUID_PATTERN }, onInput: onScan },
                            { setting: "identifier", control: "textInput", placeholder: "Serial / IMEI", size: "100%", onInput: onScan },
                            { setting: "comment", control: "textInput", placeholder: "Optional comment", size: "100%", visibleWhen: { setting: "autofillShowComments", equals: true } },
                            { type: "button", label: "Skip", onClick({ row }) { skipRow(row.id); } },
                            { id: "autofillRemoveBtn", type: "button", label: "Remove", buttonColor: "#ff5555", visibleWhen: () => {return !(settings.get("hideRemoveButtonWhenActive")==true&&settings.get("autofillStartStop")==true)}, onClick({ row }) { removeRow(row.id); }}
                        ]
                    }
                ]
            }
        ]
    };

    const settingsUI = {
        type: "verticalGroup", children: [
            {
                type: "panel", label: "PHC comment mappings", collapsible: true, children: [
                    { setting: "phcEnabled", width: "250px", control: "toggleButton", onLabel: "Enabled", offLabel: "Disabled" },
                    {
                        type: "button", size: "250px", label: "Add comment mapping", onClick() {
                            settings.collection("mappings").add();
                        }
                    },
                    { type: "divider" },
                    {
                        type: "repeater", setting: "mappings", children: [
                            {
                                type: "horizontalGroup", children: [
                                    { setting: "matchId", control: "textInput", placeholder: "eline, elines", size: "100%" },
                                    { setting: "field", control: "dropdown", size: "60%" },
                                    { setting: "fault", control: "dropdown", size: "100%" },
                                    { setting: "priority", control: "textInput", alignText: "center", size: "75px" },
                                    { setting: "enabled", control: "toggleButton", onLabel: "On", offLabel: "Off", size: "100px" },
                                    { setting: "overwrite", control: "toggleButton", onLabel: "Yes", offLabel: "No", size: "100px" },
                                    { setting: "note", control: "textInput", placeholder: "Optional", size: "120px" },
                                    {
                                        type: "horizontalGroup", size: "92px", children: [
                                            { type: "button", label: "↑", size: "42px", onClick({ row }) { moveMappingRow(row.id, -1); } },
                                            { type: "button", label: "↓", size: "42px", onClick({ row }) { moveMappingRow(row.id, 1); } }
                                        ]
                                    },
                                    {
                                        type: "button", label: "Remove", buttonColor: "#ff5555",
                                        onClick({ row }) { row.collection.remove(row.id); }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                type: "panel", label: "Dimension profiles", collapsible: true, children: [
                    {
                        type: "horizontalGroup", children: [

                            {
                                type: "verticalGroup", size: "50%", children: [
                                    {
                                        type: "button", size: "100%", label: "Add profile", onClick() {
                                            settings.collection("profiles").add();
                                        }
                                    },
                                    { setting: "defaultProfileId", control: "dropdown", label: "Load at page start" },
                                    {
                                        type: "repeater", setting: "profiles", children: [
                                            {
                                                type: "horizontalGroup", children: [
                                                    { setting: "profileName", control: "textInput", placeholder: "Profile name", size: "100%" },
                                                    {
                                                        type: "button", label: "Save", onClick({ row }) {
                                                            row.collection.set(row.id, "jsonData", JSON.stringify(settings.get("dimCollection")));
                                                        }
                                                    },
                                                    { type: "button", label: "Load", onClick({ row }) { loadProfile(row.id); } },
                                                    {
                                                        type: "button", label: "Remove", buttonColor: "#ff5555",
                                                        onClick({ row }) { row.collection.remove(row.id); }
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                ]
                            },
                            { type: "verticalDivider" },
                            {
                                type: "verticalGroup", size: "50%", children: [
                                    {
                                        type: "button", size: "100%", label: "Add dimension", onClick() {
                                            settings.collection("dimCollection").add();
                                        }
                                    },
                                    {
                                        type: "repeater", setting: "dimCollection", children: [
                                            {
                                                type: "horizontalGroup", children: [
                                                    { setting: "dimField", control: "dropdown", size: "50%" },
                                                    { setting: "dimDropdown", control: "dropdown", size: "50%" },
                                                    { setting: "dimToggle", control: "toggleButton", label: "Overwrite", onLabel: "Yes", offLabel: "No", size: "160px" },
                                                    { type: "button", label: "Remove", buttonColor: "#ff5555", onClick({ row }) { row.collection.remove(row.id); } }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }

                        ]
                    },
                ]
            },
        ]
    };

    function loadProfile(id) {
        const json = settings.collection("profiles").get(id)?.jsonData;
        if (!json) {
            return false;
        }
        try {
            const rows = JSON.parse(json);
            if (!Array.isArray(rows)) {
                return false;
            }
            loadingProfile = true;
            settings.set("dimCollection", rows);
            return true;
        } catch (error) {
            console.warn("[Dimension Mapper] Invalid profile", error);
            return false;
        } finally {
            loadingProfile = false;
        }
    }

    function updateProfileChoices(rows) {
        settings.getHandle("defaultProfileId").setOptions([
            { value: "", label: "No default profile" },
            ...rows.map((row, index) => ({
                value: row.id, label: row.profileName.trim() || `Unnamed profile ${index + 1}`
            }))
        ]);
    }

    function initialize() {
        const profiles = settings.collection("profiles");
        const profileHandle = settings.getHandle("defaultProfileId");
        updateProfileChoices(profiles.list());
        profiles.onChange((next, previous) => {
            if (next.length !== previous.length || next.some((row, index) => row.id !== previous[index]?.id || row.profileName !== previous[index]?.profileName)) {
                updateProfileChoices(next);
                profileHandle.get();
            }
        }, { source: "ui" });
        const defaultProfileId = profileHandle.get();
        if (defaultProfileId != "") {
            loadProfile(defaultProfileId);
        } else {
            settings.set("dimCollection", []);
        }
        if (settings.get("autofillStartStop")) {
            settings.set("autofillStartStop", false);
        }
        feature.Network.subscribe({
            urls: ["save-regular-test-result", "save-retail-test-result", "save-internal-test-result-quality-check"],
            callback: onSave
        });
    }

    function registerFeature(manager) {
        if (manager.getFeature?.(FEATURE_ID)) {
            console.warn("[Dimension Mapper] Another script already registered this feature ID. Disable the older script.");
            return;
        }
        manager.registerFeature({
            id: FEATURE_ID,
            name: "Dimension Mapper",
            version: "1.0.0",
            description: "Dimension profiles, CDW comment mapping and Autofill.",
            settings: {
                phcEnabled: { type: "toggle", default: true },
                mappings: {
                    type: "collection", default: [],
                    headers: ["Match IDs", "Field", "Fault", "Priority", "Active", "Overwrite", "Note", "Order", "Remove"],bindingIds: ["dimension-mapper-inline"],
                    item: {
                        matchId: { type: "text", default: "" },
                        field: {
                            type: "dropdown", default: "", options: FIELD_NAMES,
                            onChange(value, previous, { id }) { if (value !== previous) {settings.collection("mappings").set(id, "fault", "")} }
                        },
                        fault: { type: "dropdown", default: "", options: ({ item }) => optionsFor(item?.field, "Choose a fault") },
                        priority: { type: "slider", default: 0, min: 0, max: 9999, step: 1 },
                        enabled: { type: "toggle", default: true },
                        overwrite: { type: "toggle", default: false },
                        note: { type: "text", default: "" }
                    }
                },
                profiles: {
                    type: "collection", default: [], headers: ["Profile name", "Save", "Load", "Remove"],
                    bindingIds: ["dimension-mapper-inline"],
                    item: {
                        profileName: { type: "text", default: "" },
                        jsonData: { type: "text", default: "" }
                    }
                },
                defaultProfileId: {
                    type: "dropdown",bindingIds: ["dimension-mapper-inline"], default: "", options: [{ value: "", label: "No default profile" }]
                },
                dimCollection: {
                    type: "collection", default: [], headers: ["Field", "Value", "Overwrite", "Remove"],bindingIds: ["dimension-mapper-inline"],
                    item: {
                        dimField: {
                            type: "dropdown", default: "", options: FIELD_NAMES,
                            onChange(value, previous, { id }) {
                                if (!loadingProfile && value !== previous) {
                                    settings.collection("dimCollection").set(id, "dimDropdown", "");
                                }
                            }
                        },
                        dimDropdown: { type: "dropdown", default: "", options: ({ item }) => optionsFor(item?.dimField) },
                        dimToggle: { type: "toggle", default: false }
                    }
                },
                autofillAddCount: { type: "text", default: "10" },
                autofillShowComments: { type: "toggle", default: true },
                hideRemoveButtonWhenActive: { type: "toggle", default: true, onChange: stopMiddlePreview },
                autofillShowAdditionalSettings: { type: "toggle", default: false },
                autofillRemoveReceivedAnywhere: { type: "toggle", default: true },
                autofillStartStop: {
                    type: "toggle", default: false, onChange(value) {
                        stopMiddlePreview();
                        onActiveChange(value);
                    }
                },
                autofill: {
                    type: "collection", default: [],
                    headers: ["#", "UUID", "Identifier", "Comment", "", ""],
                    item: {
                        rowNum: { type: "text", default: "0" },
                        rubyId: { type: "text", default: "" },
                        identifier: { type: "text", default: "" },
                        comment: { type: "text", default: "" }
                    }
                }
            },
            settingsUI,
            onInit() {
                feature = this;
                settings = this.settings;
                initialize();
            },
            onStop() {
                settings.set("autofillStartStop", false);
            },
            bindings: [
                {
                    id: "dimension-mapper-form-field",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: () => location.pathname.includes("/testing")
                    },
                    selector: "app-test-plan-form > form > app-searchable-dropdown-field:nth-child(1) > app-form-field",
                    events: ["create"],
                    onCreate: onDimensionFieldCreate
                },
                {
                    id: "dimension-mapper-inline",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: () => location.pathname.includes("/testing")
                    },
                    selector: "app-today-stats",
                    events: ["create"],
                    onCreate: (anchor) => feature.ui.mount(inlineSettingsLayout, { anchor, position: "before" })
                },
                {
                    id: "dimension-mapper-uuid",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: () => location.pathname.includes("/testing")
                    },
                    selector: "app-search-with-filters input",
                    events: ["create"],
                    onCreate: fillUuid
                },
                {
                    id: "dimension-mapper-identifier",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: () => location.pathname.includes("/testing")
                    },
                    selector: "#itemIdentifier",
                    events: ["create"],
                    onCreate: fillIdentifier
                }
            ]
        });
    }

    waitForManager(registerFeature);
})();
