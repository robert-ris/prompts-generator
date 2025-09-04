import {Metadata} from 'next';
import {PromptLibrary} from '@/components/library/PromptLibrary';

export const metadata: Metadata = {
  title: 'My Library - AI Prompt Builder',
  description: 'Manage and organize your saved AI prompts',
};

export default function LibraryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          My Library
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage and organize your saved AI prompts
        </p>
      </div>

      <PromptLibrary />
    </div>
  );
}
