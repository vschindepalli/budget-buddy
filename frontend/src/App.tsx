import React, { useState, useEffect } from 'react';
import ExpenseForm from './ExpenseForm';
import BudgetDashboard from './BudgetDashboard'; // Import the new dashboard component

// Interface for the expense object as stored in App's state
interface Expense {
  category: string;
  amount: number; // Storing as number after conversion
  date: string;
}

// Interface for the backend response structure
interface BackendResponseData {
  message: string;
  recommendation?: {
    recommendations: string[];
  };
}

const App = () => {
  const [statusMessage, setStatusMessage] = useState("Add your first expense to get recommendations!");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [lastAddedCategory, setLastAddedCategory] = useState<string | null>(null);

  // Callback function passed to ExpenseForm
  const handleExpenseAdded = (backendResponse: BackendResponseData, submittedExpense: Expense) => {
    console.log("Data received in App.tsx from ExpenseForm:", { backendResponse, submittedExpense });

    setExpenses(prevExpenses => [...prevExpenses, submittedExpense]);

    if (backendResponse.recommendation && backendResponse.recommendation.recommendations) {
      setRecommendations(backendResponse.recommendation.recommendations);
    } else {
      setRecommendations([]);
    }

    setStatusMessage(backendResponse.message || `Expense for ${submittedExpense.category} processed!`);
    setLastAddedCategory(submittedExpense.category);
  };

  return (
    <div className="container mx-auto p-4 pb-16">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-brand-blue">
          Budget Buddy
        </h1>
        <p className="text-slate-600 text-lg mt-2">
          Your smart personal finance assistant.
        </p>
      </header>

      <ExpenseForm onExpenseAdded={handleExpenseAdded} />

      {/* Render the BudgetDashboard and pass down the necessary state */}
      <BudgetDashboard
        expenses={expenses}
        recommendations={recommendations}
        lastAddedCategory={lastAddedCategory}
        statusMessage={statusMessage}
      />
    </div>
  );
};

export default App;
