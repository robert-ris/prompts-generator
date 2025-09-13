'use client';

import {useState, useCallback} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  User,
  Target,
  FileText,
  Palette,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';
import {CoreSettings, AdvancedSettings} from '@/types/database';

interface CoreSettingsProps {
  settings: CoreSettings;
  onChange: (settings: CoreSettings) => void;
}

interface AdvancedSettingsProps {
  settings: AdvancedSettings;
  onChange: (settings: AdvancedSettings) => void;
  children?: React.ReactNode;
}

// Core Settings Options
const ROLE_OPTIONS = [
  'Expert Marketer', 'Senior Software Engineer', 'Career Coach', 'Historian',
  'Data Scientist', 'UX Designer', 'Financial Advisor', 'Content Creator',
  'Project Manager', 'Sales Professional', 'Teacher', 'Consultant'
];

const NICHE_OPTIONS = [
  'SaaS Apps', 'Fitness', 'Education', 'Finance', 'Storytelling',
  'Healthcare', 'E-commerce', 'Technology', 'Marketing', 'Real Estate',
  'Travel', 'Food & Beverage', 'Entertainment', 'Non-profit'
];

const TASK_TYPE_OPTIONS = [
  'Write', 'Analyze', 'Brainstorm', 'Explain', 'Translate', 'Summarize',
  'Critique', 'Generate Ideas', 'Compare', 'Evaluate', 'Create', 'Design'
];

const OUTPUT_FORMAT_OPTIONS = [
  'Bullet Points', 'Step-by-step', 'Essay', 'Report', 'Table', 'JSON',
  'Code Snippet', 'Dialogue', 'List', 'Outline', 'Summary', 'Checklist'
];

const TONE_OPTIONS = [
  'Professional', 'Casual', 'Persuasive', 'Concise', 'Storytelling',
  'Analytical', 'Humorous', 'Formal', 'Friendly', 'Authoritative'
];

const AUDIENCE_OPTIONS = [
  'Students', 'Professionals', 'Beginners', 'Executives', 'Developers',
  'General Public', 'Experts', 'Consumers', 'Business Owners', 'Researchers'
];

const LENGTH_OPTIONS = [
  'Short', 'Medium', 'Detailed', 'Very Detailed'
];

