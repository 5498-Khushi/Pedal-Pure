"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Zap, Clock, Activity } from "lucide-react"
import { type GPSCoordinate, GPSTracker } from "@/lib/gps-tracker"

interface GPSMapViewProps {
  isTracking: boolean
  onLocationUpdate?: (location: GPSCoordinate) => void
}

export function GPSMapView({ isTracking, onLocationUpdate }: GPSMapViewProps) {
  const [currentLocation, setCurrentLocation] = useState<GPSCoordinate | null>(null)
  const [totalDistance, setTotalDistance] = useState(0)
  const [averageSpeed, setAverageSpeed] = useState(0)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [gpsTracker] = useState(() => GPSTracker.getInstance())

  useEffect(() => {
    if (isTracking) {
      gpsTracker.startTracking(
        (position) => {
          setCurrentLocation(position)
          setAccuracy(position.accuracy || null)
          onLocationUpdate?.(position)
        },
        (distance) => {
          setTotalDistance(distance)
          setAverageSpeed(gpsTracker.getAverageSpeed())
        },
      )
    } else {
      gpsTracker.stopTracking()
    }

    return () => {
      if (isTracking) {
        gpsTracker.stopTracking()
      }
    }
  }, [isTracking, gpsTracker, onLocationUpdate])

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6)
  }

  const formatSpeed = (speed: number) => {
    return speed.toFixed(1)
  }

  const getAccuracyColor = (acc: number | null) => {
    if (!acc) return "bg-gray-500"
    if (acc <= 10) return "bg-green-500"
    if (acc <= 20) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getAccuracyText = (acc: number | null) => {
    if (!acc) return "Unknown"
    if (acc <= 10) return "High"
    if (acc <= 20) return "Medium"
    return "Low"
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          GPS Tracking
          {isTracking && <Badge className="bg-green-500 text-white animate-pulse">Live</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mock Map Display */}
        <div className="relative h-32 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-primary/20 overflow-hidden">
          {/* Map Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 grid-rows-6 h-full">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border border-gray-400"></div>
              ))}
            </div>
          </div>

          {/* Current Location Marker */}
          {currentLocation && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
          )}

          {/* Route Path (simplified) */}
          {isTracking && (
            <svg className="absolute inset-0 w-full h-full">
              <path
                d="M 20 80 Q 60 40 100 60 T 180 50"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 2"
                className="animate-pulse"
              />
            </svg>
          )}

          {/* Map Labels */}
          <div className="absolute top-2 left-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">Delhi, India</div>
          <div className="absolute bottom-2 right-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">Live GPS</div>
        </div>

        {/* Location Details */}
        {currentLocation && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Latitude</div>
                <div className="font-mono font-semibold">{formatCoordinate(currentLocation.lat)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Longitude</div>
                <div className="font-mono font-semibold">{formatCoordinate(currentLocation.lng)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getAccuracyColor(accuracy)}`}></div>
                <span className="text-sm font-semibold">
                  {getAccuracyText(accuracy)} {accuracy && `(±${accuracy.toFixed(0)}m)`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div className="text-xs text-muted-foreground">Distance</div>
            <div className="text-sm font-semibold">{totalDistance.toFixed(2)} km</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-xs text-muted-foreground">Avg Speed</div>
            <div className="text-sm font-semibold">{formatSpeed(averageSpeed)} km/h</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="text-sm font-semibold">{isTracking ? "Tracking" : "Stopped"}</div>
          </div>
        </div>

        {!isTracking && (
          <div className="text-center py-4 text-muted-foreground">
            <Navigation className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start a ride to begin GPS tracking</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
