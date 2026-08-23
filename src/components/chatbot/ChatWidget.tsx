import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, ChevronRight, HelpCircle, FileText, Award, BookOpen, Server, Zap } from 'lucide-react';
import { findBestMatch, findTopMatches, getSuggestionQuestions, MatchResult } from '@/utils/faqMatcher';
import { getAllCategories } from '@/data/faqData';
import { askAiAssistant } from '@/services/aiAssistant';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  time: Date;
  suggestions?: string[];
  matchedItem?: MatchResult;
  source?: 'ai' | 'local';
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content:
        '你好！我是保研绩点助手智能助手 🤖\n\n我可以帮你解答：\n• 文件导入问题（格式、报错、匹配等）\n• GPA计算规则\n• 保研排名预测\n• 课表导入与查看\n• 服务器启动\n• 其他功能使用\n\n有什么可以帮你的吗？',
      time: new Date(),
      suggestions: getSuggestionQuestions().slice(0, 4),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const toggleWidget = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(!isOpen);
      setIsAnimating(false);
    }, 150);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const bestMatch = findBestMatch(text);
    const topMatches = findTopMatches(text, 3);

    try {
      const history = messages
        .filter((message) => message.id !== 'welcome')
        .slice(-6)
        .map((message) => ({
          role: message.type === 'user' ? 'user' as const : 'assistant' as const,
          content: message.content,
        }));
      const answer = await askAiAssistant(text, history);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ai`,
          type: 'assistant',
          content: answer,
          time: new Date(),
          source: 'ai',
          suggestions: topMatches.slice(0, 3).map((match) => match.item.question),
        },
      ]);
    } catch {
      const fallbackContent = bestMatch && bestMatch.score >= 5
        ? `AI 服务暂时不可用，先为你提供内置说明：\n\n${bestMatch.item.answer}`
        : topMatches.length > 0
          ? `AI 服务暂时不可用。以下是可能相关的内置说明：\n\n${topMatches
              .map((match, index) => `${index + 1}. ${match.item.question}\n${match.item.answer}`)
              .join('\n\n')}`
          : 'AI 服务暂时不可用。你可以换一种方式描述网站功能问题，或从下方分类中选择问题。';
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-local`,
          type: 'assistant',
          content: fallbackContent,
          time: new Date(),
          source: 'local',
          matchedItem: bestMatch || undefined,
          suggestions: topMatches.length > 0
            ? topMatches.map((match) => match.item.question)
            : getSuggestionQuestions().slice(0, 4),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    handleSend(question);
  };

  const handleCategoryClick = (category: string) => {
    const questions = getSuggestionQuestions(category);
    const categoryLabels: Record<string, string> = {
      导入: '📥 导入问题',
      成绩: '📊 成绩相关',
      保研: '🏆 保研排名',
      课表: '📅 课表相关',
      服务器: '🖥️ 服务器问题',
      功能: '✨ 功能介绍',
      其他: '❓ 其他问题',
    };

    const assistantMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `【${categoryLabels[category] || category}】\n\n以下是相关问题，点击即可查看答案：`,
      time: new Date(),
      suggestions: questions.slice(0, 6),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '导入':
        return <FileText size={14} />;
      case '成绩':
        return <BookOpen size={14} />;
      case '保研':
        return <Award size={14} />;
      case '课表':
        return <Zap size={14} />;
      case '服务器':
        return <Server size={14} />;
      case '功能':
        return <Sparkles size={14} />;
      default:
        return <HelpCircle size={14} />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      导入: 'bg-blue-50 text-blue-600 border-blue-200',
      成绩: 'bg-green-50 text-green-600 border-green-200',
      保研: 'bg-amber-50 text-amber-600 border-amber-200',
      课表: 'bg-purple-50 text-purple-600 border-purple-200',
      服务器: 'bg-slate-50 text-slate-600 border-slate-200',
      功能: 'bg-pink-50 text-pink-600 border-pink-200',
      其他: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    return colors[category] || colors['其他'];
  };

  const categories = getAllCategories();
  const lastMessage = messages[messages.length - 1];
  const showSuggestions = lastMessage?.type === 'assistant' && lastMessage.suggestions && lastMessage.suggestions.length > 0;

  return (
    <>
      <div
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300 ${
          isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
        }`}
      >
        {isOpen ? (
          <div className="w-[calc(100vw-2rem)] h-[75vh] max-w-md sm:w-96 sm:h-[560px] sm:max-w-none bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="text-white" size={22} />
                </div>
                <div>
                  <p className="font-semibold text-white">AI 功能助手</p>
                  <p className="text-xs text-white/80">仅解答网站功能与操作方法</p>
                </div>
              </div>
              <button
                onClick={toggleWidget}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="text-white" size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0">
                      <Sparkles className="text-white" size={16} />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.type === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.source === 'ai' && (
                      <p className="text-[10px] mt-1.5 text-indigo-400">AI 功能问答</p>
                    )}
                    {msg.matchedItem && (
                      <p className="text-xs mt-1 opacity-60">
                        💡 匹配度: {Math.round((msg.matchedItem.score / 30) * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0">
                    <Sparkles className="text-white" size={16} />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Loader2 className="text-indigo-500 animate-spin" size={16} />
                      <span className="text-sm text-gray-500">正在思考中...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {showSuggestions && !isTyping && (
              <div className="px-4 py-2 bg-white border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">💡 常见问题</p>
                <div className="flex flex-wrap gap-2">
                  {lastMessage?.suggestions?.slice(0, 4).map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-1 max-w-[200px] truncate"
                    >
                      <ChevronRight size={12} className="flex-shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category buttons */}
            {!showSuggestions && !isTyping && (
              <div className="px-4 py-2 bg-white border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">📂 问题分类</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick(cat)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all hover:scale-105 ${getCategoryColor(
                        cat
                      )}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {getCategoryIcon(cat)}
                        {cat}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                  placeholder="输入你的问题..."
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                  disabled={isTyping}
                />
                <button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Send size={16} className="text-white" />
                </button>
              </div>
              <p className="text-[10px] text-gray-300 text-center mt-2">
                AI 仅解答网站功能，不会读取你的课程、成绩、排名或文件
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2">
            {!isOpen && (
              <div className="flex items-center gap-2 bg-white rounded-full shadow-lg px-3 py-2 border border-gray-100 animate-pulse-subtle">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600 font-medium">我在这里~</span>
              </div>
            )}
            <button
              onClick={toggleWidget}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group relative"
            >
              <MessageCircle className="text-white group-hover:rotate-12 transition-transform duration-300" size={26} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold animate-bounce">
                !
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

