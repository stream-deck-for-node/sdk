import WebSocket from 'ws';
import {
  BinaryArguments,
  Device,
  DeviceType,
  DynamicCell,
  DynamicViewInstance,
  IAction,
  IStreamDeck,
  StreamDeckConnector,
  StreamDeckInfo,
  StreamDeckOptions
} from './types/interfaces';
import { AppearDisappearEvent, EVENT_MAPPING, KeyEvent } from './types/events';
import { TextDecoder } from 'util';
import { imageToBase64 } from './util/image-helper';
import { registeredClasses, updatePeriods } from './class-style/decorator';
import commandLineArgs from 'command-line-args';
import { BaseAction } from './class-style/BaseAction';
import { readFileSync } from 'fs';
import { tmpdir } from 'os';
import { DynamicView } from './dynamic-view/DynamicView';
import { Subject, Subscription } from 'rxjs';

export { Action } from './class-style/decorator';
export { BaseAction } from './class-style/BaseAction';
export * from './types/events';

export { geometry } from './device';
export { DynamicView } from './dynamic-view/DynamicView';

export class StreamDeck<S = any> implements IStreamDeck<S> {
  private ws: StreamDeckConnector;
  public actions: Record<string, IAction> = {};

  private readyObserver = new Subject();

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
  private subscriptions: Record<string, Subscription> = {};

  constructor(options: StreamDeckOptions = {}) {
    // fix arguments dash broken :D
    process.argv = process.argv.map((it) =>
      it.startsWith('-') ? `-${it}` : it
    );

    // Get stream deck commandline arguments
    const flags = commandLineArgs([
      { name: 'debug', type: String },
      { name: 'port', type: String },
      { name: 'registerEvent', type: String },
      { name: 'pluginUUID', type: String },
      { name: 'info', type: String }
    ]);

    let args: BinaryArguments = {
      debug: flags.debug,
      port: flags.port,
      info: flags.info ? JSON.parse(flags.info) : undefined,
      pluginUUID: flags.pluginUUID,
      registerEvent: flags.registerEvent
    };

    if (args.debug) {
      const fileConfig = `${tmpdir()}/${args.debug}.dev.json`;
      args = JSON.parse(readFileSync(fileConfig).toString());
    }

    this.init(options, args).then();
  }

