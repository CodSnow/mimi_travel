import fs from "node:fs/promises";
import path from "node:path";
import {
  Presentation,
  PresentationFile,
} from "@oai/artifact-tool";

const W = 1920;
const H = 1080;
const ROOT = path.resolve("..");
const OUT = path.resolve("output");
const SCRATCH = path.resolve("scratch");

const A = {
  homeCat: path.join(ROOT, "assets/home-cat.png"),
  windCat: path.join(ROOT, "assets/wind-cat.png"),
  routeDog: path.join(ROOT, "assets/route-dog.png"),
  carrier: path.join(ROOT, "assets/post-carrier.jpg"),
  cert: path.join(ROOT, "assets/post-cert.jpg"),
  luggage: path.join(ROOT, "assets/post-luggage.jpg"),
};

const C = {
  ink: "#070A3B",
  text: "#242436",
  muted: "#6E7183",
  cream: "#FFF7E3",
  paper: "#FFFFFF",
  orange: "#FF6B35",
  orange2: "#FF8C42",
  yellow: "#FFD93D",
  blue: "#177FE5",
  sky: "#DCEEFF",
  green: "#63C67A",
  mint: "#E7F8EF",
  lavender: "#EEE7FF",
  rose: "#FFE3EC",
  line: "#F0E5D6",
};

const FONT = "PingFang SC";
const TITLE_FONT = "PingFang SC";
const imageHydrations = [];

function addShape(slide, opts) {
  return slide.shapes.add({
    geometry: opts.geometry || "rect",
    position: opts.position,
    fill: opts.fill ?? "transparent",
    line: opts.line ?? { fill: "transparent", width: 0 },
    radius: opts.radius,
  });
}

function addText(slide, value, box, style = {}) {
  const sh = slide.shapes.add({
    geometry: "rect",
    position: box,
    fill: "transparent",
    line: { fill: "transparent", width: 0 },
  });
  sh.text = value;
  sh.text.style = {
    typeface: style.typeface || FONT,
    fontSize: style.fontSize || 32,
    color: style.color || C.text,
    bold: style.bold || false,
    alignment: style.alignment || "left",
    verticalAlignment: style.verticalAlignment || "top",
    lineSpacing: style.lineSpacing || 1.12,
  };
  return sh;
}

function addPill(slide, value, x, y, w, color, fill = "#FFFFFF") {
  addShape(slide, {
    geometry: "roundRect",
    position: { left: x, top: y, width: w, height: 58 },
    fill,
    line: { fill: color, width: 2 },
  });
  addText(slide, value, { left: x, top: y + 12, width: w, height: 40 }, {
    fontSize: 24,
    bold: true,
    color,
    alignment: "center",
  });
}

function addTop(slide, kicker, title, subtitle) {
  addText(slide, kicker, { left: 108, top: 76, width: 640, height: 36 }, {
    fontSize: 22,
    bold: true,
    color: C.orange,
  });
  addText(slide, title, { left: 104, top: 118, width: 1280, height: 134 }, {
    fontSize: 52,
    bold: true,
    color: C.ink,
    lineSpacing: 1.05,
  });
  if (subtitle) {
    addText(slide, subtitle, { left: 108, top: 268, width: 1140, height: 70 }, {
      fontSize: 27,
      color: C.muted,
      lineSpacing: 1.18,
    });
  }
}

function addFooter(slide, i) {
  addText(slide, `咪咪出行 · 项目介绍  /  ${String(i).padStart(2, "0")}`, {
    left: 108,
    top: 1016,
    width: 560,
    height: 28,
  }, { fontSize: 16, color: "#8D8FA0" });
}

function bg(slide, fill = C.cream) {
  slide.background.fill = fill;
}

function addImage(slide, pathName, box, fit = "contain", alt = "") {
  const img = slide.images.add({ path: pathName, position: box, fit, alt });
  imageHydrations.push({ img, pathName });
  return img;
}

function phoneFrame(slide, x, y, w, h, fill = "#FFFFFF") {
  addShape(slide, {
    geometry: "roundRect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { fill: "#E8DCCB", width: 2 },
  });
  addShape(slide, {
    geometry: "roundRect",
    position: { left: x + w * 0.34, top: y + 20, width: w * 0.32, height: 18 },
    fill: "#EFE6D8",
    line: { fill: "transparent", width: 0 },
  });
}

