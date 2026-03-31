import Navbar from './Navbar';
import Footer from './Footer';
import PendingApprovalBanner from './PendingApprovalBanner';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background font-inter">
      <Navbar />
      <PendingApprovalBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;