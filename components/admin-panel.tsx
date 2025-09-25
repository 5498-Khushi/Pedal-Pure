"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { BikeManager, type Bike, type BikeStats } from "@/lib/bike-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  Battery,
  MapPin,
  Wrench,
  Plus,
  Search,
  Filter,
  BikeIcon,
  Users,
  DollarSign,
  Clock,
} from "lucide-react"

interface AdminPanelProps {
  onClose: () => void
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [bikeManager] = useState(() => BikeManager.getInstance())
  const [bikes, setBikes] = useState<Bike[]>([])
  const [stats, setStats] = useState<BikeStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null)
  const [showAddBike, setShowAddBike] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setBikes(bikeManager.getAllBikes())
    setStats(bikeManager.getStats())
  }

  const filteredBikes = bikes.filter((bike) => {
    const matchesSearch =
      bike.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bike.location.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || bike.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Bike["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-500"
      case "in-use":
        return "bg-blue-500"
      case "maintenance":
        return "bg-yellow-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: Bike["status"]) => {
    switch (status) {
      case "available":
        return "Available"
      case "in-use":
        return "In Use"
      case "maintenance":
        return "Maintenance"
      case "offline":
        return "Offline"
      default:
        return "Unknown"
    }
  }

  const handleStatusChange = (bikeId: string, newStatus: Bike["status"]) => {
    bikeManager.updateBikeStatus(bikeId, newStatus)
    loadData()
  }

  const handleMaintenance = (bikeId: string) => {
    bikeManager.performMaintenance(bikeId)
    loadData()
    setSelectedBike(null)
  }

  const handleAddIssue = (bikeId: string, issue: string) => {
    if (issue.trim()) {
      bikeManager.addBikeIssue(bikeId, issue.trim())
      loadData()
    }
  }

  const handleResolveIssue = (bikeId: string, issueIndex: number) => {
    bikeManager.resolveBikeIssue(bikeId, issueIndex)
    loadData()
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">PedalPure Admin</h1>
            <p className="text-muted-foreground">Manage your bike fleet and operations</p>
          </div>
          <Button onClick={onClose} variant="outline">
            Back to App
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bikes">Bike Fleet</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bikes</CardTitle>
                    <BikeIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalBikes}</div>
                    <p className="text-xs text-muted-foreground">{stats.availableBikes} available</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRides}</div>
                    <p className="text-xs text-muted-foreground">All time rides</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground">Total earnings</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Ride Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(stats.averageRideTime)}m</div>
                    <p className="text-xs text-muted-foreground">Average duration</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Fleet Status */}
            <Card>
              <CardHeader>
                <CardTitle>Fleet Status</CardTitle>
                <CardDescription>Current status of all bikes in your fleet</CardDescription>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.availableBikes}</div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.inUseBikes}</div>
                      <div className="text-sm text-muted-foreground">In Use</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.maintenanceBikes}</div>
                      <div className="text-sm text-muted-foreground">Maintenance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.offlineBikes}</div>
                      <div className="text-sm text-muted-foreground">Offline</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bikes Tab */}
          <TabsContent value="bikes" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bikes by ID or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in-use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={showAddBike} onOpenChange={setShowAddBike}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bike
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Bike</DialogTitle>
                    <DialogDescription>Add a new bike to your fleet</DialogDescription>
                  </DialogHeader>
                  <AddBikeForm
                    onAdd={() => {
                      loadData()
                      setShowAddBike(false)
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Bikes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBikes.map((bike) => (
                <Card key={bike.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{bike.id}</CardTitle>
                      <Badge className={`${getStatusColor(bike.status)} text-white`}>
                        {getStatusText(bike.status)}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {bike.location.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Battery className="h-4 w-4 mr-2" />
                        <span className="text-sm">Battery</span>
                      </div>
                      <span className="text-sm font-medium">{bike.battery}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Rides</span>
                      <span className="text-sm font-medium">{bike.totalRides}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Distance</span>
                      <span className="text-sm font-medium">{bike.totalDistance} km</span>
                    </div>

                    {bike.issues.length > 0 && (
                      <div className="flex items-center text-yellow-600">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="text-sm">{bike.issues.length} issue(s)</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <BikeDetailsDialog bike={bike} onUpdate={loadData} />
                        </DialogContent>
                      </Dialog>

                      <Select
                        value={bike.status}
                        onValueChange={(value) => handleStatusChange(bike.id, value as Bike["status"])}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="in-use">In Use</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Required</CardTitle>
                <CardDescription>Bikes that need attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bikes
                    .filter((bike) => bike.issues.length > 0 || bike.status === "maintenance")
                    .map((bike) => (
                      <div key={bike.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{bike.id}</h4>
                          <p className="text-sm text-muted-foreground">{bike.location.address}</p>
                          {bike.issues.length > 0 && (
                            <div className="mt-2">
                              {bike.issues.map((issue, index) => (
                                <Badge key={index} variant="destructive" className="mr-2 mb-1">
                                  {issue}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button onClick={() => handleMaintenance(bike.id)} size="sm">
                          <Wrench className="h-4 w-4 mr-2" />
                          Complete Maintenance
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Utilization Rate</span>
                        <span className="font-medium">{((stats.inUseBikes / stats.totalBikes) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(stats.inUseBikes / stats.totalBikes) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Revenue per Bike</span>
                        <span className="font-medium">₹{(stats.totalRevenue / stats.totalBikes).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue per Ride</span>
                        <span className="font-medium">
                          ₹{stats.totalRides > 0 ? (stats.totalRevenue / stats.totalRides).toFixed(0) : "0"}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Add Bike Form Component
function AddBikeForm({ onAdd }: { onAdd: () => void }) {
  const [formData, setFormData] = useState({
    model: "PedalPure Pro",
    serialNumber: "",
    location: {
      lat: 28.6139,
      lng: 77.209,
      address: "",
    },
    battery: 100,
    status: "available" as Bike["status"],
    issues: [] as string[],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const bikeManager = BikeManager.getInstance()
    bikeManager.addNewBike(formData)
    onAdd()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="serialNumber">Serial Number</Label>
        <Input
          id="serialNumber"
          value={formData.serialNumber}
          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="address">Location Address</Label>
        <Input
          id="address"
          value={formData.location.address}
          onChange={(e) =>
            setFormData({
              ...formData,
              location: { ...formData.location, address: e.target.value },
            })
          }
          required
        />
      </div>

      <div>
        <Label htmlFor="status">Initial Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as Bike["status"] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        Add Bike
      </Button>
    </form>
  )
}

// Bike Details Dialog Component
function BikeDetailsDialog({ bike, onUpdate }: { bike: Bike; onUpdate: () => void }) {
  const [newIssue, setNewIssue] = useState("")
  const bikeManager = BikeManager.getInstance()

  const handleAddIssue = () => {
    if (newIssue.trim()) {
      bikeManager.addBikeIssue(bike.id, newIssue.trim())
      setNewIssue("")
      onUpdate()
    }
  }

  const handleResolveIssue = (issueIndex: number) => {
    bikeManager.resolveBikeIssue(bike.id, issueIndex)
    onUpdate()
  }

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Bike Details - {bike.id}</DialogTitle>
        <DialogDescription>Detailed information and maintenance for this bike</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Model</Label>
          <p className="text-sm text-muted-foreground">{bike.model}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Serial Number</Label>
          <p className="text-sm text-muted-foreground">{bike.serialNumber}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">QR Code</Label>
          <p className="text-sm text-muted-foreground">{bike.qrCode}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Battery Level</Label>
          <p className="text-sm text-muted-foreground">{bike.battery}%</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Total Rides</Label>
          <p className="text-sm text-muted-foreground">{bike.totalRides}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Total Distance</Label>
          <p className="text-sm text-muted-foreground">{bike.totalDistance} km</p>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Location</Label>
        <p className="text-sm text-muted-foreground">{bike.location.address}</p>
        <p className="text-xs text-muted-foreground">
          {bike.location.lat.toFixed(4)}, {bike.location.lng.toFixed(4)}
        </p>
      </div>

      <div>
        <Label className="text-sm font-medium">Last Maintenance</Label>
        <p className="text-sm text-muted-foreground">{bike.lastMaintenance.toLocaleDateString()}</p>
      </div>

      <div>
        <Label className="text-sm font-medium">Issues</Label>
        <div className="space-y-2 mt-2">
          {bike.issues.map((issue, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
              <span className="text-sm">{issue}</span>
              <Button size="sm" variant="outline" onClick={() => handleResolveIssue(index)}>
                Resolve
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              placeholder="Add new issue..."
              value={newIssue}
              onChange={(e) => setNewIssue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddIssue()}
            />
            <Button onClick={handleAddIssue} size="sm">
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
