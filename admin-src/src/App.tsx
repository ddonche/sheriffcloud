import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import SiteHeader from "./components/SiteHeader"
import { AuthModal } from "./components/AuthModal"
import { getSupabase } from "./supabase"
import CodeMirror, { EditorView } from "@uiw/react-codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { githubLight } from "@uiw/codemirror-theme-github"

type PortalResponse = {
  portals: string[]
}

type ListFilesResponse = {
  ok: boolean
  files: string[]
  stderr?: string
}

type ReadFileResponse = {
  ok: boolean
  path: string
  content: string
  stderr?: string
}

type BuildResponse = {
  ok: boolean
  code: number | null
  stdout: string
  stderr: string
}

type FrontmatterFields = {
  title: string
  author: string
  layout: string
  meta_kind: string
  meta_type: string
  summary: string
  gloss: string
}

type NavSection = "files" | "domains" | "settings" | "ai"

type FileTreeNode = {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileTreeNode[]
}

const API_BASE = `${window.location.origin}/api`

function parseApiPayload<T>(raw: string): T | null {
  try {
    const parsed = JSON.parse(raw)
    return (typeof parsed === "string" ? JSON.parse(parsed) : parsed) as T
  } catch {
    return null
  }
}

async function readJsonOrText<T>(res: Response): Promise<{ data: T | null; raw: string }> {
  const raw = await res.text()
  try {
    const parsed = JSON.parse(raw)
    return { data: (typeof parsed === "string" ? JSON.parse(parsed) : parsed) as T, raw }
  } catch {
    return { data: null, raw }
  }
}

const ICON_PATHS = {
  folder:
    "M128 512L512 512C547.3 512 576 483.3 576 448L576 208C576 172.7 547.3 144 512 144L362.7 144C355.8 144 349 141.8 343.5 137.6L305.1 108.8C294 100.5 280.5 96 266.7 96L128 96C92.7 96 64 124.7 64 160L64 448C64 483.3 92.7 512 128 512z",
  file:
    "M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z",
  domains:
    "M415.9 344L225 344C227.9 408.5 242.2 467.9 262.5 511.4C273.9 535.9 286.2 553.2 297.6 563.8C308.8 574.3 316.5 576 320.5 576C324.5 576 332.2 574.3 343.4 563.8C354.8 553.2 367.1 535.8 378.5 511.4C398.8 467.9 413.1 408.5 416 344zM224.9 296L415.8 296C413 231.5 398.7 172.1 378.4 128.6C367 104.2 354.7 86.8 343.3 76.2C332.1 65.7 324.4 64 320.4 64C316.4 64 308.7 65.7 297.5 76.2C286.1 86.8 273.8 104.2 262.4 128.6C242.1 172.1 227.8 231.5 224.9 296zM176.9 296C180.4 210.4 202.5 130.9 234.8 78.7C142.7 111.3 74.9 195.2 65.5 296L176.9 296zM65.5 344C74.9 444.8 142.7 528.7 234.8 561.3C202.5 509.1 180.4 429.6 176.9 344L65.5 344zM463.9 344C460.4 429.6 438.3 509.1 406 561.3C498.1 528.6 565.9 444.8 575.3 344L463.9 344zM575.3 296C565.9 195.2 498.1 111.3 406 78.7C438.3 130.9 460.4 210.4 463.9 296L575.3 296z",
  settings:
    "M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z",
  logs:
    "M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM216 288C229.3 288 240 298.7 240 312L240 424C240 437.3 229.3 448 216 448C202.7 448 192 437.3 192 424L192 312C192 298.7 202.7 288 216 288zM400 376C400 362.7 410.7 352 424 352C437.3 352 448 362.7 448 376L448 424C448 437.3 437.3 448 424 448C410.7 448 400 437.3 400 424L400 376zM320 192C333.3 192 344 202.7 344 216L344 424C344 437.3 333.3 448 320 448C306.7 448 296 437.3 296 424L296 216C296 202.7 306.7 192 320 192z",
  dashboard:
    "M96 128C78.3 128 64 142.3 64 160C64 177.7 78.3 192 96 192L182.7 192C195 220.3 223.2 240 256 240C288.8 240 317 220.3 329.3 192L544 192C561.7 192 576 177.7 576 160C576 142.3 561.7 128 544 128L329.3 128C317 99.7 288.8 80 256 80C223.2 80 195 99.7 182.7 128L96 128zM96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L342.7 352C355 380.3 383.2 400 416 400C448.8 400 477 380.3 489.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L489.3 288C477 259.7 448.8 240 416 240C383.2 240 355 259.7 342.7 288L96 288zM96 448C78.3 448 64 462.3 64 480C64 497.7 78.3 512 96 512L150.7 512C163 540.3 191.2 560 224 560C256.8 560 285 540.3 297.3 512L544 512C561.7 512 576 497.7 576 480C576 462.3 561.7 448 544 448L297.3 448C285 419.7 256.8 400 224 400C191.2 400 163 419.7 150.7 448L96 448z",
  features:
    "M192 384L88.5 384C63.6 384 48.3 356.9 61.1 335.5L114 247.3C122.7 232.8 138.3 224 155.2 224L250.2 224C326.3 95.1 439.8 88.6 515.7 99.7C528.5 101.6 538.5 111.6 540.3 124.3C551.4 200.2 544.9 313.7 416 389.8L416 484.8C416 501.7 407.2 517.3 392.7 526L304.5 578.9C283.2 591.7 256 576.3 256 551.5L256 448C256 412.7 227.3 384 192 384L191.9 384zM464 224C464 197.5 442.5 176 416 176C389.5 176 368 197.5 368 224C368 250.5 389.5 272 416 272C442.5 272 464 250.5 464 224z",
  pricing:
    "M345 151.2C354.2 143.9 360 132.6 360 120C360 97.9 342.1 80 320 80C297.9 80 280 97.9 280 120C280 132.6 285.9 143.9 295 151.2L226.6 258.8C216.6 274.5 195.3 278.4 180.4 267.2L120.9 222.7C125.4 216.3 128 208.4 128 200C128 177.9 110.1 160 88 160C65.9 160 48 177.9 48 200C48 221.8 65.5 239.6 87.2 240L119.8 457.5C124.5 488.8 151.4 512 183.1 512L456.9 512C488.6 512 515.5 488.8 520.2 457.5L552.8 240C574.5 239.6 592 221.8 592 200C592 177.9 574.1 160 552 160C529.9 160 512 177.9 512 200C512 208.4 514.6 216.3 519.1 222.7L459.7 267.3C444.8 278.5 423.5 274.6 413.5 258.9L345 151.2z",
  resource:
    "M192 64C156.7 64 128 92.7 128 128L128 544C128 555.5 134.2 566.2 144.2 571.8C154.2 577.4 166.5 577.3 176.4 571.4L320 485.3L463.5 571.4C473.4 577.3 485.7 577.5 495.7 571.8C505.7 566.1 512 555.5 512 544L512 128C512 92.7 483.3 64 448 64L192 64z",
  account:
    "M320 400C394.6 400 458.4 353.6 484 288L488 288C501.3 288 512 277.3 512 264L512 184C512 170.7 501.3 160 488 160L484 160C458.4 94.4 394.6 48 320 48C245.4 48 181.6 94.4 156 160L152 160C138.7 160 128 170.7 128 184L128 264C128 277.3 138.7 288 152 288L156 288C181.6 353.6 245.4 400 320 400zM304 144L336 144C389 144 432 187 432 240C432 293 389 336 336 336L304 336C251 336 208 293 208 240C208 187 251 144 304 144zM112 548.6C112 563.7 124.3 576 139.4 576L192 576L192 528C192 510.3 206.3 496 224 496L416 496C433.7 496 448 510.3 448 528L448 576L500.6 576C515.7 576 528 563.7 528 548.6C528 488.8 496.1 436.4 448.4 407.6C412 433.1 367.8 448 320 448C272.2 448 228 433.1 191.6 407.6C143.9 436.4 112 488.8 112 548.6zM279.3 205.5C278.4 202.2 275.4 200 272 200C268.6 200 265.6 202.2 264.7 205.5L258.7 226.7L237.5 232.7C234.2 233.6 232 236.6 232 240C232 243.4 234.2 246.4 237.5 247.3L258.7 253.3L264.7 274.5C265.6 277.8 268.6 280 272 280C275.4 280 278.4 277.8 279.3 274.5L285.3 253.3L306.5 247.3C309.8 246.4 312 243.4 312 240C312 236.6 309.8 233.6 306.5 232.7L285.3 226.7L279.3 205.5zM248 552L248 576L296 576L296 552C296 538.7 285.3 528 272 528C258.7 528 248 538.7 248 552zM368 528C354.7 528 344 538.7 344 552L344 576L392 576L392 552C392 538.7 381.3 528 368 528z",
  plus:
    "M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z",
  image:
    "M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM224 176C250.5 176 272 197.5 272 224C272 250.5 250.5 272 224 272C197.5 272 176 250.5 176 224C176 197.5 197.5 176 224 176zM368 288C376.4 288 384.1 292.4 388.5 299.5L476.5 443.5C481 450.9 481.2 460.2 477 467.8C472.8 475.4 464.7 480 456 480L184 480C175.1 480 166.8 475 162.7 467.1C158.6 459.2 159.2 449.6 164.3 442.3L220.3 362.3C224.8 355.9 232.1 352.1 240 352.1C247.9 352.1 255.2 355.9 259.7 362.3L286.1 400.1L347.5 299.6C351.9 292.5 359.6 288.1 368 288.1z",
  chat:
    "M512 64L128 64C92.7 64 64 92.7 64 128L64 384C64 419.3 92.7 448 128 448L192 448L192 544L320 448L512 448C547.3 448 576 419.3 576 384L576 128C576 92.7 547.3 64 512 64z",
} as const

function cleanPortalName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function siteUrlForPortal(portal: string) {
  const url = new URL(window.location.origin)

  if (url.hostname === "admin.localhost") {
    url.hostname = `${portal}.localhost`
  } else if (url.hostname.endsWith(".sheriffcloud.com")) {
    url.hostname = `${portal}.sheriffcloud.com`
  } else {
    url.hostname = `${portal}.${url.hostname}`
  }

  url.pathname = "/"
  url.search = ""
  url.hash = ""

  return url.toString()
}

function siteFaviconUrl(site: string) {
  return `${siteUrlForPortal(site).replace(/\/$/, "")}/public/favicon.ico`
}

function formatBuildOutput(portal: string, data: BuildResponse) {
  const statusLine =
    data.ok && data.code === 0
      ? `BUILD SUCCESS — ${portal}`
      : `BUILD FAILED — ${portal}`

  return [
    statusLine,
    "=".repeat(statusLine.length),
    `Portal: ${portal}`,
    `Exit Code: ${data.code ?? "n/a"}`,
    "",
    "STDOUT",
    "------",
    data.stdout || "(none)",
    "",
    "STDERR",
    "------",
    data.stderr || "(none)",
  ].join("\n")
}

function pickDefaultFile(files: string[]) {
  if (files.includes("content/index.md")) return "content/index.md"
  return files[0] ?? null
}

const META_KIND_OPTIONS = ["docs", "wiki", "blog", "article"]

const META_TYPE_OPTIONS = [
  "reference", "tutorial", "guide", "how-to", "overview", "quickstart",
  "api", "changelog", "faq", "entry", "portal", "index", "post", "editorial",
  "review", "announcement", "opinion", "case-study", "interview", "news",
  "definition", "concept", "walkthrough", "comparison", "landing",
]

function Tooltip({ text }: { text: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  function handleMouseEnter(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 })
  }

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setPos(null)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={13} height={13} style={{ display: "block", cursor: "default", opacity: 0.35, flexShrink: 0 }}>
        <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM320 240C302.3 240 288 254.3 288 272C288 285.3 277.3 296 264 296C250.7 296 240 285.3 240 272C240 227.8 275.8 192 320 192C364.2 192 400 227.8 400 272C400 319.2 364 339.2 344 346.5L344 350.3C344 363.6 333.3 374.3 320 374.3C306.7 374.3 296 363.6 296 350.3L296 342.2C296 321.7 310.8 307 326.1 302C332.5 299.9 339.3 296.5 344.3 291.7C348.6 287.5 352 281.7 352 272.1C352 254.4 337.7 240.1 320 240.1zM288 432C288 414.3 302.3 400 320 400C337.7 400 352 414.3 352 432C352 449.7 337.7 464 320 464C302.3 464 288 449.7 288 432z" fill="#71717a" />
      </svg>
      {pos && (
        <div style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          transform: "translate(-50%, -100%)",
          background: "#fff",
          color: "#111827",
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 1.5,
          padding: "8px 10px",
          borderRadius: 4,
          width: 260,
          zIndex: 2000,
          pointerEvents: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          border: "1px solid #d4d4d8",
          textTransform: "none",
          letterSpacing: 0,
        }}>
          {text}
        </div>
      )}
    </span>
  )
}

function parseFrontmatter(content: string): { fm: FrontmatterFields; body: string } | null {
  const firstDelim = content.indexOf("^^^^")
  if (firstDelim === -1 || content.slice(0, firstDelim).trim() !== "") return null

  const afterFirst = content.indexOf("\n", firstDelim) + 1
  const closeDelim = content.indexOf("^^^^", afterFirst)
  if (closeDelim === -1) return null

  const fmBlock = content.slice(afterFirst, closeDelim)
  const body = content.slice(closeDelim + 4)

  const fields: FrontmatterFields = {
    title: "", author: "", layout: "docs", meta_kind: "", meta_type: "", summary: "", gloss: "",
  }

  for (const line of fmBlock.split("\n")) {
    const colon = line.indexOf(": ")
    if (colon === -1) continue
    const key = line.slice(0, colon).trim() as keyof FrontmatterFields
    const val = line.slice(colon + 2)
    if (key in fields) fields[key] = val
  }

  return { fm: fields, body }
}

function serializeFrontmatter(fm: FrontmatterFields, body: string): string {
  return [
    "^^^^",
    `title: ${fm.title}`,
    `author: ${fm.author}`,
    `layout: ${fm.layout}`,
    `meta_kind: ${fm.meta_kind}`,
    `meta_type: ${fm.meta_type}`,
    `summary: ${fm.summary}`,
    `gloss: ${fm.gloss}`,
    "^^^^",
  ].join("\n") + body
}

