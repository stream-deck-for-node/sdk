import { StreamDeck } from "../src";
import chai, { expect } from "chai";
import "./stream-deck-mock";
import "./test-action-mock";
import {
  delay,
  emulateDoubleTap,
  emulateLongPress,
  emulateOnDisappear,
  emulateSetSettingFromPI,
  emulateSingleTap,
  sentEvents,
  TEST_ACTION_INSTANCE,
  TEST_PLUGIN_ID,
  TEST_PLUGIN_UUID
} from "./stream-deck-mock";
import { TestActionMock } from "./test-action-mock";
import spies from "chai-spies";

chai.use(spies);

process.argv = ["node", "script.js",
  "-port", "9999",
  "-registerEvent", "registerPlugin",
  "-pluginUUID", TEST_PLUGIN_UUID,
  "-info", `{"plugin": {"uuid": "${TEST_PLUGIN_ID}"}}`
];

export const sd = new StreamDeck();

describe("Checking initialization", () => {

  it("UUID and plugin info", () => {
    expect(sd.uuid).to.equals(TEST_PLUGIN_UUID);
    expect(sd.info).to.be.not.null;
    expect(sd.info.plugin.uuid).to.equals(TEST_PLUGIN_ID);
  });

  it("Action registration", () => {
    expect(Object.keys(sd.actions)).to.contain("com.test.mocha.test-action");
    expect(Object.keys(sd.actions)).to.length(1);
  });

});

// SPIES
const action = Object.values(sd.actions)[0] as TestActionMock;
chai.spy.on(action, "onPluginSettingsChanged");
chai.spy.on(action, "onSettingsChanged");
chai.spy.on(action, "onAppear");
chai.spy.on(action, "onDisappear");
chai.spy.on(action, "onSingleTap");
chai.spy.on(action, "onDoubleTap");
chai.spy.on(action, "onLongPress");

chai.spy.on(sd, "setTitle");
chai.spy.on(sd, "setImage");
chai.spy.on(sd, "setState");
chai.spy.on(sd, "showAlert");
chai.spy.on(sd, "showOk");
chai.spy.on(sd, "logMessage");
chai.spy.on(sd, "switchToProfile");
chai.spy.on(sd, "openUrl");
chai.spy.on(sd, "sendToPropertyInspector");

describe("Plugin Settings", () => {

  it("Obtain initial plugin settings", (done) => {
    const interval = setInterval(() => {
      if (!sentEvents.includes("didReceiveGlobalSettings")) return;
      clearInterval(interval);
      expect(Object.keys(sd.pluginSettings)).to.length(1);
      expect(sd.pluginSettings.sampleValue).to.equals(10);
      done();
    }, 25);
  }).slow("1s");

  it("Update plugin settings", () => {
    sd.setPluginSettings({ sampleValue: 11 });
    expect(sd.pluginSettings.sampleValue).to.equals(11);
  });

  it("Notify actions that the plugin settings changed", () => {
    expect(action.onPluginSettingsChanged).to.have.been.called();
  });

});


describe("Instance Settings", () => {

  it("Emulate a settings change from Property Inspector", async () => {
    emulateSetSettingFromPI();
    await delay(100);
    expect(action.onSettingsChanged).to.have.been.called();
  }).slow("1s");

  it("Verify and change the settings values", async () => {
    const instanceSettings: any = await sd.getSettings(TEST_ACTION_INSTANCE);
    expect(instanceSettings.instanceValue).to.equals(100);
  });

  it("Change the instance settings", async () => {
    sd.setSettings(TEST_ACTION_INSTANCE, { instanceValue: 101 });
    expect(action.onSettingsChanged).to.have.been.called.min(2);
    const instanceSettings: any = await sd.getSettings(TEST_ACTION_INSTANCE);
    expect(instanceSettings.instanceValue).to.equals(101);
  });

  it("Verify the allContexts method", async () => {
    const contexts = sd.allContexts();
    expect(Object.keys(contexts)).to.have.length(1);
  });

});

describe("Actions", () => {

  it("setImage called by onAppear", async () => {
    expect(sd.setImage).to.have.been.called();
  });

  it("setState called by onAppear", async () => {
    expect(sd.setState).to.have.been.called();
  });

  it("showOk called by onAppear", async () => {
    expect(sd.showOk).to.have.been.called();
  });

  it("showAlert called by onAppear", async () => {
    expect(sd.showAlert).to.have.been.called();
  });

  it("logMessage called by onAppear", async () => {
    expect(sd.logMessage).to.have.been.called();
  });

  it("switchToProfile called by onAppear", async () => {
    expect(sd.switchToProfile).to.have.been.called();
  });

  it("openUrl called by onAppear", async () => {
    expect(sd.openUrl).to.have.been.called();
  });

  it("sendToPropertyInspector called by onAppear", async () => {
    expect(sd.sendToPropertyInspector).to.have.been.called();
  });

});

describe("Taps", () => {

  it("Verify the single tap event", async () => {
    await emulateSingleTap();
    expect(action.onSingleTap).to.have.been.called();
  }).slow("1s");

  it("Verify the double tap event", async () => {
    await emulateDoubleTap();
    expect(action.onDoubleTap).to.have.been.called();
  }).slow("1s");

  it("Verify the long press event", async () => {
    await emulateLongPress();
    expect(action.onLongPress).to.have.been.called();
  }).slow("2s");

});

describe("Events", () => {

  it("Verify that the onAppear was called", async () => {
    expect(action.onAppear).to.have.been.called();
  });

  it("Verify that the OnDisappear was called", async () => {
    await emulateOnDisappear();
    expect(action.onDisappear).to.have.been.called();
  }).slow('1s');

});
