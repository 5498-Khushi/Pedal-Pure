export interface RideSession {
  id: string
  bikeId: string
  startTime: Date
  endTime?: Date
  duration: number // in seconds
  distance: number // in km
  baseFare: number
  perMinuteFare: number
  totalFare: number
  status: "active" | "completed" | "paused"
  startLocation: {
    lat: number
    lng: number
    address: string
  }
  endLocation?: {
    lat: number
    lng: number
    address: string
  }
  caloriesBurned: number
  co2Saved: number // in kg
  airFiltered: number // in liters
  routePoints?: Array<{
    lat: number
    lng: number
    timestamp: Date
    distance: number
  }>
  averageSpeed?: number
  maxSpeed?: number
}

export interface BikeInfo {
  id: string
  model: string
  batteryLevel: number
  solarCharge: number
  airPurifierStatus: "active" | "inactive"
  location: {
    lat: number
    lng: number
    address: string
  }
  status: "available" | "in-use" | "maintenance"
  lastMaintenance: Date
}

export class RideSessionManager {
  private static instance: RideSessionManager
  private currentSession: RideSession | null = null
  private sessionHistory: RideSession[] = []

  private constructor() {
    // Load from localStorage on initialization
    this.loadFromStorage()
  }

  static getInstance(): RideSessionManager {
    if (!RideSessionManager.instance) {
      RideSessionManager.instance = new RideSessionManager()
    }
    return RideSessionManager.instance
  }

