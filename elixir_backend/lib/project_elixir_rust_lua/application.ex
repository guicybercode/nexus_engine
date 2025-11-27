defmodule ProjectElixirRustLua.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      ProjectElixirRustLuaWeb.Telemetry,
      {Phoenix.PubSub, name: ProjectElixirRustLua.PubSub},
      ProjectElixirRustLuaWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: ProjectElixirRustLua.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config(config, _key) do
    config
  end
end
