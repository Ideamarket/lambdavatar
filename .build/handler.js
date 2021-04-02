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
exports.substack = exports.twitter = void 0;
var axios_1 = require("axios");
var aws_sdk_1 = require("aws-sdk");
var sharp = require("sharp");
var cheerio = require('cheerio');
exports.twitter = function (event, context, callback) { return __awaiter(void 0, void 0, void 0, function () {
    var s3, s3Image, object, err_1, params, headers, res, profileUrl, imageData, dataUrl, s3Params, putRes, response;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                s3 = new aws_sdk_1.S3({
                    s3ForcePathStyle: true,
                    endpoint: new aws_sdk_1.Endpoint('http://localhost:8000'),
                    accessKeyId: 'S3RVER',
                    secretAccessKey: 'S3RVER',
                });
                if (!((_a = event === null || event === void 0 ? void 0 : event.pathParameters) === null || _a === void 0 ? void 0 : _a.id)) {
                    return [2 /*return*/, ({ statusCode: 400, statusText: 'No id provided' })];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, s3.getObject({ Bucket: 'local-bucket', Key: "twitter/" + event.pathParameters.id }).promise()];
            case 2:
                s3Image = _c.sent();
                object = JSON.parse((_b = s3Image === null || s3Image === void 0 ? void 0 : s3Image.Body) === null || _b === void 0 ? void 0 : _b.toString('utf-8'));
                console.log('been this long', Date.now() - parseInt(object.lastUpdated));
                if ((object === null || object === void 0 ? void 0 : object.lastUpdated) && (Date.now() - parseInt(object.lastUpdated)) < parseInt(process.env.checkByDate)) {
                    console.log('grabbing from S3');
                    if (object === null || object === void 0 ? void 0 : object.url) {
                        return [2 /*return*/, {
                                statusCode: 200,
                                body: JSON.stringify({
                                    image: object.url
                                }, null, 2),
                            }];
                    }
                }
                return [3 /*break*/, 4];
            case 3:
                err_1 = _c.sent();
                console.log(err_1);
                return [3 /*break*/, 4];
            case 4:
                params = {
                    usernames: event.pathParameters.id,
                    "user.fields": "profile_image_url"
                };
                headers = {
                    "authorization": "BEARER " + process.env.TWITTER_BEARER_TOKEN
                };
                return [4 /*yield*/, axios_1.default.get('https://api.twitter.com/2/users/by', { params: params, headers: headers })];
            case 5:
                res = _c.sent();
                profileUrl = res.data.data[0].profile_image_url;
                return [4 /*yield*/, axios_1.default.get(profileUrl, { responseType: 'arraybuffer' })];
            case 6:
                res = _c.sent();
                imageData = Buffer.from(res.data);
                dataUrl = smallerImage(imageData);
                s3Params = {
                    Bucket: 'local-bucket',
                    Key: "twitter/" + event.pathParameters.id,
                    Body: JSON.stringify({
                        url: dataUrl,
                        lastUpdated: Date.now()
                    }),
                    ContentType: 'application/json'
                };
                putRes = s3.putObject(s3Params).promise();
                console.log(putRes);
                response = {
                    statusCode: 200,
                    body: JSON.stringify({
                        image: dataUrl
                    }, null, 2),
                };
                return [2 /*return*/, response];
        }
    });
}); };
exports.substack = function (event, context, callback) { return __awaiter(void 0, void 0, void 0, function () {
    var s3, s3Image, object, err_2, res, $, profileUrl, dataUrl, s3Params, putRes, response;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                s3 = new aws_sdk_1.S3({
                    s3ForcePathStyle: true,
                    endpoint: new aws_sdk_1.Endpoint('http://localhost:8000'),
                    accessKeyId: 'S3RVER',
                    secretAccessKey: 'S3RVER',
                });
                if (!((_a = event === null || event === void 0 ? void 0 : event.pathParameters) === null || _a === void 0 ? void 0 : _a.id)) {
                    return [2 /*return*/, ({ statusCode: 400, statusText: 'No id provided' })];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, s3.getObject({ Bucket: 'local-bucket', Key: "substack/" + event.pathParameters.id }).promise()];
            case 2:
                s3Image = _c.sent();
                object = JSON.parse((_b = s3Image === null || s3Image === void 0 ? void 0 : s3Image.Body) === null || _b === void 0 ? void 0 : _b.toString('utf-8'));
                if ((object === null || object === void 0 ? void 0 : object.lastUpdated) && (Date.now() - parseInt(object.lastUpdated)) < parseInt(process.env.checkByDate)) {
                    console.log('grabbing from S3');
                    if (object === null || object === void 0 ? void 0 : object.url) {
                        return [2 /*return*/, {
                                statusCode: 200,
                                body: JSON.stringify({
                                    image: object.url
                                }, null, 2),
                            }];
                    }
                }
                return [3 /*break*/, 4];
            case 3:
                err_2 = _c.sent();
                console.log(err_2);
                return [3 /*break*/, 4];
            case 4: return [4 /*yield*/, axios_1.default.get("https://" + event.pathParameters.id + ".substack.com")];
            case 5:
                res = _c.sent();
                $ = cheerio.load(res.data);
                profileUrl = $('link[rel=apple-touch-icon][sizes=120x120]').attr('href');
                return [4 /*yield*/, axios_1.default.get(profileUrl, { responseType: 'arraybuffer' })];
            case 6:
                res = _c.sent();
                return [4 /*yield*/, smallerImage(Buffer.from(res.data))];
            case 7:
                dataUrl = _c.sent();
                s3Params = {
                    Bucket: 'local-bucket',
                    Key: "substack/" + event.pathParameters.id,
                    Body: JSON.stringify({
                        url: dataUrl,
                        lastUpdated: Date.now()
                    }),
                    ContentType: 'application/json'
                };
                putRes = s3.putObject(s3Params).promise();
                console.log(putRes);
                response = {
                    statusCode: 200,
                    body: JSON.stringify({
                        image: dataUrl,
                    }, null, 2),
                };
                return [2 /*return*/, response];
        }
    });
}); };
var smallerImage = function (imageData) { return __awaiter(void 0, void 0, void 0, function () {
    var smallImage, dataUrl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, sharp(imageData).resize({ width: parseInt(process.env.imageWidth) }).png().toBuffer()];
            case 1:
                smallImage = _a.sent();
                dataUrl = "data:image/png;base64," + smallImage.toString('base64');
                return [2 /*return*/, dataUrl];
        }
    });
}); };
//# sourceMappingURL=handler.js.map