function slide1(p) {
  const slide = p.slides.add();
  bg(slide, C.cream);
  addShape(slide, { position: { left: 0, top: 0, width: W, height: 1080 }, fill: C.cream });
  addShape(slide, { position: { left: 0, top: 760, width: W, height: 320 }, fill: "#FFE2C4" });
  addShape(slide, { geometry: "arc", position: { left: 1220, top: -150, width: 850, height: 850 }, fill: C.yellow });
  addText(slide, "宠物友好出行服务平台", { left: 116, top: 128, width: 760, height: 44 }, {
    fontSize: 27,
    bold: true,
    color: C.orange,
  });
  addText(slide, "咪咪出行", { left: 108, top: 186, width: 820, height: 132 }, {
    fontSize: 94,
    bold: true,
    color: C.ink,
  });
  addText(slide, "把陪猫照护、政策查询与宠物出行服务，整合到一个真正为养宠人考虑的小程序里。", {
    left: 116,
    top: 344,
    width: 780,
    height: 124,
  }, { fontSize: 34, color: C.text, lineSpacing: 1.22 });
  addPill(slide, "摇人陪咪", 116, 512, 180, C.orange, "#FFFFFF");
  addPill(slide, "政策 + AI", 326, 512, 180, C.blue, "#FFFFFF");
  addPill(slide, "宠物出行", 536, 512, 190, C.green, "#FFFFFF");
  addImage(slide, A.homeCat, { left: 1050, top: 292, width: 520, height: 590 }, "contain", "咪咪出行首页猫咪形象");
  addText(slide, "从一次真实托运经历出发", { left: 116, top: 860, width: 650, height: 46 }, {
    fontSize: 34,
    bold: true,
    color: C.ink,
  });
  addText(slide, "信息分散、流程难确认、服务不够宠物友好，是我们想解决的第一批问题。", {
    left: 116,
    top: 916,
    width: 940,
    height: 58,
  }, { fontSize: 25, color: C.text });
  return slide;
}

function slide2(p) {
  const slide = p.slides.add();
  bg(slide);
  addTop(slide, "01 / 用户痛点", "宠物出行不是一个动作，而是一串焦虑", "真实场景里，主人需要同时处理政策、材料、案例、照护和交通。");
  const items = [
    ["政策分散", "不同区、不同交通方式要求不同，办理点和材料难以快速确认。", C.orange],
    ["流程不确定", "检疫证明、航班/车次、有效期、现场检查等信息需要反复核对。", C.blue],
    ["照护缺保障", "出差远行时，喂猫、陪猫、就医接送多依赖熟人和私人交易。", C.green],
    ["服务不友好", "普通交通和日常服务很少围绕宠物状态、应激和主人安心感设计。", "#B56CFF"],
  ];
  items.forEach(([h, t, color], idx) => {
    const x = idx % 2 === 0 ? 116 : 1004;
    const y = idx < 2 ? 356 : 628;
    addShape(slide, { geometry: "roundRect", position: { left: x, top: y, width: 720, height: 178 }, fill: "#FFFFFF", line: { fill: "#F1E5D8", width: 2 } });
    addShape(slide, { geometry: "ellipse", position: { left: x + 36, top: y + 34, width: 82, height: 82 }, fill: color });
    addText(slide, String(idx + 1), { left: x + 36, top: y + 48, width: 82, height: 48 }, { fontSize: 33, bold: true, color: "#FFFFFF", alignment: "center" });
    addText(slide, h, { left: x + 150, top: y + 34, width: 360, height: 44 }, { fontSize: 32, bold: true, color: C.ink });
    addText(slide, t, { left: x + 150, top: y + 88, width: 510, height: 70 }, { fontSize: 23, color: C.muted, lineSpacing: 1.18 });
  });
  addImage(slide, A.carrier, { left: 1420, top: 68, width: 260, height: 230 }, "cover", "宠物出行经验案例图");
  addFooter(slide, 2);
  return slide;
}

