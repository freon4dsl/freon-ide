"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This project creates a new Freon project for a language selected by the user.
 * This is done through the command: `npm create freon`
 */
var fs = require("node:fs");
var packageFile = fs.readFileSync("./package.json").toString();
var packageJson = JSON.parse(packageFile);
var version = packageJson["version"];
var parts = version.split(".");
var patchNumber = Number(parts[2]);
var newPatch = patchNumber + 1;
parts[2] = "" + newPatch;
var newVersion = parts[0] + "." + parts[1] + "." + parts[2];
packageJson["version"] = newVersion;
var install = packageJson["scripts"]["install:freon"];
var installParts = install.split(".");
var installPatchNumber = Number(installParts[2]);
var newInstallPatchNumber = installPatchNumber + 1;
installParts[2] = "" + newInstallPatchNumber;
var newInstall = installParts[0] + "." + installParts[1] + "." + installParts[2] + "." + installParts[3];
packageJson["scripts"]["install:freon"] = newInstall;
console.log("Version from ".concat(version, " => ").concat(newVersion));
console.log("Install from ".concat(install, " => ").concat(newInstall));
fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 4));
