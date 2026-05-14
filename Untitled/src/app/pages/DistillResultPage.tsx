import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sparkles, Check, Loader2, Brain, MessageCircle, Heart } from "lucide-react";
import { api } from "../api";
import { getUserId } from "../storage";

const STATUS_TIPS = [
  "正在分析你的说话风格...",
  "正在提取性格特征图谱...",
  "正在构建婚恋价值观模型...",
  "正在生成禁忌冲突检测矩阵...",
  "正在编译专属智能体人格...",
  "即将完成数字分身创建...",
];

export function DistillResultPage() {
  const navigate = useNavigate();
  const uid = getUserId();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"processing" | "completed">("processing");
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!uid) { navigate("/login", { replace: true }); return; }

    // Call actual distill API to trigger model refresh
    const speak = sessionStorage.getItem("distill_speak") || "";
    const char = sessionStorage.getItem("distill_char") || "";
    const love = sessionStorage.getItem("distill_love") || "";
    const valuesStr = sessionStorage.getItem("distill_values") || "{}";
    const tabooStr = sessionStorage.getItem("distill_taboo") || "{}";

    let valuesView: any = {};
    let taboo: any = {};
    try { valuesView = JSON.parse(valuesStr); } catch {}
    try { taboo = JSON.parse(tabooStr); } catch {}

    api.distill({
      speak_style: speak,
      character: char,
      love_style: love,
      values_view: valuesView,
      taboo,
    }).catch(() => {});

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    let p = 0;
    interval = setInterval(() => {
      p += Math.random() * 8 + 4;
      if (p >= 100) {
        clearInterval(interval!);
        interval = null;
        if (!cancelled) {
          setProgress(100);
          setStatus("completed");
        }
      } else {
        if (!cancelled) setProgress(Math.min(p, 99));
      }
    }, 400);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [uid, navigate]);

  // Rotate status tips
  useEffect(() => {
    if (status !== "processing") return;
    const timer = setInterval(() => {
      setTipIndex((i) => (i + 1) % STATUS_TIPS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-pink-200/20 rounded-full blur-3xl animate-float-left pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl animate-float-right pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-purple-100/50 p-8 border border-white/50">

          {status === "processing" && (
            <div className="text-center">
              {/* Animated brain icon */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl animate-ping opacity-30" />
                <Brain className="w-12 h-12 text-white relative z-10" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">人格蒸馏中...</h2>
              <p className="text-gray-500 text-sm mb-6">正在生成属于你的专属智能体</p>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm font-medium text-purple-600 mb-8 tabular-nums">{Math.round(progress)}%</div>

              {/* Rotating tip */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8 min-h-[24px] transition-opacity duration-500">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
                <span>{STATUS_TIPS[tipIndex]}</span>
              </div>

              {/* Step checkpoints */}
              <div className="space-y-2.5 text-left">
                {[
                  { label: "分析说话风格与性格特征", done: progress >= 20, icon: MessageCircle },
                  { label: "构建婚恋三观模型", done: progress >= 50, icon: Heart },
                  { label: "生成禁忌检测矩阵", done: progress >= 75, icon: Sparkles },
                  { label: "编译专属智能体人格", done: progress >= 95, icon: Brain },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${item.done ? "bg-green-50" : "bg-gray-50"}`}>
                    {item.done ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : progress >= (i * 25) ? (
                      <div className="w-5 h-5 border-2 border-purple-400 rounded-full animate-spin border-t-transparent flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-200 rounded-full flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-4 h-4 ${item.done ? "text-green-500" : "text-gray-400"}`} />
                      <span className={`text-sm ${item.done ? "text-green-700 font-medium" : "text-gray-500"}`}>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-2xl mb-6 shadow-lg shadow-green-100">
                <Check className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">蒸馏完成！</h2>
              <p className="text-gray-500 mb-8">你的专属智能体已经生成，现在可以开始匹配了</p>
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="h-px w-12 bg-purple-200" />
                <Heart className="w-6 h-6 text-pink-400" />
                <div className="h-px w-12 bg-purple-200" />
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <button onClick={() => navigate("/match")}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-[0.98]">
                开始匹配
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
