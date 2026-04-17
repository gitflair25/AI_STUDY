import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SummaryViewProps {
  content: string;
}

export default function SummaryView({ content }: SummaryViewProps) {
  return (
    <div className="prose prose-invert max-w-none">
      <div className="markdown-body text-white/90 leading-relaxed text-lg">
        <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
      </div>
    </div>
  );
}
