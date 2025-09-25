export interface GPSCoordinate {
  lat: number
  lng: number
  timestamp: Date
  accuracy?: number
  speed?: number
  heading?: number
}

export interface RoutePoint extends GPSCoordinate {
  distance: number // cumulative distance from start
  elevation?: number
}

export class GPSTracker {
  private static instance: GPSTracker
  private watchId: number | null = null
  private isTracking = false
  private currentPosition: GPSCoordinate | null = null
  private routePoints: RoutePoint[] = []
  private onPositionUpdate?: (position: GPSCoordinate) => void
  private onDistanceUpdate?: (distance: number) => void

  private constructor() {}

  static getInstance(): GPSTracker {
    if (!GPSTracker.instance) {
      GPSTracker.instance = new GPSTracker()
    }
    return GPSTracker.instance
  }

  async startTracking(
    onPositionUpdate?: (position: GPSCoordinate) => void,
    onDistanceUpdate?: (distance: number) => void,
  ): Promise<void> {
    if (this.isTracking) {
      return
    }

    this.onPositionUpdate = onPositionUpdate
    this.onDistanceUpdate = onDistanceUpdate

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser")
      }

      // Get initial position
      const initialPosition = await this.getCurrentPosition()
      this.currentPosition = initialPosition
      this.routePoints = [
        {
          ...initialPosition,
          distance: 0,
        },
      ]

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position),
        (error) => this.handlePositionError(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000,
        },
      )

      this.isTracking = true
      console.log("[v0] GPS tracking started")
    } catch (error) {
      console.error("[v0] Failed to start GPS tracking:", error)
      // Fallback to mock tracking for demo
      this.startMockTracking()
    }
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
    this.isTracking = false
    console.log("[v0] GPS tracking stopped")
  }

  private getCurrentPosition(): Promise<GPSCoordinate> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date(),
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          })
        },
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000,
        },
      )
    })
  }

  private handlePositionUpdate(position: GeolocationPosition): void {
    const newPosition: GPSCoordinate = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: new Date(),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
    }

    if (this.currentPosition) {
      const distance = this.calculateDistance(this.currentPosition, newPosition)
      const totalDistance =
        this.routePoints.length > 0 ? this.routePoints[this.routePoints.length - 1].distance + distance : distance

      this.routePoints.push({
        ...newPosition,
        distance: totalDistance,
      })

      this.onDistanceUpdate?.(totalDistance)
    }

    this.currentPosition = newPosition
    this.onPositionUpdate?.(newPosition)
  }

  private handlePositionError(error: GeolocationPositionError): void {
    console.error("[v0] GPS position error:", error.message)
    // Continue with mock tracking if GPS fails
    if (!this.isTracking) {
      this.startMockTracking()
    }
  }

  private startMockTracking(): void {
    console.log("[v0] Starting mock GPS tracking for demo")
    this.isTracking = true

    // Start from Connaught Place, Delhi
    let mockLat = 28.6139
    let mockLng = 77.209
    let totalDistance = 0

    const mockPosition: GPSCoordinate = {
      lat: mockLat,
      lng: mockLng,
      timestamp: new Date(),
      accuracy: 10,
      speed: 15, // km/h
    }

    this.currentPosition = mockPosition
    this.routePoints = [
      {
        ...mockPosition,
        distance: 0,
      },
    ]

    this.onPositionUpdate?.(mockPosition)

    // Simulate movement every 5 seconds
    const mockInterval = setInterval(() => {
      if (!this.isTracking) {
        clearInterval(mockInterval)
        return
      }

      // Simulate random movement (small increments)
      const latChange = (Math.random() - 0.5) * 0.001 // ~100m max
      const lngChange = (Math.random() - 0.5) * 0.001

      mockLat += latChange
      mockLng += lngChange

      const newMockPosition: GPSCoordinate = {
        lat: mockLat,
        lng: mockLng,
        timestamp: new Date(),
        accuracy: Math.random() * 20 + 5, // 5-25m accuracy
        speed: Math.random() * 10 + 10, // 10-20 km/h
      }

      if (this.currentPosition) {
        const distance = this.calculateDistance(this.currentPosition, newMockPosition)
        totalDistance += distance

        this.routePoints.push({
          ...newMockPosition,
          distance: totalDistance,
        })

        this.onDistanceUpdate?.(totalDistance)
      }

      this.currentPosition = newMockPosition
      this.onPositionUpdate?.(newMockPosition)
    }, 5000)
  }

  // Haversine formula for calculating distance between two GPS points
  calculateDistance(point1: GPSCoordinate, point2: GPSCoordinate): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLng = this.toRadians(point2.lng - point1.lng)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in kilometers
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  getCurrentPosition(): GPSCoordinate | null {
    return this.currentPosition
  }

  getRoutePoints(): RoutePoint[] {
    return [...this.routePoints]
  }

  getTotalDistance(): number {
    return this.routePoints.length > 0 ? this.routePoints[this.routePoints.length - 1].distance : 0
  }

  getAverageSpeed(): number {
    if (this.routePoints.length < 2) return 0

    const totalTime =
      (this.routePoints[this.routePoints.length - 1].timestamp.getTime() - this.routePoints[0].timestamp.getTime()) /
      1000 /
      3600 // hours
    const totalDistance = this.getTotalDistance()

    return totalTime > 0 ? totalDistance / totalTime : 0
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  // Get formatted address from coordinates (mock implementation)
  async getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    // In a real app, you'd use a geocoding service like Google Maps API
    // For demo, return mock addresses based on Delhi locations
    const delhiLocations = [
      "Connaught Place, New Delhi",
      "India Gate, New Delhi",
      "Red Fort, New Delhi",
      "Lotus Temple, New Delhi",
      "Qutub Minar, New Delhi",
      "Humayun's Tomb, New Delhi",
      "Rajpath, New Delhi",
      "Khan Market, New Delhi",
    ]

    return delhiLocations[Math.floor(Math.random() * delhiLocations.length)]
  }
}
