export const guideSteps = [
  {
    title: "欢迎使用速度工具箱",
    description: "先花一分钟，看看常用功能在哪里。",
    tools: [
      {
        route: "home",
        name: "工作台",
        text: "查看今天的课程、待复习内容、便签和近期考试。",
      },
      {
        route: "tools",
        name: "工具中心",
        text: "选择工具；也可按 ⌘ / Ctrl + K 搜索。",
      },
    ],
  },
  {
    title: "把课程和作业记下来",
    description: "从课表开始，安排每一天。",
    tools: [
      {
        route: "schedule",
        name: "智能课表",
        text: "手动添加课程，或点“我是 AIP 学生”选择年级、班级和科目。点击课程写速记，没听懂的内容会出现在工作台。",
      },
      {
        route: "notes",
        name: "每日便签",
        text: "直接输入作业或提醒，自动保存；完成后打勾。",
      },
    ],
  },
  {
    title: "安排复习时间",
    description: "知道还有多久，也知道今天学了多久。",
    tools: [
      {
        route: "exams",
        name: "考试倒计时",
        text: "添加考试日期，把重要考试固定到工作台。",
      },
      {
        route: "focus",
        name: "专注番茄钟",
        text: "填写学习主题后开始计时，离开时暂停，结束后保存实际专注时间。",
      },
    ],
  },
  {
    title: "积累单词和公式",
    description: "需要时查一查，空闲时练一练。",
    tools: [
      {
        route: "words",
        name: "单词本",
        text: "逐个添加或批量粘贴单词，确认释义后导入，再用翻卡复习。",
      },
      {
        route: "formulas",
        name: "学术公式表",
        text: "按科目搜索公式，查看变量与条件；收藏常用项，隐藏公式自测。",
      },
      { route: "gpa", name: "GPA 计算器 · 敬请期待", text: "该工具尚未开放。" },
    ],
  },
  {
    title: "让练习更轻松",
    description: "按需要选择一种方式。",
    tools: [
      {
        route: "random",
        name: "随机抽题器",
        text: "按题号抽取、粘贴题目，或建立自己的题答卡片。默认不重复抽取。",
      },
      {
        route: "text",
        name: "文本与标点整理",
        text: "粘贴原文，选择整理规则，对比结果后复制。",
      },
      { route: "files", name: "文件转换 · 敬请期待", text: "该工具尚未开放。" },
      { route: "ai", name: "AI 写作检测 · 敬请期待", text: "该工具尚未开放。" },
    ],
  },
  {
    title: "最后，记得备份",
    description: "不用登录，学习记录保存在这台设备。",
    tools: [
      {
        route: "backup",
        name: "数据备份与恢复",
        text: "定期导出 JSON。更换设备、清除网站数据前先备份；网页版和桌面版用 JSON 迁移。",
      },
      {
        route: "settings",
        name: "外观与偏好",
        text: "切换主题，也可以随时重新打开这份向导。",
      },
      {
        route: "author",
        name: "作者",
        text: "查看 suducat 的 GitHub 和联系方式。音乐角落在工作台，休息时也可以看看。",
      },
    ],
  },
];
