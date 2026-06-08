import { useDispatch } from 'react-redux';
import { addToast } from '../store/toastSlice';
import { useMemo } from 'react';

export const useToast = () => {
  const dispatch = useDispatch();

  const toast = useMemo(
    () => ({
      success: (msg: string) => dispatch(addToast({ message: msg, type: 'success' })),
      error: (msg: string) => dispatch(addToast({ message: msg, type: 'error' })),
      info: (msg: string) => dispatch(addToast({ message: msg, type: 'info' })),
      warning: (msg: string) => dispatch(addToast({ message: msg, type: 'warning' })),
    }),
    [dispatch]
  );

  return { toast };
};
