# 内容范围与来源（核对：2026-11-06）

## 历史课表

来源为用户提供的《新高二学生课表20260518.xlsx》的 Y11 工作表，标题 SFLS AIP 2026 Senior 2 Summer Timetable starts from May 18th, 2026（原表有多余空格）。五组分别为 211、212、212 B、213、214，每组40时段。原文、单元格、模板ID、版本保存在预设及导入课程来源字段中。`python3 scripts/verify-aip.py /绝对路径/原表.xlsx` 可只读复核200格原文与星期；运行时不加载Excel库。

这是2026-05-18起的历史版本，结束日期未知；Y11/Senior 2仅解释原表标识。午休12:10–14:10是推导配置，晚自习来自产品设置，不是Excel原文。自习室表未用于创建课程。

## 学习公式

共41条：数学14条（新增10），物理16条（新增13），经济11条（新增9）。保留原9条收藏ID，不以重复条目增加数量。新增覆盖：

- 数学：代数、函数、指数对数、三角、数列、微分、积分、条件概率/二项分布/正态标准化。
- 物理：动量与冲量、圆周运动、弹簧力、简谐运动、波速、比热与理想气体、电路、电场磁场、电磁感应，加上原运动学/牛顿定律/动能。
- 经济：平均/边际成本、经济利润、支出法GDP、平减指数、通胀、失业、简单乘数、明确报价方向的汇率、收入弹性，加上需求价格弹性与收益。

变量、单位、条件、方向或口径均由本项目简要原创整理，不是官方说明全文。四条带原创例题。没有覆盖完整考纲：高阶积分技巧、完整分布/推断、转动/流体/现代物理、复杂宏观模型等仍待扩充。A-Level统一标为通用参考，不冒充某考试局完整考纲，也不代表考场允许携带。

核对参考：
- [Cambridge Mathematics 9709 2026–2027 syllabus](https://www.cambridgeinternational.org/Images/697427-2026-2027-syllabus.pdf)
- [College Board Calculus AB/BC CED](https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf)
- [AP Physics 1 reference](https://apcentral.collegeboard.org/media/pdf/ap-physics-1-equations-sheet.pdf)
- [AP Physics 2 CED](https://apcentral.collegeboard.org/media/pdf/ap-physics-2-course-and-exam-description.pdf)
- [AP Microeconomics CED（2026版）](https://apcentral.collegeboard.org/media/pdf/ap-microeconomics-course-and-exam-description.pdf)
- [AP Macroeconomics CED（2026版）](https://apcentral.collegeboard.org/media/pdf/ap-macroeconomics-course-and-exam-description.pdf)

## 官方考试预设

共48条：AP常规14科+对应补考14条，Cambridge Zone 5 的2026 November/2027 June部分试卷9条，Pearson Edexcel IAL January 2027的部分单元10条，AP常规考季范围1条。不是完整考试日历。部分考试局、科目、区域未选择/未收录时不输出伪精确的个人倒计时，须前往官方表核对。

每条有稳定ID、考试局、年份、考季、科目/试卷、日期精度、适用区域、来源和核对日期。应用离线展示发布时核对的数据，不在运行时抓取；后续官方调整需要维护数据文件并重新构建。过期归入历史；AP时段和IAL AM/PM不被转换成未经核实的中国本地时刻。

官方来源：
- [2027 AP 常规日期](https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates)
- [2027 AP 补考日期](https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates/late-testing-dates)
- [Cambridge 各行政区官方入口](https://www.cambridgeinternational.org/exam-administration/cambridge-exams-officers-guide/phase-1-preparation/timetabling-exams/exam-timetables/)
- [November 2026 Zone 5](https://www.cambridgeinternational.org/Images/757650-november-2026-zone-5-timetable.pdf)
- [June 2027 Zone 5](https://www.cambridgeinternational.org/Images/766283-june-2027-zone-5-timetable.pdf)
- [Pearson January 2027 Final Timetable](https://qualifications.pearson.com/content/dam/pdf/Support/Examination-timetables-for-International-Advanced-Levels/ial-january-2027-final.pdf)

到场安排以学校和准考证为准。AP 2027起部分地区开考时刻变化，不能套用全球统一8点/12点。
