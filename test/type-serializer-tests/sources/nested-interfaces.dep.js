"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../../../src");
var MyApi = /** @class */ (function () {
    function MyApi() {
    }
    /**
     * Tests a request body with an interface
     * @param body The request body
     * @returns The string 'response'
     */
    MyApi.prototype.greet = function (body) {
        return 'reponse';
    };
    __decorate([
        src_1.ApiGetMethod('/helloDep'),
        __param(0, src_1.ApiBodyParam({ name: "body", typedef: { type: "object", schema: { $ref: "#/definitions/IRequestBody_1", definitions: { IRequestBody: { type: "object", properties: { version: { type: "string" }, params: { $ref: "#/definitions/IBodyParams" } }, required: ["params", "version"] }, IBodyParams: { type: "object", properties: { params: { type: "array", items: { type: "string" } }, source: { type: "string", enum: ["a"] } }, required: ["params", "source"] }, IRequestBody_1: { type: "object", properties: { version: { type: "string" }, params: { $ref: "#/definitions/IBodyParams_1" }, params2: { $ref: "#/definitions/IBodyParams" } }, required: ["params", "params2", "version"] }, IBodyParams_1: { type: "object", properties: { params: { type: "array", items: { type: "string" } }, source: { type: "string", enum: ["b"] } }, required: ["params", "source"] } }, $schema: "http://json-schema.org/draft-07/schema#" }, typename: "IRequestBody", uniqueTypename: "IRequestBody.01aca104" }, description: "The request body" }))
    ], MyApi.prototype, "greet", null);
    MyApi = __decorate([
        src_1.Api
    ], MyApi);
    return MyApi;
}());
exports.default = MyApi;
