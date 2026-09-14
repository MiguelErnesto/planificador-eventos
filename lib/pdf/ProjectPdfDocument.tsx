import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ProjectReport } from "@/lib/project-report";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  kicker: {
    fontSize: 8,
    color: "#0f766e",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  meta: {
    color: "#64748b",
    marginBottom: 2,
  },
  summary: {
    marginTop: 14,
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    backgroundColor: "#f8fafc",
  },
  summaryLine: {
    marginBottom: 3,
  },
  tight: {
    color: "#dc2626",
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
  path: {
    lineHeight: 1.4,
  },
  empty: {
    color: "#64748b",
    marginTop: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerRow: {
    backgroundColor: "#0f766e",
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
    color: "#dc2626",
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

export function ProjectPdfDocument({ report }: { report: ProjectReport }) {
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

        {report.criticalPathLabel ? (
          <>
            <Text style={styles.sectionTitle}>Camino crítico</Text>
            <Text style={styles.path}>{report.criticalPathLabel}</Text>
          </>
        ) : null}

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

        <View style={styles.footer} fixed>
          <Text>{report.appTitle}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
