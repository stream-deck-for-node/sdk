import WebSocket from "ws";
import {
    BinaryArguments,
    IAction,
    IStreamDeck,
    StreamDeckConnector,
    StreamDeckInfo,
    StreamDeckOptions
} from "./types/interfaces";
import { EVENT_MAPPING } from "./types/events";
import { TextDecoder } from "util";
import { imageToBase64 } from "./util/image-helper";
import { registeredClasses } from "./class-style/decorator";
import { MockConnector } from "./util/debug-connector";
import commandLineArgs from "command-line-args";
import { BaseAction } from "./class-style/BaseAction";

export { Action } from "./class-style/decorator";
export { BaseAction } from "./class-style/BaseAction";
export * from "./types/events";

export class StreamDeck<S = any> implements IStreamDeck<S> {

    private ws: StreamDeckConnector;
    public actions: Record<string, IAction> = {};

    // The plugin infos
    public uuid: string;
    public info: StreamDeckInfo;
    private doubleTapMillis: number;
    private longPressMillis: number;
    public pluginSettings: S = <any>{};
    public settingsManager: Record<string, any> = {};

    // group of records to identify specific events
    private taps: Record<string, number> = {};
    private doublePressTimeouts: Record<string, any> = {};
    private longPressTimeouts: Record<string, any> = {};
    private latestLongPress: Record<string, boolean> = {};
    private pressed: Record<string, boolean> = {};

    constructor(options: StreamDeckOptions = {}) {

        // fix arguments dash broken :D
        process.argv = process.argv.map(it => it.startsWith("-") ? `-${it}` : it);

        // Get stream deck commandline arguments
        // Get stream deck commandline arguments
        const flags = commandLineArgs([
            { name: "debug", type: String },
            { name: "port", type: String },
            { name: "registerEvent", type: String },
            { name: "pluginUUID", type: String },
            { name: "info", type: String }
        ]);

        const args: BinaryArguments = {
            debug: flags.debug,
            port: flags.port,
            info: flags.info ? JSON.parse(flags.info) : undefined,
            pluginUUID: flags.pluginUUID,
            registerEvent: flags.registerEvent
        };

        (async () => {

            if (args.debug) {
                // development connector acting as websocket
                this.ws = new MockConnector(args.debug);
                Object.assign(args, await this.ws.load?.() || {});
            }

            this.init(options, args).then();

        })();

    }

    async init(options: StreamDeckOptions = {}, args: BinaryArguments) {

        // assign uuid and plugin info
        this.uuid = args.pluginUUID;
        this.info = args.info;

        // init millis values
        this.doubleTapMillis = options.doubleTapMillis || 300;
        this.longPressMillis = options.longPressMillis || 700;

        if (!args.debug) {
            // Stream Deck WebSocket endpoint
            this.ws = new WebSocket("ws://127.0.0.1:" + args.port);
        }

        // Listen for the ws connection
        this.ws.on("open", () => {
            this.send({
                event: args.registerEvent,
                uuid: args.pluginUUID
            });
        });

        this.ws.on("message", (msg: any) => this.onMessage.bind(this)(msg));

        this.ws.on("close", () => process.exit());

        // register every annotated class
        for (const [suffix, clazz] of registeredClasses) {
            this.register(suffix, new clazz());
        }

        for (const [suffix, action] of Object.entries(options.actions || {})) {
            this.register(
              suffix,
              Object.assign({}, action(this))
            );
        }

    }

    // Wait for the websocket to be "connected"
    private waitForConnection(): Promise<void> {
        return new Promise((res) => {
            let interval: any;
            if (this.ws.readyState === 1) {
                res();
            } else {
                interval = setInterval(() => {
                    if (this.ws.readyState === 1) {
                        res();
                        clearInterval(interval);
                    }
                }, 50);
            }
        });
    }

    private cleanup(context: string) {
        delete this.pressed[context];
        delete this.latestLongPress[context];
        delete this.longPressTimeouts[context];
        delete this.doublePressTimeouts[context];
        delete this.taps[context];
    }

    private checkMultiTap(event: string, eventParams: any) {
        const { context } = eventParams;
        if (!context) return;

        this.pressed[context] = event === "keyDown";

        // code to identify the long press event
        if (event === "keyDown") {

            if (this.longPressTimeouts[context]) {
                clearTimeout(this.longPressTimeouts[context]);
            }

            this.latestLongPress[context] = false;

            this.longPressTimeouts[context] = setTimeout(() => {
                if (this.pressed[context]) {
                    this.latestLongPress[context] = true;
                    this.pressed[context] = false;
                    this.redirect("onLongPress", eventParams);
                }
            }, this.longPressMillis);

        }
        // code to identify the single or double tap event
        else {

            const taps = this.taps[context] = (this.taps[context] || 0) + 1;

            if (this.doublePressTimeouts[context]) {
                clearTimeout(this.doublePressTimeouts[context]);
            }

            this.doublePressTimeouts[context] = setTimeout(() => {

                if (!this.latestLongPress[context]) {

                    if (taps == 1) {
                        this.latestLongPress[context] = false;
                        this.redirect("onSingleTap", eventParams);
                    } else if (taps > 1) {
                        this.latestLongPress[context] = false;
                        this.redirect("onDoubleTap", eventParams);
                    }
                }
                this.taps[context] = 0;
            }, this.doubleTapMillis);
        }

    }

