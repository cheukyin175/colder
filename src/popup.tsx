/**
 * Main Popup Component
 *
 * Orchestrates the complete User Story 1 flow:
 * Profile extraction → Analysis → Message generation
 */

import React, { useState, useEffect } from 'react';
import { MessageDraft } from './popup/components/MessageDraft';
import { LoadingState, LoadingStep } from './popup/components/LoadingState';
import type { MessageDraft as MessageDraftType } from './models/message-draft';
import type { UserProfile } from './models/user-profile';
import type { TonePreset, MessageLength } from './models/types';
import './styles/global.css';

type ViewState = 'idle' | 'loading' | 'message' | 'error' | 'setup';

interface ErrorState {
  message: string;
  details?: string;
}

function IndexPopup() {
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('extracting');
  const [messageDraft, setMessageDraft] = useState<MessageDraftType | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOnLinkedIn, setIsOnLinkedIn] = useState(false);

  // Check if on LinkedIn and load user profile
  useEffect(() => {
    checkCurrentTab();
    loadUserProfile();
  }, []);

  const checkCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url?.includes('linkedin.com/in/')) {
        setIsOnLinkedIn(true);
      }
    } catch (err) {
      console.error('Failed to check tab:', err);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_USER_PROFILE'
      });

      if (response?.data) {
        setUserProfile(response.data);
      } else {
        // No profile - show setup prompt
        setViewState('setup');
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  // Main flow: Extract → Analyze → Generate
  const handleAnalyzeProfile = async () => {
    setViewState('loading');
    setLoadingStep('extracting');
    setError(null);

    try {
      // Step 1: Extract profile from current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error('No active tab');
      }

      if (!tab?.url?.includes('linkedin.com/in/')) {
        throw new Error('Please navigate to a LinkedIn profile page');
      }

      // Send message to content script to extract profile
      const extractResponse = await chrome.tabs.sendMessage(tab.id, {
        action: 'extract-profile'
      });

      if (!extractResponse?.success) {
        throw new Error(extractResponse?.error || 'Failed to extract profile');
      }

      const targetProfile = extractResponse.data;

      // Step 2: Analyze profile
      setLoadingStep('analyzing');

      const analyzeResponse = await chrome.runtime.sendMessage({
        type: 'ANALYZE_PROFILE',
        payload: {
          targetProfile,
          userProfileId: userProfile?.id
        }
      });

      if (!analyzeResponse?.success) {
        throw new Error(analyzeResponse?.error || 'Failed to analyze profile');
      }

      const analysis = analyzeResponse.data;

      // Step 3: Generate message
      setLoadingStep('generating');

      const generateResponse = await chrome.runtime.sendMessage({
        type: 'GENERATE_MESSAGE',
        payload: {
          analysis,
          userProfileId: userProfile?.id,
          tone: userProfile?.defaultTone || 'professional',
          length: userProfile?.defaultLength || 'medium'
        }
      });

      if (!generateResponse?.success) {
        throw new Error(generateResponse?.error || 'Failed to generate message');
      }

      setMessageDraft(generateResponse.data);
      setViewState('message');

    } catch (err: any) {
      console.error('Profile analysis failed:', err);
      setError({
        message: err.message || 'An unexpected error occurred',
        details: err.stack
      });
      setViewState('error');
    }
  };

  // Handle tone change
  const handleToneChange = async (newTone: TonePreset) => {
    if (!messageDraft) return;

    setViewState('loading');
    setLoadingStep('customizing');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHANGE_TONE',
        payload: {
          draftId: messageDraft.id,
          newTone
        }
      });

      if (response?.success) {
        setMessageDraft(response.data);
        setViewState('message');
      } else {
        throw new Error(response?.error || 'Failed to change tone');
      }
    } catch (err: any) {
      setError({
        message: 'Failed to change message tone',
        details: err.message
      });
      setViewState('error');
    }
  };

  // Handle length change
  const handleLengthChange = async (newLength: MessageLength) => {
    if (!messageDraft) return;

    setViewState('loading');
    setLoadingStep('customizing');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHANGE_LENGTH',
        payload: {
          draftId: messageDraft.id,
          newLength
        }
      });

      if (response?.success) {
        setMessageDraft(response.data);
        setViewState('message');
      } else {
        throw new Error(response?.error || 'Failed to change length');
      }
    } catch (err: any) {
      setError({
        message: 'Failed to change message length',
        details: err.message
      });
      setViewState('error');
    }
  };

  // Handle manual edit save
  const handleEditSave = async (newBody: string) => {
    if (!messageDraft) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_EDIT',
        payload: {
          draftId: messageDraft.id,
          newBody
        }
      });

      if (response?.success) {
        setMessageDraft(response.data);
      }
    } catch (err) {
      console.error('Failed to save edit:', err);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!messageDraft) return;

    try {
      await navigator.clipboard.writeText(messageDraft.body);

      // Record in history
      await chrome.runtime.sendMessage({
        type: 'RECORD_OUTREACH',
        payload: {
          draftId: messageDraft.id
        }
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Open settings page
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  // Render different views
  const renderContent = () => {
    switch (viewState) {
      case 'idle':
        return (
          <div className="text-center space-y-4">
            {isOnLinkedIn ? (
              <>
                <h2 className="text-xl font-bold text-gray-800">
                  Ready to Generate Message
                </h2>
                <p className="text-sm text-gray-600">
                  Click below to analyze this LinkedIn profile and generate a personalized message
                </p>
                <button
                  onClick={handleAnalyzeProfile}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🚀 Analyze Profile & Generate Message
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800">
                  Navigate to LinkedIn
                </h2>
                <p className="text-sm text-gray-600">
                  Please go to a LinkedIn profile page to generate a message
                </p>
                <button
                  onClick={() => chrome.tabs.create({ url: 'https://linkedin.com' })}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open LinkedIn
                </button>
              </>
            )}
          </div>
        );

      case 'loading':
        return <LoadingState currentStep={loadingStep} />;

      case 'message':
        return messageDraft ? (
          <MessageDraft
            draft={messageDraft}
            onToneChange={handleToneChange}
            onLengthChange={handleLengthChange}
            onEditSave={handleEditSave}
            onCopy={handleCopy}
          />
        ) : null;

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="text-red-600">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-600">{error?.message}</p>
            {error?.details && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer">Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                  {error.details}
                </pre>
              </details>
            )}
            <button
              onClick={() => setViewState('idle')}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      case 'setup':
        return (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-gray-800">
              Welcome to Colder! 👋
            </h2>
            <p className="text-sm text-gray-600">
              To generate personalized messages, please set up your profile first
            </p>
            <button
              onClick={openSettings}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Set Up Your Profile
            </button>
            <button
              onClick={loadUserProfile}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Refresh
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-[400px] min-h-[500px] p-4 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b">
        <h1 className="text-lg font-bold text-gray-800">
          Colder
        </h1>
        <div className="flex gap-2">
          {userProfile && (
            <span className="text-xs text-gray-500">
              {userProfile.name}
            </span>
          )}
          <button
            onClick={openSettings}
            className="text-gray-500 hover:text-gray-700"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Footer */}
      {viewState !== 'loading' && (
        <div className="mt-4 pt-3 border-t text-center text-xs text-gray-400">
          LinkedIn Cold Outreach Assistant
        </div>
      )}
    </div>
  );
}

export default IndexPopup;