  private loadFromStorage() {
    try {
      const currentSession = localStorage.getItem("pedalpure_current_session")
      const sessionHistory = localStorage.getItem("pedalpure_session_history")

      if (currentSession) {
        const session = JSON.parse(currentSession)
        session.startTime = new Date(session.startTime)
        if (session.endTime) session.endTime = new Date(session.endTime)
        if (session.routePoints) {
          session.routePoints = session.routePoints.map((point: any) => ({
            ...point,
            timestamp: new Date(point.timestamp),
          }))
        }
        this.currentSession = session
      }

      if (sessionHistory) {
        this.sessionHistory = JSON.parse(sessionHistory).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
          routePoints:
            session.routePoints?.map((point: any) => ({
              ...point,
              timestamp: new Date(point.timestamp),
            })) || [],
        }))
      }
    } catch (error) {
      console.error("Error loading ride sessions from storage:", error)
    }
  }

  private saveToStorage() {
    try {
      if (this.currentSession) {
        localStorage.setItem("pedalpure_current_session", JSON.stringify(this.currentSession))
      } else {
        localStorage.removeItem("pedalpure_current_session")
      }
      localStorage.setItem("pedalpure_session_history", JSON.stringify(this.sessionHistory))
    } catch (error) {
      console.error("Error saving ride sessions to storage:", error)
    }
  }

  startRide(bikeId: string, startLocation?: { lat: number; lng: number; address: string }): RideSession {
    if (this.currentSession) {
      throw new Error("A ride is already in progress")
    }

    const session: RideSession = {
      id: `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bikeId,
      startTime: new Date(),
      duration: 0,
      distance: 0,
      baseFare: 10,
      perMinuteFare: 5,
      totalFare: 10,
      status: "active",
      startLocation: startLocation || {
        lat: 28.6139, // Connaught Place coordinates
        lng: 77.209,
        address: "Connaught Place, New Delhi",
      },
      caloriesBurned: 0,
      co2Saved: 0,
      airFiltered: 0,
      routePoints: [],
      averageSpeed: 0,
      maxSpeed: 0,
    }

    this.currentSession = session
    this.saveToStorage()
    return session
  }

  updateRideSession(updates: Partial<RideSession>): RideSession | null {
    if (!this.currentSession) {
      return null
    }

    if (updates.routePoints) {
      this.currentSession.routePoints = [...(this.currentSession.routePoints || []), ...updates.routePoints]
    }

    this.currentSession = {
      ...this.currentSession,
      ...updates,
      totalFare: this.calculateFare(updates.duration || this.currentSession.duration),
      maxSpeed:
        updates.averageSpeed && this.currentSession.maxSpeed
          ? Math.max(this.currentSession.maxSpeed, updates.averageSpeed)
          : this.currentSession.maxSpeed || updates.averageSpeed || 0,
    }

    this.saveToStorage()
    return this.currentSession
  }

  updateGPSLocation(lat: number, lng: number, distance: number, speed?: number): void {
    if (!this.currentSession) return

    const routePoint = {
      lat,
      lng,
      timestamp: new Date(),
      distance,
    }

    this.currentSession.routePoints = this.currentSession.routePoints || []
    this.currentSession.routePoints.push(routePoint)
    this.currentSession.distance = distance

    if (speed) {
      this.currentSession.averageSpeed = speed
      this.currentSession.maxSpeed = Math.max(this.currentSession.maxSpeed || 0, speed)
    }

    this.saveToStorage()
  }

  endRide(endLocation?: { lat: number; lng: number; address: string }): RideSession {
    if (!this.currentSession) {
      throw new Error("No active ride to end")
    }

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - this.currentSession.startTime.getTime()) / 1000)

    const completedSession: RideSession = {
      ...this.currentSession,
      endTime,
      duration,
      totalFare: this.calculateFare(duration),
      status: "completed",
      endLocation: endLocation || {
        lat: 28.6129, // Slightly different location
        lng: 77.2095,
        address: "Near Connaught Place, New Delhi",
      },
      caloriesBurned: Math.floor(duration / 6), // ~10 calories per minute
      co2Saved: Number(((duration / 60) * 0.8).toFixed(2)), // 0.8kg per hour
      airFiltered: Number(((duration / 60) * 2.3).toFixed(1)), // 2.3L per hour
    }

    this.sessionHistory.unshift(completedSession)
    this.currentSession = null
    this.saveToStorage()

    return completedSession
  }

  pauseRide(): RideSession | null {
    if (!this.currentSession || this.currentSession.status !== "active") {
      return null
    }

    this.currentSession.status = "paused"
    this.saveToStorage()
    return this.currentSession
  }

  resumeRide(): RideSession | null {
    if (!this.currentSession || this.currentSession.status !== "paused") {
      return null
    }

    this.currentSession.status = "active"
    this.saveToStorage()
    return this.currentSession
  }

  getCurrentSession(): RideSession | null {
    return this.currentSession
  }

  getSessionHistory(): RideSession[] {
    return this.sessionHistory
  }

  private calculateFare(durationInSeconds: number): number {
    const minutes = Math.ceil(durationInSeconds / 60)
    return 10 + minutes * 5 // Base fare + per minute charge
  }

  // Mock bike data
  getBikeInfo(bikeId: string): BikeInfo {
    return {
      id: bikeId,
      model: "PedalPure EcoRide 2024",
      batteryLevel: 85,
      solarCharge: 92,
      airPurifierStatus: "active",
      location: {
        lat: 28.6139,
        lng: 77.209,
        address: "Connaught Place, New Delhi",
      },
      status: "in-use",
      lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    }
  }

  // Get ride statistics
  getRideStats() {
    const totalRides = this.sessionHistory.length
    const totalDistance = this.sessionHistory.reduce((sum, ride) => sum + ride.distance, 0)
    const totalDuration = this.sessionHistory.reduce((sum, ride) => sum + ride.duration, 0)
    const totalCalories = this.sessionHistory.reduce((sum, ride) => sum + ride.caloriesBurned, 0)
    const totalCO2Saved = this.sessionHistory.reduce((sum, ride) => sum + ride.co2Saved, 0)
    const totalAirFiltered = this.sessionHistory.reduce((sum, ride) => sum + ride.airFiltered, 0)
    const totalSpent = this.sessionHistory.reduce((sum, ride) => sum + ride.totalFare, 0)

    return {
      totalRides,
      totalDistance: Number(totalDistance.toFixed(2)),
      totalDuration,
      totalCalories,
      totalCO2Saved: Number(totalCO2Saved.toFixed(2)),
      totalAirFiltered: Number(totalAirFiltered.toFixed(1)),
      totalSpent,
      averageRideTime: totalRides > 0 ? Math.floor(totalDuration / totalRides) : 0,
      averageDistance: totalRides > 0 ? Number((totalDistance / totalRides).toFixed(2)) : 0,
    }
  }
}
