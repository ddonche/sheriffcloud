import { Suspense, lazy } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

const SheriffFrontApp = lazy(() => import("../front/sheriff/SheriffFrontApp"))
const AdminRoot = lazy(() => import("../admin/AdminRoot"))
const SpurApp = lazy(() => import("../front/spur/SpurApp"))

function LoadingScreen() {
  return (
    <div style={{ padding: 40, fontSize: 24 }}>
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/admin" element={<AdminRoot />} />
          <Route path="/admin/*" element={<AdminRoot />} />
          <Route path="/spur" element={<SpurApp />} />
          <Route path="/spur/*" element={<SpurApp />} />
          <Route path="/*" element={<SheriffFrontApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}