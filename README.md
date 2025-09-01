# ValRadiant - Valorant Companion Desktop App

A production-ready Electron desktop application for Valorant players to view real-time match information, player stats, and match history.

## Features

- **Real-time Match Detection**: Automatically detects when you're in a Valorant match
- **Player Information**: View teammate and enemy player ranks, agents, and stats
- **Match History**: Browse your recent matches with detailed statistics
- **Rank Tracking**: Monitor your competitive rank and RR changes
- **Dark/Light Mode**: Toggle between dark and light themes
- **Cross-Platform**: Available for Windows, macOS, and Linux

## Installation

### Download Pre-built Binaries

1. Go to the [Releases](https://github.com/yoyosingh123/valradiant/releases) page
2. Download the appropriate version for your operating system:
   - **Windows**: `ValRadiant-Setup-x.x.x.exe` (installer) or `ValRadiant-x.x.x-portable.exe` (portable)
   - **macOS**: `ValRadiant-x.x.x.dmg`
   - **Linux**: `ValRadiant-x.x.x.AppImage` or `valradiant_x.x.x_amd64.deb`

### Build from Source

#### Prerequisites

- Node.js 18+ and npm
- Git

#### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yoyosingh123/valradiant.git
   cd valradiant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   # Build for your current platform
   npm run build:electron
   
   # Or build for specific platforms
   npm run build:win    # Windows
   npm run build:mac    # macOS
   npm run build:linux  # Linux
   ```

4. The built application will be in the `dist-electron` directory.

## Development

### Running in Development Mode

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

This will start both the Vite development server and the Electron app.

### Project Structure

```
src/
├── components/          # React components
├── services/           # API services and utilities
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── constants/          # Application constants
└── styles/             # CSS and styling

public/
├── electron.cjs        # Main Electron process
├── preload.js          # Preload script for security
└── rank-icons/         # Rank icon assets

supabase/
└── migrations/         # Database migrations
```

## Usage

1. **Launch Valorant**: Make sure Valorant is running before starting the app
2. **Start the App**: Launch ValRadiant from your desktop or start menu
3. **Join a Match**: The app will automatically detect when you enter a match
4. **View Information**: See real-time player information during agent select and in-game

### Features Overview

- **Match Detection**: Automatically detects pregame (agent select) and live matches
- **Player Stats**: View ranks, recent performance, and agent preferences
- **Match History**: Click on any player to view their recent match history
- **Your Stats**: Access your own match history and rank progression
- **Updates**: Built-in update checker to stay current with the latest features

## Security & Privacy

- **No Login Required**: The app uses Riot's local API, no credentials needed
- **Local Data**: All sensitive data stays on your machine
- **Official APIs**: Only uses official Riot Games APIs
- **Safe to Use**: Complies with Riot's terms of service

## System Requirements

### Minimum Requirements
- **OS**: Windows 10, macOS 10.14, or Ubuntu 18.04+
- **RAM**: 4GB
- **Storage**: 200MB free space
- **Network**: Internet connection required

### Recommended Requirements
- **OS**: Windows 11, macOS 12+, or Ubuntu 20.04+
- **RAM**: 8GB
- **Storage**: 500MB free space

## Troubleshooting

### Common Issues

1. **"Please launch Valorant to use this app"**
   - Make sure Valorant is running and you're logged in
   - Try restarting both Valorant and the app

2. **No match detected**
   - Ensure you're in an actual match (not practice range)
   - The app detects matches during agent select and in-game phases

3. **Database connection failed**
   - Check your internet connection
   - Try restarting the app

### Getting Help

- Check the [FAQ](https://github.com/yoyosingh123/valradiant/wiki/FAQ) in our wiki
- Report bugs on our [Issues](https://github.com/yoyosingh123/valradiant/issues) page
- Join our community discussions

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

ValRadiant is not affiliated with Riot Games. Valorant is a trademark of Riot Games, Inc.

## Acknowledgments

- Built with [Electron](https://electronjs.org/) and [React](https://reactjs.org/)
- Uses [Supabase](https://supabase.com/) for backend services
- Rank icons and game data from [Valorant API](https://valorant-api.com/)
- Special thanks to the Valorant community for feedback and support