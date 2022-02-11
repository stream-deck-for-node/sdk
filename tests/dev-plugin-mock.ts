import { TEST_PLUGIN_ID, TEST_PLUGIN_UUID } from "./stream-deck-mock";

import ipc from "node-ipc";

const args = {
  port: 9999,
  registerEvent: "registerPlugin",
  pluginUUID: TEST_PLUGIN_UUID,
  info: { "plugin": { "uuid": TEST_PLUGIN_ID } }
};

ipc.config.id = "debug-plugin:" + TEST_PLUGIN_ID;
ipc.config.retry = 1000;
ipc.config.silent = true;

ipc.serve(() => {
  ipc.server.on("connect", (socket) =>
    ipc.server.emit(socket, "binary-args", args)
  );
});

ipc.server.start();

