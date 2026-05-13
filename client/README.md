# client 目录职责说明

当前前端按“应用壳层 / 页面 / 业务特性 / 共享能力 / 参考资料 / 构建产物”拆分，便于继续演进和多人协作。

## 目录划分

```text
client/
  index.html                  # HTML 模板
  package.json                # 前端包定义
  rsbuild.config.ts           # 构建配置
  tsconfig.json               # TypeScript 配置
  public/assets/              # 运行时静态资源
  src/
    app/                      # 应用入口与全局壳层
      App.tsx
      main.tsx
      styles/
    pages/                    # 路由级页面 UI
      home/
      publish/
      orders/
      messages/
      policy/
      profile/
    widgets/                  # 跨页面复用的结构组件
      navigation/
      screens/
    features/                 # 业务特性模块
      mimi-dashboard/
        config/
        lib/
        model/
    shared/                   # 共享 API、资源、基础 UI、全局类型
      api/
      lib/
      types/
      ui/
  references/                 # 非生产参考原型与设计素材
    咪咪出行/
  dist/                       # 构建产物
```

## 分层规则

- `src/app`：只负责装配应用，不承载具体业务细节。
- `src/pages`：只负责页面编排和展示，尽量不堆积复杂状态。
- `src/widgets`：放跨页面可复用的导航、空状态、登录/加载屏等结构组件。
- `src/features`：放完整业务特性，本项目当前核心是 `mimi-dashboard`。
- `src/shared`：放通用 API、资源地址、通用 UI 和类型声明，避免业务反向依赖页面。
- `references`：仅作为布局和视觉参考，不参与正式 H5 构建。
- `dist`：构建输出目录，不作为源码维护。

## 当前约定

- 新页面优先放在 `src/pages/<page>/ui`。
- 新业务状态、规则、转换逻辑优先放在 `src/features/<feature>/model` 或 `lib`。
- 新的通用组件、图片解析、接口封装优先放在 `src/shared`。