function buildFileTree(paths: string[]): FileTreeNode[] {
  const root: FileTreeNode = {
    name: "root",
    path: "",
    type: "folder",
    children: [],
  }

  for (const fullPath of paths) {
    const parts = fullPath.split("/").filter(Boolean)
    let current = root
    let runningPath = ""

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i]
      runningPath = runningPath ? `${runningPath}/${part}` : part
      const isFile = i === parts.length - 1

      if (!current.children) current.children = []

      let found = current.children.find((child) => child.name === part)
      if (!found) {
        found = {
          name: part,
          path: runningPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        }
        current.children.push(found)
      }

      current = found
    }
  }

  function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
    return [...nodes]
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      .map((node) => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }))
  }

  return sortNodes(root.children ?? [])
}

function pathDepth(path: string) {
  return path.split("/").filter(Boolean).length - 1
}

function siteInitial(site: string) {
  return site.charAt(0).toUpperCase()
}

function isImageFile(name: string) {
  return /\.(png|jpe?g|gif|webp|svg|ico|avif|bmp|tiff?)$/i.test(name)
}

function SvgIcon({
  path,
  size = 16,
  color = "currentColor",
}: {
  path: string
  size?: number
  color?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 640"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d={path} fill={color} />
    </svg>
  )
}

function SiteBadge({ site, size = 22 }: { site: string; size?: number }) {
  const [failed, setFailed] = useState(false)

  if (!failed) {
    return (
      <img
        src={siteFaviconUrl(site)}
        alt={`${site} favicon`}
        width={size}
        height={size}
        style={{ ...styles.siteFavicon, width: size, height: size }}
        onError={() => setFailed(true)}
      />
    )
  }

  return <span style={{ ...styles.siteBadge, width: size, height: size }}>{siteInitial(site)}</span>
}


