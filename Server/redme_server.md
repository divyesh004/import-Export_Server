## 1. Overview

This document outlines the frontend requirements for the **B2B Import-Export Website & Dashboard**. The frontend will be developed using **React.js, Material UI (MUI), and Tailwind CSS**, ensuring a high-performance, user-friendly experience. The platform includes distinct interfaces for **Buyers, Sellers, Sub-Admins, and Admins**, with a powerful **dashboard** for managing business operations.

---

## 2. Tech Stack

- **Frontend Framework**: React.js (Vite for performance optimization)
- **UI Library**: Material UI (MUI) for pre-designed, modern components
- **Styling**: Tailwind CSS for utility-first responsive designs
- **State Management**: Context API 
- **Routing**: React Router for navigation
- **API Calls**: Axios for RESTful API integration
- **Authentication**: Supabase Auth (JWT-based secure login)
- **Charts & Analytics**: Recharts.js for interactive dashboards
- **Notifications**: React Toastify for real-time updates
- **Animations**: Framer Motion for smooth UI interactions
- **Dark Mode**: Integrated theme switcher for better accessibility
- **Skeleton Loading**: MUI Skeleton components for better UX

---

## 3. Project Structure

frontend/  
│── src/  
│   ├── components/        # Reusable UI components  
│   │   ├── buttons/       # Custom buttons  
│   │   ├── modals/        # Pop-up modals  
│   │   ├── forms/         # Input forms & validation  
│   │   ├── cards/         # Product & user cards  
│   │   ├── skeletons/     # Skeleton loaders for UI  
│   ├── pages/             # Page-based components  
│   ├── hooks/             # Custom React hooks  
│   ├── context/           # Context API (Global State)  
│   ├── utils/             # Utility functions  
│   ├── services/          # API services (Axios)  
│   ├── assets/            # Images, icons, etc.  
│   ├── App.js             # Main App component  
│   ├── index.js           # Entry point  
│── public/                # Static files  
│── tailwind.config.js     # Tailwind CSS config  
│── package.json           # Dependencies & scripts

---

## 4. UI Components & Pages (With Skeleton Loaders)

### 4.1 Public Pages

- **Home Page** → Modern, responsive landing page with banners & category highlights.  
  - **Skeleton**: Placeholder loading for banner, featured products.  
  - **AI-powered Product Recommendations**: Personalized suggestions shown on homepage.

- **About Us Page** → Information about the platform, mission, and benefits.

- **Contact Page** → Inquiry form, live chat, and support details.

- **FAQ Page** → Answers to common buyer & seller queries.

- **Search Results Page** → Searchable product list with filters.  
  - **AI-powered Product Recommendations**: Alongside or below the search results, similar or trending products are shown.  
  - **Skeleton**: Placeholder product cards while search results load.

---

### 4.2 Authentication & User Management

- **Login Page** → Secure email/password login with Supabase authentication.  
  - **Skeleton**: Placeholder loading for form fields.

- **Signup Page** → Multi-step registration for Buyers, Sellers, Admins & Sub-Admins.  
  - **Industry field required for Sub-Admin** (industry selection is mandatory).  
  - **Skeleton**: Multi-step form skeleton loader.

- **Forgot Password Page** → Reset password via email verification.

- **Reset Password Page** → Secure form for setting a new password.

- **Profile Page** → User details, avatar upload, role-based settings.  
  - **Skeleton**: Placeholder for user avatar, profile details.

---

### 4.3 Product Management (Seller/Admin/Sub-Admin)

- **Product List Page** → Dynamic grid/list view with filtering & sorting.  
  - **Skeleton**: Product card placeholders until data loads.

- **Product Details Page** → Full-page product descriptions with Q&A.  
  - **Skeleton**: Placeholder for product image, description, and reviews.

- **Add Product Page** → Seller dashboard to add products with image upload.

- **Edit Product Page** → Sellers & Admins/Sub-Admins can modify product details.

- **Product Approval Page**  
  - Admin: Can view and manage all products.  
  - Sub-Admin: Can view **only products of their assigned industry**.  
    - Can approve, reject, and edit **only within their industry**.  
    - Cannot see or manage products from other industries.

---

### 4.4 Order Management

- **Orders List (Buyer/Seller/Admin/Sub-Admin View)** → Status-based order tracking.  
  - **Skeleton**: Placeholder rows for loading orders.

