import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Heart, Lock, Unlock, Loader2 } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {waiting ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-6 animate-pulse">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">等待对方确认</h2>
              <p className="text-gray-500 mb-8">你已同意解锁，正在等待对方确认...</p>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" /><span>请稍候</span>
              </div>
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">你的选择</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">已同意</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">对方选择</span>
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">{theirs === "agree" ? "已同意" : "等待中"}</span>
                </div>
              </div>
            </div>
          ) : bothAgreed ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"><Unlock className="w-10 h-10 text-green-600" /></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">解锁成功！</h2>
              <p className="text-gray-500 mb-8">双方都已同意，现在可以开始真人聊天了</p>
              <div className="mb-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">你</div>
                  <Heart className="w-8 h-8 text-pink-500" />
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">TA</div>
                </div>
                <p className="text-sm text-gray-600">现在你们可以查看对方的真实资料，开始真人对话了</p>
              </div>
              <button onClick={handleContinue} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all">开始聊天</button>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6"><Lock className="w-10 h-10 text-red-600" /></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">匹配已终止</h2>
              <p className="text-gray-500 mb-8">对方拒绝了解锁，本次匹配已结束</p>
              <button onClick={() => navigate("/match")} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all">返回匹配</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
