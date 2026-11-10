type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

type ToastListener = (toasts: ToastMessage[]) => void;
type ConfirmListener = (dialog: ConfirmDialogOptions | null) => void;

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: Set<ToastListener> = new Set();
  private confirmListeners: Set<ConfirmListener> = new Set();

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => this.listeners.delete(listener);
  }

  public subscribeConfirm(listener: ConfirmListener): () => void {
    this.confirmListeners.add(listener);
    return () => this.confirmListeners.delete(listener);
  }

  public show(message: string, type: ToastType = 'success', duration = 3500): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastMessage = { id, type, message, duration };
    this.toasts = [newToast, ...this.toasts.slice(0, 4)];
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
    return id;
  }

  public success(message: string, duration = 3500) {
    return this.show(message, 'success', duration);
  }

  public error(message: string, duration = 4500) {
    return this.show(message, 'error', duration);
  }

  public info(message: string, duration = 3500) {
    return this.show(message, 'info', duration);
  }

  public warning(message: string, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public confirm(options: ConfirmDialogOptions) {
    this.confirmListeners.forEach((listener) => listener(options));
  }

  public closeConfirm() {
    this.confirmListeners.forEach((listener) => listener(null));
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }
}

export const toast = new ToastManager();