function slide3(p) {
  const slide = p.slides.add();
  bg(slide, "#FFFFFF");
  addTop(slide, "02 / 产品定位", "一站式解决三个原本分散的需求", "项目已经围绕底部导航和移动端原型，形成“首页服务 + 政策查询 + 我的订单/宠物”的小程序结构。");
  addShape(slide, { geometry: "ellipse", position: { left: 715, top: 380, width: 490, height: 490 }, fill: C.cream, line: { fill: C.orange, width: 4 } });
  addText(slide, "咪咪出行", { left: 768, top: 548, width: 384, height: 72 }, { fontSize: 52, bold: true, color: C.ink, alignment: "center" });
  addText(slide, "宠物友好服务平台", { left: 762, top: 626, width: 396, height: 36 }, { fontSize: 25, color: C.muted, alignment: "center" });
  const nodes = [
    ["摇人陪咪", "附近闲人\n上门照护 / 陪同出行 / 就医接送", 185, 450, C.orange],
    ["政策查询", "杭州区县政策库\nAI 搜索 / 案例经验", 1320, 450, C.blue],
    ["宠物出行服务", "专车 / 顺风车\n医院 / 搬家 / 跨城", 720, 812, C.green],
  ];
  nodes.forEach(([h, t, x, y, color]) => {
    addShape(slide, { geometry: "roundRect", position: { left: x, top: y, width: 420, height: 168 }, fill: "#F9FAFC", line: { fill: color, width: 3 } });
    addText(slide, h, { left: x + 34, top: y + 30, width: 350, height: 42 }, { fontSize: 31, bold: true, color });
    addText(slide, t, { left: x + 34, top: y + 82, width: 350, height: 68 }, { fontSize: 22, color: C.text, lineSpacing: 1.22 });
  });
  addText(slide, "整合，是当前最大优势", { left: 112, top: 880, width: 500, height: 44 }, { fontSize: 33, bold: true, color: C.ink });
  addFooter(slide, 3);
  return slide;
}

function slide4(p) {
  const slide = p.slides.add();
  bg(slide);
  addTop(slide, "03 / 核心功能一", "摇人陪咪：把“临时找人帮忙”变成可预约服务", "用户可以找附近闲人照顾猫咪，也可以申请成为闲人，用空闲时间和养宠经验接单。");
  phoneFrame(slide, 116, 340, 440, 600);
  addText(slide, "附近闲人", { left: 158, top: 398, width: 220, height: 42 }, { fontSize: 32, bold: true, color: C.ink });
  const buddies = [
    ["maxi 姐姐", "陪同出行 · 今日可约", "#FFD8B8"],
    ["大大大大华", "上门喂养 · 18:00后可约", "#DCEEFF"],
    ["小红红～", "上门喂养 · 4.8分", "#FFE0EB"],
  ];
  buddies.forEach(([n, d, f], idx) => {
    const y = 478 + idx * 132;
    addShape(slide, { geometry: "roundRect", position: { left: 158, top: y, width: 356, height: 96 }, fill: "#FAFAFB", line: { fill: "#EEE6D8", width: 1 } });
    addShape(slide, { geometry: "ellipse", position: { left: 178, top: y + 20, width: 56, height: 56 }, fill: f });
    addText(slide, n, { left: 250, top: y + 18, width: 220, height: 30 }, { fontSize: 23, bold: true, color: C.text });
    addText(slide, d, { left: 250, top: y + 54, width: 240, height: 28 }, { fontSize: 18, color: C.muted });
  });
  const svc = [
    ["上门喂养", "喂食、换水、猫砂清理"],
    ["陪猫出行", "机场/车站托运陪同"],
    ["陪同看病", "就医接送、现场陪护"],
    ["临时照看", "短时寄看、洗护接送"],
  ];
  svc.forEach(([h, t], idx) => {
    const x = 740 + (idx % 2) * 430;
    const y = 386 + Math.floor(idx / 2) * 210;
    addShape(slide, { geometry: "roundRect", position: { left: x, top: y, width: 340, height: 130 }, fill: "#FFFFFF", line: { fill: "#F0E5D6", width: 2 } });
    addText(slide, h, { left: x + 28, top: y + 24, width: 260, height: 34 }, { fontSize: 29, bold: true, color: C.ink });
    addText(slide, t, { left: x + 28, top: y + 72, width: 270, height: 34 }, { fontSize: 21, color: C.muted });
  });
  addShape(slide, { geometry: "roundRect", position: { left: 740, top: 828, width: 770, height: 92 }, fill: C.ink, line: { fill: "transparent", width: 0 } });
  addText(slide, "关键不是“找人”，而是把信任、服务范围和交易保障做成平台能力。", {
    left: 782,
    top: 854,
    width: 700,
    height: 36,
  }, { fontSize: 25, bold: true, color: "#FFFFFF" });
  addFooter(slide, 4);
  return slide;
}

