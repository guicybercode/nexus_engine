defmodule ProjectElixirRustLuaWeb.Router do
  use ProjectElixirRustLuaWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :put_root_layout, html: {ProjectElixirRustLuaWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", ProjectElixirRustLuaWeb do
    pipe_through :browser

    get "/", PageController, :home
  end

  scope "/api", ProjectElixirRustLuaWeb do
    pipe_through :api
  end
end
