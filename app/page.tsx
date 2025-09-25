"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  MapPin,
  Clock,
  DollarSign,
  Zap,
  Wind,
  Activity,
  Lock,
  QrCode,
  Navigation,
  Play,
  Pause,
  User,
  Settings,
} from "lucide-react"
import { QRScanner } from "@/components/qr-scanner"
import { BikeUnlockAnimation } from "@/components/bike-unlock-animation"
import { RideEndSummary } from "@/components/ride-end-summary"
import { GPSMapView } from "@/components/gps-map-view"
import { UserDashboard } from "@/components/user-dashboard"
import { AdminPanel } from "@/components/admin-panel" // Added AdminPanel import
import { RideSessionManager, type RideSession } from "@/lib/ride-session"
import { GPSTracker, type GPSCoordinate } from "@/lib/gps-tracker"

type AppState = "idle" | "scanning" | "unlocking" | "riding" | "paused" | "ride-ended" | "dashboard" | "admin" // Added admin state

export default function PedalPureApp() {
  const [appState, setAppState] = useState<AppState>("idle")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentSession, setCurrentSession] = useState<RideSession | null>(null)
  const [sessionManager] = useState(() => RideSessionManager.getInstance())
  const [gpsTracker] = useState(() => GPSTracker.getInstance())

  useEffect(() => {
    // Check for existing session on load
    const existingSession = sessionManager.getCurrentSession()
    if (existingSession) {
      setCurrentSession(existingSession)
      setAppState(existingSession.status === "paused" ? "paused" : "riding")
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date())

      // Update current session if riding
      if (appState === "riding" && currentSession) {
        const now = new Date()
        const duration = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000)

        const gpsDistance = gpsTracker.getTotalDistance()
        const distance = gpsDistance > 0 ? gpsDistance : Number((duration / 30).toFixed(2)) // Fallback to mock
        const averageSpeed = gpsTracker.getAverageSpeed()

        const updatedSession = sessionManager.updateRideSession({
          duration,
          distance,
          averageSpeed,
          caloriesBurned: Math.floor(duration / 6),
          co2Saved: Number(((duration / 60) * 0.8).toFixed(2)),
          airFiltered: Number(((duration / 60) * 2.3).toFixed(1)),
        })

        if (updatedSession) {
          setCurrentSession(updatedSession)
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [appState, currentSession, sessionManager, gpsTracker])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleScanSuccess = (bikeId: string) => {
    setAppState("unlocking")
  }

  const handleUnlockComplete = () => {
    const bikeId = "PP-2024-A7" // This would come from the scan
    const session = sessionManager.startRide(bikeId)
    setCurrentSession(session)
    setAppState("riding")
  }

  const handleLocationUpdate = (location: GPSCoordinate) => {
    if (currentSession && appState === "riding") {
      const distance = gpsTracker.getTotalDistance()
      const speed = gpsTracker.getAverageSpeed()
      sessionManager.updateGPSLocation(location.lat, location.lng, distance, speed)
    }
  }

  const handlePauseRide = () => {
    if (currentSession) {
      const pausedSession = sessionManager.pauseRide()
      if (pausedSession) {
        setCurrentSession(pausedSession)
        setAppState("paused")
      }
    }
  }

  const handleResumeRide = () => {
    if (currentSession) {
      const resumedSession = sessionManager.resumeRide()
      if (resumedSession) {
        setCurrentSession(resumedSession)
        setAppState("riding")
      }
    }
  }

  const handleEndRide = () => {
    if (currentSession) {
      const currentLocation = gpsTracker.getCurrentPosition()
      const endLocation = currentLocation
        ? {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            address: "Current Location, New Delhi",
          }
        : undefined

      const completedSession = sessionManager.endRide(endLocation)
      setCurrentSession(completedSession)
      setAppState("ride-ended")
    }
  }

  const handleCloseSummary = () => {
    setCurrentSession(null)
    setAppState("idle")
  }

  const handlePayment = () => {
    handleCloseSummary()
  }

  const aqiLevel = 85
  const aqiColor = aqiLevel > 100 ? "bg-destructive" : aqiLevel > 50 ? "bg-yellow-500" : "bg-secondary"
  const aqiText = aqiLevel > 100 ? "Poor" : aqiLevel > 50 ? "Moderate" : "Good"

  if (appState === "admin") {
    return <AdminPanel onClose={() => setAppState("idle")} />
  }

  if (appState === "dashboard") {
    return <UserDashboard onClose={() => setAppState("idle")} />
  }

  if (appState === "idle") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-3 sm:p-4 pb-4 sm:pb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold">PedalPure</h1>
            <div className="flex items-center gap-1 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAppState("dashboard")}
                className="text-primary-foreground hover:bg-primary-foreground/10 text-xs sm:text-sm px-2 sm:px-3"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden xs:inline">Dashboard</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAppState("admin")}
                className="text-primary-foreground hover:bg-primary-foreground/10 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden xs:inline">Admin</span>
              </Button>
              <div className="flex items-center gap-1 sm:gap-2">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm hidden sm:inline">Ready to ride</span>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-primary-foreground/10 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="text-center text-primary-foreground">
              <h2 className="text-base sm:text-lg font-semibold mb-2">Find Your PedalPure Bike</h2>
              <p className="text-xs sm:text-sm text-primary-foreground/80 leading-relaxed">
                Scan the QR code on any available bike to start your eco-friendly ride
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 -mt-2">
          {/* Scan Button */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6 text-center">
              <QrCode className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-primary" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                Point your camera at the QR code on the bike to unlock
              </p>
              <Button
                onClick={() => setAppState("scanning")}
                className="w-full h-11 sm:h-12 text-base sm:text-lg"
                size="lg"
              >
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Start Scanning
              </Button>
            </CardContent>
          </Card>

          {/* Available Bikes Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Available Nearby</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base truncate">Connaught Place Station</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">5 bikes available</div>
                  </div>
                  <Badge className="bg-secondary text-secondary-foreground text-xs ml-2 shrink-0">2 min walk</Badge>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-base truncate">Rajiv Gandhi Park</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">3 bikes available</div>
                  </div>
                  <Badge className="bg-secondary text-secondary-foreground text-xs ml-2 shrink-0">5 min walk</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Base fare</span>
                  <span className="font-semibold">₹10</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Per minute</span>
                  <span className="font-semibold">₹5</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="font-semibold">30 min ride</span>
                    <span className="font-semibold text-primary">₹160</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* QR Scanner Modal */}
      {appState === "scanning" && <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setAppState("idle")} />}

      {/* Unlock Animation Modal */}
      {appState === "unlocking" && (
        <BikeUnlockAnimation bikeId={currentSession?.bikeId || "PP-2024-A7"} onComplete={handleUnlockComplete} />
      )}

      {/* Ride End Summary Modal */}
      {appState === "ride-ended" && currentSession && (
        <RideEndSummary session={currentSession} onClose={handleCloseSummary} onPayment={handlePayment} />
      )}

      {/* Header */}
      <div className="bg-primary text-primary-foreground p-3 sm:p-4 pb-4 sm:pb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">PedalPure</h1>
          <div className="flex items-center gap-1 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAppState("dashboard")}
              className="text-primary-foreground hover:bg-primary-foreground/10 text-xs sm:text-sm px-2 sm:px-3"
            >
              <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden xs:inline">Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAppState("admin")}
              className="text-primary-foreground hover:bg-primary-foreground/10 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden xs:inline">Admin</span>
            </Button>
            <div className="flex items-center gap-1 sm:gap-2">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm hidden sm:inline">
                {appState === "riding" ? "Ride in progress" : appState === "paused" ? "Ride paused" : "Scan to unlock"}
              </span>
            </div>
          </div>
        </div>

        {/* Live Map Placeholder */}
        <div className="bg-primary-foreground/10 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex items-center justify-between text-primary-foreground/90">
            <div className="flex items-center gap-2">
              <Navigation className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Live GPS Tracking</span>
            </div>
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="mt-2 text-xs text-primary-foreground/70 truncate">
            Current Location: Connaught Place, New Delhi
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 -mt-2">
        <GPSMapView isTracking={appState === "riding"} onLocationUpdate={handleLocationUpdate} />

        {/* Bike Status Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Bike Status</CardTitle>
              <Badge
                className={`text-xs ${
                  appState === "riding"
                    ? "bg-green-500 text-white"
                    : appState === "paused"
                      ? "bg-yellow-500 text-white"
                      : "bg-secondary text-secondary-foreground"
                }`}
              >
                {appState === "riding" ? "In Use" : appState === "paused" ? "Paused" : "Available"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Bike ID</div>
                  <div className="font-semibold text-sm sm:text-base truncate">
                    {currentSession?.bikeId || "PP-2024-A7"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Ride Time</div>
                  <div className="font-semibold text-sm sm:text-base">{formatTime(currentSession?.duration || 0)}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Estimated Fare</div>
                <div className="font-semibold text-sm sm:text-base">₹{currentSession?.totalFare || 10}</div>
                <div className="text-xs text-muted-foreground">₹10 base + ₹5/min</div>
              </div>
            </div>

            {currentSession?.averageSpeed && currentSession.averageSpeed > 0 && (
              <div className="flex items-center gap-2">
                <Navigation className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Speed</div>
                  <div className="font-semibold text-sm sm:text-base">
                    {currentSession.averageSpeed.toFixed(1)} km/h
                  </div>
                  {currentSession.maxSpeed && (
                    <div className="text-xs text-muted-foreground">Max: {currentSession.maxSpeed.toFixed(1)} km/h</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Air Quality & Environment */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              Air Quality Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xl sm:text-2xl font-bold">{aqiLevel}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{aqiText} Air Quality</div>
              </div>
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${aqiColor} flex items-center justify-center shrink-0`}
              >
                <Wind className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <Progress value={(aqiLevel / 200) * 100} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Your ride is helping improve air quality!
            </div>
          </CardContent>
        </Card>

        {/* Fitness Metrics */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              Fitness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      className="text-muted sm:hidden"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-muted hidden sm:block"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray={`${((currentSession?.caloriesBurned || 0) / 100) * 126} 126`}
                      className="text-secondary sm:hidden"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={`${((currentSession?.caloriesBurned || 0) / 100) * 176} 176`}
                      className="text-secondary hidden sm:block"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold">{currentSession?.caloriesBurned || 0}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Calories Burned</div>
              </div>

              <div className="text-center">
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      className="text-muted sm:hidden"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-muted hidden sm:block"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray={`${((currentSession?.distance || 0) / 10) * 126} 126`}
                      className="text-primary sm:hidden"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={`${((currentSession?.distance || 0) / 10) * 176} 176`}
                      className="text-primary hidden sm:block"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold">{(currentSession?.distance || 0).toFixed(1)}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Distance (km)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="pt-2 sm:pt-4 space-y-2 sm:space-y-3">
          {appState === "riding" && (
            <>
              <Button
                onClick={handlePauseRide}
                variant="outline"
                className="w-full h-11 sm:h-12 text-base sm:text-lg bg-transparent"
                size="lg"
              >
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Pause Ride
              </Button>
              <Button
                onClick={handleEndRide}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                size="lg"
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                End Ride & Lock Bicycle
              </Button>
            </>
          )}

          {appState === "paused" && (
            <>
              <Button onClick={handleResumeRide} className="w-full h-11 sm:h-12 text-base sm:text-lg" size="lg">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Resume Ride
              </Button>
              <Button
                onClick={handleEndRide}
                variant="outline"
                className="w-full h-11 sm:h-12 text-base sm:text-lg bg-transparent"
                size="lg"
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                End Ride
              </Button>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 sm:p-3 bg-card rounded-lg">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-accent" />
            <div className="text-xs text-muted-foreground">Solar Charged</div>
            <div className="text-xs sm:text-sm font-semibold">85%</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-card rounded-lg">
            <Wind className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-primary" />
            <div className="text-xs text-muted-foreground">Air Filtered</div>
            <div className="text-xs sm:text-sm font-semibold">{(currentSession?.airFiltered || 0).toFixed(1)}L</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-card rounded-lg">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-secondary" />
            <div className="text-xs text-muted-foreground">CO₂ Saved</div>
            <div className="text-xs sm:text-sm font-semibold">{(currentSession?.co2Saved || 0).toFixed(1)}kg</div>
          </div>
        </div>
      </div>
    </div>
  )
}
