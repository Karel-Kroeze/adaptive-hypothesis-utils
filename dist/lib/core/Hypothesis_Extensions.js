"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getText(hypothesis) {
    return hypothesis.elements.map(element => element.text).join(" ").trim().toLowerCase();
}
exports.getText = getText;
