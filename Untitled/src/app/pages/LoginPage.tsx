import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, ArrowLeft, Eye, EyeOff } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"><ArrowLeft className="w-4 h-4" />返回首页</Link>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4"><Heart className="w-8 h-8 text-white" /></div>
            <h2 className="text-2xl font-bold text-gray-900">登录</h2>
            <p className="text-gray-500 mt-2">欢迎回来，开启你的智能婚恋之旅</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
              <input type="tel" placeholder="请输入手机号" maxLength={11} value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? "登录中..." : "登录"}
            </button>
            <p className="text-center text-sm text-gray-500">
              还没有账号？{" "}
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-medium">立即注册</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
