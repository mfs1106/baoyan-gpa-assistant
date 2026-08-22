import { useState } from 'react';
import { CheckCircle2, GraduationCap, LockKeyhole, Loader2 } from 'lucide-react';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

interface ResetPasswordPageProps {
  onReturnToLogin: () => Promise<void> | void;
}

export function ResetPasswordPage({ onReturnToLogin }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!supabase || !hasSupabaseConfig) {
      setError('云端服务尚未配置，请稍后重试。');
      return;
    }
    if (password.length < 8) {
      setError('新密码至少需要 8 位。');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的新密码不一致。');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '密码修改失败，请重新验证后再试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-7 sm:p-8">
        <div className="text-center mb-7">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center shadow-lg">{success ? <CheckCircle2 size={32} /> : <GraduationCap size={32} />}</div>
          <h1 className="text-2xl font-bold text-gray-900">{success ? '密码修改成功' : '设置新密码'}</h1>
          <p className="text-sm text-gray-500 mt-2">{success ? '请使用新密码重新登录保研绩点助手。' : '邮箱验证码已验证，请设置一个新的登录密码。'}</p>
        </div>
        {success ? (
          <button type="button" onClick={onReturnToLogin} className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-primary-500 to-accent-500 hover:shadow-lg">返回登录</button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block"><span className="text-sm font-medium text-gray-700">新密码</span><span className="relative block mt-1"><LockKeyhole size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" placeholder="至少 8 位" className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" /></span></label>
            <label className="block"><span className="text-sm font-medium text-gray-700">确认新密码</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" placeholder="再次输入新密码" className="w-full mt-1 px-3 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" /></label>
            {error && <p className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</p>}
            <button disabled={loading} type="submit" className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-primary-500 to-accent-500 hover:shadow-lg disabled:opacity-60 flex justify-center items-center gap-2">{loading ? <Loader2 size={18} className="animate-spin" /> : <LockKeyhole size={18} />}{loading ? '修改中...' : '确认修改密码'}</button>
          </form>
        )}
      </section>
    </main>
  );
}