- **Order Details Page** → Invoice generation, tracking & updates.  
  - **Skeleton**: Placeholder for order details.

- **Checkout Page** → Secure, step-by-step order placement with progress bar.  
  - **Skeleton**: Placeholder for checkout summary & payment details.

---

### 4.5 Cart & Checkout

- **Cart Page** → Dynamic cart with quantity management & price calculations.  
  - **Skeleton**: Placeholder for cart items.

- **Checkout Page** → Address autofill, payment gateway simulation.

---

### 4.6 Admin, Sub-Admin & Seller Dashboard

- **Admin Dashboard** → Full access dashboard  
  - Features:
    - Manage users (ban/unban, change roles)
    - View & approve/reject **all products**
    - Platform analytics and graphs
    - Handle buyer-seller Q&A
    - Generate reports

- **Sub-Admin Dashboard** → Same layout as Admin but access is **industry-based only**  
  - Can manage products, orders, and Q&A **within their assigned industry**
  - Cannot create/remove Admins
  - Cannot access data from other industries

- **Seller Dashboard** → Product management, order fulfillment, Q&A responses.

- **Reports & Analytics** → Graphs for revenue, orders & active users.  
  - **Skeleton**: Placeholder for charts before data loads.

- **User Management Panel** → Admin & Sub-Admin can ban/unban users, change roles.  
  - **Skeleton**: Placeholder user list.

---

### 4.7 Question & Answer System

- **Product Q&A Section** → Buyers can ask product-related questions.

- **Answer Management** → Sellers/Admins/Sub-Admins can reply in a thread format.  
  - Sub-Admins can only reply to products from their assigned industry.  
  - **Skeleton**: Placeholder for Q&A loading state.

---

## 5. API Integration

- **Use Axios** for all API requests.
- **JWT Authentication** for securing endpoints.
- **Global Error Handling** using Axios interceptors.
- **Toast Notifications** for success/failure messages.

---

## 6. User Experience (UX) Enhancements

- **Dark Mode Toggle** → User preference saved in local storage.
- **Lazy Loading** → Optimize performance with React.lazy() & Suspense.
- **Smooth Animations** → Framer Motion for page transitions.
- **Real-time Notifications** → Live order updates, messages, & alerts.
- **Mobile-First Design** → Fully responsive for all screen sizes.
- **Skeleton Loading** → Seamless experience with placeholders before data loads.

---

## 7. Deployment & Hosting

- **Frontend Hosting**: Vercel / Netlify

- **Environment Variables**:
  - `VITE_API_BASE_URL` → Backend API URL
  - `VITE_SUPABASE_URL` → Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` → Supabase public key

---

## 8. Implementation Plan

1. **Setup React with Tailwind & MUI** → Configure project structure.
2. **Implement Authentication & Role-Based Access** → Secure login/signup & dashboard.
3. **Develop Product & Order Pages** → Product listing, details & management.
4. **Implement Cart & Checkout Functionality** → Smooth order placement flow.
5. **Build Admin, Sub-Admin & Seller Dashboard** → Feature-rich dashboards with analytics.
6. **Enhance UX & UI** → Add animations, dark mode, real-time updates.
7. **Implement Forgot & Reset Password Flow** → Secure password recovery.
8. **Testing & Deployment** → Optimize performance, fix bugs, and deploy.

---

## 9. Features Roadmap

✅ Basic authentication & role management  
✅ Product listing, filtering, and search  
✅ Order placement & status tracking  
✅ Responsive UI with Tailwind & MUI  
✅ Skeleton loading for better UX  
✅ Sub-Admin Role with Admin Privileges (Industry-Based)  
✅ AI-powered product recommendations  
🔜 Chat between buyers and sellers  
🔜 Voice-based product search

---

## 🔒 Role-based Access Summary

| Role        | Access Level                                           |
|-------------|--------------------------------------------------------|
| Admin       | Full control (all users, all industries)               |
| Sub-Admin   | Full control **within assigned industry only**         |
| Seller      | Product & order management                             |
| Buyer       | Browse & order products                                |

---

This document ensures the frontend is scalable, maintainable, and optimized for modern UX with full support for **Admin & Industry-Based Sub-Admin** roles. 🚀
