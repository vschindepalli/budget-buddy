"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Loader2, Plus } from "lucide-react"

interface ExpenseFormProps {
  onExpenseAdded: (expense: { category: string; amount: number; date: string }) => void
  loading: boolean
}

const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Personal Care",
  "Other",
]

export function ExpenseForm({ onExpenseAdded, loading }: ExpenseFormProps) {
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!category || !amount || !date) {
      return
    }

    const expense = {
      category,
      amount: Number.parseFloat(amount),
      date,
    }

    onExpenseAdded(expense)

    // Reset form
    setCategory("")
    setAmount("")
    setDate(new Date().toISOString().split("T")[0])
  }

  return (
    <Card className="mx-auto max-w-2xl border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-800 dark:from-emerald-950 dark:to-gray-800 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-gray-200">
          <Plus className="h-5 w-5" />
          Add New Expense
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Record your expense and get AI-powered insights and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category" className="dark:text-gray-200">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="dark:text-gray-200">
                Amount ($)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="dark:text-gray-200">
              Date
            </Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 dark:from-emerald-600 dark:to-green-700 dark:hover:from-emerald-700 dark:hover:to-green-800 text-white shadow-md"
            disabled={loading || !category || !amount}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing with AI...
              </>
            ) : (
              "Add Expense & Get Insights"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
