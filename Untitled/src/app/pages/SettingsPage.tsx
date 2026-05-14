import { Link, useNavigate } from "react-router";
import { ArrowLeft, User, Bell, Lock, Info, LogOut, ChevronRight, Shield, Smartphone, HelpCircle } from "lucide-react";
import { clearSession } from "../storage";

const menuItems = [
  { icon: User, color: "from-blue-400 to-blue-600", bg: "bg-blue-100", text: "text-blue-600", label: "账号信息", desc: "修改昵称、头像等" },
  { icon: Bell, color: "from-green-400 to-green-600", bg: "bg-green-100", text: "text-green-600", label: "通知设置", desc: "管理消息提醒" },
  { icon: Lock, color: "from-purple-400 to-purple-600", bg: "bg-purple-100", text: "text-purple-600", label: "隐私设置", desc: "管理隐私和安全" },
  { icon: Info, color: "from-gray-400 to-gray-600", bg: "bg-gray-100", text: "text-gray-600", label: "关于我们", desc: "版本 1.0.0" },
];

export function SettingsPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4 relative overflow-hidden">
      <div className="absolute top-24 right-10 w-40 h-40 bg-pink-200/20 rounded-full blur-3xl animate-float-left pointer-events-none" />
      <div className="absolute bottom-32 left-10 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl animate-float-right pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <Link to="/profile" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />返回个人中心
        </Link>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-purple-100/50 p-8 border border-white/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">设置</h2>
          </div>

          <div className="space-y-1.5">
            {menuItems.map(({ icon: Icon, color, bg, text, label, desc }) => (
              <button key={label} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 text-left group active:scale-[0.99]">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-500">{desc}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </button>
            ))}

            <div className="border-t border-gray-100 my-3" />

            <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 hover:bg-red-50 rounded-xl transition-all duration-200 text-left group active:scale-[0.99]">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <LogOut className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-red-600">退出登录</div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-300 group-hover:text-red-500 transition-colors" />
            </button>
          </div>

          <div className="mt-8 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">使用提示</h3>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />一人只能拥有一个智能体</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />同一时间只能进行一个匹配</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />必须完成人格蒸馏才能发起匹配</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />双方都同意才能解锁真人聊天</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Smartphone className="w-3 h-3" />
            <span>智能婚恋平台 v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
