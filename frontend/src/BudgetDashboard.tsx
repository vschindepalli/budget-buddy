import React from 'react';

// Interface for a single expense (should match the one in App.tsx)
interface Expense {
  category: string;
  amount: number;
  date: string;
}

// Interface for a single savings tip (can be simple string or an object)
interface SavingsTip {
  id: string; // For key and potential interaction
  text: string;
  // approved?: boolean; // Optional: if we manage approval state here
}

// Props that BudgetDashboard will receive from App.tsx
interface BudgetDashboardProps {
  expenses: Expense[];
  recommendations: string[];
  savingsTips: SavingsTip[]; // New prop for savings tips
  lastAddedCategory: string | null;
  statusMessage: string;
  onApproveTip?: (tipId: string) => void; // Optional: Callback for when a tip is approved
}

const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  expenses,
  recommendations,
  savingsTips,
  lastAddedCategory,
  statusMessage,
  onApproveTip
}) => {
  return (
    <div className="mt-10 space-y-10">
      {/* Status Message and Recommendations Section */}
      <div className="max-w-xl mx-auto">
        {statusMessage && (
          <div className={`p-4 mb-6 rounded-md shadow ${recommendations.length > 0 || savingsTips.length > 0 ? 'bg-blue-50 border border-blue-300' : 'bg-slate-50 border border-slate-200'}`}>
            <p className={`text-center font-medium ${(recommendations.length > 0 || savingsTips.length > 0) ? 'text-brand-blue' : 'text-slate-700'}`}>
              {statusMessage}
            </p>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-brand-green mb-4 text-center">
              Smart Budget Recommendations {lastAddedCategory && `for ${lastAddedCategory}`}
            </h2>
            <ul className="space-y-3">
              {recommendations.map((rec, index) => (
                <li key={`rec-${index}`} className="flex items-start p-3 bg-green-50 rounded-md">
                  <svg className="flex-shrink-0 h-6 w-6 text-brand-green mr-3 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.354a15.057 15.057 0 01-4.5 0m14.25-8.816c-.390-.083-.79-.152-1.194-.216m1.194.216A12.042 12.042 0 0012 6.426M12 6.426A12.042 12.042 0 007.946 8.03M1.75 8.03a15.057 15.057 0 004.5 0M12 3V1.5A2.25 2.25 0 0114.25 3.75h5.25A2.25 2.25 0 0121.75 6v1.875c0 .621-.504 1.125-1.125 1.125H3.375A1.125 1.125 0 012.25 7.875V6A2.25 2.25 0 014.5 3.75h5.25A2.25 2.25 0 0112 1.5V3z" />
                  </svg>
                  <span className="text-slate-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* NEW: Savings Tips Section */}
        {savingsTips.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-purple-600 mb-4 text-center">
              Savings Tips & Goals
            </h2>
            <ul className="space-y-4">
              {savingsTips.map((tip) => (
                <li key={tip.id} className="p-4 bg-purple-50 rounded-md shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <p className="text-slate-700 mb-2 sm:mb-0 sm:mr-4 flex-grow">{tip.text}</p>
                  <button
                    onClick={() => onApproveTip && onApproveTip(tip.id)}
                    className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-150 text-sm"
                    // disabled={tip.approved} // Optional: disable if already approved
                  >
                    {/* {tip.approved ? 'Approved!' : 'Track this Goal'} */}
                    Track this Goal
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Display the list of expenses */}
      {expenses.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-brand-blue mb-6 text-center">Your Expenses</h2>
          <div className="max-w-2xl mx-auto bg-white p-4 sm:p-6 rounded-xl shadow-lg">
            <ul className="divide-y divide-slate-200">
              {expenses.map((exp, index) => (
                <li key={`exp-${index}`} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-slate-800">{exp.category}</p>
                    <p className="text-sm text-slate-500">{exp.date}</p>
                  </div>
                  <p className="font-semibold text-lg text-slate-700">${exp.amount.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {expenses.length === 0 && recommendations.length === 0 && savingsTips.length === 0 && !statusMessage.toLowerCase().includes("add your first expense") && (
         <div className="text-center text-slate-500 mt-10">
            <p>No expenses recorded yet. Add an expense using the form above to see your dashboard populate!</p>
        </div>
      )}
    </div>
  );
};

export default BudgetDashboard;
