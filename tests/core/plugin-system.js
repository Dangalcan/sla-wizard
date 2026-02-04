const { expect } = require("chai");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const slaWizard = require("../../index.js");


describe("SLA Wizard Plugin system Test Suite", function () {
  this.timeout(15000);

  describe("1. TODO", function () {
    it("TODO", function () {
      expect(true).to.be.true;
    });
  });

});