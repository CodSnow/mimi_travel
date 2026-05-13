import React, { useState, useEffect, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { AppState, Order } from '@mimi/shared';
import { HtmlCompat } from '../../compat';
import { miniFetch } from '../../api';

const { 
  section: Section, article: Article, div: Div, span: Span, 
  h1: H1, h2: H2, h3: H3, p: P, img: Img, main: Main, 
  nav: Nav, form: Form, label: Label, strong: Strong, 
  small: Small, em: Em, i: I, button: Button, input: Input 
} = HtmlCompat;

const ASSET_URL = 'http://127.0.0.1:8809/assets'; // Using local docker nginx server for assets

const assets = {
  homeCat: `${ASSET_URL}/home-cat.png`,
  policyCat: `${ASSET_URL}/policy-qa-cat.svg`,
  bannerCat: `${ASSET_URL}/banner-suitcase-cat.svg`,
  windCat: `${ASSET_URL}/wind-cat.png`,
  routeDog: `${ASSET_URL}/route-dog.png`,
  loginCat: `${ASSET_URL}/login-cat.svg`,
  adoptCat: `${ASSET_URL}/banner-round-cat.svg`,
  postCarrier: `${ASSET_URL}/post-carrier.jpg`,
  postCert: `${ASSET_URL}/post-cert.jpg`,
  postLuggage: `${ASSET_URL}/post-luggage.jpg`,
};

const postCards = [
  { image: assets.postCarrier, title: "✈️登机咯～小猫乘客一位 一个半月飞两次的淡定小猫", author: "捏捏弟弟", date: "2024-10-20", likes: 89, theme: "carrier" },
  { image: assets.postCert, title: "杭州萧山机场川航超详细猫咪托运攻略", author: "十柒", date: "2025-07-19", likes: 1281, theme: "cert" },
  { image: assets.postLuggage, title: "第一次随机宠物托运顺利落地，在机场好多问题其实…", author: "胖头鱼", date: "2024-09-19", likes: 61, theme: "luggage" },
];

const bannerDetails = {
  rail: {
    eyebrow: "今日更新", title: "高铁终于可以带猫啦！", subtitle: "携宠进站要求更清晰，出门前先看这份要点。", image: assets.bannerCat, tone: "rail",
    sections: [
      { title: "适合哪些场景", text: "长途跨城、需要高铁接驳、希望把宠物交给正规托运流程的出行。" },
      { title: "准备材料", text: "建议提前准备宠物免疫证明、身份证件、宠物运输箱，并在出发前确认车站实际要求。" },
      { title: "办理提醒", text: "小猫通常不能直接随身进入乘客车厢，需要按铁路托运规则办理。以铁路12306及车站现场规定为准。" },
    ],
    cta: "查看杭州政策",
  },
  adopt: {
    eyebrow: "领养代替购买", title: "喵咪领养专区！", subtitle: "给小猫一个家之前，先把准备工作做扎实。", image: assets.adoptCat, tone: "adopt",
    sections: [
      { title: "领养前准备", text: "提前准备猫粮、猫砂、猫包、基础体检预算，并确认家里有稳定照护时间。" },
      { title: "新手建议", text: "刚到家的小猫需要安静空间，先适应环境，再逐步接触家庭成员。" },
      { title: "出行支持", text: "领养后如需跨城接送、陪同或托运，可以在咪咪出行里继续预约相关服务。" },
    ],
    cta: "去领养",
  },
};

const routes = [
  { id: "r1", icon: "🐕", title: "杭州——台州", price: "¥150起", desc: "顺路接送 · 建议提前30分钟预约", detail: "行程：杭州-台州 时间：今天 18:30 预估费用：¥168（含服务费）", amount: 150, departRank: 2, largePet: true },
  { id: "r2", icon: "🐈", title: "杭州——萧山", price: "¥30", desc: "顺路接送 · 晚高峰需提前预约", detail: "行程：杭州-萧山 时间：明天 09:10 预估费用：¥35", amount: 30, departRank: 3, largePet: false },
  { id: "r3", icon: "🦮", title: "拱墅——临安", price: "¥40", desc: "顺路接单 · 需提前预约", detail: "行程：拱墅-临安 时间：周六 14:00 预估费用：¥46", amount: 40, departRank: 1, largePet: true },
];

const buddies = [
  { name: "maxi 姐姐", rating: "4.9分", note: "陪同出行", time: "今日可约", avatar: "👩🏻‍🦰", tone: "#ffd8b8" },
  { name: "大大大大华", rating: "4.8分", note: "上门喂养", time: "18:00后可约", avatar: "👨🏻", tone: "#dcecff" },
  { name: "小红红～", rating: "4.8分", note: "上门喂养", time: "18:00后可约", avatar: "👩🏻", tone: "#ffe0eb" },
  { name: "死蚊子", rating: "4.8分", note: "上门喂养", time: "18:00后可约", avatar: "🧑🏻", tone: "#e5f7df" },
  { name: "毛毛队长", rating: "4.8分", note: "上门喂养", time: "18:00后可约", avatar: "👨🏻‍🦱", tone: "#eee4ff" },
];

const districts = ["上城区", "拱墅区", "西湖区", "滨江区", "萧山区", "余杭区", "临平区", "钱塘区", "富阳区", "临安区", "桐庐县", "淳安县", "建德市"];
const petRingColors = ["#a98af8", "#ff7a3d", "#f5b400", "#59b6ff"];

const orderTabs: [string, string][] = [
  ["all", "全部"], ["pending", "待确认"], ["booked", "进行中"], ["done", "已完成"], ["cancelled", "已取消"],
];

const orderStatusMap: Record<string, any> = {
  pending: { label: "待确认", desc: "订单已提交，等待服务方确认", tone: "warm" },
  booked: { label: "进行中", desc: "服务方已确认，请按约定时间出行", tone: "blue" },
  done: { label: "已完成", desc: "服务已完成，感谢使用咪咪出行", tone: "green" },
  cancelled: { label: "已取消", desc: "订单已取消，如有疑问可联系客服", tone: "gray" },
};

function getOrderStatus(order: Order) {
  return orderStatusMap[order.tab] || orderStatusMap.pending;
}

const Index = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [page, setPage] = useState('home');
  const [homeTab, setHomeTab] = useState('buddy');
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedBannerId, setSelectedBannerId] = useState('rail');
  const [windFilter, setWindFilter] = useState('price');
  
  const [policyQuestion, setPolicyQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");
  const [policyKnowledge, setPolicyKnowledge] = useState<any>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [selectedPolicyDoc, setSelectedPolicyDoc] = useState<any>(null);
  
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedBuddyIndex, setSelectedBuddyIndex] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [orderTab, setOrderTab] = useState("all");
  const [selectedPetIndex, setSelectedPetIndex] = useState(0);

  const showToast = useCallback((msg: string) => {
    Taro.showToast({ title: msg, icon: 'none' });
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await miniFetch('/api/state');
      if (!res.ok) throw new Error("Backend unavailable");
      const data = await res.json() as AppState;
      setState(data);
      setIsLoggedIn(true);
    } catch (error) {
      console.warn("Backend unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateState = useCallback(async (updates: Partial<AppState>) => {
    if (!state) return;
    const nextState = { ...state, ...updates };
    setState(nextState);
    try {
      await miniFetch('/api/state', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (e) {}
  }, [state]);

  const loadKnowledge = useCallback(async (district?: string) => {
    setPolicyLoading(true);
    try {
      const url = district ? `/api/knowledge?district=${district}` : `/api/knowledge`;
      const res = await miniFetch(url);
      const data = await res.json();
      setPolicyKnowledge(data);
    } catch {
      // ignore
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  const askAi = async (q: string) => {
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await miniFetch('/api/ask', {
        method: 'POST',
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setAiAnswer(data);
    } catch {
      setAiAnswer({ answer: "无法连接问答服务。" });
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && !state) {
      setLoading(true);
      fetchState();
    }
  }, [isLoggedIn, state, fetchState]);

  useEffect(() => {
    if (page === 'policy') {
      loadKnowledge(state?.district);
    }
  }, [page, state?.district, loadKnowledge]);

  if (!isLoggedIn) {
    return (
      <Section className="login-page">
        <Div className="login-hero">
          <Img src={assets.loginCat} />
          <Span>宠物友好出行</Span>
        </Div>
        <H1>欢迎来到咪咪出行</H1>
        <P>带猫猫狗狗出门这件事，我们一起变简单一点。</P>
        <Form className="login-form">
          <Label>账号<Input placeholder="请输入账号" /></Label>
          <Label>密码<Input type="password" placeholder="请输入密码" /></Label>
          <Button className="primary-btn login-btn" onClick={() => setIsLoggedIn(true)}>登录</Button>
        </Form>
        <P className="login-tip">当前为演示版，任意账号和密码都可以登录。</P>
      </Section>
    );
  }

  if (loading || !state) return <Div className="loading">加载中...</Div>;

  const getUserContactText = () => {
    const name = state.user.nickname.trim();
    const phone = state.user.phone.trim();
    if (name && phone) return `${name}　${phone}`;
    if (name) return name;
    if (phone) return phone;
    return "请先完善联系人";
  };

  const getFilteredRoutes = () => {
    const list = windFilter === "largePet" ? routes.filter(r => r.largePet) : [...routes];
    if (windFilter === "price" || windFilter === "largePet") return list.sort((a, b) => a.amount - b.amount);
    return list.sort((a, b) => a.departRank - b.departRank);
  };

  const renderNav = () => (
    <Nav className="bottom-bar">
      <Button className={`nav-item ${page === 'home' ? 'active' : ''}`} onClick={() => setPage('home')}>
        <Span className="nav-icon icon-store"></Span><Span>首页</Span>
      </Button>
      <Button className={`nav-item ${page === 'policy' ? 'active' : ''}`} onClick={() => setPage('policy')}>
        <Span className="nav-icon icon-heart"></Span><Span id="thirdNavLabel">政策</Span>
      </Button>
      <Button className={`nav-item ${page === 'orders' ? 'active' : ''}`} onClick={() => setPage('orders')}>
        <Span className="nav-icon icon-orders"></Span><Span>订单</Span>
      </Button>
      <Button className={`nav-item ${page === 'profile' ? 'active' : ''}`} onClick={() => setPage('profile')}>
        <Span className="nav-icon icon-user"></Span><Span>我的</Span>
      </Button>
    </Nav>
  );

  const renderHero = () => (
    <>
      <Div className="location-row">
        <Button className="location" onClick={() => setShowDistrictPicker(!showDistrictPicker)}>
          <Span>杭州{state.district}</Span><Span className="location-chevron">⌄</Span>
        </Button>
        {showDistrictPicker && (
          <Section className="district-picker">
            {districts.map((item) => (
              <Button key={item} className={state.district === item ? "active" : ""} onClick={() => { updateState({ district: item }); setShowDistrictPicker(false); showToast(`已切换到杭州${item}`); }}>{item}</Button>
            ))}
          </Section>
        )}
      </Div>
      <Section className="hero-carousel">
        <Div className="hero-track" style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>
          <Article className="hero hero-rail" onClick={() => { setSelectedBannerId("rail"); setPage("bannerDetail"); }}>
            <Span className="eyebrow">📰最新咪咪消息</Span>
            <H1>高铁终于可以带猫啦！</H1>
            <P>你知道携宠进站的规范吗？</P>
            <Img className="hero-cat rail-cat" src={assets.bannerCat} />
          </Article>
        </Div>
      </Section>
      <Div className="tabs">
        <Button className={`tab ${homeTab === "buddy" ? "active" : ""}`} onClick={() => setHomeTab("buddy")}>👩 摇人陪咪</Button>
        <Button className={`tab ${homeTab !== "buddy" ? "active" : ""}`} onClick={() => setHomeTab("car")}>咪咪出行</Button>
      </Div>
    </>
  );

  const renderHome = () => {
    if (homeTab === "buddy") {
      const featuredBuddies = [0, 1, 3].map(i => ({ ...buddies[i], index: i }));
      return (
        <Div className="page home">
          {renderHero()}
          <Button className="idle-home-cta" onClick={() => showToast("闲人申请开发中")}>
            <Strong>💰 成为闲人，赚生活费！</Strong><Span>立即申请 <I>→</I></Span>
          </Button>
          <H2 className="home-section-title">{state.district}推荐闲人</H2>
          <Section className="buddy-list">
            {featuredBuddies.map((buddy) => {
              const booked = state.bookedBuddies.includes(buddy.index);
              return (
                <Article key={buddy.index} className="buddy-card" onClick={() => showToast("功能开发中")}>
                  <Div className="buddy-avatar" style={{ '--avatar-bg': buddy.tone } as any}><Span>{buddy.avatar}</Span></Div>
                  <Div className="buddy-info">
                    <H3>{buddy.name}</H3><P>{buddy.rating}｜{buddy.note}｜{buddy.time}</P>
                  </Div>
                  <Button className={`book-btn ${booked ? "booked" : ""}`} onClick={(e: any) => { e.stopPropagation(); }}>{booked ? "已预约" : "预约"}</Button>
                </Article>
              );
            })}
          </Section>
        </Div>
      );
    }
    return (
      <Div className="page home">
        {renderHero()}
        <Section className="ride-card">
          <Span className="route-line"></Span><Span className="mark start">发</Span><Span className="mark end">收</Span>
          <Div className="route-input-group start-field">
            <Input className="route-input pickup-input" value={state.pickup} onChange={(e: any) => updateState({ pickup: e.target.value })} placeholder="输入出发地" />
            <Span className="readonly-contact">{getUserContactText()}</Span>
          </Div>
          <Input className="route-input destination-input" value={state.destination} onChange={(e: any) => updateState({ destination: e.target.value })} placeholder="输入宠物目的地" />
        </Section>
        <Button className="primary-btn" onClick={() => showToast("功能正在开发中")}>马上叫车</Button>
        <H2 className="home-section-title wind-section-title">🚙咪咪顺风车</H2>
        {getFilteredRoutes().map(route => {
          const booked = state.bookedRoutes.includes(route.id);
          return (
            <Section key={route.id} className="route-card" onClick={() => showToast("路线开发中")}>
              <Div className="route-img">{route.id === "r1" ? <Img src={assets.routeDog} /> : <Span>{route.icon}</Span>}</Div>
              <Div className="route-info">
                <Span className="price">{route.price}</Span><H3>{route.title}</H3><P className="small">{route.desc}</P>
                <Div className="route-actions">
                  <Button className={`mini-btn ${booked ? "booked" : ""}`}>{booked ? "已预约" : "立即预约"}</Button>
                  <Button className="mini-btn ghost">🤔找他砍价</Button>
                </Div>
              </Div>
            </Section>
          )
        })}
      </Div>
    );
  };

  const renderPolicyPage = () => {
    const visibleDistricts = policyKnowledge?.districts?.length ? policyKnowledge.districts : districts;
    const docs = policyKnowledge?.documents || [];
    return (
      <Div className="page policy">
        <Section className="policy-qa-hero">
          <Img src={assets.policyCat} />
          <H1>政策 AI 智能问答</H1>
          <P>检索杭州托运政策</P>
          <Form className="policy-search">
            <Input name="question" value={policyQuestion} onChange={(e: any) => setPolicyQuestion(e.target.value)} placeholder="输入你的问题" />
            <Button onClick={() => { if (policyQuestion) askAi(policyQuestion); }}>➤</Button>
          </Form>
        </Section>
        <Section className="ai-answer-card">
          <Div className="ai-answer-head">
            <Strong>✦ {aiLoading ? "检索中" : "AI 回答"}</Strong>
            <Button onClick={() => { Taro.setClipboardData({ data: aiAnswer?.answer || "" }); }}>⧉ 复制</Button>
          </Div>
          <Div className="answer-body">
            {aiLoading ? <P>正在检索政策知识库并生成答案...</P> : aiAnswer ? <P style={{ whiteSpace: 'pre-wrap' }}>{aiAnswer.answer}</P> : <P>可以直接问：萧山区小猫托运需要什么材料？钱塘区哪里能办检疫证明？猫坐高铁要不要狂犬抗体报告？</P>}
          </Div>
          {aiAnswer?.contexts?.length > 0 && (
            <Div className="rag-sources">
              <Strong>引用政策</Strong>
              {aiAnswer.contexts.map((doc: any) => (
                <Button key={doc.id} onClick={() => { setSelectedPolicyId(doc.id); setPage('detail'); }}>{doc.title}<Small>{doc.summary}</Small></Button>
              ))}
            </Div>
          )}
          <Div className="answer-foot">
            <Small>DeepSeek + RAG</Small>
            <Div>
              <Button className={aiFeedback === "useful" ? "active" : ""} onClick={() => { setAiFeedback(aiFeedback === "useful" ? "" : "useful"); showToast("感谢反馈"); }}>{aiFeedback === "useful" ? "♥" : "♡"} 有用</Button>
              <Button className={aiFeedback === "useless" ? "active" : ""} onClick={() => { setAiFeedback(aiFeedback === "useless" ? "" : "useless"); showToast("已收到反馈"); }}>{aiFeedback === "useless" ? "♥" : "♡"} 没用</Button>
            </Div>
          </Div>
        </Section>
        <Section className="policy-knowledge-card">
          <Div className="policy-knowledge-head">
            <H2>知识库 · 杭州区县政策</H2>
            <Button>共 {docs.length || 0} 条</Button>
          </Div>
          <Div className="policy-district-row">
            {visibleDistricts.map((item: string) => (
              <Button key={item} className={`knowledge-chip ${state.district === item ? "active" : ""}`} onClick={() => updateState({ district: item })}>{item}</Button>
            ))}
          </Div>
          <Div className="knowledge-list">
            {policyLoading ? <Div className="knowledge-loading">正在载入政策知识库...</Div> : docs.map((doc: any, index: number) => (
              <Button key={doc.id} className="knowledge-row" onClick={() => { setSelectedPolicyId(doc.id); setSelectedPolicyDoc(doc); setPage('detail'); }}>
                <Span className="knowledge-icon">{index + 1}</Span>
                <Span><Strong>{doc.title}</Strong><Small>{doc.summary || doc.materials}</Small></Span>
                <Em>›</Em>
              </Button>
            ))}
          </Div>
        </Section>
      </Div>
    );
  };

  const renderProfile = () => (
    <Div className="page profile">
      <Section className="profile-hero">
        <Div className="profile-row">
          <Div className="avatar">{state.user.avatar || "👤"}</Div>
          <Div>
            <Div className="profile-name-row"><H1>{state.user.nickname || "待完善昵称"}</H1></Div>
            <P>{state.user.phone || "待填写手机号"}</P>
          </Div>
        </Div>
        <Button className="profile-edit" onClick={() => showToast("功能开发中")}>完善资料</Button>
      </Section>
      <Section className="pet-status-card multi pet-strip">
        <Div className="pet-section-head">
          <H2>我的宠物</H2><Button onClick={() => showToast("功能开发中")}>查看全部 <Span>→</Span></Button>
        </Div>
        <Div className="pet-avatar-row">
          <Button className="pet-add-card" onClick={() => showToast("功能开发中")}>
            <Span>+</Span><Strong>添加咪</Strong>
          </Button>
          {state.pets.map((pet, i) => (
            <Button key={i} className="pet-avatar-card">
              <Span className="pet-round-avatar" style={{ '--ring': petRingColors[i % petRingColors.length] } as any}>{pet.avatar}</Span>
              <Strong>{pet.name || "未命名"}</Strong>
            </Button>
          ))}
        </Div>
      </Section>
      <Section className="profile-menu-card">
        <Button className="profile-menu-row" onClick={() => setPage('orders')}><Span className="profile-menu-icon order">📋</Span><Strong>我的订单</Strong><Em>›</Em></Button>
        <Button className="profile-menu-row" onClick={() => showToast("收藏开发中")}><Span className="profile-menu-icon favorite">⭐</Span><Strong>我的收藏</Strong><Em>›</Em></Button>
      </Section>
    </Div>
  );

  const renderOrders = () => {
    const filteredOrders = orderTab === "all" ? state.orders : state.orders.filter(o => o.tab === orderTab);
    return (
      <Div className="page">
        <H1 className="page-title">订单</H1>
        <Div className="order-tabs">
          {orderTabs.map(([key, label]) => (
            <Button key={key} className={orderTab === key ? "active" : ""} onClick={() => setOrderTab(key)}>{label}</Button>
          ))}
        </Div>
        {filteredOrders.length ? filteredOrders.map((order, i) => {
          const status = getOrderStatus(order);
          return (
            <Section key={i} className={`order-card ${status.tone}`}>
              <Div>
                <Span className="order-status">{status.label}</Span><H3>{order.title}</H3>
                <P className="small">#{order.id} · {order.desc}</P>
              </Div>
              <Button className="mini-btn ghost">查看</Button>
            </Section>
          )
        }) : (
          <Section className="cat-empty">
            <Div className="cat-empty-illustration"><Img src={assets.homeCat} /></Div>
            <H2>还没有订单</H2><P>去顺风车里预约一单试试，猫猫已经准备好出发啦。</P>
            <Button className="mini-btn" onClick={() => { setHomeTab("wind"); setPage("home"); }}>去预约</Button>
          </Section>
        )}
      </Div>
    );
  };

  const renderCurrentPage = () => {
    switch (page) {
      case 'home': return renderHome();
      case 'policy': return renderPolicyPage();
      case 'profile': return renderProfile();
      case 'orders': return renderOrders();
      default: return <Div className="page">页面开发中... <Button onClick={()=>setPage('home')}>返回首页</Button></Div>;
    }
  };

  return (
    <Div className="screen phone">
      <Main className="content">{renderCurrentPage()}</Main>
      {renderNav()}
    </Div>
  );
};

export default Index;
