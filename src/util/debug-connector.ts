import ipc from "node-ipc";
import { BinaryArguments } from "../types/interfaces";

ipc.config.id = "debugged-plugin";
ipc.config.retry = 1000;
ipc.config.silent = true;

// This class connect the plugin script to the Stream Deck application through IPC
export class MockConnector {

    readyState = 1;

    connection: any;

    readonly id: string;

    constructor(uuid: string) {
        this.id = "debug-plugin:" + uuid;
    }

    load(): Promise<BinaryArguments> {
        return new Promise((res) => {
            ipc.connectTo(this.id, () => {
                  this.connection = ipc.of[this.id];
                  this.connection.on("binary-args", (data: any) => {
                      res(data);
                  });
              }
            );
        });
    }

    send(value: any) {
        this.connection.emit("message", value);
    }

    on(event: string, callback: (...args: any[]) => any) {
        if (event === "open") {
            return this.connection && callback();
        }
        this.connection.on(event, (data: any) => {
            callback(data);
        });
    }

}
