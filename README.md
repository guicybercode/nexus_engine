# Rust-Elixir-Lua Game Engine

A real-time game engine demo showcasing integration between Rust, Elixir, and Lua.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Elixir/Phoenix │────▶│   Rust NIF      │
│   (WebSocket)   │◀────│  (Backend)      │◀────│   (Engine)      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   Lua Scripts   │
                                                │   (Game Logic)  │
                                                └─────────────────┘
```

- **Elixir/Phoenix**: WebSocket server handling real-time connections
- **Rust NIF**: High-performance physics engine compiled as Native Implemented Function
- **Lua**: Scripted game rules and movement logic

## Requirements

- Elixir >= 1.14
- Rust >= 1.70
- Erlang/OTP >= 25

## Setup

```bash

cd project_elixir_rust_lua

# Build Rust engine
cd rust_engine
cargo build --release
cd ..

# Install Elixir dependencies
cd elixir_backend
mix deps.get

# Start the server
mix phx.server
```

## Usage

1. Open `http://localhost:4000` in your browser
2. Click **Connect** to establish WebSocket connection
3. Use the direction pad to move the player
4. Watch the console output for position and velocity updates

## Project Structure

```
project_elixir_rust_lua/
├── elixir_backend/          # Phoenix application
│   ├── lib/
│   │   ├── project_elixir_rust_lua/
│   │   │   ├── application.ex
│   │   │   ├── game_channel.ex    # WebSocket channel
│   │   │   └── rust_nif.ex        # Rust NIF bindings
│   │   └── project_elixir_rust_lua_web/
│   │       ├── endpoint.ex
│   │       ├── router.ex
│   │       └── user_socket.ex
│   └── priv/
│       └── static/js/socket.js    # WebSocket client
│
├── rust_engine/             # Rust NIF crate
│   ├── src/
│   │   ├── lib.rs           # NIF exports
│   │   ├── physics.rs       # Physics engine
│   │   └── lua_engine.rs    # Lua integration
│   └── Cargo.toml
│
└── lua_scripts/             # Lua game scripts
    └── movement_rules.lua
```

## How It Works

1. **Client** sends player action via WebSocket
2. **Phoenix Channel** receives the action and calls Rust NIF
3. **Rust Engine** processes physics and executes Lua scripts
4. **Lua Scripts** define movement rules and modifiers
5. **Result** is broadcast back to all connected clients

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Vanilla JS | WebSocket client |
| Backend | Phoenix 1.7 | Real-time server |
| Engine | Rust + Rustler | High-performance NIF |
| Scripts | Lua + mlua | Game logic |

## License

MIT

---

<p align="center">
  <em>내가 모든 것을 할 수 있으니 이는 나를 강하게 하시는 자 안에서니라</em><br>
  <sub>我能行萬事 賴於賜我力量者</sub><br>
  <sub>— 빌립보서 (腓立比書) 4:13</sub>
</p>

