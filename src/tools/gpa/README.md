# AIP GPA 模块

v1.1.0 已实现。页面位于 `src/pages/Gpa.tsx`；规则与课程目录位于 `src/data/gpa-policy.ts`、`src/data/gpa-courses.ts`；计算及备份校验位于 `src/utils/gpa.ts`，测试与其同目录。成绩使用原 IndexedDB 的可选 `gpa` 字段，不改变数据库标识或覆盖其他模块。
