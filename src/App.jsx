import { useState } from "react";
import Login from "./Pages/Login/Login";
import RegisterFree from "./Pages/Login/RegisterFree";
import LoginFree from "./Pages/Login/LoginFree";
import { ThemeProvider } from "./Pages/SuperAdmin/Superadmincontext";
import { MetadataProvider, useTenantCapabilities } from "./context/MetadataContext";
import { SubscriptionProvider , useSubscription } from "./context/SubscriptionContext";
import LandingRouter from "../src/Pages/Home/LandingRouter";
import { AIAssistantProvider } from "./features/aiAssistant/AIAssistantContext";
import { buildAIAssistantPages, AI_PAGE_TITLES } from "./features/aiAssistant/nav";
import { buildCommunicationPages, COMMUNICATION_PAGE_TITLES } from "./features/communication/nav";
import BookDemo from "./Pages/BookDemo/BookDemo";
import BookDemoFlow from "./Pages/BookDemo/BookDemoFlow";


// Subscription Management — SuperAdmin screens
import SubscriptionsAdmin from "./Pages/SuperAdmin/SubscriptionsAdmin";
import PlanCatalog from "./Pages/SuperAdmin/PlanCatalog";

// SuperAdmin
import { Layout } from "./Pages/SuperAdmin/Layout";
import Dashboard from "./Pages/SuperAdmin/Dashboard";
// import Tenants from "./Pages/SuperAdmin/Tenants";
import { PaidTenants, FreeTenants } from "./Pages/SuperAdmin/TenantManagement";
import Allusers from "./Pages/SuperAdmin/Allusers";
import Odataplugins from "./Pages/SuperAdmin/Odataplugins";
import Systemsettings from "./Pages/SuperAdmin/Systemsettings";
import Billing from "./Pages/SuperAdmin/Billing";
import DepartmentsPage from "./Pages/SuperAdmin/Departmentspage";
import SACompanyCodes from "./Pages/SuperAdmin/CompanyCodes";
import SAPlants from "./Pages/SuperAdmin/Plants";

// TenantAdmin
import { TenantLayout } from "./Pages/TenantAdmin/TenantLayout";
import TADashboard from "./Pages/TenantAdmin/TADashboard";
import TAUsers from "./Pages/TenantAdmin/TAUsers";
import CompanyCodes from "./Pages/TenantAdmin/CompanyCodes";
import Plants from "./Pages/TenantAdmin/Plants";
import TAFolder from "./Pages/TenantAdmin/TAFolder";
import TADocuments from "./Pages/TenantAdmin/TADocuments";
import TAWorkflow from "./Pages/TenantAdmin/TAWorkflow";
import SubscriptionPage from "./Pages/TenantAdmin/SubscriptionPage";
import TAApprovals from "./Pages/TenantAdmin/TAApprovals";
import ApprovalWorkflowList from "./Pages/TenantAdmin/Approvals/ApprovalWorkflowList";
import WorkflowAssignmentPage from "./Pages/TenantAdmin/Approvals/WorkflowAssignmentPage";
import UserAssignmentPage from "./Pages/TenantAdmin/UserAssignment";
import DocumentSearchModal from "./Pages/TenantAdmin/DMSWorkflow/modals/Documentsearchmodal";
import MetadataTemplateManager from "./features/metadataEngine/TemplateManager";
import CrossDepartmentAccessPage
  from "./features/crossDepartmentDocument/CrossDepartmentAccessPage";
// SAP Synchronization Module (Settings → SAP Synchronization) — TenantAdmin only
import SapSyncDashboard from "./features/sapSync/pages/SapSyncDashboard";
import MasterSyncPage from "./features/sapSync/pages/MasterSyncPage";
import DocumentSyncPage from "./features/sapSync/pages/DocumentSyncPage";
import PendingClassificationPage from "./features/sapSync/pages/PendingClassificationPage";
import SchedulerPage from "./features/sapSync/pages/SchedulerPage";
import JobHistoryPage from "./features/sapSync/pages/JobHistoryPage";
import LogViewerPage from "./features/sapSync/pages/LogViewerPage";
import SapSyncSettingsPage from "./features/sapSync/pages/SettingsPage";

// Enterprise Audit Module (shared across SuperAdmin / TenantAdmin / Auditor)
import { AuditList } from "./Pages/Audit";


