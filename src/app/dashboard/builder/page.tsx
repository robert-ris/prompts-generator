import {Metadata} from 'next';
import {PromptBuilder} from '@/components/builder/PromptBuilder';

export const metadata: Metadata = {
  title: 'Prompt Builder - AI Prompt Builder',
  description: 'Create and customize AI prompts with our dynamic builder interface',
};

export default function BuilderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Prompt Builder
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create and customize AI prompts with our dynamic builder interface
        </p>
      </div>

      <PromptBuilder />
    </div>
  );
}
