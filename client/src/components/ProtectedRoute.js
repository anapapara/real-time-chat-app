import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('token'); 

  // If no token is found, redirect to the login page
  if (!token) {
    return <Navigate to="/" />;
  }

  // If the token exists, render the children components (protected content)
  return children;
};

export default ProtectedRoute;