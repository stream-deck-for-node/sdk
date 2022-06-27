import {
  AppearDisappearEvent,
  ApplicationChangedEvent,
  DeviceConnectionEvent,
  DeviceDisconnectionEvent,
  KeyEvent,
  PluginSettingsChanged,
  PropertyInspectorEvent,
  PropertyInspectorMessagingEvent,
  SettingsChanged,
  TitleParametersDidChangeEvent
} from './events';
import { BaseAction } from '../class-style/BaseAction';

export interface StreamDeckConnector {
  readyState: number;
  load?: () => Promise<BinaryArguments>;

  on(event: string, callback: (...args: any[]) => any): void;

  send(data: any): void;
}

export enum DeviceType {
  StreamDeck,
  StreamDeckMini,
  StreamDeckXL,
  StreamDeckMobile,
  CorsairGKeys,
  StreamDeckPedal
}

export type ActionTarget = 0 | 1 | 2;

export type ActionState = 0 | 1;

export interface BinaryArguments {
  debug: string;
  port: string;
  registerEvent: string;
  pluginUUID: string;
  info: StreamDeckInfo;
}

export interface Device {
  id: string;
  name: string;
  size: {
    rows: number;
    columns: number;
  };
  type: DeviceType;
}

export interface Application {
  font: string;
  language: string;
  platform: string;
  platformVersion: string;
  version: string;
}

export interface Colors {
  buttonMouseOverBackgroundColor: string;
  buttonPressedBackgroundColor: string;
  buttonPressedBorderColor: string;
  buttonPressedTextColor: string;
  highlightColor: string;
}

export interface PluginInfo {
  uuid: string;
  version: string;
}

export interface StreamDeckInfo {
  application: Application;
  colors: Colors;
  devices: Device[];
  plugin: PluginInfo;
  devicePixelRatio: number;
}

export interface IStreamDeck<S = any> {
  uuid?: string;

  info?: StreamDeckInfo;

  settings?: S;

  setSettings(context: string, settings: Record<string, any>): void;

  getSettings<T>(context: string): T;

  setPluginSettings(settings: Partial<S>): void;

  resetPluginSettings(): void;

  allContexts(): Record<string, string[]>;

  contextsOf(action: string): string[];

  openUrl(url: string): void;

  logMessage(message: string): void;

  setTitle(
    context: string,
    title: string,
    options: { target: ActionTarget; state: ActionState }
  ): void;

  setImage(
    context: string,
    image: string,
    options: { target: ActionTarget; state: ActionState; useCache: boolean }
  ): void;

  showAlert(context: string): void;

  showOk(context: string): void;

  setState(context: string, state: ActionState): void;

  switchToProfile(context: string, device: string, profile: string): void;

  sendToPropertyInspector(
    context: string,
    action: string,
    payload: Record<string, any>
  ): void;
}

export interface StreamDeckOptions {
  doubleTapMillis?: number;
  longPressMillis?: number;
  actions?: Record<string, (sd: IStreamDeck) => BaseAction>;
}

export interface IBaseAction<T = any> {
  onAppear?: (_e: AppearDisappearEvent<T>) => void;

  onDisappear?: (_e: AppearDisappearEvent<T>) => void;

  onKeyDown?: (_e: KeyEvent<T>) => void;

  onKeyUp?: (_e: KeyEvent<T>) => void;

  onPeriodicUpdate?: () => void;

  onSettingsChanged?: (_e: SettingsChanged<T>) => void;

  onPluginSettingsChanged?: <S>(_e: PluginSettingsChanged<S>) => void;

  onSingleTap?: (_e: KeyEvent<T>) => void;

  onDoubleTap?: (_e: KeyEvent<T>) => void;

  onLongPress?: (_e: KeyEvent<T>) => void;

  onTitleParametersChanged?: (_e: TitleParametersDidChangeEvent<T>) => void;

  onPropertyInspectorAppear?: (_e: PropertyInspectorEvent) => void;

  onPropertyInspectorDisappear?: (_e: PropertyInspectorEvent) => void;

  onMessageFromPropertyInspector?: (
    _e: PropertyInspectorMessagingEvent
  ) => void;

  onApplicationLaunched?: (_e: ApplicationChangedEvent) => void;

  onApplicationTerminated?: (_e: ApplicationChangedEvent) => void;

  onDeviceConnected?: (_e: DeviceConnectionEvent) => void;

  onDeviceDisconnected?: (_e: DeviceDisconnectionEvent) => void;

  onSystemWakeUp?: () => void;
}

export interface IAction<T = any> extends IBaseAction<T> {
  uuid?: string;

  pluginUUID?: string;

  contexts: Set<string>;
}

export interface AutoRunTimeUnits {
  h?: number;
  m?: number;
  s?: number;
  ms?: number;
}

export interface DeviceGeometry {
  topLeft: [number, number];
  topRight: [number, number];
  bottomLeft: [number, number];
  bottomRight: [number, number];
  // perfect
  center?: [number, number];
  // approximated
  approximatedCenter?: [number, number];
  total: number;
  rows: number;
  columns: number;
}
