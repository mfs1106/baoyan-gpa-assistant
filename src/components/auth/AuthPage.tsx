import { useState } from 'react';
import { GraduationCap, LockKeyhole, Mail, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetNotice = () => {
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetNotice();

    if (!supabase || !hasSupabaseConfig) {
      setError('云端服务尚未配置，请完成 Supabase 项目配置后再注册。');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }
    if (password.length < 8) {
      setError('密码至少需要 8 位。');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
          },
        });
        if (signUpError) throw signUpError;
        setMessage('注册成功。请打开邮箱，点击验证邮件中的链接后再登录。');
        setPassword('');
        setConfirmPassword('');
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginError) throw loginError;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '操作失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-7 sm:p-8">
        <div className="text-center mb-7">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center shadow-lg">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">保研绩点助手</h1>
          <p className="text-sm text-gray-500 mt-2">登录后可在不同设备安全同步你的数据</p>
        </div>

        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button type="button" onClick={() => { setMode('login'); resetNotice(); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>登录</button>
          <button type="button" onClick={() => { setMode('signup'); resetNotice(); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>注册</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">邮箱</span>
            <span className="relative block mt-1">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="name@example.com" className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">密码</span>
            <span className="relative block mt-1">
              <LockKeyhole size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="至少 8 位" className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            </span>
          </label>
          {mode === 'signup' && (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">确认密码</span>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="再次输入密码" className="w-full mt-1 px-3 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            </label>
          )}

          {error && <p className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</p>}
          {message && <p className="p-3 rounded-xl bg-green-50 text-green-700 text-sm">{message}</p>}

          <button disabled={loading} type="submit" className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-primary-500 to-accent-500 hover:shadow-lg disabled:opacity-60 flex justify-center items-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册并验证邮箱'}
          </button>
        </form>

        <p className="mt-5 text-xs leading-relaxed text-center text-gray-400">你的课程、成绩、课表和文件均按账号隔离保存，其他用户无法查看。</p>
      </section>
    </main>
  );
}
