import {
  Device,
  DeviceGeometry,
  DynamicCell,
  DynamicViewMatrix
} from '../types/interfaces';
import { geometry } from '../device';
import { BehaviorSubject, Subscription } from 'rxjs';
import { EventCoordinates } from '../types/events';
import { StreamDeck } from '../index';

export class DynamicViewInstance {
  public view: DynamicViewMatrix = [];
  public geometry: DeviceGeometry;
  public page = 0;

  public settings = {};

  setSettings(context: string, settings: any) {
    this.settings[context] = settings;
  }

  storeSettings(context: string) {
    const settings = this.settings[context];
    if (settings) {
      this.sd.setSettings(context, settings);
      delete this.settings[context];
    }
  }

  nextPage(maxPages: number) {
    if (maxPages > this.page + 1) {
      this.page++;
      return true;
    }
    return false;
  }

  prevPage(alternative?: () => void) {
    if (this.page > 0) {
      this.page--;
      return true;
    } else if (alternative) {
      alternative();
      return false;
    } else {
      this.hide();
      return false;
    }
  }

  constructor(private device: Device, private sd: StreamDeck) {
    this.geometry = geometry(device.type);
    this.view = Array.from(new Array(this.geometry.total)).map(
      () => new BehaviorSubject(null)
    );
  }

  update(index: number, cell: DynamicCell) {
    if (cell.source) {
      cell.source.index = index;
    }
    this.view[index].next(cell);
  }

  clear() {
    this.view.forEach((it) => it.next({}));
  }

  hide() {
    this.sd.switchToProfile(this.sd.uuid, this.device.id);
  }

  index(coords: EventCoordinates) {
    const { columns = 0 } = this.geometry || {};
    return coords.column + coords.row * columns;
  }

  cell(coords: EventCoordinates): DynamicCell | null {
    const { columns = 0 } = this.geometry || {};
    return this.view[coords.column + coords.row * columns].getValue();
  }

  subscribe(
    coords: EventCoordinates,
    subscriber: (value: DynamicCell) => void,
    context: string
  ): [DynamicCell | null, Subscription] {
    const i = this.index(coords);
    const subscribeBind = this.view[i].subscribe(subscriber);

    // save temporary settings
    const settings = this.settings[context];
    if (settings) {
      this.sd.setSettings(context, settings);
      delete this.settings[context];
    }

    return [this.view[i].getValue(), subscribeBind];
  }

  unsubscribe(coords: EventCoordinates) {
    const i = this.index(coords);
    this.view?.[i].unsubscribe();
  }
}

export class DynamicView {
  instances: Record<string, DynamicViewInstance> = {};

  bind(device: Device, sd: StreamDeck): DynamicViewInstance {
    if (!this.instances[device.id]) {
      this.instances[device.id] = new DynamicViewInstance(device, sd);
    }
    return this.instances[device.id];
  }

  for(device: string) {
    return this.instances[device];
  }
}
