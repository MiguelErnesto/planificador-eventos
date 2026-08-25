"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type ReactFlowInstance,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { createDependency, deleteDependency, updateTask } from "@/lib/actions";
import {
  dependencyLabel,
  dependencyTypeFromHandles,
  handlesForType,
} from "@/lib/dependency";
import type { DependencyType } from "@/lib/cpm";

export type FlowTask = {
  id: string;
  title: string;
  durationDays: number;
  isCritical: boolean;
  slackDays: number;
  progressPct: number;
  positionX: number;
  positionY: number;
};

export type FlowEdge = {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  lagDays: number;
  type: DependencyType;
};

function TaskNode({ data, selected }: NodeProps) {
  const d = data as FlowTask;
  const fill = Math.min(100, Math.max(0, d.progressPct));
  return (
    <div className="relative min-w-[160px]">
      <Handle
        type="target"
        id="target-start"
        position={Position.Left}
        title="Inicio (destino)"
        className="!bg-accent"
        style={{ top: "35%" }}
      />
      <Handle
        type="source"
        id="source-start"
        position={Position.Left}
        title="Inicio (origen)"
        className="!bg-accent"
        style={{ top: "70%" }}
      />
      <div
        className={`relative overflow-hidden rounded-xl border-2 bg-white px-3 py-2 shadow-sm ${
          d.isCritical
            ? "border-critical"
            : selected
              ? "border-accent"
              : "border-slate-200"
        } ${selected ? "ring-2 ring-accent/40" : ""}`}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 ${
            d.isCritical ? "bg-critical/20" : "bg-accent/25"
          }`}
          style={{ width: `${fill}%` }}
        />
        <p className="relative text-sm font-semibold text-slate-800">{d.title}</p>
        <p className="relative text-xs text-muted">
          {d.durationDays}d · {d.progressPct}%
        </p>
        {d.isCritical && (
          <span className="relative mt-1 inline-block rounded bg-red-50 px-1.5 text-[10px] font-medium uppercase tracking-wide text-critical">
            Crítico
          </span>
        )}
      </div>
      <Handle
        type="source"
        id="source-finish"
        position={Position.Right}
        title="Fin (origen)"
        className="!bg-accent"
        style={{ top: "35%" }}
      />
      <Handle
        type="target"
        id="target-finish"
        position={Position.Right}
        title="Fin (destino)"
        className="!bg-accent"
        style={{ top: "70%" }}
      />
    </div>
  );
}

const nodeTypes = { task: TaskNode };
const SELECTED_EDGE = "#dc2626";
const DEFAULT_EDGE = "#0d9488";

function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  label,
  markerEnd,
  style,
  interactionWidth,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const color = selected ? SELECTED_EDGE : DEFAULT_EDGE;
  const markerId = `arrow-red-${id}`;

  return (
    <>
      {selected && (
        <defs>
          <marker
            id={markerId}
            markerWidth="12.5"
            markerHeight="12.5"
            viewBox="-10 -10 20 20"
            orient="auto-start-reverse"
            refX="0"
            refY="0"
          >
            <polyline
              stroke={SELECTED_EDGE}
              fill={SELECTED_EDGE}
              strokeLinecap="round"
              strokeLinejoin="round"
              points="-5,-4 0,0 -5,4 -5,-4"
            />
          </marker>
        </defs>
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={selected ? `url(#${markerId})` : markerEnd}
        style={{ ...style, stroke: color, strokeWidth: selected ? 3 : 2 }}
        interactionWidth={interactionWidth ?? 24}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              zIndex: 1000,
              pointerEvents: "none",
            }}
          >
            <span className="rounded bg-white/90 px-1 text-[10px] font-semibold text-slate-600">
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
      {selected && (
        <EdgeLabelRenderer>
          <div
            role="tooltip"
            className="nodrag nopan pointer-events-none"
            style={{
              position: "absolute",
              transform: `translate(-50%, calc(-100% - 22px)) translate(${labelX}px, ${labelY}px)`,
              zIndex: 1001,
              pointerEvents: "none",
            }}
          >
            <div className="relative max-w-[160px] rounded bg-red-400 px-1.5 py-1 text-center text-[10px] leading-tight font-medium italic text-white shadow-md">
              Doble click sobre el conector para borrarlo.
              <span
                aria-hidden
                className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rotate-45 bg-red-400"
              />
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = { dependency: DependencyEdge };
const NODE_WIDTH = 180;
const CANVAS_PAD = 40;
const MINIMAP_OFFSET_X = 140;
const MINIMAP_OFFSET_Y = 100;

export function TaskFlow({
  projectId,
  tasks,
  edges,
  selectedTaskId,
  onSelectTask,
  onSelectConnector,
}: {
  projectId: string;
  tasks: FlowTask[];
  edges: FlowEdge[];
  selectedTaskId: string | null;
  onSelectTask: (id: string | null) => void;
  onSelectConnector: (selected: boolean) => void;
}) {
  const initialNodes: Node[] = useMemo(
    () =>
      tasks.map((t) => ({
        id: t.id,
        type: "task",
        position: { x: t.positionX, y: t.positionY },
        data: t,
        deletable: false,
      })),
    [tasks],
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => {
        const handles = handlesForType(e.type);
        return {
          id: e.id,
          type: "dependency",
          source: e.fromTaskId,
          target: e.toTaskId,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
          label: dependencyLabel(e.type, e.lagDays),
          markerEnd: { type: MarkerType.ArrowClosed, color: DEFAULT_EDGE },
          style: { stroke: DEFAULT_EDGE, strokeWidth: 2 },
          interactionWidth: 24,
        };
      }),
    [edges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(
      initialNodes.map((n) => ({
        ...n,
        selected: n.id === selectedTaskId,
      })),
    );
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, selectedTaskId, setNodes, setEdges]);

  const canvasWidth = useMemo(() => {
    if (tasks.length === 0) return undefined;
    const maxX = Math.max(...tasks.map((t) => t.positionX));
    return maxX + NODE_WIDTH + CANVAS_PAD;
  }, [tasks]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    const ns = instance.getNodes();
    const minX = ns.length ? Math.min(...ns.map((n) => n.position.x)) : 0;
    const minY = ns.length ? Math.min(...ns.map((n) => n.position.y)) : 0;
    instance.setViewport({
      x: -minX + MINIMAP_OFFSET_X,
      y: -minY + MINIMAP_OFFSET_Y,
      zoom: 1,
    });
  }, []);

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const type = dependencyTypeFromHandles(
        connection.sourceHandle,
        connection.targetHandle,
      );
      if (!type) {
        alert("Enlace start-to-finish no soportado. Usa FS, SS o FF.");
        return;
      }
      setEdges((eds) => addEdge(connection, eds));
      try {
        await createDependency(
          projectId,
          connection.source,
          connection.target,
          0,
          type,
        );
      } catch (err) {
        alert(err instanceof Error ? err.message : "No se pudo crear la dependencia");
        setEdges(initialEdges);
      }
    },
    [projectId, setEdges, initialEdges],
  );

  const persistEdgeDeletes = useCallback(
    async (deleted: Edge[]) => {
      onSelectConnector(false);
      try {
        await Promise.all(deleted.map((e) => deleteDependency(e.id)));
      } catch (err) {
        alert(
          err instanceof Error
            ? err.message
            : "No se pudo eliminar la dependencia",
        );
        setEdges(initialEdges);
      }
    },
    [initialEdges, setEdges, onSelectConnector],
  );

  const onNodeDragStop = useCallback(
    async (_: unknown, node: Node) => {
      await updateTask(node.id, {
        positionX: node.position.x,
        positionY: node.position.y,
      });
    },
    [],
  );

  return (
    <div className="h-[380px] w-full overflow-x-auto overflow-y-hidden rounded-2xl border border-border bg-slate-50">
      <div className="h-full min-w-full" style={{ width: canvasWidth ?? "100%" }}>
          <ReactFlow
            className="[&_.react-flow__edgelabel-renderer]:z-[1001]"
            nodes={nodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={(c) =>
              dependencyTypeFromHandles(c.sourceHandle, c.targetHandle) != null
            }
            onEdgesDelete={persistEdgeDeletes}
            onEdgeDoubleClick={(_, edge) => {
              setEdges((eds) => eds.filter((e) => e.id !== edge.id));
              void persistEdgeDeletes([edge]);
            }}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={(_, n) => onSelectTask(n.id)}
            onEdgeClick={() => onSelectConnector(true)}
            onPaneClick={() => {
              onSelectTask(null);
              onSelectConnector(false);
            }}
            deleteKeyCode={["Backspace", "Delete"]}
            edgesReconnectable={false}
            defaultEdgeOptions={{
              type: "dependency",
              markerEnd: { type: MarkerType.ArrowClosed, color: DEFAULT_EDGE },
              style: { stroke: DEFAULT_EDGE, strokeWidth: 2 },
            }}
            onInit={onInit}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultViewport={{
              x: MINIMAP_OFFSET_X,
              y: MINIMAP_OFFSET_Y,
              zoom: 1,
            }}
            zoomOnScroll={false}
            preventScrolling={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} color="#e2e8f0" />
            <Controls />
            <MiniMap
              position="top-left"
              style={{ width: 120, height: 80 }}
              nodeColor={(n) => ((n.data as FlowTask).isCritical ? "#dc2626" : "#0d9488")}
              maskColor="rgb(248,250,252,0.7)"
            />
          </ReactFlow>
        </div>
    </div>
  );
}
