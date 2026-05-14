import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, ArrowLeft, Eye, EyeOff, Phone } from "lucide-react";
import { api } from "../api";
import { getUserId } from "../storage";

export function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const uid = getUserId();
    if (uid) navigate("/match", { replace: true });
  }, [navigate]);

  const handleLogin = async () => {
    if (!phone || phone.length !== 11) { alert("请输入正确的11位手机号"); return; }
    if (!password || password.length < 6) { alert("密码至少6位"); return; }
    setLoading(true);
    try {
      const data = await api.login({ phone, password });
      sessionStorage.setItem("user_id", data.userId);
      sessionStorage.setItem("agent_id", data.agentId);
      sessionStorage.setItem("auth_token", data.token);
      if (data.distillStatus === 1) {
        navigate("/match");
      } else {
        navigate("/distill");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "登录失败";
      alert("登录失败: " + msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative floating shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-200/30 rounded-full blur-3xl animate-float-left pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200/30 rounded-full blur-3xl animate-float-right pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />返回首页
        </Link>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-purple-100/50 p-8 border border-white/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-5 shadow-lg shadow-purple-200">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">欢迎回来</h2>
            <p className="text-gray-500 text-sm">开启你的智能婚恋之旅</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" placeholder="请输入手机号" maxLength={11} value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} placeholder="请输入密码" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white outline-none transition-all" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50 active:scale-[0.98]">
              {loading ? "登录中..." : "登录"}
            </button>

            <p className="text-center text-sm text-gray-500 pt-2">
              还没有账号？{" "}
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-medium">立即注册</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
