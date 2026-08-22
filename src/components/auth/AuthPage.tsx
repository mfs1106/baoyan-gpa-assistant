import { useEffect, useState } from 'react';
import { GraduationCap, LockKeyhole, Mail, UserPlus, LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupStep, setSignupStep] = useState<'form' | 'verify'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const resetNotice = () => {
    setMessage('');
    setError('');
  };

  const returnToSignupForm = () => {
    setSignupStep('form');
    setVerificationCode('');
    setResendCooldown(0);
    resetNotice();
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
        setSignupStep('verify');
        setResendCooldown(60);
        setMessage(`验证码已发送至 ${email.trim()}。请输入邮件中的验证码完成注册。`);
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

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    resetNotice();

    if (!supabase || !hasSupabaseConfig) {
      setError('云端服务尚未配置，请完成 Supabase 项目配置后再注册。');
      return;
    }
    if (!/^\d{6,8}$/.test(verificationCode.trim())) {
      setError('请输入邮件中的 6 至 8 位验证码。');
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: verificationCode.trim(),
        type: 'email',
      });
      if (verifyError) throw verifyError;
      setMessage('邮箱验证成功，正在登录你的账号…');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '验证码验证失败，请重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    resetNotice();
    if (resendCooldown > 0) return;
    if (!supabase || !hasSupabaseConfig) {
      setError('云端服务尚未配置，请完成 Supabase 项目配置后再注册。');
      return;
    }

    setLoading(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });
      if (resendError) throw resendError;
      setResendCooldown(60);
      setMessage('新的验证码已发送，请查收邮箱。');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '验证码发送失败，请稍后重试。');
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
          <button type="button" onClick={() => { setMode('login'); returnToSignupForm(); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>登录</button>
          <button type="button" onClick={() => { setMode('signup'); returnToSignupForm(); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>注册</button>
        </div>

        {mode === 'signup' && signupStep === 'verify' ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="rounded-xl bg-primary-50 p-4 text-center">
              <ShieldCheck size={28} className="mx-auto text-primary-600" />
              <h2 className="mt-2 font-medium text-gray-900">验证你的邮箱</h2>
              <p className="mt-1 text-sm text-gray-500">验证码已发送至 {email.trim()}</p>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">邮箱验证码</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                required
                autoFocus
                placeholder="输入 6 至 8 位验证码"
                className="w-full mt-1 px-3 py-3 text-center tracking-[0.35em] border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </label>

            {error && <p className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</p>}
            {message && <p className="p-3 rounded-xl bg-green-50 text-green-700 text-sm">{message}</p>}

            <button disabled={loading} type="submit" className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-primary-500 to-accent-500 hover:shadow-lg disabled:opacity-60 flex justify-center items-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              {loading ? '验证中...' : '验证并进入系统'}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={returnToSignupForm} disabled={loading} className="text-gray-500 hover:text-gray-700 disabled:opacity-50">修改邮箱或密码</button>
              <button type="button" onClick={handleResendCode} disabled={loading || resendCooldown > 0} className="text-primary-600 hover:text-primary-700 disabled:opacity-50">
                {resendCooldown > 0 ? `重新发送（${resendCooldown}s）` : '重新发送验证码'}
              </button>
            </div>
          </form>
        ) : (
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
        )}

        <p className="mt-5 text-xs leading-relaxed text-center text-gray-400">你的课程、成绩、课表和文件均按账号隔离保存，其他用户无法查看。</p>
      </section>
    </main>
  );
}

