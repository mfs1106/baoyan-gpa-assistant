import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatWidget } from '@/components/chatbot/ChatWidget';
import { Dashboard } from '@/pages/Dashboard';
import { ImportPage } from '@/pages/ImportPage';
import { PredictPage } from '@/pages/PredictPage';
import { CourseManagement } from '@/pages/CourseManagement';
import { TimetablePage } from '@/pages/TimetablePage';
import { TimetableImportPage } from '@/pages/TimetableImportPage';
import { GradeAnalysisPage } from '@/pages/GradeAnalysisPage';
import { RecommendationPage } from '@/pages/RecommendationPage';
import { RankingPage } from '@/pages/RankingPage';
import { MyFilesPage } from '@/pages/MyFilesPage';
import { AuthPage } from '@/components/auth/AuthPage';
import { ResetPasswordPage } from '@/components/auth/ResetPasswordPage';
import { CloudDataSync } from '@/components/auth/CloudDataSync';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { saveCloudSnapshot } from '@/services/cloudSync';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabase || !hasSupabaseConfig) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      setAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (!supabase || !session) return;
    try {
      await saveCloudSnapshot(session.user.id);
    } catch {
      // 网络异常时仍允许退出；本地缓存会在下一次登录时继续保留。
    }
    await supabase.auth.signOut();
  };

  const handlePasswordRecoveryComplete = async () => {
    setPasswordRecovery(false);
    await supabase?.auth.signOut();
  };

  if (authLoading) return <div className="min-h-screen bg-gray-50" />;
  if (passwordRecovery && session) return <ResetPasswordPage onReturnToLogin={handlePasswordRecoveryComplete} />;
  if (!session) return <AuthPage onPasswordRecoveryVerified={() => setPasswordRecovery(true)} />;

  return (
    <CloudDataSync user={session.user}>
    <Router>
      <Header
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        userEmail={session.user.email}
        onSignOut={handleSignOut}
      />
      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
        <main className="flex-1 min-h-[calc(100vh-4rem)] bg-gray-50 w-0">
          <div className="p-4 md:p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/predict" element={<PredictPage />} />
              <Route path="/courses" element={<CourseManagement />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/timetable-import" element={<TimetableImportPage />} />
              <Route path="/analysis" element={<GradeAnalysisPage />} />
              <Route path="/recommendation" element={<RecommendationPage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/my-files" element={<MyFilesPage />} />
            </Routes>
          </div>
        </main>
      </div>
      <ChatWidget />
    </Router>
    </CloudDataSync>
  );
}

export default App;

