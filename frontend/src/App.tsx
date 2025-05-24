"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Badge } from "./components/ui/badge"
import { DollarSign, TrendingUp, Target, MapPin } from "lucide-react"
import { ExpenseForm } from "./components/expense-form"
import { ExpenseList } from "./components/expense-list"
import { RecommendationsPanel } from "./components/reccomendations-panel"
import { CostOfLivingCard } from "./components/cost-of-living-card"
import { ThemeToggle } from "./components/theme-toggle"
import React from "react"

interface Expense {
  id?: number
  category: string
  amount: number
  date: string
}

interface Recommendation {
  recommendations?: string[]
  savingsTips?: Array<{ id: string; text: string }>
}

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [totalExpenses, setTotalExpenses] = useState(0)

  //fetch expenses on component mount
  useEffect(() => {
    fetchExpenses()
  }, [])

  //calculate total expenses when expenses change
  useEffect(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    setTotalExpenses(total)
  }, [expenses])

  const fetchExpenses = async () => {
    try {
      const response = await fetch("http://localhost:8000/mcp/get_expenses")
      const data = await response.json()
      if (data.result && data.result.expenses) {
        setExpenses(data.result.expenses)
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
    }
  }

  const handleExpenseAdded = async (expense: Omit<Expense, "id">) => {
    setLoading(true)
    try {
      // Process expense through AI agent
      const response = await fetch("http://localhost:8000/agent/expense/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expense),
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendation)
        await fetchExpenses() //refresh expenses list
      }
    } catch (error) {
      console.error("Error processing expense:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTrackGoal = async (tipId: string, tipText: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/track_goal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tip_id: tipId,
          tip_text: tipText,
        }),
      })

      if (response.ok) {
        //show success feedback
        console.log("Goal tracked successfully")
      }
    } catch (error) {
      console.error("Error tracking goal:", error)
    }
  }

  //get expense categories for overview
  const expensesByCategory = expenses.reduce(
    (acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const topCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Budget Buddy</h1>
          <p className="text-gray-600 dark:text-gray-300">AI-powered expense tracking and financial insights</p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:border-blue-800 dark:from-blue-950 dark:to-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">${totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">{expenses.length} transactions recorded</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:border-green-800 dark:from-green-950 dark:to-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">Top Category</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {topCategories[0] ? topCategories[0][0] : "None"}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                {topCategories[0] ? `$${topCategories[0][1].toFixed(2)}` : "No expenses yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:border-purple-800 dark:from-purple-950 dark:to-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">Active Tips</CardTitle>
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {recommendations?.savingsTips?.length || 0}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Available savings tips</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:border-amber-800 dark:from-amber-950 dark:to-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">Location</CardTitle>
              <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">Seattle</div>
              <p className="text-xs text-amber-600 dark:text-amber-400">Cost analysis location</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm border border-gray-200 dark:bg-gray-800/70 dark:border-gray-700">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-300"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="add-expense"
              className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900 dark:data-[state=active]:text-green-300"
            >
              Add Expense
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900 dark:data-[state=active]:text-purple-300"
            >
              AI Insights
            </TabsTrigger>
            <TabsTrigger
              value="cost-living"
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900 dark:data-[state=active]:text-amber-300"
            >
              Cost of Living
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ExpenseList expenses={expenses} />
              </div>
              <div className="space-y-4">
                <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white dark:border-slate-700 dark:from-slate-800 dark:to-gray-800">
                  <CardHeader>
                    <CardTitle className="text-slate-800 dark:text-slate-200">Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topCategories.map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                        >
                          {category}
                        </Badge>
                        <span className="font-medium text-slate-800 dark:text-slate-200">${amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {topCategories.length === 0 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No expenses recorded yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="add-expense">
            <ExpenseForm onExpenseAdded={handleExpenseAdded} loading={loading} />
          </TabsContent>

          <TabsContent value="insights">
            <RecommendationsPanel recommendations={recommendations} onTrackGoal={handleTrackGoal} />
          </TabsContent>

          <TabsContent value="cost-living">
            <CostOfLivingCard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
