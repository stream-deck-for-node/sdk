import WebSocket, { WebSocketServer } from "ws";
import { TextDecoder } from "util";

export const delay = (interval: number) => new Promise(done => setTimeout(done, interval));

export const TEST_PLUGIN_ID = "com.test.mocha";
export const TEST_ACTION_UUID = TEST_PLUGIN_ID + ".test-action";
export const TEST_PLUGIN_UUID = "GHRKSLVNSRIKJS";
export const TEST_ACTION_INSTANCE = "IFSIUYRLCHAE";
export const sentEvents: string[] = [];

const pluginSettings: Record<string, any> = { sampleValue: 10 };

const instancesSettings: Record<string, Record<string, any>> = {
  [TEST_ACTION_INSTANCE]: { instanceValue: 100 }
};

const wss = new WebSocketServer({ port: 9999 });

const send = (data: any) => {
  sentEvents.push(data.event);
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
};

wss.on("connection", ws => {

  ws.on("message", (msg: any) => {

    let message;

    // try to decode ArrayBuffer
    try {
      message = new TextDecoder("utf-8").decode(Buffer.from(msg));
    } catch (e) {
      message = msg;
    }

    const { event, ...eventParams } = JSON.parse(message);

    switch (event) {
      case "registerPlugin":
        send({
          action: TEST_ACTION_UUID,
          context: TEST_ACTION_INSTANCE,
          event: "willAppear",
          payload: {
            settings: instancesSettings[eventParams.context]
          }
        });
        break;
      case "getSettings":
        send({
          action: TEST_ACTION_UUID,
          context: eventParams.context,
          event: "didReceiveSettings",
          payload: {
            settings: instancesSettings[eventParams.context]
          }
        });
        break;
      case "setSettings":
        instancesSettings[eventParams.context] = eventParams.payload;
        break;
      case "getGlobalSettings":
        if (eventParams.context === TEST_PLUGIN_UUID) {
          send({
            event: "didReceiveGlobalSettings",
            payload: {
              settings: pluginSettings
            }
          });
        }
        break;
    }

  });

});

export const emulateSetSettingFromPI = () => {
  send({
    context: TEST_ACTION_INSTANCE,
    action: TEST_ACTION_UUID,
    event: "didReceiveSettings",
    payload: {
      settings: instancesSettings[TEST_ACTION_INSTANCE]
    }
  });
};

const emulateKey = (keyType: string) => {
  send({
    context: TEST_ACTION_INSTANCE,
    action: TEST_ACTION_UUID,
    event: `key${keyType[0].toUpperCase()}${keyType.slice(1)}`
  });
};

export const emulateSingleTap = async () => {
  emulateKey("down");
  await delay(10);
  emulateKey("up");
  await delay(400);
};

export const emulateDoubleTap = async () => {
  emulateKey("down");
  await delay(10);
  emulateKey("up");
  await delay(50);
  emulateKey("down");
  await delay(10);
  emulateKey("up");
  await delay(350);
};

export const emulateLongPress = async () => {
  emulateKey("down");
  await delay(700);
  emulateKey("up");
  await delay(100);
};

export const emulateOnDisappear = async () => {
  send({
    event: "willDisappear",
    context: TEST_ACTION_INSTANCE,
    action: TEST_ACTION_UUID,
    payload: {
      settings: instancesSettings[TEST_ACTION_INSTANCE]
    }
  });
  await delay(150);
};
