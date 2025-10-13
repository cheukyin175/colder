import { useState, useEffect } from "react";
import type { MessageDraft } from "./models/message-draft";
import type { ExtensionSettings } from "./models/extension-settings";
import { createDefaultSettings } from "./models/extension-settings";
import "./styles/global.css";

// Define the different views and states for the UI
type View = "generate" | "settings";
type GenerateState = "idle" | "loading" | "message" | "error";

/**
 * The main popup component for the Colder extension.
 */
function IndexPopup() {
  // UI State
  const [activeView, setActiveView] = useState<View>("generate");
  const [generateState, setGenerateState] = useState<GenerateState>("idle");
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [error, setError] = useState("");

  // Data State
  const [settings, setSettings] = useState<ExtensionSettings>(createDefaultSettings());
  const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null);
  
  // Environment State
  const [isOnLinkedIn, setIsOnLinkedIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * On component mount, load settings from storage and check if the current
   * tab is a valid LinkedIn profile page.
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        const storedSettings = await chrome.runtime.sendMessage({ type: "STORAGE_GET_SETTINGS" });
        if (storedSettings.success && storedSettings.data) {
          setSettings(storedSettings.data);
          if (!storedSettings.data.openrouterApiKey || !storedSettings.data.userName) {
            setActiveView("settings");
          }
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url?.includes("linkedin.com/in/")) {
          setIsOnLinkedIn(true);
        }
      } catch (e) {
        console.error("Initialization error:", e);
        setError("Could not load extension data. Try reloading the extension.");
      }
    };
    initialize();
  }, []);

  /**
   * Handles saving the settings to Chrome storage via the background script.
   */
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await chrome.runtime.sendMessage({
        type: "STORAGE_SAVE_SETTINGS",
        payload: { settings },
      });
      // Show temporary success message
      setTimeout(() => setIsSaving(false), 2000);
    } catch (e) {
      console.error("Failed to save settings:", e);
      setError("Failed to save settings. Please try again.");
      setIsSaving(false);
    }
  };

  /**
   * Orchestrates the main workflow: PING -> EXTRACT -> GENERATE.
   */
  const handleGenerate = async () => {
    setGenerateState("loading");
    setError("");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab found.");

      // 1. Handshake with content script
      setLoadingMessage("Connecting to page...");
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: "PING" });
        if (!response?.success) throw new Error(); // Will be caught below
      } catch (e) {
        throw new Error("Could not connect to the LinkedIn page. Please refresh the page and try again.");
      }

      // 2. Extract Profile
      setLoadingMessage("Extracting profile data...");
      const extractResponse = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_PROFILE" });
      if (!extractResponse.success) throw new Error(extractResponse.error || "Failed to extract profile.");
      
      // 3. Analyze & Generate
      setLoadingMessage("AI is generating your message...");
      const generateResponse = await chrome.runtime.sendMessage({
        type: "ANALYZE_AND_GENERATE",
        payload: {
          targetProfile: extractResponse.data,
          settings,
        },
      });

      if (!generateResponse.success) {
        throw new Error(generateResponse.error || "Failed to generate message.");
      }

      setMessageDraft(generateResponse.data);
      setGenerateState("message");

    } catch (e: any) {
      console.error("Generation failed:", e);
      setError(e.message);
      setGenerateState("error");
    }
  };

  /**
   * Handles copying the message body to the clipboard.
   */
  const handleCopy = () => {
    if (!messageDraft?.body) return;
    navigator.clipboard.writeText(messageDraft.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // --- RENDER FUNCTIONS ---

  const renderSettings = () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Settings</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">OpenRouter API Key</label>
        <input
          type="password"
          value={settings.openrouterApiKey}
          onChange={(e) => setSettings({ ...settings, openrouterApiKey: e.target.value })}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Your Name</label>
        <input
          type="text"
          value={settings.userName}
          onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Your Role</label>
        <input
          type="text"
          value={settings.userRole}
          onChange={(e) => setSettings({ ...settings, userRole: e.target.value })}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
       <div>
        <label className="block text-sm font-medium text-gray-700">Outreach Objective</label>
        <select
          value={settings.userOutreachObjectives}
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
    </div>
  );

  const renderGenerate = () => {
    if (!settings.openrouterApiKey || !settings.userName) {
        return <div className="p-4 text-center text-sm text-gray-600">Please complete your API Key and Name in the Settings tab first.</div>
    }
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
            <textarea
              readOnly
              value={messageDraft?.body || ""}
              className="w-full p-2 border rounded-md bg-gray-50 h-48"
            />
            <button 
              onClick={handleCopy}
              className="w-full bg-green-600 text-white p-2 rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy Message"}
            </button>
          </div>
        );
      case "idle":
      default:
        return (
          <div className="p-4 text-center">
            <button 
              onClick={handleGenerate} 
              disabled={generateState === 'loading'}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-bold disabled:bg-blue-400 transition-colors"
            >
              🚀 Analyze Profile & Generate Message
            </button>
          </div>
        );
    }
  };

  return (
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
      <div className="bg-white shadow-inner">
        {activeView === "generate" ? renderGenerate() : renderSettings()}
      </div>
    </div>
  );
}

export default IndexPopup;
