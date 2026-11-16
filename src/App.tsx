import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { SceneCanvas } from './components/scene/SceneCanvas';
import { Toolbar } from './components/ui/Toolbar';
import { FinishPanel } from './components/ui/FinishPanel';
import { Minimap } from './components/ui/Minimap';
import { TracingEditor } from './components/editor/TracingEditor';
import { loadLastScheme } from './utils/schemeIO';
import { useAppStore } from './store/useAppStore';

function Walkthrough() {
  return (
    <div className="app-shell">
      <Toolbar />
      <div className="main">
        <div className="viewport">
          <SceneCanvas />
          <Minimap />
        </div>
        <FinishPanel />
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    loadLastScheme().then((s) => {
      if (s) useAppStore.getState().loadScheme(s);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Walkthrough />} />
        <Route path="/editor" element={<TracingEditor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
