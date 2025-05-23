"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Target, TrendingUp, CheckCircle } from "lucide-react"
import { useState } from "react"

interface Recommendation {
  recommendations?: string[]
  savingsTips?: Array<{ id: string; text: string }>
}

interface RecommendationsPanelProps {
  recommendations: Recommendation | null
  onTrackGoal: (tipId: string, tipText: string) => void
}

export function RecommendationsPanel({ recommendations, onTrackGoal }: RecommendationsPanelProps) {
  const [trackedTips, setTrackedTips] = useState<Set<string>>(new Set())

  const handleTrackTip = (tipId: string, tipText: string) => {
    onTrackGoal(tipId, tipText)
    setTrackedTips((prev) => new Set([...prev, tipId]))
  }

  if (!recommendations) {
    return (
      <Card className="mx-auto max-w-4xl border-violet-200 bg-gradient-to-br from-violet-50 to-white dark:border-violet-800 dark:from-violet-950 dark:to-gray-800 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 dark:text-gray-200">
            <Lightbulb className="h-5 w-5" />
            AI Insights & Recommendations
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Add an expense to receive personalized budget recommendations and savings tips
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground dark:text-gray-400">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No insights available yet.</p>
            <p className="text-sm">Process an expense to get AI-powered recommendations!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Budget Recommendations */}
      {recommendations.recommendations && recommendations.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:border-blue-800 dark:from-blue-950 dark:to-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Budget Recommendations
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              AI-generated insights based on your recent spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 border-l-4 border-blue-400 dark:border-blue-500 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 rounded-r-lg shadow-sm"
                >
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Savings Tips */}
      {recommendations.savingsTips && recommendations.savingsTips.length > 0 && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:border-green-800 dark:from-green-950 dark:to-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200">
              <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              Personalized Savings Tips
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Actionable tips to help you save money based on your spending patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.savingsTips.map((tip) => {
                const isTracked = trackedTips.has(tip.id)

                return (
                  <div
                    key={tip.id}
                    className="p-4 border border-green-200 dark:border-green-700 rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2 dark:text-gray-200">{tip.text}</p>
                        <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                          ID: {tip.id}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant={isTracked ? "secondary" : "default"}
                        onClick={() => handleTrackTip(tip.id, tip.text)}
                        disabled={isTracked}
                        className={`shrink-0 ${!isTracked ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 dark:from-green-600 dark:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 text-white" : "dark:bg-gray-700 dark:text-gray-300"}`}
                      >
                        {isTracked ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Tracked
                          </>
                        ) : (
                          <>
                            <Target className="h-4 w-4 mr-1" />
                            Track Goal
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!recommendations.recommendations || recommendations.recommendations.length === 0) &&
        (!recommendations.savingsTips || recommendations.savingsTips.length === 0) && (
          <Card className="dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="text-center py-8">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground dark:text-gray-400 opacity-50" />
              <p className="text-muted-foreground dark:text-gray-400">
                No recommendations available from the last expense.
              </p>
              <p className="text-sm text-muted-foreground dark:text-gray-500">
                Try adding another expense to get new insights!
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
