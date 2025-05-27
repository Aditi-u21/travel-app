import React from 'react';
import { useLogInContext } from './Login';

const TwoFactorForm = () => {
  const { twoFactorVerified, twoFactorInput, setTwoFactorInput, verify2FACode } = useLogInContext();

  const handleSubmit = (e) => {
    e.preventDefault();
    verify2FACode(twoFactorInput);
  };

  if (twoFactorVerified) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Enter 2FA Code</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700">
              6-Digit Code
            </label>
            <input
              id="twoFactorCode"
              type="text"
              value={twoFactorInput}
              onChange={(e) => setTwoFactorInput(e.target.value)}
              placeholder="Enter 6-digit code"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              maxLength="6"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorForm;