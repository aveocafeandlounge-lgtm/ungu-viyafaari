# Ungu Viyafaari 🍲

A complete business management system for Maldivian home-based food entrepreneurs to manage inventory, recipes, production batches, sales, collections, and reports.

## Features ✨

- **Bilingual Support**: Full English and Dhivehi (RTL) language support
- **Inventory Management**: Track purchases with cost calculation, suppliers, and usable quantities
- **Recipe Management**: Store traditional Maldivian recipes with ingredients from inventory
- **Batch Production**: Create production batches from recipes with automatic inventory deduction
- **Sales Management**: Sell batches to shops with payment tracking
- **Collections**: Record payments from shops and track outstanding balances
- **Shop Management**: Manage retail partners and customer information
- **Dashboard**: Real-time analytics with charts for sales, collections, and performance
- **Money Tracking**: Track inventory funds with top-up functionality
- **Reports**: Generate sales, collection, inventory, and profit reports with real data
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

#### Deploy Firestore Rules (Required)

To deploy Firestore rules manually via Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database → Rules tab
4. Copy the contents of `firestore.rules` file
5. Paste and publish the rules

The rules are defined in `firestore.rules` file and include:
- Users collection (admin/staff roles)
- Purchases collection (inventory)
- Shops collection (retail partners)
- Recipes collection (recipe database)
- Batches collection (production batches)
- Sales collection (sales records)
- Collections collection (payment records)
- Money collection (inventory funds)

#### Deploy Firebase Rules via CLI (Optional)

If you have Firebase CLI configured:

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Add project:
```bash
firebase use --add
```

4. Deploy rules:
```bash
firebase deploy --only firestore:rules
```

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
│   ├── Shops.tsx
│   ├── Purchases.tsx
│   ├── Recipes.tsx
│   ├── Batches.tsx
│   ├── Sales.tsx
│   ├── Collections.tsx
│   ├── Reports.tsx
│   ├── Settings.tsx
│   ├── Login.tsx
│   └── Register.tsx
├── App.tsx          # Main app with routing
└── main.tsx         # Entry point
```

## Firebase Collections 🔥

- `users` - User accounts and roles
- `purchases` - Inventory purchases with cost calculation
- `shops` - Retail partners
- `recipes` - Recipe database with ingredients
- `batches` - Production batches linked to recipes
- `sales` - Sales records linked to batches
- `collections` - Payment records linked to sales
- `money` - Inventory funds tracking

## Usage 📖

### Authentication

1. Register a new account
2. Admin can assign roles (admin/staff)
3. Staff have limited access to settings

### Workflow Overview

The application follows this workflow:
1. **Purchases** → Add inventory items with cost calculation
2. **Recipes** → Create recipes using inventory ingredients
3. **Batches** → Create production batches from recipes (auto-deducts inventory)
4. **Sales** → Sell batches to shops
5. **Collections** → Record payments from shops
6. **Reports** → View comprehensive reports

### Managing Purchases (Inventory)

- Navigate to Purchases page
- Add inventory items with supplier details
- Set price per unit, cutting charges, and waste percentage
- System automatically calculates usable quantity and effective cost per unit
- Track inventory levels

### Managing Recipes

- Navigate to Recipes page
- Create recipes using ingredients from your purchases
- Select ingredients from dropdown (auto-fills unit and cost)
- Set quantities with decimal support (e.g., 13g, 0.03kg)
- System calculates total cost based on inventory prices

### Managing Batches

- Navigate to Batches page
- Create production batches from recipes
- Select recipe (auto-fills ingredients from recipe)
- Set batch quantity and expiry date
- System automatically deducts ingredients from inventory
- Track remaining stock and receive low stock alerts

### Managing Sales

- Navigate to Sales page
- Sell batches to shops
- Select batch (linked to recipe)
- Set quantity and unit price
- Track payment status (pending, partial, paid)

### Managing Collections

- Navigate to Collections page
- Record payments from shops
- Link collections to specific sales
- Track outstanding balances
- System updates sale payment status automatically

### Managing Shops

- Navigate to Shops page
- Add retail partners with contact details
- Track total purchases and outstanding balances

### Money Tracking

- Navigate to Dashboard
- Track inventory funds
- Top-up inventory funds with personal money
- View available funds for purchases

### Reports

- Navigate to Reports page
- Generate sales, collection, inventory, and profit reports
- View real data from all operations
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