// BranchManager
import { BMLayout } from "./Pages/BranchManager/BMLayout";
import BMDashboard from "./Pages/BranchManager/BMDashboard";
import BMDocuments from "./Pages/TenantAdmin/TADocuments";
import BMWorkflow from "./Pages/TenantAdmin/TAWorkflow";
import BMFolders from "./Pages/TenantAdmin/TAFolder";
import BMApprovals from "./Pages/TenantAdmin/TAApprovals";

// DeptHead
import { DHLayout } from "./Pages/DeptHead/DHLayout";
import DHDashboard from "./Pages/DeptHead/DHDashboard";
import DHDocuments from "./Pages/TenantAdmin/TADocuments";
import DHWorkflow from "./Pages/TenantAdmin/TAWorkflow";
import DHApprovals from "./Pages/TenantAdmin/TAApprovals";
import DHFolders from "./Pages/TenantAdmin/TAFolder";

// Manager
import { MGLayout } from "./Pages/Manager/MGLayout";
import MGDashboard from "./Pages/Manager/MGDashboard";
import MGDocuments from "./Pages/TenantAdmin/TADocuments";
import MGNewDoc from "./Pages/TenantAdmin/TAWorkflow";
import MGApprovals from "./Pages/TenantAdmin/TAApprovals";
import MGFolders from "./Pages/TenantAdmin/TAFolder";

// Uploader
import { UploaderLayout } from "./Pages/Uploader/Uploaderlayout";
import UploaderDashboard from "./Pages/Uploader/Uploaderdashboard";
import UploaderDocuments from "./Pages/TenantAdmin/TADocuments";

// Viewer
import { ViewerLayout } from "./Pages/viewer/Viewerlayout";
import ViewerDashboard from "./Pages/viewer/Viewerdashboard";
import ViewerDocuments from "./Pages/TenantAdmin/TADocuments";
import ViewerFolders from "./Pages/TenantAdmin/TAFolder";

// Auditor
import { AuditorLayout } from "./Pages/Auditor/Auditorlayout";
import AuditorDashboard from "./Pages/Auditor/Auditordashboard";
import AuditorDocuments from "./Pages/TenantAdmin/TADocuments";

// Approver
import { ApproverLayout } from "./Pages/Approver/Approverlayout";
import ApproverDashboard from "./Pages/Approver/Approverdashboard";
import ApproverApprovals from "./Pages/Approver/Approverapprovals";

// ─────────────────────────────────────────────
// PAGE MAPS
// ─────────────────────────────────────────────


const SUPER_ADMIN_PAGES = {
  dashboard: (nav) => <Dashboard onNavigate={nav} />,
  tenantsPaid: () => <PaidTenants />,
  tenantsFree: () => <FreeTenants />,
  tenants: () => <PaidTenants />,
  users: (nav) => <Allusers onNavigate={nav} />,
  odata: (nav) => <Odataplugins onNavigate={nav} />,
  audit: (nav) => <AuditList role="SuperAdmin" onNavigate={nav} />,
  settings: (nav) => <Systemsettings onNavigate={nav} />,
  billing: (nav) => <Billing onNavigate={nav} />,
  departments: (nav) => <DepartmentsPage onNavigate={nav} />,
  companyCodes: (nav) => <SACompanyCodes onNavigate={nav} />,
  plants: (nav) => <SAPlants onNavigate={nav} />,
  subscriptions: () => <SubscriptionsAdmin />,
  plans: () => <PlanCatalog />,
  ...buildAIAssistantPages("SuperAdmin"),
  // Communication module is intentionally NOT wired for SuperAdmin: the
  // feature is scoped to "employees of the same tenant" (project brief
  // §2/§9) and SuperAdmin isn't tenant staff — they manage tenants
  // globally and have no tenantId of their own.
};

