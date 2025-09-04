'use client';

import {useState, useCallback} from 'react';
import {UpgradeModal} from './UpgradeModal';

interface UseUpgradeModalReturn {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  handleUpgrade: (planId: string) => Promise<void>;
  loading: boolean;
  UpgradeModalComponent: React.ComponentType<{
    currentPlan?: string;
  }>;
}

export function useUpgradeModal(): UseUpgradeModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleUpgrade = useCallback(async (planId: string) => {
    setLoading(true);

    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({planId}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upgrade');
      }

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        // Handle successful upgrade without checkout (e.g., plan change)
        closeModal();
        // You might want to refresh the page or update the UI
        window.location.reload();
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [closeModal]);

  const UpgradeModalComponent = useCallback(({currentPlan = 'free'}: {currentPlan?: string}) => (
    <UpgradeModal
      open={isOpen}
      onOpenChange={setIsOpen}
      currentPlan={currentPlan}
      onUpgrade={handleUpgrade}
      loading={loading}
    />
  ), [isOpen, handleUpgrade, loading]);

  return {
    isOpen,
    openModal,
    closeModal,
    handleUpgrade,
    loading,
    UpgradeModalComponent,
  };
}
