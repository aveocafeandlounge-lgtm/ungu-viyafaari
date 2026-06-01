# Ungu Viyafaari 🍲

A complete business management system for Maldivian home-based food entrepreneurs to manage products, shops, batches, collections, recipes, and reports.

## Features ✨

- **Bilingual Support**: Full English and Dhivehi (RTL) language support
- **Product Management**: Add, edit, delete products with image upload and categories
- **Shop Management**: Manage retail partners and customer information
- **Batch Tracking**: Track production batches with expiry dates and low stock alerts
- **Collections**: Record payments and track outstanding balances
- **Recipe Management**: Store traditional Maldivian recipes with ingredients and steps
- **Dashboard**: Real-time analytics with charts for sales, collections, and performance
- **Reports**: Generate sales, collection, inventory, and profit reports with PDF/CSV export
- **PWA Support**: Installable mobile app with offline support
- **Role-Based Access**: Admin and staff roles with different permissions

## Tech Stack 🛠️

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Firebase Authentication, Firebase Firestore
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router
- **PWA**: Service Worker with offline support

## Prerequisites 📋

- Node.js 18+ 
- npm or yarn
- Firebase account

## Installation 🚀

1. Clone the repository:
```bash
git clone <repository-url>
cd ungu-viyafaari
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Enable Storage (for images)
   - Copy your Firebase config

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Start the development server:
```bash
npm run dev
```

## Deployment 📦

### Vercel Deployment

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Firebase Setup for Production

1. Enable Firestore rules for security
2. Configure Authentication providers
3. Set up Storage rules
4. Enable App Check (optional)

#### Deploy Firebase Rules (Optional)

To deploy Firestore and Storage rules automatically:

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Deploy rules:
```bash
firebase deploy --only firestore:rules,storage:rules
```

The rules are defined in `firestore.rules` and `storage.rules` files.

## Project Structure 📁

```
src/
├── components/       # Reusable UI components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── BottomNav.tsx
│   └── Layout.tsx
├── contexts/         # React contexts
│   ├── AuthContext.tsx
│   └── LanguageContext.tsx
├── lib/             # Utilities and configurations
│   ├── firebase.ts
│   ├── i18n.ts
│   └── registerSW.ts
├── pages/           # Page components
│   ├── Dashboard.tsx
│   ├── Products.tsx
│   ├── Shops.tsx
│   ├── Batches.tsx
│   ├── Collections.tsx
│   ├── Recipes.tsx
│   ├── Reports.tsx
│   ├── Settings.tsx
│   ├── Login.tsx
│   └── Register.tsx
├── App.tsx          # Main app with routing
└── main.tsx         # Entry point
```

## Firebase Collections 🔥

- `users` - User accounts and roles
- `products` - Product inventory
- `shops` - Retail partners
- `batches` - Production batches
- `collections` - Payment records
- `recipes` - Recipe database
- `reports` - Generated reports

## Usage 📖

### Authentication

1. Register a new account
2. Admin can assign roles (admin/staff)
3. Staff have limited access to settings

### Managing Products

- Navigate to Products page
- Click "Add Product" to create new products
- Fill in product details in both English and Dhivehi
- Upload product images
- Set price, stock, and category

### Managing Shops

- Navigate to Shops page
- Add retail partners with contact details
- Track total purchases and outstanding balances

### Batch Management

- Create production batches for specific shops
- Set production and expiry dates
- Track remaining stock
- Receive low stock alerts

### Collections

- Record payments from shops
- Track outstanding balances
- View payment history

### Reports

- Generate sales, collection, inventory, and profit reports
- Export reports as PDF or CSV
- Filter by date range

## Language Support 🌐

The app supports:
- English (default)
- Dhivehi (with full RTL support)

Switch languages using the language toggle in the header.

## PWA Installation 📱

The app is installable as a PWA:
- On mobile: Tap "Add to Home Screen" in browser menu
- On desktop: Click install icon in address bar

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License.

## Support 💬

For support, email support@unguviyafaari.mv or open an issue in the repository.