const TENANT_ADMIN_PAGES = {
  dashboard: (nav) => <TADashboard onNavigate={nav} />,
  users: (nav) => <TAUsers onNavigate={nav} />,
  companyCodes: (nav) => <CompanyCodes onNavigate={nav} />,
  plants: (nav) => <Plants onNavigate={nav} />,
  folder: (nav) => <TAFolder onNavigate={nav} />,
  documents: (nav) => <TADocuments onNavigate={nav} />,
  workflow: (nav) => <TAWorkflow onNavigate={nav} />,
  crossDepartmentRequest: () => <CrossDepartmentAccessPage />,
  metadataTemplates: () => <MetadataTemplateManager />,
  audit: (nav) => <AuditList role="TenantAdmin" onNavigate={nav} />,
  approvals: (nav) => <TAApprovals onNavigate={nav} />,
  approvalWorkflows: (nav) => <ApprovalWorkflowList onNavigate={nav} />,
  workflowAssignment: (nav) => <WorkflowAssignmentPage onNavigate={nav} />,
  userAssignment: (nav) => <UserAssignmentPage onNavigate={nav} />,
  subscription: () => <SubscriptionPage />,
  // SAP Synchronization Module
  SAP_SYNC_DASHBOARD: (nav) => <SapSyncDashboard onNavigate={nav} />,
  SAP_SYNC_MASTERS: (nav) => <MasterSyncPage onNavigate={nav} />,
  SAP_SYNC_DOCUMENTS: (nav) => <DocumentSyncPage onNavigate={nav} />,
  SAP_SYNC_PENDING_CLASSIFICATION: (nav) => <PendingClassificationPage onNavigate={nav} />,
  SAP_SYNC_SCHEDULER: (nav) => <SchedulerPage onNavigate={nav} />,
  SAP_SYNC_JOB_HISTORY: (nav) => <JobHistoryPage onNavigate={nav} />,
  SAP_SYNC_LOG_VIEWER: (nav) => <LogViewerPage onNavigate={nav} />,
  SAP_SYNC_SETTINGS: (nav) => <SapSyncSettingsPage onNavigate={nav} />,
  ...buildAIAssistantPages("TenantAdmin"),
  ...buildCommunicationPages(),
};

const BRANCH_MANAGER_PAGES = {
  dashboard: (nav) => <BMDashboard onNavigate={nav} />,
  documents: (nav) => <BMDocuments onNavigate={nav} />,
  workflow: (nav) => <BMWorkflow onNavigate={nav} />,
  folders: (nav) => <BMFolders onNavigate={nav} />,
  approvals: (nav) => <BMApprovals onNavigate={nav} />,
    crossDepartmentRequest: () => <CrossDepartmentAccessPage />,

  ...buildAIAssistantPages("BranchManager"),
  ...buildCommunicationPages(),
};

const DEPT_HEAD_PAGES = {
  dashboard: (nav) => <DHDashboard onNavigate={nav} />,
  documents: (nav) => <DHDocuments onNavigate={nav} />,
  workflow: (nav) => <DHWorkflow onNavigate={nav} />,
  approvals: (nav) => <DHApprovals onNavigate={nav} />,
  folders: (nav) => <DHFolders onNavigate={nav} />,
    crossDepartmentRequest: () => <CrossDepartmentAccessPage />,
  crossDepartmentRequest: () => <CrossDepartmentAccessPage />,

  ...buildAIAssistantPages("DeptHead"),
  ...buildCommunicationPages(),
};

const MANAGER_PAGES = {
  dashboard: (nav) => <MGDashboard onNavigate={nav} />,
  newdoc: (nav) => <MGNewDoc onNavigate={nav} />,
  documents: (nav) => <MGDocuments onNavigate={nav} />,
  approvals: (nav) => <MGApprovals onNavigate={nav} />,
  folders: (nav) => <MGFolders onNavigate={nav} />,
  ...buildAIAssistantPages("Manager"),
  ...buildCommunicationPages(),
};

const UPLOADER_PAGES = {
  dashboard: (nav) => <UploaderDashboard onNavigate={nav} />,
  upload: (nav) => <TAWorkflow onNavigate={nav} />,
  documents: (nav) => <UploaderDocuments onNavigate={nav} />,
    crossDepartmentRequest: () => <CrossDepartmentAccessPage />,

  ...buildAIAssistantPages("Uploader"),
  ...buildCommunicationPages(),
};

const VIEWER_PAGES = {
  dashboard: (nav) => <ViewerDashboard onNavigate={nav} />,
  documents: () => <ViewerDocuments />,
  folders: () => <ViewerFolders />,
    crossDepartmentRequest: () => <CrossDepartmentAccessPage />,

  ...buildAIAssistantPages("Viewer"),
  ...buildCommunicationPages(),
};

const AUDITOR_PAGES = {
  dashboard: (nav) => <AuditorDashboard onNavigate={nav} />,
  documents: () => <AuditorDocuments />,
  auditlog: (nav) => <AuditList role="Auditor" onNavigate={nav} />,
    crossDepartmentRequest: () => <CrossDepartmentAccessPage />,

  ...buildAIAssistantPages("Auditor"),
  ...buildCommunicationPages(),
};

