import React, { useState } from 'react';
import axios from 'axios'; // Import axios

// Define an interface for the expense data that will be sent to the backend
interface ExpensePayload {
  category: string;
  amount: number; // Backend expects amount as a float/number
  date: string;
}

// Define an interface for the data structure of the onExpenseAdded callback
// This will now include the backend's response, which contains recommendations.
interface BackendResponseData {
  message: string;
  recommendation?: { // The recommendation field might be optional
    recommendations: string[];
  };
  // Add other fields if your backend returns more data
}


interface ExpenseFormProps {
  // Update the callback to expect the full backend response
  onExpenseAdded: (backendResponse: BackendResponseData, submittedExpense: ExpensePayload) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onExpenseAdded }) => {
  const [expenseInput, setExpenseInput] = useState({
    category: '',
    amount: '', // Keep as string for form input
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For loading state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExpenseInput(prevExpense => ({
      ...prevExpense,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!expenseInput.category.trim() || !expenseInput.amount.trim() || !expenseInput.date) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }
    const amountFloat = parseFloat(expenseInput.amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setError("Please enter a valid positive amount.");
      setIsLoading(false);
      return;
    }

    const expensePayload: ExpensePayload = {
      category: expenseInput.category.trim(),
      amount: amountFloat, // Send as number
      date: expenseInput.date,
    };

    console.log("Submitting expense to backend:", expensePayload);

    try {
      // API Call to your FastAPI backend
      // Ensure your backend is running on http://localhost:8000
      const response = await axios.post<BackendResponseData>(
        'http://localhost:8000/agent/expense/process', // Your backend endpoint
        expensePayload
      );

      console.log("Backend response:", response.data);
      setSuccessMessage(response.data.message || "Expense added successfully!");
      
      // Call the onExpenseAdded prop with the full backend response data
      // and the originally submitted expense data for context if needed by App.tsx
      onExpenseAdded(response.data, expensePayload);

      // Reset form
      setExpenseInput({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
      });

    } catch (apiError: any) {
      console.error("Error submitting expense:", apiError);
      if (axios.isAxiosError(apiError) && apiError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(apiError.response.data.detail || "Failed to add expense. Server error.");
      } else if (axios.isAxiosError(apiError) && apiError.request) {
        // The request was made but no response was received
        setError("Failed to add expense. No response from server. Is it running?");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError("Failed to add expense. Please try again.");
      }
    } finally {
      setIsLoading(false);
      // Clear messages after a few seconds
      setTimeout(() => {
          setSuccessMessage(null);
          setError(null);
      }, 5000); // Increased timeout for better readability
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-lg mx-auto my-8">
      <h2 className="text-2xl font-semibold text-brand-blue mb-6 text-center">Add New Expense</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <input
            type="text"
            name="category"
            id="category"
            value={expenseInput.category}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                       focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
            placeholder="e.g., Groceries, Dining, Utilities"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            name="amount"
            id="amount"
            value={expenseInput.amount}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                       focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">
            Date
          </label>
          <input
            type="date"
            name="date"
            id="date"
            value={expenseInput.date}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                       focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <button
            type="submit"
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                       ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-green hover:bg-green-700'} 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors duration-150`}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
