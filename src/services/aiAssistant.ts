import { supabase } from '@/lib/supabase';

export interface AiConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface AiAssistantResponse {
  answer?: string;
  error?: string;
}

/**
 * 第一版 AI 助手只传递用户在聊天框中输入的问题及近期对话上下文。
 * 课程、成绩、排名、文件等个人业务数据不会发送到模型服务。
 */
export async function askAiAssistant(
  message: string,
  history: AiConversationTurn[]
): Promise<string> {
  if (!supabase) {
    throw new Error('云端服务尚未配置');
  }

  const safeHistory = history
    .filter((turn) => turn.role === 'user' || turn.role === 'assistant')
    .slice(-6)
    .map((turn) => ({
      role: turn.role,
      content: turn.content.slice(0, 1200),
    }));

  const { data, error } = await supabase.functions.invoke<AiAssistantResponse>('ai-assistant', {
    body: {
      message: message.slice(0, 1200),
      history: safeHistory,
    },
  });

  if (error) {
    throw new Error(error.message || 'AI 服务暂时不可用');
  }
  if (!data?.answer) {
    throw new Error(data?.error || 'AI 服务未返回有效回答');
  }

  return data.answer;
}

