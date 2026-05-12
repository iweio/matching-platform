import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sparkles, Check } from "lucide-react";
import { getUserId } from "../storage";

export function DistillResultPage() {
  const navigate = useNavigate();
  const uid = getUserId();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"processing" | "completed">("processing");

  useEffect(() => {
    if (!uid) { navigate("/login", { replace: true }); return; }
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    let p = 0;
    interval = setInterval(() => {
      p += 10;
      if (p >= 100) {
        clearInterval(interval!);
        interval = null;
        if (!cancelled) {
          setProgress(100);
          setStatus("completed");
        }
      } else {
        if (!cancelled) setProgress(p);
      }
    }, 400);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [uid, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">

          {status === "processing" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-6 animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">人格蒸馏中...</h2>
              <p className="text-gray-500 mb-8">正在生成你的专属智能体，请稍候</p>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="h-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-sm text-gray-500">{progress}%</div>
              <div className="mt-8 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-gray-600"><Check className="w-5 h-5 text-green-500" />分析说话风格...</div>
                <div className="flex items-center gap-3 text-sm text-gray-600"><Check className="w-5 h-5 text-green-500" />提取性格特征...</div>
                <div className={`flex items-center gap-3 text-sm ${progress >= 60 ? "text-gray-600" : "text-gray-400"}`}>
                  {progress >= 60 ? <Check className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full animate-spin border-t-purple-600" />}
                  构建婚恋模型...
                </div>
                <div className={`flex items-center gap-3 text-sm ${progress >= 90 ? "text-gray-600" : "text-gray-400"}`}>
                  {progress >= 90 ? <Check className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />}
                  生成智能体...
                </div>
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"><Check className="w-10 h-10 text-green-600" /></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">蒸馏完成！</h2>
              <p className="text-gray-500 mb-8">你的专属智能体已经生成，现在可以开始匹配了</p>
              <button onClick={() => navigate("/match")} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all">开始匹配</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