function slide5(p) {
  const slide = p.slides.add();
  bg(slide, "#F7FBFF");
  addTop(slide, "04 / 核心功能二", "政策查询 + AI：把分散规则变成可问、可查、可参考", "当前项目数据已整理杭州 13 个区县的航空/铁路托运检疫证明办理信息，并预留 AI 问答入口。");
  addShape(slide, { geometry: "roundRect", position: { left: 112, top: 360, width: 640, height: 370 }, fill: "#FFFFFF", line: { fill: "#DCEEFF", width: 2 } });
  addText(slide, "用户只要问", { left: 160, top: 408, width: 260, height: 36 }, { fontSize: 28, bold: true, color: C.blue });
  addShape(slide, { geometry: "roundRect", position: { left: 160, top: 470, width: 500, height: 78 }, fill: "#EEF6FF", line: { fill: "#CFE6FF", width: 1 } });
  addText(slide, "拱墅区猫坐高铁需要什么材料？", { left: 188, top: 493, width: 452, height: 32 }, { fontSize: 24, bold: true, color: C.ink });
  addText(slide, "系统返回材料、办理点、有效期、犬猫差异，以及可参考的真实经验。", {
    left: 160,
    top: 590,
    width: 500,
    height: 70,
  }, { fontSize: 23, color: C.muted, lineSpacing: 1.18 });
  addShape(slide, { geometry: "roundRect", position: { left: 900, top: 350, width: 740, height: 450 }, fill: "#FFFFFF", line: { fill: "#DCEEFF", width: 2 } });
  addText(slide, "政策库当前覆盖", { left: 956, top: 398, width: 340, height: 42 }, { fontSize: 30, bold: true, color: C.ink });
  addText(slide, "13", { left: 956, top: 466, width: 180, height: 126 }, { fontSize: 116, bold: true, color: C.orange });
  addText(slide, "个杭州区县", { left: 1146, top: 512, width: 280, height: 48 }, { fontSize: 35, bold: true, color: C.ink });
  const districts = ["上城", "拱墅", "西湖", "滨江", "萧山", "余杭", "临平", "钱塘", "富阳", "临安", "桐庐", "淳安", "建德"];
  districts.forEach((d, idx) => {
    const x = 956 + (idx % 5) * 126;
    const y = 632 + Math.floor(idx / 5) * 58;
    addShape(slide, { geometry: "roundRect", position: { left: x, top: y, width: 96, height: 38 }, fill: idx % 3 === 0 ? C.cream : "#F6F8FB", line: { fill: "#E6EDF5", width: 1 } });
    addText(slide, d, { left: x, top: y + 8, width: 96, height: 22 }, { fontSize: 17, bold: true, color: C.text, alignment: "center" });
  });
  addImage(slide, A.cert, { left: 1460, top: 112, width: 248, height: 214 }, "cover", "政策经验分享案例图");
  addFooter(slide, 5);
  return slide;
}

