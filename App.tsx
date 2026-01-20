// App v2.3.0
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import PostDetailsPage from "./pages/PostDetailsPage";
import { TripzyProvider } from "./hooks/useTripzy";
import { AuthProvider } from "./hooks/useAuth";
import { LanguageProvider } from "./localization/LanguageContext";
import { ToastProvider } from "./hooks/useToast";
import { SettingsProvider } from "./hooks/useSettings";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import { UserRole } from "./types";

// Lazy Load Admin Pages (Heavy)
const AdminLayout = React.lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboardPage = React.lazy(
  () => import("./pages/admin/AdminDashboardPage"),
);
const ManagePostsPage = React.lazy(
  () => import("./pages/admin/ManagePostsPage"),
);
const EditPostPage = React.lazy(() => import("./pages/admin/EditPostPage"));
const ManageUsersPage = React.lazy(
  () => import("./pages/admin/ManageUsersPage"),
);
const SettingsPage = React.lazy(() => import("./pages/admin/SettingsPage"));
const ProfilePage = React.lazy(() => import("./pages/admin/ProfilePage"));
const ManageMediaPage = React.lazy(
  () => import("./pages/admin/ManageMediaPage"),
);
const ImportMediaPage = React.lazy(
  () => import("./pages/admin/ImportMediaPage"),
);
const AIStudioPage = React.lazy(() => import("./pages/admin/AIStudioPage"));
const ManageSubscribersPage = React.lazy(
  () => import("./pages/admin/ManageSubscribersPage"),
);
const ManageCommentsPage = React.lazy(
  () => import("./pages/admin/ManageCommentsPage"),
);
const NewsletterCampaignsPage = React.lazy(
  () => import("./pages/admin/NewsletterCampaignsPage"),
);
const CampaignEditorPage = React.lazy(
  () => import("./pages/admin/CampaignEditorPage"),
);
const SEOHealthPage = React.lazy(() => import("./pages/admin/SEOHealthPage"));

// Lazy Load Public Secondary Pages
const PlanTripPage = React.lazy(() => import("./pages/PlanTripPage"));
const SearchPage = React.lazy(() => import("./pages/SearchPage"));
const ArchivePage = React.lazy(() => import("./pages/ArchivePage"));
const AuthorPage = React.lazy(() => import("./pages/AuthorPage"));
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const ContactPage = React.lazy(() => import("./pages/ContactPage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const PrivacyPolicyPage = React.lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = React.lazy(
  () => import("./pages/TermsOfServicePage"),
);
const Sitemap = React.lazy(() => import("./pages/Sitemap"));
const SDKTestPage = React.lazy(() => import("./pages/SDKTestPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

import ScrollToTop from "./components/common/ScrollToTop";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Analytics from "./components/common/Analytics";
import CookieConsent from "./components/common/CookieConsent";
import { HelmetProvider } from "react-helmet-async";
import Spinner from "./components/common/Spinner";

// Loading Fallback
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <Spinner />
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <ScrollToTop />
          <LanguageProvider>
            <ToastProvider>
              <SettingsProvider>
                <AuthProvider>
                  <TripzyProvider>
                    <Analytics />
                    <CookieConsent />
                    <React.Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route
                          path="/post/:postId"
                          element={<PostDetailsPage />}
                        />
                        <Route
                          path="/author/:authorSlug"
                          element={<AuthorPage />}
                        />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/sitemap.xml" element={<Sitemap />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/plan" element={<PlanTripPage />} />
                        <Route path="/test-sdk" element={<SDKTestPage />} />
                        <Route
                          path="/privacy"
                          element={<PrivacyPolicyPage />}
                        />
                        <Route path="/terms" element={<TermsOfServicePage />} />
                        <Route
                          path="/category/:categoryName"
                          element={<ArchivePage type="category" />}
                        />
                        <Route
                          path="/tag/:tagName"
                          element={<ArchivePage type="tag" />}
                        />

                        {/* Admin Routes */}
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute
                              allowedRoles={[
                                UserRole.Administrator,
                                UserRole.Editor,
                                UserRole.Author,
                              ]}
                            >
                              <AdminLayout />
                            </ProtectedRoute>
                          }
                        >
                          <Route
                            index
                            element={<Navigate to="dashboard" replace />}
                          />
                          <Route
                            path="dashboard"
                            element={<AdminDashboardPage />}
                          />
                          <Route path="posts" element={<ManagePostsPage />} />
                          <Route path="posts/new" element={<EditPostPage />} />
                          <Route
                            path="posts/edit/:postId"
                            element={<EditPostPage />}
                          />
                          <Route path="profile" element={<ProfilePage />} />
                          <Route
                            path="media"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.Administrator,
                                  UserRole.Editor,
                                  UserRole.Author,
                                ]}
                              >
                                <ManageMediaPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="import"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.Administrator,
                                  UserRole.Editor,
                                ]}
                              >
                                <ImportMediaPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="users"
                            element={
                              <ProtectedRoute
                                allowedRoles={[UserRole.Administrator]}
                              >
                                <ManageUsersPage />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="ai-studio"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.Administrator,
                                  UserRole.Editor,
                                  UserRole.Author,
                                ]}
                              >
                                <AIStudioPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="seo-health"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.Administrator,
                                  UserRole.Editor,
                                ]}
                              >
                                <SEOHealthPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="settings"
                            element={
                              <ProtectedRoute
                                allowedRoles={[UserRole.Administrator]}
                              >
                                <SettingsPage />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="newsletter-campaigns"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.Administrator,
                                  UserRole.Editor,
                                ]}
                              >
                                <NewsletterCampaignsPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="newsletter/new"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.Administrator,
                                  UserRole.Editor,
                                ]}
                              >
                                <CampaignEditorPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="newsletter/edit/:id"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.Administrator,
                                  UserRole.Editor,
                                ]}
                              >
                                <CampaignEditorPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="subscribers"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.Administrator,
                                  UserRole.Editor,
                                ]}
                              >
                                <ManageSubscribersPage />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="comments"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.Administrator,
                                  UserRole.Editor,
                                ]}
                              >
                                <ManageCommentsPage />
                              </ProtectedRoute>
                            }
                          />
                        </Route>

                        {/* 404 Catch-all */}
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </React.Suspense>
                  </TripzyProvider>
                </AuthProvider>
              </SettingsProvider>
            </ToastProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
