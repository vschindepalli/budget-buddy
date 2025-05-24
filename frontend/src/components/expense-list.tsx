"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { ScrollArea } from "./ui/scroll-area"
import { Calendar, DollarSign } from "lucide-react"
import React from "react"

interface Expense {
  id?: number
  category: string
  amount: number
  date: string
}

interface ExpenseListProps {
  expenses: Expense[]
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      "Food & Dining": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Transportation: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Shopping: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Entertainment: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      "Bills & Utilities": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      Healthcare: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Travel: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      Education: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "Personal Care": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      Other: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
  }

  return (
    <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-white dark:border-sky-800 dark:from-sky-950 dark:to-gray-800 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-gray-200">
          <DollarSign className="h-5 w-5" />
          Recent Expenses
        </CardTitle>
        <CardDescription className="dark:text-gray-400">Your latest expense transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
              <p>No expenses recorded yet.</p>
              <p className="text-sm">Add your first expense to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense, index) => (
                <div
                  key={expense.id || index}
                  className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950 dark:hover:to-indigo-950 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getCategoryColor(expense.category)}>{expense.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {formatDate(expense.date)}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                    ${expense.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
