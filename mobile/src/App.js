import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { initializeAuth } from './utils/authUtils';

const App = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Initialize authentication state when app starts
    const initAuth = async () => {
      try {
        await initializeAuth(dispatch);
        console.log('Authentication state initialized');
      } catch (error) {
        console.error('Failed to initialize auth state:', error);
      }
    };
    
    initAuth();
  }, [dispatch]);
  
  // ... rest of your App component ...
}; 