import React, { useState, useEffect } from 'react';
import ExpenseForm from './ExpenseForm';
import BudgetDashboard from './BudgetDashboard';

// Interface for the expense object as stored in App's state
interface Expense {
  category: string;
  amount: number;
  date: string;
}

// Interface for a single savings tip (should match BudgetDashboard's)
interface SavingsTip {
  id: string;
  text: string;
  // approved?: boolean; // We can manage approval state in App.tsx if needed
}

// Updated Interface for the backend response structure
// Let's assume the backend might also return savingsTips now
interface BackendResponseData {
  message: string;
  recommendation?: {
    recommendations: string[];
  };
  savingsTips?: SavingsTip[]; // Assuming backend might send this
}

const App = () => {
  const [statusMessage, setStatusMessage] = useState("Add your first expense to get recommendations and tips!");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [savingsTips, setSavingsTips] = useState<SavingsTip[]>([]); // New state for savings tips
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

    // Handle savings tips from backend or mock them for now
    if (backendResponse.savingsTips && backendResponse.savingsTips.length > 0) {
      setSavingsTips(backendResponse.savingsTips);
    } else {
      // Mock savings tips if backend doesn't provide them yet
      // This is temporary until your Savings Agent is implemented
      const mockTips: SavingsTip[] = [
        { id: 'st1', text: `Consider reducing spending on '${submittedExpense.category}' by 10% this month.` },
        { id: 'st2', text: 'Try a "no-spend" weekend challenge.' },
        { id: 'st3', text: `Set a specific savings goal for something you want, related to ${submittedExpense.category} if possible.`},
      ];
      // Only show a couple of mock tips
      setSavingsTips(mockTips.slice(0, 2));
    }

    setStatusMessage(backendResponse.message || `Expense for ${submittedExpense.category} processed!`);
    setLastAddedCategory(submittedExpense.category);
  };

  // Handler for approving a savings tip
  const handleApproveTip = (tipId: string) => {
    console.log("Attempting to approve/track tip with ID:", tipId);
    // Here you would typically:
    // 1. Update the state of the specific tip (e.g., mark as approved)
    // 2. Potentially make an API call to the backend to record this action
    setSavingsTips(prevTips =>
      prevTips.map(tip =>
        tip.id === tipId ? { ...tip, text: `${tip.text} (Goal Tracked!)` } : tip
      )
    );
    // For now, we'll just log it and maybe update the text or UI slightly
    setStatusMessage(`Goal related to tip ID '${tipId}' is now being tracked!`);
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

      <BudgetDashboard
        expenses={expenses}
        recommendations={recommendations}
        savingsTips={savingsTips} // Pass savings tips
        lastAddedCategory={lastAddedCategory}
        statusMessage={statusMessage}
        onApproveTip={handleApproveTip} // Pass the handler
      />
    </div>
  );
};

export default App;
