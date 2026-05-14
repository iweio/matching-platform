import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { User, Heart, CheckCircle, TrendingUp, Settings, RefreshCw, LogOut, ChevronRight, X, AlertCircle, Lightbulb, ThumbsUp, Loader2 } from "lucide-react";
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

  // Report modal state
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
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
        <p className="text-sm text-gray-500 mb-6">无法加载用户数据，请检查网络后重试，或重新登录</p>
        <div className="flex gap-3 justify-center">
          <button onClick={handleRetry} className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">重试</button>
          <button onClick={handleReLogin} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <LogOut className="w-4 h-4" />重新登录
          </button>
        </div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">加载中...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{user.nick || "未命名"}</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{user.gender === 1 ? "男" : "女"}</span>
                <span className="text-gray-500">{user.age || "-"}岁</span>
              </div>
              <div className="text-sm text-gray-500 mb-4">用户 ID: {user.user_id}</div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${user.distill_status === 1 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {user.distill_status === 1 ? "已完成蒸馏" : "未完成蒸馏"}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">智能体: {user.agent_id || "-"}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/settings" className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Settings className="w-6 h-6" /></Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 text-center">
              <Heart className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-pink-600 mb-1">{matchCount}</div>
              <div className="text-sm text-gray-600">匹配次数</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-600 mb-1">{unlockCount}</div>
              <div className="text-sm text-gray-600">解锁次数</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-purple-600 mb-1">{successRate}%</div>
              <div className="text-sm text-gray-600">成功率</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">匹配记录</h3>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无匹配记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.match_id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (item.status === 1) {
                      sessionStorage.setItem("match_id", item.match_id);
                      navigate(`/chat?match_id=${item.match_id}`);
                    } else {
                      handleViewReport(item);
                    }
                  }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">{item.partner_nick || `用户 ${item.partner_id?.slice(-6) || ""}`}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[item.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabels[item.status] ?? "未知"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      对话轮次 {item.chat_round} · 匹配于 {item.create_time?.slice(0, 10) || "-"}
                      {item.score ? <> · 评分 {item.score}</> : null}
                    </div>
                    {item.advantage && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{item.advantage}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
          <div className="mt-8 flex gap-4">
            <Link to="/match" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold text-center hover:shadow-lg transition-all">开始新匹配</Link>
            <Link to="/distill" className="flex-1 border-2 border-purple-600 text-purple-600 py-3 rounded-lg font-semibold text-center hover:bg-purple-50 transition-all">重新蒸馏</Link>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal?.open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto" onClick={closeReport}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">适配报告</h3>
                <p className="text-xs text-gray-500">{reportModal.partnerNick} · {reportModal.matchId}</p>
              </div>
              <button onClick={closeReport} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
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
                  {/* Score */}
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${levelBg[levelIdx]} mb-3`}>
                      <div className={`text-5xl font-bold ${levelColors[levelIdx]}`}>{score}</div>
                    </div>
                    <div className={`text-xl font-semibold mb-1 ${levelColors[levelIdx]}`}>匹配等级：{levelLabels[levelIdx]}</div>
                    <p className="text-sm text-gray-500">{score >= 85 ? "你们的适配度很高！" : score >= 70 ? "还不错，可以试试。" : "匹配度一般，请谨慎考虑。"}</p>
                  </div>

                  {/* Radar Chart */}
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
                          <div key={item.name} className="text-center">
                            <div className="text-xl font-bold text-purple-600">{item.score}</div>
                            <div className="text-xs text-gray-500">{item.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Analysis sections */}
                  <div className="space-y-4">
                    {reportData?.advantage && (
                      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
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
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
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
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
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

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button onClick={closeReport} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
