'use client';

import { Toaster } from 'react-hot-toast';

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        className: '!rounded-xl !border !border-secondary/20 !text-dark',
      }}
    />
  );
}
