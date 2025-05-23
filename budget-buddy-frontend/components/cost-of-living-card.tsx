"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, Loader2 } from "lucide-react"

interface CostOfLivingData {
  city: string
  grocery_index: number
}

export function CostOfLivingCard() {
  const [city, setCity] = useState("")
  const [costData, setCostData] = useState<CostOfLivingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!city.trim()) {
      setError("Please enter a city name")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`http://localhost:8000/mcp/fetch_cost_of_living?city=${encodeURIComponent(city)}`)
      const data = await response.json()

      if (data.result) {
        setCostData(data.result)
      } else if (data.error) {
        setError(data.error)
      }
    } catch (err) {
      setError("Failed to fetch cost of living data")
      console.error("Error fetching cost of living:", err)
    } finally {
      setLoading(false)
    }
  }

  const getIndexColor = (index: number) => {
    if (index < 50) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (index < 75) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    if (index < 100) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  const getIndexDescription = (index: number) => {
    if (index < 50) return "Very Low Cost"
    if (index < 75) return "Low Cost"
    if (index < 100) return "Moderate Cost"
    if (index < 125) return "High Cost"
    return "Very High Cost"
  }

  return (
    <Card className="mx-auto max-w-2xl border-cyan-200 bg-gradient-to-br from-cyan-50 to-white dark:border-cyan-800 dark:from-cyan-950 dark:to-gray-800 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-gray-200">
          <MapPin className="h-5 w-5" />
          Cost of Living Lookup
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Check grocery cost index for different cities to understand local pricing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="dark:text-gray-200">
              City Name
            </Label>
            <div className="flex gap-2">
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name (e.g., Seattle, New York)"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 dark:from-cyan-600 dark:to-blue-700 dark:hover:from-cyan-700 dark:hover:to-blue-800 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {costData && (
          <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white dark:border-teal-800 dark:from-teal-950 dark:to-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg dark:text-gray-200">{costData.city}</CardTitle>
              <CardDescription className="dark:text-gray-400">Cost of Living Information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium dark:text-gray-200">Grocery Index:</span>
                <div className="flex items-center gap-2">
                  <Badge className={getIndexColor(costData.grocery_index)}>{costData.grocery_index.toFixed(1)}</Badge>
                  <span className="text-sm text-muted-foreground dark:text-gray-400">
                    {getIndexDescription(costData.grocery_index)}
                  </span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground dark:text-gray-400 space-y-1">
                <p>• Index of 100 represents average cost</p>
                <p>• Lower values indicate cheaper groceries</p>
                <p>• Higher values indicate more expensive groceries</p>
              </div>

              {costData.grocery_index !== 75 && (
                <div className="p-3 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950 dark:to-cyan-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> This is currently showing mock data. In production, this would connect to a
                    real cost of living API like Numbeo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!costData && !loading && (
          <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter a city name to check cost of living data</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
