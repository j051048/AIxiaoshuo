import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          relative max-w-[90%] md:max-w-[80%] rounded-3xl p-6 shadow-sm transition-all
          ${isUser 
            ? 'bg-primary text-white rounded-tr-sm shadow-indigo-200' 
            : 'bg-white border border-slate-50 text-slate-800 rounded-tl-sm shadow-slate-100'
          }
        `}
      >
        <div className={`markdown-body text-sm md:text-base leading-7 ${isUser ? 'text-white' : 'novel-text'}`}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Refined typography spacing
              p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
              a: ({node, ...props}) => <a className="underline decoration-2 underline-offset-2 opacity-90 hover:opacity-100" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
              table: ({node, ...props}) => (
                <div className="overflow-hidden my-4 rounded-xl border border-slate-200 shadow-sm">
                   <table className="w-full text-sm text-left" {...props} />
                </div>
              ),
              thead: ({node, ...props}) => <thead className="bg-slate-50 text-xs uppercase text-slate-500" {...props} />,
              th: ({node, ...props}) => <th className="px-4 py-3 font-bold" {...props} />,
              td: ({node, ...props}) => <td className="px-4 py-3 border-t border-slate-100" {...props} />,
              blockquote: ({node, ...props}) => (
                <blockquote className={`border-l-4 pl-4 italic my-4 ${isUser ? 'border-white/30' : 'border-primary/30 text-slate-500'}`} {...props} />
              ),
              strong: ({node, ...props}) => <strong className={`font-bold ${isUser ? 'text-white' : 'text-primary'}`} {...props} />
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        
        <div className={`text-[10px] mt-2 font-medium opacity-60 text-right`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;