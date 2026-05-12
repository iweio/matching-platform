import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { User, Heart, CheckCircle, TrendingUp, Settings, RefreshCw, LogOut } from "lucide-react";
import { api } from "../api";
import { getUserId, clearSession } from "../storage";

export function ProfilePage() {
  const navigate = useNavigate();
  const uid = getUserId();
  const [user, setUser] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!uid) { navigate("/login", { replace: true }); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setLoadError(true);
    }, 10000);

    api.getUser(uid)
      .then((u) => { if (!cancelled) { setUser(u); setLoadError(false); } })
      .catch(() => { if (!cancelled) setLoadError(true); });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [uid, navigate]);

  const handleRetry = () => {
    setLoadError(false);
    api.getUser(uid).then(setUser).catch(() => setLoadError(true));
  };

  const handleReLogin = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  if (loadError) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
        <p className="text-sm text-gray-500 mb-6">无法加载用户数据，请检查网络后重试，或重新登录</p>
        <div className="flex gap-3 justify-center">
          <button onClick={handleRetry} className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">重试</button>
          <button onClick={handleReLogin} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <LogOut className="w-4 h-4" />重新登录
          </button>
        </div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">加载中...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{user.nick || "未命名"}</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{user.gender === 1 ? "男" : "女"}</span>
                <span className="text-gray-500">{user.age || "-"}岁</span>
              </div>
              <div className="text-sm text-gray-500 mb-4">用户 ID: {user.user_id}</div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${user.distill_status === 1 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {user.distill_status === 1 ? "已完成蒸馏" : "未完成蒸馏"}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">智能体: {user.agent_id || "-"}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/settings" className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Settings className="w-6 h-6" /></Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 text-center">
              <Heart className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-pink-600 mb-1">-</div>
              <div className="text-sm text-gray-600">匹配次数</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-600 mb-1">-</div>
              <div className="text-sm text-gray-600">解锁次数</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-purple-600 mb-1">-</div>
              <div className="text-sm text-gray-600">成功率</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">匹配记录</h3>
          <div className="text-center py-12 text-gray-500">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无匹配记录</p>
          </div>
          <div className="mt-8 flex gap-4">
            <Link to="/match" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold text-center hover:shadow-lg transition-all">开始新匹配</Link>
            <Link to="/distill" className="flex-1 border-2 border-purple-600 text-purple-600 py-3 rounded-lg font-semibold text-center hover:bg-purple-50 transition-all">重新蒸馏</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
