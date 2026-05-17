import React from "react"
import { timeAgo } from "../HolsterNotes"
import type {
  HolsterList,
  HolsterListItem,
} from "./HolsterBoardTypes"

const FONT = `"Inter", system-ui, -apple-system, sans-serif`
const CONTENT_BDR = "#e2e8f0"
const CARD_BG = "#ffffff"
const TEAL = "#5b95a7"
const TEXT = "#0f172a"
const MUTED = "#475569"
const DIM = "#94a3b8"

export type ComposerState = {
  title: string
  note: string
  notesOpen: boolean
  isTask: boolean
}

export type DropTarget = {
  listId: string
  index: number
} | null

export type HolsterBoardSection = {
  id: string
  title: string
  description?: string | null
  lists: HolsterList[]
}

type Props = {
  lists: HolsterList[]
  sections?: HolsterBoardSection[]
  itemsByList: Record<string, HolsterListItem[]>
  openListIds: string[]
  expandedItemIds: string[]
  draggingItemId: string | null
  dropTarget: DropTarget
  getComposer: (listId: string) => ComposerState
  setComposer: (listId: string, next: ComposerState) => void
  toggleListOpen: (listId: string) => void
  toggleItemExpanded: (itemId: string) => void
  addItemToList: (listId: string) => void
  moveItem: (itemId: string, targetListId: string, targetIndex: number) => void
  setDraggingItemId: (id: string | null) => void
  setDropTarget: (target: DropTarget) => void
  patchItem: (id: string, patch: Partial<HolsterListItem>) => void
  handleQuickDone: (item: HolsterListItem, next: boolean) => void
  handleSaveItem: (item: HolsterListItem) => void
  handleDeleteItem: (item: HolsterListItem) => void
}

function DropZone({
  active,
  onDragOver,
  onDrop,
}: {
  active: boolean
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        position: "relative",
        height: active ? 52 : 8,
        transition: "height 0.12s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: active ? 6 : "50%",
          transform: active ? "none" : "translateY(-50%)",
          minHeight: active ? 40 : 0,
          borderRadius: 8,
          border: active ? `2px dashed ${TEAL}` : "2px dashed transparent",
          background: active ? `${TEAL}10` : "transparent",
          opacity: active ? 1 : 0,
          pointerEvents: "none",
          transition: "all 0.12s ease",
        }}
      />
    </div>
  )
}

