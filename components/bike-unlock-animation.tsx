"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Unlock, Zap, Wind, X } from "lucide-react"

interface BikeUnlockAnimationProps {
  bikeId: string
  onComplete: () => void
}

export function BikeUnlockAnimation({ bikeId, onComplete }: BikeUnlockAnimationProps) {
  const [step, setStep] = useState(0)

  const steps = [
    { icon: CheckCircle, text: "Bike Located", color: "text-green-500" },
    { icon: Zap, text: "Activating Systems", color: "text-yellow-500" },
    { icon: Wind, text: "Air Purifier Ready", color: "text-blue-500" },
    { icon: Unlock, text: "Bike Unlocked!", color: "text-green-500" },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        const nextStep = prev + 1
        if (nextStep >= steps.length) {
          // Clear the interval and call onComplete after a short delay
          clearInterval(timer)
          setTimeout(() => {
            onComplete()
          }, 1000)
          return prev // Keep the last step
        }
        return nextStep
      })
    }, 1500)

    return () => clearInterval(timer)
  }, [onComplete, steps.length])

  const handleSkipToDetails = () => {
    onComplete()
  }

  const CurrentIcon = steps[step].icon

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkipToDetails}
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </Button>

        <CardContent className="p-8 text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <CurrentIcon className={`w-10 h-10 ${steps[step].color}`} />
            </div>
            <div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-primary/20 rounded-full animate-ping" />
          </div>

          <h3 className="text-xl font-semibold mb-2">{steps[step].text}</h3>
          <p className="text-muted-foreground mb-4">Bike ID: {bikeId}</p>

          {step === 0 && (
            <Button variant="outline" onClick={handleSkipToDetails} className="mb-4 w-full bg-transparent">
              View Bike Details
            </Button>
          )}

          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${index <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
