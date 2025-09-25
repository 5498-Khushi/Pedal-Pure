"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  User,
  History,
  TrendingUp,
  Award,
  MapPin,
  Clock,
  DollarSign,
  Activity,
  Wind,
  Calendar,
  CreditCard,
  Star,
} from "lucide-react"
import { RideSessionManager, type RideSession } from "@/lib/ride-session"
import { PaymentManager, type PaymentTransaction } from "@/lib/payment-manager"

interface UserDashboardProps {
  onClose: () => void
}

export function UserDashboard({ onClose }: UserDashboardProps) {
  const [rideHistory, setRideHistory] = useState<RideSession[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([])
  const [rideStats, setRideStats] = useState<any>({})
  const [paymentStats, setPaymentStats] = useState<any>({})
  const [sessionManager] = useState(() => RideSessionManager.getInstance())
  const [paymentManager] = useState(() => PaymentManager.getInstance())

  useEffect(() => {
    const rides = sessionManager.getSessionHistory()
    const payments = paymentManager.getTransactions()
    const rStats = sessionManager.getRideStats()
    const pStats = paymentManager.getPaymentStats()

    setRideHistory(rides)
    setPaymentHistory(payments.filter((tx) => tx.amount > 0)) // Only show payments, not refunds
    setRideStats(rStats)
    setPaymentStats(pStats)
  }, [sessionManager, paymentManager])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getAchievementLevel = (totalRides: number) => {
    if (totalRides >= 50) return { level: "Eco Champion", color: "text-yellow-600", progress: 100 }
    if (totalRides >= 25) return { level: "Green Rider", color: "text-green-600", progress: (totalRides / 50) * 100 }
    if (totalRides >= 10) return { level: "Eco Explorer", color: "text-blue-600", progress: (totalRides / 25) * 100 }
    if (totalRides >= 5) return { level: "Green Starter", color: "text-purple-600", progress: (totalRides / 10) * 100 }
    return { level: "New Rider", color: "text-gray-600", progress: (totalRides / 5) * 100 }
  }

  const achievement = getAchievementLevel(rideStats.totalRides || 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl truncate">User Dashboard</CardTitle>
              <p className="text-sm text-muted-foreground hidden sm:block">Your PedalPure journey</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="shrink-0">
            ✕
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mx-2 sm:mx-6 mb-3 sm:mb-4 text-xs sm:text-sm">
              <TabsTrigger value="overview" className="px-1 sm:px-3">
                Overview
              </TabsTrigger>
              <TabsTrigger value="rides" className="px-1 sm:px-3">
                Rides
              </TabsTrigger>
              <TabsTrigger value="payments" className="px-1 sm:px-3">
                Payments
              </TabsTrigger>
              <TabsTrigger value="achievements" className="px-1 sm:px-3">
                Achievements
              </TabsTrigger>
            </TabsList>

            <div className="max-h-[60vh] overflow-y-auto px-2 sm:px-6 pb-3 sm:pb-6">
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  <Card>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <History className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-primary" />
                      <div className="text-lg sm:text-2xl font-bold">{rideStats.totalRides || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Rides</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <MapPin className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-green-500" />
                      <div className="text-lg sm:text-2xl font-bold">{rideStats.totalDistance || 0}</div>
                      <div className="text-xs text-muted-foreground">km Traveled</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <Activity className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-red-500" />
                      <div className="text-lg sm:text-2xl font-bold">{rideStats.totalCalories || 0}</div>
                      <div className="text-xs text-muted-foreground">Calories Burned</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-blue-500" />
                      <div className="text-lg sm:text-2xl font-bold">₹{rideStats.totalSpent || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Spent</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Environmental Impact */}
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      Environmental Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-3 sm:p-6 pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">CO₂ Saved</span>
                        <span className="font-semibold">{rideStats.totalCO2Saved || 0} kg</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Air Filtered</span>
                        <span className="font-semibold">{rideStats.totalAirFiltered || 0} L</span>
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg Ride Time</span>
                        <span className="font-semibold">{formatTime(rideStats.averageRideTime || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg Distance</span>
                        <span className="font-semibold">{rideStats.averageDistance || 0} km</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    {rideHistory.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {rideHistory.slice(0, 3).map((ride) => (
                          <div
                            key={ride.id}
                            className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                              <div className="min-w-0">
                                <div className="font-medium text-sm sm:text-base truncate">
                                  Ride #{ride.id.slice(-6)}
                                </div>
                                <div className="text-xs sm:text-sm text-muted-foreground">
                                  {formatDate(ride.startTime)} • {ride.distance.toFixed(1)} km
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-semibold text-sm sm:text-base">₹{ride.totalFare}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {formatTime(ride.duration)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-muted-foreground">
                        <History className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                        <p className="text-sm sm:text-base">No rides yet. Start your first eco-friendly journey!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rides" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Ride History</h3>
                  <Badge variant="outline">{rideHistory.length} rides</Badge>
                </div>

                {rideHistory.length > 0 ? (
                  <div className="space-y-3">
                    {rideHistory.map((ride) => (
                      <Card key={ride.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-semibold">Ride #{ride.id.slice(-6)}</div>
                              <div className="text-sm text-muted-foreground">Bike: {ride.bikeId}</div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="text-xs text-muted-foreground">Date</div>
                                <div className="text-sm font-medium">{formatDate(ride.startTime)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="text-xs text-muted-foreground">Duration</div>
                                <div className="text-sm font-medium">{formatTime(ride.duration)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="text-xs text-muted-foreground">Distance</div>
                                <div className="text-sm font-medium">{ride.distance.toFixed(1)} km</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="text-xs text-muted-foreground">Fare</div>
                                <div className="text-sm font-medium">₹{ride.totalFare}</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">
                                <Activity className="w-3 h-3 inline mr-1" />
                                {ride.caloriesBurned} cal
                              </span>
                              <span className="text-muted-foreground">
                                <Wind className="w-3 h-3 inline mr-1" />
                                {ride.co2Saved} kg CO₂
                              </span>
                            </div>
                            <div className="text-muted-foreground">{ride.startLocation.address}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No rides yet</h3>
                    <p>Start your first eco-friendly journey with PedalPure!</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Payment History</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">₹{paymentStats.walletBalance || 0} wallet</Badge>
                    <Badge variant="outline">{paymentHistory.length} transactions</Badge>
                  </div>
                </div>

                {/* Payment Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-500" />
                      <div className="text-lg font-bold">₹{paymentStats.totalSpent || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Spent</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                      <div className="text-lg font-bold">₹{Math.round(paymentStats.averageTransaction || 0)}</div>
                      <div className="text-xs text-muted-foreground">Avg Transaction</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <CreditCard className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                      <div className="text-lg font-bold">{Math.round(paymentStats.successRate || 100)}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </CardContent>
                  </Card>
                </div>

                {paymentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {paymentHistory.map((payment) => (
                      <Card key={payment.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  payment.status === "completed"
                                    ? "bg-green-500"
                                    : payment.status === "failed"
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                                }`}
                              ></div>
                              <div>
                                <div className="font-medium">₹{payment.amount}</div>
                                <div className="text-sm text-muted-foreground">{formatDateTime(payment.timestamp)}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  payment.status === "completed"
                                    ? "default"
                                    : payment.status === "failed"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {payment.status}
                              </Badge>
                              <div className="text-xs text-muted-foreground mt-1">{payment.id.slice(-8)}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
                    <p>Your payment history will appear here after your first ride.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                {/* Current Achievement Level */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      Current Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold ${achievement.color}`}>{achievement.level}</h3>
                        <p className="text-muted-foreground">{rideStats.totalRides || 0} rides completed</p>
                        <div className="mt-2">
                          <Progress value={achievement.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">Progress to next level</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievement Badges */}
                <Card>
                  <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* First Ride */}
                      <div
                        className={`p-4 rounded-lg border-2 text-center ${
                          (rideStats.totalRides || 0) >= 1
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            (rideStats.totalRides || 0) >= 1 ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          <Star className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-sm">First Ride</h4>
                        <p className="text-xs text-muted-foreground">Complete your first ride</p>
                      </div>

                      {/* Distance Milestone */}
                      <div
                        className={`p-4 rounded-lg border-2 text-center ${
                          (rideStats.totalDistance || 0) >= 10
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            (rideStats.totalDistance || 0) >= 10
                              ? "bg-blue-500 text-white"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          <MapPin className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-sm">Explorer</h4>
                        <p className="text-xs text-muted-foreground">Travel 10+ km</p>
                      </div>

                      {/* Eco Warrior */}
                      <div
                        className={`p-4 rounded-lg border-2 text-center ${
                          (rideStats.totalCO2Saved || 0) >= 5
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            (rideStats.totalCO2Saved || 0) >= 5
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          <Wind className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-sm">Eco Warrior</h4>
                        <p className="text-xs text-muted-foreground">Save 5+ kg CO₂</p>
                      </div>

                      {/* Fitness Enthusiast */}
                      <div
                        className={`p-4 rounded-lg border-2 text-center ${
                          (rideStats.totalCalories || 0) >= 500
                            ? "border-red-200 bg-red-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            (rideStats.totalCalories || 0) >= 500
                              ? "bg-red-500 text-white"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          <Activity className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-sm">Fitness Fan</h4>
                        <p className="text-xs text-muted-foreground">Burn 500+ calories</p>
                      </div>

                      {/* Regular Rider */}
                      <div
                        className={`p-4 rounded-lg border-2 text-center ${
                          (rideStats.totalRides || 0) >= 10
                            ? "border-purple-200 bg-purple-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            (rideStats.totalRides || 0) >= 10 ? "bg-purple-500 text-white" : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          <History className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-sm">Regular Rider</h4>
                        <p className="text-xs text-muted-foreground">Complete 10+ rides</p>
                      </div>

                      {/* Big Spender */}
                      <div
                        className={`p-4 rounded-lg border-2 text-center ${
                          (rideStats.totalSpent || 0) >= 500
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            (rideStats.totalSpent || 0) >= 500
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          <DollarSign className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-sm">Supporter</h4>
                        <p className="text-xs text-muted-foreground">Spend ₹500+</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
