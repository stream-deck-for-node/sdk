import { StreamDeck } from "../src";
import { expect } from "chai";
import "./stream-deck-mock";
import { TEST_PLUGIN_ID, TEST_PLUGIN_UUID } from "./stream-deck-mock";
import { tmpdir } from "os";
import { writeFileSync } from "fs";
import { WebSocketServer } from "ws";

process.argv = ["node", "script.js", "-debug", TEST_PLUGIN_ID];

const fileConfig = `${tmpdir()}/${TEST_PLUGIN_ID}.dev.json`;

new WebSocketServer({ port: 62800 });

writeFileSync(fileConfig, JSON.stringify({
  "port": 62800,
  "pluginUUID": TEST_PLUGIN_UUID,
  "registerEvent": "registerPlugin",
  "info": {
    "application": {},
    "colors": {},
    "devicePixelRatio": 1,
    "devices": [],
    "plugin": { "uuid": TEST_PLUGIN_ID, "version": "1.0.0" }
  }
}));

export const sd = new StreamDeck();

describe("Checking development initialization", () => {

  it("Verify plugin UUID and plugin info from WS", () => {
    setTimeout(() => {
      expect(sd.uuid).to.equals(TEST_PLUGIN_UUID);
      expect(sd.info).to.be.not.null;
      expect(sd.info.plugin.uuid).to.equals(TEST_PLUGIN_ID);
    }, 200);
  }).slow("2s");

});
