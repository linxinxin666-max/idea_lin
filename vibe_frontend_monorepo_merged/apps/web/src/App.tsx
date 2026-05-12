import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { ScriptList } from './pages/ScriptList/ScriptList';
import { ScriptCreate } from './pages/ScriptCreate/ScriptCreate';
import { ScriptEdit } from './pages/ScriptEdit/ScriptEdit';
 import { ScriptDataOverview } from './pages/ScriptData/ScriptDataOverview';
 import { ScriptDataDetail } from './pages/ScriptData/ScriptDataDetail';
import { SSOProvider } from './components/SSOProvider/SSOProvider';
import AgentCallChatPage from './pages/AgentCallChatPage';
import MemoryPlayground from './pages/MemoryPlayground';
import { KBList } from './pages/KnowledgeBase/KBList';
import { KBEdit } from './pages/KnowledgeBase/KBEdit';
import { Settings } from './pages/Settings/Settings';
import './App.css';
import Cal from './pages/Cal'
import AiBatch from './pages/AiBatch'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <SSOProvider>
        <Routes>
          <Route path="/self_help/ai_batch" element={<AiBatch />} />
          <Route path="/self_help/cal" element={<Cal />} />
          <Route
            path="/self_help/agent_call"
            element={<MainLayout />}
          >
            <Route index element={<Navigate to="list" replace />} />
            <Route path="create" element={<ScriptCreate />} />
            <Route path="list" element={<ScriptList />} />
            <Route path="edit/:id" element={<ScriptEdit />} />
            <Route path="data" element={<ScriptDataOverview />} />
            <Route path="data/:id" element={<ScriptDataDetail />} />
            <Route path="knowledge" element={<KBList />} />
            <Route path="knowledge/edit/:id" element={<KBEdit />} />
            <Route path="chat_page" element={<AgentCallChatPage />} />
            <Route path="memory_playground" element={<MemoryPlayground />} />
            <Route path="settings" element={<Settings />} />

          </Route>
          {/*<Route path="*" element={<Navigate to="/self_help/agent_call" replace />} />*/}
        </Routes>
      </SSOProvider>
    </BrowserRouter>
  )
}

export default App
