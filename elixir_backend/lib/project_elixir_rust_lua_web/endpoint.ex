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
