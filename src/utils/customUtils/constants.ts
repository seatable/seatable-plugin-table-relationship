import { MarkerType, NodeProps, Position } from 'reactflow';
import { Relationship } from '../Interfaces/custom-interfaces/ERDPlugin';

export const ENTITIES: any = [
  {
    eTitle: 'order_items',
    eAttributes: {
      order_id: 11,
      product_id: 109123986,
      quantity: 10,
    },
  },
  {
    eTitle: 'orders',
    eAttributes: {
      id: 2,
      user_id: 23,
      status: 'open',
      created_at: '2024-12-12',
      r: '2024-12-12',
      4: '2024-12-12',
    },
  },
];

export const RELATIONSHIPS: Relationship[] = [
  {
    id: 'aaa',
    node1: {
      title: 'order_items',
      attrKey: 'order_id',
    },
    node2: {
      title: 'orders',
      attrKey: 'user_id',
    },
  },
  {
    id: 'bbb',
    node1: {
      title: 'orders',
      attrKey: 'id',
    },
    node2: {
      title: 'order_items',
      attrKey: 'quantity',
    },
  },
];

export const _nodes = [
  {
    id: '4',
    type: 'custom',
    position: { x: 100, y: 200 },
    data: {
      selects: {
        'handle-0': 'smoothstep',
        'handle-1': 'smoothstep',
      },
    },
  },
  // {
  //   id: '5',
  //   type: 'output',
  //   data: {
  //     label: 'custom style',
  //   },
  //   className: 'circle',
  //   style: {
  //     background: '#2B6CB0',
  //     color: 'white',
  //   },
  //   position: { x: 400, y: 200 },
  //   sourcePosition: Position.Right,
  //   targetPosition: Position.Left,
  // },
  {
    id: '5',
    type: 'output',
    style: {
      background: '#63B3ED',
      color: 'white',
      width: 100,
    },
    data: {
      label: 'Node',
    },
    position: { x: 400, y: 125 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: '6',
    type: 'output',
    style: {
      background: '#63B3ED',
      color: 'white',
      width: 100,
    },
    data: {
      label: 'Node',
    },
    position: { x: 400, y: 325 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
];

export const _edges = [
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    type: 'smoothstep',
    sourceHandle: 'handle-0',
    data: {
      selectIndex: 0,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e4-6',
    source: '4',
    target: '6',
    type: 'smoothstep',
    sourceHandle: 'handle-1',
    data: {
      selectIndex: 1,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
];
