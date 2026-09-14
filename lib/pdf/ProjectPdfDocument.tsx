import {
  Document,
  Page,
  Path,
  Polygon,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ProjectReport } from "@/lib/project-report";
import {
  PDF_NODE_H,
  PDF_NODE_W,
  type PdfGraph,
  type PdfGraphNode,
} from "@/lib/pdf/build-pdf-graph";

const ACCENT = "#0d9488";
const CRITICAL = "#dc2626";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

const LANDSCAPE = { width: 841.89, height: 595.28 };
const GRAPH_MARGIN_X = 40;
const GRAPH_MARGIN_TOP = 72;
const GRAPH_MARGIN_BOTTOM = 40;

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  graphPage: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: GRAPH_MARGIN_X,
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  kicker: {
    fontSize: 8,
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  graphTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  meta: {
    color: MUTED,
    marginBottom: 2,
  },
  summary: {
    marginTop: 14,
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    backgroundColor: "#f8fafc",
  },
  summaryLine: {
    marginBottom: 3,
  },
  tight: {
    color: CRITICAL,
    fontFamily: "Helvetica-Bold",
  },
  warning: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 4,
    backgroundColor: "#fef2f2",
    color: "#991b1b",
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  empty: {
    color: MUTED,
    marginTop: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerRow: {
    backgroundColor: ACCENT,
  },
  headerCell: {
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  cell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 8,
  },
  titleCol: { width: "28%" },
  daysCol: { width: "8%" },
  dateCol: { width: "16%" },
  slackCol: { width: "14%" },
  critCol: { width: "10%" },
  pctCol: { width: "8%" },
  criticalText: {
    color: CRITICAL,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export function ProjectPdfDocument({
  report,
  graph,
}: {
  report: ProjectReport;
  graph: PdfGraph | null;
}) {
  return (
    <Document
      title={report.name}
      author={report.appTitle}
      subject={`Plan de ${report.name}`}
      language="es"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>{report.appTitle}</Text>
        <Text style={styles.title}>{report.name}</Text>
        <Text style={styles.meta}>Fecha límite: {report.eventDateLabel}</Text>
        <Text style={styles.meta}>Zona horaria: {report.timezone}</Text>
        <Text style={styles.meta}>Emitido: {report.issuedLabel}</Text>

        <View style={styles.summary}>
          <Text style={styles.summaryLine}>
            {report.planRangeLabel} · {report.durationLabel} · {report.progressPct}%
            {" · "}
            <Text style={report.slackIsTight ? styles.tight : undefined}>
              {report.slackHeadline}
            </Text>
          </Text>
          <Text style={report.slackIsTight ? styles.tight : styles.meta}>
            {report.slackDetail}
          </Text>
          {report.overrunWarning ? (
            <Text style={styles.warning}>{report.overrunWarning}</Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Tareas</Text>
        {report.tasks.length === 0 ? (
          <Text style={styles.empty}>Este proyecto no tiene tareas.</Text>
        ) : (
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]} wrap={false}>
              <Text style={[styles.cell, styles.headerCell, styles.titleCol]}>
                Tarea
              </Text>
              <Text style={[styles.cell, styles.headerCell, styles.daysCol]}>
                Días
              </Text>
              <Text style={[styles.cell, styles.headerCell, styles.dateCol]}>
                Inicio
              </Text>
              <Text style={[styles.cell, styles.headerCell, styles.dateCol]}>
                Fin
              </Text>
              <Text style={[styles.cell, styles.headerCell, styles.slackCol]}>
                Margen
              </Text>
              <Text style={[styles.cell, styles.headerCell, styles.critCol]}>
                Crítica
              </Text>
              <Text style={[styles.cell, styles.headerCell, styles.pctCol]}>%</Text>
            </View>
            {report.tasks.map((task) => (
              <View key={task.id} style={styles.row} wrap={false}>
                <Text
                  style={[
                    styles.cell,
                    styles.titleCol,
                    task.isCritical ? styles.criticalText : {},
                  ]}
                >
                  {task.title}
                </Text>
                <Text style={[styles.cell, styles.daysCol]}>{task.durationDays}</Text>
                <Text style={[styles.cell, styles.dateCol]}>{task.startLabel}</Text>
                <Text style={[styles.cell, styles.dateCol]}>{task.finishLabel}</Text>
                <Text
                  style={[
                    styles.cell,
                    styles.slackCol,
                    task.isCritical ? styles.criticalText : {},
                  ]}
                >
                  {task.slackLabel}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.critCol,
                    task.isCritical ? styles.criticalText : {},
                  ]}
                >
                  {task.criticalLabel}
                </Text>
                <Text style={[styles.cell, styles.pctCol]}>{task.progressPct}</Text>
              </View>
            ))}
          </View>
        )}

        <PdfFooter appTitle={report.appTitle} />
      </Page>

      {graph ? (
        <Page size="A4" orientation="landscape" style={styles.graphPage}>
          <Text style={styles.kicker}>{report.name}</Text>
          <Text style={styles.graphTitle}>Grafo de tareas</Text>
          <Text style={styles.meta}>
            Árbol de izquierda a derecha. El borde rojo marca las tareas críticas.
          </Text>
          <PdfTaskGraph graph={graph} />
          <PdfFooter appTitle={report.appTitle} />
        </Page>
      ) : null}
    </Document>
  );
}

function PdfFooter({ appTitle }: { appTitle: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{appTitle}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function PdfTaskGraph({ graph }: { graph: PdfGraph }) {
  const usableW = LANDSCAPE.width - GRAPH_MARGIN_X * 2;
  const usableH = LANDSCAPE.height - GRAPH_MARGIN_TOP - GRAPH_MARGIN_BOTTOM;
  const scale = Math.min(usableW / graph.width, usableH / graph.height, 1);
  const width = graph.width * scale;
  const height = graph.height * scale;

  return (
    <View style={{ marginTop: 10 }}>
      <Svg width={width} height={height} viewBox={`0 0 ${graph.width} ${graph.height}`}>
        {graph.edges.map((edge) => (
          <Path
            key={edge.id}
            d={edge.path}
            stroke={ACCENT}
            strokeWidth={2}
            fill="none"
          />
        ))}
        {graph.edges.map((edge) => (
          <Polygon key={`${edge.id}-arrow`} points={edge.arrowPoints} fill={ACCENT} />
        ))}
        {graph.nodes.map((node) => (
          <PdfTaskNode key={node.id} node={node} />
        ))}
        {graph.edges.map((edge) =>
          edge.label ? (
            <Text
              key={`${edge.id}-label`}
              x={edge.labelX}
              y={edge.labelY - 4}
              style={{
                fontSize: 8,
                fill: MUTED,
                fontFamily: "Helvetica-Bold",
                textAnchor: "middle",
              }}
            >
              {edge.label}
            </Text>
          ) : null,
        )}
      </Svg>
    </View>
  );
}

function PdfTaskNode({ node }: { node: PdfGraphNode }) {
  const border = node.isCritical ? CRITICAL : BORDER;
  const fill = node.isCritical ? "#fecaca" : "#ccfbf1";
  const barW =
    node.progressPct > 0
      ? (PDF_NODE_W - 4) * (Math.min(100, Math.max(0, node.progressPct)) / 100)
      : 0;
  return (
    <>
      <Rect
        x={node.x}
        y={node.y}
        width={PDF_NODE_W}
        height={PDF_NODE_H}
        rx={8}
        ry={8}
        fill="#ffffff"
        stroke={border}
        strokeWidth={2}
      />
      {barW > 0 ? (
        <Rect
          x={node.x + 2}
          y={node.y + 2}
          width={barW}
          height={PDF_NODE_H - 4}
          rx={6}
          ry={6}
          fill={fill}
        />
      ) : null}
      <Text
        x={node.x + 8}
        y={node.y + 16}
        style={{
          fontSize: 9,
          fontFamily: "Helvetica-Bold",
          fill: node.isCritical ? CRITICAL : "#1e293b",
        }}
      >
        {node.title}
      </Text>
      <Text
        x={node.x + 8}
        y={node.y + 30}
        style={{ fontSize: 8, fill: MUTED }}
      >
        {node.meta}
      </Text>
      {node.isCritical ? (
        <Text
          x={node.x + 8}
          y={node.y + 44}
          style={{
            fontSize: 7,
            fontFamily: "Helvetica-Bold",
            fill: CRITICAL,
            textTransform: "uppercase",
          }}
        >
          Crítico
        </Text>
      ) : null}
    </>
  );
}
