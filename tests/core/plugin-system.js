const { expect } = require("chai");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

describe("SLA Wizard Plugin system Test Suite", function () {
  this.timeout(15000);

  const configPath = path.join(process.cwd(), "sla-wizard.config.json");
  const pluginsDir = path.join(process.cwd(), "plugins");

  const cleanup = () => {
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
    if (fs.existsSync(pluginsDir)) {
      const files = fs.readdirSync(pluginsDir);
      files.forEach(file => {
        const filePath = path.join(pluginsDir, file);
        // We delete everything in the plugins dir for a clean state
        if (fs.lstatSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
        } else {
            fs.unlinkSync(filePath);
        }
      });
      fs.rmdirSync(pluginsDir);
    }
  };

  beforeEach(cleanup);
  after(cleanup);

  const freshRequire = () => {
    const root = "../../";
    const paths = [
      "./index.js",
      "./src/index.js",
      "./src/plugins.js",
      "./src/generate.js",
      "./src/utils.js",
      "./src/runTest.js",
      "./src/configs.js"
    ];
    paths.forEach(p => {
      try { delete require.cache[require.resolve(path.join(root, p))]; } catch(e) {}
    });
    try { delete require.cache[require.resolve("sla-wizard-plugin-hello")]; } catch(e) {}
    return require("../../index.js");
  };

  describe("1. Local Plugins", function () {
    const localPluginContent = `
      const myLocalFunc = (options) => { console.log("Local function executed with " + options.val); };
      module.exports.myLocalFunc = myLocalFunc;
      module.exports.apply = (program) => {
        program.command('local-cli').action(() => console.log('local-cli-ok'));
      };
    `;

    it("should work via CLI", function () {
      if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);
      fs.writeFileSync(path.join(pluginsDir, "my-local-plugin.js"), localPluginContent);

      const output = execSync("node index.js --help").toString();
      expect(output).to.contain("local-cli");
      
      const runOutput = execSync("node index.js local-cli").toString();
      expect(runOutput).to.contain("local-cli-ok");
    });

    it("should work via Module", function () {
      if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);
      fs.writeFileSync(path.join(pluginsDir, "my-local-plugin.js"), localPluginContent);

      const slaWizard = freshRequire();
      expect(slaWizard).to.have.property("myLocalFunc");

      const originalLog = console.log;
      let logs = [];
      console.log = (msg) => logs.push(msg);
      try {
        slaWizard.myLocalFunc({ val: "test-data" });
        expect(logs.join(' ')).to.contain("Local function executed with test-data");
      } finally {
        console.log = originalLog;
      }
    });

    it("should receive configuration from sla-wizard.config.json", function () {
      if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);
      const confPluginCode = `
        module.exports.apply = (program, ctx, config) => {
          program.command('test-conf').action(() => console.log('conf-' + config.val));
        };
      `;
      fs.writeFileSync(path.join(pluginsDir, "test-conf.js"), confPluginCode);

      const config = {
        plugins: [
          {
            name: "test-conf",
            config: { val: "verified" }
          }
        ]
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const runOutput = execSync("node index.js test-conf").toString();
      expect(runOutput).to.contain("conf-verified");
    });
  });

  describe("2. External Plugins (sla-wizard-plugin-hello)", function () {

    beforeEach(() => {
        const config = { plugins: [{ name: "sla-wizard-plugin-hello", config: { greeting: "ExternalGreetings" } }] };
        fs.writeFileSync(configPath, JSON.stringify(config));
    });

    it("should work via CLI", function () {
      const output = execSync("node index.js --help").toString();
      expect(output).to.contain("hello");
      
      const runOutput = execSync("node index.js hello --name CLIUser").toString();
      expect(runOutput).to.contain("ExternalGreetings, CLIUser! 👋");
    });

    it("should work via Module", function () {
      const slaWizard = freshRequire();
      expect(slaWizard).to.have.property("hello");

      const originalLog = console.log;
      let logs = [];
      console.log = (msg) => logs.push(msg);
      try {
        slaWizard.hello({ name: "ModuleUser" });
        expect(logs.join(' ')).to.contain("ExternalGreetings, ModuleUser! 👋");
      } finally {
        console.log = originalLog;
      }
    });
  });
});
