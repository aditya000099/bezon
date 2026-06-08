import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  WarningCircleIcon,
  InfoIcon,
  WarningIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { removeToast } from '../store/toastSlice';

const ToastItem: React.FC<{ t: any }> = ({ t }) => {
  const dispatch = useDispatch();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(t.id));
    }, 3000);
    return () => clearTimeout(timer);
  }, [t.id, dispatch]);

  let Icon = InfoIcon;
  let iconColor = 'text-blue-400';

  if (t.type === 'success') {
    Icon = CheckCircleIcon;
    iconColor = 'text-emerald-400';
  } else if (t.type === 'error') {
    Icon = WarningCircleIcon;
    iconColor = 'text-rose-400';
  } else if (t.type === 'warning') {
    Icon = WarningIcon;
    iconColor = 'text-amber-400';
  }

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: -25,
        scale: 0.85,
        filter: 'blur(10px)',
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      exit={{
        width: 42,
        minWidth: 42,
        paddingLeft: 8,
        paddingRight: 8,
        opacity: [1, 1, 0],
        scale: [1, 0.9, 0.5],
        transition: {
          duration: 0.45,
          times: [0, 0.8, 1],
          ease: [0.4, 0, 0.2, 1],
        },
      }}
      transition={{
        type: 'spring',
        stiffness: 550,
        damping: 35,
      }}
      className="pointer-events-auto flex items-center gap-3 bg-black/95 backdrop-blur-2xl border border-white/10 px-4 py-2.5 rounded-full shadow-2xl overflow-hidden justify-between max-w-[90vw] origin-center h-[42px]"
    >
      <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
        <motion.div layout>
          <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
        </motion.div>
        <motion.span
          layout
          exit={{
            opacity: 0,
            width: 0,
            marginRight: 0,
            transition: {
              duration: 0.12,
            },
          }}
          className="text-white text-sm font-semibold tracking-tight truncate overflow-hidden"
        >
          {t.message}
        </motion.span>
      </div>
      <motion.button
        layout
        exit={{
          opacity: 0,
          scale: 0.7,
          width: 0,
          marginLeft: 0,
          transition: {
            duration: 0.12,
          },
        }}
        onClick={() => dispatch(removeToast(t.id))}
      >
        <XIcon className="h-3 w-3" />
      </motion.button>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useSelector((state: RootState) => state.toast.toasts);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} />
        ))}
      </AnimatePresence>
    </div>
  );
};
