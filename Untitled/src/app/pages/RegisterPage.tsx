import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { api } from "../api";

export function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    nick: "",
    password: "",
    gender: "",
    age: "",
  });

  const handleSubmit = async () => {
    if (!formData.phone || !formData.nick || !formData.password || !formData.gender || !formData.age) {
      alert("请填写完整信息");
      return;
    }
    if (formData.nick.length < 2) { alert("昵称至少2个字符"); return; }
    if (formData.password.length < 6) { alert("密码至少6位"); return; }
    setLoading(true);
    try {
      const data = await api.register({
        phone: formData.phone,
        nick: formData.nick,
        password: formData.password,
        gender: Number(formData.gender),
        age: Number(formData.age),
      });
      sessionStorage.setItem("user_id", data.userId);
      sessionStorage.setItem("agent_id", data.agentId);
      sessionStorage.setItem("auth_token", data.token);
      navigate("/distill");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "请稍后重试";
      alert("注册失败: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">注册</h2>
            <p className="text-gray-500 mt-2">创建账号，生成专属智能体</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
              <input type="tel" placeholder="请输入手机号" maxLength={11} value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
              <input type="text" placeholder="请输入昵称（2-10个字符）" maxLength={10} value={formData.nick}
                onChange={(e) => setFormData({ ...formData, nick: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} placeholder="请输入密码（至少6位）" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="gender" value="1" checked={formData.gender === "1"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="peer sr-only" />
                  <div className="p-3 text-center border-2 border-gray-300 rounded-lg peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-blue-400 transition-colors">男</div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="gender" value="0" checked={formData.gender === "0"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="peer sr-only" />
                  <div className="p-3 text-center border-2 border-gray-300 rounded-lg peer-checked:border-pink-500 peer-checked:bg-pink-50 hover:border-pink-400 transition-colors">女</div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">年龄</label>
              <input type="number" placeholder="请输入年龄" min={18} max={100} value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? "创建中..." : "注册并创建智能体"}
            </button>

            <p className="text-center text-sm text-gray-500">
              已有账号？{" "}
              <Link to="/login" className="text-purple-600 hover:text-purple-700">去登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
