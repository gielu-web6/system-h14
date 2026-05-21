"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ProgressBar } from "./ProgressBar"
import { Step1Profile } from "./Step1Profile"
import { Step2Challenges } from "./Step2Challenges"
import { Step3Modules } from "./Step3Modules"
import { Step4Personalization } from "./Step4Personalization"
import { Step5AdditionalServices } from "./Step5AdditionalServices"
import { Step6Pricing } from "./Step6Pricing"
import { Step7Booking } from "./Step7Booking"
import { calculatePricing } from "@/lib/configurator/pricing"
import { INITIAL_STATE } from "@/lib/configurator/types"
import type { ConfiguratorState } from "@/lib/configurator/types"

const TOTAL_STEPS = 7

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir < 0 ? 60 : -60,
    opacity: 0,
  }),
}

export function ConfiguratorWrapper() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [state, setState] = useState<ConfiguratorState>(INITIAL_STATE)

  const update = (patch: Partial<ConfiguratorState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      const pricing = calculatePricing(next)
      return {
        ...next,
        setupPriceMin: pricing.setupMin,
        setupPriceMax: pricing.setupMax,
        monthlyPriceMin: pricing.monthlyMin,
        monthlyPriceMax: pricing.monthlyMax,
      }
    })
  }

  const goNext = () => {
    setDirection(1)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const goBack = () => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 1))
  }

  const handleFinalSubmit = async () => {
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      })
    } catch {
      // silently continue
    }
    goNext()
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full"
          >
            {step === 1 && (
              <Step1Profile
                state={state}
                onNext={(patch) => { update(patch); goNext() }}
              />
            )}
            {step === 2 && (
              <Step2Challenges
                state={state}
                onNext={(patch) => { update(patch); goNext() }}
                onBack={goBack}
              />
            )}
            {step === 3 && (
              <Step3Modules
                state={state}
                onNext={(patch) => { update(patch); goNext() }}
                onBack={goBack}
              />
            )}
            {step === 4 && (
              <Step4Personalization
                state={state}
                onNext={(patch) => { update(patch); goNext() }}
                onBack={goBack}
              />
            )}
            {step === 5 && (
              <Step5AdditionalServices
                state={state}
                onNext={(patch) => { update(patch); goNext() }}
                onBack={goBack}
              />
            )}
            {step === 6 && (
              <Step6Pricing
                state={state}
                onNext={handleFinalSubmit}
                onBack={goBack}
              />
            )}
            {step === 7 && (
              <Step7Booking state={state} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
