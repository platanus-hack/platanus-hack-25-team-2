# ConnectHub - Social Media Platform

A modern, responsive website for a new social media platform built with React.js and Tailwind CSS. ConnectHub is designed to be the newest and easiest way for professionals, researchers, and students aged 18-40 to connect and build meaningful relationships.

## 🎨 Design Features

- **Clean, Modern Interface**: Built with React functional components
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Custom Color Palette**:
  - Bright Yellow: `#F0E491`
  - Lime Green: `#BBC863`
  - Forest Green: `#658C58`
  - Dark Green: `#31694E`

## 🚀 Features

- **Hero Section**: Eye-catching landing page with compelling messaging about easy connections
- **About Us**: Detailed information about the platform's mission and values
- **Team Section**: Showcase of the talented people behind the project
- **Testimonials**: Real user feedback and success stories
- **Responsive Navigation**: Mobile-friendly menu with smooth scrolling
- **Modern Footer**: Complete with social links and site navigation

## 📋 Prerequisites

- **NVM (Node Version Manager)** - Recommended for managing Node.js versions
- Node.js **v20.x** (automatically managed by NVM)
- npm **v10.x** (comes with Node.js v20)

## 🛠️ Installation

### Setting up NVM (If not installed)

1. Install NVM:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   ```

2. Load NVM in your current session:
   ```bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   ```

3. Restart your terminal or run:
   ```bash
   source ~/.bashrc
   ```

### Project Setup

1. Navigate to the project directory:
   ```bash
   cd /home/yngeek/Desktop/Proyectos/web-linkedin-lentes
   ```

2. Use the correct Node.js version (automatically reads from `.nvmrc`):
   ```bash
   nvm use
   ```
   This will use Node.js v20 as specified in the `.nvmrc` file.

3. Install dependencies (if needed):
   ```bash
   npm install
   ```

## 🏃‍♂️ Running the Application

### Option 1: Using the Startup Script (Recommended)

The easiest way to start the development server:

```bash
./start-dev.sh
```

This script will:
- ✅ Check if NVM is installed
- ✅ Automatically load the correct Node.js version
- ✅ Install dependencies if needed
- ✅ Start the Vite development server

### Option 2: Manual Start

Make sure you're using the correct Node.js version:

```bash
nvm use
```

Then start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

**Note**: The `.nvmrc` file ensures you're always using Node.js v20, which is compatible with all project dependencies.

## 🏗️ Building for Production

Create an optimized production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📁 Project Structure

```
web-linkedin-lentes/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx       # Navigation bar with mobile menu
│   │   ├── Hero.jsx          # Hero section with CTA
│   │   ├── About.jsx         # About Us section
│   │   ├── Team.jsx          # Team members showcase
│   │   ├── Testimonials.jsx  # User testimonials
│   │   └── Footer.jsx        # Footer with links
│   ├── App.jsx               # Main application component
│   ├── main.jsx              # Application entry point
│   └── index.css             # Tailwind CSS imports
├── index.html                # HTML template
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.js         # PostCSS configuration
└── package.json              # Project dependencies
```

## 🎯 Target Audience

- **Workers**: Professionals looking to expand their network
- **Researchers**: Academics seeking collaboration opportunities
- **Students**: Young professionals building their careers
- **Age Range**: 18-40 years old

## 🌟 Key Sections

### Hero Section
- Engaging headline: "Connect Like Never Before"
- Clear value proposition
- Call-to-action buttons
- Feature highlights with icons

### About Us
- Platform mission and vision
- Key benefits and features
- Trust indicators (user stats, countries, connections)

### Team
- 6 team members with photos and bios
- Social media links for each member
- "Join Our Team" call-to-action

### Testimonials
- 6 customer testimonials
- User profiles with photos and credentials
- 5-star ratings
- Final call-to-action for sign-ups

## 🛠️ Technologies Used

- **React 19.2.0**: Modern UI library with functional components
- **Vite 7.2.4**: Fast build tool and dev server (latest version)
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **PostCSS**: CSS processing tool
- **Node.js 20.19.5**: JavaScript runtime (managed by NVM)
- **NVM**: Node Version Manager for consistent Node.js versions

## 🔧 Why NVM?

This project uses NVM (Node Version Manager) to ensure consistent Node.js versions across different environments:

✅ **Avoid Dependency Conflicts**: Different Node.js versions can cause compatibility issues
✅ **Easy Version Switching**: Switch between Node.js versions for different projects
✅ **Team Consistency**: Everyone on the team uses the same Node.js version
✅ **Latest Features**: Use Node.js v20 for optimal Vite performance and modern features
✅ **Automatic Version Detection**: The `.nvmrc` file automatically loads the correct version

## 📱 Responsive Design

The website is fully responsive with breakpoints optimized for:
- Mobile devices (320px and up)
- Tablets (768px and up)
- Desktops (1024px and up)
- Large screens (1280px and up)

## 🎨 Customization

To customize the color palette, edit `tailwind.config.js`:

```javascript
colors: {
  'brand-yellow': '#F0E491',
  'brand-lime': '#BBC863',
  'brand-green': '#658C58',
  'brand-dark-green': '#31694E',
}
```

---

Built with ❤️ by the ConnectHub team

