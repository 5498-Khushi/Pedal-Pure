export interface Bike {
  id: string
  qrCode: string
  status: "available" | "in-use" | "maintenance" | "offline"
  location: {
    lat: number
    lng: number
    address: string
  }
  battery: number
  lastMaintenance: Date
  totalRides: number
  totalDistance: number
  issues: string[]
  model: string
  serialNumber: string
}

export interface BikeStats {
  totalBikes: number
  availableBikes: number
  inUseBikes: number
  maintenanceBikes: number
  offlineBikes: number
  totalRides: number
  totalRevenue: number
  averageRideTime: number
}

export class BikeManager {
  private static instance: BikeManager
  private bikes: Map<string, Bike> = new Map()

  static getInstance(): BikeManager {
    if (!BikeManager.instance) {
      BikeManager.instance = new BikeManager()
    }
    return BikeManager.instance
  }

  constructor() {
    this.loadBikes()
    this.generateMockBikes()
  }

  private loadBikes(): void {
    const stored = localStorage.getItem("pedalpure_bikes")
    if (stored) {
      const bikesData = JSON.parse(stored)
      bikesData.forEach((bike: any) => {
        bike.lastMaintenance = new Date(bike.lastMaintenance)
        this.bikes.set(bike.id, bike)
      })
    }
  }

  private saveBikes(): void {
    const bikesArray = Array.from(this.bikes.values())
    localStorage.setItem("pedalpure_bikes", JSON.stringify(bikesArray))
  }

  private generateMockBikes(): void {
    if (this.bikes.size === 0) {
      const locations = [
        { lat: 28.6139, lng: 77.209, address: "Connaught Place, New Delhi" },
        { lat: 28.5355, lng: 77.391, address: "Noida Sector 18" },
        { lat: 28.4595, lng: 77.0266, address: "Gurgaon Cyber City" },
        { lat: 28.6692, lng: 77.4538, address: "Laxmi Nagar Metro Station" },
        { lat: 28.5244, lng: 77.1855, address: "Hauz Khas Village" },
        { lat: 28.6507, lng: 77.2334, address: "Karol Bagh Market" },
        { lat: 28.6304, lng: 77.2177, address: "India Gate" },
        { lat: 28.6562, lng: 77.241, address: "Chandni Chowk" },
      ]

      const statuses: Bike["status"][] = ["available", "in-use", "maintenance", "offline"]

      for (let i = 1; i <= 25; i++) {
        const location = locations[Math.floor(Math.random() * locations.length)]
        const bike: Bike = {
          id: `PP${String(i).padStart(3, "0")}`,
          qrCode: `QR${String(i).padStart(6, "0")}`,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          location,
          battery: Math.floor(Math.random() * 100) + 1,
          lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          totalRides: Math.floor(Math.random() * 500) + 10,
          totalDistance: Math.floor(Math.random() * 2000) + 50,
          issues: Math.random() > 0.7 ? ["Low tire pressure", "Chain needs lubrication"] : [],
          model: "PedalPure Pro",
          serialNumber: `SN${String(i).padStart(6, "0")}`,
        }
        this.bikes.set(bike.id, bike)
      }
      this.saveBikes()
    }
  }

  getAllBikes(): Bike[] {
    return Array.from(this.bikes.values())
  }

  getBike(id: string): Bike | undefined {
    return this.bikes.get(id)
  }

  updateBikeStatus(id: string, status: Bike["status"]): boolean {
    const bike = this.bikes.get(id)
    if (bike) {
      bike.status = status
      this.saveBikes()
      return true
    }
    return false
  }

  updateBikeLocation(id: string, location: Bike["location"]): boolean {
    const bike = this.bikes.get(id)
    if (bike) {
      bike.location = location
      this.saveBikes()
      return true
    }
    return false
  }

  addBikeIssue(id: string, issue: string): boolean {
    const bike = this.bikes.get(id)
    if (bike) {
      bike.issues.push(issue)
      this.saveBikes()
      return true
    }
    return false
  }

  resolveBikeIssue(id: string, issueIndex: number): boolean {
    const bike = this.bikes.get(id)
    if (bike && issueIndex >= 0 && issueIndex < bike.issues.length) {
      bike.issues.splice(issueIndex, 1)
      this.saveBikes()
      return true
    }
    return false
  }

  performMaintenance(id: string): boolean {
    const bike = this.bikes.get(id)
    if (bike) {
      bike.lastMaintenance = new Date()
      bike.issues = []
      bike.battery = 100
      bike.status = "available"
      this.saveBikes()
      return true
    }
    return false
  }

  getStats(): BikeStats {
    const bikes = this.getAllBikes()
    const rides = JSON.parse(localStorage.getItem("pedalpure_ride_history") || "[]")

    return {
      totalBikes: bikes.length,
      availableBikes: bikes.filter((b) => b.status === "available").length,
      inUseBikes: bikes.filter((b) => b.status === "in-use").length,
      maintenanceBikes: bikes.filter((b) => b.status === "maintenance").length,
      offlineBikes: bikes.filter((b) => b.status === "offline").length,
      totalRides: bikes.reduce((sum, bike) => sum + bike.totalRides, 0),
      totalRevenue: rides.reduce((sum: number, ride: any) => sum + (ride.fare || 0), 0),
      averageRideTime:
        rides.length > 0 ? rides.reduce((sum: number, ride: any) => sum + (ride.duration || 0), 0) / rides.length : 0,
    }
  }

  addNewBike(bike: Omit<Bike, "id" | "qrCode" | "totalRides" | "totalDistance" | "lastMaintenance">): string {
    const id = `PP${String(this.bikes.size + 1).padStart(3, "0")}`
    const qrCode = `QR${String(this.bikes.size + 1).padStart(6, "0")}`

    const newBike: Bike = {
      ...bike,
      id,
      qrCode,
      totalRides: 0,
      totalDistance: 0,
      lastMaintenance: new Date(),
    }

    this.bikes.set(id, newBike)
    this.saveBikes()
    return id
  }

  removeBike(id: string): boolean {
    const deleted = this.bikes.delete(id)
    if (deleted) {
      this.saveBikes()
    }
    return deleted
  }
}
