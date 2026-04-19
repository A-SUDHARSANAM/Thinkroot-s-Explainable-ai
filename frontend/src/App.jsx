import { useMemo, useState } from "react";

import Sidebar from "./components/Sidebar";
import AnalysisPage from "./pages/AnalysisPage";
import ComparePage from "./pages/ComparePage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import UploadPage from "./pages/UploadPage";
import VerifyPage from "./pages/VerifyPage";

const DEFAULT_SECTION = "Upload Document";

export default function App() {
  const [activeSection, setActiveSection] = useState(DEFAULT_SECTION);
  const [uploadedDoc, setUploadedDoc] = useState(null);

  const mainView = useMemo(() => {
    if (activeSection === "Upload Document") {
      return <UploadPage uploadedDoc={uploadedDoc} onUploaded={setUploadedDoc} />;
    }
    if (activeSection === "Analysis") {
      return <AnalysisPage uploadedDoc={uploadedDoc} />;
    }
    if (activeSection === "Verify Document") {
      return <VerifyPage uploadedDoc={uploadedDoc} />;
    }
    if (activeSection === "Compare Documents") {
      return <ComparePage />;
    }
    if (activeSection === "Audit Log") {
      return <HistoryPage />;
    }
    return <SettingsPage />;
  }, [activeSection, uploadedDoc]);

  return (
    <div className="h-screen lg:flex bg-[#07153a] overflow-hidden">
      <Sidebar active={activeSection} onSelect={setActiveSection} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {mainView}
      </main>
    </div>
  );
}
