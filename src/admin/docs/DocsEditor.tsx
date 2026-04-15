import type { DocsEditorProps } from "./DocsTypes"

export function DocsEditor({
  siteName,
  selectedFile,
  content,
  dirty,
  loading,
  saving,
  onChange,
  onSave,
}: DocsEditorProps) {
  if (!selectedFile) {
    return (
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          background: "#f9fafb",
          color: "#6b7280",
          fontSize: 14,
        }}
      >
        Select a docs file from the left.
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
          background: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}
          >
            {siteName}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedFile}
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving || loading || !dirty}
          style={{
            padding: "9px 14px",
            borderRadius: 6,
            border: "none",
            background: dirty ? "#3296ab" : "#cbd5e1",
            color: "#fff",
            cursor: dirty ? "pointer" : "default",
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {saving ? "Saving…" : dirty ? "Save" : "Saved"}
        </button>
      </div>

      <div style={{ flex: 1, padding: 16, minHeight: 0 }}>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            height: "100%",
            resize: "none",
            border: "1px solid #d4d4d8",
            borderRadius: 8,
            padding: 14,
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
            background: "#fff",
            color: "#111827",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  )
}