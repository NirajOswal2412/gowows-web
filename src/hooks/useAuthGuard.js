import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuthGuard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
    } else {
      // Optionally decode and check expiry using jwt-decode
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (e) {
        console.error('Invalid token:', e);
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  }, []);
};