const APPROVER_PAGES = {
  dashboard: (nav) => <ApproverDashboard onNavigate={nav} />,
  approvals: () => <ApproverApprovals />,
  documents: (nav) => <TADocuments onNavigate={nav} />,
    crossDepartmentRequest: () => <CrossDepartmentAccessPage />,

  ...buildAIAssistantPages("Approver"),
  ...buildCommunicationPages(),
};

const PAGE_TITLES = {
  dashboard: "Dashboard",
    crossDepartmentRequest: "Request Document Access",
  users: "User Management",
  companyCodes: "Company Codes",
  plants: "Plants",
  folder: "Folder Structure",
  documents: "Documents",
  workflow: "DMS Workflow",
  audit: "Audit Log",
  approvals: "Approvals",
  tenantsPaid: "Paid Tenants",
  tenantsFree: "Free Tenants",
  tenants: "Paid Tenants",
  odata: "OData Plugins",
  settings: "System Settings",
  billing: "Billing",
  departments: "Department Master",
  subscriptions: "Subscriptions",
  plans: "Plan Catalog",
  newdoc: "New Document",
  folders: "Folders",
  auditlog: "Full Audit Log",
  approvalWorkflows: "Approval Workflows",
  workflowAssignment: "Workflow Assignment",
  userAssignment: "User Assignment",
  subscription: "Subscription & Billing",
  SAP_SYNC_DASHBOARD: "SAP Synchronization",
  SAP_SYNC_MASTERS: "Master Synchronization",
  SAP_SYNC_DOCUMENTS: "Document Synchronization",
  SAP_SYNC_PENDING_CLASSIFICATION: "Pending Classification",
  SAP_SYNC_SCHEDULER: "Scheduler Management",
  SAP_SYNC_JOB_HISTORY: "Job History",
  SAP_SYNC_LOG_VIEWER: "Log Viewer",
  SAP_SYNC_SETTINGS: "SAP Sync Settings",
  ...AI_PAGE_TITLES,
  ...COMMUNICATION_PAGE_TITLES,
};

// FREE tenants sirf dashboard + subscription (upgrade karne ke liye) page access
// kar sakte hain — baaki sab TENANT_ADMIN_PAGES premium hain.
const FREE_TENANT_ALLOWED_PAGES = new Set([
  "dashboard",
  "users",
  "userAssignment",
  "companyCodes",
  "plants",
  "folder",
  "documents",
  "workflow",
  "metadataTemplates",
  "subscription",
]);

// ── ERP / Non-ERP Tenant Classification ───────────────────────────────
// These page keys map 1:1 to routes gated server-side by requireSAP /
// requireErpTenant (see subscriptionMiddleware.js). A PAID+NON-ERP tenant
// can reach every other TENANT_ADMIN_PAGES route normally — only these are
// blocked, and only when erpEnabled is false. FREE tenants are already
// blocked from all of these via FREE_TENANT_ALLOWED_PAGES above, so this
// set is only ever consulted for PAID tenants.
const ERP_TENANT_PAGES = new Set([
  "SAP_SYNC_DASHBOARD",
  "SAP_SYNC_MASTERS",
  "SAP_SYNC_DOCUMENTS",
  "SAP_SYNC_PENDING_CLASSIFICATION",
  "SAP_SYNC_SCHEDULER",
  "SAP_SYNC_JOB_HISTORY",
  "SAP_SYNC_LOG_VIEWER",
  "SAP_SYNC_SETTINGS",
]);

