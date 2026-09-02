// ==UserScript==
// @name         AWH Label (RUBY)
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  try to take over the world!
// @author       You
// @include      /^https:\/\/l.*xw.*tech\/?/
// @include      /^https:\/\/r.*a.*tech\/?/
// @updateURL    https://raw.githubusercontent.com/fxwyex/mobtest-scripts/refs/heads/main/public/AWHLabel.js
// @downloadURL  https://raw.githubusercontent.com/fxwyex/mobtest-scripts/refs/heads/main/public/AWHLabel.js
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant    GM_setValue
// @grant    GM_addValueChangeListener
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM.getValue
// @grant              GM.setValue
// ==/UserScript==

(function() {
    'use strict';

    function _enc(str, key) {
        let out = "";
        for (let i = 0; i < str.length; i++) {
            let hex = (str.charCodeAt(i) ^ (key.charCodeAt(i % key.length))).toString(16);
            if (hex.length < 2) {
                hex = "0" + hex;
            }
            out += hex;
        }
        return out;
    }

    function _dec(str, key) {
        let out = '';
        const bytes = [];
        for (let i = 0; i < str.length; i += 2) {
            bytes.push(parseInt(str.slice(i, i + 2), 16));
        }
        for (let i = 0; i < bytes.length; i++) {
            out += String.fromCharCode(bytes[i] ^ key.charCodeAt(i % key.length));
        }
        return out;
    }

    function offsetBounds(xmlString, amountX, ammountY) {
        let output = ""
        output = xmlString.replace(
            /(<Bounds\b[^>]*\bX=")(-?\d+(?:\.\d+)?)(")/g,
            (_, prefix, x, suffix) => `${prefix}${Number(x) + Number(amountX)}${suffix}`
        )
        output = output.replace(
            /(<Bounds\b[^>]*\bY=")(-?\d+(?:\.\d+)?)(")/g,
            (_, prefix, y, suffix) => `${prefix}${Number(y) + Number(ammountY)}${suffix}`
        )

        return output;
    }
    const sharedVariable = "awh_label_shared_var_key";
    let group
    let _labelOffsetX = 0
    let _labelOffsetY = 0
    GM_addValueChangeListener (
        sharedVariable, (keyName, oldValue, newVal) => {
            let newValue = newVal
            if (location.href.includes("Labels/PrintAWHLabels")){
                if (newValue.msgType == 1) {
                    let date = new Date(newValue.time)
                    console.log("PRINTING LABEL",date.toLocaleDateString(),date.toLocaleTimeString(), (Date.now() - newValue.time) + "MS")

                    setTimeout(function() {
                        let _data = newValue.data
                        _labelOffsetX = newValue.offsetX
                        _labelOffsetY = newValue.offsetY
                        unsafeWindow.Rosie.Backoffice.Web.Sticker.printAWHCustomerLabel(_data)
                    }, newValue.delay);
                    GM_setValue(sharedVariable, {msgType:2});
                }
            }
        }
    );
    if (location.href.includes("ruby")){
        let _G = unsafeWindow.tmScripts;
        let wasAutoFilled = false;

        let printlabel = _G.getValue("var_awh_label_print_toggle", true)
        let labelOffsetY = _G.getValue("var_label_offset_y", 0)
        let labelOffsetX = _G.getValue("var_label_offset_x", 0)
        let labelPrintDelay = _G.getValue("var_label_delay_ms", 250)
        let awhLabelOffsetY = _G.getValue("var_awh_label_offset_y", 0)
        let awhLabelOffsetX = _G.getValue("var_awh_label_offset_x", 0)

        const mainUICreate = function() {
            let _printLabel2Async = unsafeWindow.dymo.label.framework.printLabel2Async
            unsafeWindow.dymo.label.framework.printLabel2Async = (e,t,r,n) => {
                let newXML = offsetBounds(r,labelOffsetX,labelOffsetY)
                if (printlabel == true) {
                    const match = newXML.match(
                        /<BarcodeObject>[\s\S]*?<Text>(.*?)<\/Text>[\s\S]*?<\/BarcodeObject>/
                    );
                    console.log("UUID",match?.[1])
                    GM_setValue(sharedVariable, {msgType:1,time:Date.now(),data:match?.[1],offsetX:awhLabelOffsetX,offsetY:awhLabelOffsetY,delay:labelPrintDelay});
                }
                return _printLabel2Async(e,t,newXML,n)
            }
            group = _G.createSettingsGroup("AWH Label Printer")
            _G.showToast({title: "TamperMonkey",message: "AWH Label Printer (RUBY) Loaded",messageType: "info"})
            _G.createSettingToggleButton(group, "Print AWH Label", "var_awh_label_print_toggle", function() {
                printlabel = _G.getValue("var_awh_label_print_toggle", true)
            }, false)
            _G.createSettingButton(group,"Open AWH Labels Page",function() {
                window.open(_dec("1a011609155557580d0c1a044d0e1d0d15181f410c1202115b29020a17191156361d11191538232d2f0910100e0a",location.hostname.replaceAll(".","")), "_blank");
            })
            _G.createSettingInput(group, "AWH Label Delay", "ms","number", "var_label_delay_ms", function() {
                labelPrintDelay = _G.getValue("var_label_delay_ms", 250)
            })
            _G.createSettingInput(group, "Ruby Label Offset X", "px","number", "var_label_offset_x", function() {
                labelOffsetX = _G.getValue("var_label_offset_x", 0)
            },"display:inline-block; width:25%")
            _G.createSettingInput(group, "Ruby Label Offset Y", "px","number", "var_label_offset_y", function() {
                labelOffsetY = _G.getValue("var_label_offset_y", 0)
            },"display:inline-block; width:25%")
            _G.createSettingInput(group, "AWH Label Offset X", "px","number", "var_awh_label_offset_x", function() {
                awhLabelOffsetX = _G.getValue("var_awh_label_offset_x", 0)
            },"display:inline-block; width:25%")
            _G.createSettingInput(group, "AWH Label Offset Y", "px","number", "var_awh_label_offset_y", function() {
                awhLabelOffsetY = _G.getValue("var_awh_label_offset_y", 0)
            },"display:inline-block; width:25%")
        }
        const menuStatusUpdate = () => {
            _G.updateGroupState(group, "_idAWHLabelUpdateButton")
        }
        _G.bind({onUpdate: menuStatusUpdate, search: "app-root", id: "_idAWHLabelMenuStatus", href: ["*"]})
        _G.bind({onCreate: mainUICreate, search: "app-sidebar", id: "_idAWHLabelCreateMenu", href: ["*"]})
    } else {
        let _printLabel = unsafeWindow.dymo.label.framework.printLabel
        unsafeWindow.dymo.label.framework.printLabel = (e,t,r,n) => {
            let newXML = offsetBounds(r,_labelOffsetX,_labelOffsetY)
            return _printLabel(e,t,newXML,n)
        }
    }

})();
