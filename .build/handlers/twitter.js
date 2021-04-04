"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var aws_sdk_1 = require("aws-sdk");
var helpers_1 = require("../helpers/helpers");
var twitter = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var s3, imageUrl, params, headers, res, profileUrl, s3Url, response;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                s3 = process.env.IS_OFFLINE ? new aws_sdk_1.S3({
                    s3ForcePathStyle: true,
                    endpoint: new aws_sdk_1.Endpoint(process.env.s3Endpoint),
                    accessKeyId: process.env.s3AccessKey,
                    secretAccessKey: process.env.s3SecretAccessKey,
                }) :
                    new aws_sdk_1.S3();
                if (!((_a = event === null || event === void 0 ? void 0 : event.pathParameters) === null || _a === void 0 ? void 0 : _a.id)) {
                    return [2 /*return*/, ({ statusCode: 400, statusText: 'No id provided' })];
                }
                return [4 /*yield*/, helpers_1.getUrlFromS3(s3, "twitter/" + event.pathParameters.id)];
            case 1:
                imageUrl = _d.sent();
                if (imageUrl) {
                    return [2 /*return*/, imageUrl];
                }
                params = {
                    usernames: event.pathParameters.id,
                    "user.fields": "profile_image_url"
                };
                headers = {
                    "authorization": "BEARER " + process.env.twitterBearerToken
                };
                return [4 /*yield*/, axios_1.default.get('https://api.twitter.com/2/users/by', { params: params, headers: headers })];
            case 2:
                res = _d.sent();
                if (((_c = (_b = res.data) === null || _b === void 0 ? void 0 : _b.errors) === null || _c === void 0 ? void 0 : _c.length) > 0) {
                    return [2 /*return*/, ({ statusCode: 400, statusText: res.data.errors[0].details })];
                }
                profileUrl = res.data.data[0].profile_image_url;
                return [4 /*yield*/, helpers_1.putImageOnS3(s3, "twitter/" + event.pathParameters.id, profileUrl)];
            case 3:
                s3Url = _d.sent();
                response = {
                    statusCode: 200,
                    body: s3Url,
                };
                return [2 /*return*/, response];
        }
    });
}); };
exports.default = twitter;
//# sourceMappingURL=twitter.js.map