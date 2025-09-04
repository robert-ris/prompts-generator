'use client';

import {useState, useCallback} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {
  Crown,
  Check,
  Star,
  Zap,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface PlanFeature {
  name: string;
  description: string;
  icon: React.ComponentType<{className?: string}>;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  current?: boolean;
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
  onUpgrade?: (planId: string) => Promise<void>;
  loading?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    current: true,
    features: [
      {
        name: '10 AI improvements per month',
        description: 'Basic AI prompt enhancement',
        icon: Sparkles,
      },
      {
        name: '20 saved prompts',
        description: 'Store your favorite prompts',
        icon: Clock,
      },
      {
        name: 'Basic templates',
        description: 'Access to standard templates',
        icon: Users,
      },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: 'month',
    description: 'For power users and professionals',
    popular: true,
    features: [
      {
        name: 'Unlimited AI improvements',
        description: 'No limits on AI enhancements',
        icon: Zap,
      },
      {
        name: 'Unlimited saved prompts',
        description: 'Store as many prompts as you need',
        icon: Clock,
      },
      {
        name: 'Advanced templates',
        description: 'Access to premium templates',
        icon: Users,
      },
      {
        name: 'Priority support',
        description: 'Get help when you need it',
        icon: Shield,
      },
      {
        name: 'Analytics & insights',
        description: 'Track your usage and performance',
        icon: Star,
      },
      {
        name: 'Team collaboration',
        description: 'Share prompts with your team',
        icon: Users,
      },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$29',
    period: 'month',
    description: 'For teams and organizations',
    features: [
      {
        name: 'Everything in Pro',
        description: 'All Pro features included',
        icon: Crown,
      },
      {
        name: 'Custom integrations',
        description: 'Connect with your tools',
        icon: Zap,
      },
      {
        name: 'Advanced analytics',
        description: 'Detailed team insights',
        icon: Star,
      },
      {
        name: 'Dedicated support',
        description: '24/7 priority support',
        icon: Shield,
      },
      {
        name: 'Custom branding',
        description: 'White-label solution',
        icon: Crown,
      },
      {
        name: 'API access',
        description: 'Build custom integrations',
        icon: Zap,
      },
    ],
  },
];

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlan = 'free',
  onUpgrade,
  loading = false,
}: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = useCallback(async () => {
    if (!onUpgrade) return;

    setUpgradeLoading(true);
    setError(null);

    try {
      await onUpgrade(selectedPlan);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade');
    } finally {
      setUpgradeLoading(false);
    }
  }, [selectedPlan, onUpgrade, onOpenChange]);

  const currentPlanData = plans.find(plan => plan.id === currentPlan);
  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="h-6 w-6 text-purple-500" />
            <DialogTitle className="text-2xl font-bold">
              Upgrade Your Plan
            </DialogTitle>
          </div>
          <DialogDescription className="text-lg">
            Choose the perfect plan for your needs and unlock unlimited AI improvements
          </DialogDescription>
        </DialogHeader>

        {/* Current Plan Display */}
        {currentPlanData && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Current Plan: {currentPlanData.name}
              </span>
            </div>
          </div>
        )}

        {/* Plan Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlan;
            const isCurrent = plan.id === currentPlan;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer ${isSelected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${isCurrent ? 'opacity-75' : ''}`}
                onClick={() => !isCurrent && setSelectedPlan(plan.id)}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="secondary">Current Plan</Badge>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <FeatureIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium">
                            {feature.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {feature.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selection Indicator */}
                {isSelected && !isCurrent && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Plan Summary */}
        {selectedPlanData && selectedPlanData.id !== currentPlan && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Selected Plan: {selectedPlanData.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedPlanData.price}/{selectedPlanData.period}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{selectedPlanData.price}</div>
                <div className="text-sm text-gray-500">per {selectedPlanData.period}</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={upgradeLoading}
          >
            Cancel
          </Button>
          {selectedPlanData && selectedPlanData.id !== currentPlan && (
            <Button
              onClick={handleUpgrade}
              disabled={upgradeLoading || loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {upgradeLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Upgrade to {selectedPlanData.name}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </DialogFooter>

        {/* Testimonials */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
            What our Pro users say:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-purple-700 dark:text-purple-300">
                  "The unlimited AI improvements have transformed my workflow. I can iterate on prompts without worrying about limits."
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  - Sarah M., Content Creator
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-purple-700 dark:text-purple-300">
                  "Advanced templates and team collaboration features make this a must-have for our marketing team."
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  - Mike R., Marketing Director
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
