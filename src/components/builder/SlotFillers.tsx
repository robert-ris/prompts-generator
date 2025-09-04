'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {PromptVariables} from '@/lib/prompt-processing';

interface SlotFillersProps {
  variables: PromptVariables;
  onVariableChange: (key: keyof PromptVariables, value: string) => void;
}

const PRESET_OPTIONS = {
  role: [
    'teacher', 'expert', 'consultant', 'mentor', 'coach', 'specialist', 'advisor', 'instructor'
  ],
  topic: [
    'programming', 'writing', 'marketing', 'design', 'business', 'education', 'health', 'technology'
  ],
  tone: [
    'professional', 'friendly', 'formal', 'casual', 'enthusiastic', 'calm', 'confident', 'helpful'
  ],
  outputType: [
    'step-by-step guide', 'detailed explanation', 'summary', 'list', 'analysis', 'recommendations', 'tutorial'
  ]
};

export function SlotFillers({variables, onVariableChange}: SlotFillersProps) {
  const handlePresetClick = (key: keyof PromptVariables, value: string) => {
    onVariableChange(key, value);
  };

  const handleCustomInput = (key: keyof PromptVariables, value: string) => {
    onVariableChange(key, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fill in the Variables</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Role
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={variables.role}
              onChange={(e) => handleCustomInput('role', e.target.value)}
              placeholder="Enter a role (e.g., teacher, expert, consultant)"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
            />
            <div className="flex flex-wrap gap-2">
              {PRESET_OPTIONS.role.map((option) => (
                <Badge
                  key={option}
                  variant={variables.role === option ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => handlePresetClick('role', option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Topic */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Topic
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={variables.topic}
              onChange={(e) => handleCustomInput('topic', e.target.value)}
              placeholder="Enter a topic (e.g., programming, writing, marketing)"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
            />
            <div className="flex flex-wrap gap-2">
              {PRESET_OPTIONS.topic.map((option) => (
                <Badge
                  key={option}
                  variant={variables.topic === option ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => handlePresetClick('topic', option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Tone */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tone
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={variables.tone}
              onChange={(e) => handleCustomInput('tone', e.target.value)}
              placeholder="Enter a tone (e.g., professional, friendly, formal)"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
            />
            <div className="flex flex-wrap gap-2">
              {PRESET_OPTIONS.tone.map((option) => (
                <Badge
                  key={option}
                  variant={variables.tone === option ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => handlePresetClick('tone', option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Output Type */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Output Type
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={variables.outputType}
              onChange={(e) => handleCustomInput('outputType', e.target.value)}
              placeholder="Enter output type (e.g., step-by-step guide, summary)"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
            />
            <div className="flex flex-wrap gap-2">
              {PRESET_OPTIONS.outputType.map((option) => (
                <Badge
                  key={option}
                  variant={variables.outputType === option ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => handlePresetClick('outputType', option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
