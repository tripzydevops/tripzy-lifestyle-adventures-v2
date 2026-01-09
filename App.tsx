// App v2.3.0
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { LanguageProvider } from "./localization/LanguageContext";
import HomePage from "./pages/HomePage";
import PostDetailsPage from "./pages/PostDetailsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ManagePostsPage from "./pages/admin/ManagePostsPage";
import EditPostPage from "./pages/admin/EditPostPage";
import ManageUsersPage from "./pages/admin/ManageUsersPage";
import SettingsPage from "./pages/admin/SettingsPage";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import { UserRole } from "./types";
import { ToastProvider } from "./hooks/useToast";
import { SettingsProvider } from "./hooks/useSettings";
import Sitemap from "./pages/Sitemap";
import ProfilePage from "./pages/admin/ProfilePage";
import SearchPage from "./pages/SearchPage";
import ArchivePage from "./pages/ArchivePage";
import ManageMediaPage from "./pages/admin/ManageMediaPage";
import ImportMediaPage from "./pages/admin/ImportMediaPage";
import AIStudioPage from "./pages/admin/AIStudioPage";
import AuthorPage from "./pages/AuthorPage";
import PlanTripPage from "./pages/PlanTripPage";
import SDKTestPage from "./pages/SDKTestPage";

import { TripzyProvider } from "./hooks/useTripzy";

import ManageSubscribersPage from "./pages/admin/ManageSubscribersPage";
import ManageCommentsPage from "./pages/admin/ManageCommentsPage";
import NewsletterCampaignsPage from "./pages/admin/NewsletterCampaignsPage";
import CampaignEditorPage from "./pages/admin/CampaignEditorPage";
import SEOHealthPage from "./pages/admin/SEOHealthPage";

import ScrollToTop from "./components/common/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <LanguageProvider>
        <ToastProvider>
          <SettingsProvider>
            <AuthProvider>
              <TripzyProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/post/:postId" element={<PostDetailsPage />} />
                  <Route path="/author/:authorSlug" element={<AuthorPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/sitemap.xml" element={<Sitemap />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/plan" element={<PlanTripPage />} />
                  <Route path="/test-sdk" element={<SDKTestPage />} />
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
                    <Route path="dashboard" element={<AdminDashboardPage />} />
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
                        <ProtectedRoute allowedRoles={[UserRole.Administrator]}>
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
                        <ProtectedRoute allowedRoles={[UserRole.Administrator]}>
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
                </Routes>
              </TripzyProvider>
            </AuthProvider>
          </SettingsProvider>
        </ToastProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
