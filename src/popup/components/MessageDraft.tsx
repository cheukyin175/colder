/**
 * MessageDraft Component
 *
 * Displays generated message with annotations and controls
 */

import React, { useState, useCallback } from 'react';
import type { MessageDraft, Annotation } from '../../models/message-draft';
import type { TonePreset, MessageLength } from '../../models/types';

interface MessageDraftProps {
  draft: MessageDraft;
  onToneChange: (tone: TonePreset) => void;
  onLengthChange: (length: MessageLength) => void;
  onEditSave: (newBody: string) => void;
  onCopy: () => void;
  isLoading?: boolean;
}

export const MessageDraft: React.FC<MessageDraftProps> = ({
  draft,
  onToneChange,
  onLengthChange,
  onEditSave,
  onCopy,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(draft.body);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Handle copy with feedback
  const handleCopy = useCallback(() => {
    onCopy();
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  }, [onCopy]);

  // Handle save edit
  const handleSaveEdit = useCallback(() => {
    if (editedBody !== draft.body) {
      onEditSave(editedBody);
    }
    setIsEditing(false);
  }, [editedBody, draft.body, onEditSave]);

  // Cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditedBody(draft.body);
    setIsEditing(false);
  }, [draft.body]);

  // Render annotated text
  const renderAnnotatedText = (text: string, annotations: Annotation[]) => {
    if (!showAnnotations || annotations.length === 0) {
      return <span>{text}</span>;
    }

    // Sort annotations by their position in the text
    const sortedAnnotations = [...annotations].sort((a, b) => {
      const aIndex = text.indexOf(a.text);
      const bIndex = text.indexOf(b.text);
      return aIndex - bIndex;
    });

    let lastIndex = 0;
    const elements: React.ReactNode[] = [];

    sortedAnnotations.forEach((annotation, idx) => {
      const index = text.indexOf(annotation.text, lastIndex);
      if (index === -1) return;

      // Add text before annotation
      if (index > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>{text.substring(lastIndex, index)}</span>
        );
      }

      // Add annotated text with highlighting
      const annotationClass =
        annotation.source === 'target_profile' ? 'bg-blue-100 border-b-2 border-blue-400' :
        annotation.source === 'user_profile' ? 'bg-green-100 border-b-2 border-green-400' :
        '';

      elements.push(
        <span
          key={`ann-${idx}`}
          className={annotationClass}
          title={`Source: ${annotation.sourceField || annotation.source}`}
        >
          {annotation.text}
        </span>
      );

      lastIndex = index + annotation.text.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">{text.substring(lastIndex)}</span>
      );
    }

    return <>{elements}</>;
  };

  // Calculate word count
  const wordCount = draft.body.trim().split(/\s+/).filter(w => w).length;

  return (
    <div className="w-full space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
        {/* Tone Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Tone:</label>
          <select
            value={draft.tone}
            onChange={(e) => onToneChange(e.target.value as TonePreset)}
            disabled={isLoading || isEditing}
            className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="enthusiastic">Enthusiastic</option>
          </select>
        </div>

        {/* Length Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Length:</label>
          <select
            value={draft.length}
            onChange={(e) => onLengthChange(e.target.value as MessageLength)}
            disabled={isLoading || isEditing}
            className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="short">Short (50-100)</option>
            <option value="medium">Medium (100-200)</option>
            <option value="long">Long (200-300)</option>
          </select>
        </div>

        {/* Annotations Toggle */}
        <button
          onClick={() => setShowAnnotations(!showAnnotations)}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          title="Toggle source highlighting"
        >
          {showAnnotations ? '🎨 Hide Sources' : '🎨 Show Sources'}
        </button>
      </div>

      {/* Message Display/Edit Area */}
      <div className="p-4 bg-white border rounded-lg">
        {/* Subject Line */}
        {draft.subject && (
          <div className="mb-3 pb-2 border-b">
            <span className="text-sm font-medium text-gray-600">Subject: </span>
            <span className="text-sm">{draft.subject}</span>
          </div>
        )}

        {/* Message Body */}
        {isEditing ? (
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            className="w-full min-h-[200px] p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderAnnotatedText(draft.body, draft.annotations)}
          </div>
        )}

        {/* Word Count */}
        <div className="mt-2 text-xs text-gray-500">
          {wordCount} words
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Save Edit
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              ✏️ Edit Message
            </button>
          )}
        </div>

        <button
          onClick={handleCopy}
          disabled={isLoading || isEditing}
          className={`px-4 py-2 text-sm rounded transition-all disabled:opacity-50 ${
            copiedFeedback
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {copiedFeedback ? '✓ Copied!' : '📋 Copy to Clipboard'}
        </button>
      </div>

      {/* Annotations Legend */}
      {showAnnotations && draft.annotations.length > 0 && (
        <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
          <span className="font-medium">Source Legend: </span>
          <span className="inline-block mx-2">
            <span className="px-1 bg-blue-100 border-b-2 border-blue-400">Target Profile</span>
          </span>
          <span className="inline-block mx-2">
            <span className="px-1 bg-green-100 border-b-2 border-green-400">Your Profile</span>
          </span>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500">
        Generated in {((draft.generationTime || 0) / 1000).toFixed(1)}s using {draft.modelUsed}
        {draft.version > 1 && ` • Version ${draft.version}`}
      </div>
    </div>
  );
};