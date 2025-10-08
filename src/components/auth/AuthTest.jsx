import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthToken, getCurrentUserInfo } from '../../utils/authUtils';
import { BusinessProfileAPI } from '../../api/firebaseClient';

const AuthTest = () => {
  const { user, userInfo } = useAuth();
  const [token, setToken] = useState('');
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetToken = async () => {
    try {
      const authToken = await getAuthToken();
      setToken(authToken ? `${authToken.substring(0, 50)}...` : 'No token');
    } catch (error) {
      setToken(`Error: ${error.message}`);
    }
  };

  const handleTestAPI = async () => {
    setLoading(true);
    try {
      // Test a simple API call to see if auth headers are included
      const result = await BusinessProfileAPI.getUserData(user?.uid || 'test-user');
      setTestResult(`API call successful: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResult(`API call failed: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Authentication Test Component</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">User Info:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify({ user: userInfo, authenticated: !!user }, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Firebase Token:</h3>
          <button 
            onClick={handleGetToken}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-2"
          >
            Get Auth Token
          </button>
          <div className="bg-gray-100 p-2 rounded text-sm break-all">
            {token || 'Click button to get token'}
          </div>
        </div>

        <div>
          <h3 className="font-semibold">API Test:</h3>
          <button 
            onClick={handleTestAPI}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 mb-2"
          >
            {loading ? 'Testing...' : 'Test API Call'}
          </button>
          <div className="bg-gray-100 p-2 rounded text-sm max-h-40 overflow-auto">
            {testResult || 'Click button to test API'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;