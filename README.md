# Bad Art

A serious place for unserious art.

## Overview

Bad Art is a web application that allows users to create, save, and share digital artwork. Built with Next.js, the platform provides an intuitive drawing canvas powered by Konva.js along with Lens Protocol integration for social features and content publishing.

## Features

- **Drawing Canvas**: To create digital artwork 
- **Lens Protocol Integration**:
  - Authenticate with your Lens account
  - Publish artwork directly to Lens
  - Share your creations with the Lens community
  - View other users' artwork
- **Derive**: Create derivative works from existing artwork

## Technology Stack

- **Drawing Engine**: Konva.js & react-konva for canvas manipulation
- **Authentication & Social**: Lens Protocol for authentication and social features
- **Storage**: Grove storage for artwork persistence
- **Styling**: Tailwind CSS with Radix UI components
- **Frontend**: Next.js 15, React 19, TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/bun
- A wallet compatible with Lens Protocol

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   bun i
   ```
3. Set up environment variables:
   ```
   cp .env.example .env
   ```

4. Start the development server:
   ```
   bun dev
   ```


## License

[License Information]

## Acknowledgements

- Built with [Lens Protocol](https://lens.xyz/)
- Drawing functionality powered by [Konva.js](https://konvajs.org/)
