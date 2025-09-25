"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, MapPin, DollarSign, Activity, Wind, Zap, Star } from "lucide-react"
import type { RideSession } from "@/lib/ride-session"
import { PaymentFlow } from "./payment-flow"
import type { PaymentTransaction } from "@/lib/payment-manager"

interface RideEndSummaryProps {
  session: RideSession
  onClose: () => void
  onPayment: () => void
}

export function RideEndSummary({ session, onClose, onPayment }: RideEndSummaryProps) {
  const [rating, setRating] = useState(0)
  const [showPaymentFlow, setShowPaymentFlow] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`
    }
    return `${mins}m ${secs}s`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handlePaymentComplete = (transaction: PaymentTransaction) => {
    setPaymentCompleted(true)
    setShowPaymentFlow(false)
    setTimeout(() => {
      onPayment()
    }, 1500)
  }

  const handlePaymentClick = () => {
    setShowPaymentFlow(true)
  }

  return (
    <>
      {showPaymentFlow && (
        <PaymentFlow
          session={session}
          onPaymentComplete={handlePaymentComplete}
          onCancel={() => setShowPaymentFlow(false)}
        />
      )}

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">{paymentCompleted ? "Payment Successful!" : "Ride Completed!"}</CardTitle>
            <p className="text-muted-foreground">
              {paymentCompleted ? "Thank you for your payment" : "Thank you for choosing PedalPure"}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Ride Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bike ID</span>
                <Badge variant="outline">{session.bikeId}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration
                </span>
                <span className="font-semibold">{formatTime(session.duration)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Distance
                </span>
                <span className="font-semibold">{session.distance.toFixed(2)} km</span>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Total Fare
                  </span>
                  <span className="font-bold text-primary">₹{session.totalFare}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  ₹{session.baseFare} base + ₹{Math.ceil(session.duration / 60) * session.perMinuteFare} time charge
                </div>
              </div>
            </div>

            {/* Environmental Impact */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-800">Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-700 flex items-center gap-2">
                    <Wind className="w-4 h-4" />
                    Air Filtered
                  </span>
                  <span className="font-semibold text-green-800">{session.airFiltered}L</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-700 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    CO₂ Saved
                  </span>
                  <span className="font-semibold text-green-800">{session.co2Saved}kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-700 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Calories Burned
                  </span>
                  <span className="font-semibold text-green-800">{session.caloriesBurned}</span>
                </div>
              </CardContent>
            </Card>

            {/* Trip Timeline */}
            <div className="space-y-3">
              <h4 className="font-semibold">Trip Timeline</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Started</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(session.startTime)} • {session.startLocation.address}
                    </div>
                  </div>
                </div>
                <div className="ml-1 w-px h-4 bg-border"></div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Ended</div>
                    <div className="text-xs text-muted-foreground">
                      {session.endTime && formatDate(session.endTime)} • {session.endLocation?.address}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <h4 className="font-semibold">Rate Your Ride</h4>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className="p-1">
                    <Star
                      className={`w-6 h-6 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {!paymentCompleted ? (
                <>
                  <Button onClick={handlePaymentClick} className="w-full" size="lg">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Proceed to Payment
                  </Button>
                  <Button onClick={onClose} variant="outline" className="w-full bg-transparent">
                    Close Summary
                  </Button>
                </>
              ) : (
                <Button onClick={onClose} className="w-full" size="lg">
                  Done
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
