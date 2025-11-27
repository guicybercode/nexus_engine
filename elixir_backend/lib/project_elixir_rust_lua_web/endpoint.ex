defmodule ProjectElixirRustLuaWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :project_elixir_rust_lua

  @session_options [
    store: :cookie,
    key: "_project_elixir_rust_lua_key",
    signing_salt: "project_elixir_rust_lua"
  ]

  socket "/socket", ProjectElixirRustLuaWeb.UserSocket,
    websocket: true,
    longpoll: false

  socket "/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]]

  # Serve arquivos estáticos de priv/static
  plug Plug.Static,
    at: "/",
    from: :project_elixir_rust_lua,
    gzip: false,
    only: ~w(assets fonts images js css favicon.ico robots.txt)

  # Code reloading em desenvolvimento
  if code_reloading? do
    socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
    plug Phoenix.LiveReloader
    plug Phoenix.CodeReloader
  end

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options
  plug ProjectElixirRustLuaWeb.Router
end
