import { useEffect, useState } from 'react';
import './App.css';
import { Header } from '@/components/Layout/Header';
import { SplitPane } from '@/components/Layout/SplitPane';
import { FileExplorer } from '@/components/FileExplorer';
import { Editor } from '@/components/Editor/Editor';
import { EditorTabs } from '@/components/Editor/EditorTabs';
import { Preview } from '@/components/Preview/Preview';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { exportService } from '@/services/exportService';

function App() {
  const project = useProjectStore((state) => state.project);
  const resetProject = useProjectStore((state) => state.resetProject);
  const theme = useUIStore((state) => state.theme);
  const [isExporting, setIsExporting] = useState(false);

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleExport = async () => {
    if (!project || isExporting) return;
    setIsExporting(true);
    try {
      const result = await exportService.exportAsZip(project);
      if (!result.ok) {
        console.error('Export failed:', result.error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="app">
      <Header
        projectName={project?.name ?? 'Frontend Sandbox'}
        onReset={resetProject}
        onExport={handleExport}
        isExporting={isExporting}
      />
      <main className="app-main">
        <SplitPane initialSizes={[15, 45, 40]} minSize={100}>
          <FileExplorer />
          <div className="panel editor">
            <EditorTabs />
            <div className="panel-content">
              <Editor />
            </div>
          </div>
          <div className="panel preview">
            <Preview />
          </div>
        </SplitPane>
      </main>
    </div>
  );
}

export default App;
