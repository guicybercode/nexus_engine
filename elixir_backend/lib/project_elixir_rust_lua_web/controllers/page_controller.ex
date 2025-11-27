defmodule ProjectElixirRustLuaWeb.PageController do
  use ProjectElixirRustLuaWeb, :controller

  def home(conn, _params) do
    render(conn, :home, layout: false)
  end
end
