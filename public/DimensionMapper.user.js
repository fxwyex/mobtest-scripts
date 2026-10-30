// ==UserScript==
// @name         Dimension Mapper (RSM)
// @namespace    http://tampermonkey.net/
// @version      1.3.0
// @description  Dimension presets, CDW comment mapping, and staged scan autofill.
// @updateURL    https://github.com/fxwyex/mobtest-scripts/raw/refs/heads/main/public/DimensionMapper.user.js
// @downloadURL  https://github.com/fxwyex/mobtest-scripts/raw/refs/heads/main/public/DimensionMapper.user.js
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
    const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
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
    let restoreState = null;
    let autofillAnchor = null;
    const mappedFieldInstances = new WeakSet();
    const scanSessions = new WeakMap();

    function renderAutofillOutline() {
        if (!queueActive() || !currentFedId) {
            return;
        }
        const element = feature.ui.getHandle("autofill-repeater").getRowElement(currentFedId);
        if (!element) {
            return;
        }
        element.style.outline = "2px solid var(--rsm-v2-accent)";
        element.style.outlineOffset = "-2px";
        // The manager calls this before the next onRender and when the mount is removed.
        return () => {
            element.style.outline = "";
            element.style.outlineOffset = "";
        };
    }

    function setCurrentFedId(id) {
        if (currentFedId === id) {
            return;
        }
        currentFedId = id;
        if (feature.ui.getMount(INLINE_LAYOUT_ID)) {
            feature.ui.getHandle("autofill-repeater").refreshOnRenderCallback();
        }
    }

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

    async function chooseProductName(value, overwrite, isCurrent) {
        const field = document.querySelector("app-device-info-card")?.querySelector("app-item-name-field");
        const select = field?.querySelector("ng-select");
        const input = select?.querySelector("input");
        if (!input || !value) {
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
        for (let attempt = 0; attempt < 30; attempt++) {
            await nextFrame();
            if (field.isConnected === false || (isCurrent && !isCurrent())) {
                return false;
            }
            const option = Array.from(field.querySelector(".scrollable-content")?.children || []).find((item) => (item.innerText || item.textContent).trim() === value);
            if (option) {
                option.dispatchEvent(new Event("click", { bubbles: true }));
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return false;
    }

    async function chooseField(name, value, overwrite = false, kind = null, isCurrent = null) {
        if (kind === "productName") {
            return chooseProductName(value, overwrite, isCurrent);
        }
        if (kind === "radio" || (!kind && (name === "Color" || name === "Manual Datawipe"))) {
            if (!value) {
                return false;
            }
            return chooseRadio(name, value, overwrite);
        }
        if ((!value || value === "0") && kind !== "dropdown") {
            return false;
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
        if (kind === "dropdown" && !value) {
            if (selected) {
                const clear = select.querySelector(".ng-clear-wrapper");
                if (!clear) {
                    return false;
                }
                clear.click();
            }
            return true;
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
        const currentRow = queueActive() ? queueRows().getAt(0) : null;
        const snapshot = settings.get("autofillRestoreFromSnapshot") && currentRow?.id === currentFedId ? savedFormSnapshot(currentRow) : null;
        if (snapshot) {
            await restoreSavedFields(currentRow, snapshot);
            return;
        }
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

    function savedFormSnapshot(row) {
        if (!row?.savedFormJson) {
            return null;
        }
        try {
            const snapshot = JSON.parse(row.savedFormJson);
            return snapshot?.version === 1 && Array.isArray(snapshot.fields) ? snapshot : null;
        } catch {
            return null;
        }
    }

    function currentRestoreState(row, card) {
        if (!restoreState || restoreState.rowId !== row.id || restoreState.card !== card) {
            restoreState = { rowId: row.id, card, form: null, fields: new Set(), productNamePending: false, productNameApplied: false };
        }
        return restoreState;
    }

    function captureCurrentForm(row) {
        const card = document.querySelector("app-device-info-card");
        if (!card) {
            return;
        }
        const pageUid = document.querySelector("app-order-label")?.textContent;
        if (pageUid && !pageUid.toLowerCase().includes(row.rubyId.trim().toLowerCase())) {
            return;
        }
        const productName = card.querySelector("app-item-name-field .ng-value-label")?.textContent.trim() ?? "";
        const form = card.querySelector("app-test-plan-form > form");
        const fields = [];
        for (const field of form?.querySelectorAll("app-searchable-dropdown-field") || []) {
            const name = fieldLabel(field);
            if (name) {
                fields.push({ name, kind: "dropdown", value: field.querySelector(".ng-value-label")?.textContent.trim() ?? "" });
            }
        }
        for (const field of form?.querySelectorAll("app-radio-buttons-field") || []) {
            const name = fieldLabel(field);
            if (!name) {
                continue;
            }
            const selected = Array.from(field.querySelectorAll("label"))
                .find((label) => label.querySelector('input[type="radio"]')?.checked);
            fields.push({ name, kind: "radio", value: selected?.textContent.trim() ?? "" });
        }
        if (!form && !productName) {
            return;
        }
        return JSON.stringify({ version: 1, productName, fields });
    }

    async function restoreSavedFields(row, snapshot) {
        const card = document.querySelector("app-device-info-card");
        const form = card?.querySelector("app-test-plan-form > form");
        if (!form) {
            return;
        }
        const state = currentRestoreState(row, card);
        if (state.form !== form) {
            state.form = form;
            state.fields.clear();
        }
        for (const field of snapshot.fields) {
            if (currentFedId !== row.id || state !== restoreState || form.isConnected === false) {
                return;
            }
            if (!field || typeof field.name !== "string" || typeof field.value !== "string" ||
                !["dropdown", "radio"].includes(field.kind)) {
                continue;
            }
            const key = `${field.kind}:${field.name}`;
            if (state.fields.has(key)) {
                continue;
            }
            state.fields.add(key);
            if (!await chooseField(field.name, field.value, true, field.kind)) {
                state.fields.delete(key);
            }
        }
    }

    async function restoreProductName() {
        const row = queueActive() ? queueRows().getAt(0) : null;
        const snapshot = row?.id === currentFedId ? savedFormSnapshot(row) : null;
        if (!snapshot?.productName) {
            return;
        }
        const card = document.querySelector("app-device-info-card");
        const field = card?.querySelector("app-item-name-field");
        if (!field) {
            return;
        }
        const state = currentRestoreState(row, card);
        if (state.productNameApplied || state.productNamePending) {
            return;
        }
        state.productNamePending = true;
        try {
            state.productNameApplied = await chooseField("Name", snapshot.productName, true, "productName",
                () => currentFedId === row.id && state === restoreState);
        } finally {
            state.productNamePending = false;
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
        return settings.get("autofillEnabled") === true && settings.get("autofillStartStop") === true;
    }

    function syncAutofillMount() {
        if (settings.get("autofillShowMount") && feature.isEnabled() &&
            autofillAnchor && autofillAnchor.isConnected !== false) {
            feature.ui.mount(inlineSettingsLayout, { anchor: autofillAnchor, position: "before" });
        } else if (feature.ui.getMount(INLINE_LAYOUT_ID)) {
            feature.ui.unmount(INLINE_LAYOUT_ID);
        }
    }

    function onAutofillEnabledChange(enabled) {
        if (!enabled && settings.get("autofillStartStop")) {
            settings.set("autofillStartStop", false);
        }
        if (!enabled) {
            setCurrentFedId(null);
            restoreState = null;
        }
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

    function currentPageDevice() {
        const uuid = document.querySelector("app-order-label")?.textContent.match(UUID_IN_TEXT)?.[0];
        if (!uuid) {
            return null;
        }
        return { uuid, identifier: document.querySelector("#itemIdentifier")?.value.trim() ?? "" };
    }

    function matchingDeviceIndex(rows, device) {
        if (!device) {
            return -1;
        }
        return rows.findIndex((row) => row.rubyId.trim().toLowerCase() === device.uuid.toLowerCase() &&
            row.identifier.trim().toLowerCase() === device.identifier.toLowerCase());
    }
    function getValuesString(data) {
        if (typeof data === "string") {
            data = JSON.parse(data);
        }

        return data.fields
            .map(field => field.value)
            .filter(value => typeof value === "string" && value.trim() !== "")
            .join(" / ");
    }
    function saveCurrentDevice() {
        const device = currentPageDevice();
        if (!device) {
            console.warn("[Dimension Mapper] Load a device before saving it to the autofill queue.");
            return false;
        }
        const { uuid, identifier } = device;
        const savedFormJson = captureCurrentForm({ rubyId: uuid });
        const rows = queueRows().list();
        const index = matchingDeviceIndex(rows, device);
        const resultText = savedFormJson ? getValuesString(savedFormJson) : "";
        if (index < 0) {
            queueRows().add({ rowNum: String(rows.length + 1), rubyId: uuid, identifier, savedFormJson: savedFormJson || "", savedFormJsonText: resultText });
            return true;
        }
        const [existing] = rows.splice(index, 1);
        rows.push({ ...existing, rubyId: uuid, identifier, savedFormJson: savedFormJson || existing.savedFormJson,
            savedFormJsonText: savedFormJson ? resultText : existing.savedFormJsonText });
        settings.set("autofill", rows);
        if (index === 0 && rows.length > 1 && queueActive() && currentFedId === existing.id) {
            feedAfterQueueChange();
        }
        return true;
    }

    function onActiveChange(active) {
        if (!active) {
            setCurrentFedId(null);
            restoreState = null;
            return;
        }
        if (!settings.get("autofillEnabled")) {
            settings.set("autofillStartStop", false);
            return;
        }
        if (!feature.isEnabled()) {
            return;
        }
        setCurrentFedId(null);
        restoreState = null;
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
            setCurrentFedId(first.id);
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
        if (settings.get("autofillRestoreFromSnapshot") && savedFormSnapshot(first)) {
            restoreProductName().catch((error) => console.error("[Dimension Mapper] Product name restore failed", error));
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
        if (!settings.get("autofillEnabled") || !location.pathname.startsWith("/testing/") || !context.success) {
            return;
        }
        const searchAllRows = settings.get("autofillRemoveReceivedAnywhere") === true;
        if (!queueActive() && !searchAllRows) {
            return;
        }
        const saved = savedDeviceFromRequest(context.requestBody);
        const uuid = String(saved?.inventoryItemUid || saved?.updateTestItem?.uniqueIdentifier || "").trim().toLowerCase();
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
            setCurrentFedId(null);
            restoreState = null;
        }
        if (queueActive() && !rows.getAt(0)) {
            settings.set("autofillStartStop", false);
        }
    }

    function feedAfterQueueChange() {
        setCurrentFedId(null);
        restoreState = null;
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
        if (index < 0) {
            return;
        }
        const matchingIndex = matchingDeviceIndex(rows, currentPageDevice());
        const savedFormJson = matchingIndex >= 0 ? captureCurrentForm(rows[matchingIndex]) : null;

        if (savedFormJson) {
            const textResult = getValuesString(savedFormJson)
            rows[matchingIndex] = { ...rows[matchingIndex], savedFormJson, savedFormJsonText: textResult };
        }
        if (rows.length < 2) {
            if (savedFormJson) {
                settings.set("autofill", rows);
            }
            return;
        }
        const [skipped] = rows.splice(index, 1);
        rows.push(skipped);
        settings.set("autofill", rows);
        if (index === 0 && queueActive()) {
            feedAfterQueueChange();
        }
    }

    function testRow(id) {
        if (!settings.get("autofillEnabled")) {
            return false;
        }
        const rows = queueRows().list();
        const index = rows.findIndex((row) => row.id === id);
        if (index < 0 || !UUID_PATTERN.test(rows[index].rubyId.trim())) {
            console.warn("[Dimension Mapper] The selected autofill row needs a valid UUID.");
            return false;
        }

        // Preserve work on the displayed device before the queue change clears the form.
        const device = currentPageDevice();
        let displayedIndex = matchingDeviceIndex(rows, device);
        if (displayedIndex < 0 && device && currentFedId) {
            displayedIndex = rows.findIndex((row) => row.id === currentFedId &&
                row.rubyId.trim().toLowerCase() === device.uuid.toLowerCase());
        }
        if (displayedIndex >= 0) {
            const savedFormJson = captureCurrentForm(rows[displayedIndex]);
            if (savedFormJson) {
                rows[displayedIndex] = { ...rows[displayedIndex], savedFormJson,
                    savedFormJsonText: getValuesString(savedFormJson) };
            }
        }

        if (queueActive() && index === 0 && displayedIndex === 0 && currentFedId === id) {
            // The requested row is already on screen; keep the in-progress form intact.
            settings.set("autofill", rows);
            return true;
        }

        const [selected] = rows.splice(index, 1);
        rows.unshift(selected);
        settings.set("autofill", rows);
        if (queueActive()) {
            feedAfterQueueChange();
        } else {
            // The setting's onChange starts the same autofill path as the Active toggle.
            settings.set("autofillStartStop", true);
        }
        return true;
    }

    function removeRow(id) {
        const rows = queueRows();
        const wasFirst = rows.getAt(0)?.id === id;
        if (!rows.remove(id)) {
            return;
        }
        if (!rows.getAt(0)) {
            settings.set("autofillStartStop", false);
            setCurrentFedId(null);
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
            row = row.nextElementSibling?.classList.contains("rsm-v2-repeater-item") ? row.nextElementSibling : null;
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
                        onLabel: "Active: On", offLabel: "Active: Off", size: "200px",
                        enabledWhen: { setting: "autofillEnabled", equals: true }
                    },
                    { type: "button", label: "Save current", onClick: saveCurrentDevice },
                    { setting: "autofillShowAdditionalSettings", control: "toggleButton", onLabel: "Show Settings: On", offLabel: "Show Settings: Off", size: "200px" },
                ]
            },
            { type: "divider", visibleWhen: { setting: "autofillShowAdditionalSettings", equals: true } },
            { setting: "autofillRemoveReceivedAnywhere", control: "toggleButton", onLabel: "Remove received from any row: On", offLabel: "Remove received from any row: Off", size: "350px", visibleWhen: { setting: "autofillShowAdditionalSettings", equals: true } },
            { setting: "autofillShowComments", control: "toggleButton", onLabel: "Show Comments: On", offLabel: "Show Comments: Off", size: "350px", visibleWhen: { setting: "autofillShowAdditionalSettings", equals: true } },
            { setting: "autofillRestoreFromSnapshot", control: "toggleButton", onLabel: "Restore from snapshot: On", offLabel: "Restore from snapshot: Off", size: "350px", visibleWhen: { setting: "autofillShowAdditionalSettings", equals: true } },
            { setting: "hideRemoveButtonWhenActive", control: "toggleButton", onLabel: "Hide remove button when active: On", offLabel: "Hide remove button when active: Off", size: "350px", visibleWhen: { setting: "autofillShowAdditionalSettings", equals: true } },
            { type: "divider" },
            {
                id: "autofill-repeater", type: "repeater", setting: "autofill",
                onRender: renderAutofillOutline,
                children: [
                    {
                        type: "horizontalGroup", children: [
                            { setting: "rowNum", type: "dynamicLabel", alignText: "center", size: "36px" },
                            { setting: "rubyId", control: "textInput", placeholder: "UUID", size: "100%", validationFeedback: { regex: UUID_PATTERN }, onInput: onScan },
                            { setting: "identifier", control: "textInput", placeholder: "Serial / IMEI", size: "50%", onInput: onScan },
                            { setting: "savedFormJsonText", control: "textInput", placeholder: "Comment / Info", size: "150%", visibleWhen: { setting: "autofillShowComments", equals: true } },
                            { type: "button", label: "Test", onClick({ row }) { testRow(row.id); } },
                            { type: "button", label: "Skip", onClick({ row }) { skipRow(row.id); } },
                            {
                                id: "autofillRemoveBtn", type: "button", label: "Remove", buttonColor: "#ff5555",
                                watchSettings: ["hideRemoveButtonWhenActive", "autofillStartStop"],
                                visibleWhen: () => !(settings.get("hideRemoveButtonWhenActive") && settings.get("autofillStartStop")),
                                onClick({ row }) { removeRow(row.id); }
                            }
                        ]
                    }
                ]
            }
        ]
    };

    const settingsUI = {
        type: "verticalGroup", children: [
            {
                type: "panel", label: "Autofill", collapsible: true, children: [
                    { setting: "autofillEnabled", control: "toggleButton", label: "Enable autofill", onLabel: "On", offLabel: "Off" },
                    { setting: "autofillShowMount", control: "toggleButton", label: "Show autofill panel on page", onLabel: "Show", offLabel: "Hide" }
                ]
            },
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
    function isTestingPage() {
        return location.pathname.includes("/testing") && !location.pathname.includes("/internal") && !location.pathname.includes("/quick-check")
    }
    function registerFeature(manager) {
        if (manager.getFeature?.(FEATURE_ID)) {
            console.warn("[Dimension Mapper] Another script already registered this feature ID. Disable the older script.");
            return;
        }
        manager.registerFeature({
            id: FEATURE_ID,
            name: "Dimension Mapper",
            version: "1.2.1",
            description: "Dimension profiles, CDW comment mapping and Autofill.",
            settings: {
                phcEnabled: { type: "toggle", default: true },
                mappings: {
                    type: "collection", default: [],
                    headers: ["Match IDs", "Field", "Fault", "Priority", "Active", "Overwrite", "Note", "Order", "Remove"], bindingIds: ["dimension-mapper-inline"],
                    item: {
                        matchId: { type: "text", default: "" },
                        field: {
                            type: "dropdown", default: "", options: FIELD_NAMES,
                            onChange(value, previous, { id }) { if (value !== previous) { settings.collection("mappings").set(id, "fault", "") } }
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
                    type: "dropdown", bindingIds: ["dimension-mapper-inline"], default: "", options: [{ value: "", label: "No default profile" }]
                },
                dimCollection: {
                    type: "collection", default: [], headers: ["Field", "Value", "Overwrite", "Remove"], bindingIds: ["dimension-mapper-inline"],
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
                autofillEnabled: { type: "toggle", default: true, onChange: onAutofillEnabledChange },
                autofillShowMount: { type: "toggle", default: true, onChange: syncAutofillMount },
                autofillShowComments: { type: "toggle", default: true },
                autofillRestoreFromSnapshot: { type: "toggle", default: false },
                hideRemoveButtonWhenActive: { type: "toggle", default: true },
                autofillShowAdditionalSettings: { type: "toggle", default: false },
                autofillRemoveReceivedAnywhere: { type: "toggle", default: true },
                autofillStartStop: {
                    type: "toggle", default: false, onChange(value) {
                        onActiveChange(value);
                    }
                },
                autofill: {
                    type: "collection", default: [],
                    headers: ["#", "UUID", "Identifier", "Info", "", "", ""],
                    item: {
                        rowNum: { type: "text", default: "0" },
                        rubyId: { type: "text", default: "" },
                        identifier: { type: "text", default: "" },
                        comment: { type: "text", default: "" },
                        savedFormJson: { type: "text", default: "" },
                        savedFormJsonText: { type: "text", default: "" }
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
                        check: isTestingPage
                    },
                    selector: "app-test-plan-form > form > app-searchable-dropdown-field:nth-child(1) > app-form-field",
                    events: ["create"],
                    onCreate: onDimensionFieldCreate
                },
                {
                    id: "dimension-mapper-inline",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: isTestingPage
                    },
                    selector: "app-today-stats",
                    events: ["create"],
                    onCreate(anchor) {
                        autofillAnchor = anchor;
                        syncAutofillMount();
                    }
                },
                {
                    id: "dimension-mapper-uuid",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: isTestingPage
                    },
                    selector: "app-search-with-filters input",
                    events: ["create"],
                    onCreate: fillUuid
                },
                {
                    id: "dimension-mapper-identifier",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: isTestingPage
                    },
                    selector: "#itemIdentifier",
                    events: ["create"],
                    onCreate: fillIdentifier
                },
                {
                    id: "dimension-mapper-product-name",
                    page: {
                        urlOrigin: ["0750e4c04e76d7e6b04dffb0f4fbb04159936b9bf7a32884b0596de0c7786d0c"],
                        check: isTestingPage
                    },
                    selector: "app-item-name-field",
                    events: ["create"],
                    onCreate() {
                        if (settings.get("autofillRestoreFromSnapshot")) {
                            restoreProductName().catch((error) => console.error("[Dimension Mapper] Product name restore failed", error));
                        }
                    }
                }
            ]
        });
    }

    waitForManager(registerFeature);
})();
