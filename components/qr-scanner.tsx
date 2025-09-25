"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { QrCode, Camera, X, CheckCircle } from "lucide-react"

interface QRScannerProps {
  onScanSuccess: (bikeId: string) => void
  onClose: () => void
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [manualInput, setManualInput] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Mock bike IDs for demonstration
  const validBikeIds = ["PP-2024-A7", "PP-2024-B3", "PP-2024-C9", "PP-2024-D1", "PP-2024-E5"]

  const startCamera = async () => {
    try {
      setIsScanning(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Simulate QR code detection after 3 seconds
      setTimeout(() => {
        const randomBikeId = validBikeIds[Math.floor(Math.random() * validBikeIds.length)]
        setScanResult(randomBikeId)
        stopCamera()
        setTimeout(() => {
          onScanSuccess(randomBikeId)
        }, 1500)
      }, 3000)
    } catch (error) {
      console.error("Camera access denied:", error)
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const handleManualSubmit = () => {
    if (manualInput.trim() && validBikeIds.includes(manualInput.trim())) {
      setScanResult(manualInput.trim())
      setTimeout(() => {
        onScanSuccess(manualInput.trim())
      }, 1000)
    } else {
      alert("Invalid Bike ID. Please try again.")
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  if (scanResult) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Bike Found!</h3>
            <p className="text-muted-foreground mb-4">Bike ID: {scanResult}</p>
            <p className="text-sm text-muted-foreground">Unlocking bike...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              Scan QR Code
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
          {/* Camera Scanner */}
          <div className="space-y-2 sm:space-y-3">
            {isScanning ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-40 sm:h-48 bg-black rounded-lg object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-white border-dashed rounded-lg animate-pulse" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <p className="text-white text-xs sm:text-sm bg-black/50 rounded px-2 py-1">Point camera at QR code</p>
                </div>
              </div>
            ) : (
              <div className="h-40 sm:h-48 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Camera not active</p>
                </div>
              </div>
            )}

            <Button
              onClick={isScanning ? stopCamera : startCamera}
              className="w-full h-10 sm:h-11"
              variant={isScanning ? "destructive" : "default"}
            >
              {isScanning ? "Stop Camera" : "Start Camera"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
            </div>
          </div>

          {/* Manual Input */}
          <div className="space-y-2 sm:space-y-3">
            <Input
              placeholder="Enter Bike ID (e.g., PP-2024-A7)"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
              className="h-10 sm:h-11"
            />
            <Button onClick={handleManualSubmit} variant="outline" className="w-full bg-transparent h-10 sm:h-11">
              Unlock Bike
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center leading-relaxed">
            Valid test IDs: {validBikeIds.join(", ")}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
