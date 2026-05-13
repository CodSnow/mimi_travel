import React from 'react';
import { tabs } from '../features/mimi-dashboard/config/constants';
import { useMimiAppController } from '../features/mimi-dashboard/model/useMimiAppController';
import { FlowScreen } from '../pages/flow/ui/FlowScreen';
import { HomePage } from '../pages/home/ui/HomePage';
import { MessagesPage } from '../pages/messages/ui/MessagesPage';
import { OrdersPage } from '../pages/orders/ui/OrdersPage';
import { PolicyPage } from '../pages/policy/ui/PolicyPage';
import { ProfilePage } from '../pages/profile/ui/ProfilePage';
import { PublishPage } from '../pages/publish/ui/PublishPage';
import { BottomTabBar } from '../widgets/navigation/BottomTabBar';
import { TopBar } from '../widgets/navigation/TopBar';
import { AuthScreen } from '../widgets/screens/AuthScreen';
import { LoadingScreen } from '../widgets/screens/LoadingScreen';

const App: React.FC = () => {
  const controller = useMimiAppController();
  const { ui, auth, profile, dashboard } = controller;

  if (ui.booting) {
    return <LoadingScreen />;
  }

  if (!ui.authenticated) {
    return (
      <AuthScreen
        busyKey={ui.busyKey}
        loginDraft={auth.loginDraft}
        onChange={auth.setLoginDraft}
        onSubmit={auth.handleLogin}
      />
    );
  }

  return (
    <div className="app-shell">
      {ui.showTopBar ? (
        <TopBar
          onRefresh={() => void dashboard.syncDashboard()}
          title={tabs.find((item) => item.key === ui.activeTab)?.label || '咪咪出行'}
        />
      ) : null}

      {ui.errorMessage ? <div className="alert-banner">{ui.errorMessage}</div> : null}

      <main className="app-main">
        {ui.screen !== 'tab' ? (
          <FlowScreen controller={controller} />
        ) : (
          <>
            {ui.activeTab === 'home' ? <HomePage controller={controller} /> : null}
            {ui.activeTab === 'publish' ? <PublishPage controller={controller} /> : null}
            {ui.activeTab === 'orders' ? <OrdersPage controller={controller} /> : null}
            {ui.activeTab === 'messages' ? <MessagesPage controller={controller} /> : null}
            {ui.activeTab === 'policy' ? <PolicyPage controller={controller} /> : null}
            {ui.activeTab === 'mine' ? <ProfilePage controller={controller} /> : null}
          </>
        )}
      </main>

      <BottomTabBar activeTab={ui.activeTab} onChange={ui.setActiveTab} />

      {ui.toast ? <div className="toast show">{ui.toast}</div> : null}
      {ui.loading ? <div className="floating-loader">同步中...</div> : null}
    </div>
  );
};

export default App;
