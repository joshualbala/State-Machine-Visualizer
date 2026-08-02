import { BaseEdge, EdgeLabelRenderer, useInternalNode, type Edge, type EdgeProps, type InternalNode, type Node } from "@xyflow/react";
import { circleBoundaryPoint, polarPoint, type Point } from "../engine/nodeGeometry";

export interface TransitionEdgeData {
  label: string;
  active: boolean;
  isSelfLoop: boolean;
  offsetIndex: number;
  flip: boolean;
  [key: string]: unknown;
}

export type TransitionFlowEdge = Edge<TransitionEdgeData, "transition">;

const DEFAULT_DIAMETER = 108;
const LANE_ANGLE_STEP = (12 * Math.PI) / 180;
const LANE_BOW = 26;
const SELF_LOOP_SPAN_DEG = 34;
const SELF_LOOP_GAP_DEG = 15;
const SELF_LOOP_HEIGHT = 70;

function nodeCenterAndRadius(node: InternalNode<Node>): { center: Point; radius: number } {
  const width = node.measured.width ?? DEFAULT_DIAMETER;
  const height = node.measured.height ?? DEFAULT_DIAMETER;
  return {
    center: { x: node.internals.positionAbsolute.x + width / 2, y: node.internals.positionAbsolute.y + height / 2 },
    radius: Math.min(width, height) / 2,
  };
}

/** Both ends anchored on the node's own rim, fanned around the top by lane so multiple self-loops don't stack. */
function selfLoopPath(center: Point, radius: number, offsetIndex: number) {
  const loopCenterAngle = offsetIndex * SELF_LOOP_SPAN_DEG;
  const p1 = polarPoint(center, radius, loopCenterAngle - SELF_LOOP_GAP_DEG);
  const p2 = polarPoint(center, radius, loopCenterAngle + SELF_LOOP_GAP_DEG);
  const dirRad = (loopCenterAngle * Math.PI) / 180;
  const outward = { x: Math.sin(dirRad), y: -Math.cos(dirRad) };
  const c1 = { x: p1.x + outward.x * SELF_LOOP_HEIGHT, y: p1.y + outward.y * SELF_LOOP_HEIGHT };
  const c2 = { x: p2.x + outward.x * SELF_LOOP_HEIGHT, y: p2.y + outward.y * SELF_LOOP_HEIGHT };
  const path = `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  return { path, labelX: (c1.x + c2.x) / 2, labelY: (c1.y + c2.y) / 2 };
}

/**
 * Both ends anchored on their own node's rim, rotated a few degrees per lane so parallel edges
 * between the same two nodes leave/enter at visibly different points instead of converging on one
 * spot. The rotation and bow are derived from a canonical (direction-independent) vector between
 * the two nodes so an A->B edge and a B->A edge sharing a lane bow to the same side.
 */
function parallelEdgePath(
  sourceCenter: Point,
  sourceRadius: number,
  targetCenter: Point,
  targetRadius: number,
  offsetIndex: number,
  flip: boolean
) {
  const theta = offsetIndex * LANE_ANGLE_STEP;
  const canonical: Point = flip
    ? { x: sourceCenter.x - targetCenter.x, y: sourceCenter.y - targetCenter.y }
    : { x: targetCenter.x - sourceCenter.x, y: targetCenter.y - sourceCenter.y };
  const negCanonical: Point = { x: -canonical.x, y: -canonical.y };

  const aCenter = flip ? targetCenter : sourceCenter;
  const aRadius = flip ? targetRadius : sourceRadius;
  const bCenter = flip ? sourceCenter : targetCenter;
  const bRadius = flip ? sourceRadius : targetRadius;

  const aPoint = circleBoundaryPoint(aCenter, aRadius, canonical, theta);
  const bPoint = circleBoundaryPoint(bCenter, bRadius, negCanonical, -theta);

  const sourcePoint = flip ? bPoint : aPoint;
  const targetPoint = flip ? aPoint : bPoint;

  const canonicalLen = Math.hypot(canonical.x, canonical.y) || 1;
  const perp = { x: -canonical.y / canonicalLen, y: canonical.x / canonicalLen };
  const bow = offsetIndex * LANE_BOW;
  const midX = (sourcePoint.x + targetPoint.x) / 2 + perp.x * bow;
  const midY = (sourcePoint.y + targetPoint.y) / 2 + perp.y * bow;

  const path = `M ${sourcePoint.x} ${sourcePoint.y} Q ${midX} ${midY} ${targetPoint.x} ${targetPoint.y}`;
  return { path, labelX: midX, labelY: midY };
}

export function TransitionEdge({ id, source, target, data, markerEnd }: EdgeProps<TransitionFlowEdge>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!data || !sourceNode || !targetNode) return null;
  const active = data.active;

  const src = nodeCenterAndRadius(sourceNode);
  const tgt = nodeCenterAndRadius(targetNode);

  const { path, labelX, labelY } = data.isSelfLoop
    ? selfLoopPath(src.center, src.radius, data.offsetIndex)
    : parallelEdgePath(src.center, src.radius, tgt.center, tgt.radius, data.offsetIndex, data.flip);

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} className={`transition-edge${active ? " transition-edge--active" : ""}`} />
      <EdgeLabelRenderer>
        <div
          className={`transition-edge__label${active ? " transition-edge__label--active" : ""}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
