# AirTrace - IoT Air Leak Detection System

AirTrace is an Industrial IoT solution designed to monitor air pressure, detect leaks, and calculate financial and energy losses in compressed air systems in real-time. 

This repository is structured as a monorepo containing the hardware code, backend server, and the frontend web dashboard.

##  Project Structure

- **`backend/`**: Node.js server that connects to an MQTT broker to receive live telemetry from the ESP32. It analyzes the data using a custom leak detection engine, stores the history in MongoDB Atlas, and streams real-time updates to the dashboard via Socket.IO.
- **`dashboard/`**: React web application (built with Vite and TailwindCSS) that visualizes live sensor data, historical trends, and instant leak alerts.
- **`arduino/`**: C/C++ code for the ESP32 microcontroller. It interfaces with pressure, flow, and temperature sensors and publishes data to the MQTT broker.
- **`sources/`**: Additional project resources, diagrams, and documentation.

##  Key Features

- **Real-Time Monitoring:** Live telemetry streaming using WebSockets (Socket.IO).
- **Leak Detection Engine:** Continuously analyzes pressure drops over time using linear regression to identify and classify leaks.
- **Financial Impact Tracking:** Calculates energy loss (kWh) and financial loss (LKR) dynamically.
- **Temperature Compensation:** Adjusts raw absolute pressure readings based on ambient temperature using Charles's Law.
- **Historical Data:** Stores and retrieves sensor readings using MongoDB for long-term trend analysis.

##  Running Locally

To run the full stack locally on your machine, you need [Node.js](https://nodejs.org/) installed.

### 1. Database Setup
Ensure you have your MongoDB Atlas credentials saved safely in `dashboard/atlas-credentials.env` (this file is ignored by Git for security):
```env
MONGODB_USERNAME="your_user"
MONGODB_PASSWORD="your_password"
MONGODB_URI="mongodb+srv://..."
```

### 2. Start the Backend
Open a terminal and run the following commands:
```bash
cd backend
npm install
npm start
```
The backend will connect to your MQTT broker, hook up to MongoDB, and start the API server on `http://localhost:3000`.

### 3. Start the Dashboard
Open a **new** terminal window and run:
```bash
cd dashboard
npm install
npm run dev
```
This will start the Vite development server. Open the URL provided in the terminal (usually `http://localhost:5173`) in your browser to view the dashboard!

## 📡 Hardware (ESP32)

Navigate to the `arduino/` directory and flash the code to your ESP32 device using the Arduino IDE. 
- Ensure the ESP32 is configured to connect to your local Wi-Fi.
- Ensure the ESP32 is pointing to the correct MQTT broker URL.
- The ESP32 will automatically begin publishing telemetry data, which your local backend will instantly pick up.
