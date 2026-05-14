import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, ArrowLeft, Eye, EyeOff, Phone, User, Calendar } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-36 h-36 bg-pink-200/30 rounded-full blur-3xl animate-float-left pointer-events-none" />
      <div className="absolute bottom-32 left-10 w-44 h-44 bg-purple-200/30 rounded-full blur-3xl animate-float-right pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />返回首页
        </Link>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-purple-100/50 p-8 border border-white/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-5 shadow-lg shadow-purple-200">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">创建账号</h2>
            <p className="text-gray-500 text-sm">生成属于你的专属智能体</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" placeholder="请输入手机号" maxLength={11} value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">昵称</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="请输入昵称（2-10个字符）" maxLength={10} value={formData.nick}
                  onChange={(e) => setFormData({ ...formData, nick: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} placeholder="请输入密码（至少6位）" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white outline-none transition-all" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">性别</label>
              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="gender" value="1" checked={formData.gender === "1"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="peer sr-only" />
                  <div className="p-3.5 text-center border-2 border-gray-200 rounded-xl peer-checked:border-blue-400 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-blue-300 transition-all font-medium">♂ 男</div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="gender" value="0" checked={formData.gender === "0"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="peer sr-only" />
                  <div className="p-3.5 text-center border-2 border-gray-200 rounded-xl peer-checked:border-pink-400 peer-checked:bg-pink-50 peer-checked:text-pink-700 hover:border-pink-300 transition-all font-medium">♀ 女</div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">年龄</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" placeholder="请输入年龄" min={18} max={100} value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white outline-none transition-all" />
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50 active:scale-[0.98]">
              {loading ? "创建中..." : "注册并创建智能体"}
            </button>

            <p className="text-center text-sm text-gray-500 pt-2">
              已有账号？{" "}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">去登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
