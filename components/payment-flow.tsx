"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, Wallet, Smartphone, Building, CheckCircle, XCircle, Loader2, Plus, ArrowLeft } from "lucide-react"
import { PaymentManager, type PaymentMethod, type PaymentTransaction } from "@/lib/payment-manager"
import type { RideSession } from "@/lib/ride-session"

interface PaymentFlowProps {
  session: RideSession
  onPaymentComplete: (transaction: PaymentTransaction) => void
  onCancel: () => void
}

type PaymentStep = "select-method" | "processing" | "success" | "failed" | "add-method"

export function PaymentFlow({ session, onPaymentComplete, onCancel }: PaymentFlowProps) {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("select-method")
  const [selectedMethodId, setSelectedMethodId] = useState<string>("")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [processingStatus, setProcessingStatus] = useState("")
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null)
  const [paymentManager] = useState(() => PaymentManager.getInstance())

  // New payment method form
  const [newMethodType, setNewMethodType] = useState<"card" | "upi">("upi")
  const [newMethodDetails, setNewMethodDetails] = useState("")

  useEffect(() => {
    const methods = paymentManager.getPaymentMethods()
    setPaymentMethods(methods)

    // Set default payment method
    const defaultMethod = methods.find((m) => m.isDefault)
    if (defaultMethod) {
      setSelectedMethodId(defaultMethod.id)
    }
  }, [paymentManager])

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case "wallet":
        return <Wallet className="w-5 h-5" />
      case "card":
        return <CreditCard className="w-5 h-5" />
      case "upi":
        return <Smartphone className="w-5 h-5" />
      case "netbanking":
        return <Building className="w-5 h-5" />
      default:
        return <CreditCard className="w-5 h-5" />
    }
  }

  const handlePayment = async () => {
    if (!selectedMethodId) return

    setCurrentStep("processing")
    setProcessingStatus("Initiating payment...")

    try {
      const result = await paymentManager.processPayment(session.id, session.totalFare, selectedMethodId, (status) =>
        setProcessingStatus(status),
      )

      setTransaction(result)

      if (result.status === "completed") {
        setCurrentStep("success")
        setTimeout(() => {
          onPaymentComplete(result)
        }, 2000)
      } else {
        setCurrentStep("failed")
      }
    } catch (error) {
      setCurrentStep("failed")
      setProcessingStatus(error instanceof Error ? error.message : "Payment failed")
    }
  }

  const handleAddPaymentMethod = () => {
    if (!newMethodDetails.trim()) return

    const newMethod = paymentManager.addPaymentMethod({
      type: newMethodType,
      name: newMethodType === "upi" ? "UPI" : "Credit/Debit Card",
      details: newMethodDetails,
      isDefault: false,
    })

    setPaymentMethods(paymentManager.getPaymentMethods())
    setSelectedMethodId(newMethod.id)
    setCurrentStep("select-method")
    setNewMethodDetails("")
  }

  const handleRetry = () => {
    setCurrentStep("select-method")
    setTransaction(null)
    setProcessingStatus("")
  }

  if (currentStep === "add-method") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep("select-method")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <CardTitle>Add Payment Method</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Payment Type</Label>
              <RadioGroup value={newMethodType} onValueChange={(value: "card" | "upi") => setNewMethodType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    UPI
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Credit/Debit Card
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>{newMethodType === "upi" ? "UPI ID" : "Card Number"}</Label>
              <Input
                placeholder={newMethodType === "upi" ? "user@paytm" : "1234 5678 9012 3456"}
                value={newMethodDetails}
                onChange={(e) => setNewMethodDetails(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep("select-method")} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddPaymentMethod} className="flex-1" disabled={!newMethodDetails.trim()}>
                Add Method
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "processing") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
            <p className="text-muted-foreground mb-4">₹{session.totalFare}</p>
            <p className="text-sm text-muted-foreground">{processingStatus}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "success") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">₹{session.totalFare} paid</p>
            {transaction && (
              <div className="text-xs text-muted-foreground">Transaction ID: {transaction.id.slice(-8)}</div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "failed") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Failed</h3>
            <p className="text-muted-foreground mb-4">{processingStatus}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleRetry} className="flex-1">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Payment
            <Badge variant="outline">₹{session.totalFare}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ride Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bike ID:</span>
              <span className="font-semibold">{session.bikeId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Duration:</span>
              <span className="font-semibold">
                {Math.floor(session.duration / 60)}m {session.duration % 60}s
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Distance:</span>
              <span className="font-semibold">{session.distance.toFixed(2)} km</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span>Base fare:</span>
                <span>₹{session.baseFare}</span>
              </div>
              <div className="flex justify-between">
                <span>Time charge:</span>
                <span>₹{session.totalFare - session.baseFare}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                <span>Total:</span>
                <span>₹{session.totalFare}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Select Payment Method</h4>
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep("add-method")}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            <RadioGroup value={selectedMethodId} onValueChange={setSelectedMethodId}>
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <div className="flex items-center gap-3 flex-1">
                    {getPaymentMethodIcon(method.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={method.id} className="font-medium">
                          {method.name}
                        </Label>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{method.details}</div>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handlePayment} className="flex-1" disabled={!selectedMethodId}>
              Pay ₹{session.totalFare}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
