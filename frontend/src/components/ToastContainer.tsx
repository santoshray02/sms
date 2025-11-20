import Toast, { ToastType } from './Toast';
import { Z_INDEX } from '../config/design-system';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: Z_INDEX.tooltip,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
