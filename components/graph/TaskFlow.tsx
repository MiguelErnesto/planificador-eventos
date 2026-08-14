"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
  type ReactFlowInstance,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { createDependency, updateTask } from "@/lib/actions";

export type FlowTask = {
  id: string;
  title: string;
  durationDays: number;
  isCritical: boolean;
  slackDays: number;
  positionX: number;
  positionY: number;
};

export type FlowEdge = {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  lagDays: number;
};

function TaskNode({ data }: NodeProps) {
  const d = data as FlowTask;
  return (
    <div
      className={`min-w-[160px] rounded-xl border-2 bg-white px-3 py-2 shadow-sm ${
        d.isCritical ? "border-critical" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent" />
      <p className="text-sm font-semibold text-slate-800">{d.title}</p>
      <p className="text-xs text-muted">
        {d.durationDays}d · holgura {d.slackDays.toFixed(0)}d
      </p>
      {d.isCritical && (
        <span className="mt-1 inline-block rounded bg-red-50 px-1.5 text-[10px] font-medium uppercase tracking-wide text-critical">
          Crítico
        </span>
      )}
      <Handle type="source" position={Position.Right} className="!bg-accent" />
    </div>
  );
}

const nodeTypes = { task: TaskNode };
const NODE_WIDTH = 180;
const CANVAS_PAD = 40;

export function TaskFlow({
  projectId,
  tasks,
  edges,
  onSelectTask,
}: {
  projectId: string;
  tasks: FlowTask[];
  edges: FlowEdge[];
  onSelectTask: (id: string | null) => void;
}) {
  const initialNodes: Node[] = useMemo(
    () =>
      tasks.map((t) => ({
        id: t.id,
        type: "task",
        position: { x: t.positionX, y: t.positionY },
        data: t,
      })),
    [tasks],
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.fromTaskId,
        target: e.toTaskId,
        label: e.lagDays ? `+${e.lagDays}d` : undefined,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#0d9488" },
        style: { stroke: "#0d9488" },
      })),
    [edges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const canvasWidth = useMemo(() => {
    if (tasks.length === 0) return undefined;
    const maxX = Math.max(...tasks.map((t) => t.positionX));
    return maxX + NODE_WIDTH + CANVAS_PAD;
  }, [tasks]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    const ns = instance.getNodes();
    const minX = ns.length ? Math.min(...ns.map((n) => n.position.x)) : 0;
    const minY = ns.length ? Math.min(...ns.map((n) => n.position.y)) : 0;
    instance.setViewport({ x: -minX + 16, y: -minY + 16, zoom: 1 });
  }, []);

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      setEdges((eds) => addEdge(connection, eds));
      try {
        await createDependency(projectId, connection.source, connection.target);
      } catch (err) {
        alert(err instanceof Error ? err.message : "No se pudo crear la dependencia");
        setEdges(initialEdges);
      }
    },
    [projectId, setEdges, initialEdges],
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
    <div className="ml-0 mr-auto h-[380px] w-1/4 min-w-[220px] max-w-full overflow-x-auto overflow-y-hidden rounded-2xl border border-border bg-slate-50">
      <div className="h-full" style={{ width: canvasWidth ?? "200%" }}>
        <ReactFlow
          nodes={nodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={(_, n) => onSelectTask(n.id)}
          onPaneClick={() => onSelectTask(null)}
          onInit={onInit}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 16, y: 16, zoom: 1 }}
          zoomOnScroll={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} color="#e2e8f0" />
          <Controls />
          <MiniMap
            nodeColor={(n) => ((n.data as FlowTask).isCritical ? "#dc2626" : "#0d9488")}
            maskColor="rgb(248,250,252,0.7)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
