defmodule ProjectElixirRustLuaWeb do
  def controller do
    quote do
      use Phoenix.Controller, namespace: ProjectElixirRustLuaWeb
      import Plug.Conn
      import ProjectElixirRustLuaWeb.Gettext
      alias ProjectElixirRustLuaWeb.Router.Helpers, as: Routes
    end
  end

  def router do
    quote do
      use Phoenix.Router
      import Plug.Conn
      import Phoenix.Controller
    end
  end

  def channel do
    quote do
      use Phoenix.Channel
      import ProjectElixirRustLuaWeb.Gettext
    end
  end

  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
