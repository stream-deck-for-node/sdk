import {
  DeviceGeometry,
  DeviceGeometryPositions,
  DeviceType
} from './types/interfaces';

const BaseStreamDeck: DeviceGeometryPositions = {
  topLeft: 0,
  topRight: 4,
  bottomLeft: 10,
  bottomRight: 14,
  center: 7,
  total: 3 * 5,
  rows: 3,
  columns: 5
};

const positionsIndex: Record<DeviceType, DeviceGeometryPositions> = {
  [DeviceType.StreamDeck]: BaseStreamDeck,
  [DeviceType.StreamDeckMini]: {
    topLeft: 0,
    topRight: 2,
    bottomLeft: 3,
    bottomRight: 5,
    approximatedCenter: 1,
    total: 2 * 3,
    rows: 2,
    columns: 3
  },
  [DeviceType.StreamDeckXL]: {
    topLeft: 0,
    topRight: 7,
    bottomLeft: 24,
    bottomRight: 31,
    approximatedCenter: 11,
    total: 4 * 8,
    rows: 4,
    columns: 8
  },
  [DeviceType.StreamDeckMobile]: BaseStreamDeck
};

export const geometry = (deviceType: DeviceType): DeviceGeometry => {
  const positions = positionsIndex[deviceType];
  return {
    ...positions,
    total: positions.total,
    columns: positions.columns,
    rows: positions.rows,

    mappable: (
      ...except: Exclude<
        keyof DeviceGeometryPositions,
        'total' | 'rows' | 'columns'
      >[]
    ) => {
      const excludedIndexes = except.map((it) => positions[it]);
      const validPositions = Array.from(new Array(positions.total))
        .map((_, i) => i)
        .filter((it) => !excludedIndexes.includes(it));
      return [validPositions, positions.total - validPositions.length];
    }
  };
};
