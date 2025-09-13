import {Metadata} from 'next';
import {PromptReview} from '@/components/builder/PromptReview';

export const metadata: Metadata = {
  title: 'Review Prompt | Prompt Generator',
  description: 'Review and refine your AI-improved prompt',
};

export default function ReviewPage() {
  return <PromptReview />;
}
