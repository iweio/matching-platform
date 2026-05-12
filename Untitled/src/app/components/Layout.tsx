import { Outlet, useLocation, useNavigate } from "react-router";
import { Heart, MessageCircle, User } from "lucide-react";

const tabs = [
  {
    path: "/match",
    label: "匹配",
    Icon: Heart,
    matchPaths: ["/match", "/matching", "/report", "/unlock"],
  },
  {
    path: "/chat",
    label: "聊天",
    Icon: MessageCircle,
    matchPaths: ["/chat"],
  },
  {
    path: "/profile",
    label: "我的",
    Icon: User,
    matchPaths: ["/profile", "/settings"],
  },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (paths: string[]) => paths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <nav className="bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center h-16 px-2">
          {tabs.map(({ path, label, Icon, matchPaths }) => {
            const active = isActive(matchPaths);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors ${
                  active
                    ? "text-purple-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-purple-600 rounded-full" />
                )}
                <Icon
                  className={`w-6 h-6 transition-all duration-200 ${
                    active ? "fill-purple-100" : ""
                  }`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span className="text-[11px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
