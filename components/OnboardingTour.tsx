import React, { useState, useEffect } from 'react';
import { useStore } from '../contexts/CentralStore';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface TourStep {
    title: string;
    content: string;
    highlight?: string; // CSS selector to highlight
}

const TOUR_STEPS: Record<string, TourStep[]> = {
    super_admin: [
        {
            title: '👋 Welcome to SIIFMART Administration',
            content: 'As Super Admin, you have full control over your entire retail and warehouse network. Let\'s take a quick tour!',
        },
        {
            title: '🏢 Central Operations',
            content: 'Access the Admin Dashboard from the sidebar to view network-wide analytics, site performance, and critical alerts across all locations.',
            highlight: 'a[href="/admin"]'
        },
        {
            title: '🔄 Site Switcher',
            content: 'Use the location badge in the top bar to switch between any warehouse or store. Your view will update to show that site\'s data.',
            highlight: '.site-switcher'
        },
        {
            title: '🔍 Global Search',
            content: 'Search across all products, orders, sales, customers, and employees network-wide. Results show which location has each item.',
            highlight: 'input[placeholder*="Global Search"]'
        },
        {
            title: '🌐 Network Inventory',
            content: 'View inventory across all locations. Use Product Lookup to see which warehouses and stores have specific items in stock.',
            highlight: 'a[href="/network-inventory"]'
        }
    ],
    manager: [
        {
            title: '👋 Welcome to SIIFMART',
            content: 'As a Store Manager, you can manage sales, inventory, customers, and staff at your location. Let\'s get started!',
        },
        {
            title: '📊 Dashboard',
            content: 'Your dashboard shows real-time sales, inventory alerts, and staff performance for your store.',
            highlight: 'a[href="/"]'
        },
        {
            title: '🛒 POS Terminal',
            content: 'Process sales, returns, and manage your cash drawer. Scan barcodes or search products by name.',
            highlight: 'a[href="/pos"]'
        },
        {
            title: '📦 Inventory',
            content: 'Manage stock levels, adjust inventory, and request transfers from warehouses.',
            highlight: 'a[href="/inventory"]'
        }
    ],
    warehouse_manager: [
        {
            title: '👋 Welcome to SIIFMART WMS',
            content: 'As a Warehouse Manager, you control receiving, putaway, picking, and shipping operations. Let\'s explore!',
        },
        {
            title: '📋 Fulfillment',
            content: 'Manage PICK, PACK, and PUTAWAY jobs. Track order fulfillment and optimize warehouse operations.',
            highlight: 'a[href="/wms-ops"]'
        },
        {
            title: '🚚 Procurement',
            content: 'Create purchase orders, manage suppliers, and track incoming shipments.',
            highlight: 'a[href="/procurement"]'
        },
        {
            title: '🗺️ Zone Map',
            content: 'View warehouse layout and product locations. Optimize picking routes and storage efficiency.',
            highlight: 'a[href="/inventory"]'
        }
    ],
    pos: [
        {
            title: '👋 Welcome to SIIFMART POS',
            content: 'You\'re all set to start processing sales! Let\'s learn the basics.',
        },
        {
            title: '🛒 POS Terminal',
            content: 'Scan products or search by name. Add items to cart, apply discounts, and complete sales.',
            highlight: 'a[href="/pos"]'
        },
        {
            title: '📜 Sales History',
            content: 'View past transactions, reprint receipts, and process returns.',
            highlight: 'a[href="/sales"]'
        },
        {
            title: '👥 Customers',
            content: 'Look up customer profiles, view purchase history, and manage loyalty points.',
            highlight: 'a[href="/customers"]'
        }
    ]
};

export default function OnboardingTour() {
    const { user } = useStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        // Check if user has completed onboarding
        const hasCompletedOnboarding = localStorage.getItem(`onboarding_${user?.id}`);

        // Show onboarding for new users after a short delay
        if (!hasCompletedOnboarding && user) {
            const timer = setTimeout(() => {
                setIsActive(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    useEffect(() => {
        // Highlight current element
        if (isActive && steps[currentStep]?.highlight) {
            const element = document.querySelector(steps[currentStep].highlight!);
            if (element) {
                element.classList.add('onboarding-highlight');
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Cleanup
        return () => {
            document.querySelectorAll('.onboarding-highlight').forEach(el => {
                el.classList.remove('onboarding-highlight');
            });
        };
    }, [currentStep, isActive]);

    if (!user) return null;

    const steps = TOUR_STEPS[user.role] || TOUR_STEPS.pos;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem(`onboarding_${user.id}`, 'true');
        setIsActive(false);
        setCurrentStep(0);
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!isActive) return null;

    const step = steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-in fade-in" />

            {/* Tour Card */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4">
                <div className="bg-gradient-to-br from-cyber-gray to-black/90 border-2 border-cyber-primary/50 rounded-2xl p-8 shadow-2xl shadow-cyber-primary/20 mx-4">
                    {/* Close Button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        aria-label="Close tour"
                    >
                        <X size={24} />
                    </button>

                    {/* Content */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
                        <p className="text-gray-300 leading-relaxed">{step.content}</p>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex justify-center gap-2 mb-6">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all ${index === currentStep
                                    ? 'w-8 bg-cyber-primary'
                                    : index < currentStep
                                        ? 'w-2 bg-cyber-primary/50'
                                        : 'w-2 bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                            Step {currentStep + 1} of {steps.length}
                        </div>

                        <div className="flex gap-3">
                            {!isFirstStep && (
                                <button
                                    onClick={handlePrevious}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </button>
                            )}

                            <button
                                onClick={isLastStep ? handleComplete : handleNext}
                                className="bg-cyber-primary text-black px-6 py-2 rounded-lg font-bold hover:bg-cyber-accent transition-colors shadow-lg shadow-cyber-primary/30 flex items-center gap-2"
                            >
                                {isLastStep ? 'Get Started' : 'Next'}
                                {!isLastStep && <ArrowRight size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Skip Link */}
                    {!isLastStep && (
                        <div className="text-center mt-4">
                            <button
                                onClick={handleSkip}
                                className="text-xs text-gray-500 hover:text-gray-300 underline"
                            >
                                Skip tour
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add CSS for highlight effect */}
            <style>{`
        .onboarding-highlight {
          position: relative;
          z-index: 99;
          box-shadow: 0 0 0 4px rgba(0, 255, 157, 0.5), 0 0 30px rgba(0, 255, 157, 0.3);
          border-radius: 8px;
          animation: pulse-highlight 2s infinite;
        }

        @keyframes pulse-highlight {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(0, 255, 157, 0.5), 0 0 30px rgba(0, 255, 157, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(0, 255, 157, 0.3), 0 0 40px rgba(0, 255, 157, 0.5);
          }
        }
      `}</style>
        </>
    );
}
