import { useState, useEffect } from "react";
import type { MessageDraft, ExtensionSettings } from "./types";
import { createDefaultSettings } from "./types";
import { supabase } from "./lib/supabase";
import { CreditStatus } from "./components/CreditStatus";
import { UpgradeModal } from "./components/UpgradeModal";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { ScrollArea } from "./components/ui/scroll-area";
import { Separator } from "./components/ui/separator";
import {
  Sparkles,
  Settings,
  Copy,
  RotateCw,
  Wand2,
  User,
  LogOut,
  Crown,
  Loader2
} from "lucide-react";
import "./styles/global.css";

// Define the different views and states for the UI
type AuthState = "unauthenticated" | "authenticating" | "authenticated";
type View = "generate" | "profile" | "settings";
type GenerateState = "idle" | "loading" | "message" | "error";

const BACKEND_URL = "http://localhost:3000";

function IndexSidePanel() {
  // --- STATE MANAGEMENT ---
  const [authState, setAuthState] = useState<AuthState>("authenticating");
  const [jwt, setJwt] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>("generate");
  const [generateState, setGenerateState] = useState<GenerateState>("idle");
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<ExtensionSettings>(createDefaultSettings());
  const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null);
  const [isOnLinkedIn, setIsOnLinkedIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Message customization state
  const [messageTone, setMessageTone] = useState<'professional' | 'casual' | 'enthusiastic' | 'formal' | 'friendly'>('professional');
  const [messagePurpose, setMessagePurpose] = useState<'connection' | 'coffee_chat' | 'informational_interview' | 'collaboration' | 'job_inquiry' | 'sales' | 'custom'>('connection');
  const [customPurpose, setCustomPurpose] = useState("");
  const [messageLength, setMessageLength] = useState<'short' | 'medium' | 'long'>('medium');

  // Cache for regeneration
  const [lastGenerateParams, setLastGenerateParams] = useState<any>(null);
  const [showPolishInput, setShowPolishInput] = useState(false);
  const [polishFeedback, setPolishFeedback] = useState("");
  const [isPolished, setIsPolished] = useState(false);

  // Auth form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Payment state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO'>('FREE');

  // --- HOOKS ---

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        setJwt(session.access_token);
        setAuthState("authenticated");
      } else {
        setAuthState("unauthenticated");
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url?.includes("linkedin.com/in/")) {
        setIsOnLinkedIn(true);
      } else {
        setIsOnLinkedIn(false);
      }
    };
    checkAuthAndLoadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        setJwt(session.access_token);
        setAuthState("authenticated");
      } else {
        setJwt(null);
        setAuthState("unauthenticated");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for tab updates to detect LinkedIn profile navigation
  useEffect(() => {
    const checkLinkedInProfile = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url?.includes("linkedin.com/in/")) {
          setIsOnLinkedIn(true);
        } else {
          setIsOnLinkedIn(false);
        }
      } catch (error) {
        console.error("Error checking LinkedIn profile:", error);
      }
    };

    // Check immediately
    checkLinkedInProfile();

    // Listen for tab updates
    const handleTabUpdate = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.url) {
        checkLinkedInProfile();
      }
    };

    // Listen for tab activation (switching tabs)
    const handleTabActivated = () => {
      checkLinkedInProfile();
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabActivated);

    // Poll every 2 seconds as a fallback (side panel might not receive all events)
    const interval = setInterval(checkLinkedInProfile, 2000);

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      if (authState === "authenticated" && jwt) {
        try {
          const settingsResponse = await fetch(`${BACKEND_URL}/settings`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
          if (!settingsResponse.ok) throw new Error("Failed to fetch settings");
          const backendSettings = await settingsResponse.json();
          setSettings(backendSettings);

          const creditResponse = await fetch(`${BACKEND_URL}/credits/status`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
          if (creditResponse.ok) {
            const creditData = await creditResponse.json();
            setUserPlan(creditData.plan);
          }
        } catch (e: any) {
          setError(e.message);
        }
      }
    };
    loadSettings();
  }, [authState, jwt]);

  // --- HANDLERS ---

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setAuthState("authenticating");
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.session) throw new Error("Sign in successful but no session created");

      setJwt(data.session.access_token);
      setAuthState("authenticated");
    } catch (e: any) {
      setError(e.message);
      setAuthState("unauthenticated");
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setAuthState("authenticating");
    setError("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data.session) {
        setError("Account created! Please check your email to verify your account.");
        setAuthState("unauthenticated");
        setIsSignUp(false);
        return;
      }

      setJwt(data.session.access_token);
      setAuthState("authenticated");
    } catch (e: any) {
      setError(e.message);
      setAuthState("unauthenticated");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setJwt(null);
    setAuthState("unauthenticated");
  };

  const handleSaveSettings = async () => {
    if (!jwt) return;
    setIsSaving(true);
    try {
      const backendSettings = {
        userName: settings.userName,
        userRole: settings.userRole,
        userCompany: settings.userCompany,
        userBackground: settings.userBackground,
        userValueProposition: settings.userValueProposition,
      };

      const response = await fetch(`${BACKEND_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(backendSettings),
      });
      if (!response.ok) throw new Error("Failed to save settings");

      setTimeout(() => setIsSaving(false), 2000);
    } catch (e: any) {
      setError(e.message);
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!jwt) return;

    setGenerateState("loading");
    setError("");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab found.");

      setLoadingMessage("Connecting to page...");
      try {
        await chrome.tabs.sendMessage(tab.id, { type: "PING" });
      } catch (e) {
        throw new Error("Could not connect to LinkedIn page. Please refresh and try again.");
      }

      setLoadingMessage("Extracting profile...");
      const extractResponse = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_PROFILE" });
      if (!extractResponse.success) throw new Error(extractResponse.error);

      setLoadingMessage("AI is generating your message...");

      const generatePayload = {
        targetProfile: extractResponse.data,
        tone: messageTone,
        purpose: messagePurpose,
        customPurpose: messagePurpose === 'custom' ? customPurpose : undefined,
        length: messageLength
      };

      setLastGenerateParams(generatePayload);

      const generateResponse = await fetch(`${BACKEND_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(generatePayload),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.message || "Failed to generate message.");
      }

      const draft = await generateResponse.json();
      setMessageDraft(draft);
      setGenerateState("message");
      setIsPolished(false);

    } catch (e: any) {
      setError(e.message);
      setGenerateState("error");
    }
  };

  const handleCopy = () => {
    if (!messageDraft?.body) return;
    navigator.clipboard.writeText(messageDraft.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleRegenerate = async () => {
    if (!jwt || !lastGenerateParams) return;

    setGenerateState("loading");
    setLoadingMessage("Regenerating message...");
    setError("");

    setShowPolishInput(false);
    setPolishFeedback("");

    try {
      const response = await fetch(`${BACKEND_URL}/generate/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(lastGenerateParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to regenerate message.");
      }

      const draft = await response.json();
      setMessageDraft(draft);
      setGenerateState("message");
      setIsPolished(false);
    } catch (e: any) {
      setError(e.message);
      setGenerateState("error");
    }
  };

  const handlePolish = async () => {
    if (!jwt || !messageDraft?.body || !polishFeedback.trim()) return;

    setGenerateState("loading");
    setLoadingMessage("Polishing message...");
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/generate/polish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          originalMessage: messageDraft.body,
          userFeedback: polishFeedback,
          tone: messageTone,
          length: messageLength
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to polish message.");
      }

      const polished = await response.json();
      setMessageDraft({
        ...messageDraft,
        body: polished.body,
        wordCount: polished.wordCount
      });
      setShowPolishInput(false);
      setPolishFeedback("");
      setGenerateState("message");
      setIsPolished(true);
    } catch (e: any) {
      setError(e.message);
      setGenerateState("error");
    }
  };

  // --- RENDER LOGIC ---

  const renderProfile = () => (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your professional information</p>
        </div>

        <Separator />

        {/* Profile Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName">Your Name</Label>
            <Input
              id="userName"
              type="text"
              value={settings.userName || ''}
              onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userRole">Your Role</Label>
            <Input
              id="userRole"
              type="text"
              value={settings.userRole || ''}
              onChange={(e) => setSettings({ ...settings, userRole: e.target.value })}
              placeholder="Software Engineer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userCompany">Your Company</Label>
            <Input
              id="userCompany"
              type="text"
              value={settings.userCompany || ''}
              onChange={(e) => setSettings({ ...settings, userCompany: e.target.value })}
              placeholder="Tech Corp"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userBackground">Background</Label>
            <textarea
              id="userBackground"
              value={settings.userBackground || ''}
              onChange={(e) => setSettings({ ...settings, userBackground: e.target.value })}
              placeholder="Your professional background..."
              className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userValueProp">Value Proposition</Label>
            <textarea
              id="userValueProp"
              value={settings.userValueProposition || ''}
              onChange={(e) => setSettings({ ...settings, userValueProposition: e.target.value })}
              placeholder="What value do you bring?"
              className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>
        </div>

        <Separator />

        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Saved!" : "Save Profile"}
        </Button>
      </div>
    </ScrollArea>
  );

  const renderSettings = () => (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your account and subscription</p>
        </div>

        <Separator />

        {/* Subscription Status */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Subscription</Label>
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Current Plan</span>
              {userPlan === 'PRO' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full">
                  <Crown className="h-3 w-3" />
                  PRO
                </div>
              ) : (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                  FREE
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {userPlan === 'FREE' ? '5 messages per day' : '500 messages per month'}
            </p>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              variant={userPlan === 'FREE' ? 'default' : 'outline'}
              className="w-full"
              size="sm"
            >
              {userPlan === 'FREE' ? 'Upgrade to Pro' : 'Manage Subscription'}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Account Actions */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Account</Label>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </ScrollArea>
  );

  const renderGenerate = () => {
    if (!isOnLinkedIn) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Sparkles className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No LinkedIn Profile Detected</h3>
          <p className="text-sm text-gray-500">
            Navigate to a LinkedIn profile to generate personalized messages
          </p>
        </div>
      );
    }

    switch (generateState) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <Loader2 className="h-12 w-12 animate-spin text-gray-900 mb-4" />
            <p className="text-sm text-gray-600">{loadingMessage}</p>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-red-500 mb-4">
              <span className="text-4xl">⚠</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={() => setGenerateState("idle")} variant="outline">
              Try Again
            </Button>
          </div>
        );

      case "message":
        return (
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Generated Message</h2>
                  {isPolished && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600 mt-1">
                      <Wand2 className="h-3 w-3" />
                      Polished
                    </span>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <textarea
                  readOnly
                  value={messageDraft?.body || ""}
                  className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-[200px] text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />

                {showPolishInput && (
                  <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <Label>What would you like to change?</Label>
                    <Input
                      type="text"
                      value={polishFeedback}
                      onChange={(e) => setPolishFeedback(e.target.value)}
                      placeholder="e.g., Make it shorter, more friendly..."
                      onKeyPress={(e) => e.key === 'Enter' && handlePolish()}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handlePolish} className="flex-1">
                        Apply Polish
                      </Button>
                      <Button
                        onClick={() => {
                          setShowPolishInput(false);
                          setPolishFeedback("");
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={handleCopy}
                    className="w-full"
                    variant="default"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "Copied!" : "Copy Message"}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleRegenerate}
                      variant="outline"
                    >
                      <RotateCw className="mr-2 h-4 w-4" />
                      New Version
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPolishInput(!showPolishInput);
                        setPolishFeedback("");
                      }}
                      variant="outline"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Polish
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p><strong>New Version:</strong> Fresh message from scratch</p>
                  <p><strong>Polish:</strong> Refine current message</p>
                  <p className="text-gray-400">Each action uses 1 credit</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        );

      case "idle":
      default:
        return (
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Generate Message</h2>
                <p className="text-sm text-gray-500 mt-1">Customize your message settings</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label>Tone</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(['professional', 'casual', 'enthusiastic', 'formal', 'friendly'] as const).map((tone) => (
                      <Button
                        key={tone}
                        variant={messageTone === tone ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMessageTone(tone)}
                        className="capitalize"
                      >
                        {tone}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Purpose</Label>
                  <select
                    value={messagePurpose}
                    onChange={(e) => setMessagePurpose(e.target.value as any)}
                    className="mt-2 flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                  >
                    <option value="connection">Connection</option>
                    <option value="coffee_chat">Coffee Chat</option>
                    <option value="informational_interview">Info Interview</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="job_inquiry">Job Inquiry</option>
                    <option value="sales">Sales/Partnership</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {messagePurpose === 'custom' && (
                  <div>
                    <Label>Custom Purpose</Label>
                    <Input
                      type="text"
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      placeholder="Describe your purpose..."
                      className="mt-2"
                    />
                  </div>
                )}

                <div>
                  <Label>Length</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(['short', 'medium', 'long'] as const).map((length) => (
                      <Button
                        key={length}
                        variant={messageLength === length ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMessageLength(length)}
                        className="capitalize"
                      >
                        {length}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <Button
                  onClick={handleGenerate}
                  disabled={generateState === 'loading'}
                  className="w-full h-12 text-base"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Message
                </Button>
              </div>
            </div>
          </ScrollArea>
        );
    }
  };

  const renderAuthenticatedApp = () => (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Colder</h1>
            <p className="text-xs text-gray-500">LinkedIn Outreach AI</p>
          </div>
          <CreditStatus
            jwt={jwt}
            backendUrl={BACKEND_URL}
            onUpgradeClick={() => setShowUpgradeModal(true)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as View)} className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none h-12 bg-gray-50 border-b border-gray-200">
          <TabsTrigger value="generate" className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="flex-1 m-0 overflow-hidden">
          {renderGenerate()}
        </TabsContent>

        <TabsContent value="profile" className="flex-1 m-0 overflow-hidden">
          {renderProfile()}
        </TabsContent>

        <TabsContent value="settings" className="flex-1 m-0 overflow-hidden">
          {renderSettings()}
        </TabsContent>
      </Tabs>

      <UpgradeModal
        jwt={jwt}
        backendUrl={BACKEND_URL}
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={userPlan}
      />
    </div>
  );

  const renderUnauthenticated = () => (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Colder</h1>
            <p className="text-sm text-gray-500">
              {isSignUp ? "Create your account" : "Sign in to continue"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (isSignUp ? handleSignUp() : handleSignIn())}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (isSignUp ? handleSignUp() : handleSignIn())}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className={`text-sm ${error.includes('created') ? 'text-green-600' : 'text-red-500'}`}>
                {error}
              </p>
            )}

            <Button
              onClick={isSignUp ? handleSignUp : handleSignIn}
              className="w-full h-11"
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            <div className="text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-sm text-gray-600 hover:text-gray-900 underline-offset-4 hover:underline"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuthenticating = () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
        <p className="text-sm text-gray-600">Authenticating...</p>
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  switch (authState) {
    case "authenticated":
      return renderAuthenticatedApp();
    case "authenticating":
      return renderAuthenticating();
    case "unauthenticated":
    default:
      return renderUnauthenticated();
  }
}

export default IndexSidePanel;