export function CoreSettingsPanel({settings, onChange}: CoreSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = useCallback((key: keyof CoreSettings, value: string) => {
    onChange({...settings, [key]: value});
  }, [settings, onChange]);

  const clearSetting = useCallback((key: keyof CoreSettings) => {
    const newSettings = {...settings};
    delete newSettings[key];
    onChange(newSettings);
  }, [settings, onChange]);

  const getActiveCount = () => {
    return Object.values(settings).filter(value => value && value.trim() !== '').length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            Core Settings
            {getActiveCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveCount()} active
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Role */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <User className="h-4 w-4" />
              Role
              <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <Button
                  key={role}
                  variant={settings.role === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('role', role)}
                  className="text-xs"
                >
                  {role}
                </Button>
              ))}
            </div>
            {settings.role && (
              <div className="flex items-center gap-2">
                <Badge variant="default">{settings.role}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSetting('role')}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Niche/Domain */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Target className="h-4 w-4" />
              Niche / Domain
              <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {NICHE_OPTIONS.map((niche) => (
                <Button
                  key={niche}
                  variant={settings.niche === niche ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('niche', niche)}
                  className="text-xs"
                >
                  {niche}
                </Button>
              ))}
            </div>
            {settings.niche && (
              <div className="flex items-center gap-2">
                <Badge variant="default">{settings.niche}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSetting('niche')}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Task Type */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <FileText className="h-4 w-4" />
              Task Type
              <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TASK_TYPE_OPTIONS.map((task) => (
                <Button
                  key={task}
                  variant={settings.taskType === task ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('taskType', task)}
                  className="text-xs"
                >
                  {task}
                </Button>
              ))}
            </div>
            {settings.taskType && (
              <div className="flex items-center gap-2">
                <Badge variant="default">{settings.taskType}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSetting('taskType')}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Output Format */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Palette className="h-4 w-4" />
              Output Format
            </label>
            <div className="flex flex-wrap gap-2">
              {OUTPUT_FORMAT_OPTIONS.map((format) => (
                <Button
                  key={format}
                  variant={settings.outputFormat === format ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('outputFormat', format)}
                  className="text-xs"
                >
                  {format}
                </Button>
              ))}
            </div>
            {settings.outputFormat && (
              <div className="flex items-center gap-2">
                <Badge variant="default">{settings.outputFormat}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSetting('outputFormat')}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Tone/Style */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Palette className="h-4 w-4" />
              Tone / Style
            </label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((tone) => (
                <Button
                  key={tone}
                  variant={settings.tone === tone ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('tone', tone)}
                  className="text-xs"
                >
                  {tone}
                </Button>
              ))}
            </div>
            {settings.tone && (
              <div className="flex items-center gap-2">
                <Badge variant="default">{settings.tone}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSetting('tone')}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Users className="h-4 w-4" />
              Target Audience
            </label>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map((audience) => (
                <Button
                  key={audience}
                  variant={settings.targetAudience === audience ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('targetAudience', audience)}
                  className="text-xs"
                >
                  {audience}
                </Button>
              ))}
            </div>
            {settings.targetAudience && (
              <div className="flex items-center gap-2">
                <Badge variant="default">{settings.targetAudience}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSetting('targetAudience')}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Length Preference */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Clock className="h-4 w-4" />
              Length Preference
            </label>
            <div className="flex flex-wrap gap-2">
              {LENGTH_OPTIONS.map((length) => (
                <Button
                  key={length}
                  variant={settings.lengthPreference === length ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('lengthPreference', length)}
                  className="text-xs"
                >
                  {length}
                </Button>
              ))}
            </div>
            {settings.lengthPreference && (
              <div className="flex items-center gap-2">
                <Badge variant="default">{settings.lengthPreference}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSetting('lengthPreference')}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Constraints */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <AlertCircle className="h-4 w-4" />
              Constraints
            </label>
            <Textarea
              value={settings.constraints || ''}
              onChange={(e) => updateSetting('constraints', e.target.value)}
              placeholder="e.g., time limit, word count, specific tools/technologies, avoid jargon"
              rows={3}
              className="text-sm"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function AdvancedSettingsPanel({settings, onChange, children}: AdvancedSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = useCallback((key: keyof AdvancedSettings, value: string | string[]) => {
    onChange({...settings, [key]: value});
  }, [settings, onChange]);

  const clearSetting = useCallback((key: keyof AdvancedSettings) => {
    const newSettings = {...settings};
    delete newSettings[key];
    onChange(newSettings);
  }, [settings, onChange]);

  const toggleFormattingAddon = useCallback((addon: string) => {
    const currentAddons = settings.formattingAddons || [];
    const newAddons = currentAddons.includes(addon)
      ? currentAddons.filter(a => a !== addon)
      : [...currentAddons, addon];
    updateSetting('formattingAddons', newAddons);
  }, [settings.formattingAddons, updateSetting]);

  const getActiveCount = () => {
    return Object.values(settings).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value && value.toString().trim() !== '';
    }).length;
  };

  const PERSPECTIVE_OPTIONS = [
    'First Person', 'Second Person', 'Third Person', 'Neutral Narrator'
  ];

  const CREATIVITY_OPTIONS = [
    'Factual/Strict', 'Balanced', 'Creative', 'Highly Creative'
  ];

  const LANGUAGE_OPTIONS = [
    'English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese',
    'Formal Japanese', 'Chinese', 'Korean', 'Arabic', 'Russian'
  ];

  const FORMATTING_OPTIONS = [
    'Headings', 'Numbered Lists', 'Emojis', 'Markdown', 'LaTeX for Math/Science',
    'Bold Text', 'Italic Text', 'Code Blocks', 'Tables', 'Links'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-500" />
            Advanced Settings
            {getActiveCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveCount()} active
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Perspective */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Perspective
            </label>
            <div className="flex flex-wrap gap-2">
              {PERSPECTIVE_OPTIONS.map((perspective) => (
                <Button
                  key={perspective}
                  variant={settings.perspective === perspective ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('perspective', perspective)}
                  className="text-xs"
                >
                  {perspective}
                </Button>
              ))}
            </div>
            {settings.perspective && (
              <div className="flex items-center gap-2">
                <Badge variant="default">{settings.perspective}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSetting('perspective')}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Creativity Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Creativity Level
            </label>
            <div className="flex flex-wrap gap-2">
              {CREATIVITY_OPTIONS.map((creativity) => (
                <Button
                  key={creativity}
                  variant={settings.creativityLevel === creativity ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('creativityLevel', creativity)}
                  className="text-xs"
                >
                  {creativity}
                </Button>
              ))}
            </div>
            {settings.creativityLevel && (
              <div className="flex items-center gap-2">
                <Badge variant="default">{settings.creativityLevel}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSetting('creativityLevel')}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Language / Localization
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((language) => (
                <Button
                  key={language}
                  variant={settings.language === language ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('language', language)}
                  className="text-xs"
                >
                  {language}
                </Button>
              ))}
            </div>
            {settings.language && (
              <div className="flex items-center gap-2">
                <Badge variant="default">{settings.language}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSetting('language')}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Additional Context */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Context
            </label>
            <Textarea
              value={settings.additionalContext || ''}
              onChange={(e) => updateSetting('additionalContext', e.target.value)}
              placeholder="Add background info, examples, or specific requirements..."
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Formatting Add-ons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Formatting Add-ons
            </label>
            <div className="flex flex-wrap gap-2">
              {FORMATTING_OPTIONS.map((format) => (
                <Button
                  key={format}
                  variant={settings.formattingAddons?.includes(format) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFormattingAddon(format)}
                  className="text-xs"
                >
                  {format}
                </Button>
              ))}
            </div>
            {settings.formattingAddons && settings.formattingAddons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {settings.formattingAddons.map((addon) => (
                  <Badge key={addon} variant="default" className="text-xs">
                    {addon}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFormattingAddon(addon)}
                      className="h-4 w-4 p-0 ml-1"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Call to Action
            </label>
            <Textarea
              value={settings.callToAction || ''}
              onChange={(e) => updateSetting('callToAction', e.target.value)}
              placeholder="e.g., 'end with a summary,' 'give 3 actionable steps,' 'provide references'"
              rows={2}
              className="text-sm"
            />
          </div>
        </CardContent>
      )}

      {/* Children content (e.g., Improve Prompt button) */}
      {children}
    </Card>
  );
}