    // Send a json string through the websocket
    private send(msg: Record<string, any>) {
        this.waitForConnection().then(() => {
            this.ws.send(JSON.stringify(msg));
        });
    }

    // Update a specific instance of an action and refresh the settings
    private notifySettingsChanged(context: string, action: string, settings: any) {
        this.settingsManager[context] = settings;
        this.redirect("onSettingsChanged", {
            context,
            action,
            settings
        });
    }

    private onMessage(msg: any) {
        let message;

        // try to decode ArrayBuffer
        try {
            message = new TextDecoder("utf-8").decode(Buffer.from(msg));
        } catch (e) {
            message = msg;
        }

        const { event, ...eventParams } = JSON.parse(message);
        const { action, context } = eventParams;

        let params = eventParams;

        if (event !== "willDisappear" && action && context) {
            this.actions[action].contexts.add(context);
        }

        switch (event) {
            case "willDisappear":
                this.actions[action]?.contexts.delete(context);
                this.cleanup(context);
                break;
            case "didReceiveGlobalSettings":
                this.pluginSettings = eventParams.payload.settings;
                params = {
                    changedKeys: Object.keys(this.pluginSettings)
                };
                break;
            case "keyDown":
            case "keyUp":
                this.checkMultiTap(event, eventParams);
                break;
            case "didReceiveSettings":
                return this.notifySettingsChanged(
                  eventParams.context,
                  eventParams.action,
                  eventParams.payload.settings
                );
        }

        // emit to the internal events system
        this.redirect(event, params);

    }

    private redirect(eventName: string, event: any) {
        // close if no event or no action was registered
        if (!event || !Object.keys(this.actions).length)
            return;

        // find the correct action and method and propagate the event
        const { action } = event;
        const method = EVENT_MAPPING[eventName];
        if (!method) return;

        if (action) {
            const registered = this.actions[action];

            if (registered) {
                const fn = registered?.[method];
                fn?.call(registered, event);
            }
        } else {
            Object.values(this.actions).forEach(registered => {
                const fn = registered?.[method];
                fn?.call(registered, event);
            });
        }
    }

    getSettings<S>(context: string): Promise<S> {
        const checkSettings = (res: (settings: S) => void) => {
            const settings = this.settingsManager[context];
            if (settings) {
                res(settings);
            } else {
                setTimeout(() => checkSettings(res), 25);
            }
        };
        return new Promise((res) => {
            this.send({
                event: "getSettings",
                context
            });
            checkSettings(res);
        });
    }

    allContexts() {
        return Object.fromEntries(
          Object.values(this.actions).map(it => [it.uuid, Array.from(it.contexts)])
        );
    }

    // register an action using its uuid (suffix)
    register(suffix: string, action: BaseAction) {
        const uuid = `${this.info.plugin.uuid}.${suffix}`;
        Object.assign(action, {
            uuid,
            pluginUUID: this.uuid,
            contexts: new Set()
        });
        this.actions[uuid] = action;
        this.send({
            event: "getGlobalSettings",
            context: this.uuid
        });
    }

    // Events Sent
    // https://developer.elgato.com/documentation/stream-deck/sdk/events-sent/

    logMessage(message: string) {
        this.send({
            event: "logMessage",
            payload: {
                message
            }
        });
    }

    openUrl(url: string) {
        this.send({
            event: "openUrl",
            payload: {
                url
            }
        });
    }

    sendToPropertyInspector(context: string, action: string, payload: Record<string, any>) {
        this.send({
            event: "sendToPropertyInspector",
            action,
            context,
            payload
        });
    }

    setPluginSettings(settings: Partial<S>) {

        // update global settings
        Object.assign(this.pluginSettings, settings);

        this.send({
            event: "setGlobalSettings",
            context: this.uuid,
            payload: this.pluginSettings
        });

        // send the changed keys to every action to prevent useless render
        const event = {
            changedKeys: Object.keys(settings)
        };
        Object.values(this.actions).forEach(registered => registered?.onPluginSettingsChanged?.call(registered, event));
    }

    setImage(context: string, image: string, options: { target?: 0 | 1 | 2; state?: 0 | 1 } = {}) {

        (async () => {

            if (!image.startsWith("data:image/")) {
                image = await imageToBase64(image);
            }

            this.send({
                event: "setImage",
                context,
                payload: {
                    image,
                    target: options.target,
                    state: options.state
                }
            });

        })();

    }

    setSettings<G>(context: string, settings: G) {
        const action = Object.values(this.actions).find(it => it.contexts?.has(context))?.uuid;
        if (action) {
            this.notifySettingsChanged(context, action, settings);
        }
        this.send({
            event: "setSettings",
            context: context,
            payload: settings
        });
    }

    setState(context: string, state: 0 | 1 = 0) {
        this.send({
            event: "setState",
            context,
            payload: {
                state
            }
        });
    }

    setTitle(context: string, title: string, options: { target?: 0 | 1 | 2; state?: 0 | 1 } = {}) {
        this.send({
            event: "setTitle",
            context,
            payload: {
                title,
                target: options.target,
                state: options.state
            }
        });
    }

    showAlert(context: string) {
        this.send({
            event: "showAlert",
            context
        });
    }

    showOk(context: string) {
        this.send({
            event: "showOk",
            context
        });
    }

    switchToProfile(context: string, device: string, profile: string) {
        this.send({
            event: "switchToProfile",
            context,
            device,
            payload: {
                profile
            }
        });
    }

}
