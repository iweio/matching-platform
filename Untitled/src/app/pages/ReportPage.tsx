import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Heart, AlertCircle, Lightbulb, ThumbsUp, X, Loader2 } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { api } from "../api";
import { getUserId } from "../storage";

export function ReportPage() {
  const navigate = useNavigate();
  const uid = getUserId();
  const matchId = sessionStorage.getItem("match_id") || "";
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "rejected" | "unlocked" } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolvedRef = useRef(false);

  const clearAndRedirect = useCallback((path: string) => {
    sessionStorage.removeItem("match_id");
    navigate(path, { replace: true });
  }, [navigate]);

  // Real-time polling: detect partner's action
  useEffect(() => {
    if (!matchId || !uid) return;

    const poll = async () => {
      if (resolvedRef.current) return;
      try {
        const progress: any = await api.getProgress(matchId, uid);
        const status = progress?.status;
        const myOp = progress?.my_op;

        // Partner rejected → notify and redirect
        if (status === 4) {
          resolvedRef.current = true;
          setShowActions(false);
          setToast({ msg: "对方已拒绝匹配", type: "rejected" });
          setTimeout(() => clearAndRedirect("/match"), 2000);
          return;
        }

        // Both agreed → redirect to unlock
        if (status === 5) {
          resolvedRef.current = true;
          setShowActions(false);
          setToast({ msg: "双方已解锁，正在跳转…", type: "unlocked" });
          setTimeout(() => clearAndRedirect("/unlock"), 1500);
          return;
        }

        // Update button visibility based on current state
        if (status === 2 || status === 3) {
          setShowActions(!myOp || myOp === "");
        } else {
          setShowActions(false);
        }
      } catch {}
    };

    poll(); // immediate first poll
    pollingRef.current = setInterval(poll, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [matchId, uid, clearAndRedirect]);

  useEffect(() => {
    if (!uid || !matchId) { navigate("/match", { replace: true }); return; }
    api.getReport(matchId, uid)
      .then(setReport)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "加载报告失败"))
      .finally(() => setLoading(false));
  }, [uid, matchId, navigate]);

  const score = report?.score || 0;
  const levelLabels = ["较差", "一般", "良好", "优秀"];
  const levelIdx = score >= 85 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  const levelColors = ["text-gray-500","text-blue-600","text-purple-600","text-green-600"];
  const levelBg = ["bg-gray-100","bg-blue-100","bg-purple-100","bg-green-100"];
  const radarData = report?.dimensions || [];

  const handleAgree = async () => {
    try {
      const res: any = await api.unlock(matchId, uid, "agree");
      // bothAgreed=true means both agreed, redirect to unlock
      if (res?.bothAgreed) {
        sessionStorage.removeItem("match_id");
        navigate("/unlock", { replace: true });
      } else {
        // Waiting for partner — hide buttons, keep polling
        setShowActions(false);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "操作失败";
      alert("操作失败: " + msg);
    }
  };

  const handleReject = async () => {
    try {
      await api.unlock(matchId, uid, "reject");
      sessionStorage.removeItem("match_id");
      navigate("/match", { replace: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "操作失败";
      alert("操作失败: " + msg);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => navigate("/match")} className="text-purple-600 hover:underline">返回匹配</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">适配报告</h2>
            <p className="text-gray-500">匹配 ID: {matchId}</p>
          </div>

          <div className="text-center mb-12">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${levelBg[levelIdx]} mb-4`}>
              <div className={`text-6xl font-bold ${levelColors[levelIdx]}`}>{score}</div>
            </div>
            <div className={`text-2xl font-semibold mb-2 ${levelColors[levelIdx]}`}>匹配等级：{levelLabels[levelIdx]}</div>
            <p className="text-gray-600">{score >= 85 ? "你们的适配度很高！" : score >= 70 ? "还不错，可以试试。" : "匹配度一般，请谨慎考虑。"}</p>
          </div>

          {radarData.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">五维适配分析</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 14 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar name="适配度" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                {radarData.map((item: any) => (
                  <div key={item.name} className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{item.score}</div>
                    <div className="text-sm text-gray-600">{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6 mb-8">
            {report?.advantage && (
              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <ThumbsUp className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-2">优势分析</h4>
                    <p className="text-green-800 leading-relaxed">{report.advantage}</p>
                  </div>
                </div>
              </div>
            )}
            {report?.risk && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">风险提示</h4>
                    <p className="text-amber-800 leading-relaxed">{report.risk}</p>
                  </div>
                </div>
              </div>
            )}
            {report?.suggest && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">婚恋建议</h4>
                    <p className="text-blue-800 leading-relaxed">{report.suggest}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showActions && (
            <div className="flex gap-4">
              <button onClick={handleReject} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                <X className="w-5 h-5" />拒绝匹配
              </button>
              <button onClick={handleAgree} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-lg transition-all">
                <Heart className="w-5 h-5" />同意解锁
              </button>
            </div>
          )}
          {!showActions && (
            <div className="text-center">
              <button onClick={() => navigate("/match")} className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                返回匹配
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast overlay for real-time partner action */}
      {toast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => {}}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center animate-in fade-in zoom-in">
            {toast.type === "rejected" ? (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">匹配已结束</h3>
                <p className="text-gray-500 mb-1">{toast.msg}</p>
                <p className="text-sm text-gray-400">即将自动返回匹配页…</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">解锁成功</h3>
                <p className="text-gray-500 mb-1">{toast.msg}</p>
                <p className="text-sm text-gray-400">即将自动跳转…</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