function slide6(p) {
  const slide = p.slides.add();
  bg(slide, "#FFFFFF");
  addTop(slide, "05 / 核心功能三", "宠物出行服务：让猫咪出门更方便，也让主人更安心", "围绕医院、搬家、跨城等场景，提供宠物专车和顺风车等更适合宠物的出行选择。");
  addImage(slide, A.windCat, { left: 1110, top: 300, width: 430, height: 490 }, "contain", "宠物顺风车猫咪形象");
  const routes = [
    ["杭州 → 台州", "¥150起", "跨城顺路接送"],
    ["杭州 → 萧山", "¥30", "机场/医院短途"],
    ["拱墅 → 临安", "¥40", "同城转运"],
  ];
  routes.forEach(([r, price, d], idx) => {
    const y = 372 + idx * 150;
    addShape(slide, { geometry: "roundRect", position: { left: 118, top: y, width: 790, height: 112 }, fill: idx === 0 ? C.ink : "#F8FAFC", line: { fill: idx === 0 ? C.ink : "#E8EEF4", width: 2 } });
    addText(slide, r, { left: 160, top: y + 28, width: 310, height: 36 }, { fontSize: 31, bold: true, color: idx === 0 ? "#FFFFFF" : C.ink });
    addText(slide, d, { left: 160, top: y + 70, width: 350, height: 25 }, { fontSize: 19, color: idx === 0 ? "#E8EEF8" : C.muted });
    addText(slide, price, { left: 680, top: y + 34, width: 170, height: 44 }, { fontSize: 34, bold: true, color: idx === 0 ? C.yellow : C.orange, alignment: "right" });
  });
  const steps = ["预约", "确认宠物信息", "接送/陪同", "订单沉淀"];
  steps.forEach((s, idx) => {
    const x = 360 + idx * 300;
    addShape(slide, { geometry: "ellipse", position: { left: x, top: 870, width: 74, height: 74 }, fill: idx === 0 ? C.orange : idx === 1 ? C.blue : idx === 2 ? C.green : "#B56CFF" });
    addText(slide, String(idx + 1), { left: x, top: 886, width: 74, height: 36 }, { fontSize: 27, bold: true, color: "#FFFFFF", alignment: "center" });
    addText(slide, s, { left: x - 74, top: 952, width: 220, height: 28 }, { fontSize: 22, bold: true, color: C.text, alignment: "center" });
  });
  addFooter(slide, 6);
  return slide;
}

function slide7(p) {
  const slide = p.slides.add();
  bg(slide, C.cream);
  addTop(slide, "06 / 竞争优势", "真正的差异点，不是多做几个入口", "核心结论可以落在三个词：整合、壁垒、温度。");
  const cols = [
    ["整合", "三个分散需求被一站式解决：找人陪猫、政策查询、宠物出行。", C.orange],
    ["壁垒", "政策极度分散，AI 搜索 + 结构化政策库 + 成功案例形成复制门槛。", C.blue],
    ["温度", "闲人机制既是供给侧，也是内容贡献和社区信任的起点。", C.green],
  ];
  cols.forEach(([h, t, color], idx) => {
    const x = 142 + idx * 570;
    addText(slide, h, { left: x, top: 380, width: 420, height: 96 }, { fontSize: 76, bold: true, color });
    addShape(slide, { position: { left: x, top: 506, width: 360, height: 6 }, fill: color });
    addText(slide, t, { left: x, top: 560, width: 420, height: 150 }, { fontSize: 27, color: C.text, lineSpacing: 1.24 });
  });
  addImage(slide, A.luggage, { left: 1360, top: 742, width: 300, height: 230 }, "cover", "宠物托运经验图");
  addText(slide, "从工具到平台的关键：让信息、服务和经验互相增强。", {
    left: 142,
    top: 836,
    width: 1010,
    height: 52,
  }, { fontSize: 38, bold: true, color: C.ink });
  addFooter(slide, 7);
  return slide;
}

function slide8(p) {
  const slide = p.slides.add();
  bg(slide, "#F8FAFC");
  addTop(slide, "07 / 早期落地路径", "最大挑战是信任，所以先把服务做实", "建议先用“自营种子服务”跑通标准，再逐步开放闲人平台。");
  const steps = [
    ["1", "自营种子服务", "先覆盖高频城区与高频需求，形成服务 SOP、价格区间和评价样本。", C.orange],
    ["2", "闲人认证体系", "建立身份、养宠经验、服务权限、接单范围、订单评价和异常处理。", C.blue],
    ["3", "政策内容增长", "持续补齐区县/交通方式政策，并把成功案例与避坑经验沉淀为内容资产。", C.green],
    ["4", "开放供给网络", "当标准和信任机制稳定后，扩大闲人端供给，形成地区网络效应。", "#B56CFF"],
  ];
  steps.forEach(([num, h, t, color], idx) => {
    const y = 358 + idx * 146;
    addShape(slide, { geometry: "ellipse", position: { left: 142, top: y + 8, width: 70, height: 70 }, fill: color });
    addText(slide, num, { left: 142, top: y + 23, width: 70, height: 34 }, { fontSize: 27, bold: true, color: "#FFFFFF", alignment: "center" });
    addText(slide, h, { left: 252, top: y, width: 360, height: 38 }, { fontSize: 30, bold: true, color: C.ink });
    addText(slide, t, { left: 252, top: y + 50, width: 1180, height: 54 }, { fontSize: 23, color: C.muted, lineSpacing: 1.18 });
    if (idx < steps.length - 1) {
      addShape(slide, { position: { left: 176, top: y + 92, width: 2, height: 46 }, fill: "#D8DEE8" });
    }
  });
  addShape(slide, { geometry: "roundRect", position: { left: 1420, top: 390, width: 300, height: 300 }, fill: C.ink, line: { fill: "transparent", width: 0 } });
  addText(slide, "先建立信任\n再扩大规模", { left: 1460, top: 482, width: 220, height: 100 }, { fontSize: 34, bold: true, color: "#FFFFFF", alignment: "center", lineSpacing: 1.2 });
  addFooter(slide, 8);
  return slide;
}

