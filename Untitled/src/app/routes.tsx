import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DistillPage } from "./pages/DistillPage";
import { DistillResultPage } from "./pages/DistillResultPage";
import { MatchPage } from "./pages/MatchPage";
import { MatchingPage } from "./pages/MatchingPage";
import { ReportPage } from "./pages/ReportPage";
import { UnlockPage } from "./pages/UnlockPage";
import { ChatPage } from "./pages/ChatPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      { path: "/", Component: HomePage },
      { path: "/login", Component: LoginPage },
      { path: "/register", Component: RegisterPage },
      { path: "/distill", Component: DistillPage },
      { path: "/distill-result", Component: DistillResultPage },
      { path: "/match", Component: MatchPage },
      { path: "/matching", Component: MatchingPage },
      { path: "/report", Component: ReportPage },
      { path: "/unlock", Component: UnlockPage },
      { path: "/chat", Component: ChatPage },
      { path: "/profile", Component: ProfilePage },
      { path: "/settings", Component: SettingsPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
