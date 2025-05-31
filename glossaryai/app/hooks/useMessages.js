import { useState } from 'react';

export function useMessages() {
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text, duration = 3000) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, duration);
  };

  const clearMessage = () => {
    setMessage({ type: '', text: '' });
  };

  return {
    message,
    showMessage,
    clearMessage,
  };
}