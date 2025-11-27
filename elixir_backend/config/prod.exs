import Config

config :project_elixir_rust_lua, ProjectElixirRustLuaWeb.Endpoint,
  http: [
    ip: {0, 0, 0, 0, 0, 0, 0, 0},
    port: String.to_integer(System.get_env("PORT") || "4000")
  ],
  secret_key_base: System.get_env("SECRET_KEY_BASE") || "your_secret_key_base_here",
  server: true

config :logger, level: :info
