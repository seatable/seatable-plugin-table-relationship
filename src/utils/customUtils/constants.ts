import { Relationship } from '../Interfaces/custom-interfaces/ERDPlugin';
import { generatorBase64Code } from '../utils';
import { stringGeneratorBase64Code } from './ERDUtils';

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
  // {
  //   eTitle: 'products',
  //   eAttributes: {
  //     product_id: 109123986,
  //     name: 'Widget',
  //     price: 19.99,
  //   },
  //   links: {}, // This product is not linked to any other entity in this example
  // },
  // {
  //   eTitle: 'users',
  //   eAttributes: {
  //     user_id: 23,
  //     username: 'john_doe',
  //     email: 'john.doe@example.com',
  //   },
  //   links: {}, // This user is not linked to any other entity in this example
  // },
  // {
  //   eTitle: 'users',
  //   eAttributes: {
  //     user_id: 23,
  //     username: 'john_doe',
  //     email: 'john.doe@example.com',
  //   },
  //   links: {}, // This user is not linked to any other entity in this example
  // },
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
