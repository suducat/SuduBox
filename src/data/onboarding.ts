export const guideSteps = [
  {
    title: "欢迎来到速度工具箱",
    description:
      "课表、便签、公式和成绩，一些常用的小工具都在这里。先看看有什么需要的，其他功能以后再慢慢探索。",
    tools: [
      {
        route: "home",
        name: "工作台",
        text: "查看今天的课程、考试倒计时和待复习内容。",
      },
      {
        route: "tools",
        name: "工具中心",
        text: "选择工具，或按 ⌘ / Ctrl + K 搜索。",
      },
    ],
  },
  {
    title: "安排今天的学习",
    description: "先添加几节课，重要考试也顺手记下来。",
    tools: [
      {
        route: "schedule",
        name: "智能课表 · AIP 专属设置",
        text: "AIP 同学可以直接选年级、班级和科目；也能手动创建课表。点击课程记速记，没听懂的知识点会汇总到工作台。导入前会预览，不会自动覆盖旧课表。",
      },
      {
        route: "exams",
        name: "考试倒计时",
        text: "自行填写考试日期，固定重要考试到工作台。",
      },
    ],
  },
  {
    title: "把作业和想法留下来",
    description: "想到什么就记下来，学一会儿也记得休息。",
    tools: [
      {
        route: "notes",
        name: "每日便签",
        text: "点击添加后直接输入，自动保存。完成后打勾，需要时置顶。",
      },
      {
        route: "focus",
        name: "专注番茄钟",
        text: "填写主题后计时，离开时暂停，结束后保存真实时长。",
      },
      {
        route: "random",
        name: "随机抽题器",
        text: "按题号、粘贴的题目或自己的题库抽取练习。",
      },
    ],
  },
  {
    title: "查公式、背单词、算成绩",
    description: "先选最需要的工具，不必一次配置完。",
    tools: [
      {
        route: "gpa",
        name: "AIP GPA 计算器",
        text: "选择学年、年级和学期，从目录选实际修读的课程，输入学校综合成绩。学校字母等级优先；期中仅作阶段估算。可以先快速估算，确认后再保存。",
      },
      {
        route: "formulas",
        name: "学术公式表",
        text: "按科目搜索，查看变量和使用条件，收藏后方便复习。",
      },
      {
        route: "words",
        name: "单词本",
        text: "支持批量粘贴，预览确认后导入，翻卡查看释义。",
      },
      {
        route: "text",
        name: "文本整理",
        text: "粘贴后选择整理规则，对比结果再复制。",
      },
      { route: "files", name: "文件转换 · 开发中", text: "暂未开放。" },
      { route: "ai", name: "AI 写作检测 · 开发中", text: "暂未开放。" },
    ],
  },
  {
    title: "准备好了，就开始吧",
    description: "不用登录，数据自动保存在本地。换设备前记得带上备份。",
    tools: [
      {
        route: "backup",
        name: "备份与迁移",
        text: "定期导出 JSON。网页版与桌面版用备份文件迁移，恢复前会请你确认。",
      },
      {
        route: "settings",
        name: "设置",
        text: "切换主题，也能随时重新查看向导。",
      },
      {
        route: "about",
        name: "关于与反馈",
        text: "查看版本、更新日志和作者联系方式。音乐角落在工作台。",
      },
    ],
  },
];
