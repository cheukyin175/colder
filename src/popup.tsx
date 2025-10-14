import { useState, useEffect } from "react";
import type { MessageDraft } from "./models/message-draft";
import type { ExtensionSettings } from "./models/extension-settings";
import { createDefaultSettings } from "./models/extension-settings";
import { supabase } from "./lib/supabase";
import "./styles/global.css";

// Define the different views and states for the UI
type AuthState = "unauthenticated" | "authenticating" | "authenticated";
type View = "generate" | "settings";
type GenerateState = "idle" | "loading" | "message" | "error";

const BACKEND_URL = "http://localhost:3000"; // The default URL for the local NestJS backend

function IndexPopup() {
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

  // --- HOOKS ---

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      // Check if user is already authenticated with Supabase
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
      }
    };
    checkAuthAndLoadData();

    // Listen for auth state changes
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

  useEffect(() => {
    const loadSettings = async () => {
      if (authState === "authenticated" && jwt) {
        try {
          const response = await fetch(`${BACKEND_URL}/settings`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
          if (!response.ok) throw new Error("Failed to fetch settings");
          const backendSettings = await response.json();
          setSettings(backendSettings);
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
      // Only send fields that the backend supports
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

      // Cache the params for regeneration
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
      setIsPolished(false); // Reset polish state for new message

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

    // Reset polish state when regenerating
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
      setIsPolished(false); // Reset polish state for regenerated message
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
      setIsPolished(true); // Mark message as polished
    } catch (e: any) {
      setError(e.message);
      setGenerateState("error");
    }
  };

  // --- RENDER LOGIC ---

  const renderSettings = () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Settings</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Your Name</label>
        <input
          type="text"
          value={settings.userName || ''}
          onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Your Role</label>
        <input
          type="text"
          value={settings.userRole || ''}
          onChange={(e) => setSettings({ ...settings, userRole: e.target.value })}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Your Value Proposition</label>
        <textarea
          value={settings.userValueProposition || ''}
          onChange={(e) => setSettings({ ...settings, userValueProposition: e.target.value })}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
          rows={3}
        />
      </div>
      <button 
        onClick={handleSaveSettings} 
        disabled={isSaving}
        className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
      >
        {isSaving ? "Saved!" : "Save Settings"}
      </button>
      <button onClick={handleSignOut} className="mt-2 w-full bg-gray-200 text-gray-800 p-2 rounded-md hover:bg-gray-300">
         Sign Out
      </button>
    </div>
  );

  const renderGenerate = () => {
    if (!isOnLinkedIn) {
        return <div className="p-4 text-center text-sm text-gray-600">Navigate to a LinkedIn profile to begin.</div>
    }

    switch (generateState) {
      case "loading":
        return <div className="p-4 text-center animate-pulse">{loadingMessage}</div>;
      case "error":
        return <div className="p-4 text-center text-red-600"><strong>Error:</strong> {error}</div>;
      case "message":
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Generated Message</h2>
              {isPolished && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  ✨ Polished
                </span>
              )}
            </div>
            <textarea
              readOnly
              value={messageDraft?.body || ""}
              className="w-full p-2 border rounded-md bg-gray-50 h-40 text-sm"
            />

            {showPolishInput && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">What would you like to change?</label>
                <input
                  type="text"
                  value={polishFeedback}
                  onChange={(e) => setPolishFeedback(e.target.value)}
                  placeholder="e.g., Make it shorter, more friendly, add urgency..."
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  onKeyPress={(e) => e.key === 'Enter' && handlePolish()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handlePolish}
                    className="flex-1 bg-blue-600 text-white p-2 text-sm rounded-md hover:bg-blue-700"
                  >
                    Apply Polish
                  </button>
                  <button
                    onClick={() => {
                      setShowPolishInput(false);
                      setPolishFeedback("");
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 p-2 text-sm rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleCopy}
                className="w-full bg-green-600 text-white p-2 rounded-md hover:bg-green-700"
              >
                {copied ? "✓ Copied!" : "📋 Copy Message"}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleRegenerate}
                  className="flex-1 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
                  title="Generate a completely new message with same settings"
                >
                  🔄 New Version
                </button>
                <button
                  onClick={() => {
                    setShowPolishInput(!showPolishInput);
                    setPolishFeedback("");
                  }}
                  className="flex-1 bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700"
                  title="Refine this message based on your feedback"
                >
                  ✨ Polish This
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>💡 <strong>New Version</strong>: Fresh message from scratch</p>
              <p>✨ <strong>Polish</strong>: Refine current message</p>
              <p className="text-gray-400">Each action uses 1 credit</p>
            </div>
          </div>
        );
      case "idle":
      default:
        return (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tone</label>
                <select
                  value={messageTone}
                  onChange={(e) => setMessageTone(e.target.value as any)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="formal">Formal</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Purpose</label>
                <select
                  value={messagePurpose}
                  onChange={(e) => setMessagePurpose(e.target.value as any)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white"
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
            </div>

            {messagePurpose === 'custom' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Custom Purpose</label>
                <input
                  type="text"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  placeholder="Describe your purpose..."
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Length</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMessageLength('short')}
                  className={`flex-1 p-2 text-sm rounded-md ${messageLength === 'short' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Short
                </button>
                <button
                  onClick={() => setMessageLength('medium')}
                  className={`flex-1 p-2 text-sm rounded-md ${messageLength === 'medium' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setMessageLength('long')}
                  className={`flex-1 p-2 text-sm rounded-md ${messageLength === 'long' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Long
                </button>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={generateState === 'loading'} className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-bold disabled:bg-blue-400">
              🚀 Analyze Profile & Generate Message
            </button>
          </div>
        );
    }
  };

  const renderAuthenticatedApp = () => (
    <div className="w-[400px] bg-gray-50 font-sans">
       <div className="flex border-b bg-white">
         <button 
           onClick={() => setActiveView("generate")}
           className={`flex-1 p-3 text-center font-semibold text-sm transition-colors ${activeView === 'generate' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
           Generate
         </button>
         <button 
           onClick={() => setActiveView("settings")}
           className={`flex-1 p-3 text-center font-semibold text-sm transition-colors ${activeView === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
           Settings
         </button>
       </div>
       <div className="bg-white shadow-inner min-h-[200px]">
         {activeView === "generate" ? renderGenerate() : renderSettings()}
       </div>
     </div>
  );

  const renderUnauthenticated = () => (
    <div className="w-[400px] min-h-[300px] flex flex-col justify-center p-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Welcome to Colder</h1>
      <p className="text-gray-600 mb-6 text-center text-sm">
        {isSignUp ? "Create your account" : "Sign in to continue"}
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (isSignUp ? handleSignUp() : handleSignIn())}
            placeholder="you@example.com"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (isSignUp ? handleSignUp() : handleSignIn())}
            placeholder="••••••••"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <p className={`text-sm ${error.includes('created') ? 'text-green-600' : 'text-red-500'}`}>
            {error}
          </p>
        )}

        <button
          onClick={isSignUp ? handleSignUp : handleSignIn}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-bold transition-colors"
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>

        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderAuthenticating = () => (
    <div className="w-[400px] h-[200px] flex items-center justify-center p-8">
      <p className="animate-pulse">Authenticating...</p>
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

export default IndexPopup;
