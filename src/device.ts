import { DeviceGeometry, DeviceType } from './types/interfaces';

const BaseStreamDeck: DeviceGeometry = {
  topLeft: [0, 0],
  topRight: [0, 4],
  bottomLeft: [2, 0],
  bottomRight: [2, 4],
  center: [1, 2],
  total: 3 * 5,
  rows: 3,
  columns: 5
};

const positionsIndex: Record<DeviceType, DeviceGeometry | undefined> = {
  [DeviceType.StreamDeck]: BaseStreamDeck,
  [DeviceType.StreamDeckMini]: {
    topLeft: [0, 0],
    topRight: [0, 2],
    bottomLeft: [1, 0],
    bottomRight: [1, 2],
    approximatedCenter: [0, 1],
    total: 2 * 3,
    rows: 2,
    columns: 3
  },
  [DeviceType.StreamDeckXL]: {
    topLeft: [0, 0],
    topRight: [0, 7],
    bottomLeft: [4, 0],
    bottomRight: [4, 7],
    approximatedCenter: [2, 3],
    total: 4 * 8,
    rows: 4,
    columns: 8
  },
  [DeviceType.StreamDeckMobile]: BaseStreamDeck,
  [DeviceType.StreamDeckPedal]: undefined,
  [DeviceType.CorsairGKeys]: undefined
};

export const geometry = (deviceType: DeviceType) => {
  const positions = positionsIndex[deviceType];
  if (!positions) {
    return;
  }
  return {
    positions,
    forEach: (cb: (r: number, c: number, i: number) => void) => {
      for (let i = 0; i < positions.rows; i++) {
        for (let j = 0; j < positions.columns; j++) {
          cb(i, j, i * positions?.columns + j);
        }
      }
    },
    isNot: (
      r: number,
      c: number,
      type: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center'
    ) => {
      const [r1, c1] = positions[type] || [];
      return r !== r1 && c !== c1;
    }
  };
};
