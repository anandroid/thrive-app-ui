'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { registerServiceWorker, isOnline, setupNetworkListeners } from '@/src/lib/serviceWorker';

interface ServiceWorkerContextType {
  isOffline: boolean;
  isUpdateAvailable: boolean;
  updateServiceWorker: () => void;
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType>({
  isOffline: false,
  isUpdateAvailable: false,
  updateServiceWorker: () => {},
});

export function useServiceWorker() {
  return useContext(ServiceWorkerContext);
}

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  // Initialize as false to avoid hydration mismatch
  const [isOffline, setIsOffline] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check online status after mount
    setIsOffline(!isOnline());
    // Register service worker
    registerServiceWorker().then((reg) => {
      if (reg) {
        setRegistration(reg);
      }
    });

    // Setup network listeners
    const cleanup = setupNetworkListeners(
      () => setIsOffline(false),
      () => setIsOffline(true)
    );

    return cleanup;
  }, []);

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
    }
  };

  return (
    <ServiceWorkerContext.Provider value={{ isOffline, isUpdateAvailable, updateServiceWorker }}>
      {children}
    </ServiceWorkerContext.Provider>
  );
}