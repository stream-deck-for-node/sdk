import "./dev-plugin-mock";
import { StreamDeck } from "../src";
import { expect } from "chai";
import "./stream-deck-mock";
import { TEST_PLUGIN_ID, TEST_PLUGIN_UUID } from "./stream-deck-mock";

process.argv = ["node", "script.js", "-debug", TEST_PLUGIN_ID];

export const sd = new StreamDeck();

describe("Checking development initialization", () => {

  it("Verify plugin UUID and plugin info from IPC", () => {
    setTimeout(() => {
      expect(sd.uuid).to.equals(TEST_PLUGIN_UUID);
      expect(sd.info).to.be.not.null;
      expect(sd.info.plugin.uuid).to.equals(TEST_PLUGIN_ID);
    }, 200);
  }).slow("2s");

});
