import toast from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'info' | 'loading';

export const useToast = () => {
  const showToast = (message: string, type: ToastType = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#10b981',
            color: '#fff',
          },
        });
        break;
      case 'error':
        toast.error(message, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#fff',
          },
        });
        break;
      case 'loading':
        return toast.loading(message, {
          position: 'top-center',
        });
      default:
        toast(message, {
          duration: 4000,
          position: 'top-center',
        });
    }
  };

  const dismissToast = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  return { showToast, dismissToast };
};