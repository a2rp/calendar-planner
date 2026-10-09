import { useEffect, useState } from "react";
import CalendarPlanner from "./components/calendarPlanner/index.jsx";
import BackToTop from "./components/backToTop/index.jsx";
import SiteFooter from "./components/siteFooter/index.jsx";
import SiteHeader from "./components/siteHeader/index.jsx";
import styles from "./App.module.css";
const App = () => {
 const [showBackToTop, setShowBackToTop] = useState(false);
 useEffect(() => { const update = () => setShowBackToTop(window.scrollY > 50); window.addEventListener("scroll", update, { passive: true }); update(); return () => window.removeEventListener("scroll", update); }, []);
 return <div className={styles.appShell} id="top"><SiteHeader title="Calendar Planner" mark="C" repoUrl="https://github.com/a2rp/calendar-planner" navItems={[["Month","#month"],["Plans","#plans"]]} /><main className={styles.pageContent}><CalendarPlanner /></main><SiteFooter repoUrl="https://github.com/a2rp/calendar-planner" /><BackToTop visible={showBackToTop} /></div>;
};
export default App;