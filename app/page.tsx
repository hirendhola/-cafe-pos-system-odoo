import { headers } from "next/headers"

import { CtaSection } from "@/components/landing/cta-section"
import { FaqSection } from "@/components/landing/faq-section"
import { FeatureGrid } from "@/components/landing/feature-grid"
import { HeroSection } from "@/components/landing/hero-section"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import { WorkflowSection } from "@/components/landing/workflow-section"
import { auth } from "@/lib/auth"

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const isAuthenticated = !!session

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader isAuthenticated={isAuthenticated} />
      <main className="flex-1">
        <HeroSection isAuthenticated={isAuthenticated} />
        <FeatureGrid />
        <WorkflowSection />
        <FaqSection />
        <CtaSection isAuthenticated={isAuthenticated} />
      </main>
      <SiteFooter />
    </div>
  )
}
