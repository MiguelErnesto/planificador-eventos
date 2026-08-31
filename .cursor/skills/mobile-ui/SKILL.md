---
name: mobile-ui
description: >-
  Improve and verify mobile/responsive UI in planificador-eventos. Use when
  changing layout, header, project list, ProjectEditor, TaskFlow, TaskGantt, or
  when the user mentions mobile, responsive, viewport, or touch.
---

# Mobile UI (planificador-eventos)

## Breakpoints (Tailwind)

| Token | Width |
|-------|-------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |

Prefer `sm:` for form stacking and `lg:` for sidebar / dense desktop chrome.

## Checklist before finishing UI work

1. Stack or wrap on narrow screens; avoid single-row `justify-between` with long text + actions.
2. Use `min-w-0` + `truncate` (or `break-all`) on titles, taglines, and IANA timezones.
3. Tap targets ≥ ~44px (`py-2` / `px-3` on buttons and nav links).
4. Prefer Pointer Events over mouse-only drag (`onPointerDown` + `setPointerCapture` + `touch-action: none`).
5. Heavy panels (task graph): collapsible on mobile; default closed below `lg`, open at `lg+`.
6. Hide secondary chrome below `md` (e.g. React Flow MiniMap).
7. Avoid fixed widths > ~50% of a phone viewport (Gantt label column: ~110 / 160 / 240).
8. Do not leave horizontal page bleed; scroll inside the graph/gantt container instead.
9. New-project form: hidden until Nuevo / `#nuevo` (see `NewProjectForm`).
10. Task detail on `<lg`: `BottomSheet`, not a fixed sidebar column.
11. Mobile detail layout order: Gantt first, then graph / nueva tarea.
12. Below `lg`: open task detail with one tap on the Gantt **name**, or **double tap** on Gantt bars (`lib/double-tap.ts`). Dragging a bar must not open the sheet. Graph nodes use a **single tap** (read-only map).
13. Below `lg`: project header is read-only (name + date + Editar); full meta form only after Editar. “Nueva tarea” sits under the header, before the Gantt.
14. Below `lg` the task graph is **read-only** (auto-layout + fitView, no handles/connect/drag). Create and remove dependencies from task detail (“Añadir predecesor” / Quitar).

## Sensitive components

- `app/layout.tsx`, `components/HeaderNav.tsx`
- `components/ProjectListItem.tsx`, `components/ProjectMetaForm.tsx`
- `components/ProjectEditor.tsx` (graph toggle)
- `components/graph/TaskFlow.tsx`
- `components/gantt/TaskGantt.tsx`
- Hook: `lib/use-media-query.ts`

## Verification

With browser tools, check:

- ~375×812 and ~390×844: header, `/projects`, project detail (graph collapsed by default, Gantt usable, touch drag)
- ~1280px desktop: graph open by default, no layout regressions
