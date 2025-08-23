"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Database, Globe, Mic, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { AppLayout } from "../../components/app-layout";

interface SettingsState {
  // Transcription Settings
  enableSegmentation: boolean;
  transcriptionModel: string;
  defaultLanguage: string;

  // AI & Processing
  summaryModel: string;
  customSummaryPrompt: string;
  autoTagging: boolean;
  customTaggingPrompt: string;

  // Storage & Privacy
  retainAudioFiles: boolean;
  autoDelete: boolean;
  retentionDays: number;
}

const defaultSettings: SettingsState = {
  enableSegmentation: true,
  transcriptionModel: "whisper-1",
  defaultLanguage: "auto",
  summaryModel: "gpt-4o-mini",
  customSummaryPrompt: "",
  autoTagging: false,
  customTaggingPrompt: "",
  retainAudioFiles: true,
  autoDelete: false,
  retentionDays: 365,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement API call to save settings
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setHasChanges(false);
    setIsSaving(false);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Configure your transcription preferences</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline" size="sm" disabled={!hasChanges}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || isSaving} size="sm">
                {isSaving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {hasChanges && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">You have unsaved changes</p>
            </div>
          )}

          {/* Transcription Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-medium">Transcription</h2>
            </div>

            <div className="border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Enable Segmentation</Label>
                  <p className="text-xs text-muted-foreground">Break transcriptions into timestamped segments</p>
                </div>
                <Switch
                  checked={settings.enableSegmentation}
                  onCheckedChange={checked => updateSetting("enableSegmentation", checked)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transcription-model">Model</Label>
                  <Select
                    value={settings.transcriptionModel}
                    onValueChange={value => updateSetting("transcriptionModel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whisper-1">Whisper-1</SelectItem>
                      <SelectItem value="whisper-large-v3">Whisper Large v3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-language">Language</Label>
                  <Select
                    value={settings.defaultLanguage}
                    onValueChange={value => updateSetting("defaultLanguage", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* AI & Processing Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-medium">AI & Processing</h2>
            </div>

            <div className="border border-border rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="summary-model">Summary Model</Label>
                <Select value={settings.summaryModel} onValueChange={value => updateSetting("summaryModel", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-summary-prompt">Custom Summary Prompt</Label>
                <Textarea
                  id="custom-summary-prompt"
                  placeholder="Enter custom instructions for summaries (optional)"
                  value={settings.customSummaryPrompt}
                  onChange={e => updateSetting("customSummaryPrompt", e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Use {"{transcription}"} to reference the text</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Automatic Tagging</Label>
                  <p className="text-xs text-muted-foreground">Generate relevant tags using AI</p>
                </div>
                <Switch
                  checked={settings.autoTagging}
                  onCheckedChange={checked => updateSetting("autoTagging", checked)}
                />
              </div>

              {settings.autoTagging && (
                <div className="space-y-2">
                  <Label htmlFor="custom-tagging-prompt">Custom Tagging Prompt</Label>
                  <Textarea
                    id="custom-tagging-prompt"
                    placeholder="Enter instructions for AI tagging (optional)"
                    value={settings.customTaggingPrompt}
                    onChange={e => updateSetting("customTaggingPrompt", e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Storage & Privacy Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-lg font-medium">Storage & Privacy</h2>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Retain Audio Files</Label>
                <p className="text-xs text-muted-foreground">Keep original recordings for playback</p>
              </div>
              <Switch
                checked={settings.retainAudioFiles}
                onCheckedChange={checked => updateSetting("retainAudioFiles", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto-Delete Old Recordings</Label>
                <p className="text-xs text-muted-foreground">Automatically delete after set period</p>
              </div>
              <Switch checked={settings.autoDelete} onCheckedChange={checked => updateSetting("autoDelete", checked)} />
            </div>

            {settings.autoDelete && (
              <div className="space-y-2">
                <Label htmlFor="retention-days">Retention Period (Days)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="retention-days"
                    type="number"
                    min="1"
                    max="3650"
                    value={settings.retentionDays}
                    onChange={e => updateSetting("retentionDays", parseInt(e.target.value) || 365)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Usage Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-lg font-medium">Usage Information</h2>
          </div>

          <div className="border border-border rounded-lg p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">--</div>
                <div className="text-sm text-muted-foreground">Total Recordings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">--</div>
                <div className="text-sm text-muted-foreground">Processing Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">--</div>
                <div className="text-sm text-muted-foreground">Storage Used</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