function FileTree({
  nodes,
  selectedFile,
  expandedFolders,
  onToggleFolder,
  onOpenFile,
  onDoubleClickFile,
}: {
  nodes: FileTreeNode[]
  selectedFile: string | null
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
  onOpenFile: (path: string) => void
  onDoubleClickFile?: (path: string) => void
}) {
  return (
    <div>
      {nodes.map((node) => {
        const depth = pathDepth(node.path)
        const isOpen = expandedFolders.has(node.path)
        const isSelected = selectedFile === node.path

        if (node.type === "folder") {
          return (
            <div key={node.path}>
              <button
                type="button"
                onClick={() => onToggleFolder(node.path)}
                style={{
                  ...styles.fileRow,
                  paddingLeft: 16 + depth * 18,
                  background: isOpen ? "#f3f4f6" : "#fff",
                }}
              >
                <span style={styles.fileRowLeft}>
                  <span style={styles.fileIcon}>{isOpen ? "▾" : "▸"}</span>
                  <span style={styles.fileIcon}><SvgIcon path={ICON_PATHS.folder} size={16} color="#d97706" /></span>
                  <span>{node.name}</span>
                </span>
              </button>

              {isOpen && node.children && (
                <FileTree
                  nodes={node.children}
                  selectedFile={selectedFile}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  onOpenFile={onOpenFile}
                  onDoubleClickFile={onDoubleClickFile}
                />
              )}
            </div>
          )
        }

        const isImage = isImageFile(node.name)

        return (
          <button
            key={node.path}
            type="button"
            onClick={() => onOpenFile(node.path)}
            onDoubleClick={isImage ? () => onDoubleClickFile?.(node.path) : undefined}
            style={{
              ...styles.fileRow,
              paddingLeft: 16 + depth * 18,
              background: isSelected ? "#3296ab" : "#fff",
              color: isSelected ? "#fff" : "#111827",
            }}
          >
            <span style={styles.fileRowLeft}>
              <span style={styles.fileIcon}>
                {isImage
                  ? <SvgIcon path={ICON_PATHS.image} size={16} color={isSelected ? "#fff" : "#16a34a"} />
                  : <SvgIcon path={ICON_PATHS.file} size={16} color={isSelected ? "#fff" : "#3296ab"} />
                }
              </span>
              <span>{node.name}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Multi-AI Chat Panel ──────────────────────────────────────────────────────

type AiProvider = "chatgpt" | "gemini" | "claude" | "grok"

type AiMode = "collaborative" | "balanced" | "adversarial" | "decision"

type AiSession = {
  id: string
  title: string
  first_speaker: string
  participants: AiProvider[]
  mode: AiMode
  created_at: string
}

type AiMessage = {
  id: string
  role: string
  model: string
  content: string
  created_at: string
}

const AI_PROVIDERS: { id: AiProvider; label: string; color: string }[] = [
  { id: "chatgpt", label: "ChatGPT",  color: "#10a37f" },
  { id: "gemini",  label: "Gemini",   color: "#4285f4" },
  { id: "claude",  label: "Claude",   color: "#c96442" },
  { id: "grok",    label: "Grok",     color: "#8b5cf6" },
]

const AI_MODES: { id: AiMode; label: string; color: string; desc: string; icon: string }[] = [
  { id: "collaborative", label: "Collaborative", color: "#ea7c1e", desc: "Build on each other — brainstorming, writing, ideation",
    icon: "M300.9 117.2L184.3 246.8C179.7 251.9 179.9 259.8 184.8 264.7C215.3 295.2 264.8 295.2 295.3 264.7L327.1 232.9C331.3 228.7 336.6 226.4 342 226C348.8 225.4 355.8 227.7 361 232.9L537.6 408L608 352L608 64L496 128L472.2 112.1C456.4 101.6 437.9 96 418.9 96L348.5 96C347.4 96 346.2 96 345.1 96.1C328.2 97 312.3 104.6 300.9 117.2zM148.6 214.7L255.4 96L215.8 96C190.3 96 165.9 106.1 147.9 124.1L32 256L32 608L176 472L188.4 482.3C211.4 501.5 240.4 512 270.3 512L286 512L279 505C269.6 495.6 269.6 480.4 279 471.1C288.4 461.8 303.6 461.7 312.9 471.1L353.9 512.1L362.9 512.1C382 512.1 400.7 507.8 417.7 499.8L391 473C381.6 463.6 381.6 448.4 391 439.1C400.4 429.8 415.6 429.7 424.9 439.1L456.9 471.1L474.4 453.6C483.3 444.7 485.9 431.8 482 420.5L344.1 283.7L329.2 298.6C279.9 347.9 200.1 347.9 150.8 298.6C127.8 275.6 126.9 238.7 148.6 214.6z" },
  { id: "balanced",      label: "Balanced",      color: "#3296ab", desc: "Agree or disagree, call out weak points — general use",
    icon: "M384 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L398.4 160C393.2 185.8 375.5 207.1 352 217.3L352 512L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L128 576C110.3 576 96 561.7 96 544C96 526.3 110.3 512 128 512L288 512L288 217.3C264.5 207 246.8 185.7 241.6 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L256 96C270.6 76.6 293.8 64 320 64C346.2 64 369.4 76.6 384 96zM439.6 384L584.4 384L512 259.8L439.6 384zM512 480C449.1 480 396.8 446 386 401.1C383.4 390.1 387 378.8 392.7 369L487.9 205.8C492.9 197.2 502.1 192 512 192C521.9 192 531.1 197.3 536.1 205.8L631.3 369C637 378.8 640.6 390.1 638 401.1C627.2 445.9 574.9 480 512 480zM126.8 259.8L54.4 384L199.3 384L126.8 259.8zM.9 401.1C-1.7 390.1 1.9 378.8 7.6 369L102.8 205.8C107.8 197.2 117 192 126.9 192C136.8 192 146 197.3 151 205.8L246.2 369C251.9 378.8 255.5 390.1 252.9 401.1C242.1 445.9 189.8 480 126.9 480C64 480 11.7 446 .9 401.1z" },
  { id: "adversarial",   label: "Adversarial",   color: "#dc2626", desc: "Pressure test everything — strategy, validation",
    icon: "M288 64C305.7 64 320 78.3 320 96L320 208L256 208L256 96C256 78.3 270.3 64 288 64zM160 128C160 110.3 174.3 96 192 96C209.7 96 224 110.3 224 128L224 208L160 208L160 128zM352 128C352 110.3 366.3 96 384 96C401.7 96 416 110.3 416 128L416 224C416 241.7 401.7 256 384 256C366.3 256 352 241.7 352 224L352 128zM448 192C448 174.3 462.3 160 480 160C497.7 160 512 174.3 512 192L512 256C512 273.7 497.7 288 480 288C462.3 288 448 273.7 448 256L448 192zM352 280L352 279.4C361.4 284.8 372.3 288 384 288C397.2 288 409.4 284 419.6 277.2C428.3 302.1 452.1 320 480 320C491.7 320 502.6 316.9 512 311.4L512 320C512 372.3 486.9 418.8 448 448L448 544C448 561.7 433.7 576 416 576L256 576C238.3 576 224 561.7 224 544L224 465.6C206.7 457.7 190.8 446.8 177.1 433.1L165.5 421.5C141.5 397.5 128 364.9 128 331L128 304C128 268.7 156.7 240 192 240L280 240C302.1 240 320 257.9 320 280C320 302.1 302.1 320 280 320L224 320C215.2 320 208 327.2 208 336C208 344.8 215.2 352 224 352L280 352C319.8 352 352 319.8 352 280z" },
  { id: "decision",      label: "Decision",      color: "#9333ea", desc: "Debate first, then converge on a recommendation",
    icon: "M201.6 217.4L182.9 198.7C170.4 186.2 170.4 165.9 182.9 153.4L297.6 38.6C310.1 26.1 330.4 26.1 342.9 38.6L361.6 57.4C374.1 69.9 374.1 90.2 361.6 102.7L246.9 217.4C234.4 229.9 214.1 229.9 201.6 217.4zM308 275.7L276.6 244.3L388.6 132.3L508 251.7L396 363.7L364.6 332.3L132.6 564.3C117 579.9 91.7 579.9 76 564.3C60.3 548.7 60.4 523.4 76 507.7L308 275.7zM422.9 438.6C410.4 426.1 410.4 405.8 422.9 393.3L537.6 278.6C550.1 266.1 570.4 266.1 582.9 278.6L601.6 297.3C614.1 309.8 614.1 330.1 601.6 342.6L486.9 457.4C474.4 469.9 454.1 469.9 441.6 457.4L422.9 438.7z" },
]

function providerColor(role: string) {
  return AI_PROVIDERS.find(p => p.id === role)?.color ?? "#71717a"
}

function providerLabel(role: string) {
  if (role === "user") return "You"
  return AI_PROVIDERS.find(p => p.id === role)?.label ?? role
}

function AiPanel({ supabase }: { supabase: any }) {
  const [sessions, setSessions] = useState<AiSession[]>([])
  const [selectedSession, setSelectedSession] = useState<AiSession | null>(null)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [userMessage, setUserMessage] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newParticipants, setNewParticipants] = useState<AiProvider[]>(["chatgpt", "gemini"])
  const [newMode, setNewMode] = useState<AiMode>("balanced")
  const [openingMessage, setOpeningMessage] = useState("")
  const [showNewForm, setShowNewForm] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [openaiKey, setOpenaiKey] = useState("")
  const [geminiKey, setGeminiKey] = useState("")
  const [claudeKey, setClaudeKey] = useState("")
  const [grokKey, setGrokKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [runningModel, setRunningModel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // ── Speech recognition ───────────────────────────────────────────────────────
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  function toggleListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError("Speech recognition not supported in this browser."); return }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = "en-US"
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(" ")
      setUserMessage(prev => prev ? prev + " " + transcript : transcript)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  async function invoke(fn: string, body: any) {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const res = await fetch(`${supabaseUrl}/functions/v1/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })

    const { data, raw } = await readJsonOrText<any>(res)

    if (!data) {
      return {
        data: null,
        error: { message: raw || `HTTP ${res.status}` },
      }
    }

    const error = res.ok ? null : { message: data?.error ?? raw ?? `HTTP ${res.status}` }
    return { data, error }
  }

  useEffect(() => { loadSessions(); loadSavedKeys() }, [])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    })
  }, [messages])

  async function loadSavedKeys() {
    const { data, error } = await supabase
      .from("ai_credentials")
      .select("provider")
    if (!error && data) setSavedKeys(new Set(data.map((r: any) => r.provider)))
  }

  async function loadSessions() {
    const { data, error } = await supabase
      .from("ai_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error) setSessions(data || [])
  }

  async function loadMessages(sessionId: string) {
    const { data, error } = await supabase.from("ai_messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true })
    if (!error) setMessages(data || [])
  }

  async function selectSession(session: AiSession) {
    setSelectedSession(session)
    await loadMessages(session.id)
  }

  async function createSession() {
    if (!newTitle.trim() || newParticipants.length < 1) return
    setLoading(true); setError(null)
    const { data, error } = await invoke("create_ai_session", {
      title: newTitle,
      first_speaker: newParticipants[0],
      participants: newParticipants,
      mode: newMode,
      opening_message: openingMessage || undefined,
    })
    setLoading(false)
    if (error || !data?.ok) { setError(error?.message || data?.error || "Failed to create session"); return }
    setShowNewForm(false); setNewTitle(""); setOpeningMessage(""); setNewParticipants(["chatgpt", "gemini"]); setNewMode("balanced")
    await loadSessions()
    if (data.session) await selectSession(data.session)
  }

  async function addMessage() {
    if (!userMessage.trim() || !selectedSession) return
    setLoading(true); setError(null)
    const { data, error } = await invoke("add_ai_message", {
      session_id: selectedSession.id,
      content: userMessage,
      pause_session: true,
    })
    setLoading(false)
    if (error || !data?.ok) { setError(error?.message || data?.error || "Failed to add message"); return }
    setUserMessage("")
    await loadMessages(selectedSession.id)
  }

  async function runTurn(model?: string) {
    if (!selectedSession) return
    const key = model ?? "auto"
    setRunningModel(key); setError(null)
    const { data, error } = await invoke("run_ai_turn", {
      session_id: selectedSession.id,
      ...(model ? { model } : {}),
      mode: selectedSession.mode ?? "balanced",
    })
    setRunningModel(null)
    if (error || !data?.ok) { setError(error?.message || data?.error || "Failed to run turn"); return }
    await loadMessages(selectedSession.id)
  }

  async function saveCredentials() {
    setLoading(true); setError(null)
    try {
      const pairs: [string, string][] = [
        ["openai", openaiKey],
        ["gemini", geminiKey],
        ["claude", claudeKey],
        ["grok",   grokKey],
      ]
      for (const [provider, secret] of pairs) {
        if (!secret.trim()) continue
        const { data, error } = await invoke("save_ai_credentials", { provider, label: "default", secret: secret.trim() })
        if (error) throw error
        if (!data?.ok) throw new Error(data?.error || `Failed to save ${provider} key`)
      }
      setShowCredentials(false); setOpenaiKey(""); setGeminiKey(""); setClaudeKey(""); setGrokKey("")
      await loadSavedKeys()
    } catch (err: any) {
      setError(err.message || "Failed to save credentials")
    } finally {
      setLoading(false)
    }
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Delete this session and all its messages?")) return
    await supabase.from("ai_messages").delete().eq("session_id", id)
    await supabase.from("ai_sessions").delete().eq("id", id)
    if (selectedSession?.id === id) setSelectedSession(null)
    await loadSessions()
  }

  const [mobileTab, setMobileTab] = useState<"chat" | "sessions">("chat")
  const [showKeyHelp, setShowKeyHelp] = useState(false)

  // ── shared sub-components ──────────────────────────────────────────

  function renderSessionsList(onSelect?: () => void) { return (
    <>
      {showCredentials && (
        <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", display: "grid", gap: 6, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#71717a", letterSpacing: "0.08em", textTransform: "uppercase" }}>API Keys</div>
            <button onClick={() => setShowKeyHelp(v => !v)} style={{ fontSize: 11, color: "#3296ab", background: "none", border: "none", cursor: "pointer", padding: "0 2px", fontWeight: 600, textDecoration: "underline" }}>
              {showKeyHelp ? "Hide help" : "How do I get these?"}
            </button>
          </div>
          {showKeyHelp && (
            <div style={{ display: "grid", gap: 6, background: "#f8f9fa", border: "1px solid #e5e7eb", borderRadius: 5, padding: "10px 12px", fontSize: 12, lineHeight: 1.6 }}>
              {[
                { name: "ChatGPT (OpenAI)", color: "#10a37f", url: "https://platform.openai.com/api-keys", steps: "API keys → Create new secret key" },
                { name: "Gemini (Google)",  color: "#4285f4", url: "https://aistudio.google.com/apikey", steps: "Get API key → Create API key" },
                { name: "Claude (Anthropic)", color: "#c96442", url: "https://console.anthropic.com/settings/keys", steps: "API Keys → Create Key" },
                { name: "Grok (xAI)",       color: "#8b5cf6", url: "https://console.x.ai/", steps: "API Keys → Create API Key" },
              ].map(({ name, color, url, steps }) => (
                <div key={name}>
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color, textDecoration: "none", borderBottom: `1px solid ${color}` }}>{name} ↗</a>
                  <div style={{ color: "#52525b" }}>{steps}</div>
                </div>
              ))}
              <div style={{ color: "#71717a", fontSize: 11, borderTop: "1px solid #e5e7eb", paddingTop: 6, marginTop: 2 }}>
                Keys are stored encrypted and never shared.
              </div>
            </div>
          )}
          {[
            { label: "OpenAI key",  provider: "openai", val: openaiKey,  set: setOpenaiKey  },
            { label: "Gemini key",  provider: "gemini", val: geminiKey,  set: setGeminiKey  },
            { label: "Claude key",  provider: "claude", val: claudeKey,  set: setClaudeKey  },
            { label: "Grok key",    provider: "grok",   val: grokKey,    set: setGrokKey    },
          ].map(({ label, provider, val, set }) => {
            const hasSaved = savedKeys.has(provider)
            return (
              <div key={label} style={{ position: "relative" }}>
                <input placeholder={hasSaved ? "••••••••••••••••" : label} value={val} onChange={(e) => set(e.target.value)} type="password"
                  style={{ padding: "6px 8px", border: `1px solid ${hasSaved ? "#3296ab" : "#d4d4d8"}`, borderRadius: 4, fontSize: 13, width: "100%", boxSizing: "border-box" as const }} />
                {hasSaved && !val && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, fontWeight: 700, color: "#3296ab", pointerEvents: "none" }}>saved</span>}
              </div>
            )
          })}
          <button onClick={saveCredentials} disabled={loading}
            style={{ padding: "7px", background: "#3296ab", color: "#fff", border: "none", borderRadius: 4, fontSize: 13, cursor: "pointer" }}>Save Keys</button>
        </div>
      )}
      {showNewForm && (
        <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", display: "grid", gap: 8 }}>
          <input placeholder="Session title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            style={{ padding: "6px 8px", border: "1px solid #d4d4d8", borderRadius: 4, fontSize: 13, width: "100%", boxSizing: "border-box" as const }} />

          <div style={{ fontSize: 11, fontWeight: 700, color: "#71717a", letterSpacing: "0.08em", textTransform: "uppercase" }}>Participants</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {AI_PROVIDERS.map(p => {
              const on = newParticipants.includes(p.id)
              return (
                <button key={p.id} type="button"
                  onClick={() => setNewParticipants(prev => on ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                  style={{ padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${p.color}`, background: on ? p.color : "transparent", color: on ? "#fff" : p.color }}>
                  {p.label}
                </button>
              )
            })}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: "#71717a", letterSpacing: "0.08em", textTransform: "uppercase" }}>Mode</div>
          <div style={{ display: "grid", gap: 4 }}>
            {AI_MODES.map(m => {
              const selected = newMode === m.id
              return (
                <button key={m.id} type="button" onClick={() => setNewMode(m.id)}
                  style={{ display: "flex", alignItems: "stretch", gap: 0, borderRadius: 5, cursor: "pointer", textAlign: "left", border: `1.5px solid ${selected ? m.color : "#d4d4d8"}`, background: selected ? m.color + "12" : "transparent", color: "#18181b", overflow: "hidden", padding: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", background: selected ? m.color : "#f1f3f5", padding: "10px 12px", flexShrink: 0, transition: "background 0.15s" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="22" height="22" fill={selected ? "#fff" : m.color}><path d={m.icon}/></svg>
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "8px 10px", gap: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: selected ? m.color : "#18181b" }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: "#71717a", lineHeight: 1.4 }}>{m.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <textarea placeholder="Opening message (optional)" value={openingMessage} onChange={(e) => setOpeningMessage(e.target.value)}
            rows={2} style={{ padding: "6px 8px", border: "1px solid #d4d4d8", borderRadius: 4, fontSize: 13, resize: "vertical", width: "100%", boxSizing: "border-box" as const }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={createSession} disabled={loading || !newTitle.trim() || newParticipants.length < 1}
              style={{ flex: 1, padding: "8px", background: "#3296ab", color: "#fff", border: "none", borderRadius: 4, fontSize: 13, cursor: "pointer", opacity: !newTitle.trim() || newParticipants.length < 1 ? 0.5 : 1 }}>Create</button>
            <button onClick={() => setShowNewForm(false)}
              style={{ flex: 1, padding: "8px", background: "none", border: "1px solid #d4d4d8", borderRadius: 4, fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {sessions.length === 0 && <div style={{ padding: 16, fontSize: 13, color: "#71717a" }}>No sessions yet.</div>}
        {sessions.map((s) => {
          const participants: AiProvider[] = s.participants ?? [s.first_speaker as AiProvider]
          const mode = AI_MODES.find(m => m.id === (s.mode ?? "balanced"))
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid #f1f3f5", background: selectedSession?.id === s.id ? "#e8f4f7" : "#fff" }}>
              <button onClick={() => { selectSession(s); onSelect?.() }}
                style={{ flex: 1, padding: "10px 12px", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#18181b", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                  {participants.map(pid => {
                    const p = AI_PROVIDERS.find(x => x.id === pid)
                    return p ? <span key={pid} style={{ fontSize: 10, fontWeight: 700, color: p.color, background: p.color + "18", padding: "1px 5px", borderRadius: 3 }}>{p.label}</span> : null
                  })}
                  {mode && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#71717a" }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="14" height="14" fill={mode.color}><path d={mode.icon}/></svg>{mode.label}</span>}
                </div>
              </button>
              <button onClick={(e) => deleteSession(s.id, e)}
                style={{ padding: "0 12px", border: "none", background: "transparent", cursor: "pointer", color: "#dc2626", flexShrink: 0 }} title="Delete session">
                <svg viewBox="0 0 576 640" width="13" height="13" fill="currentColor"><path d="M163.8 0L148.1 38.4C142.8 51.5 130.1 60 115.8 60L16 60C7.2 60 0 67.2 0 76L0 104C0 112.8 7.2 120 16 120L528 120C536.8 120 544 112.8 544 104L544 76C544 67.2 536.8 60 528 60L428.3 60C414 60 401.3 51.5 396 38.4L380.2 0L163.8 0zM32 160L64 544C66 568 85.8 586 110 586L434 586C458.2 586 478 568 480 544L512 160L32 160z"/></svg>
              </button>
            </div>
          )
        })}
      </div>
    </>
  ) }

  const transcriptScrollRef = useRef<HTMLDivElement | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  function handleTranscriptScroll(e: React.UIEvent<HTMLDivElement>) {
    setShowScrollTop((e.currentTarget as HTMLDivElement).scrollTop > 200)
  }

  function scrollToTop() {
    transcriptScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  function renderTranscript() {
    const participants: AiProvider[] = selectedSession?.participants ?? (selectedSession ? [selectedSession.first_speaker as AiProvider] : [])
    const anyRunning = runningModel !== null

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", position: "relative" }}>
        {error && <div style={{ margin: "8px 16px", padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, fontSize: 13, color: "#dc2626", flexShrink: 0 }}>{error}</div>}
        <div
          ref={transcriptScrollRef}
          onScroll={handleTranscriptScroll}
          style={{
            flex: 1,
            overflowY: "auto",
            paddingTop: 16,
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 140,
            boxSizing: "border-box",
          }}
        >
          {!selectedSession && <div style={{ color: "#71717a", fontSize: 14, textAlign: "center", marginTop: 40 }}>Select a session to begin.</div>}
          {messages.map((m) => (
            <div key={m.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: providerColor(m.role), textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {providerLabel(m.role)}
                </span>
                <span style={{ fontSize: 11, color: "#a1a1aa" }}>{new Date(m.created_at).toLocaleTimeString()}</span>
              </div>
              <div style={{ padding: "10px 14px", background: m.role === "user" ? "#f4f4f5" : "#fff", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", borderLeft: `3px solid ${providerColor(m.role)}` }}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {showScrollTop && (
          <button onClick={scrollToTop} title="Back to top"
            style={{ position: "absolute", bottom: 90, right: 20, width: 34, height: 34, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, padding: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="34" height="34" fill="#3296ab"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM441 335C450.4 344.4 450.4 359.6 441 368.9C431.6 378.2 416.4 378.3 407.1 368.9L320.1 281.9L233.1 368.9C223.7 378.3 208.5 378.3 199.2 368.9C189.9 359.5 189.8 344.3 199.2 335L303 231C312.4 221.6 327.6 221.6 336.9 231L441 335z"/></svg>
          </button>
        )}

        {/* ── Input area ── */}
        <div style={{ borderTop: "1px solid #e5e7eb", flexShrink: 0 }}>
          {/* Textarea + mic */}
          <div style={{ display: "flex", gap: 8, padding: "10px 12px 6px" }}>
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addMessage() } }}
              placeholder="Add a user message…"
              rows={2}
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #d4d4d8", borderRadius: 4, fontSize: 14, resize: "none", fontFamily: "inherit" }}
            />
            <button onClick={toggleListening} title={listening ? "Stop recording" : "Voice input"}
              className={listening ? "ai-mic-listening" : undefined}
              style={{ alignSelf: "flex-end", padding: "8px", background: listening ? "#fef2f2" : "transparent", border: `1.5px solid ${listening ? "#dc2626" : "#d4d4d8"}`, borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: listening ? "#dc2626" : "#71717a", flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="16" height="16" fill="currentColor"><path d="M320 64C267 64 224 107 224 160L224 288C224 341 267 384 320 384C373 384 416 341 416 288L416 160C416 107 373 64 320 64zM176 248C176 234.7 165.3 224 152 224C138.7 224 128 234.7 128 248L128 288C128 385.9 201.3 466.7 296 478.5L296 528L248 528C234.7 528 224 538.7 224 552C224 565.3 234.7 576 248 576L392 576C405.3 576 416 565.3 416 552C416 538.7 405.3 528 392 528L344 528L344 478.5C438.7 466.7 512 385.9 512 288L512 248C512 234.7 501.3 224 488 224C474.7 224 464 234.7 464 248L464 288C464 367.5 399.5 432 320 432C240.5 432 176 367.5 176 288L176 248z"/></svg>
            </button>
          </div>
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6, padding: "0 12px 10px", flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={addMessage} disabled={anyRunning || !userMessage.trim()}
              style={{ padding: "7px 14px", background: "#3296ab", color: "#fff", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !userMessage.trim() || anyRunning ? 0.5 : 1 }}>
              Send Reply
            </button>
            <div style={{ width: 1, height: 24, background: "#e5e7eb", flexShrink: 0 }} />
            {selectedSession && participants.map(pid => {
              const p = AI_PROVIDERS.find(x => x.id === pid)
              if (!p) return null
              const isRunning = runningModel === pid
              return (
                <button key={pid} onClick={() => runTurn(pid)} disabled={anyRunning}
                  style={{ padding: "7px 12px", background: isRunning ? p.color : "transparent", color: isRunning ? "#fff" : p.color, border: `1.5px solid ${p.color}`, borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: anyRunning ? "not-allowed" : "pointer", opacity: anyRunning && !isRunning ? 0.4 : 1 }}>
                  {isRunning ? "…" : `→ ${p.label}`}
                </button>
              )
            })}
            <button onClick={() => runTurn()} disabled={anyRunning || !selectedSession}
              style={{ padding: "7px 12px", background: runningModel === "auto" ? "#18181b" : "transparent", color: runningModel === "auto" ? "#fff" : "#18181b", border: "1.5px solid #18181b", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: anyRunning || !selectedSession ? "not-allowed" : "pointer", opacity: (anyRunning && runningModel !== "auto") || !selectedSession ? 0.4 : 1 }}>
              {runningModel === "auto" ? "…" : "Auto Next"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const iconKey = <svg viewBox="0 0 640 640" width="15" height="15" fill="currentColor"><path d="M400 416C497.2 416 576 337.2 576 240C576 142.8 497.2 64 400 64C302.8 64 224 142.8 224 240C224 258.7 226.9 276.8 232.3 293.7L71 455C66.5 459.5 64 465.6 64 472L64 552C64 565.3 74.7 576 88 576L168 576C181.3 576 192 565.3 192 552L192 512L232 512C245.3 512 256 501.3 256 488L256 448L296 448C302.4 448 308.5 445.5 313 441L346.3 407.7C363.2 413.1 381.3 416 400 416zM440 160C462.1 160 480 177.9 480 200C480 222.1 462.1 240 440 240C417.9 240 400 222.1 400 200C400 177.9 417.9 160 440 160z"/></svg>
  const iconPlus = <svg viewBox="0 0 640 640" width="15" height="15" fill="currentColor"><path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/></svg>

  return (
    <>
      <style>{`
        .ai-desktop { display: flex; flex: 1; min-height: 0; overflow: hidden; }
        .ai-mobile { display: none; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
        @media (max-width: 900px) {
          .ai-desktop { display: none; }
          .ai-mobile { display: flex; }
        }
        @keyframes ai-mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
          50% { box-shadow: 0 0 0 7px rgba(220,38,38,0); }
        }
        .ai-mic-listening {
          animation: ai-mic-pulse 1.2s ease-in-out infinite;
        }
      `}</style>

      {/* ── DESKTOP ── */}
      <div className="ai-desktop">
        <div style={{ width: 260, borderRight: "1px solid #d4d4d8", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#71717a" }}>Sessions</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setShowCredentials((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: showCredentials ? "#3296ab" : "#71717a", padding: 4, display: "flex" }} title="API Keys">{iconKey}</button>
              <button onClick={() => setShowNewForm((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: showNewForm ? "#3296ab" : "#71717a", padding: 4, display: "flex" }} title="New Session">{iconPlus}</button>
            </div>
          </div>
          {renderSessionsList()}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #e5e7eb", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedSession?.title ?? "Rodeo AI Chat"}</span>
            {selectedSession && (() => {
              const mode = AI_MODES.find(m => m.id === (selectedSession.mode ?? "balanced"))
              return mode ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: mode.color, background: mode.color + "18", padding: "2px 7px", borderRadius: 3 }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="11" height="11" fill={mode.color}><path d={mode.icon}/></svg>{mode.label}</span> : null
            })()}
          </div>
          {renderTranscript()}
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="ai-mobile">
        <div style={{ display: "flex", borderBottom: "1px solid #d4d4d8", flexShrink: 0 }}>
          <button onClick={() => setMobileTab("chat")} style={{ flex: 1, padding: "12px", border: "none", borderBottom: mobileTab === "chat" ? "2px solid #3296ab" : "2px solid transparent", background: "none", fontWeight: mobileTab === "chat" ? 700 : 400, color: mobileTab === "chat" ? "#3296ab" : "#71717a", fontSize: 14, cursor: "pointer" }}>
            Chat {selectedSession && `· ${selectedSession.title.slice(0, 18)}${selectedSession.title.length > 18 ? "…" : ""}`}
          </button>
          <button onClick={() => setMobileTab("sessions")} style={{ flex: 1, padding: "12px", border: "none", borderBottom: mobileTab === "sessions" ? "2px solid #3296ab" : "2px solid transparent", background: "none", fontWeight: mobileTab === "sessions" ? 700 : 400, color: mobileTab === "sessions" ? "#3296ab" : "#71717a", fontSize: 14, cursor: "pointer" }}>
            Sessions ({sessions.length})
          </button>
        </div>
        {mobileTab === "chat" && renderTranscript()}
        {mobileTab === "sessions" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#71717a", letterSpacing: "0.08em", textTransform: "uppercase" }}>Sessions</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => setShowCredentials((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: showCredentials ? "#3296ab" : "#71717a", padding: 4, display: "flex" }} title="API Keys">{iconKey}</button>
                <button onClick={() => setShowNewForm((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: showNewForm ? "#3296ab" : "#71717a", padding: 4, display: "flex" }} title="New Session">{iconPlus}</button>
              </div>
            </div>
            {renderSessionsList(() => setMobileTab("chat"))}
          </div>
        )}
      </div>
    </>
  )
}

export default function App() {
  const [supabase, setSupabase] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  const [portals, setPortals] = useState<string[]>([])
  const [loadingPortals, setLoadingPortals] = useState(false)

  const [portalFiles, setPortalFiles] = useState<string[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [loadingFileContent, setLoadingFileContent] = useState(false)
  const [savingFile, setSavingFile] = useState(false)

  const [newPortal, setNewPortal] = useState("")
  const [creatingPortal, setCreatingPortal] = useState(false)
  const [showNewSiteForm, setShowNewSiteForm] = useState(false)

  const [buildingPortal, setBuildingPortal] = useState<string | null>(null)
  const [deletingPortal, setDeletingPortal] = useState<string | null>(null)
  const [buildOutput, setBuildOutput] = useState("")
  const [deleteConfirmName, setDeleteConfirmName] = useState("")

  const [uploadState, setUploadState] = useState<"idle" | "starting" | "uploading" | "success" | "failed">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const [uploadLog, setUploadLog] = useState("")
  const uploadPollRef = useRef<number | null>(null)

  const [selectedPortal, setSelectedPortal] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [logOpen, setLogOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<NavSection>("files")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [fileBrowserWidth, setFileBrowserWidth] = useState(320)
  const [isResizingFiles, setIsResizingFiles] = useState(false)
  const [showDeleteSite, setShowDeleteSite] = useState(false)

  const [showNewPageModal, setShowNewPageModal] = useState(false)
  const [newPageName, setNewPageName] = useState("")
  const [newPageFolder, setNewPageFolder] = useState("content")
  const [creatingPage, setCreatingPage] = useState(false)

  const [frontmatter, setFrontmatter] = useState<FrontmatterFields | null>(null)
  const [bodyContent, setBodyContent] = useState("")
  const [showFrontmatter, setShowFrontmatter] = useState(false)

  const editorViewRef = useRef<EditorView | null>(null)
  const [fileSearch, setFileSearch] = useState("")
  const [editorFontSize, setEditorFontSize] = useState(14)

  const [showImagePanel, setShowImagePanel] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageCaption, setImageCaption] = useState("")
  const [imageSize, setImageSize] = useState("full")
  const [imageAlign, setImageAlign] = useState("center")
  const [uploadingImage, setUploadingImage] = useState(false)

  const [profileError, setProfileError] = useState("")
  const profileLoadSeq = useRef(0)

  useEffect(() => {
    return () => clearUploadPoll()
  }, [])

  function getCachedProfile(userId: string) {
    try {
      const raw = localStorage.getItem(`sc_profile_${userId}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function setCachedProfile(userId: string, value: any) {
    try {
      localStorage.setItem(`sc_profile_${userId}`, JSON.stringify(value))
    } catch {}
  }

  function clearCachedProfile(userId?: string) {
    if (!userId) return
    try {
      localStorage.removeItem(`sc_profile_${userId}`)
    } catch {}
  }

  async function loadProfile(client: any, userId: string, attempt = 1) {
    const seq = ++profileLoadSeq.current

    // Only show loading screen if we don't already have a profile
    const alreadyHaveProfile = !!getCachedProfile(userId)
    if (!alreadyHaveProfile) {
      setProfileLoaded(false)
    }
    setProfileError("")

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (seq !== profileLoadSeq.current) return

    if (error) {
      const message = String(error.message ?? "")

      if (
        message.includes("Lock broken by another request with the 'steal' option.") &&
        attempt < 2
      ) {
        setTimeout(() => {
          loadProfile(client, userId, attempt + 1)
        }, 150)
        return
      }

      clearCachedProfile(userId)

      setProfile(null)
      setProfileError(
        `userId=${userId}\ncode=${error.code ?? ""}\nmessage=${message}`
      )
      setProfileLoaded(true)
      return
    }

    setProfile(data)
    setCachedProfile(userId, data)
    setProfileLoaded(true)
  }

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
    if (link) link.href = "./favicon.ico"

    const client = getSupabase()
    if (!client) return

    setSupabase(client)

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)

      const userId = nextSession?.user?.id ?? null

      if (!userId || event === "SIGNED_OUT") {
        profileLoadSeq.current += 1
        clearCachedProfile(session?.user?.id)
        setProfile(null)
        setProfileError("")
        setProfileLoaded(true)
        return
      }

      const cached = getCachedProfile(userId)

      if (cached) {
        setProfile(cached)
        setProfileError("")
        setProfileLoaded(true)
      }

      if (event === "TOKEN_REFRESHED") {
        return
      }

      if (event === "INITIAL_SESSION" && cached) {
        return
      }

      setTimeout(() => {
        loadProfile(client, userId)
      }, 0)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    void loadPortals()
  }, [session])

  useEffect(() => {
    if (!isResizingFiles) return

    function onMouseMove(e: MouseEvent) {
      const appMain = document.getElementById("sc-files-layout")
      if (!appMain) return

      const rect = appMain.getBoundingClientRect()
      const next = Math.max(220, Math.min(640, e.clientX - rect.left))
      setFileBrowserWidth(next)
    }

    function onMouseUp() {
      setIsResizingFiles(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizingFiles])

  

  useEffect(() => {
    if (!selectedPortal && portals.length > 0) {
      const next = portals[0]
      setSelectedPortal(next)
      void loadFiles(next)
      return
    }

    if (selectedPortal && !portals.includes(selectedPortal)) {
      const next = portals[0] ?? null
      setSelectedPortal(next)

      if (next) {
        void loadFiles(next)
      } else {
        setPortalFiles([])
        setSelectedFile(null)
        setFileContent("")
      }
    }
  }, [portals, selectedPortal])

  useEffect(() => {
    if (!selectedPortal) return

    if (!selectedFile && portalFiles.length > 0) {
      const next = pickDefaultFile(portalFiles)
      if (next) {
        void loadFile(selectedPortal, next)
      }
      return
    }

    if (selectedFile && !portalFiles.includes(selectedFile)) {
      const next = pickDefaultFile(portalFiles)

      if (next) {
        void loadFile(selectedPortal, next)
      } else {
        setSelectedFile(null)
        setFileContent("")
      }
    }
  }, [portalFiles, selectedFile, selectedPortal])

  const fileTree = useMemo(() => buildFileTree(portalFiles), [portalFiles])

  const filteredFileTree = useMemo(() => {
    if (!fileSearch.trim()) return fileTree
    const q = fileSearch.trim().toLowerCase()
    const matched = portalFiles.filter((f) => f.toLowerCase().includes(q))
    const tree = buildFileTree(matched)
    return tree
  }, [fileSearch, fileTree, portalFiles])

  const searchExpandedFolders = useMemo(() => {
    if (!fileSearch.trim()) return expandedFolders
    const folders = new Set<string>()
    const q = fileSearch.trim().toLowerCase()
    for (const f of portalFiles) {
      if (!f.toLowerCase().includes(q)) continue
      const parts = f.split("/")
      let running = ""
      for (let i = 0; i < parts.length - 1; i += 1) {
        running = running ? `${running}/${parts[i]}` : parts[i]
        folders.add(running)
      }
    }
    return folders
  }, [fileSearch, portalFiles, expandedFolders])

  const newPageFolders = useMemo(() => {
    const folders = new Set<string>(["content"])
    for (const f of portalFiles) {
      const parts = f.split("/")
      let running = ""
      for (let i = 0; i < parts.length - 1; i += 1) {
        running = running ? `${running}/${parts[i]}` : parts[i]
        if (running.startsWith("content")) folders.add(running)
      }
    }
    return [...folders].sort((a, b) => a.localeCompare(b))
  }, [portalFiles])

  async function loadPortals() {
    setLoadingPortals(true)
    try {
      const res = await fetch(`${API_BASE}/portals`)
      const raw = await res.text()
      let data: PortalResponse
      try {
        data = JSON.parse(raw)
      } catch {
        setBuildOutput(`ERROR — Failed to load portals\n\n${raw}`)
        return
      }
      setPortals(data.portals || [])
    } catch (err: any) {
      setBuildOutput(`ERROR — Failed to load portals\n\n${err.message}`)
    } finally {
      setLoadingPortals(false)
    }
  }

  async function loadFiles(portal: string) {
    setLoadingFiles(true)
    setPortalFiles([])
    setSelectedFile(null)
    setFileContent("")

    try {
      const res = await fetch(`${API_BASE}/list_files?${encodeURIComponent(portal)}`)
      const { data, raw } = await readJsonOrText<ListFilesResponse>(res)

      if (!data) {
        setPortalFiles([])
        setBuildOutput(`ERROR — Failed to load files\n\n${raw}`)
        return
      }

      if (!data.ok) {
        setPortalFiles([])
        setBuildOutput(`ERROR — Failed to load files\n\n${data.stderr || raw}`)
        return
      }

      const files = data.files || []
      setPortalFiles([...files])
      setExpandedFolders(new Set())

      const defaultFile = pickDefaultFile(files)
      if (defaultFile) {
        await loadFile(portal, defaultFile)
      }
    } catch (err: any) {
      setPortalFiles([])
      setBuildOutput(`ERROR — Failed to load files\n\n${err.message}`)
    } finally {
      setLoadingFiles(false)
    }
  }

  async function loadFile(portal: string, path: string) {
    // Images can't be loaded as text — just select them
    if (isImageFile(path)) {
      setSelectedFile(path)
      setFileContent("")
      setFrontmatter(null)
      setBodyContent("")
      setActiveSection("files")
      return
    }

    setLoadingFileContent(true)

    try {
      const query = new URLSearchParams({ portal, path })
      const res = await fetch(`${API_BASE}/read_file?${query.toString()}`)
      const { data, raw } = await readJsonOrText<ReadFileResponse>(res)

      if (!data) {
        setBuildOutput(`ERROR — Failed to read file\n\n${raw}`)
        return
      }

      if (!data.ok) {
        setBuildOutput(`ERROR — Failed to read file\n\n${data.stderr || raw}`)
        return
      }

      setSelectedFile(data.path)
      setFileContent(data.content || "")

      const parsed = parseFrontmatter(data.content || "")
      if (parsed) {
        setFrontmatter(parsed.fm)
        setBodyContent(parsed.body)
      } else {
        setFrontmatter(null)
        setBodyContent("")
      }

      setActiveSection("files")
    } catch (err: any) {
      setBuildOutput(`ERROR — Failed to read file\n\n${err.message}`)
    } finally {
      setLoadingFileContent(false)
    }
  }

  async function saveFile() {
    if (!selectedPortal || !selectedFile) return

    setSavingFile(true)

    try {
      const query = new URLSearchParams({ portal: selectedPortal, path: selectedFile })

      const res = await fetch(`${API_BASE}/write_file?${query.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: frontmatter ? serializeFrontmatter(frontmatter, bodyContent) : fileContent,
      })

      const { data, raw } = await readJsonOrText<BuildResponse>(res)
      if (!data) {
        setBuildOutput(`ERROR — Failed to save file\n\n${raw}`)
        return
      }
      setBuildOutput(formatBuildOutput(selectedPortal, data))
    } catch (err: any) {
      setBuildOutput(`ERROR — Failed to save file\n\n${err.message}`)
    } finally {
      setSavingFile(false)
    }
  }

  function clearUploadPoll() {
    if (uploadPollRef.current !== null) {
      window.clearInterval(uploadPollRef.current)
      uploadPollRef.current = null
    }
  }

  async function pollUpload(portal: string) {
    try {
      const [statusRes, logRes] = await Promise.all([
        fetch(`${API_BASE}/upload_status?${encodeURIComponent(portal)}`),
        fetch(`${API_BASE}/upload_log?${encodeURIComponent(portal)}`),
      ])

      const statusRaw = await statusRes.text()
      const logRaw = await logRes.text()

      const statusData = parseApiPayload<{
        ok?: boolean
        state?: "idle" | "starting" | "uploading" | "success" | "failed"
        message?: string
        error?: string
      }>(statusRaw)

      const logData = parseApiPayload<{
        ok?: boolean
        log?: string
      }>(logRaw)

      if (!statusData) {
        setUploadState("failed")
        setUploadMessage(statusRaw || "Invalid upload status response")
        clearUploadPoll()
        return
      }

      setUploadState(statusData.state || "idle")
      setUploadMessage(statusData.error || statusData.message || "")
      setUploadLog(logData?.log || "")

      if (statusData.state === "success" || statusData.state === "failed") {
        clearUploadPoll()
      }
    } catch (err: any) {
      setUploadState("failed")
      setUploadMessage(err.message || "Upload polling failed")
      clearUploadPoll()
    }
  }

  function startUploadPolling(portal: string) {
    clearUploadPoll()
    void pollUpload(portal)
    uploadPollRef.current = window.setInterval(() => {
      void pollUpload(portal)
    }, 2000)
  }

  async function runBuild(portal: string) {
    setBuildingPortal(portal)
    clearUploadPoll()
    setUploadState("idle")
    setUploadMessage("")
    setUploadLog("")

    try {
      const res = await fetch(`${API_BASE}/build?${encodeURIComponent(portal)}`)
      const raw = await res.text()

      let data: BuildResponse

      try {
        const parsed = parseApiPayload<BuildResponse>(raw)
        if (!parsed) throw new Error(raw || "Build failed")
        data = parsed
      } catch {
        throw new Error(raw || "Build failed")
      }

      setBuildOutput(formatBuildOutput(portal, data))

      if (data.ok && data.code === 0) {
        try {
          const uploadRes = await fetch(`${API_BASE}/start_upload?${encodeURIComponent(portal)}`)
          const uploadRaw = await uploadRes.text()

          const uploadData = parseApiPayload<{ ok?: boolean; message?: string; stderr?: string }>(uploadRaw)

          if (uploadData?.ok) {
            setUploadState("starting")
            setUploadMessage(uploadData.message || "Upload started")
            startUploadPolling(portal)
          } else {
            setUploadState("failed")
            setUploadMessage(uploadData?.stderr || uploadRaw || "Failed to start upload")
          }
        } catch (err: any) {
          setUploadState("failed")
          setUploadMessage(err.message || "Failed to start upload")
        }
      }

      return data
    } catch (err: any) {
      const message = err.message || "Build failed"
      setBuildOutput(`BUILD FAILED — ${portal}\n\n${message}`)
      setUploadState("idle")
      setUploadMessage("")
      setUploadLog("")
      return {
        ok: false,
        code: null,
        stdout: "",
        stderr: message,
      } as BuildResponse
    } finally {
      setBuildingPortal(null)
    }
  }

  async function createPortal() {
    const portalName = cleanPortalName(newPortal)
    if (!portalName) return

    setCreatingPortal(true)
    setBuildOutput("")

    try {
      const res = await fetch(`${API_BASE}/create_portal?${encodeURIComponent(portalName)}`)
      const raw = await res.text()
      setBuildOutput(`CREATED SITE — ${portalName}\n\n${raw}\n\nAuto-building...`)
      setNewPortal("")
      setShowNewSiteForm(false)

      await loadPortals()
      setSelectedPortal(portalName)
      await loadFiles(portalName)
      await runBuild(portalName)
    } catch (err: any) {
      setBuildOutput(`ERROR — Failed to create site\n\n${err.message}`)
    } finally {
      setCreatingPortal(false)
    }
  }

  async function buildPortal(portal: string) {
    await runBuild(portal)
  }

  async function deletePortal(portal: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the site "${portal}"? This will remove its source files.`
    )

    if (!confirmed) return

    setDeletingPortal(portal)

    try {
      const res = await fetch(`${API_BASE}/delete_portal?${encodeURIComponent(portal)}`)
      const raw = await res.text()

      await loadPortals()
      setShowDeleteSite(false)
      setDeleteConfirmName("")
      setBuildOutput(`DELETED SITE — ${portal}\n\n${raw}`)

      if (selectedPortal === portal) {
        setPortalFiles([])
        setSelectedFile(null)
        setFileContent("")
      }
    } catch (err: any) {
      setBuildOutput(`ERROR — Failed to delete site\n\n${err.message}`)
    } finally {
      setDeletingPortal(null)
    }
  }

  function openPortal(portal: string) {
    window.open(siteUrlForPortal(portal), "_blank", "noopener,noreferrer")
  }

  function selectPortal(portal: string) {
    setSelectedPortal(portal)
    setActiveSection("files")
    setFileSearch("")
    void loadFiles(portal)
  }

  function toggleFolder(path: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function handleNewPage() {
    if (!selectedPortal) return
    setNewPageName("")
    setNewPageFolder(newPageFolders[0] ?? "content")
    setShowNewPageModal(true)
  }

  async function createNewPage() {
    if (!selectedPortal) return

    const slug = cleanPortalName(newPageName)
    if (!slug) return

    const folder = newPageFolder || "content"
    const path = `${folder}/${slug}.md`
    const title = slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())

    setCreatingPage(true)

    try {
      const res = await fetch(`${API_BASE}/create_file?${selectedPortal}&${path}&${title}`)
      const raw = await res.text()
      setBuildOutput(`CREATED PAGE — ${path}\n\n${raw}`)

      setPortalFiles((prev) => {
        if (prev.includes(path)) return prev
        return [...prev, path].sort((a, b) => a.localeCompare(b))
      })

      const parts = path.split("/")
      let running = ""
      const folders = new Set(expandedFolders)
      for (let i = 0; i < parts.length - 1; i += 1) {
        running = running ? `${running}/${parts[i]}` : parts[i]
        folders.add(running)
      }
      setExpandedFolders(folders)

      setShowNewPageModal(false)
      setNewPageName("")

      await loadFile(selectedPortal, path)
    } catch (err: any) {
      setBuildOutput(`ERROR — Failed to create page\n\n${err.message}`)
    } finally {
      setCreatingPage(false)
    }
  }

  async function handleDeleteFile() {
    if (!selectedPortal || !selectedFile) return

    const confirmed = window.confirm(`Are you sure you want to delete the file "${selectedFile}"?`)
    if (!confirmed) return

    try {
      const deletedFile = selectedFile
      const res = await fetch(`${API_BASE}/delete_file?${selectedPortal}&${selectedFile}`)
      const raw = await res.text()

      setPortalFiles((prev) => prev.filter((f) => f !== deletedFile))

      if (selectedFile === deletedFile) {
        setSelectedFile(null)
        setFileContent("")
      }

      setBuildOutput(`DELETED FILE — ${deletedFile}\n\n${raw}`)
    } catch (err: any) {
      setBuildOutput(`ERROR — Failed to delete file\n\n${err.message}`)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    clearCachedProfile(session?.user?.id)
    setSession(null)
    setProfile(null)
    setProfileLoaded(false)
    setPortals([])
    setPortalFiles([])
    setSelectedFile(null)
    setFileContent("")
    setBuildOutput("")
    setSelectedPortal(null)
  }

  if (!supabase) {
    return (
      <div style={styles.missingShell}>
        <div style={styles.missingCard}>
          <h1 style={styles.missingTitle}>Sheriff Cloud</h1>
          <p>Supabase configuration missing.</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthModal />
  }

  if (!profileLoaded) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b1020", color: "#e8ecf8" }}>
        Loading account…
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b1020", color: "#e8ecf8", padding: 24 }}>
        <div style={{ maxWidth: 760, width: "100%", background: "#11182b", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Profile missing</div>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {profileError || "This account does not have a Sheriff Cloud profile row yet."}
          </div>
          <div style={{ marginTop: 12, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            sessionUserId={session?.user?.id ?? "null"}
          </div>
        </div>
      </div>
    )
  }

  if (profile.is_suspended) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b1020", color: "#e8ecf8", padding: 24 }}>
        This account is suspended.
      </div>
    )
  }

  function mdToggleWrap(before: string, after: string, placeholder: string) {
    const view = editorViewRef.current
    if (!view) return
    const { from, to } = view.state.selection.main
    const selected = view.state.sliceDoc(from, to)
    // check if already wrapped
    const beforeCursor = view.state.sliceDoc(Math.max(0, from - before.length), from)
    const afterCursor = view.state.sliceDoc(to, Math.min(view.state.doc.length, to + after.length))
    if (beforeCursor === before && afterCursor === after) {
      // unwrap
      view.dispatch({
        changes: [
          { from: from - before.length, to: from, insert: "" },
          { from: to, to: to + after.length, insert: "" },
        ],
        selection: { anchor: from - before.length, head: to - before.length },
      })
    } else {
      const text = selected || placeholder
      view.dispatch({
        changes: { from, to, insert: `${before}${text}${after}` },
        selection: { anchor: from + before.length, head: from + before.length + text.length },
      })
    }
    view.focus()
  }

  function mdToggleBlockquote() {
    const view = editorViewRef.current
    if (!view) return
    const { from } = view.state.selection.main
    const line = view.state.doc.lineAt(from)
    const isQuoted = /^>\s*/.test(line.text)
    const newText = isQuoted
      ? line.text.replace(/^>\s*/, "")
      : "> " + line.text
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: newText },
      selection: { anchor: line.from + newText.length },
    })
    view.focus()
  }

  function mdInsert(text: string) {
    const view = editorViewRef.current
    if (!view) return
    const { from, to } = view.state.selection.main
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    })
    view.focus()
  }

  function handleHeading() {
    const view = editorViewRef.current
    if (!view) return
    const { from } = view.state.selection.main
    const line = view.state.doc.lineAt(from)
    const match = line.text.match(/^(#{1,3})\s/)
    const currentLevel = match ? match[1].length : 0
    const nextLevel = currentLevel >= 3 ? 0 : currentLevel + 1
    const stripped = line.text.replace(/^#{1,3}\s*/, "")
    const insert = nextLevel === 0 ? stripped : "#".repeat(nextLevel) + " " + stripped
    view.dispatch({
      changes: { from: line.from, to: line.to, insert },
      selection: { anchor: line.from + insert.length },
    })
    view.focus()
  }

  function handleFencedCode() {
    const view = editorViewRef.current
    if (!view) return
    const { from, to } = view.state.selection.main
    const selected = view.state.sliceDoc(from, to)
    const trimmed = selected.trim()
    if (trimmed.startsWith("```") && trimmed.endsWith("```") && trimmed.length > 6) {
      const inner = trimmed.slice(3, -3).replace(/^\n/, "").replace(/\n$/, "")
      view.dispatch({
        changes: { from, to, insert: inner },
        selection: { anchor: from, head: from + inner.length },
      })
    } else {
      const insert = selected ? "```\n" + selected + "\n```" : "```\n\n```"
      const cursorPos = selected ? from + insert.length : from + 4
      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: cursorPos },
      })
    }
    view.focus()
  }

  function handleLink() {
    const view = editorViewRef.current
    if (!view) return
    const { from, to } = view.state.selection.main
    const selected = view.state.sliceDoc(from, to)
    // toggle: if already [[...]] unwrap
    const beforeCursor = view.state.sliceDoc(Math.max(0, from - 2), from)
    const afterCursor = view.state.sliceDoc(to, Math.min(view.state.doc.length, to + 2))
    if (beforeCursor === "[[" && afterCursor === "]]") {
      view.dispatch({
        changes: [
          { from: from - 2, to: from, insert: "" },
          { from: to, to: to + 2, insert: "" },
        ],
        selection: { anchor: from - 2, head: to - 2 },
      })
    } else {
      const text = selected || "page name"
      const insert = `[[${text}]]`
      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + 2, head: from + 2 + text.length },
      })
    }
    view.focus()
  }

  async function handleImageInsert() {
    if (!imageFile || !selectedPortal) return
    setUploadingImage(true)
    try {
      const query = new URLSearchParams({ portal: selectedPortal, path: `public/images/${imageFile.name}` })
      const res = await fetch(`${API_BASE}/write_file?${query.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: imageFile,
      })
      const text = await res.text()
      let data: any = { ok: true }
      try { data = JSON.parse(text) } catch { /* build output — treat 200 as success */ }
      if (data.ok === false) {
        setBuildOutput(`ERROR — Image upload failed\n\n${data.stderr ?? text}`)
        return
      }
      const markup = `[[image:${imageFile.name}|${imageSize}|${imageAlign}|${imageCaption}]]`
      mdInsert(markup)
      setShowImagePanel(false)
      setImageFile(null)
      setImageCaption("")
      setImageSize("full")
      setImageAlign("center")
    } catch (err: any) {
      setBuildOutput(`ERROR — Image upload failed\n\n${err.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const currentSiteUrl = selectedPortal ? siteUrlForPortal(selectedPortal) : ""
  const buildStatusText = !buildOutput
    ? "No build yet"
    : uploadState === "failed"
      ? "Upload failed"
      : uploadState === "success"
        ? "Uploaded"
        : uploadState === "uploading" || uploadState === "starting"
          ? "Uploading"
          : buildOutput.startsWith("ERROR") || buildOutput.includes("BUILD FAILED")
            ? "Failed"
            : "Built"
  const combinedLogOutput = [
    buildOutput,
    uploadMessage
      ? `UPLOAD STATUS\n-------------\n${uploadState.toUpperCase()}${uploadMessage ? ` — ${uploadMessage}` : ""}`
      : "",
    uploadLog
      ? `UPLOAD LOG\n----------\n${uploadLog}`
      : "",
  ].filter(Boolean).join("\n\n")
  const userEmail = session?.user?.email ?? ""

  return (
    <div style={{ ...styles.appShell, ...(activeSection === "ai" ? { height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" } : {}) }}>
      <SiteHeader userEmail={userEmail} onSignOut={signOut} />

      <div style={{ ...styles.workspace, ...(activeSection === "ai" ? { flex: 1, minHeight: 0, overflow: "hidden", padding: 0, maxWidth: "none", margin: 0 } : {}) }}>
        <aside
          style={{
            ...styles.sidebar,
            width: sidebarOpen ? 272 : 72,
          }}
        >
          <div style={styles.sidebarTopRow}>
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              style={styles.outlineButtonSmall}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? "←" : "→"}
            </button>
          </div>

          <div style={styles.sidebarSection}>
            {sidebarOpen && <div style={styles.sidebarLabel}>Sites</div>}
            <div style={styles.sidebarList}>
              {portals.map((portal) => {
                const isSelected = selectedPortal === portal
                const isBuilding = buildingPortal === portal
                const isDeleting = deletingPortal === portal

                return (
                  <button
                    key={portal}
                    onClick={() => selectPortal(portal)}
                    style={{
                      ...styles.sidebarItem,
                      ...(isSelected ? styles.sidebarItemActive : null),
                    }}
                    title={portal}
                    disabled={isDeleting}
                  >
                    <SiteBadge site={portal} />
                    {sidebarOpen && (
                      <span style={styles.sidebarItemTextWrap}>
                        <span>{portal}</span>
                        <span style={styles.sidebarItemMeta}>
                          {isDeleting ? "Deleting..." : isBuilding ? "Building..." : "Ready"}
                        </span>
                      </span>
                    )}
                  </button>
                )
              })}

              {loadingPortals && sidebarOpen && <div style={styles.smallMuted}>Refreshing sites...</div>}
            </div>

            {sidebarOpen && (
              <div style={{ marginTop: 10 }}>
                {!showNewSiteForm ? (
                  <button
                    onClick={() => setShowNewSiteForm(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      width: "100%",
                      background: "none",
                      border: "1px dashed #d4d4d8",
                      borderRadius: 4,
                      padding: "7px 10px",
                      fontSize: 13,
                      color: "#71717a",
                      cursor: "pointer",
                    }}
                  >
                    <SvgIcon path={ICON_PATHS.plus} size={14} color="#71717a" />
                    New Site
                  </button>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    <input
                      autoFocus
                      placeholder="site-name"
                      value={newPortal}
                      onChange={(e) => setNewPortal(cleanPortalName(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void createPortal()
                        if (e.key === "Escape") { setShowNewSiteForm(false); setNewPortal("") }
                      }}
                      style={{ ...styles.input, fontSize: 13, padding: "7px 10px" }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={createPortal}
                        disabled={creatingPortal || !newPortal.trim()}
                        style={{
                          ...styles.primaryButton,
                          flex: 1,
                          fontSize: 13,
                          padding: "7px 10px",
                          opacity: creatingPortal || !newPortal.trim() ? 0.6 : 1,
                          cursor: creatingPortal || !newPortal.trim() ? "not-allowed" : "pointer",
                        }}
                      >
                        {creatingPortal ? "Creating..." : "Create"}
                      </button>
                      <button
                        onClick={() => { setShowNewSiteForm(false); setNewPortal("") }}
                        style={{ ...styles.outlineButton, fontSize: 13, padding: "7px 10px" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={styles.sidebarDivider} />

          <div style={styles.sidebarSection}>
            {sidebarOpen && <div style={styles.sidebarLabel}>Navigation</div>}
            <div style={styles.sidebarList}>
              {[
                [<SvgIcon path={ICON_PATHS.folder} size={16} />, "Files", "files"],
                [<SvgIcon path={ICON_PATHS.domains} size={16} />, "Domains", "domains"],
                [<SvgIcon path={ICON_PATHS.settings} size={16} />, "Settings", "settings"],
                ...(profile?.has_ai_access ? [[<SvgIcon path={ICON_PATHS.chat} size={16} />, "Rodeo AI", "ai"]] : []),
              ].map(([icon, label, key]) => {
                const active = activeSection === key
                return (
                  <button
                    key={key as string}
                    onClick={() => setActiveSection(key as NavSection)}
                    style={{
                      ...styles.sidebarItem,
                      ...(active ? styles.sidebarNavActive : null),
                    }}
                    title={label as string}
                  >
                    <span style={styles.navIcon}>{icon}</span>
                    {sidebarOpen && <span>{label}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={styles.sidebarDivider} />

          <div style={styles.sidebarSection}>
            {sidebarOpen && <div style={styles.sidebarLabel}>Logs</div>}
            <div style={styles.sidebarList}>
              <button
                onClick={() => setLogOpen((prev) => !prev)}
                style={styles.sidebarItem}
                title="Logs"
              >
                <span style={styles.navIcon}><SvgIcon path={ICON_PATHS.logs} size={16} /></span>
                {sidebarOpen && <span>Logs</span>}
              </button>

              {sidebarOpen && (
                <div style={styles.logPanel}>
                  {!logOpen ? (
                    <div style={styles.logStatusOnly}>Status: {buildStatusText}</div>
                  ) : (
                    <pre style={styles.logPre}>{combinedLogOutput || "No build run yet."}</pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <main style={{ ...styles.main, ...(activeSection === "ai" ? { display: "flex", flexDirection: "column", overflow: "hidden" } : {}) }}>
          {activeSection !== "ai" && <div style={styles.siteActionBar}>
            <div>
              <div style={styles.siteName}>{selectedPortal || "No site selected"}</div>
              <div style={styles.siteUrl}>{currentSiteUrl || "Select a site to begin"}</div>
            </div>

            <div style={styles.siteActionButtons}>
              <button
                onClick={() => selectedPortal && openPortal(selectedPortal)}
                style={{ ...styles.outlineButton, display: "inline-flex", alignItems: "center", gap: 6 }}
                disabled={!selectedPortal}
              >
                <SvgIcon path="M480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160C96 124.7 124.7 96 160 96L480 96zM264 224C254.3 224 245.5 229.8 241.8 238.8C238.1 247.8 240.1 258.1 247 265L282 300L215 367C205.6 376.4 205.6 391.6 215 400.9L239 424.9C248.4 434.3 263.6 434.3 272.9 424.9L339.9 357.9L374.9 392.9C381.8 399.8 392.1 401.8 401.1 398.1C410.1 394.4 416 385.7 416 376L416 248C416 234.7 405.3 224 392 224L264 224z" size={18} />
                View Site
              </button>
              <button
                onClick={() => selectedPortal && buildPortal(selectedPortal)}
                style={{ ...styles.primaryButton, display: "inline-flex", alignItems: "center", gap: 6 }}
                disabled={!selectedPortal || buildingPortal === selectedPortal}
              >
                <SvgIcon path="M246.9 82.3L271 67.8C292.6 54.8 317.3 48 342.5 48C379.3 48 414.7 62.6 440.7 88.7L504.6 152.6C519.6 167.6 528 188 528 209.2L528 240.1L547.7 259.8L547.7 259.8C563.3 244.2 588.6 244.2 604.3 259.8C620 275.4 619.9 300.7 604.3 316.4L540.3 380.4C524.7 396 499.4 396 483.7 380.4C468 364.8 468.1 339.5 483.7 323.8L464 304L433.1 304C411.9 304 391.5 295.6 376.5 280.6L327.4 231.5C312.4 216.5 304 196.1 304 174.9L304 162.2C304 151 298.1 140.5 288.5 134.8L246.9 109.8C236.5 103.6 236.5 88.6 246.9 82.4zM50.7 466.7L272.8 244.6L363.3 335.1L141.2 557.2C116.2 582.2 75.7 582.2 50.7 557.2C25.7 532.2 25.7 491.7 50.7 466.7z" size={15} color="#fff" />
                {buildingPortal === selectedPortal ? "Building..." : "Build Site"}
              </button>
              {!showDeleteSite ? (
                <button
                  onClick={() => setShowDeleteSite(true)}
                  style={styles.iconButton}
                  title="Delete site"
                  disabled={!selectedPortal || deletingPortal === selectedPortal}
                >
                  <SvgIcon
                    path="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"
                    size={16}
                  />
                </button>
              ) : (
                <div style={styles.deleteSiteReveal}>
                  <div style={styles.deleteSiteWarning}>
                    This will permanently delete the entire site.
                  </div>

                  <div style={styles.deleteSiteWarning}>
                    Type <strong>{selectedPortal}</strong> to confirm deletion.
                  </div>

                  <input
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Enter site name"
                    style={styles.input}
                  />

                  <div style={styles.deleteSiteActions}>
                    <button
                      onClick={() => {
                        setShowDeleteSite(false)
                        setDeleteConfirmName("")
                      }}
                      style={styles.outlineButton}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => selectedPortal && deletePortal(selectedPortal)}
                      style={styles.deleteButton}
                      disabled={
                        !selectedPortal ||
                        deletingPortal === selectedPortal ||
                        deleteConfirmName !== selectedPortal
                      }
                    >
                      {deletingPortal === selectedPortal ? "Deleting..." : "Delete Site"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>}

          {activeSection === "files" && (
            <div
              id="sc-files-layout"
              style={{
                ...styles.editorLayout,
                gridTemplateColumns: `${fileBrowserWidth}px 8px minmax(0, 1fr)`,
              }}
            >
              <section style={styles.fileBrowserPane}>
                <div style={{ ...styles.paneHeader, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Files</span>
                  {portalFiles.length > 0 && (() => {
                    const allFolderPaths = new Set<string>()
                    for (const f of portalFiles) {
                      const parts = f.split("/")
                      let running = ""
                      for (let i = 0; i < parts.length - 1; i += 1) {
                        running = running ? `${running}/${parts[i]}` : parts[i]
                        allFolderPaths.add(running)
                      }
                    }
                    const allOpen = allFolderPaths.size > 0 && [...allFolderPaths].every(f => expandedFolders.has(f))
                    return (
                      <button
                        onClick={() => setExpandedFolders(allOpen ? new Set() : allFolderPaths)}
                        style={styles.toolbarButton}
                        title={allOpen ? "Collapse all" : "Expand all"}
                      >
                        {allOpen ? "↕ Collapse" : "↕ Expand"}
                      </button>
                    )
                  })()}
                </div>

                {portalFiles.length > 0 && (
                  <div style={{ padding: "6px 8px", borderBottom: "1px solid #e5e7eb" }}>
                    <input
                      placeholder="Search files..."
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      style={{
                        width: "100%",
                        border: "1px solid #d4d4d8",
                        borderRadius: 4,
                        padding: "6px 8px",
                        fontSize: 13,
                        background: "#fff",
                      }}
                    />
                  </div>
                )}

                {loadingFiles ? (
                  <div style={styles.emptyPane}>Loading files...</div>
                ) : !selectedPortal ? (
                  <div style={styles.emptyPane}>Select a site to view files.</div>
                ) : portalFiles.length === 0 ? (
                  <div style={styles.emptyPane}>No editable files found for this site.</div>
                ) : filteredFileTree.length === 0 ? (
                  <div style={styles.emptyPane}>No files match "{fileSearch}".</div>
                ) : (
                  <div style={styles.fileTreeWrap}>
                    <FileTree
                      nodes={filteredFileTree}
                      selectedFile={selectedFile}
                      expandedFolders={searchExpandedFolders}
                      onToggleFolder={toggleFolder}
                      onOpenFile={(path) => selectedPortal && loadFile(selectedPortal, path)}
                      onDoubleClickFile={(path) => {
                        if (selectedPortal && isImageFile(path)) {
                          const filename = path.split("/").pop()
                          window.open(`${siteUrlForPortal(selectedPortal).replace(/\/$/, "")}/public/images/${filename}`, "_blank", "noopener,noreferrer")
                        }
                      }}
                    />
                  </div>
                )}
              </section>

              <div
                style={{
                  ...styles.resizeHandle,
                  ...(isResizingFiles ? styles.resizeHandleActive : null),
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsResizingFiles(true)
                }}
                title="Drag to resize file browser"
              />

              <section style={styles.editorPane}>
                <div style={styles.editorHeader}>
                  <div>
                    <div style={styles.editorTitle}>{selectedFile || "No file selected"}</div>
                    <div style={styles.editorMeta}>
                      {loadingFileContent ? "Loading..." : savingFile ? "Saving..." : selectedFile ? "Ready" : "Choose a file from the browser"}
                    </div>
                  </div>

                  <div style={styles.editorActions}>
                    <button
                      onClick={saveFile}
                      disabled={savingFile || loadingFileContent || !selectedFile}
                      style={{
                        ...styles.iconButton,
                        opacity: savingFile || loadingFileContent || !selectedFile ? 0.5 : 1,
                        cursor: savingFile || loadingFileContent || !selectedFile ? "not-allowed" : "pointer",
                      }}
                      title="Save page"
                    >
                      <SvgIcon path="M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 237.3C544 220.3 537.3 204 525.3 192L448 114.7C436 102.7 419.7 96 402.7 96L160 96zM192 192C192 174.3 206.3 160 224 160L384 160C401.7 160 416 174.3 416 192L416 256C416 273.7 401.7 288 384 288L224 288C206.3 288 192 273.7 192 256L192 192zM320 352C355.3 352 384 380.7 384 416C384 451.3 355.3 480 320 480C284.7 480 256 451.3 256 416C256 380.7 284.7 352 320 352z" size={16} />
                    </button>
                    <button
                      onClick={handleNewPage}
                      style={styles.iconButton}
                      title="New page"
                    >
                      <SvgIcon path="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z" size={16} />
                    </button>
                    <button
                      onClick={handleDeleteFile}
                      disabled={!selectedFile}
                      style={{
                        ...styles.iconButton,
                        color: "#dc2626",
                        borderColor: "#fecaca",
                        opacity: !selectedFile ? 0.5 : 1,
                        cursor: !selectedFile ? "not-allowed" : "pointer",
                      }}
                      title="Delete page"
                    >
                      <SvgIcon path="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" size={16} color="#dc2626" />
                    </button>
                  </div>
                </div>

                {frontmatter && (
                  <div style={styles.fmForm}>
                    <button
                      onClick={() => setShowFrontmatter((v) => !v)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        border: 0,
                        background: showFrontmatter ? "#f1f3f5" : "#3296ab",
                        color: showFrontmatter ? "#52525b" : "#fff",
                        padding: "8px 12px",
                        cursor: "pointer",
                        borderRadius: 4,
                        marginBottom: showFrontmatter ? 12 : 0,
                        fontFamily: "inherit",
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Page Metadata
                      </span>
                      <span style={{ fontSize: 12 }}>{showFrontmatter ? "▴ Hide" : "▾ Show"}</span>
                    </button>

                    {showFrontmatter && (
                      <div style={styles.fmGrid}>
                      <div style={styles.fmField}>
                        <label style={styles.fmLabel}>
                          title <span style={styles.fmRequired}>*</span>
                          {" "}<Tooltip text="The display title of your page. Doesn't have to match the filename — loop_concepts.md could be called Loops & Concepts." />
                        </label>
                        <input value={frontmatter.title} onChange={(e) => setFrontmatter({ ...frontmatter, title: e.target.value })} style={styles.fmInput} />
                      </div>
                      <div style={styles.fmField}>
                        <label style={styles.fmLabel}>
                          author <span style={styles.fmRequired}>*</span>
                          {" "}<Tooltip text="Author of this page — a person's name, or a company or group name." />
                        </label>
                        <input value={frontmatter.author} onChange={(e) => setFrontmatter({ ...frontmatter, author: e.target.value })} placeholder="Author or site name" style={styles.fmInput} />
                      </div>
                      <div style={styles.fmField}>
                        <label style={styles.fmLabel}>
                          layout
                          {" "}<Tooltip text="Which page layout to use. Most common values are docs and blog." />
                        </label>
                        <input value={frontmatter.layout} onChange={(e) => setFrontmatter({ ...frontmatter, layout: e.target.value })} style={styles.fmInput} />
                      </div>
                      <div style={styles.fmField}>
                        <label style={styles.fmLabel}>
                          meta_kind <span style={styles.fmRequired}>*</span>
                          {" "}<Tooltip text="What kind of site is this content for? docs, wiki, blog, or article." />
                        </label>
                        <select value={frontmatter.meta_kind} onChange={(e) => setFrontmatter({ ...frontmatter, meta_kind: e.target.value })} style={styles.fmInput}>
                          <option value="">— select —</option>
                          {META_KIND_OPTIONS.map((k) => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.fmField}>
                        <label style={styles.fmLabel}>
                          meta_type <span style={styles.fmRequired}>*</span>
                          {" "}<Tooltip text="What role does this specific page play? e.g. reference, tutorial, how-to, overview, changelog, faq, post, review, etc." />
                        </label>
                        <select value={frontmatter.meta_type} onChange={(e) => setFrontmatter({ ...frontmatter, meta_type: e.target.value })} style={styles.fmInput}>
                          <option value="">— select —</option>
                          {META_TYPE_OPTIONS.map((k) => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ ...styles.fmField, gridColumn: "1 / -1" }}>
                        <label style={styles.fmLabel}>
                          summary <span style={styles.fmRequired}>*</span>
                          {" "}<Tooltip text="Describe this page in one sentence. Used in search results and page previews." />
                        </label>
                        <textarea value={frontmatter.summary} onChange={(e) => setFrontmatter({ ...frontmatter, summary: e.target.value })} placeholder="One-sentence summary of this page" style={styles.fmTextarea} />
                      </div>
                      <div style={{ ...styles.fmField, gridColumn: "1 / -1" }}>
                        <label style={styles.fmLabel}>
                          gloss <span style={styles.fmOptional}>(optional)</span>
                          {" "}<Tooltip text="A short definition if this page warrants one. Also shown when someone hovers a link pointing to this page." />
                        </label>
                        <textarea value={frontmatter.gloss} onChange={(e) => setFrontmatter({ ...frontmatter, gloss: e.target.value })} placeholder="Brief definition, if the page warrants it" style={styles.fmTextarea} />
                      </div>
                    </div>
                    )}
                  </div>
                )}

                <div style={{ ...styles.markdownToolbar, justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button style={styles.toolbarButton} title="Bold" onClick={() => mdToggleWrap("**", "**", "bold text")}>
                      <SvgIcon path="M160 96C142.3 96 128 110.3 128 128C128 145.7 142.3 160 160 160L192 160L192 480L160 480C142.3 480 128 494.3 128 512C128 529.7 142.3 544 160 544L384 544C454.7 544 512 486.7 512 416C512 369.5 487.2 328.7 450 306.3C468.7 284 480 255.3 480 224C480 153.3 422.7 96 352 96L160 96zM416 224C416 259.3 387.3 288 352 288L256 288L256 160L352 160C387.3 160 416 188.7 416 224zM256 480L256 352L384 352C419.3 352 448 380.7 448 416C448 451.3 419.3 480 384 480L256 480z" size={15} />
                    </button>
                    <button style={styles.toolbarButton} title="Italic" onClick={() => mdToggleWrap("*", "*", "italic text")}>
                      <SvgIcon path="M256 128C256 110.3 270.3 96 288 96L480 96C497.7 96 512 110.3 512 128C512 145.7 497.7 160 480 160L421.3 160L288 480L352 480C369.7 480 384 494.3 384 512C384 529.7 369.7 544 352 544L160 544C142.3 544 128 529.7 128 512C128 494.3 142.3 480 160 480L218.7 480L352 160L288 160C270.3 160 256 145.7 256 128z" size={15} />
                    </button>
                    <button style={styles.toolbarButton} title="Heading (cycles H1→H2→H3→off)" onClick={handleHeading}>
                      <SvgIcon path="M96 128C96 110.3 110.3 96 128 96L224 96C241.7 96 256 110.3 256 128C256 145.7 241.7 160 224 160L208 160L208 272L432 272L432 160L416 160C398.3 160 384 145.7 384 128C384 110.3 398.3 96 416 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L496 160L496 480L512 480C529.7 480 544 494.3 544 512C544 529.7 529.7 544 512 544L416 544C398.3 544 384 529.7 384 512C384 494.3 398.3 480 416 480L432 480L432 336L208 336L208 480L224 480C241.7 480 256 494.3 256 512C256 529.7 241.7 544 224 544L128 544C110.3 544 96 529.7 96 512C96 494.3 110.3 480 128 480L144 480L144 160L128 160C110.3 160 96 145.7 96 128z" size={15} />
                    </button>
                    <button style={styles.toolbarButton} title="Fenced code block" onClick={handleFencedCode}>
                      <SvgIcon path="M392.8 65.2C375.8 60.3 358.1 70.2 353.2 87.2L225.2 535.2C220.3 552.2 230.2 569.9 247.2 574.8C264.2 579.7 281.9 569.8 286.8 552.8L414.8 104.8C419.7 87.8 409.8 70.1 392.8 65.2zM457.4 201.3C444.9 213.8 444.9 234.1 457.4 246.6L530.8 320L457.4 393.4C444.9 405.9 444.9 426.2 457.4 438.7C469.9 451.2 490.2 451.2 502.7 438.7L598.7 342.7C611.2 330.2 611.2 309.9 598.7 297.4L502.7 201.4C490.2 188.9 469.9 188.9 457.4 201.4zM182.7 201.3C170.2 188.8 149.9 188.8 137.4 201.3L41.4 297.3C28.9 309.8 28.9 330.1 41.4 342.6L137.4 438.6C149.9 451.1 170.2 451.1 182.7 438.6C195.2 426.1 195.2 405.8 182.7 393.3L109.3 320L182.6 246.6C195.1 234.1 195.1 213.8 182.6 201.3z" size={15} />
                    </button>
                    <button style={styles.toolbarButton} title="Inline code" onClick={() => mdToggleWrap("`", "`", "code")}>
                      <SvgIcon path="M96 320C96 289.1 121.1 264 152 264C182.9 264 208 289.1 208 320C208 350.9 182.9 376 152 376C121.1 376 96 350.9 96 320zM264 320C264 289.1 289.1 264 320 264C350.9 264 376 289.1 376 320C376 350.9 350.9 376 320 376C289.1 376 264 350.9 264 320zM488 264C518.9 264 544 289.1 544 320C544 350.9 518.9 376 488 376C457.1 376 432 350.9 432 320C432 289.1 457.1 264 488 264z" size={15} />
                    </button>
                    <button style={styles.toolbarButton} title="Blockquote (toggle)" onClick={mdToggleBlockquote}>
                      <SvgIcon path="M96 280C96 213.7 149.7 160 216 160L224 160C241.7 160 256 174.3 256 192C256 209.7 241.7 224 224 224L216 224C185.1 224 160 249.1 160 280L160 288L224 288C259.3 288 288 316.7 288 352L288 416C288 451.3 259.3 480 224 480L160 480C124.7 480 96 451.3 96 416L96 280zM352 280C352 213.7 405.7 160 472 160L480 160C497.7 160 512 174.3 512 192C512 209.7 497.7 224 480 224L472 224C441.1 224 416 249.1 416 280L416 288L480 288C515.3 288 544 316.7 544 352L544 416C544 451.3 515.3 480 480 480L416 480C380.7 480 352 451.3 352 416L352 280z" size={15} />
                    </button>
                    <button style={styles.toolbarButton} title="Link [[page name]]" onClick={handleLink}>
                      <SvgIcon path="M451.5 160C434.9 160 418.8 164.5 404.7 172.7C388.9 156.7 370.5 143.3 350.2 133.2C378.4 109.2 414.3 96 451.5 96C537.9 96 608 166 608 252.5C608 294 591.5 333.8 562.2 363.1L491.1 434.2C461.8 463.5 422 480 380.5 480C294.1 480 224 410 224 323.5C224 322 224 320.5 224.1 319C224.6 301.3 239.3 287.4 257 287.9C274.7 288.4 288.6 303.1 288.1 320.8C288.1 321.7 288.1 322.6 288.1 323.4C288.1 374.5 329.5 415.9 380.6 415.9C405.1 415.9 428.6 406.2 446 388.8L517.1 317.7C534.4 300.4 544.2 276.8 544.2 252.3C544.2 201.2 502.8 159.8 451.7 159.8zM307.2 237.3C305.3 236.5 303.4 235.4 301.7 234.2C289.1 227.7 274.7 224 259.6 224C235.1 224 211.6 233.7 194.2 251.1L123.1 322.2C105.8 339.5 96 363.1 96 387.6C96 438.7 137.4 480.1 188.5 480.1C205 480.1 221.1 475.7 235.2 467.5C251 483.5 269.4 496.9 289.8 507C261.6 530.9 225.8 544.2 188.5 544.2C102.1 544.2 32 474.2 32 387.7C32 346.2 48.5 306.4 77.8 277.1L148.9 206C178.2 176.7 218 160.2 259.5 160.2C346.1 160.2 416 230.8 416 317.1C416 318.4 416 319.7 416 321C415.6 338.7 400.9 352.6 383.2 352.2C365.5 351.8 351.6 337.1 352 319.4C352 318.6 352 317.9 352 317.1C352 283.4 334 253.8 307.2 237.5z" size={15} />
                    </button>
                    <button style={styles.toolbarButton} title="Horizontal rule" onClick={() => mdInsert("\n\n---\n\n")}>
                      <SvgIcon path="M96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320z" size={15} />
                    </button>
                    <button
                      style={{ ...styles.toolbarButton, color: showImagePanel ? "#3296ab" : "currentColor" }}
                      title="Insert image"
                      onClick={() => setShowImagePanel((v) => !v)}
                    >
                      <SvgIcon path={ICON_PATHS.image} size={15} color={showImagePanel ? "#3296ab" : "currentColor"} />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#71717a" }}>{editorFontSize}px</span>
                    <button
                      style={styles.toolbarButton}
                      title="Decrease font size"
                      onClick={() => setEditorFontSize((s) => Math.max(10, s - 1))}
                    >
                      <SvgIcon path="M96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320z" size={13} />
                    </button>
                    <button
                      style={styles.toolbarButton}
                      title="Increase font size"
                      onClick={() => setEditorFontSize((s) => Math.min(26, s + 1))}
                    >
                      <SvgIcon path="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z" size={13} />
                    </button>
                  </div>
                </div>

                {showImagePanel && (
                  <div style={{ borderBottom: "1px solid #d4d4d8", background: "#f8f9fa", padding: "12px 16px", display: "grid", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div style={styles.fmField}>
                        <label style={styles.fmLabel}>Image file</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                          style={{ ...styles.fmInput, padding: "4px 8px" }}
                        />
                      </div>
                      <div style={styles.fmField}>
                        <label style={styles.fmLabel}>Size</label>
                        <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} style={styles.fmInput}>
                          <option value="full">Full</option>
                          <option value="half">Half</option>
                          <option value="thumb">Thumb</option>
                        </select>
                      </div>
                      <div style={styles.fmField}>
                        <label style={styles.fmLabel}>Align</label>
                        <select value={imageAlign} onChange={(e) => setImageAlign(e.target.value)} style={styles.fmInput}>
                          <option value="center">Center</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                    <div style={styles.fmField}>
                      <label style={styles.fmLabel}>Caption (optional)</label>
                      <input
                        placeholder="A description of the image"
                        value={imageCaption}
                        onChange={(e) => setImageCaption(e.target.value)}
                        style={styles.fmInput}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleImageInsert}
                        disabled={!imageFile || uploadingImage}
                        style={{
                          ...styles.primaryButton,
                          opacity: !imageFile || uploadingImage ? 0.6 : 1,
                          cursor: !imageFile || uploadingImage ? "not-allowed" : "pointer",
                        }}
                      >
                        {uploadingImage ? "Uploading..." : "Insert Image"}
                      </button>
                      <button
                        onClick={() => { setShowImagePanel(false); setImageFile(null); setImageCaption("") }}
                        style={styles.outlineButton}
                      >
                        Cancel
                      </button>
                    </div>
                    {imageFile && (
                      <div style={{ fontSize: 12, color: "#71717a" }}>
                        Will insert: <code style={{ background: "#e5e7eb", padding: "2px 6px", borderRadius: 3 }}>
                          {`[[image:${imageFile.name}|${imageSize}|${imageAlign}|${imageCaption || ""}]]`}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {selectedFile && isImageFile(selectedFile) ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 16, padding: 32 }}>
                    <img
                      src={selectedPortal ? `${siteUrlForPortal(selectedPortal).replace(/\/$/, "")}/public/images/${selectedFile.split("/").pop()}` : ""}
                      alt={selectedFile}
                      style={{ maxWidth: "100%", maxHeight: 400, border: "1px solid #d4d4d8", borderRadius: 4 }}
                    />
                    <div style={{ fontSize: 13, color: "#71717a" }}>{selectedFile}</div>
                    <button
                      onClick={handleDeleteFile}
                      style={{ ...styles.deleteButton, display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <SvgIcon path="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" size={15} color="#dc2626" />
                      Delete Image
                    </button>
                  </div>
                ) : (
                <CodeMirror
                  value={frontmatter ? bodyContent : fileContent}
                  onChange={(val) => frontmatter ? setBodyContent(val) : setFileContent(val)}
                  onCreateEditor={(view) => { editorViewRef.current = view }}
                  extensions={[
                    markdown({ codeLanguages: languages }),
                    githubLight,
                    EditorView.lineWrapping,
                    EditorView.theme({ "&": { fontSize: `${editorFontSize}px` } }),
                  ]}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    highlightActiveLineGutter: true,
                    foldGutter: false,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: true,
                    syntaxHighlighting: true,
                    bracketMatching: false,
                    closeBrackets: false,
                    autocompletion: false,
                    crosshairCursor: false,
                    highlightSelectionMatches: false,
                  }}
                  placeholder="Select a file to start editing"
                  editable={!!selectedFile && !loadingFileContent}
                />
                )}
              </section>
            </div>
          )}

          {activeSection === "domains" && (
            <div style={styles.contentCard}>
              <h2 style={styles.sectionTitle}>Domains</h2>
              <div style={styles.contentStack}>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Default domain</div>
                  <div style={styles.infoValue}>{currentSiteUrl || "No site selected"}</div>
                </div>

                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Custom domain</div>
                  <div style={styles.infoValue}>Premium feature</div>
                  <p style={styles.paragraph}>
                    Add your domain here, then show dead-simple DNS instructions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div style={styles.contentCard}>
              <h2 style={styles.sectionTitle}>Site Settings</h2>
              <div style={styles.contentStack}>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Current site</div>
                  <div style={styles.infoValue}>{selectedPortal || "None selected"}</div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Plan</div>
                  <div style={styles.infoValue}>Free</div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "ai" && (
            <AiPanel supabase={supabase} />
          )}
        </main>
      </div>

      {showNewPageModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>New Page</span>
              <button
                onClick={() => setShowNewPageModal(false)}
                style={styles.modalCloseButton}
                title="Cancel"
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <label style={styles.label}>Page name</label>
              <input
                placeholder="e.g. getting-started"
                value={newPageName}
                onChange={(e) => setNewPageName(cleanPortalName(e.target.value))}
                style={styles.input}
                autoFocus
              />
              {newPageName && (
                <div style={styles.modalPathPreview}>
                  {newPageFolder}/{newPageName}.md
                </div>
              )}

              <label style={{ ...styles.label, marginTop: 12 }}>Save in folder</label>
              <select
                value={newPageFolder}
                onChange={(e) => setNewPageFolder(e.target.value)}
                style={styles.select}
              >
                {newPageFolders.map((f) => (
                  <option key={f} value={f}>{f}/</option>
                ))}
              </select>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowNewPageModal(false)}
                style={styles.outlineButton}
                disabled={creatingPage}
              >
                Cancel
              </button>
              <button
                onClick={createNewPage}
                style={{
                  ...styles.primaryButton,
                  opacity: creatingPage || !newPageName.trim() ? 0.6 : 1,
                  cursor: creatingPage || !newPageName.trim() ? "not-allowed" : "pointer",
                }}
                disabled={creatingPage || !newPageName.trim()}
              >
                {creatingPage ? "Creating..." : "Create Page"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  appShell: {
    minHeight: "100vh",
    background: "#fafafa",
    color: "#18181b",
    fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    borderBottom: "1px solid #d4d4d8",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(12px)",
  },
  headerInner: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: "14px 24px",
    minHeight: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
  },
  brandLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "#18181b",
    textDecoration: "none",
    minWidth: 0,
  },
  brandTextWrap: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  brandText: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "0.14em",
  },
  brandSubtext: {
    fontSize: 12,
    color: "#71717a",
    whiteSpace: "nowrap",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginLeft: "auto",
  },
  logoBadge: {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#3296ab",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    borderRadius: 8,
    overflow: "hidden",
  },
  logoImage: {
    display: "block",
    objectFit: "contain",
    borderRadius: 0,
    overflow: "hidden",
    background: "transparent",
  },
  mainNav: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  navLinkInner: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  topNavLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 6,
    color: "#52525b",
    fontSize: 14,
    textDecoration: "none",
  },
  topNavButton: {
    border: 0,
    background: "transparent",
    fontSize: 14,
    color: "#52525b",
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: 6,
  },
  dropdownWrap: {
    position: "relative",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    minWidth: 220,
    padding: 10,
    border: "1px solid #d4d4d8",
    borderRadius: 8,
    background: "#fff",
    boxShadow: "0 14px 34px rgba(0,0,0,0.12)",
    zIndex: 100,
    marginTop: 6,
  },
  dropdownLink: {
    display: "block",
    width: "100%",
    padding: "10px 12px",
    borderRadius: 6,
    fontSize: 14,
    color: "#111827",
    textDecoration: "none",
  },
  dropdownLinkButton: {
    width: "100%",
    border: 0,
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    display: "block",
    padding: "10px 12px",
    borderRadius: 6,
    fontSize: 14,
    color: "#111827",
  },
  dropdownMeta: {
    padding: "6px 12px 10px",
    fontSize: 13,
    color: "#71717a",
    wordBreak: "break-word",
  },
  dropdownDivider: {
    height: 1,
    background: "#e5e7eb",
    margin: "6px 0 8px",
  },
  upgradeButton: {
    border: "1px solid #3296ab",
    background: "transparent",
    color: "#3296ab",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    borderRadius: 999,
    padding: "8px 14px",
    letterSpacing: "0.04em",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInput: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    minWidth: 140,
    borderRadius: 4,
  },
  newSiteRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  workspace: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: 24,
    display: "flex",
    gap: 0,
  },
  sidebar: {
    borderRight: "1px solid #d4d4d8",
    background: "#f1f3f5",
    transition: "width 160ms ease",
    overflow: "hidden",
    flexShrink: 0,
  },
  sidebarTopRow: {
    padding: 12,
  },
  sidebarSection: {
    padding: "0 8px 8px",
  },
  sidebarLabel: {
    padding: "0 8px 8px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#71717a",
  },
  sidebarList: {
    display: "grid",
    gap: 8,
  },
  sidebarDivider: {
    borderTop: "1px solid #d4d4d8",
    margin: "8px 12px 16px",
  },
  sidebarItem: {
    width: "100%",
    border: "1px solid transparent",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 10px",
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
    color: "#111827",
  },
  sidebarItemActive: {
    background: "#3296ab",
    color: "#fff",
  },
  sidebarNavActive: {
    borderLeft: "4px solid #3296ab",
    background: "#fff",
    fontWeight: 700,
  },
  sidebarItemTextWrap: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.2,
  },
  sidebarItemMeta: {
    fontSize: 11,
    opacity: 0.75,
  },
  siteBadge: {
    width: 22,
    height: 22,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "#e5e7eb",
    color: "#111827",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
    overflow: "hidden",
  },
  siteFavicon: {
    display: "block",
    borderRadius: 999,
    objectFit: "cover",
    flexShrink: 0,
    background: "transparent",
    border: "0",
  },
  navIcon: {
    width: 22,
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  smallMuted: {
    fontSize: 12,
    color: "#71717a",
    padding: "0 8px",
  },
  logPanel: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    borderRadius: 4,
    overflow: "hidden",
  },
  logStatusOnly: {
    padding: "10px 12px",
    fontSize: 13,
    color: "#047857",
  },
  logPre: {
    margin: 0,
    padding: 12,
    background: "#09090b",
    color: "#34d399",
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    overflowX: "auto",
  },
  main: {
    minWidth: 0,
    flex: 1,
    background: "#fff",
  },
  siteActionBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    padding: "16px 24px",
    borderBottom: "1px solid #d4d4d8",
    background: "#f1f3f5",
  },
  siteName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  siteUrl: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  siteActionButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  deleteSiteReveal: {
    display: "grid",
    gap: 8,
    padding: 10,
    border: "1px solid #fecaca",
    background: "#fff5f5",
  },
  deleteSiteWarning: {
    fontSize: 12,
    color: "#b91c1c",
  },
  deleteSiteActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  editorLayout: {
    display: "grid",
    minHeight: "calc(100vh - 180px)",
  },
  fileBrowserPane: {
    minWidth: 0,
    overflow: "auto",
  },
  editorPane: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
  },
  paneHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #d4d4d8",
    fontSize: 14,
    fontWeight: 700,
  },
  fileTreeWrap: {
    overflow: "auto",
  },
  fileRow: {
    width: "100%",
    border: 0,
    borderBottom: "1px solid #e5e7eb",
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
  },
  fileRowLeft: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  fileIcon: {
    width: 16,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPane: {
    padding: 20,
    color: "#71717a",
    fontSize: 14,
  },
  editorHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    padding: "14px 16px",
    borderBottom: "1px solid #d4d4d8",
  },
  editorTitle: {
    fontSize: 14,
    fontWeight: 700,
  },
  editorMeta: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  editorActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  markdownToolbar: {
    display: "flex",
    gap: 8,
    padding: "10px 16px",
    borderBottom: "1px solid #d4d4d8",
  },
  toolbarButton: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "6px 10px",
    fontSize: 13,
    cursor: "pointer",
    borderRadius: 4,
  },
  editorTextarea: {
    width: "100%",
    minHeight: "calc(100vh - 320px)",
    border: 0,
    outline: "none",
    resize: "none",
    padding: 16,
    boxSizing: "border-box",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 14,
    lineHeight: 1.6,
    overflow: "visible",
  },
  resizeHandle: {
    width: 8,
    cursor: "col-resize",
    background: "#f4f4f5",
    borderLeft: "1px solid #e5e7eb",
    borderRight: "1px solid #e5e7eb",
  },
  resizeHandleActive: {
    background: "#e4e4e7",
  },
  contentCard: {
    padding: 24,
  },
  sectionTitle: {
    margin: "0 0 20px 0",
    fontSize: 22,
  },
  contentStack: {
    display: "grid",
    gap: 16,
  },
  infoCard: {
    border: "1px solid #d4d4d8",
    padding: 16,
    background: "#fff",
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#71717a",
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 600,
    color: "#111827",
  },
  paragraph: {
    margin: "8px 0 0 0",
    color: "#52525b",
    fontSize: 14,
  },
  outlineButton: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "10px 14px",
    fontSize: 14,
    cursor: "pointer",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  outlineButtonSmall: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "8px 10px",
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  primaryButton: {
    border: "1px solid #3296ab",
    background: "#3296ab",
    color: "#fff",
    padding: "10px 14px",
    fontSize: 14,
    cursor: "pointer",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  },
  secondaryButton: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "#1f2a44",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  authMessage: {
    marginTop: 12,
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "#1f2a44",
    color: "#ffffff",
    whiteSpace: "pre-wrap",
    fontSize: 14,
    lineHeight: 1.45,
    fontWeight: 600,
  },
  deleteButton: {
    border: "1px solid #fecaca",
    background: "#fff",
    color: "#dc2626",
    padding: "10px 14px",
    fontSize: 14,
    cursor: "pointer",
    borderRadius: 4,
  },
  deleteButtonLight: {
    border: "1px solid #fecaca",
    background: "#fff",
    color: "#dc2626",
    padding: "10px 14px",
    fontSize: 14,
    cursor: "pointer",
    borderRadius: 4,
  },
  iconButton: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  accountButton: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 24,
  },
  modalCard: {
    background: "#fff",
    border: "1px solid #d4d4d8",
    borderRadius: 6,
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    width: "100%",
    maxWidth: 440,
    display: "grid",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 20px 14px",
    borderBottom: "1px solid #d4d4d8",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
  },
  modalCloseButton: {
    border: 0,
    background: "transparent",
    fontSize: 16,
    cursor: "pointer",
    color: "#71717a",
    padding: "2px 6px",
    lineHeight: 1,
  },
  modalBody: {
    padding: "20px 20px 16px",
    display: "grid",
    gap: 6,
  },
  modalPathPreview: {
    fontSize: 12,
    color: "#3296ab",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    padding: "6px 10px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: 4,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    padding: "14px 20px 18px",
    borderTop: "1px solid #d4d4d8",
  },
  select: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "12px 14px",
    fontSize: 14,
    borderRadius: 4,
    cursor: "pointer",
  },
  fmForm: {
    borderBottom: "1px solid #d4d4d8",
    background: "#f8f9fa",
    padding: "16px 16px 12px",
  },
  fmGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 16px",
  },
  fmField: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  fmLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#52525b",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  fmRequired: {
    color: "#dc2626",
    fontWeight: 700,
  },
  fmOptional: {
    color: "#71717a",
    fontWeight: 400,
    fontSize: 12,
  },
  fmInput: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "8px 10px",
    fontSize: 13,
    borderRadius: 4,
    fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
    color: "#111827",
  },
  fmTextarea: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "8px 10px",
    fontSize: 13,
    borderRadius: 4,
    resize: "vertical" as const,
    minHeight: 56,
    fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
    lineHeight: 1.5,
    color: "#111827",
  },
  loginShell: {
    minHeight: "100vh",
    background: "#f4f4f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  },
  loginCard: {
    width: "100%",
    maxWidth: 460,
    background: "#fff",
    border: "1px solid #d4d4d8",
    padding: 28,
    borderRadius: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  brandRow: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  loginTitle: {
    margin: 0,
    fontSize: 28,
  },
  loginSubtitle: {
    margin: "6px 0 0 0",
    fontSize: 14,
    color: "#71717a",
  },
  formStack: {
    display: "grid",
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "12px 14px",
    fontSize: 14,
    borderRadius: 4,
  },
  missingShell: {
    minHeight: "100vh",
    background: "#f4f4f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  },
  missingCard: {
    background: "#fff",
    border: "1px solid #d4d4d8",
    padding: 28,
    borderRadius: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  missingTitle: {
    marginTop: 0,
  },
}
