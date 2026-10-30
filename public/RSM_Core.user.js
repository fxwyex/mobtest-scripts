// ==UserScript==
// @name         Script Manager Core (RSM)
// @namespace    http://tampermonkey.net/
// @version      2.0.1
// @description  Generic feature manager for Angular and non-Angular sites
// @updateURL    https://github.com/fxwyex/mobtest-scripts/raw/refs/heads/main/public/RSM_Core.user.js
// @downloadURL  https://github.com/fxwyex/mobtest-scripts/raw/refs/heads/main/public/RSM_Core.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @include      /^https:\/\/r.*a.*tech\/?/
// ==/UserScript==
//
(function () {
    "use strict";
    const host = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    const MANAGER_FEATURE_ID = "rsm-core";
    const MANAGER_VERSION = "2.0.1";
    const STORAGE_PREFIX = "rsm.v2.";
    const DEBUG_KEY = `${STORAGE_PREFIX}debug`;
    const DEBUG_CATEGORIES_KEY = `${DEBUG_KEY}.categories`;
    const UI_PREFERENCES_PREFIX = `${STORAGE_PREFIX}ui.`;
    const SELECTED_FEATURE_KEY = `${UI_PREFERENCES_PREFIX}selectedFeatureId`;
    const ACCESS_KEYWORDS = Object.freeze({ user: 0, tester: 1, experienced: 2, developer: 3 });
    const ACCESS_LEVEL_NAMES = ["User", "Tester", "Experienced", "Developer"];
    const MODE_LEVEL_DEFINITION = { type: "slider", default: 0, min: 0, max: 3, step: 1 };
    const INSTALL_CATALOG_ID = "rsm-install-catalog";
    const INSTALL_CATALOG = [
        {
            name: "Dimension Mapper",
            description: "Dimension Mapper.",
            installURL: "https://github.com/fxwyex/mobtest-scripts/raw/refs/heads/main/public/DimensionMapper.user.js",
            placeholder: false
        },
        {
            name: "Quality of Life Features",
            description: "Quality of Life Features.",
            installURL: "https://github.com/fxwyex/mobtest-scripts/raw/refs/heads/main/public/QOLChanges.user.js",
            placeholder: false
        }
    ];
    const UI_PREFERENCE_DEFINITIONS = {
        theme: { type: "dropdown", default: "auto", options: ["auto", "dark", "light"] },
        dialogWidth: { type: "slider", default: 90, min: 40, max: 98, step: 1 },
        dialogHeight: { type: "slider", default: 90, min: 40, max: 98, step: 1 },
        dialogMaxWidth: { type: "slider", default: 2050, min: 500, max: 3000, step: 10 },
        dialogMaxHeight: { type: "slider", default: 1400, min: 300, max: 2000, step: 10 },
        dialogPadding: { type: "slider", default: 12, min: 0, max: 64, step: 1 },
        sidebarWidth: { type: "slider", default: 360, min: 140, max: 600, step: 10 },
        edgePadding: { type: "slider", default: 12, min: 0, max: 80, step: 1 },
        elementGap: { type: "slider", default: 6, min: 0, max: 48, step: 1 },
        panelGap: { type: "slider", default: 12, min: 0, max: 48, step: 1 },
        panelPadding: { type: "slider", default: 6, min: 0, max: 64, step: 1 },
        panelRadius: { type: "slider", default: 12, min: 0, max: 64, step: 1 },
        elementRadius: { type: "slider", default: 5, min: 0, max: 64, step: 1 },
        controlHeight: { type: "slider", default: 36, min: 24, max: 60, step: 1 },
        fontSize: { type: "slider", default: 18, min: 11, max: 24, step: 1 },
        backdropColor: { type: "color", default: "#000000" },
        backdropOpacity: { type: "slider", default: 50, min: 0, max: 100, step: 1 }
    };
    const DEFAULT_DEBUG_CATEGORIES = {
        core: true,
        lifecycle: true,
        feature: true,
        binding: true,
        settings: false,
        "settings.read": false,
        ui: true
    };
    const SETTINGS_UI_CSS = `
    /* The manager owns its palette, so host-site CSS cannot make
       one page's theme leak into the settings panel. */
    #rsm-v2-settings-button[data-rsm-v2-theme="dark"],
    #rsm-v2-settings-panel[data-rsm-v2-theme="dark"],
    .rsm-v2-embedded-settings[data-rsm-v2-theme="dark"] {
        color-scheme: dark;
        --rsm-v2-native-scheme: dark;
        --rsm-v2-surface: #2e2f31;
        --rsm-v2-card: #343537;
        --rsm-v2-field-bg: #292a2c;
        --rsm-v2-header-bg: #333437;
        --rsm-v2-text: #f5f3f7;
        --rsm-v2-muted: #c8c3ce;
        --rsm-v2-border: #606065;
        --rsm-v2-divider: #55545a;
        --rsm-v2-accent: #8733b9;
        --rsm-v2-focus: #b875dc;
        --rsm-v2-focus-ring: #b875dc55;
        /* Active buttons and sliders share one accent color. */
        --rsm-v2-button-bg: var(--rsm-v2-accent);
        --rsm-v2-button-text: #fff;
        --rsm-v2-off-button-bg: #525358;
        --rsm-v2-off-button-text: #f0f0f2;
        --rsm-v2-disabled-button-bg: #47484b;
        --rsm-v2-disabled-button-text: #b6b6ba;
        --rsm-v2-sidebar-bg: #27282a;
        --rsm-v2-sidebar-text: #fff;
        --rsm-v2-sidebar-button: #38393c;
        --rsm-v2-sidebar-selected: var(--rsm-v2-accent);
        --rsm-v2-sidebar-selected-text: #fff;
        --rsm-v2-track: #b8b2be;
        --rsm-v2-thumb: #79538f;
        --rsm-v2-thumb-border: #f5e9fa;
        --rsm-v2-feedback-success: #75d79b;
        --rsm-v2-feedback-error: #ff8585;
    }
    #rsm-v2-settings-button[data-rsm-v2-theme="light"],
    #rsm-v2-settings-panel[data-rsm-v2-theme="light"],
    .rsm-v2-embedded-settings[data-rsm-v2-theme="light"] {
        color-scheme: light;
        --rsm-v2-native-scheme: light;
        --rsm-v2-surface: #fff;
        --rsm-v2-card: #f7f7f8;
        --rsm-v2-field-bg: #fff;
        --rsm-v2-header-bg: #f2eff5;
        --rsm-v2-text: #28232d;
        --rsm-v2-muted: #66616c;
        --rsm-v2-border: #cecad2;
        --rsm-v2-divider: #d5d1d9;
        --rsm-v2-accent: #652489;
        --rsm-v2-focus: #8538aa;
        --rsm-v2-focus-ring: #8538aa44;
        --rsm-v2-button-bg: var(--rsm-v2-accent);
        --rsm-v2-button-text: #fff;
        --rsm-v2-off-button-bg: #e7e7e9;
        --rsm-v2-off-button-text: #45454a;
        --rsm-v2-disabled-button-bg: #e4e4e6;
        --rsm-v2-disabled-button-text: #87878c;
        --rsm-v2-sidebar-bg: #f3f3f4;
        --rsm-v2-sidebar-text: #28232d;
        --rsm-v2-sidebar-button: #fff;
        --rsm-v2-sidebar-selected: var(--rsm-v2-accent);
        --rsm-v2-sidebar-selected-text: #fff;
        --rsm-v2-track: #c8c1ce;
        --rsm-v2-thumb: #744495;
        --rsm-v2-thumb-border: #fff;
        --rsm-v2-feedback-success: #17783a;
        --rsm-v2-feedback-error: #b4232c;
    }
    #rsm-v2-settings-button {
        position: fixed; right: 16px; bottom: 16px; z-index: 2147483646;
        border: 1px solid var(--rsm-v2-button-bg); border-radius: var(--rsm-v2-element-radius, 5px); padding: 8px 12px;
        min-height: var(--rsm-v2-control-height, 30px);
        background: var(--rsm-v2-button-bg); color: var(--rsm-v2-button-text); cursor: pointer;
        font: var(--rsm-v2-font-size, 14px) sans-serif;
    }
    #rsm-v2-settings-button, :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) button:not(.rsm-v2-panel-toggle) {
        transform-origin: center;
        transition: background-color 160ms ease, box-shadow 160ms ease,
            transform 120ms ease, filter 120ms ease;
    }
    #rsm-v2-settings-button:not(:disabled):hover,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) button:not(.rsm-v2-panel-toggle):not(:disabled):hover {
        filter: brightness(1.12); box-shadow: 0 0 0 1px var(--rsm-v2-focus-ring);
    }
    #rsm-v2-settings-button:not(:disabled):active,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) button:not(.rsm-v2-panel-toggle):not(:disabled):active {
        transform: translateY(1px) scale(.97); filter: brightness(1.22);
    }
    #rsm-v2-settings-button:focus-visible,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) button:focus-visible {
        outline: 2px solid var(--rsm-v2-focus); outline-offset: 2px;
    }
    #rsm-v2-settings-button,
    #rsm-v2-settings-panel,
    #rsm-v2-settings-panel *,
    .rsm-v2-embedded-settings,
    .rsm-v2-embedded-settings * {
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: var(--rsm-v2-font-size, 14px) !important;
        font-weight: 400 !important;
        font-style: normal !important;
        letter-spacing: normal !important;
        line-height: normal !important;
    }
    #rsm-v2-settings-panel h2 {
        font-size: calc(var(--rsm-v2-font-size, 14px) + 4px) !important;
        font-weight: 600 !important;
    }
    #rsm-v2-settings-panel h3 {
        font-size: calc(var(--rsm-v2-font-size, 14px) + 1px) !important;
        font-weight: 600 !important;
    }
    #rsm-v2-settings-panel h4 {
        font-size: var(--rsm-v2-font-size, 14px) !important;
        font-weight: 600 !important;
    }
    #rsm-v2-settings-panel #rsm-v2-settings-version,
    #rsm-v2-settings-panel .rsm-v2-setting-unit {
        font-size: max(9px, calc(var(--rsm-v2-font-size, 14px) - 2px)) !important;
    }
    @media (prefers-reduced-motion: reduce) {
        #rsm-v2-settings-button, :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) button { transition: none; }
    }
    #rsm-v2-settings-panel {
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; align-items: center; justify-content: center;
        padding: 12px; box-sizing: border-box;
        background: rgba(0, 0, 0, .76); font: var(--rsm-v2-font-size, 14px) sans-serif;
    }
    #rsm-v2-settings-panel[hidden] { display: none; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) {
        width: 80vw; height: 80vh; max-width: 1400px; max-height: 1000px;
        min-width: 0; min-height: 0; overflow: hidden;
        box-sizing: border-box; padding: 24px;
        border: 1px solid var(--rsm-v2-border); border-radius: var(--rsm-v2-panel-radius, 12px);
        background: var(--rsm-v2-surface); color: var(--rsm-v2-text); box-shadow: 0 5px 24px #0009;
    }
    #rsm-v2-settings-shell {
        display: flex; width: 100%; height: 100%; max-width: 100%;
        min-width: 0; min-height: 0;
        gap: var(--rsm-v2-shell-gap, 24px); box-sizing: border-box;
    }
    #rsm-v2-settings-sidebar {
        display: flex; flex-direction: column; box-sizing: border-box;
        width: min(var(--rsm-v2-sidebar-width, 240px), 45%);
        flex: 0 0 min(var(--rsm-v2-sidebar-width, 240px), 45%);
        min-height: 0; overflow: hidden; border: 1px solid var(--rsm-v2-divider);
        padding: var(--rsm-v2-sidebar-padding, 16px);
        border-radius: var(--rsm-v2-panel-radius, 12px);
        background: var(--rsm-v2-sidebar-bg); color: var(--rsm-v2-sidebar-text);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) #rsm-v2-settings-sidebar h3 {
        margin: 0; color: var(--rsm-v2-sidebar-text);
    }
    #rsm-v2-settings-sidebar-header {
        display: flex; align-items: center; justify-content: space-between;
        gap: 8px; margin-bottom: 12px;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) #rsm-v2-settings-sidebar button.rsm-v2-catalog-select {
        display: flex; align-items: center; justify-content: center;
        flex: 0 0 var(--rsm-v2-control-height, 30px);
        width: var(--rsm-v2-control-height, 30px);
        height: var(--rsm-v2-control-height, 30px); padding: 0;
        font-size: calc(var(--rsm-v2-font-size, 14px) + 8px) !important; line-height: 1;
        background: var(--rsm-v2-sidebar-button); color: var(--rsm-v2-sidebar-text);
        border-color: var(--rsm-v2-border);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) #rsm-v2-settings-sidebar button.rsm-v2-catalog-select.rsm-v2-selected {
        background: var(--rsm-v2-sidebar-selected);
        color: var(--rsm-v2-sidebar-selected-text);
    }
    #rsm-v2-settings-content .rsm-v2-catalog-list {
        display: flex; flex-direction: column; gap: var(--rsm-v2-panel-gap, 6px);
    }
    #rsm-v2-settings-content .rsm-v2-catalog-card {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px; min-width: 0;
        padding: var(--rsm-v2-panel-padding-setting, 6px);
        border: 1px solid var(--rsm-v2-border);
        border-radius: var(--rsm-v2-panel-radius, 12px);
        background: var(--rsm-v2-card);
    }
    #rsm-v2-settings-content .rsm-v2-catalog-card h3 {
        margin: 0 0 4px; color: var(--rsm-v2-text);
    }
    #rsm-v2-settings-content .rsm-v2-catalog-card p {
        margin: 0; color: var(--rsm-v2-muted);
    }
    #rsm-v2-settings-content .rsm-v2-catalog-card code {
        display: block; margin-top: 5px; max-width: 100%;
        overflow-wrap: anywhere; color: var(--rsm-v2-muted);
    }
    #rsm-v2-settings-content .rsm-v2-catalog-install {
        flex: 0 0 auto; padding: 5px 9px;
        border: 1px solid var(--rsm-v2-button-bg); border-radius: var(--rsm-v2-element-radius, 5px);
        background: var(--rsm-v2-button-bg); color: var(--rsm-v2-button-text);
        text-decoration: none; white-space: nowrap;
    }
    #rsm-v2-settings-content button.rsm-v2-catalog-install:disabled {
        background: var(--rsm-v2-disabled-button-bg);
        color: var(--rsm-v2-disabled-button-text);
        border-color: var(--rsm-v2-border);
    }
    #rsm-v2-settings-script-list {
        display: flex; flex: 1 1 auto; min-height: 0; flex-direction: column; gap: 6px;
        overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain;
    }
    #rsm-v2-settings-script-list .rsm-v2-script-row { display: flex; gap: 6px; min-width: 0; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) #rsm-v2-settings-script-list button {
        width: auto; text-align: left;
        background: var(--rsm-v2-sidebar-button); color: var(--rsm-v2-sidebar-text);
        border-color: var(--rsm-v2-sidebar-button);
    }
    #rsm-v2-settings-script-list .rsm-v2-script-select { flex: 1 1 auto; min-width: 0; }
    #rsm-v2-settings-script-list .rsm-v2-script-toggle { flex: 0 0 auto; padding-left: 7px; padding-right: 7px; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) #rsm-v2-settings-script-list button.rsm-v2-selected {
        background: var(--rsm-v2-sidebar-selected); color: var(--rsm-v2-sidebar-selected-text);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) #rsm-v2-settings-script-list button.rsm-v2-toggle-on {
        background: var(--rsm-v2-button-bg); color: var(--rsm-v2-button-text);
        border-color: var(--rsm-v2-button-bg);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) #rsm-v2-settings-script-list button.rsm-v2-script-toggle:not(.rsm-v2-toggle-on) {
        background: var(--rsm-v2-off-button-bg); color: var(--rsm-v2-off-button-text);
        border-color: var(--rsm-v2-border);
    }
    #rsm-v2-settings-content {
        flex: 1 1 auto; min-width: 0; min-height: 0; max-width: 100%;
        box-sizing: border-box;
        overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain;
    }
    /* Keep all panes scrollable without Edge reserving a visible scrollbar
       gutter or pushing the controls away from their right edge. */
    #rsm-v2-settings-script-list,
    #rsm-v2-settings-content,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-limited > .rsm-v2-panel-body {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    #rsm-v2-settings-script-list::-webkit-scrollbar,
    #rsm-v2-settings-content::-webkit-scrollbar,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-limited > .rsm-v2-panel-body::-webkit-scrollbar {
        display: none;
    }
    #rsm-v2-settings-content header { border-bottom: 1px solid var(--rsm-v2-divider); margin-bottom: 16px; padding-bottom: 12px; }
    #rsm-v2-settings-content header h2 { margin: 0 0 5px; }
    #rsm-v2-settings-description { margin: 0 0 8px; color: var(--rsm-v2-muted); }
    #rsm-v2-settings-version { color: var(--rsm-v2-muted); }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) h2 { margin: 0 0 14px; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) h3 { margin: 16px 0 8px; color: var(--rsm-v2-accent); }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-setting { margin: 0; min-width: 0; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-horizontalgroup > .rsm-v2-control-setting { flex: 1 1 0; min-width: 0; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-action-setting {
        display: flex; flex: 0 0 auto; align-self: flex-start;
        min-width: max-content;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-action-setting > button {
        display: block; min-width: max-content; margin: 0;
        /* Fields have a 1px outline on both sides of their control height. */
        min-height: calc(var(--rsm-v2-control-height, 30px) + 2px);
        padding-block: 4px;
        white-space: nowrap; text-align: center;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-action-setting > button.rsm-v2-custom-button-color:not(:disabled) {
        background: var(--rsm-v2-custom-button-color) !important;
        border-color: var(--rsm-v2-custom-button-color) !important;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-action-sized > button { width: 100%; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) label { display: flex; gap: 8px; align-items: center; justify-content: space-between; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) button, :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) input, :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) select, :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) textarea { box-sizing: border-box; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) button { min-height: var(--rsm-v2-control-height, 30px); border: 1px solid var(--rsm-v2-border); border-radius: var(--rsm-v2-element-radius, 5px); padding: 5px 9px; background: var(--rsm-v2-button-bg); color: var(--rsm-v2-button-text); cursor: pointer; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) button:disabled {
        background: var(--rsm-v2-disabled-button-bg);
        color: var(--rsm-v2-disabled-button-text);
        border-color: var(--rsm-v2-border);
        opacity: 1; cursor: default !important; filter: none;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) #rsm-v2-settings-script-list button.rsm-v2-script-toggle:disabled {
        background: var(--rsm-v2-disabled-button-bg);
        color: var(--rsm-v2-disabled-button-text);
        border-color: var(--rsm-v2-border);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field {
        display: flex; flex: 1 1 auto; min-width: 0; overflow: hidden; gap: 0;
        /* Slider tracks keep their own geometry but sit in the middle of taller rows. */
        align-items: center;
        min-height: var(--rsm-v2-control-height, 30px); border: 1px solid var(--rsm-v2-border); border-radius: var(--rsm-v2-element-radius, 5px); background: var(--rsm-v2-field-bg);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field-label {
        flex: 0 0 auto; align-self: stretch; display: flex; align-items: center;
        padding: 4px 8px; border-right: 1px solid var(--rsm-v2-border); white-space: nowrap;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-toggle-label {
        display: flex; flex: 1 1 auto; min-width: 0; align-items: center;
        padding: 4px 8px;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-toggle-field > .rsm-v2-toggle {
        flex: 0 0 auto; align-self: stretch; margin: 0;
        border: 0; border-left: 1px solid var(--rsm-v2-border); border-radius: 0;
        padding: 4px 9px;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-toggle-field-unlabeled > .rsm-v2-toggle {
        flex: 1 1 auto; border-left: 0;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-toggle-field > button.rsm-v2-toggle:active {
        transform: none;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-disabled .rsm-v2-toggle-field > .rsm-v2-toggle:disabled {
        opacity: 1;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > input,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > select,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > textarea {
        flex: 1 1 auto; min-width: 0; width: auto !important; min-height: var(--rsm-v2-control-height, 30px); border: 0;
        border-radius: 0; outline: 0; padding: 4px 8px; margin: 0;
        background: transparent; color: var(--rsm-v2-text);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > textarea {
        padding-top: 6px;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > .rsm-v2-feedback-valid {
        color: var(--rsm-v2-feedback-success-color, var(--rsm-v2-feedback-success)) !important;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > .rsm-v2-feedback-invalid {
        color: var(--rsm-v2-feedback-error-color, var(--rsm-v2-feedback-error)) !important;
    }
    /* Edge can open a native select popup without inheriting our
       theme colors. Match both the native scheme and option ink. */
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) select,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) select option,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) select optgroup {
        color-scheme: var(--rsm-v2-native-scheme) !important;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) select option,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) select optgroup {
        background-color: var(--rsm-v2-field-bg) !important;
        color: var(--rsm-v2-text) !important;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > input[type="color"] {
        flex: 1 1 100%; width: 100% !important;
        height: var(--rsm-v2-control-height, 30px); min-height: var(--rsm-v2-control-height, 30px);
        appearance: none; -webkit-appearance: none;
        padding: 6px !important; margin: 0; border: 0; border-radius: var(--rsm-v2-element-radius, 5px);
        background: transparent; cursor: pointer;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > input[type="color"]::-webkit-color-swatch {
        border: 1px solid var(--rsm-v2-border); border-radius: var(--rsm-v2-element-radius, 5px);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > input[type="color"]::-moz-color-swatch {
        border: 1px solid var(--rsm-v2-border); border-radius: var(--rsm-v2-element-radius, 5px);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > input:focus,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > select:focus,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > textarea:focus { box-shadow: inset 0 0 0 1px var(--rsm-v2-focus); }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-field > .rsm-v2-setting-unit {
        flex: 0 0 auto; display: flex; align-items: center; align-self: stretch;
        padding: 4px 8px; border-left: 1px solid var(--rsm-v2-border); color: var(--rsm-v2-muted);
        white-space: nowrap;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) input[type="text"],
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) select { width: 150px; }
    /* Keep numeric editing, but remove native spinner arrows from
       number controls and slider companion inputs alike. */
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) input[type="number"] {
        appearance: textfield !important; -moz-appearance: textfield !important;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) input[type="number"]::-webkit-inner-spin-button,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none !important; margin: 0;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) textarea { width: 150px; resize: both; }
    /* Clip overflow without making the group a scroll container;
       a nested collection header can then stick to the real pane. */
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-horizontalgroup { display: flex; flex-direction: row; width: 100%; max-width: 100%; gap: var(--rsm-v2-element-gap, 12px); align-items: stretch; overflow-x: clip; overflow-y: clip; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-verticalgroup { display: flex; flex-direction: column; gap: var(--rsm-v2-element-gap, 12px); }
    /* size is a width. In column layouts, a flex-basis would size height instead. */
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) :is(.rsm-v2-verticalgroup, .rsm-v2-panel-body, .rsm-v2-repeater, .rsm-v2-repeater-item) > .rsm-v2-sized {
        flex: 0 0 auto !important;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-repeater,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-repeater-item { display: flex; flex-direction: column; gap: var(--rsm-v2-element-gap, 12px); min-width: 0; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-repeater-headers {
        position: sticky; top: 0; z-index: 2;
        display: flex; flex-direction: row; gap: var(--rsm-v2-element-gap, 12px);
        width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;
        padding: 4px 0 6px; border-bottom: 1px solid var(--rsm-v2-divider);
        background: var(--rsm-v2-surface);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel .rsm-v2-repeater-headers {
        background: var(--rsm-v2-card);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-repeater-header-cell {
        display: flex; flex: 1 1 0; min-width: 0; box-sizing: border-box;
        align-items: center; justify-content: center; padding: 0 6px;
        color: var(--rsm-v2-muted); text-align: center; overflow-wrap: anywhere;
        font-weight: 600 !important;
    }
    /* A disabled layout fades as one surface; its nested disabled controls
       should not pick up a second opacity reduction. */
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-repeater.rsm-v2-disabled .rsm-v2-disabled,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-horizontalgroup.rsm-v2-disabled .rsm-v2-disabled,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-verticalgroup.rsm-v2-disabled .rsm-v2-disabled,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel.rsm-v2-disabled .rsm-v2-disabled { opacity: 1; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel {
        --rsm-v2-panel-padding: var(--rsm-v2-panel-padding-setting, 10px);
        display: flex; flex-direction: column; gap: var(--rsm-v2-element-gap, 12px);
        padding: var(--rsm-v2-panel-padding); border: 1px solid var(--rsm-v2-divider);
        border-radius: var(--rsm-v2-panel-radius);
        background: var(--rsm-v2-card);
        transition: row-gap 220ms ease-in-out, padding-bottom 220ms ease-in-out;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-limited { box-sizing: border-box; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-limited > .rsm-v2-panel-body {
        min-height: 0; overflow-y: auto; overflow-x: hidden;
        /* Let wheel scrolling continue into the main settings
           pane when this body has no more room to scroll. */
        overscroll-behavior-y: auto;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-collapsed {
        gap: 0; padding-bottom: 0; height: auto !important;
    }
    /* A collapsed panel in a row should shrink independently of
       taller siblings while keeping its assigned column width. */
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-horizontalgroup > .rsm-v2-panel-collapsed {
        align-self: flex-start;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-body {
        display: flex; flex-direction: column; gap: var(--rsm-v2-element-gap, 12px); min-width: 0;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-label {
        align-self: stretch; box-sizing: border-box;
        margin: calc(-1 * var(--rsm-v2-panel-padding)) calc(-1 * var(--rsm-v2-panel-padding)) 0;
        padding: 8px var(--rsm-v2-panel-padding);
        border: 0; border-bottom: 1px solid var(--rsm-v2-divider);
        border-radius: var(--rsm-v2-panel-radius) var(--rsm-v2-panel-radius) 0 0;
        background: var(--rsm-v2-header-bg);
        color: var(--rsm-v2-text); text-align: center; font-weight: 600 !important;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-toggle {
        position: relative; appearance: none; display: block; cursor: pointer;
        transition: none; transform: none; box-shadow: none; filter: none;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-toggle::after {
        content: "▾"; position: absolute; top: 50%; right: var(--rsm-v2-panel-padding);
        transform: translateY(-50%); transition: transform 140ms ease;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-collapsed > .rsm-v2-panel-toggle::after {
        transform: translateY(-50%) rotate(-90deg);
    }
    @media (prefers-reduced-motion: reduce) {
        :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel,
        :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-toggle::after { transition: none; }
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-collapsed > .rsm-v2-panel-label {
        border-bottom: 0;
        border-radius: var(--rsm-v2-panel-radius);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-body[hidden] { display: none !important; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-body .rsm-v2-field,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-settings-layout-root .rsm-v2-field,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-settings-layout-root button:not(.rsm-v2-panel-toggle):not(.rsm-v2-toggle) {
        border-radius: var(--rsm-v2-element-radius, 5px);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-verticalgroup > .rsm-v2-panel + .rsm-v2-panel,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-body > .rsm-v2-panel + .rsm-v2-panel,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-repeater > .rsm-v2-panel + .rsm-v2-panel,
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-repeater-item > .rsm-v2-panel + .rsm-v2-panel {
        margin-top: calc(var(--rsm-v2-panel-gap, 12px) - var(--rsm-v2-element-gap, 12px));
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-horizontalgroup > .rsm-v2-panel + .rsm-v2-panel {
        margin-left: calc(var(--rsm-v2-panel-gap, 12px) - var(--rsm-v2-element-gap, 12px));
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-disabled { opacity: .45; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-toggle-on {
        background: var(--rsm-v2-button-bg); color: var(--rsm-v2-button-text);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-toggle:not(.rsm-v2-toggle-on) {
        background: var(--rsm-v2-off-button-bg); color: var(--rsm-v2-off-button-text);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-toggle:disabled {
        background: var(--rsm-v2-disabled-button-bg);
        color: var(--rsm-v2-disabled-button-text);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider label { flex-wrap: wrap; }
    /* Draw the single slider with the same track and thumb colors
       as sliderPair. Native disabled range styling otherwise
       replaces the purple accent with browser-specific gray. */
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="range"] {
        flex: 1 1 0 !important; min-width: 0; width: auto !important;
        height: 24px; min-height: 24px; margin: 0 8px; padding: 0;
        border: 0; appearance: none; -webkit-appearance: none;
        outline: 0; background: transparent; cursor: pointer;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="range"]::-webkit-slider-runnable-track {
        height: 4px; border-radius: 4px;
        background: linear-gradient(to right,
            var(--rsm-v2-accent) var(--rsm-v2-slider-progress, 0%),
            var(--rsm-v2-track) var(--rsm-v2-slider-progress, 0%));
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="range"]::-moz-range-track {
        height: 4px; border-radius: 4px;
        background: linear-gradient(to right,
            var(--rsm-v2-accent) var(--rsm-v2-slider-progress, 0%),
            var(--rsm-v2-track) var(--rsm-v2-slider-progress, 0%));
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="range"]::-moz-range-progress {
        height: 4px; background: transparent;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="range"]::-webkit-slider-thumb {
        width: 14px; height: 14px; margin-top: -5px;
        border: 2px solid var(--rsm-v2-thumb-border); border-radius: 50%;
        background: var(--rsm-v2-thumb); appearance: none; -webkit-appearance: none;
        cursor: pointer;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="range"]::-moz-range-thumb {
        width: 14px; height: 14px;
        border: 2px solid var(--rsm-v2-thumb-border); border-radius: 50%;
        background: var(--rsm-v2-thumb); cursor: pointer;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="range"]:focus-visible::-webkit-slider-thumb {
        box-shadow: 0 0 0 2px var(--rsm-v2-focus);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="range"]:focus-visible::-moz-range-thumb {
        box-shadow: 0 0 0 2px var(--rsm-v2-focus);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="range"]:disabled {
        opacity: 1; cursor: default;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="range"]:disabled::-webkit-slider-thumb { cursor: default; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="range"]:disabled::-moz-range-thumb { cursor: default; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider .rsm-v2-field > input[type="number"],
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair-setting .rsm-v2-field > input[type="number"] {
        flex: 0 0 50px; width: 50px !important; min-width: 50px; max-width: 50px;
        border-left: 1px solid var(--rsm-v2-border); padding-inline: 4px;
        text-align: center !important;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair-setting label { flex-wrap: wrap; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair-setting .rsm-v2-field { align-items: center; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair {
        position: relative; display: block; flex: 1 1 0; min-width: 72px; height: 24px;
        margin: 0 8px; padding: 0; touch-action: none;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair-track {
        position: absolute; left: 8px; right: 8px; top: 50%; height: 4px;
        transform: translateY(-50%); border-radius: 4px; background: var(--rsm-v2-track);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair-fill {
        position: absolute; top: 0; bottom: 0; left: var(--slider-start);
        width: calc(var(--slider-end) - var(--slider-start)); border-radius: inherit;
        background: var(--rsm-v2-accent);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair > input[type="range"] {
        position: absolute; inset: 0; z-index: 1; width: 100%; height: 24px;
        margin: 0; padding: 0; border: 0; appearance: none; -webkit-appearance: none;
        outline: 0; background: transparent; pointer-events: none;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair > input[type="range"]::-webkit-slider-runnable-track {
        height: 4px; background: transparent;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair > input[type="range"]::-moz-range-track {
        height: 4px; background: transparent;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair > input[type="range"]::-webkit-slider-thumb {
        width: 14px; height: 14px; margin-top: -5px; border: 2px solid var(--rsm-v2-thumb-border);
        border-radius: 50%; background: var(--rsm-v2-thumb); appearance: none; -webkit-appearance: none;
        pointer-events: auto; cursor: pointer;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair > input[type="range"]::-moz-range-thumb {
        width: 14px; height: 14px; border: 2px solid var(--rsm-v2-thumb-border); border-radius: 50%;
        background: var(--rsm-v2-thumb); pointer-events: auto; cursor: pointer;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair > input[type="range"]:focus-visible::-webkit-slider-thumb {
        box-shadow: 0 0 0 2px var(--rsm-v2-focus);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair > input[type="range"]:focus-visible::-moz-range-thumb {
        box-shadow: 0 0 0 2px var(--rsm-v2-focus);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair > input[type="range"]:disabled::-webkit-slider-thumb { cursor: default; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair > input[type="range"]:disabled::-moz-range-thumb { cursor: default; }
    /* Both slider types keep their custom geometry but lose the
       accent while disabled, just like disabled buttons. */
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider.rsm-v2-disabled .rsm-v2-field > input[type="range"],
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-slider-pair-setting.rsm-v2-disabled .rsm-v2-slider-pair {
        filter: grayscale(1);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-label {
        margin: 0; min-width: 0; padding-inline: 8px; color: var(--rsm-v2-muted);
        overflow-wrap: anywhere;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-canvas {
        display: block; width: 100%; max-width: 100%; height: auto;
        box-sizing: border-box; border: 1px solid var(--rsm-v2-border);
        border-radius: var(--rsm-v2-element-radius, 5px);
        background: var(--rsm-v2-field-bg);
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-panel-body:has(> .rsm-v2-canvas-fill) {
        flex: 1 1 auto;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-canvas-fill {
        position: relative; display: block; flex: 1 1 auto;
        width: 100%; min-width: 0; min-height: min(55vh, 620px);
        height: 100%;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-canvas-fill > .rsm-v2-canvas {
        position: absolute; inset: 0; width: 100%; height: 100%;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-space {
        /* A wide spacer yields its room before neighboring controls clip. */
        display: block; flex: 0 1 auto; min-width: 0; min-height: 0; max-width: 100%;
        box-sizing: border-box; pointer-events: none;
    }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-divider { border: 0; border-top: 1px solid var(--rsm-v2-border); margin: 0; }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-divider span { display: block; margin-top: -10px; padding: 0 6px; width: max-content; background: var(--rsm-v2-surface); color: var(--rsm-v2-muted); }
    :is(#rsm-v2-settings-dialog, .rsm-v2-embedded-settings) .rsm-v2-divider-vertical {
        flex: 0 0 1px; align-self: stretch; width: 1px; min-width: 1px;
        min-height: var(--rsm-v2-control-height, 30px); border: 0; background: var(--rsm-v2-divider);
    }
`;

    let managerSettingsApi = null;

    function accessLevelFor(definition) {
        const level = definition?.accessLevel ?? 0;
        if (!Number.isInteger(level) || level < 0 || level >= ACCESS_LEVEL_NAMES.length) {
            throw new RangeError(`accessLevel must be an integer from 0 to ${ACCESS_LEVEL_NAMES.length - 1}.`);
        }
        return level;
    }

    function canAccess(definition) {
        return (managerSettingsApi?.get("modeLevel") ?? 0) >= accessLevelFor(definition);
    }

    function accessModeStatus(level) {
        return `Current mode: ${ACCESS_LEVEL_NAMES[level]} (level ${level}).`;
    }

    class DebugLogger {
        constructor(notify) {
            this.enabled = GM_getValue(DEBUG_KEY, true);
            this.categories = {...DEFAULT_DEBUG_CATEGORIES, ...(GM_getValue(DEBUG_CATEGORIES_KEY, {}) || {}) };
            this.notify = notify;
        }

        isEnabled(category = null) {
            if (!this.enabled) {
                return false;
            }
            if (category == null) {
                return true;
            }
            if (hasPropCall(this.categories, category)) {
                return this.categories[category] === true;
            }
            const parent = String(category).split(".")[0];
            return this.categories[parent] === true;
        }

        log(category, message, ...details) {
            if (this.isEnabled(category)) {
                console.debug(`[RSM][${category}] ${message}`, ...details);
            }
        }

        setCategory(category, enabled) {
            if (!category) {
                return false;
            }
            const previous = this.categories[category] === true;
            const next = Boolean(enabled);
            this.categories = { ...this.categories, [category]: next };
            GM_setValue(DEBUG_CATEGORIES_KEY, this.categories);
            this.notify(category, next, previous);
            this.log("core", "Debug category changed", { category, enabled: next });
            return next;
        }

        setCategories(categories = {}) {
            if (!categories || typeof categories !== "object") {
                return { ...this.categories };
            }
            const previous = this.categories;
            this.categories = { ...this.categories };
            for (const [category, enabled] of Object.entries(categories)) {
                this.categories[category] = Boolean(enabled);
            }
            GM_setValue(DEBUG_CATEGORIES_KEY, this.categories);
            for (const category of Object.keys(categories)) {
                this.notify(category, this.categories[category], previous[category] === true);
            }
            this.log("core", "Debug categories changed", { categories: this.categories });
            return { ...this.categories };
        }

        setEnabled(enabled) {
            const previous = this.enabled;
            this.enabled = Boolean(enabled);
            GM_setValue(DEBUG_KEY, this.enabled);
            this.notify("enabled", this.enabled, previous);
            this.log("core", "Debug logging changed", { enabled: this.enabled });
            return this.enabled;
        }
    }

    const logger = new DebugLogger((name, next, previous) => managerSettingsApi?.notify(name, next, previous));
    const debugLog = logger.log.bind(logger);
    const debugCategoryEnabled = logger.isEnabled.bind(logger);
    const setDebugCategory = logger.setCategory.bind(logger);
    const setDebugCategories = logger.setCategories.bind(logger);
    const setGlobalDebug = logger.setEnabled.bind(logger);

    debugLog("core", "Loading manager core", { version: MANAGER_VERSION, url: location.href });
    if (host.RSM) {
        debugLog("core", "Manager already exists; skipping duplicate initialization");
        return;
    }

    const features = new Map();
    const bindings = new Map();
    const featureEnabledCache = new Map();
    const urlRuleCache = new Map();
    let currentPageHashCache = null;
    const buttonPressAnimations = new WeakMap();
    const embeddedMounts = new Set();
    const storedFeatureId = GM_getValue(SELECTED_FEATURE_KEY, MANAGER_FEATURE_ID);
    let preferredFeatureId = MANAGER_FEATURE_ID;
    if (typeof storedFeatureId === "string" && storedFeatureId) {
        preferredFeatureId = storedFeatureId;
    }
    const settingsUI = {
        button: null,
        panel: null,
        dialog: null,
        style: null,
        selectedFeatureId: null,
        preferredFeatureId,
        renderedFeatureId: null,
        open: false,
        unsubs: [],
        dirty: false,
        renderQueued: false,
        waitingForBody: false
    };
    class DOMLifecycleController {
        constructor() {
            this.observer = null;
            this.started = false;
            this.lastObservedURL = location.href;
            this.deferredScanQueued = false;
            this.deferredRecords = [];
        }

        invoke(binding, callback, element, reason) {
            if (!callback) {
                return;
            }
            if (!binding.suppressSelfRetrigger || typeof this.observer?.takeRecords !== "function") {
                callback(element, context(binding, reason));
                return;
            }
            this.queueDeferred(this.observer.takeRecords(), null);
            try {
                callback(element, context(binding, reason));
            } finally {
                this.queueDeferred(this.observer.takeRecords(), binding.id);
            }
        }

        queueDeferred(records, originId) {
            if (records.length === 0) {
                return;
            }
            for (const record of records) {
                this.deferredRecords.push({ record, originId });
            }
            if (this.deferredScanQueued) {
                return;
            }
            this.deferredScanQueued = true;
            queueMicrotask(() => {
                this.deferredScanQueued = false;
                const batch = this.deferredRecords.splice(0);
                if (this.started) {
                    this.process(batch);
                }
            });
        }

        process(taggedRecords) {
            restoreSettingsStyle();
            cleanupDetachedManagedMounts();
            if (bindings.size === 0) {
                return;
            }
            const url = location.href;
            const routeChanged = url !== this.lastObservedURL;
            const pageRecords = taggedRecords.filter(({ record }) => !isManagerUIMutation(record));
            if (!routeChanged && pageRecords.length === 0) {
                return;
            }
            this.lastObservedURL = url;
            for (const { binding } of bindings.values()) {
                const hasExternalRecord = pageRecords.some(({ originId }) => originId !== binding.id);
                if (routeChanged || hasExternalRecord) {
                    runBinding(binding, "update");
                } else if (pageRecords.length > 0) {
                    runBinding(binding, "update", { skipExistingUpdates: true });
                }
            }
        }

        start() {
            if (this.started) {
                return api;
            }
            this.started = true;
            debugLog("lifecycle", "Starting DOM observer", { bindingCount: bindings.size });
            this.lastObservedURL = location.href;
            this.observer = new MutationObserver((records) => {
                this.process(records.map((record) => ({ record, originId: null })));
            });
            this.observer.observe(document.documentElement, {
                childList: true, subtree: true, attributes: true, characterData: true
            });
            for (const featureId of features.keys()) {
                featureRegistry.run(featureId);
            }
            return api;
        }

        stop() {
            debugLog("lifecycle", "Stopping manager", { bindingCount: bindings.size });
            this.observer?.disconnect();
            this.observer = null;
            this.started = false;
            this.deferredRecords.length = 0;
            for (const { binding, seen } of bindings.values()) {
                for (const element of seen) {
                    this.invoke(binding, binding.onRemove, element, "stop");
                }
                seen.clear();
            }
            for (const mount of Array.from(embeddedMounts)) {
                mount.unmount();
            }
            return api;
        }
    }

    const lifecycle = new DOMLifecycleController();

    function toArray(value) {
        if (value == null) {
            return [];
        }
        return Array.isArray(value) ? value : [value];
    }

    function hasPropCall(object, key) {
        return Object.prototype.hasOwnProperty.call(object, key);
    }

    function createLookup(entries) {
        return Object.assign(Object.create(null), entries);
    }

    function unsubscribeAll(unsubscribers) {
        for (const unsubscribe of unsubscribers) {
            unsubscribe();
        }
    }

    function exposeMethods(instance, prototype) {
        for (const [name, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(prototype))) {
            if (name !== "constructor" && typeof descriptor.value === "function") {
                instance[name] = descriptor.value.bind(instance);
            }
        }
    }

    const SHA256_K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    function sha256(value) {
        const bytes = Array.from(new TextEncoder().encode(value));
        const bitLength = bytes.length * 8;
        bytes.push(0x80);
        while (bytes.length % 64 !== 56) {
            bytes.push(0);
        }
        const high = Math.floor(bitLength / 0x100000000);
        const low = bitLength >>> 0;
        for (const word of [high, low]) {
            for (let shift = 24; shift >= 0; shift -= 8) {
                bytes.push((word >>> shift) & 0xff);
            }
        }

        const state = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
        const words = new Uint32Array(64);
        const rotate = (word, count) => (word >>> count) | (word << (32 - count));
        for (let offset = 0; offset < bytes.length; offset += 64) {
            for (let index = 0; index < 16; index += 1) {
                const position = offset + index * 4;
                words[index] = ((bytes[position] << 24) | (bytes[position + 1] << 16)
                    | (bytes[position + 2] << 8) | bytes[position + 3]) >>> 0;
            }
            for (let index = 16; index < 64; index += 1) {
                const first = words[index - 15];
                const second = words[index - 2];
                const sigma0 = rotate(first, 7) ^ rotate(first, 18) ^ (first >>> 3);
                const sigma1 = rotate(second, 17) ^ rotate(second, 19) ^ (second >>> 10);
                words[index] = (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
            }

            let [a, b, c, d, e, f, g, h] = state;
            for (let index = 0; index < 64; index += 1) {
                const sum1 = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25);
                const choose = (e & f) ^ (~e & g);
                const temp1 = (h + sum1 + choose + SHA256_K[index] + words[index]) >>> 0;
                const sum0 = rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22);
                const majority = (a & b) ^ (a & c) ^ (b & c);
                const temp2 = (sum0 + majority) >>> 0;
                h = g;
                g = f;
                f = e;
                e = (d + temp1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (temp1 + temp2) >>> 0;
            }
            for (const [index, value] of [a, b, c, d, e, f, g, h].entries()) {
                state[index] = (state[index] + value) >>> 0;
            }
        }
        return state.map((word) => word.toString(16).padStart(8, "0")).join("");
    }

    function hashCurrentPage(target = "url") {
        if (target !== "url" && target !== "origin") {
            throw new TypeError("Hash target must be 'url' or 'origin'.");
        }
        if (!currentPageHashCache || currentPageHashCache.href !== location.href) {
            const parsed = new URL(location.href);
            currentPageHashCache = { href: location.href, origin: parsed.origin, url: `${parsed.origin}${parsed.pathname}` };
        }
        if (!currentPageHashCache[`${target}Hash`]) {
            currentPageHashCache[`${target}Hash`] = sha256(currentPageHashCache[target]);
        }
        return currentPageHashCache[`${target}Hash`];
    }

    function hashRuleMatches(rule, hash) {
        if (typeof rule !== "string") {
            return false;
        }
        const digest = rule.trim().replace(/^sha256:/i, "").toLowerCase();
        return /^[0-9a-f]{64}$/.test(digest) && digest === hash;
    }

    function currentPageMatches(page = {}) {
        const urls = toArray(page.urls || page.url);
        const urlsHashed = [...toArray(page.urlHashed), ...toArray(page.urlsHashed)];
        const urlsOrigin = [...toArray(page.urlOrigin), ...toArray(page.urlsOrigin)];
        const hasRules = urls.length + urlsHashed.length + urlsOrigin.length > 0;
        const matches = urls.some((rule) => urlMatches(rule, location.href)) || (urlsHashed.length > 0 && urlsHashed.some((rule) => hashRuleMatches(rule, hashCurrentPage("url")))) || (urlsOrigin.length > 0 && urlsOrigin.some((rule) => hashRuleMatches(rule, hashCurrentPage("origin"))));
        if (hasRules && !matches) {
            return false;
        }

        if (typeof page.check === "function" && !page.check({
            window,
            document,
            location,
            manager: api
        })) {
            return false;
        }

        return true;
    }

    function urlMatches(rule, url) {
        if (typeof rule === "function") {
            return Boolean(rule(url, location));
        }
        if (rule instanceof RegExp) {
            rule.lastIndex = 0;
            return rule.test(url);
        }
        if (typeof rule !== "string") {
            return false;
        }

        if (rule.startsWith("sha256:")) {
            return false;
        }

        let regex = urlRuleCache.get(rule);
        if (!regex) {
            const escaped = rule.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
            regex = new RegExp(`^${escaped}$`);
            if (urlRuleCache.size >= 256) {
                urlRuleCache.clear();
            }
            urlRuleCache.set(rule, regex);
        }
        return regex.test(url);
    }

    function pageIsActive(binding) {
        return currentPageMatches(binding.page || binding.pages || {});
    }

    function settingBindingIds(definition = {}) {
        return toArray(definition.bindingIds || definition.bindingId).filter(Boolean);
    }

    function settingBindingsAllowed(definition = {}) {
        const ids = settingBindingIds(definition);
        if (ids.length === 0) {
            return true;
        }
        const allowed = ids.map((id) => {
            const registered = bindings.get(id);
            return Boolean(registered && pageIsActive(registered.binding));
        });
        return definition.bindingMode === "all" ? allowed.every(Boolean) : allowed.some(Boolean);
    }

    function featurePageAllowed(feature) {
        const featureBindings = toArray(feature?.bindings || feature?.binding);
        return featureBindings.length === 0 || featureBindings.some(pageIsActive);
    }

    function findMatches(selector, root = document) {
        if (!selector) {
            return [];
        }
        if (typeof selector === "function") {
            return toArray(selector({ document, root, window }));
        }
        if (selector instanceof Element || selector === document) {
            return [selector];
        }
        if (root instanceof Element && root.matches(selector)) {
            return [root, ...root.querySelectorAll(selector)];
        }
        return root.querySelectorAll(selector);
    }

    function invokeBindingCallback(binding, callback, element, reason) {
        return lifecycle.invoke(binding, callback, element, reason);
    }

    class ManagedBinding {
        constructor(binding) {
            this.binding = binding;
            this.seen = new Set();
            this.pageAllowed = undefined;
        }

        run(reason, { skipExistingUpdates = false } = {}) {
            const binding = this.binding;
            const pageAllowed = pageIsActive(binding);
            if (this.pageAllowed !== pageAllowed) {
                this.pageAllowed = pageAllowed;
                queueSettingsUI();
            }

            if (!pageAllowed) {
                for (const element of this.seen) {
                    if (!document.contains(element)) {
                        this.seen.delete(element);
                        invokeBindingCallback(binding, binding.onRemove, element, "remove");
                    }
                }
                return;
            }
            if (binding.featureId && !featureRegistry.isEnabled(binding.featureId)) {
                return;
            }

            const matches = findMatches(binding.selector || binding.target);
            const current = new Set(matches);
            for (const element of matches) {
                const newlySeen = !this.seen.has(element);
                if (newlySeen) {
                    this.seen.add(element);
                    invokeBindingCallback(binding, binding.onCreate, element, reason);
                }
                if ((!skipExistingUpdates || newlySeen) &&
                    (binding.events?.includes("update") || binding.onUpdate)) {
                    invokeBindingCallback(binding, binding.onUpdate, element, reason);
                }
            }
            for (const element of this.seen) {
                if (!document.contains(element) || !current.has(element)) {
                    this.seen.delete(element);
                    invokeBindingCallback(binding, binding.onRemove, element, "remove");
                }
            }
        }
    }

    function runBinding(binding, reason, options = {}) {
        bindings.get(binding.id).run(reason, options);
    }

    class FeatureCallbackContext {
        constructor(feature, settings, details = {}) {
            Object.assign(this, details);
            this.manager = api;
            this.feature = feature;
            this.Network = feature?.Network || api.Network || null;
            this.settings = settings;
            this.ui = feature?.ui || null;
            this.collection = details.collection ?? settings?.collectionApi ?? null;
            this.itemId = details.itemId ?? settings?.itemId ?? null;
            this.item = hasPropCall(details, "item") ? details.item : this.collection?.get(this.itemId) ?? null;
            this.row = this.itemId == null ? null : {
                id: this.itemId, item: this.item, collection: this.collection,
                settings,
                get index() {
                    return this.collection.indexOf(this.id);
                }
            };
        }
    }

    class FeatureRuntime {
        constructor(definition, settingsStore = null) {
            this.config = definition;
            this.id = definition.id;
            this.schema = definition.settings || {};
            this.settings = settingsStore || new FeatureSettingsStore(this.id, this.schema);
            this.settings.feature = this;
            this.ui = new FeatureUIController(this);
            this.Network = Object.freeze({
                subscribe: (options) => networkSubscriptions.subscribe(this.id, options)
            });
            exposeMethods(this, FeatureRuntime.prototype);
        }

        get name() { return this.config.name; }
        get version() { return this.config.version; }
        get description() { return this.config.description; }
        get settingsUI() { return this.config.settingsUI; }
        set settingsUI(layout) { this.config.settingsUI = layout; }
        get bindings() { return this.config.bindings; }
        get binding() { return this.config.binding; }
        get enabled() { return this.config.enabled; }
        get onInit() { return this.config.onInit; }
        get onStart() { return this.config.onStart; }
        get onStop() { return this.config.onStop; }

        context(details = {}, settings = this.settings) {
            return new FeatureCallbackContext(this, settings, details);
        }

        isEnabled() {
            return featureRegistry.isEnabled(this.id);
        }

        setEnabled(enabled) {
            return featureRegistry.setEnabled(this.id, enabled);
        }

        bind(binding) {
            return featureRegistry.bind({ ...binding, featureId: this.id });
        }
    }

    function context(binding, reason) {
        const feature = features.get(binding.featureId) || null;
        return new FeatureCallbackContext(feature, feature?.settings || null, { binding, reason, document, window, location });
    }

    class FeatureRegistry {
        constructor(features, bindings, enabledCache, mounts) {
            this.features = features;
            this.bindings = bindings;
            this.enabledCache = enabledCache;
            this.mounts = mounts;
        }

        enabledKey(featureId) {
            return `${STORAGE_PREFIX}feature.${featureId}.enabled`;
        }

        isEnabled(featureId) {
            if (featureId === MANAGER_FEATURE_ID) {
                return true;
            }
            if (!this.enabledCache.has(featureId)) {
                const feature = this.features.get(featureId);
                this.enabledCache.set(featureId, GM_getValue(this.enabledKey(featureId), feature?.enabled !== false));
            }
            return this.enabledCache.get(featureId) === true;
        }

        stop(featureId, reason = "disabled") {
            const feature = this.features.get(featureId);
            if (!feature) {
                return;
            }
            networkSubscriptions.setFeatureActive(featureId, false);
            debugLog("lifecycle", "Stopping feature", { featureId, reason });
            feature.onStop?.(context({ featureId }, "feature-stop"));
            for (const state of this.bindings.values()) {
                if (state.binding.featureId !== featureId) {
                    continue;
                }
                for (const element of state.seen) {
                    invokeBindingCallback(state.binding, state.binding.onRemove, element, "feature-stop");
                }
                state.seen.clear();
            }
            for (const mount of Array.from(this.mounts)) {
                if (mount.featureId === featureId) {
                    mount.unmount();
                }
            }
        }

        setEnabled(featureId, enabled) {
            if (featureId === MANAGER_FEATURE_ID || !this.features.has(featureId)) {
                return false;
            }
            const next = Boolean(enabled);
            const previous = this.isEnabled(featureId);
            if (previous === next) {
                return next;
            }
            this.enabledCache.set(featureId, next);
            GM_setValue(this.enabledKey(featureId), next);
            debugLog("feature", "Feature enabled state changed", { featureId, previous, enabled: next });
            if (previous && !next) {
                this.stop(featureId);
            }
            if (!previous && next && lifecycle.started) {
                this.run(featureId);
            }
            queueSettingsUI();
            return next;
        }

        register(definition) {
            if (!definition?.id) {
                throw new Error("A feature requires an id.");
            }
            if (this.features.has(definition.id)) {
                throw new Error(`Feature already registered: ${definition.id}`);
            }
            accessLevelFor(definition);
            for (const [name, settingDefinition] of Object.entries(definition.settings || {})) {
                settingTypeFor(settingDefinition).validateDefinition(settingDefinition, name);
            }
            const feature = new FeatureRuntime(definition);
            this.features.set(feature.id, feature);
            this.enabledCache.set(feature.id, GM_getValue(this.enabledKey(feature.id), feature.enabled !== false));
            feature.onInit?.(feature.settings);
            debugLog("feature", "Feature registered", {
                id: feature.id,
                name: feature.name || feature.id,
                version: feature.version || "unknown",
                bindingCount: toArray(feature.bindings || feature.binding).length,
                settingCount: Object.keys(feature.schema).length
            });
            for (const binding of toArray(feature.bindings || feature.binding)) {
                this.bind({ ...binding, featureId: feature.id }, false);
            }
            if (lifecycle.started) {
                this.run(feature.id);
            }
            queueSettingsUI();
            return feature;
        }

        bind(binding, runImmediately = true) {
            if (!binding?.id) {
                throw new Error("A binding requires an id.");
            }
            if (!binding.selector && !binding.target) {
                throw new Error(`Binding requires a selector: ${binding.id}`);
            }
            const normalized = {
                events: ["create", "update"],
                ...binding,
                selector: binding.selector || binding.target,
                suppressSelfRetrigger: binding.suppressSelfRetrigger === true
            };
            this.bindings.set(normalized.id, new ManagedBinding(normalized));
            debugLog("binding", "Binding registered", {
                id: normalized.id,
                featureId: normalized.featureId,
                selector: normalized.selector,
                events: normalized.events,
                suppressSelfRetrigger: normalized.suppressSelfRetrigger,
                page: normalized.page || normalized.pages || null
            });
            if (lifecycle.started && runImmediately) {
                runBinding(normalized, "bind");
            }
            return normalized;
        }

        run(featureId) {
            if (!this.isEnabled(featureId)) {
                debugLog("feature", "Feature is disabled; skipping start", { featureId });
                return;
            }
            networkSubscriptions.setFeatureActive(featureId, true);
            debugLog("lifecycle", "Starting feature", { featureId });
            for (const { binding } of this.bindings.values()) {
                if (binding.featureId === featureId) {
                    runBinding(binding, "feature-start");
                }
            }
            this.features.get(featureId)?.onStart?.(context({ featureId }, "feature-start"));
        }
    }

    const featureRegistry = new FeatureRegistry(features, bindings, featureEnabledCache, embeddedMounts);

    class NetworkSubscriptionManager {
        constructor() {
            this.subscriptions = new Map();
            this.requestMetadata = new WeakMap();
            this.nextSubscriptionId = 1;
            this.installed = false;
            this.prototype = null;
            this.originalOpen = null;
            this.originalSend = null;
            this.wrappedOpen = null;
            this.wrappedSend = null;
        }

        managerAPI() {
            return Object.freeze({
                subscribe: (options = {}) => {
                    if (!options.featureId) {
                        throw new TypeError("Manager Network.subscribe requires featureId; use feature.Network.subscribe() for a feature-scoped subscription.");
                    }
                    return this.subscribe(options.featureId, options);
                }
            });
        }

        subscribe(featureId, options = {}) {
            if (!features.has(featureId)) {
                throw new Error("Cannot subscribe for an unknown feature: " + featureId);
            }
            const urls = toArray(options.urls || options.url);
            if (urls.length === 0) {
                throw new TypeError("A network subscription requires url or urls.");
            }
            if (typeof options.callback !== "function") {
                throw new TypeError("A network subscription requires a callback function.");
            }
            if (!this.install()) {
                throw new Error("XMLHttpRequest is unavailable in this page context.");
            }

            const id = this.nextSubscriptionId;
            this.nextSubscriptionId += 1;
            const subscription = {
                id,
                featureId,
                urls,
                methods: toArray(options.methods || options.method).map((method) => String(method).toUpperCase()),
                callback: options.callback,
                active: featureRegistry.isEnabled(featureId)
            };
            this.subscriptions.set(id, subscription);
            if (!subscription.active && !this.hasActiveSubscriptions()) {
                this.uninstall();
            }
            return () => this.unsubscribe(id);
        }

        unsubscribe(id) {
            const removed = this.subscriptions.delete(id);
            if (removed && !this.hasActiveSubscriptions()) {
                this.uninstall();
            }
            return removed;
        }

        setFeatureActive(featureId, active) {
            let changed = false;
            for (const subscription of this.subscriptions.values()) {
                if (subscription.featureId === featureId && subscription.active !== active) {
                    subscription.active = active;
                    changed = true;
                }
            }
            if (!changed) {
                return;
            }
            if (this.hasActiveSubscriptions()) {
                this.install();
            } else {
                this.uninstall();
            }
        }

        hasActiveSubscriptions() {
            return Array.from(this.subscriptions.values()).some((subscription) => subscription.active);
        }

        install() {
            if (this.installed) {
                return true;
            }
            const prototype = host.XMLHttpRequest && host.XMLHttpRequest.prototype;
            if (!prototype || typeof prototype.open !== "function" || typeof prototype.send !== "function") {
                return false;
            }

            this.prototype = prototype;
            this.originalOpen = prototype.open;
            this.originalSend = prototype.send;
            const observer = this;
            this.wrappedOpen = function (method, url, ...args) {
                observer.requestMetadata.set(this, {
                    method: String(method || "GET").toUpperCase(),
                    url: String(url)
                });
                return Reflect.apply(observer.originalOpen, this, [method, url, ...args]);
            };
            this.wrappedSend = function (...args) {
                return observer.sendObserved(this, args);
            };
            try {
                prototype.open = this.wrappedOpen;
                prototype.send = this.wrappedSend;
                this.installed = prototype.open === this.wrappedOpen && prototype.send === this.wrappedSend;
            } catch (error) {
                this.installed = false;
                console.warn("[RSM] Could not observe XMLHttpRequest", error);
            }
            return this.installed;
        }

        uninstall() {
            if (!this.installed) {
                return;
            }
            if (this.prototype.open === this.wrappedOpen) {
                this.prototype.open = this.originalOpen;
            }
            if (this.prototype.send === this.wrappedSend) {
                this.prototype.send = this.originalSend;
            }
            this.installed = false;
            this.prototype = null;
            this.originalOpen = null;
            this.originalSend = null;
            this.wrappedOpen = null;
            this.wrappedSend = null;
            this.requestMetadata = new WeakMap();
        }

        urlMatches(rule, url, method) {
            if (typeof rule === "function") {
                return Boolean(rule(url, method));
            }
            if (rule instanceof RegExp) {
                rule.lastIndex = 0;
                return rule.test(url);
            }
            if (typeof rule !== "string" || !rule) {
                return false;
            }
            if (!rule.includes("*")) {
                return url.includes(rule);
            }
            const escaped = Array.from(rule).map((character) => {
                return ".+^$?(){}|[]\\".includes(character) ? "\\" + character : character;
            }).join("");
            return new RegExp(escaped.replace(/\*/g, ".*")).test(url);
        }

        matchingSubscriptions(url, method) {
            return Array.from(this.subscriptions.values()).filter((subscription) => subscription.active && (subscription.methods.length === 0 || subscription.methods.includes(method)) && subscription.urls.some((rule) => this.urlMatches(rule, url, method)));
        }

        sendObserved(xhr, args) {
            const metadata = this.requestMetadata.get(xhr);
            const subscribers = metadata ? this.matchingSubscriptions(metadata.url, metadata.method) : [];
            if (subscribers.length === 0) {
                return Reflect.apply(this.originalSend, xhr, args);
            }

            const startedAt = Date.now();
            let completed = false;
            const eventListeners = new Map();
            const finish = (event, thrownError = null) => {
                if (completed) {
                    return;
                }
                completed = true;
                for (const [eventType, listener] of eventListeners) {
                    xhr.removeEventListener(eventType, listener);
                }
                const status = Number(xhr.status) || 0;
                const success = event.type === "load" && status >= 200 && status < 300;
                let response = null;
                let responseText = null;
                let statusText = "";
                try {
                    response = xhr.response;
                } catch (_) {}
                try {
                    responseText = xhr.responseText;
                } catch (_) {}
                try {
                    statusText = xhr.statusText || "";
                } catch (_) {}
                const error = thrownError || event.error || (success ? null : {
                    type: event.type === "load" ? "http" : event.type,
                    status,
                    statusText
                });
                const details = {
                    url: metadata.url,
                    method: metadata.method,
                    requestBody: args[0] ?? null,
                    xhr,
                    status,
                    statusText,
                    response,
                    responseText,
                    responseType: xhr.responseType || "",
                    success,
                    failed: !success,
                    failureType: success ? null : (event.type === "load" ? "http" : event.type),
                    error,
                    event,
                    duration: Date.now() - startedAt
                };

                for (const subscription of subscribers) {
                    if (this.subscriptions.get(subscription.id) !== subscription || !subscription.active) {
                        continue;
                    }
                    const feature = features.get(subscription.featureId);
                    if (!feature || !featureRegistry.isEnabled(subscription.featureId)) {
                        continue;
                    }
                    try {
                        subscription.callback(feature.context(details));
                    } catch (callbackError) {
                        console.error("[RSM] Network subscriber callback failed", {
                            featureId: subscription.featureId,
                            url: metadata.url,
                            error: callbackError
                        });
                    }
                }
            };
            try {
                for (const eventType of ["load", "error", "abort", "timeout"]) {
                    const listener = (event) => finish(event);
                    eventListeners.set(eventType, listener);
                    xhr.addEventListener(eventType, listener);
                }
            } catch (_) {
                for (const [eventType, listener] of eventListeners) {
                    xhr.removeEventListener(eventType, listener);
                }
                return Reflect.apply(this.originalSend, xhr, args);
            }
            try {
                return Reflect.apply(this.originalSend, xhr, args);
            } catch (error) {
                finish({ type: "exception", error }, error);
                throw error;
            }
        }
    }

    const networkSubscriptions = new NetworkSubscriptionManager();
    const managerNetworkAPI = networkSubscriptions.managerAPI();

    function isManagerUINode(node) {
        const element = node instanceof Element ? node : node.parentElement;
        return Boolean(element?.closest?.(
            "#rsm-v2-settings-panel, #rsm-v2-settings-button, #rsm-v2-settings-style"
        ));
    }

    function isManagerUIMutation(record) {
        if (isManagerUINode(record.target)) {
            return true;
        }
        if (record.type !== "childList") {
            return false;
        }
        const changed = [...record.addedNodes, ...record.removedNodes];
        return changed.length > 0 && changed.every(isManagerUINode);
    }

    function restoreSettingsStyle() {
        if (settingsUI.style && document.head && !document.head.contains(settingsUI.style)) {
            document.head.appendChild(settingsUI.style);
        }
    }

    function cleanupDetachedManagedMounts() {
        for (const mount of Array.from(embeddedMounts)) {
            if (mount.slot && !document.contains(mount.anchor)) {
                mount.unmount();
            }
        }
    }

    function start() {
        return lifecycle.start();
    }

    function stop() {
        return lifecycle.stop();
    }

    function valuesEqual(left, right) {
        if (Object.is(left, right)) {
            return true;
        }
        if (Array.isArray(left) || Array.isArray(right)) {
            return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => valuesEqual(value, right[index]));
        }
        if (!left || !right || typeof left !== "object" || typeof right !== "object") {
            return false;
        }
        const keys = Object.keys(left);
        return keys.length === Object.keys(right).length && keys.every((key) => hasPropCall(right, key) && valuesEqual(left[key], right[key]));
    }

    function cloneValue(value) {
        if (Array.isArray(value)) {
            return value.map(cloneValue);
        }
        if (value && typeof value === "object") {
            return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
        }
        return value;
    }

    class TextSettingType {
        static get defaultControl() {
            return "textInput";
        }

        static get autoRender() {
            return true;
        }

        static get isCollection() {
            return false;
        }

        static validateDefinition() {}

        static notifyChange() {}

        static sanitize(definition, value) {
            const text = value == null ? (definition.default ?? "") : String(value);
            return definition.maxLength ? text.slice(0, definition.maxLength) : text;
        }

        static copy(value) {
            return Array.isArray(value) ? value.slice() : value;
        }

        static inputValue(value) {
            return value ?? "";
        }
    }

    class ToggleSettingType extends TextSettingType {
        static get defaultControl() {
            return "toggle";
        }

        static sanitize(definition, value) {
            if (typeof value === "boolean") {
                return value;
            }
            if (value === "true" || value === 1 || value === "1") {
                return true;
            }
            if (value === "false" || value === 0 || value === "0") {
                return false;
            }
            return Boolean(definition.default ?? null);
        }

        static inputValue(value) {
            return Boolean(value);
        }
    }

    class NumericSettingType extends TextSettingType {
        static clampToBounds(definition, number) {
            if (Number.isFinite(definition.min)) {
                number = Math.max(definition.min, number);
            }
            if (Number.isFinite(definition.max)) {
                number = Math.min(definition.max, number);
            }
            return number;
        }

        static sanitizeNumber(definition, value, fallback, clampAfterStep = false) {
            let number = Number(value);
            if (!Number.isFinite(number)) {
                number = Number(fallback ?? 0);
            }
            number = this.clampToBounds(definition, number);
            if (Number.isFinite(definition.step) && definition.step > 0) {
                const origin = Number.isFinite(definition.min) ? definition.min : 0;
                number = origin + Math.round((number - origin) / definition.step) * definition.step;
            }
            if (clampAfterStep) {
                number = this.clampToBounds(definition, number);
            }
            return number;
        }
    }

    class SliderSettingType extends NumericSettingType {
        static get defaultControl() {
            return "slider";
        }

        static sanitize(definition, value) {
            return this.sanitizeNumber(definition, value, definition.default ?? 0);
        }
    }

    class SliderPairSettingType extends NumericSettingType {
        static get defaultControl() {
            return "sliderPair";
        }

        static sanitize(definition, value) {
            const fallback = Array.isArray(definition.default) ? definition.default : [definition.min ?? 0, definition.max ?? 100];
            const pair = Array.isArray(value) && value.length === 2 ? value : fallback;
            const first = this.sanitizeNumber(definition, pair[0], fallback[0], true);
            const second = this.sanitizeNumber(definition, pair[1], fallback[1], true);
            return first <= second ? [first, second] : [second, first];
        }
    }

    class DropdownSettingType extends TextSettingType {
        static get defaultControl() {
            return "dropdown";
        }

        static sanitize(definition, value) {
            const options = toArray(definition.options).map((option) => {
                return typeof option === "object" ? option.value : option;
            });
            if (options.length === 0 || options.includes(value)) {
                return value;
            }
            return definition.default ?? options[0];
        }
    }

    class ColorSettingType extends TextSettingType {
        static get defaultControl() {
            return "color";
        }

        static sanitize(definition, value) {
            const color = String(value ?? definition.default ?? "");
            return /^#[0-9a-f]{6}$/i.test(color) ? color : (definition.default || "#000000");
        }
    }

    class CollectionSettingType extends TextSettingType {
        static get defaultControl() {
            return "repeater";
        }

        static get autoRender() {
            return false;
        }

        static get isCollection() {
            return true;
        }

        static validateDefinition(definition, name) {
            this.headers(definition, name);
        }

        static headers(definition, name) {
            const headers = definition?.headers;
            if (headers == null) {
                return [];
            }
            if (!Array.isArray(headers) || !headers.every((header) => typeof header === "string")) {
                throw new TypeError(`Collection headers for ${name} must be an array of strings.`);
            }
            return headers;
        }

        static notifyChange(definition, next, previous, info) {
            notifyCollectionChanges(definition, next, previous, info);
        }

        static copy(value) {
            return cloneValue(value);
        }

        static sanitize(definition, value, context) {
            let rows;
            if (Array.isArray(value)) {
                rows = value;
            } else if (Array.isArray(definition.default)) {
                rows = definition.default;
            } else {
                rows = [];
            }
            const fields = definition.item || {};
            const ids = new Set();
            const fieldContext = (item, field) => context.feature ? context.feature.context({ ...context, item, itemId: item.id, field }, context.settings) : { ...context, item, field };
            return rows.flatMap((raw) => {
                if (!raw || typeof raw !== "object" || Array.isArray(raw) || typeof raw.id !== "string" || !raw.id || ids.has(raw.id)) {
                    return [];
                }
                ids.add(raw.id);
                const item = { id: raw.id };
                for (const [field, fieldDefinition] of Object.entries(fields)) {
                    let initialDefinition = fieldDefinition;
                    if (typeof fieldDefinition.options === "function") {
                        initialDefinition = { ...fieldDefinition, options: [] };
                    }
                    const info = fieldContext(item, field);
                    const candidate = initialDefinition.sanitize ? initialDefinition.sanitize(raw[field], info) : sanitizeValue(initialDefinition, raw[field], info);
                    item[field] = valueIsValid(initialDefinition, candidate, info) ? candidate : sanitizeValue(initialDefinition, initialDefinition.default, info);
                }
                for (const [field, fieldDefinition] of Object.entries(fields)) {
                    if (typeof fieldDefinition.options !== "function") {
                        continue;
                    }
                    const info = fieldContext(item, field);
                    const resolved = { ...fieldDefinition, options: fieldDefinition.options(info) };
                    item[field] = sanitizeValue(resolved, item[field], info);
                }
                return [item];
            });
        }
    }

    const SETTING_TYPES = createLookup({
        text: TextSettingType,
        toggle: ToggleSettingType,
        slider: SliderSettingType,
        sliderPair: SliderPairSettingType,
        dropdown: DropdownSettingType,
        color: ColorSettingType,
        collection: CollectionSettingType
    });

    function settingTypeFor(definition = {}) {
        return SETTING_TYPES[definition.type] || TextSettingType;
    }

    function copySettingValue(definition, value) {
        return settingTypeFor(definition).copy(value);
    }

    function sanitizeValue(definition = {}, value, context = {}) {
        return settingTypeFor(definition).sanitize(definition, value, context);
    }

    function valueIsValid(definition = {}, value, info) {
        if (definition.regex || definition.pattern) {
            const pattern = definition.regex || definition.pattern;
            const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
            regex.lastIndex = 0;
            if (!regex.test(String(value))) {
                return false;
            }
        }
        return definition.validate ? Boolean(definition.validate(value, info)) : true;
    }

    function notifyCollectionChanges(definition, next, previous, info) {
        const before = new Map(previous.map((item) => [item.id, item]));
        const after = new Map(next.map((item) => [item.id, item]));
        const collection = info.feature.settings.collection(info.name);
        const eventFor = (type, item, details = {}) => info.feature.context({ ...info, type, id: item.id, itemId: item.id, item: cloneValue(item), collection, ...details });
        for (const item of next) {
            const old = before.get(item.id);
            if (!old) {
                definition.onItemChange?.(eventFor("add", item));
                continue;
            }
            for (const [field, fieldDefinition] of Object.entries(definition.item || {})) {
                if (valuesEqual(old[field], item[field])) {
                    continue;
                }
                const event = eventFor("update", item, {
                    field, value: item[field], previous: old[field]
                });
                definition.onItemChange?.(event);
                if (settingBindingsAllowed(fieldDefinition)) {
                    fieldDefinition.onChange?.(item[field], old[field], event);
                }
            }
        }
        for (const item of previous) {
            if (!after.has(item.id)) {
                definition.onItemChange?.(eventFor("remove", item));
            }
        }
    }

    function invalidateSettingsKey(key) {
        if (typeof key !== "string") {
            return;
        }
        for (const feature of features.values()) {
            feature.settings.invalidateKey?.(key);
        }
    }

    class CollectionStore {
        constructor(settings, name, definition, currentRows) {
            this.settings = settings;
            this.name = name;
            this.definition = definition;
            this.currentRows = currentRows;
            exposeMethods(this, CollectionStore.prototype);
        }

        list() {
            return this.settings.get(this.name);
        }

        get(id) {
            const item = this.currentRows().find((row) => row.id === id);
            return item ? cloneValue(item) : null;
        }

        getAt(index) {
            if (!Number.isInteger(index) || index < 0) {
                return null;
            }
            const item = this.currentRows()[index];
            return item ? cloneValue(item) : null;
        }

        indexOf(id) {
            return this.currentRows().findIndex((item) => item.id === id);
        }

        createId(seenIds) {
            let id;
            do {
                if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
                    id = crypto.randomUUID();
                } else {
                    id = `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
                }
            } while (seenIds.has(id));
            seenIds.add(id);
            return id;
        }

        addMultiple(initials) {
            let entries;
            if (Number.isSafeInteger(initials) && initials >= 0) {
                entries = Array.from({ length: initials }, () => ({}));
            } else if (Array.isArray(initials)) {
                entries = initials;
            } else {
                throw new TypeError("addMultiple expects a non-negative integer or an array of row objects.");
            }
            if (entries.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry))) {
                throw new TypeError("addMultiple entries must be row objects.");
            }
            if (entries.length === 0) {
                return [];
            }
            const rows = this.list();
            const seenIds = new Set(rows.map((item) => item.id));
            const ids = [];
            const additions = entries.map((initial) => {
                const id = this.createId(seenIds);
                ids.push(id);
                return { ...initial, id };
            });
            this.settings.set(this.name, [...rows, ...additions]);
            const persisted = new Set(this.currentRows().map((item) => item.id));
            return ids.filter((id) => persisted.has(id));
        }

        add(initial = {}) {
            return this.addMultiple([initial ?? {}])[0] || null;
        }

        assertField(field) {
            if (!hasPropCall(this.definition.item || {}, field)) {
                throw new Error(`Unknown collection field: ${field}`);
            }
        }

        set(id, field, value) {
            this.assertField(field);
            const rows = this.list();
            const index = rows.findIndex((item) => item.id === id);
            if (index < 0) {
                return undefined;
            }
            rows[index] = { ...rows[index], [field]: value };
            this.settings.set(this.name, rows);
            return this.get(id)?.[field];
        }

        setAt(index, field, value) {
            const item = this.getAt(index);
            return item ? this.set(item.id, field, value) : undefined;
        }

        update(id, changes) {
            for (const field of Object.keys(changes)) {
                this.assertField(field);
            }
            const rows = this.list();
            const index = rows.findIndex((item) => item.id === id);
            if (index < 0) {
                return null;
            }
            rows[index] = { ...rows[index], ...changes };
            this.settings.set(this.name, rows);
            return this.get(id);
        }

        updateAt(index, changes) {
            const item = this.getAt(index);
            return item ? this.update(item.id, changes) : null;
        }

        remove(id) {
            const rows = this.list();
            if (!rows.some((item) => item.id === id)) {
                return false;
            }
            this.settings.set(this.name, rows.filter((item) => item.id !== id));
            return !this.get(id);
        }

        removeAt(index) {
            const item = this.getAt(index);
            return item ? this.remove(item.id) : false;
        }

        onChange(listener, options = {}) {
            return this.settings.subscribe(this.name, listener, options);
        }
    }

    class SettingHandle {
        constructor(store, name, definition) {
            this.store = store;
            this.name = name;
            this.key = store.key(name);
            this.definition = definition;
            Object.defineProperty(this, "value", {
                get: () => this.get(), enumerable: true
            });
            exposeMethods(this, SettingHandle.prototype);
        }

        get value() {
            return this.get();
        }

        get() {
            return this.store.read(this.name);
        }

        set(value) {
            return this.store.set(this.name, value);
        }

        reset() {
            return this.store.reset(this.name);
        }

        onChange(listener, options = {}) {
            return this.store.subscribe(this.name, listener, options);
        }

        setOptions(options) {
            this.definition.options = options;
            this.store.cachedValues.delete(this.name);
            debugLog("settings", "Dropdown options updated", {
                featureId: this.store.featureId, name: this.name, optionCount: toArray(options).length
            });
            queueSettingsUI();
            return options;
        }
    }

    class FeatureSettingsStore {
        constructor(featureId, schema = {}) {
            this.featureId = featureId;
            this.schema = schema;
            this.prefix = `${STORAGE_PREFIX}${featureId}.`;
            this.listeners = new Map();
            this.handles = new Map();
            this.collections = new Map();
            this.cachedValues = new Map();
            exposeMethods(this, FeatureSettingsStore.prototype);
            debugLog("settings", "Setting up feature settings", { featureId, settings: Object.keys(schema) });
        }

        key(name) {
            return `${this.prefix}${name}`;
        }

        describe(name) {
            return this.schema[name] || null;
        }

        read(name) {
            const definition = this.schema[name] || {};
            if (this.cachedValues.has(name)) {
                return copySettingValue(definition, this.cachedValues.get(name));
            }
            const stored = GM_getValue(this.key(name), definition.default ?? null);
            const info = this.feature.context({ name });
            const sanitized = sanitizeValue(definition, stored, info);
            if (!valuesEqual(stored, sanitized)) {
                GM_setValue(this.key(name), sanitized);
            }
            if (sanitized === null || typeof sanitized !== "object" || Array.isArray(sanitized)) {
                this.cachedValues.set(name, copySettingValue(definition, sanitized));
            }
            return copySettingValue(definition, sanitized);
        }

        collectionRows(name) {
            if (!this.cachedValues.has(name)) {
                this.read(name);
            }
            return this.cachedValues.get(name);
        }

        get(name) {
            const value = this.read(name);
            debugLog("settings.read", "Setting read", { featureId: this.featureId, name, value });
            return value;
        }

        getHandle(name) {
            if (!this.handles.has(name)) {
                this.handles.set(name, new SettingHandle(this, name, this.schema[name] || {}));
            }
            return this.handles.get(name);
        }

        updateOptions(name, options) {
            return this.getHandle(name).setOptions(options);
        }

        collection(name) {
            const definition = this.schema[name];
            if (!settingTypeFor(definition).isCollection) {
                throw new Error(`Not a collection setting: ${name}`);
            }
            if (!this.collections.has(name)) {
                this.collections.set(name, new CollectionStore(this, name, definition, () => this.collectionRows(name)));
            }
            return this.collections.get(name);
        }

        set(name, value) {
            const definition = this.schema[name] || {};
            const previous = this.read(name);
            const info = this.feature.context({ name, definition });
            let next;
            if (definition.sanitize) {
                next = definition.sanitize(value, info);
            } else {
                next = sanitizeValue(definition, value, info);
            }
            if (!valueIsValid(definition, next, info)) {
                debugLog("settings", "Rejected invalid setting", { featureId: this.featureId, name, value });
                return previous;
            }
            if (valuesEqual(previous, next)) {
                debugLog("settings", "Setting unchanged", { featureId: this.featureId, name, value: next });
                return next;
            }
            const key = this.key(name);
            GM_setValue(key, copySettingValue(definition, next));
            if (next === null || typeof next !== "object" || Array.isArray(next)) {
                this.cachedValues.set(name, copySettingValue(definition, next));
            } else {
                this.cachedValues.delete(name);
            }
            debugLog("settings", "Setting changed", { featureId: this.featureId, name, previous, value: next });
            const changeInfo = { ...info, key, previous, value: next };
            const available = this.feature.isEnabled() && settingBindingsAllowed(definition);
            if (available) {
                definition.onChange?.(next, previous, changeInfo);
                settingTypeFor(definition).notifyChange(definition, next, previous, changeInfo);
            }
            this.listeners.get(name)?.forEach((subscription) => {
                if (available || subscription.source === "ui") {
                    subscription.listener(next, previous, changeInfo);
                }
            });
            return next;
        }

        subscribe(name, listener, options = {}) {
            if (typeof listener !== "function") {
                return () => {};
            }
            if (!this.listeners.has(name)) {
                this.listeners.set(name, new Set());
            }
            const subscription = { listener, source: options.source || "feature" };
            this.listeners.get(name).add(subscription);
            return () => this.listeners.get(name)?.delete(subscription);
        }

        reset(name) {
            return this.set(name, this.schema[name]?.default);
        }

        delete(name) {
            this.cachedValues.delete(name);
            GM_deleteValue(this.key(name));
        }

        unregister(name) {
            if (!hasPropCall(this.schema, name)) {
                return false;
            }
            this.delete(name);
            this.handles.delete(name);
            this.listeners.delete(name);
            delete this.schema[name];
            return true;
        }

        invalidateKey(key) {
            if (key.startsWith(this.prefix)) {
                this.cachedValues.delete(key.slice(this.prefix.length));
            }
        }
    }

    class ManagerSettingsStore {
        constructor(schema) {
            this.schema = schema;
            this.listeners = new Map();
            this.handles = new Map();
            this.uiValues = new Map();
            exposeMethods(this, ManagerSettingsStore.prototype);
            for (const [name, definition] of Object.entries(UI_PREFERENCE_DEFINITIONS)) {
                const key = `${UI_PREFERENCES_PREFIX}${name}`;
                const stored = GM_getValue(key, definition.default);
                const sanitized = sanitizeValue(definition, stored);
                if (!valuesEqual(stored, sanitized)) {
                    GM_setValue(key, sanitized);
                }
                this.uiValues.set(name, sanitized);
            }
            const modeKey = `${UI_PREFERENCES_PREFIX}modeLevel`;
            const storedMode = GM_getValue(modeKey, MODE_LEVEL_DEFINITION.default);
            const modeLevel = sanitizeValue(MODE_LEVEL_DEFINITION, storedMode);
            if (!valuesEqual(storedMode, modeLevel)) {
                GM_setValue(modeKey, modeLevel);
            }
            this.uiValues.set("modeLevel", modeLevel);
            this.uiValues.set("modeKeyword", "");
            this.uiValues.set("modeStatus", accessModeStatus(modeLevel));
        }

        isCategory(name) {
            return hasPropCall(DEFAULT_DEBUG_CATEGORIES, name);
        }

        key(name) {
            if (name === "enabled") {
                return DEBUG_KEY;
            }
            if (this.isCategory(name)) {
                return DEBUG_CATEGORIES_KEY;
            }
            return `${UI_PREFERENCES_PREFIX}${name}`;
        }

        describe(name) {
            return this.schema[name] || null;
        }

        get(name) {
            if (!hasPropCall(this.schema, name)) {
                return undefined;
            }
            if (name === "enabled") {
                return logger.enabled;
            }
            if (this.isCategory(name)) {
                return logger.categories[name] === true;
            }
            return this.uiValues.get(name);
        }

        set(name, value) {
            if (!hasPropCall(this.schema, name)) {
                return undefined;
            }
            const next = sanitizeValue(this.schema[name], value);
            if (name === "enabled") {
                return setGlobalDebug(next);
            }
            if (this.isCategory(name)) {
                return setDebugCategory(name, next);
            }
            const previous = this.uiValues.get(name);
            if (valuesEqual(previous, next)) {
                return next;
            }
            this.uiValues.set(name, next);
            if (name !== "modeKeyword" && name !== "modeStatus") {
                GM_setValue(this.key(name), next);
            }
            if (name === "modeLevel") {
                this.set("modeStatus", accessModeStatus(next));
                queueSettingsUI();
            } else if (hasPropCall(UI_PREFERENCE_DEFINITIONS, name)) {
                applyManagerAppearance();
            }
            this.notify(name, next, previous);
            return next;
        }

        getHandle(name) {
            if (!this.handles.has(name)) {
                const store = this;
                this.handles.set(name, {
                    name,
                    key: this.key(name),
                    definition: this.schema[name],
                    get value() {
                        return store.get(name);
                    },
                    get() {
                        return store.get(name);
                    },
                    set(value) {
                        return store.set(name, value);
                    },
                    reset() {
                        return store.reset(name);
                    },
                    onChange(listener, options = {}) {
                        return store.subscribe(name, listener, options);
                    }
                });
            }
            return this.handles.get(name);
        }

        subscribe(name, listener) {
            if (typeof listener !== "function") {
                return () => {};
            }
            if (!this.listeners.has(name)) {
                this.listeners.set(name, new Set());
            }
            this.listeners.get(name).add(listener);
            return () => this.listeners.get(name)?.delete(listener);
        }

        reset(name) {
            return this.set(name, this.schema[name]?.default);
        }

        delete(name) {
            return this.reset(name);
        }

        notify(name, value, previous) {
            if (!hasPropCall(this.schema, name) || value === previous) {
                return;
            }
            const info = this.feature.context({
                name, key: this.key(name), previous, value,
                definition: this.schema[name]
            });
            this.listeners.get(name)?.forEach((listener) => listener(value, previous, info));
        }
    }

    function resolveManagerTheme(selectedTheme) {
        if (selectedTheme !== "auto") {
            return selectedTheme;
        }
        const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
        if (prefersDark) {
            return "dark";
        }
        return "light";
    }

    function applyEmbeddedAppearance(mount, theme = null) {
        if (!managerSettingsApi) {
            return;
        }
        const get = (name) => managerSettingsApi.get(name);
        mount.element.setAttribute("data-rsm-v2-theme", theme || resolveManagerTheme(get("theme")));
        mount.element.style.setProperty("--rsm-v2-element-gap", `${get("elementGap")}px`);
        mount.element.style.setProperty("--rsm-v2-panel-gap", `${get("panelGap")}px`);
        mount.element.style.setProperty("--rsm-v2-panel-padding-setting", `${get("panelPadding")}px`);
        mount.element.style.setProperty("--rsm-v2-panel-radius", `${get("panelRadius")}px`);
        mount.element.style.setProperty("--rsm-v2-element-radius", `${get("elementRadius")}px`);
        mount.element.style.setProperty("--rsm-v2-control-height", `${get("controlHeight")}px`);
        mount.element.style.setProperty("--rsm-v2-font-size", `${get("fontSize")}px`);
        if (mount.slot) {
            mount.slot.style.setProperty("--rsm-v2-panel-gap", `${get("panelGap")}px`);
        }
    }

    function applyManagerAppearance() {
        if (!settingsUI.panel || !settingsUI.dialog || !managerSettingsApi) {
            return;
        }
        const get = (name) => managerSettingsApi.get(name);
        const theme = resolveManagerTheme(get("theme"));
        settingsUI.panel.setAttribute("data-rsm-v2-theme", theme);
        settingsUI.button.setAttribute("data-rsm-v2-theme", theme);
        settingsUI.panel.style.setProperty("--rsm-v2-control-height", `${get("controlHeight")}px`);
        settingsUI.panel.style.setProperty("--rsm-v2-font-size", `${get("fontSize")}px`);
        settingsUI.button.style.setProperty("--rsm-v2-control-height", `${get("controlHeight")}px`);
        settingsUI.button.style.setProperty("--rsm-v2-font-size", `${get("fontSize")}px`);
        settingsUI.button.style.setProperty("--rsm-v2-element-radius", `${get("elementRadius")}px`);
        const edgePadding = get("edgePadding");
        const insidePadding = get("dialogPadding");
        const color = get("backdropColor");
        const red = parseInt(color.slice(1, 3), 16);
        const green = parseInt(color.slice(3, 5), 16);
        const blue = parseInt(color.slice(5, 7), 16);
        settingsUI.panel.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, ${get("backdropOpacity") / 100})`;
        settingsUI.panel.style.padding = `${edgePadding}px`;
        settingsUI.dialog.style.width = `max(240px, calc(min(${get("dialogWidth")}vw, ${get("dialogMaxWidth")}px) - ${edgePadding * 2}px))`;
        settingsUI.dialog.style.height = `max(220px, calc(min(${get("dialogHeight")}vh, ${get("dialogMaxHeight")}px) - ${edgePadding * 2}px))`;
        settingsUI.dialog.style.maxWidth = `${get("dialogMaxWidth")}px`;
        settingsUI.dialog.style.maxHeight = `${get("dialogMaxHeight")}px`;
        settingsUI.dialog.style.padding = `${insidePadding}px`;
        settingsUI.dialog.style.setProperty("--rsm-v2-shell-gap", `${insidePadding}px`);
        settingsUI.dialog.style.setProperty("--rsm-v2-sidebar-padding", `${insidePadding}px`);
        settingsUI.dialog.style.setProperty("--rsm-v2-sidebar-width", `${get("sidebarWidth")}px`);
        settingsUI.dialog.style.setProperty("--rsm-v2-element-gap", `${get("elementGap")}px`);
        settingsUI.dialog.style.setProperty("--rsm-v2-panel-gap", `${get("panelGap")}px`);
        settingsUI.dialog.style.setProperty("--rsm-v2-panel-padding-setting", `${get("panelPadding")}px`);
        settingsUI.dialog.style.setProperty("--rsm-v2-panel-radius", `${get("panelRadius")}px`);
        settingsUI.dialog.style.setProperty("--rsm-v2-element-radius", `${get("elementRadius")}px`);
        for (const mount of embeddedMounts) {
            applyEmbeddedAppearance(mount, theme);
        }
    }

    function registerManagerFeature() {
        const categories = [
            ["core", "Core"], ["lifecycle", "Lifecycle"],
            ["feature", "Features"], ["binding", "Bindings"],
            ["settings", "Setting changes"], ["settings.read", "Setting reads (verbose)"],
            ["ui", "Settings UI"]
        ];
        const schema = {
            enabled: { type: "toggle", default: true },
            modeLevel: MODE_LEVEL_DEFINITION,
            modeKeyword: { type: "text", default: "" },
            modeStatus: { type: "text", default: accessModeStatus(0) },
            pageHashResult: { type: "text", default: "Choose a hash type above." },
            pageUrlResult: { type: "text", default: "Choose a hash type above." },
            ...UI_PREFERENCE_DEFINITIONS
        };
        for (const [category] of categories) {
            schema[category] = { type: "toggle", default: DEFAULT_DEBUG_CATEGORIES[category] };
        }
        const feature = {
            id: MANAGER_FEATURE_ID,
            name: "Script Manager",
            version: MANAGER_VERSION,
            description: "Configure logging and the shared settings panel.",
            settings: schema,
            settingsUI: {
                type: "verticalGroup",
                children: [
                    { type: "panel", label: "Access mode", children: [
                        { type: "label", text: "Enter a mode keyword to show its settings. Higher levels include all lower levels." },
                        { type: "horizontalGroup", children: [
                            { setting: "modeKeyword", control: "textInput", label: "Mode keyword" },
                            { type: "button", label: "Confirm mode", onClick({ settings }) {
                                const keyword = settings.get("modeKeyword").trim().toLowerCase();
                                if (!hasPropCall(ACCESS_KEYWORDS, keyword)) {
                                    settings.set("modeStatus", "Unknown mode keyword. Current mode was not changed.");
                                    return;
                                }
                                const level = ACCESS_KEYWORDS[keyword];
                                settings.set("modeLevel", level);
                                settings.set("modeStatus", accessModeStatus(level));
                                settings.set("modeKeyword", "");
                            } }
                        ] },
                        { type: "dynamicLabel", setting: "modeStatus" }
                    ] },
                    { type: "panel", label: "Appearance", children: [
                        { type: "label", text: "Auto follows your browser's color scheme; Dark and Light override it." },
                        { setting: "theme", control: "dropdown", label: "Theme", options: [
                            { value: "auto", label: "Auto" },
                            { value: "dark", label: "Dark" },
                            { value: "light", label: "Light" }
                        ] }
                    ] },
                    { type: "panel", label: "Logging", children: [
                        { setting: "enabled", control: "toggleButton", label: "Enable debug logging" }
                    ] },
                    {
                        type: "panel", label: "Log categories", visibleWhen: { setting: "enabled", equals:true} , children: [
                        { type: "label", text: "Category switches are saved even when debug logging is off." },
                        ...categories.map(([setting, label]) => ({
                            setting, control: "toggleButton", label
                        }))
                    ] },
                    { type: "panel", label: "Panel size", children: [
                        { type: "label", text: "Width and height are viewport targets. Outer spacing reduces the final panel size." },
                        { type: "horizontalGroup", children: [
                            { setting: "dialogWidth", control: "slider", label: "Width", valueLabel: "vw", trigger: "release", size: "50%" },
                            { setting: "dialogHeight", control: "slider", label: "Height", valueLabel: "vh", trigger: "release", size: "50%" }
                        ] },
                        { type: "horizontalGroup", children: [
                            { setting: "dialogMaxWidth", control: "slider", label: "Max width", valueLabel: "px", trigger: "release", size: "50%" },
                            { setting: "dialogMaxHeight", control: "slider", label: "Max height", valueLabel: "px", trigger: "release", size: "50%" }
                        ] },
                        { type: "horizontalGroup", children: [
                            { setting: "dialogPadding", control: "slider", label: "Inside padding", valueLabel: "px", trigger: "release", size: "50%" },
                            { setting: "edgePadding", control: "slider", label: "Outer spacing", valueLabel: "px", trigger: "release", size: "50%" }
                        ] },
                        { setting: "sidebarWidth", control: "slider", label: "Script list width", valueLabel: "px", trigger: "release" }
                    ] },
                    { type: "panel", label: "Backdrop", children: [
                        { type: "horizontalGroup", children: [
                            { setting: "backdropColor", control: "color", label: "Color", size: "50%" },
                            { setting: "backdropOpacity", control: "slider", label: "Opacity", valueLabel: "%", trigger: "release", size: "50%" }
                        ] }
                    ] },
                    { type: "panel", label: "Layout spacing and corners", children: [
                        { type: "horizontalGroup", children: [
                            { setting: "elementGap", control: "slider", label: "Element gap", valueLabel: "px", trigger: "release", size: "50%" },
                            { setting: "panelGap", control: "slider", label: "Panel gap", valueLabel: "px", trigger: "release", size: "50%" }
                        ] },
                        { setting: "panelPadding", control: "slider", label: "Panel padding", valueLabel: "px", trigger: "release" },
                        { type: "horizontalGroup", children: [
                            { setting: "panelRadius", control: "slider", label: "Panel rounding", valueLabel: "px", trigger: "release", size: "50%" },
                            { setting: "elementRadius", control: "slider", label: "Element rounding", valueLabel: "px", trigger: "release", size: "50%" }
                        ] }
                    ] },
                    { type: "panel", label: "Controls and text", children: [
                        { type: "label", text: "Applies to this panel and settings mounted on a page." },
                        { type: "horizontalGroup", children: [
                            { setting: "controlHeight", control: "slider", label: "Element height", valueLabel: "px", trigger: "release", size: "50%" },
                            { setting: "fontSize", control: "slider", label: "Font size", valueLabel: "px", trigger: "release", size: "50%" }
                        ] }
                    ] },
                    { type: "panel", label: "Page URL hashes", children: [
                        { type: "label", text: "SHA-256 excludes query parameters and fragments. URL includes the path; origin does not." },
                        { type: "horizontalGroup", children: [
                            { type: "button", label: "Hash current URL", onClick({ manager, settings }) {
                                const generatedPageHash = manager.hashCurrentPage("url");
                                const parsed = new URL(location.href);
                                settings.set("pageHashResult", `URL: ${generatedPageHash}`);
                                settings.set("pageUrlResult", `URL: ${parsed.origin}${parsed.pathname}`);
                            } },
                            { type: "button", label: "Hash origin", onClick({ manager, settings }) {
                                const generatedPageHash = manager.hashCurrentPage("origin");
                                const parsed = new URL(location.href);
                                settings.set("pageHashResult", `Origin: ${generatedPageHash}`);
                                settings.set("pageUrlResult", `Origin: ${parsed.origin}`);
                            } },
                            { type: "button", label: "Copy hash", onClick({ settings }) {
                                const match = /^(?:URL|Origin): ([0-9a-f]{64})$/i.exec(settings.get("pageHashResult"));
                                if (match && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                                    navigator.clipboard.writeText(match[1]).catch((error) => {
                                        console.warn("[RSM] Could not copy page hash", error);
                                    });
                                }
                            } }
                        ] },
                        { type: "dynamicLabel", setting: "pageUrlResult" },
                        { type: "dynamicLabel", setting: "pageHashResult" }
                    ] },
                    { type: "button", label: "Reset panel appearance", onClick({ settings }) {
                        for (const name of Object.keys(UI_PREFERENCE_DEFINITIONS)) {
                            settings.reset(name);
                        }
                    } }
                ]
            }
        };
        managerSettingsApi = new ManagerSettingsStore(schema);
        const runtime = new FeatureRuntime(feature, managerSettingsApi);
        features.set(runtime.id, runtime);
        queueSettingsUI();
    }

    function settingInputValue(definition, value) {
        return settingTypeFor(definition).inputValue(value);
    }

    function normalizeLayoutType(type) {
        return (type ?? "").toLowerCase().replace(/[\s_-]/g, "");
    }

    function settingIsEnabled(definition, settings) {
        if (!definition.enabledWhen) {
            return true;
        }
        const rule = definition.enabledWhen;
        const value = rule.setting == null ? undefined : settings.get(rule.setting);
        if (typeof rule === "function") {
            return Boolean(rule(value, settings));
        }
        if (rule.equals !== undefined) {
            return value === rule.equals;
        }
        if (rule.notEquals !== undefined) {
            return value !== rule.notEquals;
        }
        return Boolean(value);
    }

    class EmbeddedSettingsMount {
        constructor(controller, container, layout, options = {}) {
            this.controller = controller;
            this.featureId = controller.feature.id;
            this.container = container;
            this.layout = layout;
            this.id = options.id || null;
            this.slot = options.slot || null;
            this.anchor = options.anchor || null;
            this.position = options.position || null;
            this.dispose = () => {};
            this.element = document.createElement("div");
            this.element.className = "rsm-v2-embedded-settings";
            this.element.style.width = "100%";
            this.element.style.height = "auto";
            this.element.style.maxWidth = "none";
            this.element.style.maxHeight = "none";
            this.element.style.overflow = "visible";
            this.element.style.padding = "0";
            this.element.style.border = "0";
            this.element.style.boxShadow = "none";
            this.element.style.background = "transparent";
            this.element.style.color = "var(--rsm-v2-text)";
            installButtonPressFeedback(this.element);
            exposeMethods(this, EmbeddedSettingsMount.prototype);
        }

        refresh() {
            const previousDispose = this.dispose;
            this.dispose = () => {};
            previousDispose();
            this.element.replaceChildren();
            const result = createSettingsNode(this.layout, this.controller.feature,
                this.controller.feature.settings);
            if (result.element) {
                result.element.classList.add("rsm-v2-settings-layout-root");
                this.element.appendChild(result.element);
            }
            this.dispose = result.dispose;
            return this;
        }

        unmount() {
            if (this.controller.mounts.get(this.container) !== this) {
                return;
            }
            this.dispose();
            this.dispose = () => {};
            this.element.remove();
            this.controller.mounts.delete(this.container);
            if (this.id) {
                this.controller.mountsById.delete(this.id);
            }
            embeddedMounts.delete(this);
            this.slot?.remove();
        }
    }

    class FeatureUIController {
        constructor(feature) {
            this.feature = feature;
            this.overrides = new Map();
            this.labels = new Map();
            this.handles = new Map();
            this.canvases = new Map();
            this.renderedVisibility = new WeakMap();
            this.renderedEnabled = new WeakMap();
            this.repeatedNodes = new WeakSet();
            this.renderedNodes = new Map();
            this.renderedRows = new Map();
            this.mounts = new Map();
            this.mountsById = new Map();
            exposeMethods(this, FeatureUIController.prototype);
        }

        findNode(id, allowMissing = false) {
            const roots = new Set([this.feature.settingsUI, ...Array.from(this.mounts.values(), (mount) => mount.layout)]);
            const pending = Array.from(roots, (node) => ({ node, repeated: false }));
            const visited = new Set();
            let found = null;
            while (pending.length > 0) {
                const { node, repeated } = pending.pop();
                if (!node || typeof node !== "object" || visited.has(node)) {
                    continue;
                }
                visited.add(node);
                if (node.id === id) {
                    if (found) {
                        throw new Error(`Duplicate UI node id: ${id}`);
                    }
                    found = node;
                    if (repeated) {
                        this.repeatedNodes.add(node);
                    }
                }
                const definition = node.setting ? this.feature.schema[node.setting] || {} : node;
                const type = normalizeLayoutType(node.type || node.control || settingTypeFor(definition).defaultControl);
                const childRepeated = repeated || LAYOUT_CLASSES[type]?.repeatsItems === true;
                pending.push(...toArray(node.children || node.items).map((child) => ({ node: child, repeated: childRepeated })));
            }
            if (!found) {
                if (allowMissing) {
                    return null;
                }
                throw new Error(`Unknown UI node id: ${id}`);
            }
            return found;
        }

        isVisible(node, settings = this.feature.settings) {
            if (!canAccess(this.feature.config) || !canAccess(node)) {
                return false;
            }
            if (node.id && this.overrides.has(node.id)) {
                return this.overrides.get(node.id);
            }
            const rule = node.visibleWhen;
            if (rule === undefined) {
                return true;
            }
            if (typeof rule === "function") {
                return Boolean(rule(this.feature.context({}, settings)));
            }
            if (rule && typeof rule === "object" && rule.setting) {
                const value = settings.get(rule.setting);
                if (hasPropCall(rule, "equals")) {
                    return valuesEqual(value, rule.equals);
                }
                if (hasPropCall(rule, "notEquals")) {
                    return !valuesEqual(value, rule.notEquals);
                }
                return Boolean(value);
            }
            return Boolean(rule);
        }

        labelFor(node, settings = this.feature.settings, fallback = "") {
            let label;
            if (node.id && this.labels.has(node.id)) {
                label = this.labels.get(node.id);
            } else {
                label = node.label;
            }
            const value = typeof label === "function" ? label(this.feature.context({}, settings)) : label;
            return value == null ? fallback : String(value);
        }

        setLabel(id, label) {
            const node = this.findNode(id);
            if (["label", "text", "dynamiclabel"].includes(normalizeLayoutType(node.type))) {
                throw new TypeError("Use a text setting and dynamicLabel for changing label text.");
            }
            if (typeof label !== "string" && typeof label !== "function") {
                throw new TypeError("A UI label must be a string or a function.");
            }
            this.labels.set(id, label);
            queueSettingsUI();
            return label;
        }

        clearLabel(id) {
            const node = this.findNode(id);
            if (["label", "text", "dynamiclabel"].includes(normalizeLayoutType(node.type))) {
                throw new TypeError("Static and dynamic labels do not have caption overrides.");
            }
            const changed = this.labels.delete(id);
            if (changed) {
                queueSettingsUI();
            }
            return changed;
        }

        registerCanvas(id, draw) {
            let instances = this.canvases.get(id);
            if (!instances) {
                instances = new Set();
                this.canvases.set(id, instances);
            }
            instances.add(draw);
            return () => {
                instances.delete(draw);
                if (instances.size === 0) {
                    this.canvases.delete(id);
                }
            };
        }

        refreshCanvas(id) {
            const instances = this.canvases.get(id);
            if (!instances) {
                return false;
            }
            for (const draw of instances) {
                draw();
            }
            return true;
        }

        setVisibility(id, visible) {
            if (typeof visible !== "boolean") {
                throw new TypeError("UI visibility must be a boolean.");
            }
            this.findNode(id);
            this.overrides.set(id, visible);
            this.refreshVisibility(id);
            return visible;
        }

        refreshVisibility(id) {
            if (id == null) {
                queueSettingsUI();
                return true;
            }
            const node = this.findNode(id);
            const instances = this.renderedNodes.get(node);
            if (instances?.size) {
                const changed = Array.from(instances).some((instance) =>
                    instance.visible !== this.isVisible(node, instance.settings) ||
                    instance.enabled !== this.isEnabled(node, instance.settings));
                if (!changed) {
                    return false;
                }
            } else if (!this.repeatedNodes.has(node) &&
                this.renderedVisibility.get(node) === this.isVisible(node) &&
                this.renderedEnabled.get(node) === this.isEnabled(node)) {
                return false;
            }
            queueSettingsUI();
            return true;
        }

        isEnabled(node, settings = this.feature.settings) {
            const definition = node.setting ? settings.schema?.[node.setting] || this.feature.schema[node.setting] || {} : node;
            return this.feature.isEnabled() && settings.uiEnabled !== false &&
                settingIsEnabled(node, settings) &&
                (definition === node || settingIsEnabled(definition, settings));
        }

        registerRenderedNode(node, settings, visible, enabled, element) {
            const instances = this.renderedNodes.get(node) || new Set();
            this.renderedNodes.set(node, instances);
            const instance = { settings, visible, enabled, element, cleanup: null };
            instance.render = () => {
                instance.cleanup?.();
                instance.cleanup = null;
                if (!element || typeof node.onRender !== "function") {
                    return false;
                }
                const details = { element };
                if (settings.itemId) {
                    details.itemId = settings.itemId;
                    details.item = settings.collection.get(settings.itemId);
                    details.collection = settings.collection;
                }
                const cleanup = node.onRender.call(node, this.feature.context(details, settings));
                if (typeof cleanup === "function") {
                    instance.cleanup = cleanup;
                }
                return true;
            };
            instances.add(instance);
            this.renderedVisibility.set(node, visible);
            this.renderedEnabled.set(node, enabled);
            try {
                instance.render();
            } catch (error) {
                instances.delete(instance);
                if (instances.size === 0) {
                    this.renderedNodes.delete(node);
                }
                throw error;
            }
            return () => {
                instance.cleanup?.();
                instances.delete(instance);
                if (instances.size === 0) {
                    this.renderedNodes.delete(node);
                }
            };
        }

        registerRenderedRow(node, rowId, element) {
            const rows = this.renderedRows.get(node) || new Map();
            this.renderedRows.set(node, rows);
            const instances = rows.get(rowId) || new Set();
            rows.set(rowId, instances);
            instances.add(element);
            return () => {
                instances.delete(element);
                if (instances.size === 0) {
                    rows.delete(rowId);
                }
                if (rows.size === 0) {
                    this.renderedRows.delete(node);
                }
            };
        }

        getElement(id, itemId) {
            const node = this.findNode(id, true);
            if (!node) {
                return null;
            }
            const matches = Array.from(this.renderedNodes.get(node) || [])
                .filter((instance) => instance.element && (itemId == null || instance.settings.itemId === itemId));
            return matches.length === 1 ? matches[0].element : null;
        }

        getRowElement(id, rowId) {
            const node = this.findNode(id, true);
            if (!node) {
                return null;
            }
            if (normalizeLayoutType(node.type) !== "repeater") {
                throw new TypeError(`UI node is not a repeater: ${id}`);
            }
            const instances = this.renderedRows.get(node)?.get(rowId);
            return instances?.size === 1 ? instances.values().next().value : null;
        }

        refreshOnRenderCallback(id) {
            const node = this.findNode(id);
            if (typeof node.onRender !== "function") {
                return false;
            }
            let refreshed = false;
            for (const instance of Array.from(this.renderedNodes.get(node) || [])) {
                refreshed = instance.render() || refreshed;
            }
            return refreshed;
        }

        refresh(id) {
            const needsRebuild = this.refreshVisibility(id);
            if (needsRebuild) {
                return true;
            }
            const node = this.findNode(id);
            const canvasRefreshed = normalizeLayoutType(node.type) === "canvas"
                ? this.refreshCanvas(id) : false;
            const callbackRefreshed = this.refreshOnRenderCallback(id);
            return canvasRefreshed || callbackRefreshed;
        }

        mountInto(target, layout, options = {}) {
            const container = resolveDOMTarget(target);
            if (!layout || typeof layout !== "object") {
                throw new TypeError("A settings UI layout is required to mount on the page.");
            }
            const existing = this.mounts.get(container);
            if (existing) {
                if (!container.contains(existing.element)) {
                    container.appendChild(existing.element);
                }
                return existing;
            }
            const mount = new EmbeddedSettingsMount(this, container, layout, options);
            this.mounts.set(container, mount);
            if (mount.id) {
                this.mountsById.set(mount.id, mount);
            }
            embeddedMounts.add(mount);
            applyEmbeddedAppearance(mount);
            container.appendChild(mount.element);
            try {
                mount.refresh();
            } catch (error) {
                mount.unmount();
                throw error;
            }
            return mount;
        }

        placeManagedSlot(anchor, slot, position) {
            if (position === "before" || position === "after") {
                const parent = anchor.parentElement;
                if (!parent) {
                    throw new Error("A before/after anchor must have a parent element.");
                }
                if (position === "before" && (slot.parentElement !== parent || slot.nextSibling !== anchor)) {
                    parent.insertBefore(slot, anchor);
                }
                if (position === "after" && (slot.parentElement !== parent || anchor.nextSibling !== slot)) {
                    parent.insertBefore(slot, anchor.nextSibling);
                }
                return;
            }
            if (position === "prepend") {
                if (slot.parentElement !== anchor || anchor.firstChild !== slot) {
                    anchor.insertBefore(slot, anchor.firstChild);
                }
                return;
            }
            if (position === "append") {
                if (slot.parentElement !== anchor || anchor.lastChild !== slot) {
                    anchor.appendChild(slot);
                }
            }
        }

        mountManaged(layout, options) {
            const id = layout?.id;
            if (typeof id !== "string" || !id.trim()) {
                throw new Error("A page-mounted layout needs a nonempty id.");
            }
            const anchor = resolveDOMTarget(options.anchor);
            const position = options.position || "before";
            if (!["before", "after", "prepend", "append"].includes(position)) {
                throw new TypeError(`Unknown page mount position: ${position}`);
            }
            const existing = this.mountsById.get(id);
            if (existing) {
                if (existing.layout !== layout) {
                    throw new Error(`A different page layout is already mounted with id: ${id}`);
                }
                this.placeManagedSlot(anchor, existing.slot, position);
                existing.anchor = anchor;
                existing.position = position;
                this.mountInto(existing.slot, layout);
                return existing;
            }
            const slot = document.createElement("div");
            slot.className = "rsm-v2-embedded-settings-slot";
            slot.style.width = "100%";
            slot.style.boxSizing = "border-box";
            slot.style.marginBlock = "var(--rsm-v2-panel-gap, 6px)";
            this.placeManagedSlot(anchor, slot, position);
            try {
                return this.mountInto(slot, layout, { id, slot, anchor, position });
            } catch (error) {
                slot.remove();
                throw error;
            }
        }

        mount(targetOrLayout, layoutOrOptions = this.feature.settingsUI) {
            if (layoutOrOptions && typeof layoutOrOptions === "object" && hasPropCall(layoutOrOptions, "anchor")) {
                return this.mountManaged(targetOrLayout, layoutOrOptions);
            }
            return this.mountInto(targetOrLayout, layoutOrOptions);
        }

        getMount(id) {
            return this.mountsById.get(id) || null;
        }

        unmount(targetOrId) {
            if (typeof targetOrId === "string" && this.mountsById.has(targetOrId)) {
                this.mountsById.get(targetOrId).unmount();
                return;
            }
            let container = targetOrId;
            if (typeof targetOrId === "string") {
                try {
                    container = document.querySelector(targetOrId);
                } catch {
                    return;
                }
            }
            this.mounts.get(container)?.unmount();
        }

        recordVisibility(node, visible) {
            this.renderedVisibility.set(node, visible);
        }

        getHandle(id) {
            this.findNode(id);
            if (!this.handles.has(id)) {
                const ui = this;
                this.handles.set(id, {
                    id,
                    get visible() {
                        return ui.isVisible(ui.findNode(id));
                    },
                    setVisibility: (visible) => ui.setVisibility(id, visible),
                    hide: () => ui.setVisibility(id, false),
                    show: () => ui.setVisibility(id, true),
                    clearVisibility() {
                        ui.findNode(id);
                        ui.overrides.delete(id);
                        ui.refreshVisibility(id);
                        return ui.isVisible(ui.findNode(id));
                    },
                    getElement: (itemId) => ui.getElement(id, itemId),
                    getRowElement: (rowId) => ui.getRowElement(id, rowId),
                    refresh: () => ui.refresh(id),
                    refreshVisibility: () => ui.refreshVisibility(id),
                    refreshOnRenderCallback: () => ui.refreshOnRenderCallback(id),
                    setLabel: (label) => ui.setLabel(id, label),
                    clearLabel: () => ui.clearLabel(id)
                });
            }
            return this.handles.get(id);
        }

    }

    function cssSize(value) {
        if (typeof value === "number") {
            return `${value}px`;
        }
        return value;
    }

    function applyGroupSize(element, node) {
        if (node.size != null) {
            const size = cssSize(node.size);
            element.classList.add("rsm-v2-sized");
            if (typeof size === "string" && size.endsWith("%")) {
                const percent = Number(size.slice(0, -1));
                element.style.flex = `${percent / 100} 0 0px`;
                element.style.width = size;
            } else {
                element.style.flex = `0 0 ${size}`;
                element.style.width = size;
            }
            element.style.minWidth = "0";
            element.style.boxSizing = "border-box";
        }
        if (node.width != null) {
            element.style.width = cssSize(node.width);
        }
        if (node.height != null) {
            element.style.height = cssSize(node.height);
        }
    }

    const uiTemplates = new Map();
    function instantiateUI(markup, properties = {}) {
        let cached = uiTemplates.get(markup);
        if (!cached) {
            const template = document.createElement("template");
            template.innerHTML = markup.trim();
            const source = template.content.firstElementChild;
            const refPaths = new Map();
            const recordRefs = (element, path) => {
                const ref = element.getAttribute("data-ref");
                if (ref) {
                    if (refPaths.has(ref) || ref === "root") {
                        throw new Error(`Duplicate or reserved UI template part: ${ref}`);
                    }
                    refPaths.set(ref, path);
                }
                Array.from(element.children).forEach((child, index) => {
                    recordRefs(child, [...path, index]);
                });
            };
            recordRefs(source, []);
            cached = { source, refPaths };
            uiTemplates.set(markup, cached);
        }
        const root = cached.source.cloneNode(true);
        const parts = { root };
        for (const [ref, path] of cached.refPaths) {
            parts[ref] = path.reduce((parent, index) => parent.children[index], root);
        }
        for (const [ref, values] of Object.entries(properties)) {
            const part = parts[ref];
            if (!part) {
                throw new Error(`Unknown UI template part: ${ref}`);
            }
            if (values === null) {
                part.remove();
                delete parts[ref];
            } else {
                Object.assign(part, values);
            }
        }
        return parts;
    }

    const ACTION_CONTROL_TEMPLATE = `
        <div class="rsm-v2-setting rsm-v2-action-setting">
            <button type="button" data-ref="action"></button>
        </div>`;
    const TOGGLE_CONTROL_TEMPLATE = `
        <div class="rsm-v2-setting rsm-v2-control-setting">
            <div class="rsm-v2-field rsm-v2-toggle-field" data-ref="field">
                <span class="rsm-v2-toggle-label" data-ref="caption"></span>
                <span class="rsm-v2-setting-unit" data-ref="unit"></span>
                <button type="button" class="rsm-v2-toggle" data-ref="input"></button>
            </div>
        </div>`;
    const INPUT_CONTROL_TEMPLATE = `
        <div class="rsm-v2-setting rsm-v2-control-setting">
            <label class="rsm-v2-field">
                <span class="rsm-v2-field-label" data-ref="caption"></span>
                <input type="text" data-ref="input">
                <span class="rsm-v2-setting-unit" data-ref="unit"></span>
            </label>
        </div>`;
    const DROPDOWN_CONTROL_TEMPLATE = `
        <div class="rsm-v2-setting rsm-v2-control-setting">
            <label class="rsm-v2-field">
                <span class="rsm-v2-field-label" data-ref="caption"></span>
                <select data-ref="input"></select>
                <span class="rsm-v2-setting-unit" data-ref="unit"></span>
            </label>
        </div>`;
    const TEXTAREA_CONTROL_TEMPLATE = `
        <div class="rsm-v2-setting rsm-v2-control-setting">
            <label class="rsm-v2-field">
                <span class="rsm-v2-field-label" data-ref="caption"></span>
                <textarea data-ref="input"></textarea>
                <span class="rsm-v2-setting-unit" data-ref="unit"></span>
            </label>
        </div>`;
    const SLIDER_CONTROL_TEMPLATE = `
        <div class="rsm-v2-setting rsm-v2-control-setting rsm-v2-slider">
            <label class="rsm-v2-field">
                <span class="rsm-v2-field-label" data-ref="caption"></span>
                <input type="range" data-ref="input">
                <input type="number" data-ref="secondaryInput">
                <span class="rsm-v2-setting-unit" data-ref="unit"></span>
            </label>
        </div>`;
    const SLIDER_PAIR_CONTROL_TEMPLATE = `
        <div class="rsm-v2-setting rsm-v2-control-setting rsm-v2-slider-pair-setting">
            <label class="rsm-v2-field">
                <span class="rsm-v2-field-label" data-ref="caption"></span>
                <span class="rsm-v2-slider-pair" data-ref="sliderPair">
                    <span class="rsm-v2-slider-pair-track"><span class="rsm-v2-slider-pair-fill"></span></span>
                    <input type="range" class="rsm-v2-slider-pair-lower" data-ref="input">
                    <input type="range" class="rsm-v2-slider-pair-upper" data-ref="secondaryInput">
                </span>
                <input type="number" data-ref="lowerNumberInput">
                <input type="number" data-ref="upperNumberInput">
                <span class="rsm-v2-setting-unit" data-ref="unit"></span>
            </label>
        </div>`;

    class ActionButtonControl {
        constructor(node, definition, feature, settings) {
            this.node = node;
            this.feature = feature;
            this.settings = settings;
        }

        static configureHeaderCell(cell, node) {
            if (node.size == null) {
                cell.style.flex = "0 0 auto";
            }
            cell.style.minWidth = "max-content";
        }

        isEnabled() {
            const { node, feature, settings } = this;
            const linked = node.setting ? settings.schema?.[node.setting] || feature.schema[node.setting] || {} : null;
            const availability = linked || node;
            return settings.uiEnabled !== false && feature.isEnabled() && featurePageAllowed(feature) && settingBindingsAllowed(availability) && settingIsEnabled(node, settings) && (!linked || settingIsEnabled(linked, settings));
        }

        render() {
            const { node, feature, settings } = this;
            const caption = feature.ui.labelFor(node, settings);
            const { root: row, action: button } = instantiateUI(ACTION_CONTROL_TEMPLATE, {
                action: { textContent: caption || "Button" }
            });
            if (typeof node.buttonColor === "string" && /^#[0-9a-f]{6}$/i.test(node.buttonColor)) {
                button.classList.add("rsm-v2-custom-button-color");
                button.style.setProperty("--rsm-v2-custom-button-color", node.buttonColor);
            }
            applyGroupSize(row, node);
            row.style.minWidth = "max-content";
            if (node.size != null || node.width != null) {
                row.classList.add("rsm-v2-action-sized");
            }
            const linked = node.setting ? settings.schema?.[node.setting] || feature.schema[node.setting] || {} : null;
            const update = () => {
                button.disabled = !this.isEnabled();
                row.classList.toggle("rsm-v2-disabled", button.disabled);
            };
            button.addEventListener("click", () => {
                if (button.disabled) {
                    return;
                }
                node.onClick?.(feature.context({}, settings));
            });
            update();
            const unsubs = [];
            for (const dependency of [node.enabledWhen?.setting, linked?.enabledWhen?.setting].filter(Boolean)) {
                unsubs.push(settings.getHandle(dependency).onChange(update, { source: "ui" }));
            }
            return { element: row, dispose: () => unsubscribeAll(unsubs) };
        }
    }

    class SettingsValueControl {
        constructor(node, definition, feature, settings) {
            this.node = node;
            this.definition = definition;
            this.feature = feature;
            this.settings = settings;
            this.trigger = (node.trigger ?? "change").toLowerCase();
        }

        get template() {
            return INPUT_CONTROL_TEMPLATE;
        }

        get supportsValidationFeedback() {
            return false;
        }

        properties() {
            const label = this.feature.ui.labelFor(this.node, this.settings);
            return {
                caption: label != null && String(label).trim() !== "" ? { textContent: label } : null,
                unit: this.node.valueLabel ? { textContent: this.node.valueLabel } : null
            };
        }

        attach(parts) {
            this.parts = parts;
            this.syncBounds();
        }

        syncBounds() {
            const { input, secondaryInput, lowerNumberInput, upperNumberInput } = this.parts;
            const { node, definition } = this;
            const resolve = (value) => typeof value === "function" ? value(this.feature.context({}, this.settings)) : value;
            this.min = resolve(node.min ?? definition.min);
            this.max = resolve(node.max ?? definition.max);
            this.step = resolve(node.step ?? definition.step);
            [input, secondaryInput, lowerNumberInput, upperNumberInput].filter(Boolean).forEach((control) => {
                if (this.min != null) {
                    control.min = this.min;
                }
                if (this.max != null) {
                    control.max = this.max;
                }
                if (this.step != null) {
                    control.step = this.step;
                }
                if (definition.maxLength != null) {
                    control.maxLength = definition.maxLength;
                }
            });
        }

        apply(value) {
            this.parts.input.value = settingInputValue(this.definition, value);
        }

        bind(commit) {
            this.parts.input.addEventListener("change", () => commit(this.parts.input.value));
        }

        get inputEventType() {
            return "input";
        }

        inputValue(control) {
            return control.value;
        }

        inputControls() {
            const { input, secondaryInput, lowerNumberInput, upperNumberInput } = this.parts;
            return [input, secondaryInput, lowerNumberInput, upperNumberInput].filter(Boolean);
        }

        isEnabled() {
            return this.settings.uiEnabled !== false && this.feature.isEnabled() && settingBindingsAllowed(this.definition) && settingIsEnabled(this.node, this.settings) && settingIsEnabled(this.definition, this.settings);
        }

        update(value) {
            this.enabled = this.isEnabled();
            for (const control of this.inputControls()) {
                control.disabled = !this.enabled;
            }
            this.parts.root.classList.toggle("rsm-v2-disabled", !this.enabled);
            this.apply(value);
            this.updateFeedback(this.parts.input.value);
        }

        refreshFromStore() {
            this.update(this.settings.get(this.node.setting));
        }

        commit(value) {
            this.handle.set(value);
            this.refreshFromStore();
        }

        listenForInput() {
            const { node, feature, settings } = this;
            const onInput = typeof node.onInput === "function" ? node.onInput : null;
            if (!onInput && node.validationFeedback == null) {
                return;
            }

            for (const control of this.inputControls()) {
                control.addEventListener(this.inputEventType, (event) => {
                    if (!this.enabled || control.disabled || !feature.isEnabled()) {
                        return;
                    }
                    const value = this.inputValue(control);
                    if (control === this.parts.input) {
                        this.updateFeedback(value);
                    }
                    if (onInput) {
                        onInput.call(node, feature.context({
                            event, input: control, value, setting: node.setting
                        }, settings));
                    }
                });
            }
        }

        render() {
            this.parts = instantiateUI(this.template, this.properties());
            applyGroupSize(this.parts.root, this.node);
            this.attach(this.parts);
            this.updateFeedback = createValidationFeedback(this.node, this.supportsValidationFeedback, this.parts.input);
            this.handle = this.settings.getHandle(this.node.setting);
            this.refreshFromStore();
            this.listenForInput();
            this.bind((value) => this.commit(value), (value) => this.update(value));
            const unsubs = [this.handle.onChange((value) => this.update(value), { source: "ui" })];
            for (const name of toArray(this.node.watchBounds)) {
                unsubs.push(this.settings.getHandle(name).onChange(() => {
                    this.syncBounds();
                    this.refreshFromStore();
                }, { source: "ui" }));
            }
            const dependencies = [this.node.enabledWhen?.setting, this.definition.enabledWhen?.setting];
            for (const dependency of dependencies.filter(Boolean)) {
                unsubs.push(this.settings.getHandle(dependency).onChange(() => {
                    this.refreshFromStore();
                }));
            }
            return {
                element: this.parts.root,
                dispose: () => unsubscribeAll(unsubs)
            };
        }
    }

    class TextInputControl extends SettingsValueControl {
        get supportsValidationFeedback() {
            return true;
        }

        get inputType() {
            return "text";
        }

        properties() {
            return {
                ...super.properties(),
                input: {
                    type: this.inputType,
                    placeholder: this.node.placeholder || ""
                }
            };
        }

        attach(parts) {
            super.attach(parts);
            if (this.inputType === "color") {
                return;
            }

            const requested = this.node.alignText;
            const alignment = ["left", "center", "right"].includes(requested) ? requested : "left";
            parts.input.style.setProperty("text-align", alignment, "important");
        }
    }

    class NumberInputControl extends TextInputControl {
        get inputType() {
            return "number";
        }
    }

    class ColorInputControl extends TextInputControl {
        get supportsValidationFeedback() {
            return false;
        }

        get inputType() {
            return "color";
        }
    }

    class TextAreaControl extends SettingsValueControl {
        get template() {
            return TEXTAREA_CONTROL_TEMPLATE;
        }

        get supportsValidationFeedback() {
            return true;
        }

        properties() {
            return {
                ...super.properties(),
                input: { rows: this.node.rows || 4, placeholder: this.node.placeholder || "" }
            };
        }
    }

    class DropdownControl extends SettingsValueControl {
        get template() {
            return DROPDOWN_CONTROL_TEMPLATE;
        }

        get inputEventType() {
            return "change";
        }

        attach(parts) {
            super.attach(parts);
            toArray(this.node.options || this.definition.options).forEach((option) => {
                const item = typeof option === "object" ? option : { value: option, label: option };
                const element = document.createElement("option");
                element.value = item.value;
                element.textContent = item.label ?? item.value;
                parts.input.appendChild(element);
            });
        }
    }

    class ToggleControl extends SettingsValueControl {
        get template() {
            return TOGGLE_CONTROL_TEMPLATE;
        }

        get inputEventType() {
            return "click";
        }

        inputValue() {
            return !this.settings.get(this.node.setting);
        }

        attach(parts) {
            super.attach(parts);
            if (this.feature.ui.labelFor(this.node, this.settings).trim() === "") {
                parts.field.classList.add("rsm-v2-toggle-field-unlabeled");
            }
        }

        apply(value) {
            const input = this.parts.input;
            input.textContent = value ? this.node.onLabel || "Enabled" : this.node.offLabel || "Disabled";
            input.classList.toggle("rsm-v2-toggle-on", Boolean(value));
        }

        bind(commit) {
            this.parts.input.addEventListener("click", () => commit(!this.settings.get(this.node.setting)));
        }
    }

    class SliderControl extends SettingsValueControl {
        get template() {
            return SLIDER_CONTROL_TEMPLATE;
        }

        updateTrack(value) {
            const span = Number(this.max ?? 100) - Number(this.min ?? 0);
            let progress = 0;
            if (span > 0) {
                progress = ((Number(value) - Number(this.min ?? 0)) / span) * 100;
            }
            this.parts.input.style.setProperty("--rsm-v2-slider-progress", `${Math.max(0, Math.min(100, progress))}%`);
        }

        apply(value) {
            super.apply(value);
            this.parts.secondaryInput.value = settingInputValue(this.definition, value);
            this.updateTrack(this.parts.input.value);
        }

        bind(commit) {
            const { input, secondaryInput } = this.parts;
            input.addEventListener("input", () => {
                if (this.trigger === "release") {
                    secondaryInput.value = settingInputValue(this.definition, input.value);
                    this.updateTrack(input.value);
                    return;
                }
                commit(input.value);
            });
            if (this.trigger === "release") {
                input.addEventListener("change", () => commit(input.value));
            }
            secondaryInput.addEventListener("change", () => commit(secondaryInput.value));
        }
    }

    class SliderPairControl extends SettingsValueControl {
        get template() {
            return SLIDER_PAIR_CONTROL_TEMPLATE;
        }

        attach(parts) {
            super.attach(parts);
            if (this.step == null) {
                for (const control of [parts.input, parts.secondaryInput,
                    parts.lowerNumberInput, parts.upperNumberInput]) {
                    control.step = "any";
                }
            }
        }

        updateTrack(pair) {
            const span = Number(this.max ?? 100) - Number(this.min ?? 0);
            let start = 0;
            let end = 100;
            if (span > 0) {
                start = ((pair[0] - Number(this.min ?? 0)) / span) * 100;
                end = ((pair[1] - Number(this.min ?? 0)) / span) * 100;
            }
            this.parts.sliderPair.style.setProperty("--slider-start", `${start}%`);
            this.parts.sliderPair.style.setProperty("--slider-end", `${end}%`);
        }

        apply(value) {
            const pair = Array.isArray(value) ? value : sanitizeValue(this.definition, value);
            const { input, secondaryInput, lowerNumberInput, upperNumberInput } = this.parts;
            input.value = pair[0];
            secondaryInput.value = pair[1];
            lowerNumberInput.value = pair[0];
            upperNumberInput.value = pair[1];
            this.updateTrack(pair);
        }

        bind(commit, refresh) {
            const { input, secondaryInput, lowerNumberInput, upperNumberInput } = this.parts;
            const edit = (changedInput, shouldCommit = true) => {
                if (changedInput.value === "") {
                    refresh(this.settings.get(this.node.setting));
                    return;
                }
                let lower = Number(input.value);
                let upper = Number(secondaryInput.value);
                if (changedInput === lowerNumberInput) {
                    lower = Number(lowerNumberInput.value);
                }
                if (changedInput === upperNumberInput) {
                    upper = Number(upperNumberInput.value);
                }
                if (changedInput === input || changedInput === lowerNumberInput) {
                    lower = Math.min(lower, upper);
                } else {
                    upper = Math.max(upper, lower);
                }
                input.value = lower;
                secondaryInput.value = upper;
                lowerNumberInput.value = lower;
                upperNumberInput.value = upper;
                this.updateTrack([lower, upper]);
                if (shouldCommit) {
                    commit([lower, upper]);
                } else {
                    refresh([lower, upper]);
                }
            };
            input.addEventListener("pointerdown", () => {
                input.style.zIndex = "3";
                secondaryInput.style.zIndex = "2";
            });
            secondaryInput.addEventListener("pointerdown", () => {
                secondaryInput.style.zIndex = "3";
                input.style.zIndex = "2";
            });
            input.addEventListener("input", () => edit(input, this.trigger !== "release"));
            secondaryInput.addEventListener("input", () => edit(secondaryInput, this.trigger !== "release"));
            if (this.trigger === "release") {
                input.addEventListener("change", () => edit(input));
                secondaryInput.addEventListener("change", () => edit(secondaryInput));
            }
            lowerNumberInput.addEventListener("change", () => edit(lowerNumberInput));
            upperNumberInput.addEventListener("change", () => edit(upperNumberInput));
        }
    }

    const CONTROL_CLASSES = createLookup({
        button: ActionButtonControl,
        textinput: TextInputControl,
        text: TextInputControl,
        number: NumberInputControl,
        color: ColorInputControl,
        textarea: TextAreaControl,
        dropdown: DropdownControl,
        toggle: ToggleControl,
        togglebutton: ToggleControl,
        slider: SliderControl,
        sliderpair: SliderPairControl
    });

    function createValidationFeedback(node, supported, input) {
        const feedback = node.validationFeedback;
        if (feedback == null) {
            return () => {};
        }
        if (!supported) {
            throw new TypeError("validationFeedback is supported on text inputs and textareas only.");
        }
        const pattern = feedback.regex;
        let regex;
        if (typeof pattern === "string") {
            regex = new RegExp(pattern);
        } else if (pattern && typeof pattern.test === "function") {
            regex = pattern;
        } else {
            throw new TypeError("validationFeedback.regex must be a RegExp or regex string.");
        }
        if (feedback.successColor) {
            input.style.setProperty("--rsm-v2-feedback-success-color", feedback.successColor);
        }
        if (feedback.errorColor) {
            input.style.setProperty("--rsm-v2-feedback-error-color", feedback.errorColor);
        }
        return (value) => {
            regex.lastIndex = 0;
            const valid = regex.test(String(value ?? ""));
            input.classList.toggle("rsm-v2-feedback-valid", valid);
            input.classList.toggle("rsm-v2-feedback-invalid", !valid);
        };
    }

    function controlClassFor(node, definition) {
        const type = normalizeLayoutType(node.control || node.type || settingTypeFor(definition).defaultControl);
        return CONTROL_CLASSES[type] || TextInputControl;
    }

    function createSettingsControl(node, feature, settings) {
        const name = node.setting;
        const definition = name ? settings.schema?.[name] || feature.schema[name] || {} : node;
        const Control = controlClassFor(node, definition);
        return new Control(node, definition, feature, settings).render();
    }

    class StaticUIElement {
        constructor(node, feature, settings) {
            this.node = node;
            this.feature = feature;
            this.settings = settings;
        }

        render() {
            const element = this.createElement();
            this.applySize(element);
            return { element, dispose: () => {} };
        }

        applySize(element) {
            applyGroupSize(element, this.node);
        }
    }

    class LabelUIElement extends StaticUIElement {
        createElement() {
            const element = document.createElement("div");
            element.className = "rsm-v2-label";
            const content = this.node.text ?? this.node.label ?? "";
            if (typeof content !== "string") {
                throw new TypeError("A static label needs string text; use dynamicLabel for changing values.");
            }
            element.textContent = content;
            const requested = (this.node.alignText ?? "top-left").toLowerCase();
            const [vertical, horizontal] = requested === "center" ? ["center", "center"] : requested.split("-");
            const verticalPositions = { top: "flex-start", center: "center", bottom: "flex-end" };
            const horizontalPositions = { left: "flex-start", center: "center", right: "flex-end" };
            const valid = ["top", "center", "bottom"].includes(vertical) && ["left", "center", "right"].includes(horizontal);
            element.style.setProperty("display", "flex", "important");
            element.style.setProperty("align-items", valid ? verticalPositions[vertical] : "flex-start", "important");
            element.style.setProperty("justify-content", valid ? horizontalPositions[horizontal] : "flex-start", "important");
            element.style.setProperty("text-align", valid ? horizontal : "left", "important");
            return element;
        }
    }

    class DynamicLabelUIElement extends LabelUIElement {
        render() {
            const name = this.node.setting;
            const rowSetting = hasPropCall(this.settings.schema || {}, name);
            const featureSetting = hasPropCall(this.feature.schema, name);
            if (typeof name !== "string" || (!rowSetting && !featureSetting)) {
                throw new Error(`Unknown dynamicLabel setting: ${name}`);
            }
            const result = super.render();
            const handle = this.settings.getHandle(name);
            const update = (value) => {
                const context = this.feature.context({ value }, this.settings);
                const displayed = typeof this.node.format === "function" ? this.node.format(context) : value;
                result.element.textContent = displayed === null || displayed === undefined || displayed === "" ? String(this.node.fallback ?? "") : String(displayed);
            };
            update(handle.get());
            const unsubscribe = handle.onChange(update, { source: "ui" });
            return { element: result.element, dispose: unsubscribe };
        }
    }

    class DividerUIElement extends StaticUIElement {
        get vertical() {
            return normalizeLayoutType(this.node.orientation) === "vertical";
        }

        createElement() {
            const element = document.createElement("div");
            element.className = this.vertical ? "rsm-v2-divider rsm-v2-divider-vertical" : "rsm-v2-divider";
            const caption = this.feature.ui.labelFor(this.node, this.settings);
            if (!this.vertical && caption) {
                const label = document.createElement("span");
                label.textContent = caption;
                element.appendChild(label);
            }
            return element;
        }
    }

    class VerticalDividerUIElement extends DividerUIElement {
        get vertical() {
            return true;
        }
    }

    class SpaceUIElement extends StaticUIElement {
        createElement() {
            const element = document.createElement("div");
            element.className = "rsm-v2-space";
            return element;
        }

        applySize(element) {
            let fallbackSize = "0px";
            if (this.node.size != null) {
                fallbackSize = cssSize(this.node.size);
            } else if (this.node.width == null && this.node.height == null) {
                fallbackSize = "12px";
            }
            element.style.width = this.node.width != null ? cssSize(this.node.width) : fallbackSize;
            element.style.height = this.node.height != null ? cssSize(this.node.height) : fallbackSize;
        }
    }

    class CanvasUIElement extends StaticUIElement {
        createElement() {
            const canvas = document.createElement("canvas");
            canvas.className = "rsm-v2-canvas";
            if (this.node.id) {
                canvas.dataset.rsmCanvasId = this.node.id;
            }
            const dimension = (value, fallback) => Number.isSafeInteger(value) && value > 0 ? value : fallback;
            canvas.width = dimension(this.node.canvasWidth, 800);
            canvas.height = dimension(this.node.canvasHeight, 600);
            return canvas;
        }

        applySize(element) {
            if (this.node.fill !== true) {
                super.applySize(element);
            }
        }

        render() {
            const result = super.render();
            const canvas = result.element;
            let element = canvas;
            if (this.node.fill === true) {
                const frame = document.createElement("div");
                frame.className = "rsm-v2-canvas-fill";
                applyGroupSize(frame, this.node);
                frame.appendChild(canvas);
                element = frame;
            }
            const context = canvas.getContext?.("2d");
            const draw = () => {
                if (!context || typeof this.node.draw !== "function") {
                    return;
                }
                try {
                    const pending = this.node.draw(this.feature.context({ canvas, context }, this.settings));
                    if (pending && typeof pending.catch === "function") {
                        pending.catch((error) => console.error("[RSM] Canvas draw failed", error));
                    }
                } catch (error) {
                    console.error("[RSM] Canvas draw failed", error);
                }
            };
            const unsubs = [];
            if (this.node.id) {
                unsubs.push(this.feature.ui.registerCanvas(this.node.id, draw));
            }
            for (const name of toArray(this.node.watchSettings)) {
                unsubs.push(this.settings.getHandle(name).onChange(draw, { source: "ui" }));
            }
            if (this.node.fill === true) {
                const resize = () => {
                    const box = canvas.getBoundingClientRect();
                    if (box.width <= 0 || box.height <= 0) {
                        return;
                    }
                    const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
                    const width = Math.max(1, Math.round(box.width * scale));
                    const height = Math.max(1, Math.round(box.height * scale));
                    if (canvas.width !== width || canvas.height !== height) {
                        canvas.width = width;
                        canvas.height = height;
                        draw();
                    }
                };
                if (typeof ResizeObserver === "function") {
                    const observer = new ResizeObserver(resize);
                    observer.observe(canvas);
                    unsubs.push(() => observer.disconnect());
                } else {
                    window.addEventListener?.("resize", resize);
                    unsubs.push(() => window.removeEventListener?.("resize", resize));
                }
                if (typeof setTimeout === "function") {
                    const initialResize = setTimeout(resize, 0);
                    unsubs.push(() => clearTimeout(initialResize));
                }
            }
            if (typeof this.node.onMount === "function") {
                const cleanup = this.node.onMount(this.feature.context({ canvas, context }, this.settings));
                if (typeof cleanup === "function") {
                    unsubs.push(cleanup);
                }
            }
            draw();
            return { element, dispose: () => unsubscribeAll(unsubs) };
        }
    }

    const DISPLAY_UI_ELEMENTS = createLookup({
        label: LabelUIElement,
        text: LabelUIElement,
        dynamiclabel: DynamicLabelUIElement,
        canvas: CanvasUIElement,
        divider: DividerUIElement,
        verticaldivider: VerticalDividerUIElement,
        space: SpaceUIElement
    });

    function createDisplayUIElement(node, feature, settings) {
        const type = normalizeLayoutType(node.type);
        const Element = DISPLAY_UI_ELEMENTS[type];
        return new Element(node, feature, settings).render();
    }

    function createSettingsNode(node, feature, settings, path = "root") {
        const visible = feature.ui.isVisible(node, settings);
        feature.ui.recordVisibility(node, visible);
        const unsubs = [];
        const rule = node.visibleWhen;
        const definition = node.setting ? settings.schema?.[node.setting] || feature.schema[node.setting] || {} : node;
        if (rule && typeof rule === "object" && rule.setting) {
            unsubs.push(settings.getHandle(rule.setting).onChange(() => {
                if (feature.ui.isVisible(node, settings) !== visible) {
                    queueSettingsUI();
                }
            }, { source: "ui" }));
        }
        const watchesVisibility = typeof rule === "function";
        const watchesEnabled = typeof node.enabledWhen === "function" ||
            typeof definition.enabledWhen === "function";
        if (watchesVisibility || watchesEnabled) {
            const enabled = () => settingIsEnabled(node, settings) &&
                (definition === node || settingIsEnabled(definition, settings));
            const initialEnabled = watchesEnabled ? enabled() : true;
            for (const name of new Set(toArray(node.watchSettings))) {
                unsubs.push(settings.getHandle(name).onChange(() => {
                    if ((watchesVisibility && feature.ui.isVisible(node, settings) !== visible) ||
                        (watchesEnabled && enabled() !== initialEnabled)) {
                        queueSettingsUI();
                    }
                }, { source: "ui" }));
            }
        }
        if (!visible) {
            const unregister = feature.ui.registerRenderedNode(node, settings, false,
                feature.ui.isEnabled(node, settings), null);
            return { element: null, dispose: () => {
                unregister();
                unsubscribeAll(unsubs);
            } };
        }

        const type = normalizeLayoutType(node.type || node.control || settingTypeFor(definition).defaultControl);
        const isDisplay = DISPLAY_UI_ELEMENTS[type] != null;
        const Layout = LAYOUT_CLASSES[type] || (node.children || node.items ? SettingsLayout : null);
        let result;
        if (isDisplay) {
            result = createDisplayUIElement(node, feature, settings);
            if (settings.uiEnabled === false || !settingIsEnabled(node, settings)) {
                result.element.classList.add("rsm-v2-disabled");
            }
            const enabledRule = node.enabledWhen;
            if (enabledRule && typeof enabledRule === "object" && enabledRule.setting) {
                unsubs.push(settings.getHandle(enabledRule.setting).onChange(queueSettingsUI, { source: "ui" }));
            }
        } else if (Layout) {
            result = new Layout(node, feature, settings, path).render();
        } else {
            result = createSettingsControl(node, feature, settings);
        }
        let unregister;
        try {
            unregister = feature.ui.registerRenderedNode(node, settings, true,
                feature.ui.isEnabled(node, settings), result.element);
        } catch (error) {
            result.dispose();
            unsubscribeAll(unsubs);
            throw error;
        }
        return {
            element: result.element,
            dispose: () => {
                unregister();
                result.dispose();
                unsubscribeAll(unsubs);
            }
        };
    }

    class CollectionFieldHandle {
        constructor(settings, field) {
            this.settings = settings;
            this.name = field;
            this.definition = settings.schema[field];
        }

        get value() {
            return this.get();
        }

        get() {
            return this.settings.get(this.name);
        }

        set(value) {
            return this.settings.set(this.name, value);
        }

        reset() {
            return this.set(this.definition?.default);
        }

        onChange(listener, options = {}) {
            const { feature, collectionName, collection, itemId } = this.settings;
            return feature.settings.subscribe(collectionName, (next, previous, info) => {
                const current = next.find((row) => row.id === itemId)?.[this.name];
                const old = previous.find((row) => row.id === itemId)?.[this.name];
                if (valuesEqual(current, old)) {
                    return;
                }
                const context = feature.context({ ...info, itemId, field: this.name, item: collection.get(itemId), collection }, this.settings);
                listener(current, old, context);
            }, options);
        }
    }

    class CollectionRowSettings {
        constructor(feature, collectionName, collection, itemId, uiEnabled = true) {
            this.feature = feature;
            this.collectionName = collectionName;
            this.collection = collection;
            this.collectionApi = collection;
            this.itemId = itemId;
            this.uiEnabled = uiEnabled;
            this.schema = {};
            this.handles = new Map();
            const definition = feature.schema[collectionName];
            const item = collection.get(itemId);
            for (const [field, fieldDefinition] of Object.entries(definition.item || {})) {
                const resolved = { ...fieldDefinition };
                for (const key of ["bindingId", "bindingIds", "bindingMode"]) {
                    if (resolved[key] == null && definition[key] != null) {
                        resolved[key] = definition[key];
                    }
                }
                if (typeof resolved.options === "function") {
                    resolved.options = resolved.options(feature.context({
                        item, itemId: item.id, field, collection
                    }));
                }
                this.schema[field] = resolved;
            }
        }

        get(field) {
            if (hasPropCall(this.schema, field)) {
                return this.collection.get(this.itemId)?.[field];
            }
            if (hasPropCall(this.feature.schema, field)) {
                return this.feature.settings.get(field);
            }
            return undefined;
        }

        set(field, value) {
            if (hasPropCall(this.schema, field)) {
                return this.collection.set(this.itemId, field, value);
            }
            if (hasPropCall(this.feature.schema, field)) {
                return this.feature.settings.set(field, value);
            }
            throw new Error(`Unknown collection field: ${field}`);
        }

        getHandle(field) {
            if (!hasPropCall(this.schema, field) &&
                hasPropCall(this.feature.schema, field)) {
                return this.feature.settings.getHandle(field);
            }
            if (!this.handles.has(field)) {
                this.handles.set(field, new CollectionFieldHandle(this, field));
            }
            return this.handles.get(field);
        }
    }

    const REPEATER_TEMPLATE = `
        <div class="rsm-v2-repeater">
            <div class="rsm-v2-repeater-headers" data-ref="headers"></div>
        </div>`;

    class RepeaterLayout {
        static get repeatsItems() {
            return true;
        }

        constructor(node, feature, settings, path) {
            this.node = node;
            this.feature = feature;
            this.settings = settings;
            this.path = path;
            this.collection = feature.settings.collection(node.setting);
            this.definition = feature.schema[node.setting];
            this.headers = CollectionSettingType.headers(this.definition, node.setting);
            this.children = toArray(node.children || node.items);
            this.columnLayout = this.children.find((child) => normalizeLayoutType(child.type) === "horizontalgroup");
            this.columnNodes = toArray(this.columnLayout?.children || this.columnLayout?.items);
            this.disposers = [];
            this.headerCells = [];
            this.columnElements = [];
            this.rowConditionFields = new Set();
            this.headerDependencies = new Set();
        }

        watchCondition(rule) {
            if (!rule || typeof rule !== "object" || !rule.setting) {
                return;
            }
            if (hasPropCall(this.definition.item || {}, rule.setting)) {
                this.rowConditionFields.add(rule.setting);
            } else if (hasPropCall(this.feature.schema, rule.setting)) {
                this.headerDependencies.add(rule.setting);
            }
        }

        watchHeaderConditions() {
            this.watchCondition(this.node.enabledWhen);
            this.watchCondition(this.definition.enabledWhen);
            this.watchCondition(this.columnLayout?.visibleWhen);
            this.watchCondition(this.columnLayout?.enabledWhen);
            for (const column of this.columnNodes) {
                this.watchCondition(column.visibleWhen);
                this.watchCondition(column.enabledWhen);
                const definition = this.definition.item?.[column.setting] || this.feature.schema[column.setting];
                this.watchCondition(definition?.enabledWhen);
            }
            for (const dependency of this.headerDependencies) {
                this.disposers.push(this.settings.getHandle(dependency).onChange(queueSettingsUI, { source: "ui" }));
            }
        }

        columnVisible(column, rowSettings) {
            return (!this.columnLayout || this.feature.ui.isVisible(this.columnLayout, rowSettings)) &&
                this.feature.ui.isVisible(column, rowSettings);
        }

        columnEnabled(column, rowSettings) {
            const definition = rowSettings.schema?.[column.setting] || this.feature.schema[column.setting] || {};
            return this.repeaterEnabled && rowSettings.uiEnabled !== false &&
                (!this.columnLayout || settingIsEnabled(this.columnLayout, rowSettings)) &&
                settingIsEnabled(column, rowSettings) &&
                settingIsEnabled(definition, rowSettings);
        }

        renderHeaders(contexts) {
            if (this.headers.length === 0) {
                return;
            }
            const columnCount = this.columnNodes.length || this.headers.length;
            for (let index = 0; index < columnCount; index += 1) {
                const column = this.columnNodes[index];
                if (column && !contexts.some((context) => this.columnVisible(column, context))) {
                    this.headerCells[index] = null;
                    continue;
                }
                const cell = document.createElement("div");
                cell.className = "rsm-v2-repeater-header-cell";
                cell.textContent = this.headers[index] ?? "";
                if (column) {
                    const enabled = contexts.some((context) =>
                        this.columnVisible(column, context) && this.columnEnabled(column, context));
                    cell.classList.toggle("rsm-v2-disabled", !enabled);
                    applyGroupSize(cell, column);
                    const definition = this.definition.item?.[column.setting] ||
                        this.feature.schema[column.setting] || {};
                    controlClassFor(column, definition).configureHeaderCell?.(cell, column);
                }
                this.headerRow.appendChild(cell);
                this.headerCells[index] = cell;
            }
        }

        recordColumns(rendered, rowSettings) {
            let renderedIndex = 0;
            this.columnNodes.forEach((column, columnIndex) => {
                if (this.feature.ui.isVisible(column, rowSettings)) {
                    this.columnElements[columnIndex] ||= rendered[renderedIndex];
                    renderedIndex += 1;
                }
            });
        }

        renderRows(rows) {
            for (const { item, settings: rowSettings } of rows) {
                const row = document.createElement("div");
                row.className = "rsm-v2-repeater-item";
                for (let index = 0; index < this.children.length; index += 1) {
                    const child = this.children[index];
                    const path = `${this.path}.row.${item.id}.${index}`;
                    const result = createSettingsNode(child, this.feature, rowSettings, path);
                    if (result.element) {
                        row.appendChild(result.element);
                        if (child === this.columnLayout) {
                            this.recordColumns(Array.from(result.element.children), rowSettings);
                        }
                    }
                    this.disposers.push(result.dispose);
                }
                this.element.appendChild(row);
                this.disposers.push(this.feature.ui.registerRenderedRow(this.node, item.id, row));
            }
        }

        observeHeaderWidths() {
            const columns = this.columnElements.filter((column, index) => column && this.headerCells[index]);
            if (columns.length === 0 || typeof ResizeObserver !== "function") {
                return;
            }
            const alignHeaders = () => {
                this.columnElements.forEach((column, index) => {
                    const cell = this.headerCells[index];
                    if (!column || !cell) {
                        return;
                    }
                    const width = column.getBoundingClientRect().width;
                    if (width <= 0 || cell.style.width === `${width}px`) {
                        return;
                    }
                    cell.style.flex = `0 0 ${width}px`;
                    cell.style.width = `${width}px`;
                });
            };
            const observer = new ResizeObserver(alignHeaders);
            columns.forEach((column) => observer.observe(column));
            this.disposers.push(() => observer.disconnect());
        }

        optionsChanged(next, oldRows) {
            for (const item of next) {
                const old = oldRows.get(item.id);
                for (const [field, definition] of Object.entries(this.definition.item || {})) {
                    if (typeof definition.options !== "function") {
                        continue;
                    }
                    const before = definition.options(this.feature.context({ item: old, itemId: old?.id, field, collection: this.collection }));
                    const after = definition.options(this.feature.context({ item, itemId: item.id, field, collection: this.collection }));
                    if (!valuesEqual(before, after)) {
                        return true;
                    }
                }
            }
            return false;
        }

        watchCollection() {
            const conditionalFields = Array.from(this.rowConditionFields);
            this.disposers.push(this.collection.onChange((next, previous) => {
                const oldRows = new Map(previous.map((item) => [item.id, item]));
                const rowsChanged = next.length !== previous.length || next.some((item, index) => item.id !== previous[index].id);
                const conditionsChanged = conditionalFields.length > 0 && next.some((item) => conditionalFields.some((field) => !valuesEqual(item[field], oldRows.get(item.id)?.[field])));
                if (rowsChanged || conditionsChanged || this.optionsChanged(next, oldRows)) {
                    queueSettingsUI();
                }
            }, { source: "ui" }));
        }

        render() {
            if (this.columnNodes.length > 0 && this.headers.length > this.columnNodes.length) {
                throw new RangeError(`Collection ${this.node.setting} has more headers than row columns.`);
            }
            this.repeaterEnabled = this.feature.isEnabled() && this.settings.uiEnabled !== false && settingIsEnabled(this.node, this.settings) && settingIsEnabled(this.definition, this.settings);
            const rows = this.collection.list().map((item) => ({
                item,
                settings: new CollectionRowSettings(this.feature, this.node.setting, this.collection, item.id, this.repeaterEnabled)
            }));
            const contexts = rows.length > 0 ? rows.map((row) => row.settings) : [this.settings];
            const properties = this.headers.length === 0 ? { headers: null } : {};
            const parts = instantiateUI(REPEATER_TEMPLATE, properties);
            this.element = parts.root;
            this.headerRow = parts.headers;
            applyGroupSize(this.element, this.node);
            this.element.classList.toggle("rsm-v2-disabled", !this.repeaterEnabled);
            this.watchHeaderConditions();
            this.renderHeaders(contexts);
            this.renderRows(rows);
            this.observeHeaderWidths();
            this.watchCollection();
            return { element: this.element, dispose: () => this.dispose() };
        }

        dispose() {
            this.disposers.forEach((dispose) => dispose());
        }
    }

    const PANEL_TEMPLATE = `
        <div class="rsm-v2-panel">
            <h4 class="rsm-v2-panel-label" data-ref="title"></h4>
            <button type="button" class="rsm-v2-panel-label rsm-v2-panel-toggle" data-ref="toggle"></button>
            <div class="rsm-v2-panel-body" data-ref="body"></div>
        </div>`;

    class SettingsLayout {
        constructor(node, feature, settings, path) {
            this.node = node;
            this.feature = feature;
            this.settings = settings;
            this.path = path;
            this.disposers = [];
        }

        createElement() {
            const element = document.createElement("div");
            const type = normalizeLayoutType(this.node.type || "verticalGroup");
            element.className = `rsm-v2-${type}`;
            this.childContainer = element;
            return element;
        }

        configure() {}

        childSettings() {
            const { node, settings } = this;
            let childSettings = settings;
            if (settings.uiEnabled !== false && !settingIsEnabled(node, settings)) {
                childSettings = Object.create(settings);
                childSettings.uiEnabled = false;
                this.element.classList.add("rsm-v2-disabled");
            }
            const enabledRule = node.enabledWhen;
            if (enabledRule && typeof enabledRule === "object" && enabledRule.setting) {
                this.disposers.push(settings.getHandle(enabledRule.setting).onChange(queueSettingsUI, { source: "ui" }));
            }
            return childSettings;
        }

        renderChildren(childSettings) {
            const children = toArray(this.node.children || this.node.items);
            for (let index = 0; index < children.length; index += 1) {
                const result = createSettingsNode(children[index], this.feature, childSettings, `${this.path}.${index}`);
                if (result.element) {
                    this.childContainer.appendChild(result.element);
                }
                this.disposers.push(result.dispose);
            }
        }

        render() {
            this.element = this.createElement();
            applyGroupSize(this.element, this.node);
            const childSettings = this.childSettings();
            this.configure();
            this.renderChildren(childSettings);
            return { element: this.element, dispose: () => this.dispose() };
        }

        dispose() {
            this.disposers.forEach((dispose) => dispose());
        }
    }

    class PanelLayout extends SettingsLayout {
        get hasLabel() {
            return (this.caption ?? this.feature.ui.labelFor(this.node, this.settings)).trim() !== "";
        }

        get isCollapsible() {
            return this.hasLabel && this.node.collapsible === true;
        }

        createElement() {
            const properties = { title: null, toggle: null };
            const caption = this.feature.ui.labelFor(this.node, this.settings);
            this.caption = caption;
            if (this.isCollapsible) {
                properties.toggle = { textContent: caption };
            } else if (this.hasLabel) {
                properties.title = { textContent: caption };
            }
            this.parts = instantiateUI(PANEL_TEMPLATE, properties);
            this.childContainer = this.parts.body;
            return this.parts.root;
        }

        get identity() {
            const panelId = this.node.id ? `id:${this.node.id}` : `path:${this.path}`;
            const rowId = this.settings.itemId ? `:row:${this.settings.itemId}` : "";
            return { panelId, rowId };
        }

        configure() {
            if (this.isCollapsible) {
                this.configureCollapse();
            }
            if (this.node.maxHeight != null) {
                this.configureMaxHeight();
            }
        }

        configureCollapse() {
            const { panelId, rowId } = this.identity;
            this.stateKey = `${STORAGE_PREFIX}panel.${encodeURIComponent(this.feature.id)}${rowId}.${encodeURIComponent(panelId)}.collapsed`;
            const collapsed = GM_getValue(this.stateKey, false) === true;
            this.childContainer.hidden = collapsed;
            this.childContainer.inert = collapsed;
            this.element.classList.toggle("rsm-v2-panel-collapsed", collapsed);
            this.parts.toggle.setAttribute("aria-expanded", String(!collapsed));
            this.parts.toggle.addEventListener("click", () => this.toggleCollapse());
        }

        toggleCollapse() {
            const body = this.childContainer;
            const title = this.parts.toggle;
            const nextCollapsed = title.getAttribute("aria-expanded") === "true";
            const startHeight = body.hidden ? 0 : body.getBoundingClientRect().height;
            const startOpacity = body.hidden ? 0 : getComputedStyle(body).opacity;
            this.animation?.cancel();
            this.animation = null;
            body.hidden = false;
            body.inert = nextCollapsed;
            this.element.classList.toggle("rsm-v2-panel-collapsed", nextCollapsed);
            title.setAttribute("aria-expanded", String(!nextCollapsed));
            GM_setValue(this.stateKey, nextCollapsed);

            if (!body.animate || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
                body.hidden = nextCollapsed;
                body.style.overflow = "";
                return;
            }

            const endHeight = nextCollapsed ? 0 : body.getBoundingClientRect().height;
            body.style.overflow = "hidden";
            this.animation = body.animate([
                { height: `${startHeight}px`, opacity: startOpacity },
                { height: `${endHeight}px`, opacity: nextCollapsed ? 0 : 1 }
            ], { duration: 220, easing: "ease-in-out" });
            this.animation.onfinish = () => {
                this.animation = null;
                body.hidden = nextCollapsed;
                body.style.overflow = "";
            };
        }

        configureMaxHeight() {
            const { panelId, rowId } = this.identity;
            this.element.style.maxHeight = cssSize(this.node.maxHeight);
            if (this.element.style.maxHeight) {
                this.element.classList.add("rsm-v2-panel-limited");
                this.childContainer.dataset.rsmPanelScrollKey = `${this.feature.id}${rowId}.${panelId}`;
            }
        }

        dispose() {
            this.animation?.cancel();
            super.dispose();
        }
    }

    const LAYOUT_CLASSES = createLookup({
        horizontalgroup: SettingsLayout,
        verticalgroup: SettingsLayout,
        panel: PanelLayout,
        repeater: RepeaterLayout
    });

    function animateButtonPress(button) {
        if (button.disabled || button.classList.contains("rsm-v2-panel-toggle")
            || !button.animate || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        buttonPressAnimations.get(button)?.cancel();
        const embeddedToggle = button.classList.contains("rsm-v2-toggle")
            && button.parentElement?.classList.contains("rsm-v2-toggle-field");
        const frames = embeddedToggle ? [
            { filter: "brightness(1)" },
            { filter: "brightness(1.3)", offset: 0.35 },
            { filter: "brightness(1)" }
        ] : [
            { transform: "translateY(0) scale(1)", filter: "brightness(1)" },
            { transform: "translateY(1px) scale(.96)", filter: "brightness(1.3)", offset: 0.35 },
            { transform: "translateY(0) scale(1)", filter: "brightness(1)" }
        ];
        const animation = button.animate(frames, { duration: 260, easing: "ease-out" });
        buttonPressAnimations.set(button, animation);
        const clear = () => {
            if (buttonPressAnimations.get(button) === animation) {
                buttonPressAnimations.delete(button);
            }
        };
        animation.onfinish = clear;
        animation.oncancel = clear;
    }

    function installButtonPressFeedback(container) {
        const press = (event) => {
            const button = event.target?.closest?.("button");
            if (button && container.contains(button)) {
                animateButtonPress(button);
            }
        };
        container.addEventListener("pointerdown", press);
        container.addEventListener("keydown", (event) => {
            if (!event.repeat && (event.key === "Enter" || event.key === " ")) {
                press(event);
            }
        });
    }

    const MODAL_FADE_DURATION = 170;
    const CONTENT_FADE_OUT_DURATION = 90;
    const CONTENT_FADE_IN_DURATION = 140;

    class SettingsPanelController {
        constructor(state) {
            this.state = state;
            this.embeddedRefreshQueued = false;
            this.modalAnimation = null;
            this.contentAnimation = null;
        }

        canAnimate(element) {
            return Boolean(element?.animate && element.getAnimations) &&
                !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        }

        fadeModal(open, wasHidden) {
            const panel = this.state.panel;
            if (!panel) {
                return;
            }
            let opacity = wasHidden ? 0 : 1;
            if (this.modalAnimation && window.getComputedStyle) {
                const current = Number.parseFloat(window.getComputedStyle(panel).opacity);
                if (Number.isFinite(current)) {
                    opacity = current;
                }
            }
            this.modalAnimation?.cancel();
            this.modalAnimation = null;
            panel.hidden = false;
            panel.style.pointerEvents = open ? "" : "none";
            if (!this.canAnimate(panel)) {
                panel.hidden = !open;
                return;
            }
            const animation = panel.animate([
                { opacity }, { opacity: open ? 1 : 0 }
            ], { duration: MODAL_FADE_DURATION, easing: "ease-in-out" });
            this.modalAnimation = animation;
            animation.onfinish = () => {
                if (this.modalAnimation !== animation) {
                    return;
                }
                this.modalAnimation = null;
                panel.hidden = !this.state.open;
            };
        }

        selectFeature(id, persist = false) {
            const ui = this.state;
            if (id !== INSTALL_CATALOG_ID &&
                (!features.has(id) || !canAccess(features.get(id).config))) {
                return;
            }
            if (persist && ui.preferredFeatureId !== id) {
                ui.preferredFeatureId = id;
                GM_setValue(SELECTED_FEATURE_KEY, id);
            }
            if (ui.selectedFeatureId === id) {
                return;
            }
            ui.selectedFeatureId = id;
            const content = document.querySelector("#rsm-v2-settings-content");
            this.contentAnimation?.cancel();
            this.contentAnimation = null;
            if (!ui.open || !this.canAnimate(content)) {
                renderSettingsUI();
                return;
            }
            const animation = content.animate([
                { opacity: 1 }, { opacity: 0 }
            ], { duration: CONTENT_FADE_OUT_DURATION, easing: "ease-in" });
            this.contentAnimation = animation;
            animation.onfinish = () => {
                if (this.contentAnimation !== animation || !ui.open) {
                    return;
                }
                this.contentAnimation = null;
                renderSettingsUI();
                const nextContent = document.querySelector("#rsm-v2-settings-content");
                if (this.canAnimate(nextContent)) {
                    nextContent.animate([
                        { opacity: 0 }, { opacity: 1 }
                    ], { duration: CONTENT_FADE_IN_DURATION, easing: "ease-out" });
                }
            };
        }

        restoreTab() {
            const ui = this.state;
            ui.selectedFeatureId = features.has(ui.preferredFeatureId) &&
                canAccess(features.get(ui.preferredFeatureId).config)
                ? ui.preferredFeatureId : MANAGER_FEATURE_ID;
        }

        setOpen(open) {
            const ui = this.state;
            const next = Boolean(open);
            const wasOpen = ui.open;
            if (next && !ui.open) {
                this.restoreTab();
            }
            ui.open = next;
            if (!next) {
                this.contentAnimation?.cancel();
                this.contentAnimation = null;
            }
            if (next && document.body && (ui.dirty || ui.renderedFeatureId !== ui.selectedFeatureId)) {
                this.render();
            } else if (next && !ui.button) {
                this.queue();
            }
            if (ui.panel && next !== wasOpen) {
                this.fadeModal(next, !wasOpen);
            }
        }

        ensureRoot() {
            const ui = this.state;
            if (!document.querySelector("#rsm-v2-settings-style")) {
                const style = ui.style || document.createElement("style");
                ui.style = style;
                style.id = "rsm-v2-settings-style";
                style.classList.add("darkreader");
                style.textContent = SETTINGS_UI_CSS;
                document.head.appendChild(style);
            }
            if (!ui.button) {
                ui.button = document.createElement("button");
                ui.button.id = "rsm-v2-settings-button";
                ui.button.type = "button";
                ui.button.textContent = "Script settings";
                installButtonPressFeedback(ui.button);
                ui.button.addEventListener("click", () => this.setOpen(!ui.open));
                document.body.appendChild(ui.button);
            }
            if (!ui.panel) {
                const modal = instantiateUI(MODAL_TEMPLATE);
                ui.panel = modal.root;
                ui.panel.hidden = !ui.open;
                ui.panel.addEventListener("click", (event) => {
                    if (event.target === ui.panel) {
                        this.setOpen(false);
                    }
                });
                document.addEventListener("keydown", (event) => {
                    if (event.key === "Escape" && ui.open) {
                        this.setOpen(false);
                    }
                });
                ui.dialog = modal.dialog;
                installButtonPressFeedback(ui.dialog);
                document.body.appendChild(ui.panel);
            }
        }

        render() {
            const ui = this.state;
            if (!document.body) {
                return;
            }
            this.contentAnimation?.cancel();
            this.contentAnimation = null;
            const registeredFeatures = Array.from(features.values()).filter((feature) => canAccess(feature.config));
            ui.dirty = false;
            if (ui.selectedFeatureId !== INSTALL_CATALOG_ID && !registeredFeatures.some((feature) => feature.id === ui.selectedFeatureId)) {
                ui.selectedFeatureId = MANAGER_FEATURE_ID;
            }
            debugLog("ui", "Building settings UI", {
                featureCount: registeredFeatures.length,
                features: registeredFeatures.map((feature) => feature.id)
            });
            if (registeredFeatures.length === 0) {
                ui.button?.remove();
                ui.panel?.remove();
                ui.button = null;
                ui.panel = null;
                ui.dialog = null;
                return;
            }
            this.ensureRoot();
            const previousListScrollTop = document.querySelector("#rsm-v2-settings-script-list")?.scrollTop || 0;
            let previousContentScrollTop = 0;
            const previousPanelScrollTops = new Map();
            if (ui.renderedFeatureId === ui.selectedFeatureId) {
                const previousContent = document.querySelector("#rsm-v2-settings-content");
                previousContentScrollTop = previousContent?.scrollTop || 0;
                for (const body of previousContent?.querySelectorAll(".rsm-v2-panel-limited > .rsm-v2-panel-body") || []) {
                    previousPanelScrollTops.set(body.dataset.rsmPanelScrollKey, body.scrollTop);
                }
            }
            applyManagerAppearance();
            unsubscribeAll(ui.unsubs);
            ui.unsubs = [];
            ui.dialog.replaceChildren();

            const shellParts = instantiateUI(SETTINGS_SHELL_TEMPLATE);
            const { root: shell, content } = shellParts;
            const scriptList = createScriptSidebar(shellParts, registeredFeatures);
            if (ui.selectedFeatureId === INSTALL_CATALOG_ID) {
                renderInstallCatalog(content);
            } else {
                const feature = registeredFeatures.find((item) => item.id === ui.selectedFeatureId);
                if (feature) {
                    renderFeatureSettings(content, feature);
                }
            }
            ui.dialog.appendChild(shell);
            scriptList.scrollTop = previousListScrollTop;
            content.scrollTop = previousContentScrollTop;
            for (const body of content.querySelectorAll(".rsm-v2-panel-limited > .rsm-v2-panel-body")) {
                const scrollTop = previousPanelScrollTops.get(body.dataset.rsmPanelScrollKey);
                if (scrollTop != null) {
                    body.scrollTop = scrollTop;
                }
            }
            ui.renderedFeatureId = ui.selectedFeatureId;
        }

        queueEmbedded() {
            if (this.embeddedRefreshQueued || embeddedMounts.size === 0) {
                return;
            }
            this.embeddedRefreshQueued = true;
            queueMicrotask(() => {
                this.embeddedRefreshQueued = false;
                for (const mount of Array.from(embeddedMounts)) {
                    if (embeddedMounts.has(mount)) {
                        mount.refresh();
                    }
                }
            });
        }

        queue() {
            const ui = this.state;
            this.queueEmbedded();
            ui.dirty = true;
            if (!document.body) {
                if (ui.waitingForBody) {
                    return;
                }
                ui.waitingForBody = true;
                document.addEventListener("DOMContentLoaded", () => {
                    ui.waitingForBody = false;
                    if (ui.dirty) {
                        this.render();
                    }
                }, { once: true });
                return;
            }
            if (!ui.button) {
                this.render();
                return;
            }
            if (!ui.open || ui.renderQueued) {
                return;
            }
            ui.renderQueued = true;
            queueMicrotask(() => {
                ui.renderQueued = false;
                if (ui.open && ui.dirty) {
                    this.render();
                }
            });
        }
    }

    const panelController = new SettingsPanelController(settingsUI);

    function setSettingsOpen(open) {
        return panelController.setOpen(open);
    }

    const MODAL_TEMPLATE = `
        <section id="rsm-v2-settings-panel">
            <div id="rsm-v2-settings-dialog" data-ref="dialog"></div>
        </section>`;

    const SETTINGS_SHELL_TEMPLATE = `
        <div id="rsm-v2-settings-shell">
            <aside id="rsm-v2-settings-sidebar">
                <div id="rsm-v2-settings-sidebar-header">
                    <h3>Scripts</h3>
                    <button type="button" class="rsm-v2-catalog-select" title="Browse scripts to install" data-ref="catalog">+</button>
                </div>
                <div id="rsm-v2-settings-script-list" data-ref="scriptList"></div>
            </aside>
            <main id="rsm-v2-settings-content" data-ref="content"></main>
        </div>`;
    const SCRIPT_ROW_TEMPLATE = `
        <div class="rsm-v2-script-row">
            <button type="button" class="rsm-v2-script-select" data-ref="select"></button>
            <button type="button" class="rsm-v2-script-toggle" data-ref="toggle"></button>
        </div>`;

    function createScriptSidebar(shell, registeredFeatures) {
        const { catalog: catalogButton, scriptList } = shell;
        catalogButton.classList.toggle("rsm-v2-selected", settingsUI.selectedFeatureId === INSTALL_CATALOG_ID);
        catalogButton.addEventListener("click", () => {
            panelController.selectFeature(INSTALL_CATALOG_ID);
        });
        for (const feature of registeredFeatures) {
            const enabled = feature.isEnabled();
            const rowProperties = {
                select: { textContent: feature.name || feature.id },
                toggle: null
            };
            if (feature.id !== MANAGER_FEATURE_ID) {
                let text = "Off";
                let title = "Enable script";
                if (enabled) {
                    text = "On";
                    title = "Disable script";
                }
                rowProperties.toggle = { textContent: text, title };
            }
            const { root: scriptRow, select: scriptButton, toggle: enabledButton } = instantiateUI(SCRIPT_ROW_TEMPLATE, rowProperties);
            scriptButton.classList.toggle("rsm-v2-selected", feature.id === settingsUI.selectedFeatureId);
            scriptButton.addEventListener("click", () => {
                panelController.selectFeature(feature.id, true);
            });
            if (feature.id !== MANAGER_FEATURE_ID) {
                enabledButton.classList.toggle("rsm-v2-toggle-on", enabled);
                enabledButton.addEventListener("click", () => {
                    feature.setEnabled(!feature.isEnabled());
                });
            }
            scriptList.appendChild(scriptRow);
        }
        return scriptList;
    }

    const SETTINGS_HEADER_TEMPLATE = `
        <header>
            <h2 data-ref="title"></h2>
            <p id="rsm-v2-settings-description" data-ref="description"></p>
            <span id="rsm-v2-settings-version" data-ref="version"></span>
        </header>`;

    function createSettingsHeader(titleText, descriptionText, versionText = null) {
        const properties = {
            title: { textContent: titleText },
            description: null,
            version: null
        };
        if (descriptionText) {
            properties.description = { textContent: descriptionText };
        }
        if (versionText) {
            properties.version = { textContent: versionText };
        }
        return instantiateUI(SETTINGS_HEADER_TEMPLATE, properties).root;
    }

    const CATALOG_CARD_TEMPLATE = `
        <section class="rsm-v2-catalog-card">
            <div>
                <h3 data-ref="name"></h3>
                <p data-ref="description"></p>
                <code data-ref="example"></code>
            </div>
            <a class="rsm-v2-catalog-install" target="_blank" rel="noopener noreferrer" data-ref="installLink">Install</a>
            <button type="button" class="rsm-v2-catalog-install" disabled title="Add the real GitHub URL before installing" data-ref="installPlaceholder">Install</button>
        </section>`;

    function createSettingsMessage(message) {
        const element = document.createElement("p");
        element.className = "rsm-v2-label";
        element.textContent = message;
        return element;
    }

    function renderInstallCatalog(content) {
        content.appendChild(createSettingsHeader(
            "Install scripts",
            "Choose a script to open its Tampermonkey installation page."
        ));
        if (INSTALL_CATALOG.length === 0) {
            content.appendChild(createSettingsMessage("No scripts have been added to the install catalog yet."));
            return;
        }

        const list = document.createElement("div");
        list.className = "rsm-v2-catalog-list";
        for (const entry of INSTALL_CATALOG) {
            const properties = {
                name: { textContent: entry.name },
                description: null,
                example: null,
                installLink: null,
                installPlaceholder: null
            };
            if (entry.description) {
                properties.description = { textContent: entry.description };
            }
            if (entry.placeholder) {
                properties.example = { textContent: `Script URL: ${entry.installURL}` };
                properties.installPlaceholder = { disabled: true };
            } else {
                properties.installLink = { href: entry.installURL };
            }
            const { root: card } = instantiateUI(CATALOG_CARD_TEMPLATE, properties);
            list.appendChild(card);
        }
        content.appendChild(list);
    }

    function renderFeatureSettings(content, feature) {
        let versionText;
        if (feature.id === MANAGER_FEATURE_ID) {
            versionText = `Version ${feature.version} · Core`;
        } else {
            const versionNumber = feature.version || "unknown";
            const enabledLabel = feature.isEnabled() ? "Enabled" : "Disabled";
            versionText = `Version ${versionNumber} · ${enabledLabel}`;
        }
        content.appendChild(createSettingsHeader(
            feature.name || feature.id,
            feature.description,
            versionText
        ));

        if (feature.settingsUI || Object.keys(feature.schema).length > 0) {
            const layout = feature.settingsUI || {
                type: "verticalGroup",
                children: Object.entries(feature.schema).filter(([, definition]) => settingTypeFor(definition).autoRender).map(([setting]) => ({ setting }))
            };
            debugLog("ui", "Rendering feature settings UI", {
                featureId: feature.id,
                layout: layout.type || "verticalGroup"
            });
            const result = createSettingsNode(layout, feature, feature.settings);
            if (result.element) {
                result.element.classList.add("rsm-v2-settings-layout-root");
                content.appendChild(result.element);
            }
            settingsUI.unsubs.push(result.dispose);
            return;
        }

        content.appendChild(createSettingsMessage("This script has no configurable settings."));
    }

    function renderSettingsUI() {
        return panelController.render();
    }

    function queueSettingsUI() {
        return panelController.queue();
    }

    function resolveDOMTarget(target) {
        const element = typeof target === "string" ? document.querySelector(target) : target;
        if (!element || typeof element.appendChild !== "function") {
            throw new Error(`DOM target not found: ${String(target)}`);
        }
        return element;
    }

    function fromHTML(html, context = null) {
        if (typeof html !== "string") {
            throw new TypeError("HTML must be a string.");
        }
        if (!html.trim()) {
            return null;
        }

        let fragment;
        if (context) {
            const range = document.createRange();
            range.selectNodeContents(resolveDOMTarget(context));
            fragment = range.createContextualFragment(html.trim());
        } else {
            const template = document.createElement("template");
            template.innerHTML = html.trim();
            fragment = template.content;
        }
        return fragment.childNodes.length === 1 ? fragment.firstChild : fragment;
    }

    function insertHTML(target, html, position = "beforeend") {
        const element = resolveDOMTarget(target);
        const positions = ["beforebegin", "afterbegin", "beforeend", "afterend"];
        if (!positions.includes(position)) {
            throw new TypeError(`Invalid HTML insertion position: ${position}`);
        }
        let parent = element;
        if (position === "beforebegin" || position === "afterend") {
            parent = element.parentNode;
        }
        if (!parent) {
            throw new Error("Cannot insert beside a node without a parent.");
        }

        const parsed = fromHTML(html, parent);
        if (!parsed) {
            return null;
        }
        const inserted = parsed.nodeType === 11 ? Array.from(parsed.childNodes) : [parsed];
        if (position === "beforebegin") {
            parent.insertBefore(parsed, element);
        } else if (position === "afterbegin") {
            parent.insertBefore(parsed, element.firstChild);
        } else if (position === "afterend") {
            parent.insertBefore(parsed, element.nextSibling);
        } else {
            parent.appendChild(parsed);
        }
        if (inserted.length === 1) {
            return inserted[0];
        }
        return inserted;
    }

    function ensureHTML(target, selector, html) {
        const element = resolveDOMTarget(target);
        if (typeof selector !== "string" || !selector) {
            throw new TypeError("A CSS selector is required.");
        }
        const existing = element.querySelector(selector);
        if (existing) {
            return existing;
        }
        const parsed = fromHTML(html, element);
        let match = null;
        if (parsed?.nodeType === 1 && parsed.matches(selector)) {
            match = parsed;
        } else {
            match = parsed?.querySelector?.(selector);
        }
        if (!match) {
            throw new Error(`HTML does not contain the expected selector: ${selector}`);
        }
        element.appendChild(parsed);
        return match;
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[character]);
    }

    const dom = Object.freeze({ fromHTML, insertHTML, ensureHTML, escapeHTML });

    class ScriptManager {
        constructor() {
            this.version = MANAGER_VERSION;
            this.features = features;
            this.bindings = bindings;
            this.dom = dom;
            this.Network = managerNetworkAPI;
            exposeMethods(this, ScriptManager.prototype);
        }

        registerFeature(feature) {
            return featureRegistry.register(feature);
        }

        getFeature(id) {
            return features.get(id) || null;
        }

        bind(binding, runImmediately = true) {
            return featureRegistry.bind(binding, runImmediately);
        }

        start() {
            return lifecycle.start();
        }

        stop() {
            return lifecycle.stop();
        }

        isFeatureEnabled(featureId) {
            return featureRegistry.isEnabled(featureId);
        }

        setFeatureEnabled(featureId, enabled) {
            return featureRegistry.setEnabled(featureId, enabled);
        }

        enableFeature(featureId) {
            return featureRegistry.setEnabled(featureId, true);
        }

        disableFeature(featureId) {
            return featureRegistry.setEnabled(featureId, false);
        }

        isDebugEnabled(category = null) {
            return category ? logger.isEnabled(category) : logger.enabled;
        }

        getDebugCategories() {
            return { ...logger.categories };
        }

        setDebugCategory(category, enabled) {
            return logger.setCategory(category, enabled);
        }

        setDebugCategories(categories = {}) {
            return logger.setCategories(categories);
        }
        setDebug(enabled, category = null) {
            return category ? logger.setCategory(category, enabled) : logger.setEnabled(enabled);
        }

        debug(message, ...details) {
            return logger.log("core", message, ...details);
        }

        debugCategory(category, message, ...details) {
            return logger.log(category, message, ...details);
        }

        refreshSettingsUI() {
            return panelController.queue();
        }

        openSettings() {
            return panelController.setOpen(true);
        }

        closeSettings() {
            return panelController.setOpen(false);
        }

        pageMatches(page) {
            return currentPageMatches(page);
        }

        hashCurrentPage(target = "url") {
            return hashCurrentPage(target);
        }

        getValue(key, fallback = null) {
            return GM_getValue(key, fallback);
        }
        setValue(key, value) {
            GM_setValue(key, value);
            invalidateSettingsKey(key);
        }
        deleteValue(key) {
            GM_deleteValue(key);
            invalidateSettingsKey(key);
        }
        listValues() {
            return GM_listValues();
        }
    }

    const api = new ScriptManager();

    host.RSM = api;
    host.tmScripts = host.tmScripts || api;
    registerManagerFeature();
    window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
        if (managerSettingsApi.get("theme") === "auto") {
            applyManagerAppearance();
        }
    });
    debugLog("core", "Manager ready", { featureCount: features.size });
    host.dispatchEvent(new CustomEvent("rsm-ready", { detail: api }));
    start();
})();
