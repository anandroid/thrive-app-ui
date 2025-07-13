'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  id?: string;
}

export function ModalPortal({ children, id = 'modal-portal' }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Check if portal root exists, if not create it
    let portal = document.getElementById(id);
    
    if (!portal) {
      portal = document.createElement('div');
      portal.id = id;
      // Set styles to ensure it's above everything
      portal.style.position = 'fixed';
      portal.style.top = '0';
      portal.style.left = '0';
      portal.style.right = '0';
      portal.style.bottom = '0';
      portal.style.zIndex = '10000';
      portal.style.pointerEvents = 'none'; // Allow clicks to pass through the container
      document.body.appendChild(portal);
    }

    setPortalElement(portal);
    setMounted(true);

    return () => {
      // Only remove if we created it and no other modals are using it
      if (portal && portal.childNodes.length === 0) {
        portal.remove();
      }
    };
  }, [id]);

  if (!mounted || !portalElement) return null;

  return createPortal(children, portalElement);
}