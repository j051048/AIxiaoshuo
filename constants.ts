
import { CreatorStep } from "./types";

export const SYSTEM_INSTRUCTION = `
You are a professional Novel Creation AI Assistant, strictly following the "9-Step Creation Method" (SOP). 
Your goal is to guide the user from zero or an existing outline to a high-quality novel.

**2. 9-Step Standard Operating Procedure (SOP)**
You must guide the user sequentially. Do not skip steps. Confirm completion before moving on.

1. **[Configuration & Mode]**: Confirm readiness. (Simulate checking API Key/DeepThinking mode).
2. **[Core Setting]**: Genre, Target Audience (e.g., 22-35F), Core Background (Rebirth/Revenge/etc.).
3. **[Architecture Analysis]**: Analyze selling points, causality, protagonist goals, and solutions.
4. **[Outline Perfection]**: Review logic, consistency, and plot holes.
5. **[Character Design]**: Create 6-8 3D characters (Personality, Looks, Motivation, Flaws). Use Tables.
6. **[Detailed Outline]**: 500k word layout, pacing, word count balance. Use Tables.
7. **[Volume Planning]**: Vol 1 Chapter goals, titles, plot driving force.
8. **[Chapter Writing]**: Write body text (approx 2300 words/chapter).
9. **[Review & Polish]**: QA for language, logic, and character depth.

**3. Key Instructions & Functionality**
- **Existing Outline**: If user provides one, auto-classify to Step 4.
- **Prompt Structure**: When relevant, use format: \`[Send to DeepSeek]: {Prompt Content}\` to show internal reasoning.
- **Export**: 
    - At Step 6-7 completion: Summarize full outline in Markdown.
    - At Step 8 completion: Provide standard format header \`[File: Chapter_N.txt]\`.

**4. Interaction Rules**
- **Forced Steps**: One step at a time. No jumping to writing immediately.
- **Structured Output**: Use **Tables** for characters/outlines. Use **Bold** for key conflicts.
- **Tracking**: End EVERY response with: "\\n\\n--- \n**Current Phase**: [Step N - Step Name]. Shall we proceed?"
- **Language**: STRICTLY adhere to the user's selected language. 
    - If **Chinese (ZH)**: Output ONLY in Chinese. Do NOT use English titles, headers, or confirmation words unless it is a specific untranslatable technical term.
    - If **English (EN)**: Output in English.

**5. Tone**
Professional, encouraging, structured, and analytical.
`;

export const INITIAL_GREETING_EN = `Hello! I am your AI Novel Creation Assistant. I have loaded the **9-Step Creation Logic**.

I am ready to guide you through the DeepSeek-powered creative process.
1. **Configuration & Mode**
2. **Core Setting**
3. **Architecture Analysis**
4. **Outline Perfection**
5. **Character Design**
6. **Detailed Outline**
7. **Volume Planning**
8. **Chapter Writing**
9. **Review & Polish**

Please tell me your **Novel Idea**, **Inspiration**, or paste an **Existing Outline** to begin!`;

export const INITIAL_GREETING_ZH = `您好！我是您的 AI 小说创作管家。我已经加载了 **9 步创作逻辑**。

我已准备好通过 DeepSeek 深度思考模式引导您进行创作：
1. **配置与模式**
2. **核心设定**
3. **架构剖析**
4. **大纲完善**
5. **人设塑造**
6. **细纲拓展**
7. **分卷计划**
8. **章节撰写**
9. **审核润色**

请告诉我您的**小说灵感**，或者直接粘贴**现有大纲**，我们开始第一步！`;

