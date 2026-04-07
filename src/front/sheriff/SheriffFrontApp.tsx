import { Routes, Route } from "react-router-dom"

import HomePage from "./pages/HomePage"
import FeaturesPage from "./pages/FeaturesPage"
import HowItWorksPage from "./pages/HowItWorksPage"
import UseCasesPage from "./pages/UseCasesPage"
import PricingPage from "./pages/PricingPage"

import "./sheriff.css"

export default function SheriffFrontApp() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/use-cases" element={<UseCasesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
    </Routes>
  )
}