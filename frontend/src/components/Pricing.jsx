import { Check, X, Zap, Crown, ArrowRight } from 'lucide-react';

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for testing and small catalogs',
      icon: Zap,
      popular: false,
      features: [
        { text: 'Up to 10 images per upload', included: true },
        { text: 'Basic AI clustering', included: true },
        { text: 'CSV export', included: true },
        { text: 'Edit product details', included: true },
        { text: 'Priority support', included: false },
        { text: 'API access', included: false },
        { text: 'Custom branding', included: false },
      ],
      cta: 'Get Started',
      href: 'https://buy.stripe.com/test_free',
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For growing businesses with larger catalogs',
      icon: Crown,
      popular: true,
      features: [
        { text: 'Up to 100 images per upload', included: true },
        { text: 'Advanced AI clustering', included: true },
        { text: 'CSV & JSON export', included: true },
        { text: 'Edit product details', included: true },
        { text: 'Priority support', included: true },
        { text: 'API access', included: true },
        { text: 'Custom branding', included: true },
      ],
      cta: 'Start Pro Trial',
      href: 'https://buy.stripe.com/test_pro',
    },
  ];

  return (
    <div className="w-full py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Choose the plan that fits your needs. Upgrade anytime as your catalog grows.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`
                relative rounded-2xl p-8 transition-all duration-300
                ${plan.popular 
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-300 scale-105 z-10' 
                  : 'bg-white text-slate-900 border border-slate-200 hover:border-indigo-200 hover:shadow-xl'
                }
              `}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`
                  p-2 rounded-lg
                  ${plan.popular ? 'bg-indigo-500' : 'bg-indigo-100'}
                `}>
                  <plan.icon className={`w-5 h-5 ${plan.popular ? 'text-white' : 'text-indigo-600'}`} />
                </div>
                <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.popular ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {plan.period}
                </span>
              </div>

              <p className={`text-sm mb-6 ${plan.popular ? 'text-indigo-100' : 'text-slate-600'}`}>
                {plan.description}
              </p>

              {/* CTA Button */}
              <a
                href={plan.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  block w-full py-3 px-6 rounded-lg font-medium text-center
                  transition-all duration-200 flex items-center justify-center gap-2
                  ${plan.popular
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }
                  hover:scale-[1.02] active:scale-[0.98]
                `}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Features List */}
              <ul className={`mt-8 space-y-3 ${plan.popular ? 'text-indigo-100' : 'text-slate-600'}`}>
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-indigo-200' : 'text-indigo-600'}`} />
                    ) : (
                      <X className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-indigo-400/50' : 'text-slate-300'}`} />
                    )}
                    <span className={feature.included ? '' : 'opacity-50'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 mb-4">
            🔒 Secure payments powered by Stripe • 30-day money-back guarantee
          </p>
          <p className="text-xs text-slate-400">
            Prices are in USD. All plans include access to our API documentation.
          </p>
        </div>
      </div>
    </div>
  );
}

