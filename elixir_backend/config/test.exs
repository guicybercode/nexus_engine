import Config

config :project_elixir_rust_lua, ProjectElixirRustLuaWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  server: false

config :logger, level: :warning

config :phoenix, :plug_init_mode, :runtime
