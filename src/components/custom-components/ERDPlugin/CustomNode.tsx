import React, { ChangeEvent } from 'react';
import { Handle, useReactFlow, useStoreApi, Position } from 'reactflow';
import {
  SelectProps,
  Option,
  CustomNodeProps,
} from '../../../utils/Interfaces/custom-interfaces/ERDPlugin';

function CustomNode({ id, data }: CustomNodeProps) {
  // console.log('data', data);
  return (
    <>
      <div className="custom-node__header">
        <strong>Hardcoded Title</strong>
      </div>
      <div className="custom-node__body">
        {Object.keys(data.selects).map((handleId) => (
          <Select key={handleId} nodeId={id} value={data.selects[handleId]} handleId={handleId} />
        ))}
      </div>
    </>
  );
}

export default CustomNode;

function Select({ value, handleId, nodeId }: SelectProps) {
  const { setNodes } = useReactFlow();
  const store = useStoreApi();

  const onChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const { nodeInternals } = store.getState();
    setNodes(
      Array.from(nodeInternals.values()).map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            selects: {
              ...node.data.selects,
              [handleId]: evt.target.value,
            },
          };
        }

        return node;
      })
    );
  };

  return (
    <div
      className="custom-node__select"
      style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ order: 1 }}>Edge Type</div>
      <Handle type="source" position={Position.Right} id={handleId} />
      <div style={{ order: 2 }}>{value}</div>
    </div>
  );
}
