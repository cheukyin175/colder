import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Sparkles, CheckCircle, User, Wand2 } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
  onSkipToProfile: () => void;
}

export function Onboarding({ onComplete, onSkipToProfile }: OnboardingProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-colder-frost to-colder-ice flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to Colder
          </h1>
          <p className="text-sm text-gray-600">
            AI-powered LinkedIn outreach messages, personalized for every connection
          </p>
        </div>

        <Separator />

        {/* How It Works */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            How It Works
          </h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-colder-ice/10 flex items-center justify-center">
                <User className="h-4 w-4 text-colder-ice-deep" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-900">
                  Set Up Your Profile
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Tell us about yourself - your name, role, and what makes you unique. This helps create authentic, personalized messages.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-colder-ice/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-colder-ice-deep" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-900">
                  Navigate to LinkedIn
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Visit any LinkedIn profile of someone you'd like to connect with. Colder will automatically detect when you're viewing a profile.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-colder-ice/10 flex items-center justify-center">
                <Wand2 className="h-4 w-4 text-colder-ice-deep" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-900">
                  Generate Your Message
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Choose your tone, purpose, and length. Click "Generate Message" and let Chrome AI craft a personalized outreach message instantly.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Key Features */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Key Features
          </h2>

          <div className="grid gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-colder-ice-deep flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900 font-medium">
                  100% Private & Local
                </p>
                <p className="text-xs text-gray-600">
                  Powered by Chrome AI - all processing happens on your device
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-colder-ice-deep flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900 font-medium">
                  Smart Personalization
                </p>
                <p className="text-xs text-gray-600">
                  Analyzes LinkedIn profiles to create relevant, engaging messages
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-colder-ice-deep flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900 font-medium">
                  Customizable Styles
                </p>
                <p className="text-xs text-gray-600">
                  Choose tone, purpose, and length to match your outreach goals
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-colder-ice-deep flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900 font-medium">
                  Message History
                </p>
                <p className="text-xs text-gray-600">
                  Access and reuse previously generated messages
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Chrome AI Notice */}
        <div className="p-4 bg-colder-ice/5 border border-colder-ice/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-colder-ice-deep flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Chrome AI Required
              </p>
              <p className="text-xs text-gray-600">
                This extension uses Chrome's built-in AI capabilities. If Chrome AI isn't available, you'll be prompted to enable it in{" "}
                <code className="bg-white px-1 py-0.5 rounded text-xs">
                  chrome://flags
                </code>
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2 pt-4">
          <Button
            onClick={onSkipToProfile}
            className="w-full h-11"
            size="lg"
          >
            Set Up Your Profile
          </Button>
          <Button
            onClick={onComplete}
            variant="outline"
            className="w-full"
          >
            Skip for Now
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500">
          You can always access settings and profile from the tabs above
        </p>
      </div>
    </ScrollArea>
  );
}
