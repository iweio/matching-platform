import { useState } from "react";
import { useNavigate } from "react-router";
import { Heart, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { api } from "../api";
import { getUserId } from "../storage";

const speakStyles = [
  { id: "humor", label: "幽默风趣", emoji: "😄" },
  { id: "gentle", label: "温柔细腻", emoji: "🌸" },
  { id: "direct", label: "直接干脆", emoji: "⚡" },
  { id: "artistic", label: "文艺清新", emoji: "🎨" },
  { id: "confident", label: "霸气外露", emoji: "👑" },
];

const characters = [
  { id: "extrovert", label: "外向开朗", emoji: "🌟" },
  { id: "introvert", label: "内向文静", emoji: "🌙" },
  { id: "stable", label: "沉稳务实", emoji: "🏔️" },
  { id: "lively", label: "活泼可爱", emoji: "🎈" },
  { id: "mature", label: "成熟稳重", emoji: "🎯" },
];

const loveStyles = [
  { id: "romantic", label: "浪漫型", desc: "注重仪式感和惊喜", emoji: "💝" },
  { id: "practical", label: "务实型", desc: "注重实际和未来规划", emoji: "💼" },
  { id: "companion", label: "陪伴型", desc: "注重日常相处和陪伴", emoji: "🤝" },
  { id: "independent", label: "独立型", desc: "保持个人空间和自由", emoji: "🦅" },
  { id: "clingy", label: "粘人型", desc: "喜欢时刻在一起", emoji: "🐨" },
];

const taboos = ["出轨","冷暴力","妈宝","赌博","酗酒","暴力","不讲卫生","抠门","沉迷游戏","好吃懒做"];

export function DistillPage() {
  const navigate = useNavigate();
  const uid = getUserId();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    speakStyle: "",
    character: "",
    loveStyle: "",
    marriageView: "",
    moneyView: "",
    familyView: "",
    idealPartner: "",
    selectedTaboos: [] as string[],
    tabooDesc: "",
  });

  const handleNext = () => {
    if (step === 1 && (!formData.speakStyle || !formData.character || !formData.loveStyle)) {
      alert("请完成所有选择"); return;
    }
    if (step === 2 && (!formData.marriageView || !formData.moneyView || !formData.familyView)) {
      alert("请完成所有选择"); return;
    }
    if (step < 3) { setStep(step + 1); } else { handleSubmit(); }
  };

  const handleSubmit = async () => {
    if (!uid) { alert("请先登录"); navigate("/login"); return; }
    setSubmitting(true);
    try {
      await api.distill({
        speak_style: formData.speakStyle,
        character: formData.character,
        love_style: formData.loveStyle,
        values_view: {
          marriage: formData.marriageView,
          consume: formData.moneyView,
          family: formData.familyView,
          ideal_partner: formData.idealPartner,
        },
        taboo: {
          behaviors: formData.selectedTaboos,
          extra: formData.tabooDesc,
        },
      });
      sessionStorage.setItem("distill_speak", formData.speakStyle);
      sessionStorage.setItem("distill_char", formData.character);
      sessionStorage.setItem("distill_love", formData.loveStyle);
      sessionStorage.setItem("distill_values", JSON.stringify({ marriage: formData.marriageView, consume: formData.moneyView, family: formData.familyView, ideal_partner: formData.idealPartner }));
      sessionStorage.setItem("distill_taboo", JSON.stringify({ behaviors: formData.selectedTaboos, extra: formData.tabooDesc }));
      navigate("/distill-result");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "提交失败";
      alert("提交失败: " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaboo = (t: string) => {
    setFormData({
      ...formData,
      selectedTaboos: formData.selectedTaboos.includes(t)
        ? formData.selectedTaboos.filter((x) => x !== t)
        : [...formData.selectedTaboos, t],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">人格蒸馏</h2>
            </div>
            <div className="text-sm text-gray-500">步骤 {step}/3</div>
          </div>
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i <= step ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {i < step ? <Check className="w-5 h-5" /> : i}
                </div>
                {i < 3 && <div className={`flex-1 h-1 mx-2 ${i < step ? "bg-purple-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-8">
              {[{ title: "说话风格", arr: speakStyles, key: "speakStyle" },
                { title: "性格类型", arr: characters, key: "character" }].map(({ title, arr, key }) => (
                <div key={key}>
                  <h3 className="font-semibold text-lg mb-4">{title}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {arr.map((s: any) => (
                      <label key={s.id} className="cursor-pointer">
                        <input type="radio" name={key} value={s.id} checked={(formData as any)[key] === s.id}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} className="peer sr-only" />
                        <div className="p-4 border-2 border-gray-300 rounded-lg text-center peer-checked:border-purple-600 peer-checked:bg-purple-50 hover:border-purple-400 transition-colors">
                          <div className="text-2xl mb-1">{s.emoji}</div>
                          <div className="font-medium">{s.label}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <h3 className="font-semibold text-lg mb-4">恋爱模式</h3>
                <div className="space-y-3">
                  {loveStyles.map((s) => (
                    <label key={s.id} className="cursor-pointer block">
                      <input type="radio" name="loveStyle" value={s.id} checked={formData.loveStyle === s.id}
                        onChange={(e) => setFormData({ ...formData, loveStyle: e.target.value })} className="peer sr-only" />
                      <div className="p-4 border-2 border-gray-300 rounded-lg peer-checked:border-purple-600 peer-checked:bg-purple-50 hover:border-purple-400 transition-colors flex items-center gap-3">
                        <div className="text-2xl">{s.emoji}</div>
                        <div className="flex-1"><div className="font-medium">{s.label}</div><div className="text-sm text-gray-500">{s.desc}</div></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {[{ title: "婚姻观", key: "marriageView", opts: ["必须结婚","看缘分","不着急","单身主义"] },
                { title: "消费观", key: "moneyView", opts: ["节约型","享受型","平衡型"] },
                { title: "家庭观", key: "familyView", opts: ["以家庭为重","个人独立","平衡"] }].map(({ title, key, opts }) => (
                <div key={key}>
                  <h3 className="font-semibold text-lg mb-4">{title}</h3>
                  <div className="space-y-2">
                    {opts.map((v) => (
                      <label key={v} className="cursor-pointer block">
                        <input type="radio" name={key} value={v} checked={(formData as any)[key] === v}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} className="peer sr-only" />
                        <div className="p-3 border-2 border-gray-300 rounded-lg peer-checked:border-purple-600 peer-checked:bg-purple-50 hover:border-purple-400 transition-colors">{v}</div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <h3 className="font-semibold text-lg mb-4">理想伴侣描述</h3>
                <textarea placeholder="描述你心目中理想伴侣的样子..." rows={4} value={formData.idealPartner}
                  onChange={(e) => setFormData({ ...formData, idealPartner: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">最不能接受的行为和习惯</h3>
                <div className="flex flex-wrap gap-2">
                  {taboos.map((t) => (
                    <button key={t} onClick={() => toggleTaboo(t)}
                      className={`px-4 py-2 rounded-full border-2 transition-colors ${formData.selectedTaboos.includes(t) ? "border-red-500 bg-red-50 text-red-600" : "border-gray-300 bg-white text-gray-700 hover:border-red-300"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-4">底线补充说明</h3>
                <textarea placeholder="还有其他底线或要求吗？" rows={4} value={formData.tabooDesc}
                  onChange={(e) => setFormData({ ...formData, tabooDesc: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none" />
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-5 h-5" />上一步
              </button>
            )}
            <button onClick={handleNext} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
              {submitting ? "提交中..." : step === 3 ? "提交" : "下一步"}
              {step < 3 && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
