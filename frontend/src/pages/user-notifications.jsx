import { NotificationsPage } from "../components/NotificationsPage";
import logo from "../assets/medilink-logo.png";

export default function UserNotifications() {
  return (
    <NotificationsPage
      backPath="/user/dashboard"
      backLabel="Dashboard"
      logo={logo}
      accentColor="#059669"
    />
  );
}
