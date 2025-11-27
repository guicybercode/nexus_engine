import Config

config :project_elixir_rust_lua,
  generators: [timestamp_type: :utc_datetime]

config :project_elixir_rust_lua, ProjectElixirRustLuaWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Phoenix.Endpoint.Cowboy2Adapter,
  render_errors: [
    formats: [html: ProjectElixirRustLuaWeb.ErrorHTML, json: ProjectElixirRustLuaWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: ProjectElixirRustLua.PubSub,
  live_view: [signing_salt: "your_secret_here"]

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason
