export interface EventCoordinates {
  column: number;
  row: number;
}

export interface SettingsChanged<T = any> {
  context: string;
  action: string;
  settings: T;
}

export interface KeyEvent<T = any> {
  action: string;
  context: string;
  device: string;
  payload: {
    settings: T;
    coordinates: EventCoordinates;
    state: 0 | 1;
    userDesiredState: 0 | 1;
    isInMultiAction: boolean;
  };
}

export interface AppearDisappearEvent<T = any> {
  action: string;
  context: string;
  device: string;
  payload: {
    settings: T;
    coordinates: EventCoordinates;
    state: 0 | 1;
    isInMultiAction: boolean;
  };
}

export interface TitleParametersDidChangeEvent<T = any> {
  action: string;
  context: string;
  device: string;
  payload: {
    settings: T;
    coordinates: EventCoordinates;
    state: 0 | 1;
    title: string;
    titleParameters: {
      fontFamily: string;
      fontSize: number;
      fontStyle: string;
      fontUnderline: boolean;
      showTitle: boolean;
      titleAlignment: 'top' | 'bottom' | 'middle';
      titleColor: string;
    };
  };
}

export interface DeviceConnectionEvent {
  device: string;
  deviceInfo: {
    name: string;
    type: 0 | 1 | 2 | 3 | 4;
    size: {
      rows: number;
      columns: number;
    };
  };
}

export interface DeviceDisconnectionEvent {
  device: string;
}

export interface ApplicationChangedEvent {
  payload: {
    application: string;
  };
}

export interface PropertyInspectorEvent {
  action: string;
  context: string;
  device: string;
}

export interface PropertyInspectorMessagingEvent {
  action: string;
  context: string;
  device: string;
  payload: Record<string, any>;
}

export interface PluginSettingsChanged<S = any> {
  changedKeys: Array<keyof S>;
}

export const EVENT_MAPPING = {
  keyDown: 'onKeyDown',
  keyUp: 'onKeyUp',
  sendToPlugin: 'onMessageFromPropertyInspector',
  propertyInspectorDidDisappear: 'onPropertyInspectorAppear',
  willAppear: 'onAppear',
  willDisappear: 'onDisappear',
  onSingleTap: 'onSingleTap',
  onDoubleTap: 'onDoubleTap',
  onLongPress: 'onLongPress',
  onPropertyInspectorAppear: 'onPropertyInspectorAppear',
  onSettingsChanged: 'onSettingsChanged',
  didReceiveGlobalSettings: 'onPluginSettingsChanged',
  titleParametersDidChange: 'onTitleParametersChanged'
};
