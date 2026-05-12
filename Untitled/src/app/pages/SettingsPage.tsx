import { Link, useNavigate } from "react-router";
import { ArrowLeft, User, Bell, Lock, Info, LogOut } from "lucide-react";
import { clearSession } from "../storage";

export function SettingsPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/", { replace: true });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回个人中心
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">设置</h2>

          <div className="space-y-2">
            <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">账号信息</div>
                <div className="text-sm text-gray-500">修改昵称、头像等</div>
              </div>
            </button>

            <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">通知设置</div>
                <div className="text-sm text-gray-500">管理消息提醒</div>
              </div>
            </button>

            <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">隐私设置</div>
                <div className="text-sm text-gray-500">管理隐私和安全</div>
              </div>
            </button>

            <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">关于我们</div>
                <div className="text-sm text-gray-500">版本 1.0.0</div>
              </div>
            </button>

            <div className="border-t border-gray-200 my-4" />

            <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 hover:bg-red-50 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-red-600">退出登录</div>
              </div>
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">使用提示</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 一人只能拥有一个智能体</li>
              <li>• 同一时间只能进行一个匹配</li>
              <li>• 必须完成人格蒸馏才能发起匹配</li>
              <li>• 双方都同意才能解锁真人聊天</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
