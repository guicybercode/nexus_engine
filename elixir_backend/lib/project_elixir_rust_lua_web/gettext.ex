defmodule ProjectElixirRustLuaWeb.Gettext do
  @moduledoc """
  A module providing Internationalization with a gettext-based API.

  By using [Gettext](https://hexdocs.pm/gettext),
  your module gains a set of macros for translations, for example:

      import ProjectElixirRustLuaWeb.Gettext

      gettext("Here is the string to translate")

  See the [Gettext Docs](https://hexdocs.pm/gettext) for details.
  """
  use Gettext, otp_app: :project_elixir_rust_lua
end
