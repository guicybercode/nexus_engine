import Config

config :project_elixir_rust_lua, ProjectElixirRustLuaWeb.Endpoint,
  http: [
    ip: {127, 0, 0, 1},
    port: 4000
  ],
  server: true,
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "WxU7f5P8mG2qK9vR3nT6yH1jD4wA0cE8iL5oS2uX7rN9bF6kJ3mQ0pZ4tY8hV1gC",
  watchers: []

config :logger, :console, format: "[$level] $message\n"

config :phoenix, :stacktrace_depth, 20

config :phoenix, :plug_init_mode, :runtime