export const UI_TEXT = {
  en: {
    title: "AI Novelist Studio",
    step: "Step",
    export: "Export",
    placeholder: "Type your instruction, idea, or feedback...",
    settings: "Settings",
    apiKey: "API Key",
    baseUrl: "Base URL (Optional)",
    model: "Model",
    save: "Save",
    cancel: "Cancel",
    testConn: "Test Connection",
    testing: "Testing...",
    testSuccess: "Connection Successful!",
    testFailed: "Connection Failed. Check settings.",
    deepSeekMode: "DeepSeek Mode Active",
    toggleLang: "中",
    edit: "Edit",
    editTitle: "Edit Setting",
    targetAudience: "Target Audience",
    totalWordCount: "Total Word Count",
    chapterWordCount: "Chapter Word Count",
    nextStep: "Next Step",
    continue: "Continue",
    stepMap: {
      [CreatorStep.Configuration]: "Configuration & Mode",
      [CreatorStep.CoreSetting]: "Core Settings",
      [CreatorStep.ArchitectureAnalysis]: "Architecture Analysis",
      [CreatorStep.OutlinePerfection]: "Outline Perfection",
      [CreatorStep.CharacterDesign]: "Character Design",
      [CreatorStep.DetailedOutline]: "Detailed Expansion",
      [CreatorStep.VolumePlanning]: "Volume Planning",
      [CreatorStep.ChapterWriting]: "Chapter Writing",
      [CreatorStep.ReviewAndPolish]: "Review & Polish",
    },
    // We will dynamic replace these in the component, but keep base structure
    stepDetails: {
      [CreatorStep.Configuration]: "Verify AI Config & DeepThinking Mode",
      [CreatorStep.CoreSetting]: "Verify AI Config & DeepThinking Mode",
      [CreatorStep.ArchitectureAnalysis]: "Selling Points, Logic, Protagonist Goals",
      [CreatorStep.OutlinePerfection]: "Logic Check, Consistency, Plot Holes",
      [CreatorStep.CharacterDesign]: "6-8 Characters (Bio, Motivation, Flaws)",
      [CreatorStep.DetailedOutline]: "Word Structure, Pacing",
      [CreatorStep.VolumePlanning]: "Vol 1 Goals, Titles, Plot Drivers",
      [CreatorStep.ChapterWriting]: "Drafting",
      [CreatorStep.ReviewAndPolish]: "Quality Assurance & Editing",
    }
  },
  zh: {
    title: "AI 小说创作管家",
    step: "阶段",
    export: "导出记录",
    placeholder: "输入指令、灵感或反馈...",
    settings: "设置",
    apiKey: "API Key (密钥)",
    baseUrl: "接口地址 (Base URL)",
    model: "模型",
    save: "保存配置",
    cancel: "取消",
    testConn: "测试连接",
    testing: "正在测试...",
    testSuccess: "连接成功！",
    testFailed: "连接失败，请检查配置。",
    deepSeekMode: "深度思考模式已激活",
    toggleLang: "EN",
    edit: "修改",
    editTitle: "修改设定",
    targetAudience: "目标受众",
    totalWordCount: "总字数",
    chapterWordCount: "单章字数",
    nextStep: "下一步",
    continue: "继续",
    stepMap: {
      [CreatorStep.Configuration]: "配置与模式",
      [CreatorStep.CoreSetting]: "核心设定",
      [CreatorStep.ArchitectureAnalysis]: "架构剖析",
      [CreatorStep.OutlinePerfection]: "大纲完善",
      [CreatorStep.CharacterDesign]: "人设塑造",
      [CreatorStep.DetailedOutline]: "细纲拓展",
      [CreatorStep.VolumePlanning]: "分卷计划",
      [CreatorStep.ChapterWriting]: "章节撰写",
      [CreatorStep.ReviewAndPolish]: "审核润色",
    },
    stepDetails: {
      [CreatorStep.Configuration]: "确认 API 配置及深度思考模式",
      [CreatorStep.CoreSetting]: "题材、受众、核心梗",
      [CreatorStep.ArchitectureAnalysis]: "分析卖点、因果逻辑、主角目标",
      [CreatorStep.OutlinePerfection]: "审查逻辑连贯性、填补漏洞",
      [CreatorStep.CharacterDesign]: "6-8人设（性格/外貌/动机/优缺）",
      [CreatorStep.DetailedOutline]: "总字数布局、节奏把控",
      [CreatorStep.VolumePlanning]: "第一卷目标、标题、情节推动",
      [CreatorStep.ChapterWriting]: "正文创作",
      [CreatorStep.ReviewAndPolish]: "语言、逻辑、人物二次质检",
    }
  }
};