export default function HolsterBoardView({
  lists,
  sections,
  itemsByList,
  openListIds,
  expandedItemIds,
  draggingItemId,
  dropTarget,
  getComposer,
  setComposer,
  toggleListOpen,
  toggleItemExpanded,
  addItemToList,
  moveItem,
  setDraggingItemId,
  setDropTarget,
  patchItem,
  handleQuickDone,
  handleSaveItem,
  handleDeleteItem,
}: Props) {
  const renderSections =
    sections && sections.length > 0
      ? sections
      : [
          {
            id: "__default__",
            title: "",
            description: null,
            lists,
          },
        ]

  return (
    <div
      className="holster-board-row"
      style={{
        display: "flex",
        gap: 18,
        alignItems: "flex-start",
        overflowX: "auto",
        overflowY: "hidden",
        paddingBottom: 8,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {renderSections.map(section => (
        <div key={section.id} style={{ display: "grid", gap: 12, alignItems: "start" }}>
          {section.title && (
            <div style={{ display: "grid", gap: 2, padding: "0 2px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, fontFamily: FONT }}>
                {section.title}
              </div>

              {section.description && (
                <div style={{ fontSize: 12, color: DIM, fontFamily: FONT }}>
                  {section.description}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {section.lists.map(list => {
              const open = openListIds.includes(list.id)
              const listRows = itemsByList[list.id] ?? []

              return (
                <div
                  key={list.id}
                  style={{
                    width: 280,
                    minWidth: 280,
                    maxHeight: open ? "70vh" : "none",
                    border: open ? `1px solid ${TEAL}` : `1px solid ${CONTENT_BDR}`,
                    borderRadius: 12,
                    background: open ? "#fcfeff" : CARD_BG,
                    overflow: "hidden",
                    alignSelf: "flex-start",
                    boxShadow: open
                      ? "0 0 0 2px rgba(91,149,167,0.18), 0 12px 24px rgba(15, 23, 42, 0.10)"
                      : "0 1px 2px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleListOpen(list.id)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: open ? "#fcfeff" : CARD_BG,
                      textAlign: "left",
                      padding: 14,
                      display: "grid",
                      gap: 6,
                      cursor: "pointer",
                      fontFamily: FONT,
                      position: open ? "sticky" : "relative",
                      top: 0,
                      zIndex: 2,
                      boxShadow: open ? "0 1px 0 rgba(226,232,240,0.95)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: TEXT,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {list.title}
                        </div>

                        <div style={{ marginTop: 2, fontSize: 12, color: DIM }}>
                          {listRows.length} {listRows.length === 1 ? "item" : "items"} · Updated{" "}
                          {timeAgo(list.updated_at)}
                        </div>
                      </div>

                      <svg viewBox="0 0 640 640" width={12} height={12} fill={DIM}>
                        {open ? (
                          <path d="M320 192L576 448L512 512L320 320L128 512L64 448Z" />
                        ) : (
                          <path d="M320 448L64 192L128 128L320 320L512 128L576 192Z" />
                        )}
                      </svg>
                    </div>

                    {list.description && (
                      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                        {list.description}
                      </div>
                    )}
                  </button>

                  {open && (
                    <div
                      style={{
                        borderTop: `1px solid ${CONTENT_BDR}`,
                        padding: 12,
                        display: "grid",
                        gap: 10,
                        overflowY: "auto",
                        maxHeight: "calc(70vh - 72px)",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 8,
                          alignItems: "center",
                          paddingTop: 4,
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          background: CARD_BG,
                          paddingBottom: 8,
                        }}
                      >
                        <input
                          value={getComposer(list.id).title}
                          onChange={e =>
                            setComposer(list.id, {
                              ...getComposer(list.id),
                              title: e.target.value,
                            })
                          }
                          placeholder="Add item and press Enter"
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addItemToList(list.id)
                            }
                          }}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: 38,
                            padding: "0 12px",
                            borderRadius: 9,
                            border: `1px solid ${CONTENT_BDR}`,
                            background: "#fff",
                            fontSize: 13,
                            fontFamily: FONT,
                            color: TEXT,
                            outline: "none",
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => addItemToList(list.id)}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 9,
                            border: `1px solid ${CONTENT_BDR}`,
                            background: CARD_BG,
                            color: TEAL,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          +
                        </button>
                      </div>

                      <div style={{ display: "grid", gap: 0 }}>
                        {listRows.map((item, index) => {
                          const activeBefore =
                            draggingItemId !== null &&
                            dropTarget?.listId === list.id &&
                            dropTarget.index === index

                          const expanded = expandedItemIds.includes(item.id)
                          const dragging = draggingItemId === item.id

                          return (
                            <div key={item.id} style={{ display: "grid", gap: 2 }}>
                              <DropZone
                                active={activeBefore}
                                onDragOver={e => {
                                  e.preventDefault()
                                  if (
                                    draggingItemId &&
                                    draggingItemId !== item.id &&
                                    (dropTarget?.listId !== list.id || dropTarget.index !== index)
                                  ) {
                                    setDropTarget({ listId: list.id, index })
                                  }
                                }}
                                onDrop={e => {
                                  e.preventDefault()
                                  const movingId = draggingItemId ?? e.dataTransfer.getData("text/plain")
                                  if (movingId) moveItem(movingId, list.id, index)
                                  setDraggingItemId(null)
                                  setDropTarget(null)
                                }}
                              />

                              <div
                                draggable
                                style={{ cursor: dragging ? "grabbing" : "grab" }}
                                onDragStart={e => {
                                  setDraggingItemId(item.id)
                                  e.dataTransfer.setData("text/plain", item.id)
                                  e.dataTransfer.effectAllowed = "move"
                                }}
                                onDragEnd={() => {
                                  setDraggingItemId(null)
                                  setDropTarget(null)
                                }}
                              >
                                <div
                                  style={{
                                    border: `1px solid ${CONTENT_BDR}`,
                                    borderRadius: 8,
                                    background: CARD_BG,
                                    overflow: "hidden",
                                    boxShadow: dragging
                                      ? "0 12px 28px rgba(15, 23, 42, 0.18)"
                                      : "0 1px 2px rgba(15, 23, 42, 0.04)",
                                    opacity: dragging ? 0.55 : 1,
                                    transform: dragging ? "scale(1.02)" : "scale(1)",
                                    transition:
                                      "transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleItemExpanded(item.id)}
                                    style={{
                                      width: "100%",
                                      border: "none",
                                      background: "transparent",
                                      textAlign: "left",
                                      padding: "8px 10px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      cursor: "pointer",
                                      fontFamily: FONT,
                                    }}
                                  >
                                    {item.is_task && (
                                      <input
                                        type="checkbox"
                                        checked={item.is_done}
                                        onChange={e => {
                                          e.stopPropagation()
                                          handleQuickDone(item, e.target.checked)
                                        }}
                                        onClick={e => e.stopPropagation()}
                                      />
                                    )}

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontSize: 13,
                                          fontWeight: 500,
                                          color: TEXT,
                                          whiteSpace: "normal",
                                          overflow: "visible",
                                          textOverflow: "clip",
                                          overflowWrap: "anywhere",
                                          lineHeight: 1.35,
                                        }}
                                      >
                                        {item.title}
                                      </div>

                                      {(item.note || item.is_task) && (
                                        <div
                                          style={{
                                            marginTop: 2,
                                            fontSize: 12,
                                            color: DIM,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}
                                        >
                                          {item.is_task ? (item.is_done ? "Task · Done" : "Task") : "Notes"}
                                          {item.note ? ` · ${item.note}` : ""}
                                        </div>
                                      )}
                                    </div>
                                  </button>

                                  {expanded && (
                                    <div
                                      style={{
                                        borderTop: `1px solid ${CONTENT_BDR}`,
                                        padding: 12,
                                        display: "grid",
                                        gap: 8,
                                      }}
                                    >
                                      <input
                                        value={item.title}
                                        onChange={e => patchItem(item.id, { title: e.target.value })}
                                        placeholder="Title"
                                        style={{
                                          height: 38,
                                          padding: "0 12px",
                                          borderRadius: 7,
                                          border: `1px solid ${CONTENT_BDR}`,
                                          background: CARD_BG,
                                          fontSize: 14,
                                          fontFamily: FONT,
                                          color: TEXT,
                                          outline: "none",
                                        }}
                                      />

                                      <textarea
                                        value={item.note ?? ""}
                                        onChange={e => patchItem(item.id, { note: e.target.value })}
                                        placeholder="Notes"
                                        rows={3}
                                        style={{
                                          minHeight: 82,
                                          padding: 10,
                                          borderRadius: 7,
                                          border: `1px solid ${CONTENT_BDR}`,
                                          background: CARD_BG,
                                          fontSize: 14,
                                          fontFamily: FONT,
                                          color: TEXT,
                                          outline: "none",
                                          resize: "vertical",
                                          lineHeight: 1.5,
                                        }}
                                      />

                                      <label
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 8,
                                          fontSize: 13,
                                          color: MUTED,
                                          fontFamily: FONT,
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={item.is_task}
                                          onChange={e =>
                                            patchItem(item.id, {
                                              is_task: e.target.checked,
                                              is_done: e.target.checked ? item.is_done : false,
                                            })
                                          }
                                        />
                                        Is this a task?
                                      </label>

                                      {item.is_task && (
                                        <label
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 8,
                                            fontSize: 13,
                                            color: MUTED,
                                            fontFamily: FONT,
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={item.is_done}
                                            onChange={e => patchItem(item.id, { is_done: e.target.checked })}
                                          />
                                          Done
                                        </label>
                                      )}

                                      <div style={{ display: "flex", gap: 8 }}>
                                        <button type="button" onClick={() => handleSaveItem(item)}>
                                          Save
                                        </button>
                                        <button type="button" onClick={() => handleDeleteItem(item)}>
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}

                        <DropZone
                          active={
                            draggingItemId !== null &&
                            dropTarget?.listId === list.id &&
                            dropTarget.index === listRows.length
                          }
                          onDragOver={e => {
                            e.preventDefault()
                            if (
                              draggingItemId &&
                              (dropTarget?.listId !== list.id || dropTarget.index !== listRows.length)
                            ) {
                              setDropTarget({ listId: list.id, index: listRows.length })
                            }
                          }}
                          onDrop={e => {
                            e.preventDefault()
                            const movingId = draggingItemId ?? e.dataTransfer.getData("text/plain")
                            if (movingId) moveItem(movingId, list.id, listRows.length)
                            setDraggingItemId(null)
                            setDropTarget(null)
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}