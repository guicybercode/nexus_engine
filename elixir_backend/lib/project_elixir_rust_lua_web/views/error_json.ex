defmodule ProjectElixirRustLuaWeb.ErrorJSON do
  def error(%{status: status}) do
    %{errors: %{detail: Phoenix.Controller.status_message_from_template(status)}}
  end
end
