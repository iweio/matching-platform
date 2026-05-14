import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Heart, Lock, Unlock, Loader2, User } from "lucide-react";
import { api } from "../api";
import { getUserId } from "../storage";

export function UnlockPage() {
  const navigate = useNavigate();
  const uid = getUserId();
  const matchId = sessionStorage.getItem("match_id") || "";
  const [waiting, setWaiting] = useState(true);
  const [bothAgreed, setBothAgreed] = useState(false);
  const [mine, setMine] = useState("");
  const [theirs, setTheirs] = useState("");

  useEffect(() => {
    if (!uid || !matchId) { navigate("/match", { replace: true }); return; }

    let stop = false;
    const poll = async () => {
      if (stop) return;
      try {
        const r = await api.getProgress(matchId, uid);
        const a = (r as any).a_op || "";
        const b = (r as any).b_op || "";
        const unlocked = (r as any).unlock_flag === 1;
        setMine(a);
        setTheirs(b);
        if (unlocked || (a === "agree" && b === "agree")) {
          setWaiting(false);
          setBothAgreed(true);
          return;
        }
        if ((a === "reject" && b !== "") || (b === "reject" && a !== "")) {
          setWaiting(false);
          setBothAgreed(false);
          return;
        }
      } catch { /* ignore */ }
      if (!stop) setTimeout(poll, 2000);
    };

    poll();
    return () => { stop = true; };
  }, []);

  const handleContinue = () => navigate("/chat");

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-10 w-36 h-36 bg-pink-200/20 rounded-full blur-3xl animate-float-left pointer-events-none" />
      <div className="absolute bottom-1/3 right-10 w-44 h-44 bg-purple-200/20 rounded-full blur-3xl animate-float-right pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-purple-100/50 p-8 border border-white/50">

          {waiting ? (
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl animate-pulse" />
                <Lock className="w-12 h-12 text-white relative z-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">等待对方确认</h2>
              <p className="text-gray-500 text-sm mb-8">你已同意解锁，正在等待对方回应...</p>

              <div className="flex items-center justify-center gap-2 text-purple-600 mb-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">每2秒自动检查对方状态</span>
              </div>

              {/* Dual status cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-xs text-green-600 font-medium">你的选择</div>
                  <div className="text-sm font-bold text-green-700 mt-1">已同意</div>
                </div>
                <div className={`rounded-xl p-4 text-center border ${theirs === "agree" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${theirs === "agree" ? "bg-green-100" : "bg-gray-200"}`}>
                    <User className={`w-5 h-5 ${theirs === "agree" ? "text-green-600" : "text-gray-400"}`} />
                  </div>
                  <div className={`text-xs font-medium ${theirs === "agree" ? "text-green-600" : "text-gray-500"}`}>对方选择</div>
                  <div className={`text-sm font-bold mt-1 ${theirs === "agree" ? "text-green-700" : "text-gray-400"}`}>
                    {theirs === "agree" ? "已同意" : "等待中"}
                  </div>
                </div>
              </div>
            </div>
          ) : bothAgreed ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-2xl mb-6 shadow-lg shadow-green-100">
                <Unlock className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">解锁成功！</h2>
              <p className="text-gray-500 text-sm mb-8">双方都已同意，现在可以开始真人聊天了</p>

              <div className="mb-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-purple-100">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">你</div>
                  <div className="flex items-center gap-0">
                    {[0, 1, 2].map((i) => (
                      <Heart key={i} className="w-4 h-4 text-pink-400" fill="#f9a8d4" />
                    ))}
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-pink-200">TA</div>
                </div>
                <p className="text-sm text-gray-600">现在你们可以查看对方的真实资料，开始真人对话了</p>
              </div>

              <button onClick={handleContinue}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-[0.98]">
                开始聊天
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-2xl mb-6 shadow-lg shadow-red-100">
                <Lock className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">匹配已终止</h2>
              <p className="text-gray-500 text-sm mb-8">对方拒绝了本次匹配，缘分未到，继续寻找吧</p>
              <button onClick={() => navigate("/match")}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-[0.98]">
                返回匹配
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
