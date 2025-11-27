defmodule ProjectElixirRustLua.RustNif do
  use Rustler, otp_app: :project_elixir_rust_lua, crate: :rust_engine

  def process_player_action(_action_json), do: :erlang.nif_error(:nif_not_loaded)
  def init_lua_engine(), do: :erlang.nif_error(:nif_not_loaded)
end
