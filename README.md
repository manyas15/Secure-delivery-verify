# SecureDrop - Anti-Fraud Delivery Verification System

[![React](https://img.shields.io/badge/React-18.x-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![Twilio](https://img.shields.io/badge/Twilio-SMS/OTP-red?logo=twilio)](https://twilio.com/)

**SecureDrop** is a revolutionary delivery verification system that prevents fake delivery agents and OTP scams by implementing on-the-spot QR code generation and instant verification. The system ensures customers can verify authentic deliveries in just a few seconds, preventing potential cyber crimes.

---

## 👥 Project Team

This project is a collaborative effort developed by **2 team members** who worked together to create a comprehensive anti-fraud delivery solution.

---

## 🚀 How SecureDrop Works

### 🚚 **For Delivery Agents**
1. **Arrive at Customer Location** - Agent reaches the delivery address with assigned order
2. **Generate QR On-Spot** - Agent generates fresh QR code directly at customer's doorstep using the mobile app
3. **Display QR to Customer** - Show the generated QR code on agent's device for customer to scan
4. **Complete Verification** - Wait for customer to scan and complete OTP verification
5. **Order Transfer Option** - If unable to complete delivery, request order transfer to available agents

### 📱 **For Customers** 
1. **Scan QR Code** - Use any device with camera to scan the QR code shown by delivery agent
2. **View Agent Details** - See complete agent information and verification status instantly
3. **Instant OTP Delivery** - Receive SMS OTP the second you scan the QR code
4. **Quick Verification** - Enter OTP in your device to confirm authentic delivery
5. **Delivery Confirmed** - Take just a few seconds to verify and prevent cyber crime

### 📊 **For Administrators**
1. **Order Assignment** - Distribute orders to verified delivery agents
2. **Real-time Monitoring** - Track ongoing deliveries and verification processes
3. **Transfer Management** - Handle agent requests for order transfers
4. **Fraud Prevention** - Monitor system for suspicious activities and patterns

---

## 🛡️ Anti-Fraud Security Features

### **Prevents Fake Delivery Boys**
- **On-Spot QR Generation**: QR codes can only be generated at the actual delivery location
- **Agent Identity Transparency**: Customers see complete agent details before confirming delivery
- **Physical Presence Required**: System ensures agent is physically present at customer's location

### **Eliminates OTP Scams**
- **Instant OTP Delivery**: OTP sent immediately upon QR scan, no pre-planning possible
- **QR Temperation Handling**: Built-in QR code expiry and environmental resistance
- **No Pre-shared Codes**: No opportunity for scammers to obtain OTP in advance

### **Quick Verification Process**
- **"Few Seconds Can Verify or Get You Into Cyber Crime"** - Our core message
- **User-Friendly Scanner**: Built-in app scanner handles all QR code processing
- **Immediate Feedback**: Instant agent details display upon successful scan
- **Simple OTP Entry**: Straightforward verification process on customer's device

---

## 🔧 Technology Stack

### **Frontend**
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible UI components

### **Backend**
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Relational database
- **Supabase Edge Functions** - Serverless API endpoints

### **External Services**
- **Twilio Verify API** - SMS OTP verification
- **QR Code Libraries** - Generation and scanning

---

## 📱 System Workflow

```
1. Agent Arrives → 2. Generate QR On-Spot → 3. Customer Scans QR
                                                      ↓
6. Delivery Complete ← 5. Customer Enters OTP ← 4. Instant OTP Sent
```

### **Order Management Flow**
```
Orders Assigned → Agent Delivery → Unable to Complete? → Request Transfer → Reassign
      ↓               ↓                                         ↓
   To Agents    →  QR Generation  →  Success? → Complete    Available Agent
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm** or **bun** package manager
- **Supabase CLI** (for local development)
- **Twilio Account** (for SMS services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aadidayal/SecureDrop.git
   cd SecureDrop
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file with:
   ```env
   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
   
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

---

## 🔒 Security & Fraud Prevention

- **Physical Presence Verification**: QR generation requires agent to be at delivery location
- **Real-time Agent Transparency**: Customer sees agent details instantly upon scan
- **Instant OTP Generation**: No time for fraudsters to intercept or plan attacks
- **QR Code Temperation**: Built-in handling for environmental factors affecting QR codes
- **Order Transfer Security**: Secure system for reassigning orders to available agents
- **Cyber Crime Prevention**: Quick verification process minimizes exposure to fraud

---

## 📖 API Documentation

### **QR Code & Verification**
- `POST /functions/v1/generate-qr` - Generate QR code at delivery location
- `POST /functions/v1/scan-qr` - Process QR scan and trigger OTP
- `GET /functions/v1/agent-details` - Fetch agent information for verification

### **OTP & Authentication**
- `POST /functions/v1/generate-otp` - Generate SMS OTP upon QR scan
- `POST /functions/v1/verify-otp` - Verify customer OTP and confirm delivery

### **Order Management**
- `GET /functions/v1/orders` - Fetch assigned orders for agents
- `POST /functions/v1/transfer-order` - Request order transfer
- `PUT /functions/v1/orders/:id/status` - Update delivery status

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For support and questions:
- **Issues**: [GitHub Issues](https://github.com/Aadidayal/SecureDrop/issues)
- **Documentation**: [Project Wiki](https://github.com/Aadidayal/SecureDrop/wiki)

---

## 🙏 Acknowledgments

- **Supabase** for excellent backend-as-a-service platform
- **Twilio** for reliable SMS and verification services
- **React Community** for amazing libraries and tools
- **Cyber Security Awareness** for inspiring anti-fraud measures

---

**Built with ❤️ by our development team**

*"Few seconds to verify, prevent cyber crime" - SecureDrop's mission to make deliveries safer for everyone*
