import {Metadata} from 'next';
import {PromptViewer} from '@/components/prompts/PromptViewer';

export const metadata: Metadata = {
  title: 'View Prompt - AI Prompt Builder',
  description: 'View and edit your AI prompts',
};

interface PromptPageProps {
  params: {
    id: string;
  };
}

export default function PromptPage({params}: PromptPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <PromptViewer promptId={params.id} />
    </div>
  );
}
