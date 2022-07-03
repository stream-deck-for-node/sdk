import {
  AppearDisappearEvent,
  ApplicationChangedEvent,
  DeviceConnectionEvent,
  DeviceDisconnectionEvent,
  EventCoordinates,
  KeyEvent,
  PluginSettingsChanged,
  PropertyInspectorEvent,
  PropertyInspectorMessagingEvent,
  SettingsChanged,
  TitleParametersDidChangeEvent
} from './events';
import { BaseAction } from '../class-style/BaseAction';
import Rx, { Subscription } from 'rxjs';

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
  StreamDeckMobile
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

  ready: () => Promise<void>;

  setSettings(context: string, settings: Record<string, any>): void;

  getSettings<T>(context: string): T;

  setPluginSettings(settings: Partial<S>): void;

  resetPluginSettings(): void;

  allContexts(): Record<string, string[]>;

  contextsOf(action: string): string[];

  registerDynamicView(
    suffix: string,
    profile: string
  ): {
    show: (device: Device) => void;
    hide: (device: string) => void;
    storeSettings: (device: string, context: string) => void;
  };

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
  actions?: Record<string, BaseAction>;
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

export interface DeviceGeometryPositions {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
  center?: number; // perfect
  approximatedCenter?: number; // approximated
  total: number;
  rows: number;
  columns: number;
}

export interface DeviceGeometry extends DeviceGeometryPositions {
  mappable: (
    ...except: Exclude<
      keyof DeviceGeometryPositions,
      'total' | 'rows' | 'columns'
    >[]
  ) => [number[], number];
}

export interface DynamicCell {
  source?: any;
  title?: string;
  image?: string;
  onSingleTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  data?: Record<string, any>;
}

export interface DynamicViewInstance {
  settings: Record<string, any>;
  view: DynamicViewMatrix;
  geometry: DeviceGeometry;
  page: number;
  nextPage: (maxPages: number) => boolean;
  prevPage: (alternative?: () => void) => boolean;
  clear: () => void;
  hide: () => void;
  update: (index: number, cell: DynamicCell) => void;
  cell: (coords: EventCoordinates) => DynamicCell | null;
  setSettings: (context: string, settings: any) => void;
  storeSettings: (context: string) => void;
  subscribe: (
    coords: EventCoordinates,
    subscriber: (value: DynamicCell) => void,
    context: string
  ) => [DynamicCell | null, Subscription];
  unsubscribe: (coords: EventCoordinates) => void;
}

// Single Index Matrix
export type DynamicViewMatrix = Rx.BehaviorSubject<DynamicCell | null>[];
