export interface PaymentMethod {
  id: string
  type: "card" | "upi" | "wallet" | "netbanking"
  name: string
  details: string
  isDefault: boolean
  lastUsed?: Date
}

export interface PaymentTransaction {
  id: string
  rideId: string
  amount: number
  paymentMethodId: string
  status: "pending" | "processing" | "completed" | "failed" | "refunded"
  timestamp: Date
  gatewayResponse?: any
  failureReason?: string
}

export interface WalletBalance {
  balance: number
  currency: string
  lastUpdated: Date
}

export class PaymentManager {
  private static instance: PaymentManager
  private paymentMethods: PaymentMethod[] = []
  private transactions: PaymentTransaction[] = []
  private walletBalance: WalletBalance = {
    balance: 150.0,
    currency: "INR",
    lastUpdated: new Date(),
  }

  private constructor() {
    this.loadFromStorage()
    this.initializeDefaultPaymentMethods()
  }

  static getInstance(): PaymentManager {
    if (!PaymentManager.instance) {
      PaymentManager.instance = new PaymentManager()
    }
    return PaymentManager.instance
  }

  private loadFromStorage() {
    try {
      const methods = localStorage.getItem("pedalpure_payment_methods")
      const transactions = localStorage.getItem("pedalpure_transactions")
      const wallet = localStorage.getItem("pedalpure_wallet")

      if (methods) {
        this.paymentMethods = JSON.parse(methods).map((method: any) => ({
          ...method,
          lastUsed: method.lastUsed ? new Date(method.lastUsed) : undefined,
        }))
      }

      if (transactions) {
        this.transactions = JSON.parse(transactions).map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp),
        }))
      }

      if (wallet) {
        const walletData = JSON.parse(wallet)
        this.walletBalance = {
          ...walletData,
          lastUpdated: new Date(walletData.lastUpdated),
        }
      }
    } catch (error) {
      console.error("Error loading payment data from storage:", error)
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem("pedalpure_payment_methods", JSON.stringify(this.paymentMethods))
      localStorage.setItem("pedalpure_transactions", JSON.stringify(this.transactions))
      localStorage.setItem("pedalpure_wallet", JSON.stringify(this.walletBalance))
    } catch (error) {
      console.error("Error saving payment data to storage:", error)
    }
  }

  private initializeDefaultPaymentMethods() {
    if (this.paymentMethods.length === 0) {
      this.paymentMethods = [
        {
          id: "wallet_default",
          type: "wallet",
          name: "PedalPure Wallet",
          details: `₹${this.walletBalance.balance.toFixed(2)} available`,
          isDefault: true,
          lastUsed: new Date(),
        },
        {
          id: "upi_demo",
          type: "upi",
          name: "UPI",
          details: "user@paytm",
          isDefault: false,
        },
        {
          id: "card_demo",
          type: "card",
          name: "Credit Card",
          details: "**** **** **** 1234",
          isDefault: false,
        },
      ]
      this.saveToStorage()
    }
  }

  async processPayment(
    rideId: string,
    amount: number,
    paymentMethodId: string,
    onProgress?: (status: string) => void,
  ): Promise<PaymentTransaction> {
    const paymentMethod = this.paymentMethods.find((m) => m.id === paymentMethodId)
    if (!paymentMethod) {
      throw new Error("Payment method not found")
    }

    const transaction: PaymentTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rideId,
      amount,
      paymentMethodId,
      status: "pending",
      timestamp: new Date(),
    }

    this.transactions.unshift(transaction)
    this.saveToStorage()

    try {
      // Simulate payment processing
      onProgress?.("Initiating payment...")
      await this.delay(1000)

      transaction.status = "processing"
      onProgress?.("Processing payment...")
      await this.delay(2000)

      // Handle different payment methods
      if (paymentMethod.type === "wallet") {
        if (this.walletBalance.balance < amount) {
          throw new Error("Insufficient wallet balance")
        }
        this.walletBalance.balance -= amount
        this.walletBalance.lastUpdated = new Date()

        // Update wallet payment method details
        const walletMethod = this.paymentMethods.find((m) => m.id === "wallet_default")
        if (walletMethod) {
          walletMethod.details = `₹${this.walletBalance.balance.toFixed(2)} available`
        }
      }

      // Simulate random payment failure (10% chance)
      if (Math.random() < 0.1) {
        throw new Error("Payment gateway timeout")
      }

      transaction.status = "completed"
      transaction.gatewayResponse = {
        transactionId: `gw_${Date.now()}`,
        gateway: paymentMethod.type === "wallet" ? "wallet" : "razorpay",
        timestamp: new Date(),
      }

      // Update payment method last used
      paymentMethod.lastUsed = new Date()

      onProgress?.("Payment successful!")
    } catch (error) {
      transaction.status = "failed"
      transaction.failureReason = error instanceof Error ? error.message : "Unknown error"
      onProgress?.(`Payment failed: ${transaction.failureReason}`)
    }

    this.saveToStorage()
    return transaction
  }

  async refundPayment(transactionId: string): Promise<PaymentTransaction> {
    const transaction = this.transactions.find((tx) => tx.id === transactionId)
    if (!transaction) {
      throw new Error("Transaction not found")
    }

    if (transaction.status !== "completed") {
      throw new Error("Only completed transactions can be refunded")
    }

    // Create refund transaction
    const refundTransaction: PaymentTransaction = {
      id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rideId: transaction.rideId,
      amount: -transaction.amount, // Negative amount for refund
      paymentMethodId: transaction.paymentMethodId,
      status: "completed",
      timestamp: new Date(),
      gatewayResponse: {
        originalTransactionId: transactionId,
        refundId: `rf_${Date.now()}`,
        gateway: "refund_system",
      },
    }

    // If original payment was from wallet, add money back
    const paymentMethod = this.paymentMethods.find((m) => m.id === transaction.paymentMethodId)
    if (paymentMethod?.type === "wallet") {
      this.walletBalance.balance += transaction.amount
      this.walletBalance.lastUpdated = new Date()

      const walletMethod = this.paymentMethods.find((m) => m.id === "wallet_default")
      if (walletMethod) {
        walletMethod.details = `₹${this.walletBalance.balance.toFixed(2)} available`
      }
    }

    // Mark original transaction as refunded
    transaction.status = "refunded"

    this.transactions.unshift(refundTransaction)
    this.saveToStorage()

    return refundTransaction
  }

  addPaymentMethod(method: Omit<PaymentMethod, "id">): PaymentMethod {
    const newMethod: PaymentMethod = {
      ...method,
      id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.paymentMethods.push(newMethod)
    this.saveToStorage()
    return newMethod
  }

  removePaymentMethod(methodId: string): boolean {
    const index = this.paymentMethods.findIndex((m) => m.id === methodId)
    if (index === -1) return false

    this.paymentMethods.splice(index, 1)
    this.saveToStorage()
    return true
  }

  setDefaultPaymentMethod(methodId: string): boolean {
    const method = this.paymentMethods.find((m) => m.id === methodId)
    if (!method) return false

    // Remove default from all methods
    this.paymentMethods.forEach((m) => (m.isDefault = false))

    // Set new default
    method.isDefault = true
    this.saveToStorage()
    return true
  }

  getPaymentMethods(): PaymentMethod[] {
    return [...this.paymentMethods]
  }

  getTransactions(): PaymentTransaction[] {
    return [...this.transactions]
  }

  getWalletBalance(): WalletBalance {
    return { ...this.walletBalance }
  }

  async addMoneyToWallet(amount: number): Promise<PaymentTransaction> {
    const transaction: PaymentTransaction = {
      id: `wallet_add_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rideId: "wallet_topup",
      amount,
      paymentMethodId: "external_payment",
      status: "completed",
      timestamp: new Date(),
      gatewayResponse: {
        transactionId: `topup_${Date.now()}`,
        gateway: "razorpay",
      },
    }

    this.walletBalance.balance += amount
    this.walletBalance.lastUpdated = new Date()

    // Update wallet method details
    const walletMethod = this.paymentMethods.find((m) => m.id === "wallet_default")
    if (walletMethod) {
      walletMethod.details = `₹${this.walletBalance.balance.toFixed(2)} available`
    }

    this.transactions.unshift(transaction)
    this.saveToStorage()

    return transaction
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Get payment statistics
  getPaymentStats() {
    const completedTransactions = this.transactions.filter((tx) => tx.status === "completed" && tx.amount > 0)
    const totalSpent = completedTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const averageTransaction = completedTransactions.length > 0 ? totalSpent / completedTransactions.length : 0
    const failedTransactions = this.transactions.filter((tx) => tx.status === "failed").length
    const successRate =
      this.transactions.length > 0
        ? ((this.transactions.length - failedTransactions) / this.transactions.length) * 100
        : 100

    return {
      totalTransactions: this.transactions.length,
      totalSpent,
      averageTransaction,
      failedTransactions,
      successRate,
      walletBalance: this.walletBalance.balance,
    }
  }
}
