import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

export interface StateNodeData {
  label: string;
  isStart: boolean;
  active: boolean;
  [key: string]: unknown;
}

export type StateFlowNode = Node<StateNodeData, "state">;

const centerHandleStyle: React.CSSProperties = {
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  opacity: 0,
  width: 1,
  height: 1,
  pointerEvents: "none",
};

export function StateNode({ data }: NodeProps<StateFlowNode>) {
  return (
    <div className={`state-node${data.active ? " state-node--active" : ""}`}>
      <Handle type="target" position={Position.Top} id="t" style={centerHandleStyle} />
      {data.isStart && <div className="state-node__start-marker" title="Start state" />}
      <span className="state-node__label">{data.label}</span>
      <Handle type="source" position={Position.Top} id="s" style={centerHandleStyle} />
    </div>
  );
}
