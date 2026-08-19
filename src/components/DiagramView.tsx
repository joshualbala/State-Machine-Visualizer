import { useEffect, useMemo } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, MarkerType, useNodesState, type EdgeTypes, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAppContext } from "../state/AppContext";
import { circularLayout } from "../engine/layout";
import { computeEdgeGeometry } from "../engine/edgeGeometry";
import { StateNode, type StateFlowNode } from "./StateNode";
import { TransitionEdge, type TransitionFlowEdge } from "./TransitionEdge";
import "./DiagramView.css";

const nodeTypes: NodeTypes = { state: StateNode };
const edgeTypes: EdgeTypes = { transition: TransitionEdge };

function DiagramInner() {
  const { active } = useAppContext();
  const { machine, simulation, currentStepIndex } = active;

  const currentStep = currentStepIndex >= 0 ? simulation?.steps[currentStepIndex] : undefined;
  const activeState = currentStep ? currentStep.toState ?? currentStep.fromState : machine?.startState;
  const activeTransitionId = currentStep?.transition?.id;

  const [nodes, setNodes, onNodesChange] = useNodesState<StateFlowNode>([]);

  // Re-layout only when the machine definition itself changes (new/edited JSON applied).
  // This intentionally does NOT depend on activeState, so user-dragged positions survive playback.
  useEffect(() => {
    if (!machine) {
      setNodes([]);
      return;
    }
    const positions = circularLayout(machine.states.map((s) => s.id));
    setNodes(
      machine.states.map((s) => ({
        id: s.id,
        type: "state",
        position: positions[s.id],
        data: { label: s.label, isStart: s.id === machine.startState, active: s.id === machine.startState, isError: Boolean(s.isError) },
      }))
    );
  }, [machine, setNodes]);

  // Update just the active-state highlight as playback advances, without touching positions.
  useEffect(() => {
    setNodes((current) => current.map((n) => ({ ...n, data: { ...n.data, active: n.id === activeState } })));
  }, [activeState, setNodes]);

  const edges: TransitionFlowEdge[] = useMemo(() => {
    if (!machine) return [];
    const geometry = computeEdgeGeometry(machine.transitions);
    return machine.transitions.map((t) => {
      const geo = geometry.get(t.id)!;
      const active = t.id === activeTransitionId;
      return {
        id: t.id,
        type: "transition",
        source: t.from,
        target: t.to,
        sourceHandle: "s",
        targetHandle: "t",
        markerEnd: { type: MarkerType.ArrowClosed, color: active ? "var(--accent)" : "var(--edge)" },
        data: {
          label: t.label ?? conditionSummary(t.condition),
          active,
          isSelfLoop: geo.isSelfLoop,
          offsetIndex: geo.offsetIndex,
          flip: geo.flip,
        },
        zIndex: active ? 1 : 0,
      };
    });
  }, [machine, activeTransitionId]);

  if (!machine) {
    return <div className="diagram-view__empty">No valid machine loaded yet.</div>;
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      edgesReconnectable={false}
      deleteKeyCode={null}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

function conditionSummary(condition: { type: string; value?: string; values?: string[]; pattern?: string }): string {
  switch (condition.type) {
    case "charEquals":
      return `char = ${JSON.stringify(condition.value)}`;
    case "charIn":
      return `char in ${JSON.stringify(condition.values)}`;
    case "charMatches":
      return `char ~ /${condition.pattern}/`;
    case "endOfInput":
      return "end of input";
    case "else":
      return "otherwise";
    default:
      return condition.type;
  }
}

export function DiagramView() {
  return (
    <ReactFlowProvider>
      <DiagramInner />
    </ReactFlowProvider>
  );
}
