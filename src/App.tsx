import { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <Header
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
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
  );
}

export default App;
