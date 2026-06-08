import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { login, logout, checkAuth } from '../store/authSlice';
import type { User } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  return {
    user,
    loading,
    login: async (email: string, password: string) => {
      const resultAction = await dispatch(login({ email, password }));
      if (login.fulfilled.match(resultAction)) {
        return resultAction.payload as User;
      } else {
        throw new Error(resultAction.payload as string || 'Login failed');
      }
    },
    logout: async () => {
      await dispatch(logout());
    },
    checkAuth: async () => {
      await dispatch(checkAuth());
    }
  };
};

export type { User };
