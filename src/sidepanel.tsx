import { useState, useEffect, useRef } from "react";
import type { MessageDraft, ExtensionSettings, TargetProfile } from "./types";
import { chromeAI } from "./services/chrome-ai";
import { storage } from "./services/storage";
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
	Loader2,
	AlertCircle,
	CheckCircle,
	History,
} from "lucide-react";
import "./styles/global.css";

type View = "generate" | "profile" | "settings" | "history";
type GenerateState = "idle" | "loading" | "message" | "error" | "checking";

function IndexSidePanel() {
	const [activeView, setActiveView] = useState<View>("generate");
	const [generateState, setGenerateState] = useState<GenerateState>("checking");
	const [loadingMessage, setLoadingMessage] = useState(
		"Checking Chrome AI availability..."
	);
	const [error, setError] = useState("");
	const [settings, setSettings] = useState<ExtensionSettings>({
		userName: "",
		userRole: "",
		userCompany: "",
		userBackground: "",
		userValueProposition: "",
	});
	const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null);
	const [isOnLinkedIn, setIsOnLinkedIn] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [copied, setCopied] = useState(false);
	const [aiAvailable, setAiAvailable] = useState(false);
	const [aiStatus, setAiStatus] = useState("");
	const [messageTone, setMessageTone] = useState<
		"professional" | "casual" | "enthusiastic" | "formal" | "friendly"
	>("professional");
	const [messagePurpose, setMessagePurpose] = useState<
		| "connection"
		| "coffee_chat"
		| "informational_interview"
		| "collaboration"
		| "job_inquiry"
		| "sales"
		| "custom"
	>("connection");
	const [customPurpose, setCustomPurpose] = useState("");
	const [messageLength, setMessageLength] = useState<
		"short" | "medium" | "long"
	>("medium");
	const [lastGenerateParams, setLastGenerateParams] = useState<any>(null);
	const [showPolishInput, setShowPolishInput] = useState(false);
	const [polishFeedback, setPolishFeedback] = useState("");
	const [isPolished, setIsPolished] = useState(false);
	const [messageHistory, setMessageHistory] = useState<any[]>([]);
	const currentProfileUrlRef = useRef<string | null>(null);

	useEffect(() => {
		const initialize = async () => {
			const availability = await chromeAI.checkAvailability();
			setAiAvailable(availability.available);
			setAiStatus(availability.message);

			if (availability.available) {
				setGenerateState("idle");
			} else {
				setGenerateState("error");
				setError(availability.message);
			}

			const savedSettings = await storage.getSettings();
			setSettings(savedSettings);

			const messages = await storage.getMessages();
			setMessageHistory(messages);

			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			if (tab?.url?.includes("linkedin.com/in/")) {
				setIsOnLinkedIn(true);
				currentProfileUrlRef.current = tab.url;
			} else {
				setIsOnLinkedIn(false);
			}
		};

		initialize();
	}, []);

	useEffect(() => {
		const checkLinkedInProfile = async () => {
			try {
				const [tab] = await chrome.tabs.query({
					active: true,
					currentWindow: true,
				});
				const newUrl = tab?.url;

				if (newUrl?.includes("linkedin.com/in/")) {
					setIsOnLinkedIn(true);
					if (currentProfileUrlRef.current !== newUrl) {
						console.log("New LinkedIn profile detected. Resetting state.");
						setGenerateState("idle");
						setMessageDraft(null);
					}
				} else {
					setIsOnLinkedIn(false);
				}
				currentProfileUrlRef.current = newUrl || null;
			} catch (error) {
				console.error("Error checking LinkedIn profile:", error);
			}
		};

		checkLinkedInProfile();

		const handleTabUpdate = (
			tabId: number,
			changeInfo: chrome.tabs.TabChangeInfo,
			tab: chrome.tabs.Tab
		) => {
			if (changeInfo.url) {
				checkLinkedInProfile();
			}
		};

		const handleTabActivated = () => {
			checkLinkedInProfile();
		};

		chrome.tabs.onUpdated.addListener(handleTabUpdate);
		chrome.tabs.onActivated.addListener(handleTabActivated);

		const interval = setInterval(checkLinkedInProfile, 2000);

		return () => {
			chrome.tabs.onUpdated.removeListener(handleTabUpdate);
			chrome.tabs.onActivated.removeListener(handleTabActivated);
			clearInterval(interval);
		};
	}, []);

	const handleSaveSettings = async () => {
		setIsSaving(true);
		try {
			await storage.saveSettings(settings);
			setTimeout(() => setIsSaving(false), 2000);
		} catch (e: any) {
			setError(e.message);
			setIsSaving(false);
		}
	};

	const handleGenerate = async () => {
		if (!aiAvailable) {
			setError("Chrome AI is not available. " + aiStatus);
			return;
		}

		setGenerateState("loading");
		setError("");

		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			if (!tab?.id) throw new Error("No active tab found.");

			setLoadingMessage("Connecting to page...");
			try {
				await chrome.tabs.sendMessage(tab.id, { type: "PING" });
			} catch (e) {
				throw new Error(
					"Could not connect to LinkedIn page. Please refresh and try again."
				);
			}

			setLoadingMessage("Extracting profile...");
			const extractResponse = await chrome.tabs.sendMessage(tab.id, {
				type: "EXTRACT_PROFILE",
			});
			if (!extractResponse.success) throw new Error(extractResponse.error);

			const targetProfile: TargetProfile = extractResponse.data;

			setLoadingMessage("AI is generating your message...");

			const purposeMapping = {
				connection: "General Connection",
				coffee_chat: "Coffee Chat Request",
				informational_interview: "Informational Interview Request",
				collaboration: "Collaboration Proposal",
				job_inquiry: "Job Inquiry",
				sales: "Sales/Partnership Proposal",
				custom: customPurpose || "General Connection",
			};

			const userProfile = {
				userName: settings.userName || "User",
				userRole: settings.userRole || "",
				userCompany: settings.userCompany || "",
				userBackground: settings.userBackground || "",
				userValueProposition: settings.userValueProposition || "",
			};

			const generateOptions = {
				tone: messageTone,
				length: messageLength,
				purpose: purposeMapping[messagePurpose],
			};

			setLastGenerateParams({
				targetProfile,
				userProfile,
				options: generateOptions,
			});

			const draft = await chromeAI.generateMessage(
				targetProfile,
				userProfile,
				generateOptions
			);

			await storage.saveMessage({
				body: draft.body,
				wordCount: draft.wordCount,
				targetProfileUrl: targetProfile.linkedinUrl,
				targetProfileName: targetProfile.name,
				tone: messageTone,
				length: messageLength,
				purpose: messagePurpose,
			});

			const messages = await storage.getMessages();
			setMessageHistory(messages);

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
	};

	const handleRegenerate = async () => {
		if (!lastGenerateParams) return;

		setGenerateState("loading");
		setLoadingMessage("Regenerating message...");
		setError("");

		setShowPolishInput(false);
		setPolishFeedback("");

		try {
			const draft = await chromeAI.regenerateMessage(
				lastGenerateParams.targetProfile,
				lastGenerateParams.userProfile,
				lastGenerateParams.options
			);

			await storage.saveMessage({
				body: draft.body,
				wordCount: draft.wordCount,
				targetProfileUrl: lastGenerateParams.targetProfile.linkedinUrl,
				targetProfileName: lastGenerateParams.targetProfile.name,
				tone: messageTone,
				length: messageLength,
				purpose: messagePurpose,
			});

			const messages = await storage.getMessages();
			setMessageHistory(messages);

			setMessageDraft(draft);
			setGenerateState("message");
			setIsPolished(false);
		} catch (e: any) {
			setError(e.message);
			setGenerateState("error");
		}
	};

	const handlePolish = async () => {
		if (!messageDraft?.body || !polishFeedback.trim()) return;

		setGenerateState("loading");
		setLoadingMessage("Polishing message...");
		setError("");

		try {
			const polished = await chromeAI.polishMessage(
				messageDraft.body,
				polishFeedback,
				{
					tone: messageTone,
					length: messageLength,
				}
			);

			setMessageDraft({
				...messageDraft,
				body: polished.body,
				wordCount: polished.wordCount,
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

	const handleClearHistory = async () => {
		if (confirm("Are you sure you want to clear all message history?")) {
			await storage.clearMessages();
			setMessageHistory([]);
		}
	};

	const handleRestoreMessage = (msg: any) => {
		setMessageDraft({
			id: msg.id,
			body: msg.body,
			wordCount: msg.wordCount,
			generatedAt: new Date(msg.generatedAt),
			tone: msg.tone,
			length: msg.length,
		});
		setActiveView("generate");
		setGenerateState("message");
	};

	const renderProfile = () => (
		<ScrollArea className="h-full">
			<div className="p-6 space-y-6">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
					<p className="text-sm text-gray-500 mt-1">
						Manage your professional information
					</p>
				</div>

				<Separator />

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="userName">Your Name</Label>
						<Input
							id="userName"
							type="text"
							value={settings.userName || ""}
							onChange={(e) =>
								setSettings({ ...settings, userName: e.target.value })
							}
							placeholder="John Doe"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="userRole">Your Role</Label>
						<Input
							id="userRole"
							type="text"
							value={settings.userRole || ""}
							onChange={(e) =>
								setSettings({ ...settings, userRole: e.target.value })
							}
							placeholder="Software Engineer"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="userCompany">Your Company</Label>
						<Input
							id="userCompany"
							type="text"
							value={settings.userCompany || ""}
							onChange={(e) =>
								setSettings({ ...settings, userCompany: e.target.value })
							}
							placeholder="Tech Corp"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="userBackground">Background</Label>
						<textarea
							id="userBackground"
							value={settings.userBackground || ""}
							onChange={(e) =>
								setSettings({ ...settings, userBackground: e.target.value })
							}
							placeholder="Your professional background..."
							className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
							rows={3}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="userValueProp">Value Proposition</Label>
						<textarea
							id="userValueProp"
							value={settings.userValueProposition || ""}
							onChange={(e) =>
								setSettings({
									...settings,
									userValueProposition: e.target.value,
								})
							}
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
					<p className="text-sm text-gray-500 mt-1">
						Chrome AI status and data management
					</p>
				</div>

				<Separator />

				<div className="space-y-3">
					<Label className="text-base font-semibold">Chrome AI Status</Label>
					<div
						className={`border rounded-lg p-4 space-y-2 ${
							aiAvailable
								? "border-green-200 bg-green-50"
								: "border-red-200 bg-red-50"
						}`}
					>
						<div className="flex items-center gap-2">
							{aiAvailable ? (
								<>
									<CheckCircle className="h-5 w-5 text-green-600" />
									<span className="text-sm font-medium text-green-900">
										AI Available
									</span>
								</>
							) : (
								<>
									<AlertCircle className="h-5 w-5 text-red-600" />
									<span className="text-sm font-medium text-red-900">
										AI Unavailable
									</span>
								</>
							)}
						</div>
						<p className="text-xs text-gray-600">{aiStatus}</p>
						{!aiAvailable && (
							<p className="text-xs text-gray-600 mt-2">
								Enable Chrome AI in{" "}
								<code className="bg-white px-1 py-0.5 rounded">
									chrome://flags/#optimization-guide-on-device-model
								</code>
							</p>
						)}
					</div>
				</div>

				<Separator />

				<div className="space-y-3">
					<Label className="text-base font-semibold">Data Management</Label>
					<div className="space-y-2">
						<p className="text-xs text-gray-500">
							All data is stored locally on your device
						</p>
						<Button
							onClick={handleClearHistory}
							variant="outline"
							className="w-full"
							size="sm"
						>
							Clear Message History
						</Button>
						<Button
							onClick={async () => {
								if (
									confirm(
										"This will delete all settings and history. Continue?"
									)
								) {
									await storage.clearAllData();
									window.location.reload();
								}
							}}
							variant="outline"
							className="w-full text-red-600 hover:text-red-700"
							size="sm"
						>
							Clear All Data
						</Button>
					</div>
				</div>
			</div>
		</ScrollArea>
	);

	const renderHistory = () => (
		<ScrollArea className="h-full">
			<div className="p-6 space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-gray-900">History</h2>
						<p className="text-sm text-gray-500 mt-1">
							{messageHistory.length} messages
						</p>
					</div>
					{messageHistory.length > 0 && (
						<Button onClick={handleClearHistory} variant="outline" size="sm">
							Clear All
						</Button>
					)}
				</div>

				<Separator />

				{messageHistory.length === 0 ? (
					<div className="text-center py-12">
						<History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
						<p className="text-sm text-gray-500">No messages generated yet</p>
					</div>
				) : (
					<div className="space-y-4">
						{messageHistory.map((msg) => (
							<div
								key={msg.id}
								className="border border-gray-200 rounded-lg p-4 space-y-2 hover:border-gray-300 transition-colors"
							>
								<div className="flex items-start justify-between">
									<div>
										<p className="font-medium text-sm">
											{msg.targetProfileName}
										</p>
										<p className="text-xs text-gray-500">
											{new Date(msg.generatedAt).toLocaleDateString()} ·{" "}
											{msg.wordCount} words
										</p>
									</div>
									<Button
										onClick={() => handleRestoreMessage(msg)}
										size="sm"
										variant="outline"
									>
										View
									</Button>
								</div>
								<p className="text-xs text-gray-600 line-clamp-2">{msg.body}</p>
								<div className="flex gap-2">
									<span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
										{msg.tone}
									</span>
									<span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
										{msg.length}
									</span>
								</div>
							</div>
						))}
					</div>
				)}
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
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						No LinkedIn Profile Detected
					</h3>
					<p className="text-sm text-gray-500">
						Navigate to a LinkedIn profile to generate personalized messages
					</p>
				</div>
			);
		}

		switch (generateState) {
			case "checking":
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
							<AlertCircle className="h-12 w-12 mx-auto" />
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
									<h2 className="text-xl font-bold text-gray-900">
										Generated Message
									</h2>
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
											onKeyPress={(e) => e.key === "Enter" && handlePolish()}
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
										<Button onClick={handleRegenerate} variant="outline">
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
									<p>
										<strong>New Version:</strong> Fresh message from scratch
									</p>
									<p>
										<strong>Polish:</strong> Refine current message
									</p>
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
								<h2 className="text-2xl font-bold text-gray-900">
									Generate Message
								</h2>
								<p className="text-sm text-gray-500 mt-1">
									Customize your message settings
								</p>
							</div>

							<Separator />

							<div className="space-y-4">
								<div>
									<Label>Tone</Label>
									<div className="grid grid-cols-2 gap-2 mt-2">
										{(
											[
												"professional",
												"casual",
												"enthusiastic",
												"formal",
												"friendly",
											] as const
										).map((tone) => (
											<Button
												key={tone}
												variant={messageTone === tone ? "default" : "outline"}
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
										<option value="informational_interview">
											Info Interview
										</option>
										<option value="collaboration">Collaboration</option>
										<option value="job_inquiry">Job Inquiry</option>
										<option value="sales">Sales/Partnership</option>
										<option value="custom">Custom</option>
									</select>
								</div>

								{messagePurpose === "custom" && (
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
										{(["short", "medium", "long"] as const).map((length) => (
											<Button
												key={length}
												variant={
													messageLength === length ? "default" : "outline"
												}
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
									disabled={generateState === "loading" || !aiAvailable}
									className="w-full h-12 text-base"
								>
									<Sparkles className="mr-2 h-5 w-5" />
									Generate Message
								</Button>

								{!aiAvailable && (
									<p className="text-xs text-center text-red-600">
										Chrome AI is not available. Check Settings tab.
									</p>
								)}
							</div>
						</div>
					</ScrollArea>
				);
		}
	};

	return (
		<div className="flex flex-col h-screen bg-white">
			<div className="border-b border-colder-ice-light p-4 bg-gradient-to-r from-colder-frost to-white">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div>
							<h1 className="text-xl font-bold text-gray-900">Colder</h1>
							<p className="text-xs text-gray-500">
								LinkedIn Outreach AI · Powered by Chrome AI
							</p>
						</div>
					</div>
					{aiAvailable ? (
						<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-colder-ice/10 border border-colder-ice/20">
							<CheckCircle className="h-3.5 w-3.5 text-colder-ice-deep" />
							<span className="text-xs font-medium text-colder-ice-deep">
								AI Ready
							</span>
						</div>
					) : (
						<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
							<AlertCircle className="h-3.5 w-3.5 text-red-600" />
							<span className="text-xs font-medium text-red-600">
								AI Unavailable
							</span>
						</div>
					)}
				</div>
			</div>

			<Tabs
				value={activeView}
				onValueChange={(v) => setActiveView(v as View)}
				className="flex-1 flex flex-col"
			>
				<TabsList className="w-full rounded-none h-12 bg-gray-50 border-b border-gray-200">
					<TabsTrigger
						value="generate"
						className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none"
					>
						<Sparkles className="mr-2 h-4 w-4" />
						Generate
					</TabsTrigger>
					<TabsTrigger
						value="profile"
						className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none"
					>
						<User className="mr-2 h-4 w-4" />
						Profile
					</TabsTrigger>
					<TabsTrigger
						value="history"
						className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none"
					>
						<History className="mr-2 h-4 w-4" />
						History
					</TabsTrigger>
					<TabsTrigger
						value="settings"
						className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none"
					>
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

				<TabsContent value="history" className="flex-1 m-0 overflow-hidden">
					{renderHistory()}
				</TabsContent>

				<TabsContent value="settings" className="flex-1 m-0 overflow-hidden">
					{renderSettings()}
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default IndexSidePanel;