function UpgradePrompt({ pageTitle, onGoToDashboard }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
        <span className="text-amber-500 text-2xl font-bold">*</span>
      </div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
        {pageTitle} is a premium feature
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">
        Your current plan only includes Dashboard access. Upgrade your subscription to unlock this
        and every other module.
      </p>
      <button
        onClick={onGoToDashboard}
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

// ── ERP / Non-ERP Tenant Classification ───────────────────────────────
// Shown instead of an ERP_TENANT_PAGES page for a PAID tenant whose
// SuperAdmin hasn't enabled ERP for it. Deliberately distinct copy from
// UpgradePrompt above — this tenant is already PAID, so "upgrade your
// plan" would be misleading; the real fix is a SuperAdmin action.
function ErpNotEnabledPrompt({ pageTitle, onGoToDashboard }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700/40 flex items-center justify-center mb-4">
        <span className="text-slate-400 text-2xl font-bold">⛔</span>
      </div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
        {pageTitle} requires ERP integration
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">
        ERP integration is not enabled for this tenant. Contact your SuperAdmin if you need SAP
        synchronization enabled for your organization.
      </p>
      <button
        onClick={onGoToDashboard}
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

// SubscriptionProvider ke andar (child ke roop mein) render hota hai isliye
// yeh useSubscription() call kar sakta hai — App() khud nahi kar sakta
// kyunki wahi provider ko mount kar raha hai.
function TenantAdminSection({
  activePage,
  setActivePage,
  user,
  setUser,
  showTCodeSearch,
  setShowTCodeSearch,
}) {
  const { isFree } = useSubscription();
  const { erpEnabled } = useTenantCapabilities();
  const locked = isFree && !FREE_TENANT_ALLOWED_PAGES.has(activePage);
  // ── ERP / Non-ERP Tenant Classification ─────────────────────────
  // Only relevant for PAID tenants — FREE tenants never reach here for
  // an ERP page since `locked` above already catches them first.
  const erpLocked = !isFree && !erpEnabled && ERP_TENANT_PAGES.has(activePage);

  return (
    <>
      <TenantLayout
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={() => doLogout(setUser)}
        title={PAGE_TITLES[activePage] || activePage}
        user={user}
        onTCodeSearch={() => setShowTCodeSearch(true)}
      >
        {locked ? (
          <UpgradePrompt
            pageTitle={PAGE_TITLES[activePage] || activePage}
            onGoToDashboard={() => setActivePage("dashboard")}
          />
        ) : erpLocked ? (
          <ErpNotEnabledPrompt
            pageTitle={PAGE_TITLES[activePage] || activePage}
            onGoToDashboard={() => setActivePage("dashboard")}
          />
        ) : (
          (TENANT_ADMIN_PAGES[activePage] ?? TENANT_ADMIN_PAGES.dashboard)(setActivePage)
        )}
      </TenantLayout>

      {showTCodeSearch && (
  <DocumentSearchModal
    onClose={() => setShowTCodeSearch(false)}
    onViewDoc={(doc, action) => console.log(action, doc)}
  />
)}
    </>
  );
}



const doLogout = (setUser) => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("subscriptionSnapshot");
  setUser(null);
};

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        email: payload.email,
        role: payload.role || "Viewer",
        name: payload.name || payload.email,
        tenantId: payload.tenantId || null,
      };
    } catch {
      return null;
    }
  });

  const [activePage, setActivePage] = useState("dashboard");
  const [showLanding, setShowLanding] = useState(true);
  const [showBookDemo, setShowBookDemo] = useState(false);

  const [landingPage, setLandingPage] = useState("home"); // ← ADD
  const [showTCodeSearch, setShowTCodeSearch] = useState(false);
  // "login" (PAID, existing) | "login-free" | "register-free" — which
  // pre-auth screen shows. Only reachable once showLanding is false.
  const [authScreen, setAuthScreen] = useState("login");
  const [showBookDemoFunnel, setShowBookDemoFunnel] = useState(false); // welcome→policies→eligibility
const [showBookDemoPage, setShowBookDemoPage] = useState(false);     // final Book Demo page
const [pendingBookDemo, setPendingBookDemo] = useState(false);       // true jab auth ke baad demo page pe jaana ho

  const handleAuthenticated = (u) => {
  setUser(u);
  setAuthScreen("login");
  if (pendingBookDemo) {
    setPendingBookDemo(false);
    setShowBookDemoPage(true);   // dashboard skip, seedha Book Demo page
  } else {
    setActivePage("dashboard");
  }
};

  // STEP 1 — Landing Page
