import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { User, Heart, CheckCircle, TrendingUp, Settings, RefreshCw, LogOut, ChevronRight, X, AlertCircle, Lightbulb, ThumbsUp, Loader2, Sparkles, Brain, Target, Shield, Zap } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { api } from "../api";
import { getUserId, clearSession } from "../storage";

interface HistoryItem {
  match_id: string;
  partner_id: string;
  partner_nick: string;
  status: number;
  a_op: string;
  b_op: string;
  unlock_flag: number;
  chat_round: number;
  create_time: string;
  score: number;
  advantage: string;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const uid = getUserId();
  const [user, setUser] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [reportModal, setReportModal] = useState<{ open: boolean; matchId: string; partnerNick: string } | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!uid) { navigate("/login", { replace: true }); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setLoadError(true);
    }, 10000);

    api.getUser(uid)
      .then((u) => { if (!cancelled) { setUser(u); setLoadError(false); } })
      .catch(() => { if (!cancelled) setLoadError(true); });

    api.getHistory(uid)
      .then((h) => { if (!cancelled) setHistory(Array.isArray(h) ? h : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setHistoryLoading(false); });

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

  const handleViewReport = async (item: HistoryItem) => {
    setReportModal({ open: true, matchId: item.match_id, partnerNick: item.partner_nick || `用户 ${item.partner_id?.slice(-6) || ""}` });
    setReportData(null);
    setReportLoading(true);
    try {
      const r = await api.getReport(item.match_id, uid);
      setReportData(r);
    } catch {
      setReportData(null);
    } finally {
      setReportLoading(false);
    }
  };

  const closeReport = () => {
    setReportModal(null);
    setReportData(null);
  };

  const matchCount = history.length;
  const unlockCount = history.filter(h => h.unlock_flag === 1).length;
  const successRate = matchCount > 0 ? Math.round((unlockCount / matchCount) * 100) : 0;

  const statusLabels: Record<number, string> = { 0: "匹配中", 1: "聊天中", 2: "报告已生成", 3: "报告已生成", 4: "已拒绝", 5: "已解锁" };
  const statusColors: Record<number, string> = {
    0: "bg-yellow-100 text-yellow-700", 1: "bg-blue-100 text-blue-700",
    2: "bg-purple-100 text-purple-700", 3: "bg-purple-100 text-purple-700",
    4: "bg-red-100 text-red-700", 5: "bg-green-100 text-green-700",
  };

  const score = reportData?.score || 0;
  const levelLabels = ["较差", "一般", "良好", "优秀"];
  const levelIdx = score >= 85 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  const levelColors = ["text-gray-500","text-blue-600","text-purple-600","text-green-600"];
  const levelBg = ["bg-gray-100","bg-blue-100","bg-purple-100","bg-green-100"];
  const radarData = reportData?.dimensions || [];

  if (loadError) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-100">
          <RefreshCw className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
        <p className="text-sm text-gray-500 mb-6">无法加载用户数据，请检查网络后重试，或重新登录</p>
        <div className="flex gap-3 justify-center">
          <button onClick={handleRetry} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 hover:shadow-lg transition-all active:scale-[0.98]">重试</button>
          <button onClick={handleReLogin} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center gap-2">
            <LogOut className="w-4 h-4" />重新登录
          </button>
        </div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-3 border-pink-300 border-b-transparent rounded-full animate-spin [animation-duration:2s]" />
        </div>
        <p className="text-purple-600 font-medium text-sm">加载中...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-44 h-44 bg-pink-200/20 rounded-full blur-3xl animate-float-left pointer-events-none" />
      <div className="absolute bottom-40 right-10 w-52 h-52 bg-purple-200/20 rounded-full blur-3xl animate-float-right pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-blue-200/15 rounded-full blur-3xl animate-pulse pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Profile card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-purple-100/50 p-8 mb-6 border border-white/50">
          <div className="flex items-start gap-6 mb-8">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-400 rounded-lg border-3 border-white flex items-center justify-center shadow-sm">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{user.nick || "未命名"}</h2>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full text-sm font-medium">{user.gender === 1 ? "♂ 男" : "♀ 女"}</span>
                <span className="text-gray-500 text-sm">{user.age || "-"}岁</span>
              </div>
              <div className="text-sm text-gray-500 mb-4">用户 ID: {user.user_id}</div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.distill_status === 1
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {user.distill_status === 1 ? (
                    <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />已完成蒸馏</span>
                  ) : "未完成蒸馏"}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" />智能体: {user.agent_id || "-"}
                </span>
              </div>
            </div>
            <Link to="/settings" className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all active:scale-90">
              <Settings className="w-6 h-6" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 text-center border border-pink-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <div className="text-3xl font-black text-pink-600 mb-0.5">{matchCount}</div>
              <div className="text-xs text-gray-500 font-medium">匹配次数</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-black text-green-600 mb-0.5">{unlockCount}</div>
              <div className="text-xs text-gray-500 font-medium">解锁次数</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center border border-purple-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-purple-600 mb-0.5">{successRate}%</div>
              <div className="text-xs text-gray-500 font-medium">成功率</div>
            </div>
          </div>
        </div>

        {/* History card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-purple-100/50 p-8 border border-white/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">匹配记录</h3>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">暂无匹配记录</p>
              <p className="text-gray-400 text-sm mt-1">完成蒸馏后即可开始匹配</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.match_id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-purple-100 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                  onClick={() => {
                    if (item.status === 1) {
                      sessionStorage.setItem("match_id", item.match_id);
                      navigate(`/chat?match_id=${item.match_id}`);
                    } else {
                      handleViewReport(item);
                    }
                  }}
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">{item.partner_nick || `用户 ${item.partner_id?.slice(-6) || ""}`}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabels[item.status] ?? "未知"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      对话轮次 {item.chat_round} · 匹配于 {item.create_time?.slice(0, 10) || "-"}
                      {item.score ? <> · <span className="text-purple-500 font-medium">评分 {item.score}</span></> : null}
                    </div>
                    {item.advantage && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{item.advantage}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Link to="/match" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold text-center hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />开始新匹配
            </Link>
            <Link to="/distill" className="flex-1 border-2 border-purple-300 text-purple-600 py-3.5 rounded-xl font-semibold text-center hover:bg-purple-50 hover:border-purple-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <Brain className="w-5 h-5" />重新蒸馏
            </Link>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal?.open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={closeReport}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-3xl z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">适配报告</h3>
                <p className="text-xs text-gray-400">{reportModal.partnerNick} · {reportModal.matchId}</p>
              </div>
              <button onClick={closeReport} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all active:scale-90">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-6">
              {reportLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : !reportData ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>无法加载报告</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full ${levelBg[levelIdx]} mb-3 shadow-inner`}>
                      <div className={`text-5xl font-black ${levelColors[levelIdx]}`}>{score}</div>
                    </div>
                    <div className={`text-xl font-semibold mb-1 ${levelColors[levelIdx]}`}>匹配等级：{levelLabels[levelIdx]}</div>
                    <p className="text-sm text-gray-500">{score >= 85 ? "你们的适配度很高！" : score >= 70 ? "还不错，可以试试。" : "匹配度一般，请谨慎考虑。"}</p>
                  </div>

                  {radarData.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">五维适配分析</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 13 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                            <Radar name="适配度" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-5 gap-3 mt-4">
                        {radarData.map((item: any) => (
                          <div key={item.name} className="text-center bg-gray-50 rounded-xl py-3">
                            <div className="text-xl font-bold text-purple-600">{item.score}</div>
                            <div className="text-xs text-gray-500">{item.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {reportData?.advantage && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl">
                        <div className="flex items-start gap-3">
                          <ThumbsUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-green-900 mb-1">优势分析</h4>
                            <p className="text-green-800 text-sm leading-relaxed">{reportData.advantage}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {reportData?.risk && (
                      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-amber-900 mb-1">风险提示</h4>
                            <p className="text-amber-800 text-sm leading-relaxed">{reportData.risk}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {reportData?.suggest && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-xl">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-1">婚恋建议</h4>
                            <p className="text-blue-800 text-sm leading-relaxed">{reportData.suggest}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <button onClick={closeReport} className="px-6 py-2.5 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-100 border border-gray-200 transition-all active:scale-[0.98]">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
