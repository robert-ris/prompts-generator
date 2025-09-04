'use client';

import {QuotaMeter} from './QuotaMeter';

export function QuotaMeterDemo() {
  const handleUpgrade = () => {
    console.log('Upgrade clicked');
    // This would typically open a modal or navigate to upgrade page
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">QuotaMeter Component Demo</h2>

      {/* Compact Variant */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Compact Variant</h3>
        <div className="space-y-2">
          <QuotaMeter
            used={5}
            limit={10}
            variant="compact"
            onUpgrade={handleUpgrade}
          />
          <QuotaMeter
            used={8}
            limit={10}
            variant="compact"
            onUpgrade={handleUpgrade}
          />
          <QuotaMeter
            used={10}
            limit={10}
            variant="compact"
            onUpgrade={handleUpgrade}
          />
        </div>
      </div>

      {/* Detailed Variant */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Detailed Variant</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuotaMeter
            used={3}
            limit={10}
            resetDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
            onUpgrade={handleUpgrade}
          />
          <QuotaMeter
            used={8}
            limit={10}
            resetDate={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)}
            onUpgrade={handleUpgrade}
          />
        </div>
      </div>

      {/* Full Variant */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Full Variant</h3>
        <QuotaMeter
          used={7}
          limit={10}
          resetDate={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)}
          variant="full"
          onUpgrade={handleUpgrade}
        />
      </div>

      {/* Pro User (Unlimited) */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Pro User (Unlimited)</h3>
        <QuotaMeter
          used={25}
          limit={-1}
          variant="detailed"
          showUpgradePrompt={false}
        />
      </div>
    </div>
  );
}
