# Rust-Elixir-Lua Integration Project

A high-performance, scalable architecture demonstrating integration between Rust (simulation engine), Elixir (real-time backend), and Lua (embedded scripting).

## Architecture Overview

This project showcases a three-tier architecture:

- **Rust Engine**: High-performance physics simulation and game logic processing
- **Elixir Backend**: Scalable Phoenix Channels backend managing thousands of concurrent connections
- **Lua Scripts**: Embedded scripting for dynamic rule customization without recompilation

## Project Structure

```
project_elixir_rust_lua/
├── rust_engine/          # Rust simulation engine with Lua embedding
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs       # NIF exports and main engine
│   │   ├── physics.rs   # Physics simulation
│   │   └── lua_engine.rs # Lua embedding and script execution
│   └── lua_scripts/     # Lua scripts directory
├── elixir_backend/       # Phoenix application
│   ├── mix.exs
│   ├── lib/
│   │   ├── project_elixir_rust_lua/
│   │   │   ├── application.ex
│   │   │   ├── game_channel.ex  # Phoenix Channel handler
│   │   │   └── rust_nif.ex      # NIF wrapper module
│   │   └── project_elixir_rust_lua_web/
│   │       ├── endpoint.ex
│   │       └── router.ex
│   └── priv/
│       └── static/       # WebSocket client example
├── lua_scripts/          # Shared Lua scripts
│   └── movement_rules.lua
└── README.md
```

## Communication Flow

```
Client → WebSocket → Phoenix Channel → Elixir NIF Call → Rust Engine
                                                              ↓
                                                         Lua Script
                                                              ↓
Client ← WebSocket ← Phoenix Broadcast ← Elixir ← Rust Result
```

## Prerequisites

- Rust (latest stable)
- Elixir 1.14+
- Erlang/OTP 24+
- Mix (comes with Elixir)
- Cargo (comes with Rust)

## Build Instructions

### 1. Build Rust Engine

```bash
cd rust_engine
cargo build --release
```

The compiled NIF library will be generated in `target/release/`.

### 2. Setup Elixir Backend

```bash
cd elixir_backend
mix deps.get
mix compile
```

This will:
- Download all Elixir dependencies
- Compile the Rust NIF using Rustler
- Build the Phoenix application

### 3. Run the Application

```bash
cd elixir_backend
mix phx.server
```

The server will start on `http://localhost:4000`.

## Usage

### Web Interface

1. Open `http://localhost:4000` in your browser
2. Click "Connect" to establish WebSocket connection
3. Use the movement buttons to send player actions
4. View real-time results in the output area

### Example API Flow

1. **Client sends action**:
   ```json
   {
     "action": "move",
     "direction": "right",
     "player_id": "player_1"
   }
   ```

2. **Elixir receives** via Phoenix Channel and calls Rust NIF

3. **Rust processes**:
   - Physics engine calculates new position/velocity
   - Lua engine applies custom rules (speed modifiers, etc.)
   - Returns result as JSON

4. **Elixir broadcasts** result to all connected clients

## Technical Details

### Rust-Elixir Communication (NIFs)

The project uses Native Implemented Functions (NIFs) via Rustler for direct FFI between Elixir and Rust. This provides:

- **Low latency**: Direct function calls without network overhead
- **High performance**: Rust's zero-cost abstractions
- **Type safety**: Compile-time guarantees

Key NIF functions:
- `process_player_action(action_json: String) -> String`: Main processing entry point
- `init_lua_engine() -> bool`: Initialize Lua VM with scripts

### Lua Embedding

Lua is embedded using the `mlua` crate, allowing:

- **Dynamic rule modification**: Change game rules without recompiling Rust
- **Custom NPC AI**: Script complex behaviors in Lua
- **Mod support**: Users can create mods by writing Lua scripts

The Lua engine:
- Loads scripts from `lua_scripts/` directory
- Exposes Rust functions to Lua
- Applies custom rules to player actions

### Elixir Backend

Phoenix Channels provide:

- **Scalability**: Handles thousands of concurrent WebSocket connections
- **Real-time distribution**: Broadcasts game state to all clients
- **Fault tolerance**: Built on Erlang's OTP supervision trees

## Expanding the System

### Multiplayer Game

1. **Add player state management**:
   - Store player positions in ETS or database
   - Implement player authentication
   - Add room/channel management

2. **Enhance physics**:
   - Add collision detection
   - Implement gravity and friction
   - Add support for multiple entities

3. **Lua scripting**:
   - Create NPC AI scripts
   - Add custom game modes
   - Implement power-ups and abilities

### Distributed IoT Platform

1. **Device management**:
   - Register IoT devices via Phoenix Channels
   - Route device commands through Rust engine
   - Use Lua for device-specific logic

2. **State coordination**:
   - Use Phoenix PubSub for distributed state
   - Implement consensus algorithms
   - Add device synchronization

3. **Performance optimization**:
   - Batch process device updates
   - Implement priority queues
   - Add caching layers

### Advanced Features

1. **Persistence**:
   - Add PostgreSQL via Ecto
   - Store game state and player data
   - Implement save/load functionality

2. **Monitoring**:
   - Add Telemetry metrics
   - Monitor NIF performance
   - Track Lua script execution time

3. **Testing**:
   - Unit tests for Rust modules
   - Integration tests for Elixir channels
   - End-to-end tests for full flow

## Performance Considerations

- **NIF Safety**: NIFs run in the BEAM scheduler, so keep execution time under 1ms for non-blocking operations
- **Lua Performance**: Lua scripts are fast but consider caching frequently used functions
- **Channel Scalability**: Phoenix Channels can handle 2M+ concurrent connections on a single node
- **Rust Optimization**: Use `--release` builds for production (already configured)

## Troubleshooting

### Rust NIF not loading

- Ensure `rust_engine` is built with `cargo build --release`
- Check that Rustler is properly configured in `mix.exs`
- Verify the NIF library path is correct

### Lua scripts not executing

- Check that `lua_scripts/movement_rules.lua` exists
- Verify file permissions
- Check Rust logs for Lua errors

### WebSocket connection fails

- Ensure Phoenix server is running
- Check firewall settings
- Verify WebSocket endpoint in router

## License

This project is provided as-is for educational and demonstration purposes.

## Contributing

This is a demonstration project. For production use, consider:

- Adding comprehensive error handling
- Implementing proper authentication
- Adding monitoring and logging
- Writing extensive tests
- Security hardening

---

**한자 (漢字) 포함:**

하나님이 世界를 이처럼 愛하사 獨生子를 주셨으니 이는 그를 信하는 者마다 滅亡하지 않고 永生을 얻게 하려 하심이라