function slide9(p) {
  const slide = p.slides.add();
  bg(slide, C.ink);
  addShape(slide, { position: { left: 0, top: 760, width: W, height: 320 }, fill: "#0E5EA8" });
  addImage(slide, A.routeDog, { left: 1340, top: 510, width: 230, height: 230 }, "contain", "宠物出行路线图标");
  addText(slide, "未来愿景", { left: 116, top: 116, width: 320, height: 44 }, { fontSize: 28, bold: true, color: C.yellow });
  addText(slide, "成为真正面向养宠人的\n宠物友好服务平台", {
    left: 108,
    top: 190,
    width: 1240,
    height: 180,
  }, { fontSize: 66, bold: true, color: "#FFFFFF", lineSpacing: 1.14 });
  const promises = [
    ["照护更放心", "临时有事，也能找到有经验、有保障的人帮忙。"],
    ["政策更好查", "材料、地点、流程和案例都在一个入口里。"],
    ["出行更友好", "从医院到跨城，让宠物出门少一点折腾。"],
  ];
  promises.forEach(([h, t], idx) => {
    const x = 118 + idx * 560;
    addText(slide, h, { left: x, top: 500, width: 420, height: 44 }, { fontSize: 34, bold: true, color: idx === 0 ? C.orange2 : idx === 1 ? C.yellow : "#7FE3A0" });
    addText(slide, t, { left: x, top: 560, width: 420, height: 78 }, { fontSize: 24, color: "#D9E6F4", lineSpacing: 1.2 });
  });
  addText(slide, "谢谢大家", { left: 116, top: 872, width: 520, height: 74 }, { fontSize: 58, bold: true, color: "#FFFFFF" });
  addText(slide, "咪咪出行 · 项目介绍", { left: 116, top: 950, width: 480, height: 36 }, { fontSize: 24, color: "#C8D7EA" });
  return slide;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(SCRATCH, { recursive: true });
  imageHydrations.length = 0;
  const p = Presentation.create({ slideSize: { width: W, height: H } });
  [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9].forEach((fn) => fn(p));

  const assets = [];
  for (const item of imageHydrations) {
    const bytes = await fs.readFile(item.pathName);
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    assets.push({
      assetId: item.img.data.imageReference.id,
      data: new Uint8Array(bytes),
      contentType: isPng ? "image/png" : "image/jpeg",
    });
  }
  p.hydrateImageAssets(assets);

  const pptx = await PresentationFile.exportPptx(p);
  await pptx.save(path.join(OUT, "mimi-travel-intro.pptx"));

  for (let i = 0; i < p.slides.items.length; i += 1) {
    const blob = await p.slides.items[i].export({ format: "png" });
    await fs.writeFile(path.join(SCRATCH, `slide-${String(i + 1).padStart(2, "0")}.png`), Buffer.from(await blob.arrayBuffer()));
    const layout = await p.slides.items[i].export({ format: "layout" });
    await fs.writeFile(path.join(SCRATCH, `slide-${String(i + 1).padStart(2, "0")}.layout.json`), Buffer.from(await layout.arrayBuffer()));
  }
  console.log(JSON.stringify({
    pptx: path.join(OUT, "mimi-travel-intro.pptx"),
    slides: p.slides.items.length,
    previews: path.join(SCRATCH, "slide-*.png"),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
