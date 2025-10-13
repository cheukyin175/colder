import { useState, useEffect } from "react";
import type { MessageDraft } from "./models/message-draft";
import type { ExtensionSettings } from "./models/extension-settings";
import { createDefaultSettings } from "./models/extension-settings";
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

  // --- HOOKS ---

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const storedToken = await chrome.storage.local.get("jwt");
      if (storedToken.jwt) {
        setJwt(storedToken.jwt);
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
    setAuthState("authenticating");
    try {
      const googleToken = await chrome.identity.getAuthToken({ interactive: true });
      if (!googleToken?.token) throw new Error("Google authentication failed.");

      const response = await fetch(`${BACKEND_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: googleToken.token }),
      });

      if (!response.ok) throw new Error("Backend authentication failed.");

      const { accessToken } = await response.json();
      await chrome.storage.local.set({ jwt: accessToken });
      setJwt(accessToken);
      setAuthState("authenticated");
    } catch (e: any) {
      setError(e.message);
      setAuthState("unauthenticated");
    }
  };

  const handleSignOut = async () => {
    await chrome.storage.local.remove("jwt");
    setJwt(null);
    setAuthState("unauthenticated");
  };

  const handleSaveSettings = async () => {
    if (!jwt) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(settings),
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
      const generateResponse = await fetch(`${BACKEND_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ targetProfile: extractResponse.data }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.message || "Failed to generate message.");
      }

      const draft = await generateResponse.json();
      setMessageDraft(draft);
      setGenerateState("message");

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
      <div>
        <label className="block text-sm font-medium text-gray-700">Outreach Objective</label>
        <select
          value={settings.userOutreachObjectives || 'General Connection'}
          onChange={(e) => setSettings({ ...settings, userOutreachObjectives: e.target.value })}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white"
        >
          <option>General Connection</option>
          <option>Recruiting Inquiry</option>
          <option>Sales/Partnership Proposal</option>
          <option>Informational Interview Request</option>
        </select>
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
            <h2 className="text-lg font-bold">Generated Message</h2>
            <textarea readOnly value={messageDraft?.body || ""} className="w-full p-2 border rounded-md bg-gray-50 h-48" />
            <button onClick={handleCopy} className="w-full bg-green-600 text-white p-2 rounded-md hover:bg-green-700">
              {copied ? "✓ Copied!" : "Copy Message"}
            </button>
          </div>
        );
      case "idle":
      default:
        return (
          <div className="p-4 text-center">
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
    <div className="w-[400px] h-[200px] flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Colder</h1>
      <p className="text-gray-600 mb-6">Sign in to continue</p>
      <button onClick={handleSignIn} className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-bold">
        Sign in with Google
      </button>
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
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