if (showLanding && !user) {
  if (showBookDemoFunnel) {
    return (
      <BookDemoFlow
        onExit={() => setShowBookDemoFunnel(false)}
       onDone={() => {
  setShowBookDemoFunnel(false);
  if (user) {
    setShowBookDemoPage(true);       // already logged in — auth skip
  } else {
    setPendingBookDemo(true);
    setShowLanding(false);
    setAuthScreen("register-free");
  }
}}
      />
    );
  }
  if (showBookDemoPage) {
    return <BookDemo onBack={() => { setShowBookDemoPage(false); }} onStartFreeTrial={() => setShowBookDemoPage(false)} />;
  }
  return (
    <LandingRouter
      onGetStarted={() => setShowLanding(false)}
      onWatchDemo={() => setShowBookDemoFunnel(true)}
    />
  );
}


  // STEP 2 — Login Page (PAID existing / FREE login / FREE registration)
  if (!user) {
    if (authScreen === "register-free") {
      return <RegisterFree onLogin={handleAuthenticated} onBackToLogin={() => setAuthScreen("login")} />;
    }
    if (authScreen === "login-free") {
      return (
        <LoginFree
          onLogin={handleAuthenticated}
          onBackToLogin={() => setAuthScreen("login")}
          onGoToRegister={() => setAuthScreen("register-free")}
        />
      );
    }
    return (
      <Login
        onLogin={handleAuthenticated}
        onStartFreeTrial={() => setAuthScreen("register-free")}
        onFreeLogin={() => setAuthScreen("login-free")}
      />
    );
  }

  // STEP 3 — Role Based Dashboard
  return (
    <SubscriptionProvider>
    <MetadataProvider>
    <AIAssistantProvider>
    <ThemeProvider>
      {user.role === "SuperAdmin" && (
        <Layout
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={() => doLogout(setUser)}
          title={PAGE_TITLES[activePage] || activePage}
        >
          {(SUPER_ADMIN_PAGES[activePage] ?? SUPER_ADMIN_PAGES.dashboard)(
            setActivePage,
          )}
        </Layout>
      )}

 {user.role === "TenantAdmin" && (
  <TenantAdminSection
    activePage={activePage}
    setActivePage={setActivePage}
    user={user}
    setUser={setUser}
    showTCodeSearch={showTCodeSearch}
    setShowTCodeSearch={setShowTCodeSearch}
  />
)}

      {user.role === "BranchManager" && (
        <BMLayout
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={() => doLogout(setUser)}
          title={PAGE_TITLES[activePage] || activePage}
          user={user}
        >
          {(BRANCH_MANAGER_PAGES[activePage] ?? BRANCH_MANAGER_PAGES.dashboard)(
            setActivePage,
          )}
        </BMLayout>
      )}

      {user.role === "DeptHead" && (
        <DHLayout
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={() => doLogout(setUser)}
          title={PAGE_TITLES[activePage] || activePage}
          user={user}
        >
          {(DEPT_HEAD_PAGES[activePage] ?? DEPT_HEAD_PAGES.dashboard)(
            setActivePage,
          )}
        </DHLayout>
      )}

      {user.role === "Manager" && (
        <MGLayout
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={() => doLogout(setUser)}
          title={PAGE_TITLES[activePage] || activePage}
          user={user}
        >
          {(MANAGER_PAGES[activePage] ?? MANAGER_PAGES.dashboard)(
            setActivePage,
          )}
        </MGLayout>
      )}

      {user.role === "Uploader" && (
        <UploaderLayout
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={() => doLogout(setUser)}
          title={PAGE_TITLES[activePage] || activePage}
          user={user}
        >
          {(UPLOADER_PAGES[activePage] ?? UPLOADER_PAGES.dashboard)(
            setActivePage,
          )}
        </UploaderLayout>
      )}

      {user.role === "Viewer" && (
        <ViewerLayout
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={() => doLogout(setUser)}
          title={PAGE_TITLES[activePage] || activePage}
          user={user}
        >
          {(VIEWER_PAGES[activePage] ?? VIEWER_PAGES.dashboard)(setActivePage)}
        </ViewerLayout>
      )}

      {user.role === "Auditor" && (
        <AuditorLayout
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={() => doLogout(setUser)}
          title={PAGE_TITLES[activePage] || activePage}
          user={user}
        >
          {(AUDITOR_PAGES[activePage] ?? AUDITOR_PAGES.dashboard)(
            setActivePage,
          )}
        </AuditorLayout>
      )}

      {user.role === "Approver" && (
        <ApproverLayout
          activePage={activePage}
          onNavigate={setActivePage}
          onLogout={() => doLogout(setUser)}
          title={PAGE_TITLES[activePage] || activePage}
          user={user}
        >
          {(APPROVER_PAGES[activePage] ?? APPROVER_PAGES.dashboard)(
            setActivePage,
          )}
        </ApproverLayout>
      )}
    </ThemeProvider>
    </AIAssistantProvider>
    </MetadataProvider>
    </SubscriptionProvider>
  );
}