  async init(options: StreamDeckOptions = {}, args: BinaryArguments) {
    // assign uuid and plugin info
    this.uuid = args.pluginUUID;
    this.info = args.info;

    // init millis values
    this.doubleTapMillis = options.doubleTapMillis || 300;
    this.longPressMillis = options.longPressMillis || 700;

    this.ws = new WebSocket('ws://127.0.0.1:' + args.port);

    // Listen for the ws connection
    this.ws.on('open', () => {
      this.send({
        event: args.registerEvent,
        uuid: args.pluginUUID
      });
    });

    this.ws.on('close', () => {
      process.exit();
    });

    this.ws.on('error', () => {
      process.exit();
    });

    this.ws.on('message', (msg: any) => this.onMessage.bind(this)(msg));

    // register every annotated class
    for (const [suffix, clazz] of registeredClasses) {
      const uuid = this.register(suffix, new clazz());
      const period = updatePeriods[suffix];
      if (period) {
        setInterval(() => {
          const action = this.actions[uuid];
          action && action.onPeriodicUpdate?.call(action);
        }, period);
      }
    }

    for (const [suffix, action] of Object.entries(options.actions || {})) {
      this.register(suffix, Object.assign({}, action));
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
    delete this.settingsManager[context];
  }

  private checkMultiTap(event: string, eventParams: any) {
    const { context } = eventParams;
    if (!context) return;

    this.pressed[context] = event === 'keyDown';

    // code to identify the long press event
    if (event === 'keyDown') {
      if (this.longPressTimeouts[context]) {
        clearTimeout(this.longPressTimeouts[context]);
      }

      this.latestLongPress[context] = false;

      this.longPressTimeouts[context] = setTimeout(() => {
        if (this.pressed[context]) {
          this.latestLongPress[context] = true;
          this.pressed[context] = false;
          this.redirect('onLongPress', eventParams);
        }
      }, this.longPressMillis);
    }
    // code to identify the single or double tap event
    else {
      const taps = (this.taps[context] = (this.taps[context] || 0) + 1);

      if (this.doublePressTimeouts[context]) {
        clearTimeout(this.doublePressTimeouts[context]);
      }

      this.doublePressTimeouts[context] = setTimeout(() => {
        if (!this.latestLongPress[context]) {
          if (taps == 1) {
            this.latestLongPress[context] = false;
            this.redirect('onSingleTap', eventParams);
          } else if (taps > 1) {
            this.latestLongPress[context] = false;
            this.redirect('onDoubleTap', eventParams);
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
  private notifySettingsChanged(
    context: string,
    action: string,
    settings: any
  ) {
    this.redirect('onSettingsChanged', {
      context,
      action,
      settings
    });
  }

  private onMessage(msg: any) {
    let message;

    // try to decode ArrayBuffer
    try {
      message = new TextDecoder('utf-8').decode(Buffer.from(msg));
    } catch (e) {
      message = msg;
    }

    const { event, ...eventParams } = JSON.parse(message);
    const { action, context } = eventParams;

    let params = eventParams;

    if (event !== 'willDisappear' && action && context) {
      this.actions[action]?.contexts.add(context);
    }

    switch (event) {
      case 'willAppear':
        this.settingsManager[context] = params.payload.settings;
        break;
      case 'willDisappear':
        this.actions[action]?.contexts.delete(context);
        this.cleanup(context);
        break;
      case 'didReceiveGlobalSettings':
        this.pluginSettings = eventParams.payload.settings;

        if (!this.readyObserver.closed) {
          this.readyObserver.next(true);
        }

        params = {
          changedKeys: Object.keys(this.pluginSettings)
        };
        break;
      case 'keyDown':
      case 'keyUp':
        this.checkMultiTap(event, eventParams);
        break;
      case 'didReceiveSettings':
        this.settingsManager[eventParams.context] =
          eventParams.payload.settings;
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
    if (!event || !Object.keys(this.actions).length) return;

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
      Object.values(this.actions).forEach((registered) => {
        const fn = registered?.[method];
        fn?.call(registered, event);
      });
    }
  }

  // get the settings of a tile
  getSettings<S>(context: string): S {
    return this.settingsManager[context];
  }

  // register ready event
  async ready() {
    return new Promise<void>((resolve) => {
      this.readyObserver.subscribe(() => {
        resolve();
        this.readyObserver.complete();
      });
    });
  }

  // register dynamic view action
  registerDynamicView(suffix: string, profile: string) {
    const dynamicView = new DynamicView();
    this.register(
      suffix,
      Object.assign(
        { contexts: new Set<string>() },
        {
          binder: undefined,
          onDisappear: (e: AppearDisappearEvent) => {
            this.subscriptions[e.context]?.unsubscribe();
          },
          onSingleTap: (e: KeyEvent) => {
            dynamicView
              .for(e.device)
              ?.cell(e.payload.coordinates)
              ?.onSingleTap?.();
          },
          onDoubleTap: (e: KeyEvent) => {
            dynamicView
              .for(e.device)
              ?.cell(e.payload.coordinates)
              ?.onDoubleTap?.();
          },
          onLongPress: (e: KeyEvent) => {
            dynamicView
              .for(e.device)
              ?.cell(e.payload.coordinates)
              ?.onLongPress?.();
          },
          onAppear: (e: AppearDisappearEvent) => {
            const onUpdate = (cell: DynamicCell | null) => {
              this.setTitle(e.context, cell?.title ?? '');
              this.setImage(e.context, cell?.image);
            };
            const [value, bind] =
              dynamicView
                .for(e.device)
                ?.subscribe(e.payload.coordinates, onUpdate, e.context) ?? [];

            if (value) {
              this.subscriptions[e.context] = bind;
              onUpdate(value);
            }
          }
        }
      )
    );
    return {
      show: (
        device: Device,
        except: DeviceType[] = []
      ): DynamicViewInstance | undefined => {
        if (except.includes(device.type)) {
          return;
        }
        const instance = dynamicView.bind(device, this);
        this.switchToProfile(this.uuid, device.id, profile);
        return instance;
      },
      storeSettings: (device: string, context: string) => {
        dynamicView.for(device)?.storeSettings(context);
      },
      hide: (device: string) => {
        dynamicView.for(device)?.hide();
      }
    };
  }

  // get all registered actions' tiles
  allContexts() {
    return Object.fromEntries(
      Object.values(this.actions).map((it) => [
        it.uuid,
        Array.from(it.contexts)
      ])
    );
  }

  // get an action's tiles
  contextsOf(action: string) {
    return Array.from(this.actions[action]?.contexts ?? []);
  }

  // register an action using its uuid (suffix)
  register(suffix: string, action: BaseAction): string {
    const uuid = `${this.info.plugin.uuid}.${suffix}`;
    Object.assign(action, {
      uuid,
      pluginUUID: this.uuid,
      contexts: new Set()
    });
    this.actions[uuid] = action;
    this.send({
      event: 'getGlobalSettings',
      context: this.uuid
    });
    return uuid;
  }

  // Events Sent
  // https://developer.elgato.com/documentation/stream-deck/sdk/events-sent/

  logMessage(message: string) {
    this.send({
      event: 'logMessage',
      payload: {
        message
      }
    });
  }

  openUrl(url: string) {
    this.send({
      event: 'openUrl',
      payload: {
        url
      }
    });
  }

  sendToPropertyInspector(
    context: string,
    action: string,
    payload: Record<string, any>
  ) {
    this.send({
      event: 'sendToPropertyInspector',
      action,
      context,
      payload
    });
  }

  resetPluginSettings() {
    this.setPluginSettings({});
  }

  setPluginSettings(settings: Partial<S>) {
    if (!Object.keys(settings).length) {
      // reset global settings
      this.pluginSettings = <any>{};
    } else {
      // update global settings
      Object.assign(this.pluginSettings, settings);
    }

    this.send({
      event: 'setGlobalSettings',
      context: this.uuid,
      payload: this.pluginSettings
    });

    // send the changed keys to every action to prevent useless render
    const event = {
      changedKeys: Object.keys(settings)
    };
    Object.values(this.actions).forEach((registered) =>
      registered?.onPluginSettingsChanged?.call(registered, event)
    );
  }

  setImage(
    context: string,
    image?: string,
    options: { target?: 0 | 1 | 2; state?: 0 | 1; useCache?: boolean } = {}
  ) {
    (async () => {
      if (image && !image.startsWith('data:image/')) {
        image = await imageToBase64(image, options.useCache);
      }

      this.send({
        event: 'setImage',
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
    const action = Object.values(this.actions).find((it) =>
      it.contexts?.has(context)
    )?.uuid;

    this.settingsManager[context] = settings;

    if (action) {
      this.notifySettingsChanged(context, action, settings);
    }
    this.send({
      event: 'setSettings',
      context: context,
      payload: settings
    });
  }

  setState(context: string, state: 0 | 1 = 0) {
    this.send({
      event: 'setState',
      context,
      payload: {
        state
      }
    });
  }

  setTitle(
    context: string,
    title: string,
    options: { target?: 0 | 1 | 2; state?: 0 | 1 } = {}
  ) {
    this.send({
      event: 'setTitle',
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
      event: 'showAlert',
      context
    });
  }

  showOk(context: string) {
    this.send({
      event: 'showOk',
      context
    });
  }

  switchToProfile(context: string, device: string, profile?: string) {
    this.send({
      event: 'switchToProfile',
      context,
      device,
      payload: {
        profile
      }
    });
  }
}
