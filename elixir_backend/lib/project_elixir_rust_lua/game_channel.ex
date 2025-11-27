defmodule ProjectElixirRustLua.GameChannel do
  use Phoenix.Channel

  def join("game:lobby", _payload, socket) do
    ProjectElixirRustLua.RustNif.init_lua_engine()
    {:ok, socket}
  end

  def handle_in("player_action", %{"action" => action, "player_id" => player_id} = payload, socket) do
    action_json = Jason.encode!(%{
      action: action,
      direction: Map.get(payload, "direction"),
      player_id: player_id,
      force: Map.get(payload, "force")
    })

    result_json = ProjectElixirRustLua.RustNif.process_player_action(action_json)

    case Jason.decode(result_json) do
      {:ok, result} ->
        broadcast(socket, "action_result", result)
        {:noreply, socket}
      {:error, _} ->
        {:reply, {:error, %{reason: "invalid_response"}}, socket}
    end
  end

  def handle_in("player_action", _payload, socket) do
    {:reply, {:error, %{reason: "invalid_payload"}}, socket}
  end
end
