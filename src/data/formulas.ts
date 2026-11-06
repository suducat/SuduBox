import { extraFormulas, formulaSources } from "./formula-extra";
export interface Formula {
  example?: string;
  source?: { title: string; url: string };
  checked?: string;
  course?: string;
  id: string;
  name: string;
  expression: string;
  systems: string[];
  subject: string;
  topic: string;
  variables: string;
  units: string;
  conditions: string;
  description: string;
  keywords: string;
  variation?: string;
}
const seeds: Formula[] = [
  {
    id: "power",
    name: "幂函数求导",
    expression: "\\frac{d}{dx}x^n=nx^{n-1}",
    systems: ["AP", "A-Level"],
    subject: "Mathematics",
    topic: "微分",
    variables: "x：自变量；n：常数指数",
    units: "随变量单位而定",
    conditions: "在 xⁿ 定义且可微的区间内使用；一般实指数在 x > 0 时成立。",
    description: "将指数移到系数位置，再将指数减一。常数函数的导数为 0。",
    keywords: "导数 derivative power calculus",
  },
  {
    id: "product",
    name: "乘积求导法则",
    expression: "(uv)'=u'v+uv'",
    systems: ["AP", "A-Level"],
    subject: "Mathematics",
    topic: "微分",
    variables: "u、v：关于同一自变量的可微函数",
    units: "随变量单位而定",
    conditions: "u 与 v 在所讨论点均可微。",
    description: "分别对一个因子求导，再相加。",
    keywords: "product 导数 微积分",
  },
  {
    id: "chain",
    name: "链式法则",
    expression: "\\frac{d}{dx}f(g(x))=f'(g(x))g'(x)",
    systems: ["AP", "A-Level"],
    subject: "Mathematics",
    topic: "微分",
    variables: "f：外层函数；g：内层函数；x：自变量",
    units: "随变量单位而定",
    conditions: "g 在 x 处可微，f 在 g(x) 处可微。",
    description: "复合函数求导等于外层导数乘以内层导数。",
    keywords: "chain rule derivative calculus 复合函数",
  },
  {
    id: "integral",
    name: "幂函数不定积分",
    expression: "\\int x^n\\,dx=\\frac{x^{n+1}}{n+1}+C",
    systems: ["AP", "A-Level"],
    subject: "Mathematics",
    topic: "积分",
    variables: "n：常数指数；C：任意积分常数",
    units: "随变量单位而定",
    conditions: "n ≠ −1；在被积函数定义且连续的区间内使用。",
    description: "指数加一，再除以新的指数。n = −1 时积分为 ln|x| + C。",
    keywords: "integral antiderivative calculus 原函数",
  },
  {
    id: "motion",
    name: "匀加速直线运动",
    expression: "s=v_0t+\\frac{1}{2}at^2",
    systems: ["AP", "A-Level"],
    subject: "Physics",
    topic: "运动学",
    variables: "s：位移；v₀：初速度；a：加速度；t：时间",
    units: "s：m；v₀：m/s；a：m/s²；t：s",
    conditions: "加速度恒定，采用一致的正方向。",
    description:
      "位移等于初速度贡献与加速度贡献之和。位移有方向，不一定等于路程。",
    keywords: "kinematics displacement SUVAT",
    variation: "v=v_0+at",
  },
  {
    id: "newton",
    name: "牛顿第二定律",
    expression: "\\sum \\vec F=m\\vec a",
    systems: ["AP", "A-Level"],
    subject: "Physics",
    topic: "力与运动",
    variables: "ΣF：合外力；m：质量；a：加速度",
    units: "F：N；m：kg；a：m/s²",
    conditions: "惯性参考系，质量不变的经典力学情形。",
    description: "加速度方向与合外力方向一致；应使用合力而非某个单独的力。",
    keywords: "Newton force dynamics F ma",
  },
  {
    id: "energy",
    name: "动能",
    expression: "E_k=\\frac{1}{2}mv^2",
    systems: ["AP", "A-Level"],
    subject: "Physics",
    topic: "能量",
    variables: "Eₖ：平动动能；m：质量；v：速率",
    units: "Eₖ：J；m：kg；v：m/s",
    conditions: "经典力学，速率远小于光速。",
    description: "动能是标量，与速率的平方成正比。",
    keywords: "kinetic energy work",
  },
  {
    id: "elasticity",
    name: "需求价格弹性（中点法）",
    expression: "E_d=\\frac{(Q_2-Q_1)/[(Q_1+Q_2)/2]}{(P_2-P_1)/[(P_1+P_2)/2]}",
    systems: ["AP", "A-Level"],
    subject: "Economics",
    topic: "需求与弹性",
    variables: "Q₁、Q₂：初始与最终需求量；P₁、P₂：初始与最终价格",
    units: "无量纲",
    conditions: "价格和数量均值非零，价格有变化；其他影响需求的因素保持不变。",
    description:
      "中点法度量区间弹性。普通向下倾斜需求曲线的弹性为负；比较弹性大小常用绝对值，需遵循题目约定。",
    keywords: "price elasticity demand PED 微观经济",
  },
  {
    id: "revenue",
    name: "总收益",
    expression: "TR=P\\times Q",
    systems: ["AP", "A-Level"],
    subject: "Economics",
    topic: "成本与收益",
    variables: "TR：总收益；P：单位价格；Q：销售数量",
    units: "TR：货币；P：货币/单位；Q：单位",
    conditions: "各单位以相同价格出售。",
    description: "收益不等于利润，利润还需扣除总成本。",
    keywords: "total revenue economics",
    variation: "\\pi=TR-TC",
  },
];

export const formulas: Formula[] = [
  ...seeds.map((f) => ({
    ...f,
    source:
      formulaSources[
        f.subject === "Mathematics"
          ? "math"
          : f.subject === "Physics"
            ? "physics"
            : "economics"
      ],
    checked: "2026-11-06",
    course: "AP 基础与 A-Level 通用参考",
  })),
  ...extraFormulas,
];

const microIds = new Set([
  "elasticity",
  "revenue",
  "average-cost",
  "profit",
  "income-elasticity",
]);
for (const formula of formulas) {
  if (microIds.has(formula.id))
    formula.source = {
      title: "College Board AP Microeconomics CED（2026版）",
      url: "https://apcentral.collegeboard.org/media/pdf/ap-microeconomics-course-and-exam-description.pdf",
    };
}
const examples: Record<string, string> = {
  quadratic: "原创例题：x²−3x+2=0。代入 a=1,b=−3,c=2，得到 x=1 或 2。",
  newton: "原创例题：2 kg 物体的合外力为向右 6 N，则加速度为向右 3 m/s²。",
  inflation:
    "原创例题：同口径 CPI 从 100 到 103，通胀率为 3%。若上期通胀率 2%，本期上升 1 个百分点。",
  multiplier:
    "原创例题：简单无税封闭模型中 MPC=0.8，乘数为 5；初始自主支出增加 10，均衡收入增加 50（同一币种）。",
};
for (const formula of formulas) formula.example = examples[formula.id];
