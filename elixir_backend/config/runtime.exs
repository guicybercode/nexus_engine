import Config

if config_env() == :prod do
  port = String.to_integer(System.get_env("PORT") || "4000")

  config :project_elixir_rust_lua, ProjectElixirRustLuaWeb.Endpoint,
    http: [ip: {0, 0, 0, 0}, port: port],
    check_origin: false
end
