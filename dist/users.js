"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDatabase = void 0;
const yaml = __importStar(require("js-yaml"));
const fs = __importStar(require("fs"));
class UserDatabase {
    constructor() {
        this.users = [];
    }
    load(yamlFilePath) {
        let yamlStr = fs.readFileSync(yamlFilePath, 'utf8');
        this.users = yaml.load(yamlStr);
    }
    searchBySlackUid(uid) {
        let user = this.users.find(u => u.slack_userid === uid);
        if (user) {
            return user;
        }
        else {
            console.log(`User not found: ${uid}`);
            return undefined;
        }
    }
}
exports.UserDatabase = UserDatabase;
