import type { DocsFileNode, DocsSidebarProps } from "./DocsTypes"

function buildDepth(path: string) {
  return path.split("/").filter(Boolean).length - 1
}

function FileTree({
  nodes,
  selectedFile,
  expandedFolders,
  onToggleFolder,
  onOpenFile,
}: {
  nodes: DocsFileNode[]
  selectedFile: string | null
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
  onOpenFile: (path: string) => void
}) {
  return (
    <div>
      {nodes.map((node) => {
        const depth = buildDepth(node.path)
        const isOpen = expandedFolders.has(node.path)
        const isSelected = selectedFile === node.path

        if (node.type === "folder") {
          return (
            <div key={node.path}>
              <button
                type="button"
                onClick={() => onToggleFolder(node.path)}
                style={{
                  width: "100%",
                  border: "none",
                  background: isOpen ? "#f3f4f6" : "#fff",
                  color: "#111827",
                  textAlign: "left",
                  padding: `8px 12px 8px ${16 + depth * 16}px`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <span style={{ width: 12 }}>{isOpen ? "▾" : "▸"}</span>
                <span style={{ fontWeight: 600 }}>📁</span>
                <span>{node.name}</span>
              </button>

              {isOpen && node.children && (
                <FileTree
                  nodes={node.children}
                  selectedFile={selectedFile}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  onOpenFile={onOpenFile}
                />
              )}
            </div>
          )
        }

        return (
          <button
            key={node.path}
            type="button"
            onClick={() => onOpenFile(node.path)}
            style={{
              width: "100%",
              border: "none",
              background: isSelected ? "#3296ab" : "#fff",
              color: isSelected ? "#fff" : "#111827",
              textAlign: "left",
              padding: `8px 12px 8px ${16 + depth * 16}px`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
            }}
          >
            <span style={{ width: 12 }} />
            <span>📄</span>
            <span>{node.name}</span>
          </button>
        )
      })}
    </div>
  )
}

export function DocsSidebar({
  nodes,
  selectedFile,
  expandedFolders,
  loading,
  onToggleFolder,
  onOpenFile,
  onRefresh,
  onBuild,
  buildLoading,
}: DocsSidebarProps) {
  return (
    <div
      style={{
        width: 320,
        minWidth: 320,
        maxWidth: 320,
        borderRight: "1px solid #e5e7eb",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#71717a",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Docs Files
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #d4d4d8",
              background: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>

          <button
            type="button"
            onClick={onBuild}
            disabled={buildLoading}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 6,
              border: "none",
              background: "#1e293b",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {buildLoading ? "Building…" : "Build"}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {nodes.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: "#71717a" }}>
            No docs files found.
          </div>
        ) : (
          <FileTree
            nodes={nodes}
            selectedFile={selectedFile}
            expandedFolders={expandedFolders}
            onToggleFolder={onToggleFolder}
            onOpenFile={onOpenFile}
          />
        )}
      </div>
    </div>
  )
}